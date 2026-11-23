import { eq } from "drizzle-orm";
import type { SyncPullChange } from "@habit/shared";
import type { AppDb } from "@/db/client";
import { habitLogs, habits, syncState } from "@/db/schema";

type DbTx = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

function mapHabitChange(entityId: string, d: Record<string, unknown>) {
  const nowIso = new Date().toISOString();
  return {
    id: entityId,
    name: String(d.name ?? "Habit"),
    icon: String(d.icon ?? "check"),
    color: String(d.color ?? "primary"),
    type: String(d.type ?? "boolean"),
    targetValue: typeof d.targetValue === "number" ? d.targetValue : null,
    scheduleType: String(d.scheduleType ?? "daily"),
    scheduleDays: typeof d.scheduleDays === "number" ? d.scheduleDays : null,
    scheduleTimes: typeof d.scheduleTimes === "number" ? d.scheduleTimes : null,
    reminderTime: typeof d.reminderTime === "string" ? d.reminderTime : null,
    sortOrder: typeof d.sortOrder === "number" ? d.sortOrder : 0,
    archivedAt: typeof d.archivedAt === "string" ? d.archivedAt : null,
    startDate: String(d.startDate ?? "2026-01-01"),
    createdAt: String(d.createdAt ?? nowIso),
    updatedAt: String(d.updatedAt ?? nowIso),
    deletedAt: typeof d.deletedAt === "string" ? d.deletedAt : null,
  };
}

function mapHabitLogChange(entityId: string, d: Record<string, unknown>) {
  const nowIso = new Date().toISOString();
  return {
    id: entityId,
    habitId: String(d.habitId ?? ""),
    logDate: String(d.logDate ?? ""),
    value: typeof d.value === "number" ? d.value : 0,
    completedAt: typeof d.completedAt === "string" ? d.completedAt : null,
    createdAt: String(d.createdAt ?? nowIso),
    updatedAt: String(d.updatedAt ?? nowIso),
    deletedAt: typeof d.deletedAt === "string" ? d.deletedAt : null,
  };
}

export async function applyPulledChanges(
  tx: DbTx,
  changes: readonly SyncPullChange[],
  nextCursor: number,
): Promise<void> {
  for (const change of changes) {
    if (change.entity === "habit") {
      const row = mapHabitChange(change.entityId, change.data);
      await tx
        .insert(habits)
        .values(row)
        .onConflictDoUpdate({ target: habits.id, set: row });
    } else if (change.entity === "habit_log") {
      const row = mapHabitLogChange(change.entityId, change.data);
      await tx
        .insert(habitLogs)
        .values(row)
        .onConflictDoUpdate({ target: habitLogs.id, set: row });
    }
  }

  await tx
    .update(syncState)
    .set({
      lastPullCursor: nextCursor,
      lastSyncedAt: new Date().toISOString(),
    })
    .where(eq(syncState.id, "singleton"));
}
