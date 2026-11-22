import { eq, like } from "drizzle-orm";
import { settingsSchema, type Settings } from "@habit/shared";
import { appDb, type AppDb } from "@/db/client";
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
