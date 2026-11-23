import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  syncBatchRequestSchema,
  syncPushRequestSchema,
} from "@habit/shared";
import { requireAuth, type AppEnv } from "../middleware/auth";
import { processSyncPush, pullUserChanges } from "../services/syncService";

export const syncRoutes = new Hono<AppEnv>()
  .use("*", requireAuth)
  .post("/push", zValidator("json", syncPushRequestSchema), async (c) => {
    const userId = c.get("userId");
    const { deviceId, ops } = c.req.valid("json");
    const result = await processSyncPush(userId, deviceId, ops, c.get("getDb")());
    return c.json(result);
  })
  .get("/pull", async (c) => {
    const userId = c.get("userId");
    const cursor = Math.max(0, Number(c.req.query("cursor") ?? 0));
    const limit = Math.min(500, Math.max(1, Number(c.req.query("limit") ?? 500)));
    const result = await pullUserChanges(userId, cursor, limit, c.get("getDb")());
    return c.json(result);
  })
  .post("/batch", zValidator("json", syncBatchRequestSchema), async (c) => {
    const userId = c.get("userId");
    const { deviceId, ops, cursor, limit } = c.req.valid("json");
    const db = c.get("getDb")();
    const pushResult =
      ops.length > 0
        ? await processSyncPush(userId, deviceId, ops, db)
        : { acked: [], rejected: [], serverTime: new Date().toISOString() };
    const pullResult = await pullUserChanges(userId, cursor, limit, db);
    return c.json({
      ...pushResult,
      ...pullResult,
    });
  });
