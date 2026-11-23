import { eq } from "drizzle-orm";
import { db } from "../db/client";
import {
  habitLogs,
  habits,
  streakFreezes,
  userSettings,
  users,
} from "../db/schema";

export async function exportAccountData(userId: string, database = db) {
  const [habitRows, logRows, freezeRows, settingRows] = await Promise.all([
    database.select().from(habits).where(eq(habits.userId, userId)),
    database.select().from(habitLogs).where(eq(habitLogs.userId, userId)),
    database
      .select()
      .from(streakFreezes)
      .where(eq(streakFreezes.userId, userId)),
    database
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId)),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    habits: habitRows,
    habitLogs: logRows,
    streakFreezes: freezeRows,
    settings: settingRows,
  };
}

export async function deleteUserAccount(
  userId: string,
  database = db,
): Promise<void> {
  await database.delete(users).where(eq(users.id, userId));
}
