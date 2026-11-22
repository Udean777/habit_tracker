import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { and, eq, isNull } from "drizzle-orm";
import {
  loginInputSchema,
  refreshInputSchema,
  registerInputSchema,
} from "@habit/shared";
import { db } from "../db/client";
import { refreshTokens, users } from "../db/schema";
import { signAccessToken } from "../middleware/auth";
import { rateLimitAuth } from "../middleware/rateLimit";

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

export const authRoutes = new Hono()
  .use("*", rateLimitAuth)
  .post("/register", zValidator("json", registerInputSchema), async (c) => {
    const { email, password, deviceId } = c.req.valid("json");
    const normalizedEmail = email.toLowerCase();

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, normalizedEmail), isNull(users.deletedAt)));

    if (existing.length > 0) {
      return c.json(
        { error: { code: "CONFLICT", message: "Email already registered" } },
        409,
      );
    }

    const userId = crypto.randomUUID();
    const familyId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 86_400_000);
    const passwordHash = await Bun.password.hash(password, {
      algorithm: "argon2id",
    });

    const rawRefresh = generateOpaqueToken();
    const tokenHash = await sha256Hex(rawRefresh);

    await db.transaction(async (tx) => {
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

    const accessToken = await signAccessToken(userId);
    return c.json(
      {
        accessToken,
        refreshToken: rawRefresh,
        user: { id: userId, email: normalizedEmail },
      },
      201,
    );
  })
  .post("/login", zValidator("json", loginInputSchema), async (c) => {
    const { email, password, deviceId } = c.req.valid("json");
    const normalizedEmail = email.toLowerCase();

    const rows = await db
      .select()
      .from(users)
      .where(and(eq(users.email, normalizedEmail), isNull(users.deletedAt)));
    const user = rows[0];

    if (!user || !(await Bun.password.verify(password, user.passwordHash))) {
      return c.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          },
        },
        401,
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 86_400_000);
    const rawRefresh = generateOpaqueToken();
    const tokenHash = await sha256Hex(rawRefresh);

    await db.insert(refreshTokens).values({
      id: crypto.randomUUID(),
      userId: user.id,
      familyId: crypto.randomUUID(),
      tokenHash,
      deviceId,
      expiresAt,
      revokedAt: null,
      createdAt: now,
    });

    const accessToken = await signAccessToken(user.id);
    return c.json({
      accessToken,
      refreshToken: rawRefresh,
      user: { id: user.id, email: user.email },
    });
  })
  .post("/refresh", zValidator("json", refreshInputSchema), async (c) => {
    const { refreshToken, deviceId } = c.req.valid("json");
    const tokenHash = await sha256Hex(refreshToken);

    const rows = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash));
    const current = rows[0];

    if (!current) {
      return c.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid refresh token" } },
        401,
      );
    }

    const now = new Date();
    if (current.revokedAt !== null) {
      // Reuse of a rotated token revokes the entire family.
      await db
        .update(refreshTokens)
        .set({ revokedAt: now })
        .where(eq(refreshTokens.familyId, current.familyId));
      return c.json(
        { error: { code: "UNAUTHORIZED", message: "Refresh token reused" } },
        401,
      );
    }

    if (current.expiresAt <= now) {
      return c.json(
        { error: { code: "UNAUTHORIZED", message: "Refresh token expired" } },
        401,
      );
    }

    const nextRaw = generateOpaqueToken();
    const nextHash = await sha256Hex(nextRaw);
    const expiresAt = new Date(now.getTime() + 30 * 86_400_000);

    await db.transaction(async (tx) => {
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

    const userRows = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, current.userId));
    const user = userRows[0];
    if (!user) {
      return c.json(
        { error: { code: "UNAUTHORIZED", message: "User not found" } },
        401,
      );
    }

    const accessToken = await signAccessToken(user.id);
    return c.json({
      accessToken,
      refreshToken: nextRaw,
      user,
    });
  })
  .post("/logout", zValidator("json", refreshInputSchema), async (c) => {
    const { refreshToken } = c.req.valid("json");
    const tokenHash = await sha256Hex(refreshToken);
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash));
    return c.json({ ok: true });
  });
