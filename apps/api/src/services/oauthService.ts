import { and, eq, isNull } from "drizzle-orm";
import { sign, verify } from "hono/jwt";
import type { OAuthProvider } from "@habit/shared";
import { db, type ApiDb } from "../db/client";
import { oauthAccounts, users } from "../db/schema";
import {
  resolveJwtSecret,
  resolveOAuthCredentials,
  type AppBindings,
} from "../env";
import { issueSessionForUser, type AuthSuccess } from "./authService";

const STATE_TTL_SEC = 10 * 60;
const TICKET_TTL_SEC = 60;
const DEFAULT_CLIENT_REDIRECT = "glimkin://auth/callback";

const ALLOWED_REDIRECT_PREFIXES = [
  "glimkin://",
  "exp://",
  "http://localhost:",
  "http://127.0.0.1:",
];

export function isAllowedClientRedirect(uri: string): boolean {
  return ALLOWED_REDIRECT_PREFIXES.some((prefix) => uri.startsWith(prefix));
}

function appendQueryParams(
  baseUrl: string,
  params: Record<string, string>,
): string {
  const separator = baseUrl.includes("?") ? "&" : "?";
  const search = new URLSearchParams(params).toString();
  return `${baseUrl}${separator}${search}`;
}

export async function buildOAuthAuthorizationUrl(input: {
  readonly provider: OAuthProvider;
  readonly apiOrigin: string;
  readonly deviceId: string;
  readonly clientRedirectUri?: string;
  readonly env?: AppBindings;
}): Promise<
  | { readonly ok: true; readonly url: string }
  | { readonly ok: false; readonly status: 400 | 501; readonly message: string }
> {
  const clientRedirectUri =
    input.clientRedirectUri && input.clientRedirectUri.length > 0
      ? input.clientRedirectUri
      : DEFAULT_CLIENT_REDIRECT;

  if (!isAllowedClientRedirect(clientRedirectUri)) {
    return {
      ok: false,
      status: 400,
      message: "Disallowed client redirect_uri",
    };
  }

  const creds = resolveOAuthCredentials(input.provider, input.env);
  if (!creds) {
    return {
      ok: false,
      status: 501,
      message: `${input.provider} OAuth is not configured on the server`,
    };
  }

  const jwtSecret = resolveJwtSecret(input.env);
  const nowSec = Math.floor(Date.now() / 1000);
  const state = await sign(
    {
      purpose: "oauth_state",
      provider: input.provider,
      deviceId: input.deviceId,
      clientRedirectUri,
      iat: nowSec,
      exp: nowSec + STATE_TTL_SEC,
    },
    jwtSecret,
  );

  const publicOrigin = (
    input.env?.PUBLIC_API_URL ??
    process.env.PUBLIC_API_URL ??
    input.apiOrigin
  ).replace(/\/+$/, "");
  const callbackUrl = `${publicOrigin}/auth/oauth/${input.provider}/callback`;

  if (input.provider === "google") {
    const params = new URLSearchParams({
      client_id: creds.clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account",
      state,
    });
    return {
      ok: true,
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  }

  const params = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: callbackUrl,
    scope: "read:user user:email",
    state,
  });
  return {
    ok: true,
    url: `https://github.com/login/oauth/authorize?${params.toString()}`,
  };
}

type VerifiedProviderProfile = {
  readonly providerAccountId: string;
  readonly email: string;
};

async function fetchGoogleProfile(
  code: string,
  callbackUrl: string,
  clientId: string,
  clientSecret: string,
): Promise<VerifiedProviderProfile> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!tokenRes.ok) {
    throw new Error("Failed to exchange Google authorization code");
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error("Missing Google access token");
  }

  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!userRes.ok) {
    throw new Error("Failed to fetch Google user profile");
  }

  const profile = (await userRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
  };
  if (!profile.sub || !profile.email || !profile.email_verified) {
    throw new Error("Google account does not have a verified email address");
  }

  return {
    providerAccountId: profile.sub,
    email: profile.email.toLowerCase(),
  };
}

async function fetchGithubProfile(
  code: string,
  callbackUrl: string,
  clientId: string,
  clientSecret: string,
): Promise<VerifiedProviderProfile> {
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "user-agent": "Glimkin-API",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error("Failed to exchange GitHub authorization code");
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error("Missing GitHub access token");
  }

  const authHeaders = {
    Authorization: `Bearer ${tokenData.access_token}`,
    accept: "application/vnd.github+json",
    "user-agent": "Glimkin-API",
  };

  const [userRes, emailsRes] = await Promise.all([
    fetch("https://api.github.com/user", { headers: authHeaders }),
    fetch("https://api.github.com/user/emails", { headers: authHeaders }),
  ]);

  if (!userRes.ok || !emailsRes.ok) {
    throw new Error("Failed to fetch GitHub user profile or emails");
  }

  const userProfile = (await userRes.json()) as { id?: number | string };
  const emailList = (await emailsRes.json()) as readonly {
    email?: string;
    primary?: boolean;
    verified?: boolean;
  }[];

  const primaryVerified =
    emailList.find((e) => e.primary && e.verified && e.email) ??
    emailList.find((e) => e.verified && e.email);

  if (!userProfile.id || !primaryVerified?.email) {
    throw new Error("GitHub account does not have a verified email address");
  }

  return {
    providerAccountId: String(userProfile.id),
    email: primaryVerified.email.toLowerCase(),
  };
}

export async function signOAuthTicket(input: {
  readonly provider: OAuthProvider;
  readonly providerAccountId: string;
  readonly email: string;
  readonly deviceId: string;
  readonly jwtSecret: string;
}): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  return sign(
    {
      purpose: "oauth_ticket",
      provider: input.provider,
      providerAccountId: input.providerAccountId,
      email: input.email,
      deviceId: input.deviceId,
      iat: nowSec,
      exp: nowSec + TICKET_TTL_SEC,
    },
    input.jwtSecret,
  );
}

export async function handleOAuthProviderCallback(input: {
  readonly provider: OAuthProvider;
  readonly code: string | undefined;
  readonly stateToken: string | undefined;
  readonly providerError?: string;
  readonly apiOrigin: string;
  readonly env?: AppBindings;
}): Promise<{ readonly redirectUrl: string }> {
  const jwtSecret = resolveJwtSecret(input.env);
  let clientRedirectUri = DEFAULT_CLIENT_REDIRECT;
  let deviceId = "mobile-device";

  if (!input.stateToken) {
    return {
      redirectUrl: appendQueryParams(clientRedirectUri, {
        error: "Missing OAuth state parameter",
      }),
    };
  }

  try {
    const statePayload = await verify(input.stateToken, jwtSecret, "HS256");
    if (
      statePayload.purpose !== "oauth_state" ||
      statePayload.provider !== input.provider
    ) {
      throw new Error("Invalid OAuth state");
    }
    if (
      typeof statePayload.clientRedirectUri === "string" &&
      isAllowedClientRedirect(statePayload.clientRedirectUri)
    ) {
      clientRedirectUri = statePayload.clientRedirectUri;
    }
    if (typeof statePayload.deviceId === "string" && statePayload.deviceId) {
      deviceId = statePayload.deviceId;
    }
  } catch {
    return {
      redirectUrl: appendQueryParams(clientRedirectUri, {
        error: "Expired or invalid OAuth session. Please try again.",
      }),
    };
  }

  if (input.providerError || !input.code) {
    return {
      redirectUrl: appendQueryParams(clientRedirectUri, {
        error: input.providerError ?? "Authorization was cancelled",
      }),
    };
  }

  const creds = resolveOAuthCredentials(input.provider, input.env);
  if (!creds) {
    return {
      redirectUrl: appendQueryParams(clientRedirectUri, {
        error: `${input.provider} OAuth is not configured`,
      }),
    };
  }

  const publicOrigin = (
    input.env?.PUBLIC_API_URL ??
    process.env.PUBLIC_API_URL ??
    input.apiOrigin
  ).replace(/\/+$/, "");
  const callbackUrl = `${publicOrigin}/auth/oauth/${input.provider}/callback`;

  try {
    const profile =
      input.provider === "google"
        ? await fetchGoogleProfile(
            input.code,
            callbackUrl,
            creds.clientId,
            creds.clientSecret,
          )
        : await fetchGithubProfile(
            input.code,
            callbackUrl,
            creds.clientId,
            creds.clientSecret,
          );

    const ticket = await signOAuthTicket({
      provider: input.provider,
      providerAccountId: profile.providerAccountId,
      email: profile.email,
      deviceId,
      jwtSecret,
    });

    return {
      redirectUrl: appendQueryParams(clientRedirectUri, { ticket }),
    };
  } catch (err) {
    return {
      redirectUrl: appendQueryParams(clientRedirectUri, {
        error:
          err instanceof Error ? err.message : "OAuth sign-in failed",
      }),
    };
  }
}

export async function exchangeOAuthTicket(input: {
  readonly ticket: string;
  readonly deviceId: string;
  readonly database?: ApiDb;
  readonly jwtSecret?: string;
}): Promise<
  | { readonly ok: true; readonly data: AuthSuccess }
  | {
      readonly ok: false;
      readonly status: 401;
      readonly code: "UNAUTHORIZED";
      readonly message: string;
    }
> {
  const database = input.database ?? db;
  const jwtSecret = input.jwtSecret ?? resolveJwtSecret();

  let provider: OAuthProvider;
  let providerAccountId: string;
  let email: string;

  try {
    const payload = await verify(input.ticket, jwtSecret, "HS256");
    if (
      payload.purpose !== "oauth_ticket" ||
      (payload.provider !== "google" && payload.provider !== "github") ||
      typeof payload.providerAccountId !== "string" ||
      typeof payload.email !== "string" ||
      payload.deviceId !== input.deviceId
    ) {
      return {
        ok: false,
        status: 401,
        code: "UNAUTHORIZED",
        message: "Invalid OAuth ticket",
      };
    }
    provider = payload.provider;
    providerAccountId = payload.providerAccountId;
    email = payload.email.toLowerCase();
  } catch {
    return {
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "Expired or invalid OAuth ticket",
    };
  }

  const now = new Date();
  let userId = "";

  await database.transaction(async (tx) => {
    const existingOAuth = await tx
      .select({ userId: oauthAccounts.userId })
      .from(oauthAccounts)
      .where(
        and(
          eq(oauthAccounts.provider, provider),
          eq(oauthAccounts.providerAccountId, providerAccountId),
        ),
      );

    if (existingOAuth[0]) {
      userId = existingOAuth[0].userId;
      return;
    }

    const existingUser = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)));

    if (existingUser[0]) {
      userId = existingUser[0].id;
    } else {
      userId = crypto.randomUUID();
      await tx.insert(users).values({
        id: userId,
        email,
        passwordHash: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    }

    await tx.insert(oauthAccounts).values({
      id: crypto.randomUUID(),
      userId,
      provider,
      providerAccountId,
      email,
      createdAt: now,
    });
  });

  const data = await issueSessionForUser(
    userId,
    email,
    input.deviceId,
    database,
    jwtSecret,
  );
  return { ok: true, data };
}
