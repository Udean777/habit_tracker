export type HyperdriveBinding = {
  readonly connectionString: string;
};

export type AppBindings = {
  readonly HYPERDRIVE?: HyperdriveBinding;
  readonly DATABASE_URL?: string;
  readonly JWT_SECRET?: string;
  readonly NODE_ENV?: string;
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
