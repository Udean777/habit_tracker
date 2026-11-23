import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { sql } from "drizzle-orm";
import { createDb } from "./db/client";
import { resolveDatabaseUrl } from "./env";
import type { AppEnv } from "./middleware/auth";
import { accountRoutes } from "./routes/account";
import { authRoutes } from "./routes/auth";
import { syncRoutes } from "./routes/sync";

const CORS_PREFLIGHT_MAX_AGE_SEC = 86_400;

const app = new Hono<AppEnv>()
  .use("*", cors({ origin: "*", maxAge: CORS_PREFLIGHT_MAX_AGE_SEC }))
  .use("*", secureHeaders())
  .use("*", async (c, next) => {
    // Lazily create a request-scoped DB client only when a handler needs DB access.
    // This avoids opening Hyperdrive/Postgres connections on /health, OPTIONS, 401, and 404.
    let dbHolder: { current: ReturnType<typeof createDb> | null } = {
      current: null,
    };
    c.set("getDb", () => {
      if (!dbHolder.current) {
        dbHolder.current = createDb(resolveDatabaseUrl(c.env));
      }
      return dbHolder.current.db;
    });
    try {
      await next();
    } finally {
      if (dbHolder.current) {
        const endPromise = dbHolder.current.client
          .end({ timeout: 2 })
          .catch(() => {});
        try {
          c.executionCtx.waitUntil(endPromise);
        } catch {
          // Not running in Workers (e.g. Bun dev / tests)
          await endPromise;
        }
      }
    }
  })
  .get("/health", async (c) => {
    if (c.req.query("db") === "1") {
      try {
        await c.get("getDb")().execute(sql`SELECT 1`);
        return c.json({ ok: true, db: "connected" });
      } catch {
        return c.json(
          {
            ok: false,
            error: { code: "INTERNAL_ERROR", message: "Database unavailable" },
          },
          503,
        );
      }
    }
    c.header("Cache-Control", "public, max-age=30");
    return c.json({ ok: true });
  })
  .route("/auth", authRoutes)
  .route("/sync", syncRoutes)
  .route("/account", accountRoutes);

app.notFound((c) =>
  c.json(
    { error: { code: "VALIDATION_ERROR", message: "Route not found" } },
    404,
  ),
);

app.onError((err, c) => {
  console.error("Unhandled API error:", err.message);
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected server error occurred",
      },
    },
    500,
  );
});

export type AppType = typeof app;
export default app;
