import { Hono } from "hono";
import { requireAuth, type AppEnv } from "../middleware/auth";
import {
  deleteUserAccount,
  exportAccountData,
} from "../services/accountService";

export const accountRoutes = new Hono<AppEnv>()
  .use("*", requireAuth)
  .get("/export", async (c) => {
    const userId = c.get("userId");
    const data = await exportAccountData(userId, c.get("getDb")());
    return c.json(data);
  })
  .delete("/", async (c) => {
    const userId = c.get("userId");
    await deleteUserAccount(userId, c.get("getDb")());
    return c.json({ ok: true });
  });
