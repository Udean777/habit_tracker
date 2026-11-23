import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { syncPushRequestSchema } from "@habit/shared";
import { requireAuth, type AuthVariables } from "../middleware/auth";
import { processSyncPush, pullUserChanges } from "../services/syncService";

export const syncRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", requireAuth)
  .post("/push", zValidator("json", syncPushRequestSchema), async (c) => {
    const userId = c.get("userId");
    const { deviceId, ops } = c.req.valid("json");
    const result = await processSyncPush(userId, deviceId, ops);
    return c.json(result);
  })
  .get("/pull", async (c) => {
    const userId = c.get("userId");
    const cursor = Math.max(0, Number(c.req.query("cursor") ?? 0));
    const limit = Math.min(500, Math.max(1, Number(c.req.query("limit") ?? 500)));
    const result = await pullUserChanges(userId, cursor, limit);
    return c.json(result);
  });
