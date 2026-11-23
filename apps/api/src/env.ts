import type { OAuthProvider } from "@habit/shared";

export type HyperdriveBinding = {
  readonly connectionString: string;
};

export type AppBindings = {
  readonly HYPERDRIVE?: HyperdriveBinding;
  readonly DATABASE_URL?: string;
  readonly JWT_SECRET?: string;
  readonly NODE_ENV?: string;
  readonly PUBLIC_API_URL?: string;
  readonly GOOGLE_CLIENT_ID?: string;
  readonly GOOGLE_CLIENT_SECRET?: string;
  readonly GITHUB_CLIENT_ID?: string;
  readonly GITHUB_CLIENT_SECRET?: string;
};

export type OAuthClientCredentials = {
  readonly clientId: string;
  readonly clientSecret: string;
};

const DEV_DATABASE_URL =
  "postgres://postgres:@localhost:5432/habit_tracker";
const DEV_JWT_SECRET = "dev-only-habit-tracker-secret-change-me";

export function resolveDatabaseUrl(env?: AppBindings): string {
  return (
    env?.HYPERDRIVE?.connectionString ??
    env?.DATABASE_URL ??
    process.env.DATABASE_URL ??
    DEV_DATABASE_URL
  );
}

export function resolveJwtSecret(env?: AppBindings): string {
  const secret = env?.JWT_SECRET ?? process.env.JWT_SECRET;
  if (secret && secret.length > 0) return secret;

  const isProd =
    env?.NODE_ENV === "production" || process.env.NODE_ENV === "production";
  if (isProd) {
    throw new Error("JWT_SECRET must be configured in production");
  }
  return DEV_JWT_SECRET;
}

export function resolveOAuthCredentials(
  provider: OAuthProvider,
  env?: AppBindings,
): OAuthClientCredentials | null {
  if (provider === "google") {
    const clientId = env?.GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
    const clientSecret =
      env?.GOOGLE_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return { clientId, clientSecret };
  }

  const clientId = env?.GITHUB_CLIENT_ID ?? process.env.GITHUB_CLIENT_ID;
  const clientSecret =
    env?.GITHUB_CLIENT_SECRET ?? process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}
