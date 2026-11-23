import { createMiddleware } from "hono/factory";
import { sign, verify } from "hono/jwt";
import { resolveJwtSecret, type AppBindings } from "../env";
import type { ApiDb } from "../db/client";

const ACCESS_TOKEN_TTL_SEC = 60 * 60;

export type AppVariables = {
  getDb: () => ApiDb;
  userId: string;
};

export type AuthVariables = AppVariables;

export type AppEnv = {
  Bindings: AppBindings;
  Variables: AppVariables;
};

export async function signAccessToken(
  userId: string,
  jwtSecret: string = resolveJwtSecret(),
): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  return sign(
    {
      sub: userId,
      jti: crypto.randomUUID(),
      iat: nowSec,
      exp: nowSec + ACCESS_TOKEN_TTL_SEC,
    },
    jwtSecret,
  );
}

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Missing bearer token" } },
      401,
    );
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const secret = resolveJwtSecret(c.env);
    const payload = await verify(token, secret, "HS256");
    const sub = payload.sub;
    if (typeof sub !== "string" || sub.length === 0) {
      return c.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid token subject" } },
        401,
      );
    }
    c.set("userId", sub);
    await next();
  } catch {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } },
      401,
    );
  }
});
