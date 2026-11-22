import { createMiddleware } from "hono/factory";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const buckets = new Map<string, { count: number; resetAt: number }>();

export const rateLimitAuth = createMiddleware(async (c, next) => {
  const ip = c.req.header("x-forwarded-for") ?? "local";
  const now = Date.now();
  const entry = buckets.get(ip);

  if (!entry || entry.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    await next();
    return;
  }

  if (entry.count >= MAX_REQUESTS) {
    return c.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many auth requests, please try again shortly",
        },
      },
      429,
    );
  }

  entry.count += 1;
  await next();
});
