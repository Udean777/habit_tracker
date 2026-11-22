import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import {
  habitLogs,
  habits,
  streakFreezes,
  userSettings,
  users,
} from "../db/schema";
import { requireAuth, type AuthVariables } from "../middleware/auth";

export const accountRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", requireAuth)
  .get("/export", async (c) => {
    const userId = c.get("userId");
    const [habitRows, logRows, freezeRows, settingRows] = await Promise.all([
      db.select().from(habits).where(eq(habits.userId, userId)),
      db.select().from(habitLogs).where(eq(habitLogs.userId, userId)),
      db.select().from(streakFreezes).where(eq(streakFreezes.userId, userId)),
      db.select().from(userSettings).where(eq(userSettings.userId, userId)),
    ]);

    return c.json({
      exportedAt: new Date().toISOString(),
      habits: habitRows,
      habitLogs: logRows,
      streakFreezes: freezeRows,
      settings: settingRows,
    });
  })
  .delete("/", async (c) => {
    const userId = c.get("userId");
    await db.delete(users).where(eq(users.id, userId));
    return c.json({ ok: true });
  });
