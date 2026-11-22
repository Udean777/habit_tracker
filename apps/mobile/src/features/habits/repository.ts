import { and, asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import {
  createHabitInputSchema,
  updateHabitInputSchema,
  type CreateHabitInput,
  type HabitColorKey,
  type HabitIconKey,
  type HabitType,
  type LocalDate,
  type ScheduleType,
  type UpdateHabitInput,
} from "@habit/shared";
import { appDb, type AppDb } from "@/db/client";
import { habits } from "@/db/schema";
import { createId } from "@/lib/id";
import { enqueueOutbox } from "@/sync/outbox";

export type HabitRecord = {
  readonly id: string;
  readonly name: string;
  readonly icon: HabitIconKey;
  readonly color: HabitColorKey;
  readonly type: HabitType;
  readonly targetValue: number | null;
  readonly scheduleType: ScheduleType;
  readonly scheduleDays: number | null;
  readonly scheduleTimes: number | null;
  readonly reminderTime: string | null;
  readonly sortOrder: number;
  readonly archivedAt: string | null;
  readonly startDate: LocalDate;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt: string | null;
};

function mapRow(row: typeof habits.$inferSelect): HabitRecord {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon as HabitIconKey,
    color: row.color as HabitColorKey,
    type: row.type as HabitType,
    targetValue: row.targetValue,
    scheduleType: row.scheduleType as ScheduleType,
    scheduleDays: row.scheduleDays,
    scheduleTimes: row.scheduleTimes,
    reminderTime: row.reminderTime,
    sortOrder: row.sortOrder,
    archivedAt: row.archivedAt,
    startDate: row.startDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}

export async function listActiveHabits(
  db: AppDb = appDb,
): Promise<readonly HabitRecord[]> {
  const rows = await db
    .select()
    .from(habits)
    .where(and(isNull(habits.deletedAt), isNull(habits.archivedAt)))
    .orderBy(asc(habits.sortOrder), asc(habits.createdAt));
  return rows.map(mapRow);
}

export async function listArchivedHabits(
  db: AppDb = appDb,
): Promise<readonly HabitRecord[]> {
  const rows = await db
    .select()
    .from(habits)
    .where(and(isNull(habits.deletedAt), isNotNull(habits.archivedAt)))
    .orderBy(desc(habits.archivedAt));
  return rows.map(mapRow);
}

export async function getHabitById(
  id: string,
  db: AppDb = appDb,
): Promise<HabitRecord | null> {
  const rows = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, id), isNull(habits.deletedAt)));
  const row = rows[0];
  return row ? mapRow(row) : null;
}

export async function createHabit(
  input: CreateHabitInput,
  db: AppDb = appDb,
): Promise<HabitRecord> {
  const parsed = createHabitInputSchema.parse(input);
  const nowIso = new Date().toISOString();
  const id = createId();

  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ sortOrder: habits.sortOrder })
      .from(habits)
      .where(isNull(habits.deletedAt))
      .orderBy(desc(habits.sortOrder))
      .limit(1);

    const nextOrder = (existing[0]?.sortOrder ?? -1) + 1;
    const row = {
      id,
      name: parsed.name,
      icon: parsed.icon,
      color: parsed.color,
      type: parsed.type,
      targetValue: parsed.type === "boolean" ? null : (parsed.targetValue ?? 1),
      scheduleType: parsed.scheduleType,
      scheduleDays:
        parsed.scheduleType === "weekdays" ? (parsed.scheduleDays ?? 127) : null,
      scheduleTimes:
        parsed.scheduleType === "times_per_week"
          ? (parsed.scheduleTimes ?? 3)
          : null,
      reminderTime: parsed.reminderTime,
      sortOrder: nextOrder,
      archivedAt: null,
      startDate: parsed.startDate,
      createdAt: nowIso,
      updatedAt: nowIso,
      deletedAt: null,
    };

    await tx.insert(habits).values(row);
    await enqueueOutbox(tx, {
      entity: "habit",
      entityId: id,
      op: "upsert",
      payload: row,
      nowIso,
    });

    return mapRow(row);
  });
}

export async function updateHabit(
  id: string,
  input: UpdateHabitInput,
  db: AppDb = appDb,
): Promise<HabitRecord | null> {
  const parsed = updateHabitInputSchema.parse(input);
  const nowIso = new Date().toISOString();

  return db.transaction(async (tx) => {
    const existingRows = await tx
      .select()
      .from(habits)
      .where(and(eq(habits.id, id), isNull(habits.deletedAt)));
    const existing = existingRows[0];
    if (!existing) return null;

    const updated = {
      ...existing,
      ...parsed,
      updatedAt: nowIso,
    };

    await tx.update(habits).set(updated).where(eq(habits.id, id));
    await enqueueOutbox(tx, {
      entity: "habit",
      entityId: id,
      op: "upsert",
      payload: updated,
      nowIso,
    });

    return mapRow(updated);
  });
}

export async function archiveHabit(
  id: string,
  db: AppDb = appDb,
): Promise<void> {
  const nowIso = new Date().toISOString();
  await db.transaction(async (tx) => {
    await tx
      .update(habits)
      .set({ archivedAt: nowIso, updatedAt: nowIso })
      .where(eq(habits.id, id));

    await enqueueOutbox(tx, {
      entity: "habit",
      entityId: id,
      op: "upsert",
      payload: { id, archivedAt: nowIso, updatedAt: nowIso },
      nowIso,
    });
  });
}

export async function unarchiveHabit(
  id: string,
  db: AppDb = appDb,
): Promise<void> {
  const nowIso = new Date().toISOString();
  await db.transaction(async (tx) => {
    await tx
      .update(habits)
      .set({ archivedAt: null, updatedAt: nowIso })
      .where(eq(habits.id, id));

    await enqueueOutbox(tx, {
      entity: "habit",
      entityId: id,
      op: "upsert",
      payload: { id, archivedAt: null, updatedAt: nowIso },
      nowIso,
    });
  });
}

export async function softDeleteHabit(
  id: string,
  db: AppDb = appDb,
): Promise<void> {
  const nowIso = new Date().toISOString();
  await db.transaction(async (tx) => {
    await tx
      .update(habits)
      .set({ deletedAt: nowIso, updatedAt: nowIso })
      .where(eq(habits.id, id));

    await enqueueOutbox(tx, {
      entity: "habit",
      entityId: id,
      op: "delete",
      payload: { id, deletedAt: nowIso, updatedAt: nowIso },
      nowIso,
    });
  });
}

export async function reorderHabits(
  orderedIds: readonly string[],
  db: AppDb = appDb,
): Promise<void> {
  const nowIso = new Date().toISOString();
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (!id) continue;
      await tx
        .update(habits)
        .set({ sortOrder: i, updatedAt: nowIso })
        .where(eq(habits.id, id));

      await enqueueOutbox(tx, {
        entity: "habit",
        entityId: id,
        op: "upsert",
        payload: { id, sortOrder: i, updatedAt: nowIso },
        nowIso,
      });
    }
  });
}
