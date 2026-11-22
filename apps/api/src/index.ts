import { Hono } from "hono";
import { accountRoutes } from "./routes/account";
import { authRoutes } from "./routes/auth";
import { syncRoutes } from "./routes/sync";

const app = new Hono()
  .get("/health", (c) => c.json({ ok: true }))
  .route("/auth", authRoutes)
  .route("/sync", syncRoutes)
  .route("/account", accountRoutes);

export type AppType = typeof app;
export default app;
