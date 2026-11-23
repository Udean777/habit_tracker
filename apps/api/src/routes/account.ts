import { Hono } from "hono";
import { requireAuth, type AuthVariables } from "../middleware/auth";
import {
  deleteUserAccount,
  exportAccountData,
} from "../services/accountService";

export const accountRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", requireAuth)
  .get("/export", async (c) => {
    const userId = c.get("userId");
    const data = await exportAccountData(userId);
    return c.json(data);
  })
  .delete("/", async (c) => {
    const userId = c.get("userId");
    await deleteUserAccount(userId);
    return c.json({ ok: true });
  });
