import { eq, like } from "drizzle-orm";
import {
  addDays,
  getDeviceLocalDate,
  settingsSchema,
  type Settings,
} from "@habit/shared";
import { appDb, type AppDb } from "@/db/client";
import { createHabit } from "@/features/habits/repository";
import { upsertHabitLog } from "@/features/logs/repository";
import {
  habitLogs,
  habits,
  outbox,
  settings,
  streakFreezes,
  syncState,
} from "@/db/schema";
import { createId } from "@/lib/id";
import { enqueueOutbox } from "@/sync/outbox";

const SINGLETON_ID = "singleton";

const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  hapticsEnabled: true,
  reduceMotion: "system",
  qualityTier: "auto",
  dayStartOffsetMin: 0,
  backfillWindowDays: 14,
};

function mapRowToSettings(row: typeof settings.$inferSelect): Settings {
  return settingsSchema.parse({
    theme: row.theme,
    hapticsEnabled: row.hapticsEnabled === 1,
    reduceMotion: row.reduceMotion,
    qualityTier: row.qualityTier,
    dayStartOffsetMin: row.dayStartOffsetMin,
    backfillWindowDays: row.backfillWindowDays,
  });
}

export async function ensureSettingsAndSyncState(
  db: AppDb = appDb,
): Promise<void> {
  const nowIso = new Date().toISOString();

  await db.delete(habits).where(like(habits.id, "smoke-%"));

  const existingSettings = await db
    .select()
    .from(settings)
    .where(eq(settings.id, SINGLETON_ID));

  if (existingSettings.length === 0) {
    await db.insert(settings).values({
      id: SINGLETON_ID,
      theme: DEFAULT_SETTINGS.theme,
      hapticsEnabled: DEFAULT_SETTINGS.hapticsEnabled ? 1 : 0,
      reduceMotion: DEFAULT_SETTINGS.reduceMotion,
      qualityTier: DEFAULT_SETTINGS.qualityTier,
      dayStartOffsetMin: DEFAULT_SETTINGS.dayStartOffsetMin,
      backfillWindowDays: DEFAULT_SETTINGS.backfillWindowDays,
      updatedAt: nowIso,
    });
  }

  const existingSync = await db
    .select()
    .from(syncState)
    .where(eq(syncState.id, SINGLETON_ID));

  if (existingSync.length === 0) {
    await db.insert(syncState).values({
      id: SINGLETON_ID,
      deviceId: createId(),
      lastPullCursor: 0,
      lastSyncedAt: null,
      userId: null,
    });
  }
}

export async function getSettings(db: AppDb = appDb): Promise<Settings> {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.id, SINGLETON_ID));
  const row = rows[0];
  if (!row) {
    return DEFAULT_SETTINGS;
  }
  return mapRowToSettings(row);
}

export async function updateSettings(
  patch: Partial<Settings>,
  db: AppDb = appDb,
): Promise<Settings> {
  const current = await getSettings(db);
  const next = settingsSchema.parse({ ...current, ...patch });
  const nowIso = new Date().toISOString();

  await db.transaction(async (tx) => {
    await tx
      .update(settings)
      .set({
        theme: next.theme,
        hapticsEnabled: next.hapticsEnabled ? 1 : 0,
        reduceMotion: next.reduceMotion,
        qualityTier: next.qualityTier,
        dayStartOffsetMin: next.dayStartOffsetMin,
        backfillWindowDays: next.backfillWindowDays,
        updatedAt: nowIso,
      })
      .where(eq(settings.id, SINGLETON_ID));

    await enqueueOutbox(tx, {
      entity: "settings",
      entityId: SINGLETON_ID,
      op: "upsert",
      payload: { ...next, updatedAt: nowIso },
      nowIso,
    });
  });

  return next;
}

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

  // 12 completed logs * 25 XP = 300 XP -> Level 3 (Tier 2)
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

  // 40 completed logs * 25 XP = 1000 XP -> Level 5 (Tier 3)
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
