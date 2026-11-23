import { and, eq, isNull } from "drizzle-orm";
import { db, type ApiDb } from "../db/client";
import { refreshTokens, users } from "../db/schema";
import { resolveJwtSecret } from "../env";
import { hashPassword, verifyPassword } from "../lib/password";
import { signAccessToken } from "../middleware/auth";

const REFRESH_TTL_MS = 30 * 86_400_000;

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

function generateOpaqueToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export type AuthSuccess = {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: { readonly id: string; readonly email: string };
};

export async function registerUser(
  email: string,
  password: string,
  deviceId: string,
  database: ApiDb = db,
  jwtSecret: string = resolveJwtSecret(),
): Promise<
  | { readonly ok: true; readonly data: AuthSuccess }
  | { readonly ok: false; readonly status: 409; readonly code: "CONFLICT"; readonly message: string }
> {
  const normalizedEmail = email.toLowerCase();
  const existing = await database
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, normalizedEmail), isNull(users.deletedAt)));

  if (existing.length > 0) {
    return {
      ok: false,
      status: 409,
      code: "CONFLICT",
      message: "Email already registered",
    };
  }

  const userId = crypto.randomUUID();
  const familyId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + REFRESH_TTL_MS);
  const passwordHash = await hashPassword(password);

  const rawRefresh = generateOpaqueToken();
  const tokenHash = await sha256Hex(rawRefresh);

  await database.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      email: normalizedEmail,
      passwordHash,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    await tx.insert(refreshTokens).values({
      id: crypto.randomUUID(),
      userId,
      familyId,
      tokenHash,
      deviceId,
      expiresAt,
      revokedAt: null,
      createdAt: now,
    });
  });

  const accessToken = await signAccessToken(userId, jwtSecret);
  return {
    ok: true,
    data: {
      accessToken,
      refreshToken: rawRefresh,
      user: { id: userId, email: normalizedEmail },
    },
  };
}

export async function loginUser(
  email: string,
  password: string,
  deviceId: string,
  database: ApiDb = db,
  jwtSecret: string = resolveJwtSecret(),
): Promise<
  | { readonly ok: true; readonly data: AuthSuccess }
  | { readonly ok: false; readonly status: 401; readonly code: "UNAUTHORIZED"; readonly message: string }
> {
  const normalizedEmail = email.toLowerCase();
  const rows = await database
    .select()
    .from(users)
    .where(and(eq(users.email, normalizedEmail), isNull(users.deletedAt)));
  const user = rows[0];

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return {
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "Invalid email or password",
    };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + REFRESH_TTL_MS);
  const rawRefresh = generateOpaqueToken();
  const tokenHash = await sha256Hex(rawRefresh);

  await database.insert(refreshTokens).values({
    id: crypto.randomUUID(),
    userId: user.id,
    familyId: crypto.randomUUID(),
    tokenHash,
    deviceId,
    expiresAt,
    revokedAt: null,
    createdAt: now,
  });

  const accessToken = await signAccessToken(user.id, jwtSecret);
  return {
    ok: true,
    data: {
      accessToken,
      refreshToken: rawRefresh,
      user: { id: user.id, email: user.email },
    },
  };
}

export async function rotateRefreshToken(
  refreshToken: string,
  deviceId: string,
  database: ApiDb = db,
  jwtSecret: string = resolveJwtSecret(),
): Promise<
  | { readonly ok: true; readonly data: AuthSuccess }
  | { readonly ok: false; readonly status: 401; readonly code: "UNAUTHORIZED"; readonly message: string }
> {
  const tokenHash = await sha256Hex(refreshToken);
  const rows = await database
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash));
  const current = rows[0];

  if (!current) {
    return {
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "Invalid refresh token",
    };
  }

  const now = new Date();
  if (current.revokedAt !== null) {
    // Reuse of a rotated token revokes the entire family.
    await database
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(eq(refreshTokens.familyId, current.familyId));
    return {
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "Refresh token reused",
    };
  }

  if (current.expiresAt <= now) {
    return {
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "Refresh token expired",
    };
  }

  const nextRaw = generateOpaqueToken();
  const nextHash = await sha256Hex(nextRaw);
  const expiresAt = new Date(now.getTime() + REFRESH_TTL_MS);

  await database.transaction(async (tx) => {
    await tx
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(eq(refreshTokens.id, current.id));

    await tx.insert(refreshTokens).values({
      id: crypto.randomUUID(),
      userId: current.userId,
      familyId: current.familyId,
      tokenHash: nextHash,
      deviceId,
      expiresAt,
      revokedAt: null,
      createdAt: now,
    });
  });

  const userRows = await database
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, current.userId));
  const user = userRows[0];
  if (!user) {
    return {
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "User not found",
    };
  }

  const accessToken = await signAccessToken(user.id, jwtSecret);
  return {
    ok: true,
    data: {
      accessToken,
      refreshToken: nextRaw,
      user,
    },
  };
}

export async function revokeRefreshToken(
  refreshToken: string,
  database: ApiDb = db,
): Promise<void> {
  const tokenHash = await sha256Hex(refreshToken);
  await database
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}
