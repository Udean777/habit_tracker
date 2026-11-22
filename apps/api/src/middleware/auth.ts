import { createMiddleware } from "hono/factory";
import { sign, verify } from "hono/jwt";

const JWT_SECRET =
  process.env.JWT_SECRET ?? "dev-only-habit-tracker-secret-change-me";

export type AuthVariables = {
  userId: string;
};

export async function signAccessToken(userId: string): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  return sign(
    {
      sub: userId,
      jti: crypto.randomUUID(),
      iat: nowSec,
      exp: nowSec + 15 * 60,
    },
    JWT_SECRET,
  );
}

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const header = c.req.header("Authorization");
    if (!header?.startsWith("Bearer ")) {
      return c.json(
        { error: { code: "UNAUTHORIZED", message: "Missing bearer token" } },
        401,
      );
    }

    const token = header.slice("Bearer ".length).trim();
    try {
      const payload = await verify(token, JWT_SECRET, "HS256");
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
  },
);
