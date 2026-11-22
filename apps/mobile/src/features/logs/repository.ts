import { and, asc, eq, isNull } from "drizzle-orm";
import { isWithinBackfillWindow, type LocalDate } from "@habit/shared";
import { appDb, type AppDb } from "@/db/client";
import { habitLogs, outbox } from "@/db/schema";
import { createId } from "@/lib/id";
import { enqueueOutbox } from "@/sync/outbox";

export type HabitLogRecord = typeof habitLogs.$inferSelect;

export async function listLogsForDate(
  logDate: LocalDate,
  db: AppDb = appDb,
): Promise<readonly HabitLogRecord[]> {
  return db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.logDate, logDate), isNull(habitLogs.deletedAt)));
}

export async function listLogsForHabit(
  habitId: string,
  db: AppDb = appDb,
): Promise<readonly HabitLogRecord[]> {
  return db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.habitId, habitId), isNull(habitLogs.deletedAt)))
    .orderBy(asc(habitLogs.logDate));
}

export async function listAllActiveLogs(
  db: AppDb = appDb,
): Promise<readonly HabitLogRecord[]> {
  return db.select().from(habitLogs).where(isNull(habitLogs.deletedAt));
}

export async function countPendingOutbox(db: AppDb = appDb): Promise<number> {
  const rows = await db.select({ opId: outbox.opId }).from(outbox);
  return rows.length;
}

export async function upsertHabitLog(
  input: {
    readonly habitId: string;
    readonly logDate: LocalDate;
    readonly value: number;
    readonly today: LocalDate;
    readonly backfillWindowDays: number;
  },
  db: AppDb = appDb,
): Promise<HabitLogRecord> {
  if (
    !isWithinBackfillWindow(
      input.logDate,
      input.today,
      input.backfillWindowDays,
    )
  ) {
    throw new Error(
      `Date ${input.logDate} is outside the ${input.backfillWindowDays}-day backfill window.`,
    );
  }

  const normalizedValue = Math.max(0, Math.round(input.value));
  const nowIso = new Date().toISOString();
  const completedAt = normalizedValue > 0 ? nowIso : null;

  return db.transaction(async (tx) => {
    const existingRows = await tx
      .select()
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.habitId, input.habitId),
          eq(habitLogs.logDate, input.logDate),
        ),
      );
    const existing = existingRows[0];

    if (existing) {
      const updated = {
        ...existing,
        value: normalizedValue,
        completedAt,
        updatedAt: nowIso,
        deletedAt: null,
      };
      await tx
        .update(habitLogs)
        .set(updated)
        .where(eq(habitLogs.id, existing.id));

      await enqueueOutbox(tx, {
        entity: "habit_log",
        entityId: existing.id,
        op: "upsert",
        payload: updated,
        nowIso,
      });

      return updated;
    }

    const row: HabitLogRecord = {
      id: createId(),
      habitId: input.habitId,
      logDate: input.logDate,
      value: normalizedValue,
      completedAt,
      createdAt: nowIso,
      updatedAt: nowIso,
      deletedAt: null,
    };

    await tx.insert(habitLogs).values(row);
    await enqueueOutbox(tx, {
      entity: "habit_log",
      entityId: row.id,
      op: "upsert",
      payload: row,
      nowIso,
    });

    return row;
  });
}
