import { and, eq } from "drizzle-orm";
import type { SyncOp } from "@habit/shared";
import type { db } from "../db/client";
import {
  habitLogs,
  habits,
  heroProfiles,
  streakFreezes,
  userInventory,
  userSettings,
} from "../db/schema";

export type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function shouldApplyLww(
  incomingUpdatedAt: string,
  incomingDeviceId: string,
  existingUpdatedAt: string,
  existingDeviceId: string | null,
): boolean {
  if (incomingUpdatedAt > existingUpdatedAt) return true;
  if (incomingUpdatedAt < existingUpdatedAt) return false;
  return incomingDeviceId >= (existingDeviceId ?? "");
}

export async function applyHabitPushOp(
  tx: DbTx,
  userId: string,
  deviceId: string,
  op: SyncOp,
  seq: number,
): Promise<void> {
  const existingRows = await tx
    .select()
    .from(habits)
    .where(and(eq(habits.id, op.entityId), eq(habits.userId, userId)));
  const existing = existingRows[0];

  if (
    existing &&
    !shouldApplyLww(
      op.updatedAt,
      deviceId,
      existing.updatedAt,
      existing.lastDeviceId,
    )
  ) {
    return;
  }

  const data = op.data;
  const row = {
    id: op.entityId,
    userId,
    name: String(data.name ?? existing?.name ?? "Habit"),
    icon: String(data.icon ?? existing?.icon ?? "check"),
    color: String(data.color ?? existing?.color ?? "primary"),
    type: String(data.type ?? existing?.type ?? "boolean"),
    targetValue:
      typeof data.targetValue === "number"
        ? data.targetValue
        : (existing?.targetValue ?? null),
    scheduleType: String(
      data.scheduleType ?? existing?.scheduleType ?? "daily",
    ),
    scheduleDays:
      typeof data.scheduleDays === "number"
        ? data.scheduleDays
        : (existing?.scheduleDays ?? null),
    scheduleTimes:
      typeof data.scheduleTimes === "number"
        ? data.scheduleTimes
        : (existing?.scheduleTimes ?? null),
    reminderTime:
      typeof data.reminderTime === "string"
        ? data.reminderTime
        : (existing?.reminderTime ?? null),
    sortOrder:
      typeof data.sortOrder === "number"
        ? data.sortOrder
        : (existing?.sortOrder ?? 0),
    archivedAt:
      data.archivedAt === null
        ? null
        : typeof data.archivedAt === "string"
          ? data.archivedAt
          : (existing?.archivedAt ?? null),
    startDate: String(data.startDate ?? existing?.startDate ?? "2026-01-01"),
    createdAt: String(data.createdAt ?? existing?.createdAt ?? op.updatedAt),
    updatedAt: op.updatedAt,
    deletedAt:
      op.op === "delete"
        ? String(data.deletedAt ?? op.updatedAt)
        : typeof data.deletedAt === "string"
          ? data.deletedAt
          : null,
    serverSeq: seq,
    lastDeviceId: deviceId,
  };

  if (existing) {
    await tx.update(habits).set(row).where(eq(habits.id, row.id));
  } else {
    await tx.insert(habits).values(row);
  }
}

export async function applyHabitLogPushOp(
  tx: DbTx,
  userId: string,
  deviceId: string,
  op: SyncOp,
  seq: number,
): Promise<void> {
  const existingRows = await tx
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.id, op.entityId), eq(habitLogs.userId, userId)));
  const existing = existingRows[0];

  if (
    existing &&
    !shouldApplyLww(
      op.updatedAt,
      deviceId,
      existing.updatedAt,
      existing.lastDeviceId,
    )
  ) {
    return;
  }

  const data = op.data;
  const row = {
    id: op.entityId,
    userId,
    habitId: String(data.habitId ?? existing?.habitId ?? ""),
    logDate: String(data.logDate ?? existing?.logDate ?? ""),
    value: typeof data.value === "number" ? data.value : (existing?.value ?? 0),
    completedAt:
      typeof data.completedAt === "string" ? data.completedAt : null,
    createdAt: String(data.createdAt ?? existing?.createdAt ?? op.updatedAt),
    updatedAt: op.updatedAt,
    deletedAt:
      op.op === "delete"
        ? String(data.deletedAt ?? op.updatedAt)
        : typeof data.deletedAt === "string"
          ? data.deletedAt
          : null,
    serverSeq: seq,
    lastDeviceId: deviceId,
  };

  if (existing) {
    await tx.update(habitLogs).set(row).where(eq(habitLogs.id, row.id));
  } else {
    await tx.insert(habitLogs).values(row);
  }
}

export async function applySettingsPushOp(
  tx: DbTx,
  userId: string,
  deviceId: string,
  op: SyncOp,
  seq: number,
): Promise<void> {
  const existingRows = await tx
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));
  const existing = existingRows[0];

  if (
    existing &&
    !shouldApplyLww(
      op.updatedAt,
      deviceId,
      existing.updatedAt,
      existing.lastDeviceId,
    )
  ) {
    return;
  }

  const data = op.data;
  const row = {
    id: existing?.id ?? `${userId}:settings`,
    userId,
    theme: String(data.theme ?? existing?.theme ?? "system"),
    hapticsEnabled:
      data.hapticsEnabled === false || data.hapticsEnabled === 0 ? 0 : 1,
    reduceMotion: String(
      data.reduceMotion ?? existing?.reduceMotion ?? "system",
    ),
    qualityTier: String(data.qualityTier ?? existing?.qualityTier ?? "auto"),
    dayStartOffsetMin:
      typeof data.dayStartOffsetMin === "number"
        ? data.dayStartOffsetMin
        : (existing?.dayStartOffsetMin ?? 0),
    backfillWindowDays:
      typeof data.backfillWindowDays === "number"
        ? data.backfillWindowDays
        : (existing?.backfillWindowDays ?? 14),
    updatedAt: op.updatedAt,
    serverSeq: seq,
    lastDeviceId: deviceId,
  };

  if (existing) {
    await tx
      .update(userSettings)
      .set(row)
      .where(eq(userSettings.id, existing.id));
  } else {
    await tx.insert(userSettings).values(row);
  }
}

export async function applyStreakFreezePushOp(
  tx: DbTx,
  userId: string,
  deviceId: string,
  op: SyncOp,
  seq: number,
): Promise<void> {
  const existingRows = await tx
    .select()
    .from(streakFreezes)
    .where(
      and(eq(streakFreezes.id, op.entityId), eq(streakFreezes.userId, userId)),
    );
  const existing = existingRows[0];

  if (
    existing &&
    !shouldApplyLww(
      op.updatedAt,
      deviceId,
      existing.updatedAt,
      existing.lastDeviceId,
    )
  ) {
    return;
  }

  const data = op.data;
  const row = {
    id: op.entityId,
    userId,
    habitId: String(data.habitId ?? existing?.habitId ?? ""),
    freezeDate: String(data.freezeDate ?? existing?.freezeDate ?? ""),
    source: String(data.source ?? existing?.source ?? "manual"),
    createdAt: String(data.createdAt ?? existing?.createdAt ?? op.updatedAt),
    updatedAt: op.updatedAt,
    deletedAt:
      op.op === "delete"
        ? String(data.deletedAt ?? op.updatedAt)
        : typeof data.deletedAt === "string"
          ? data.deletedAt
          : null,
    serverSeq: seq,
    lastDeviceId: deviceId,
  };

  if (existing) {
    await tx
      .update(streakFreezes)
      .set(row)
      .where(eq(streakFreezes.id, row.id));
  } else {
    await tx.insert(streakFreezes).values(row);
  }
}

export async function applyHeroProfilePushOp(
  tx: DbTx,
  userId: string,
  deviceId: string,
  op: SyncOp,
  seq: number,
): Promise<void> {
  const existingRows = await tx
    .select()
    .from(heroProfiles)
    .where(eq(heroProfiles.userId, userId));
  const existing = existingRows[0];

  if (
    existing &&
    !shouldApplyLww(
      op.updatedAt,
      deviceId,
      existing.updatedAt,
      existing.lastDeviceId,
    )
  ) {
    return;
  }

  const data = op.data;
  const row = {
    id: existing?.id ?? `${userId}:hero_profile`,
    userId,
    avatarClass: String(data.avatarClass ?? existing?.avatarClass ?? "knight"),
    equippedPaletteId:
      data.equippedPaletteId === null
        ? null
        : typeof data.equippedPaletteId === "string"
          ? data.equippedPaletteId
          : (existing?.equippedPaletteId ?? null),
    equippedAuraId:
      data.equippedAuraId === null
        ? null
        : typeof data.equippedAuraId === "string"
          ? data.equippedAuraId
          : (existing?.equippedAuraId ?? null),
    equippedFrameId:
      data.equippedFrameId === null
        ? null
        : typeof data.equippedFrameId === "string"
          ? data.equippedFrameId
          : (existing?.equippedFrameId ?? null),
    updatedAt: op.updatedAt,
    serverSeq: seq,
    lastDeviceId: deviceId,
  };

  if (existing) {
    await tx
      .update(heroProfiles)
      .set(row)
      .where(eq(heroProfiles.id, existing.id));
  } else {
    await tx.insert(heroProfiles).values(row);
  }
}

export async function applyUserInventoryPushOp(
  tx: DbTx,
  userId: string,
  deviceId: string,
  op: SyncOp,
  seq: number,
): Promise<void> {
  const existingRows = await tx
    .select()
    .from(userInventory)
    .where(
      and(eq(userInventory.id, op.entityId), eq(userInventory.userId, userId)),
    );
  const existing = existingRows[0];

  if (
    existing &&
    !shouldApplyLww(
      op.updatedAt,
      deviceId,
      existing.updatedAt,
      existing.lastDeviceId,
    )
  ) {
    return;
  }

  const data = op.data;
  const row = {
    id: op.entityId,
    userId,
    itemId: String(data.itemId ?? existing?.itemId ?? ""),
    category: String(data.category ?? existing?.category ?? "palette"),
    costGold:
      typeof data.costGold === "number"
        ? data.costGold
        : (existing?.costGold ?? 0),
    purchasedAt: String(
      data.purchasedAt ?? existing?.purchasedAt ?? op.updatedAt,
    ),
    createdAt: String(data.createdAt ?? existing?.createdAt ?? op.updatedAt),
    updatedAt: op.updatedAt,
    deletedAt:
      op.op === "delete"
        ? String(data.deletedAt ?? op.updatedAt)
        : typeof data.deletedAt === "string"
          ? data.deletedAt
          : null,
    serverSeq: seq,
    lastDeviceId: deviceId,
  };

  if (existing) {
    await tx
      .update(userInventory)
      .set(row)
      .where(eq(userInventory.id, row.id));
  } else {
    await tx.insert(userInventory).values(row);
  }
}
