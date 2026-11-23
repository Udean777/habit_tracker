import { addDays, getDeviceLocalDate } from "@habit/shared";
import { appDb, type AppDb } from "@/db/client";
import {
  habitLogs,
  habits,
  outbox,
  settings,
  streakFreezes,
} from "@/db/schema";
import { createHabit } from "@/features/habits";
import { upsertHabitLog } from "@/features/logs";

export async function seedTier2DemoData(db: AppDb = appDb): Promise<void> {
  const today = getDeviceLocalDate();
  const start = addDays(today, -10);

  const h1 = await createHabit(
    {
      name: "Morning Walk",
      icon: "run",
      color: "emerald",
      type: "boolean",
      targetValue: null,
      scheduleType: "daily",
      scheduleDays: 127,
      scheduleTimes: null,
      reminderTime: null,
      startDate: start,
    },
    db,
  );

  const h2 = await createHabit(
    {
      name: "Read 20m",
      icon: "book",
      color: "violet",
      type: "boolean",
      targetValue: null,
      scheduleType: "daily",
      scheduleDays: 127,
      scheduleTimes: null,
      reminderTime: null,
      startDate: start,
    },
    db,
  );

  // 12 completed logs * 25 XP = 300 XP -> Level 3 (Tier 2).
  for (let i = 1; i <= 6; i++) {
    const date = addDays(today, -i);
    await upsertHabitLog(
      {
        habitId: h1.id,
        logDate: date,
        value: 1,
        today,
        backfillWindowDays: 14,
      },
      db,
    );
    await upsertHabitLog(
      {
        habitId: h2.id,
        logDate: date,
        value: 1,
        today,
        backfillWindowDays: 14,
      },
      db,
    );
  }
}

export async function seedTier3DemoData(db: AppDb = appDb): Promise<void> {
  const today = getDeviceLocalDate();
  const start = addDays(today, -25);

  const h1 = await createHabit(
    {
      name: "Deep Work",
      icon: "code",
      color: "violet",
      type: "boolean",
      targetValue: null,
      scheduleType: "daily",
      scheduleDays: 127,
      scheduleTimes: null,
      reminderTime: null,
      startDate: start,
    },
    db,
  );

  const h2 = await createHabit(
    {
      name: "Evening Run",
      icon: "flame",
      color: "amber",
      type: "boolean",
      targetValue: null,
      scheduleType: "daily",
      scheduleDays: 127,
      scheduleTimes: null,
      reminderTime: null,
      startDate: start,
    },
    db,
  );

  // 40 completed logs * 25 XP = 1000 XP -> Level 5 (Tier 3).
  for (let i = 1; i <= 20; i++) {
    const date = addDays(today, -i);
    await upsertHabitLog(
      {
        habitId: h1.id,
        logDate: date,
        value: 1,
        today,
        backfillWindowDays: 30,
      },
      db,
    );
    await upsertHabitLog(
      {
        habitId: h2.id,
        logDate: date,
        value: 1,
        today,
        backfillWindowDays: 30,
      },
      db,
    );
  }
}

export async function exportAllLocalData(db: AppDb = appDb): Promise<string> {
  const [habitRows, logRows, freezeRows, settingRows, outboxRows] =
    await Promise.all([
      db.select().from(habits),
      db.select().from(habitLogs),
      db.select().from(streakFreezes),
      db.select().from(settings),
      db.select().from(outbox),
    ]);

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      habits: habitRows,
      habitLogs: logRows,
      streakFreezes: freezeRows,
      settings: settingRows,
      pendingOutboxCount: outboxRows.length,
    },
    null,
    2,
  );
}
