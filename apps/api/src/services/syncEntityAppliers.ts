import { and, eq } from "drizzle-orm";
import {
  syncHabitLogPayloadSchema,
  syncHabitPayloadSchema,
  syncHeroProfilePayloadSchema,
  syncSettingsPayloadSchema,
  syncStreakFreezePayloadSchema,
  syncUserInventoryPayloadSchema,
  type SyncOp,
} from "@habit/shared";
import type { ApiDb } from "../db/client";
import {
  habitLogs,
  habits,
  heroProfiles,
  streakFreezes,
  userInventory,
  userSettings,
} from "../db/schema";

export type DbTx = Parameters<Parameters<ApiDb["transaction"]>[0]>[0];

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
  const data = syncHabitPayloadSchema.parse(op.data);
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

  const row = {
    id: op.entityId,
    userId,
    name: data.name,
    icon: data.icon,
    color: data.color,
    type: data.type,
    targetValue: data.targetValue ?? null,
    scheduleType: data.scheduleType,
    scheduleDays: data.scheduleDays ?? null,
    scheduleTimes: data.scheduleTimes ?? null,
    reminderTime: data.reminderTime ?? null,
    sortOrder: data.sortOrder,
    archivedAt: data.archivedAt ?? null,
    startDate: data.startDate,
    createdAt: data.createdAt ?? existing?.createdAt ?? op.updatedAt,
    updatedAt: op.updatedAt,
    deletedAt:
      op.op === "delete"
        ? (data.deletedAt ?? op.updatedAt)
        : (data.deletedAt ?? null),
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
  const data = syncHabitLogPayloadSchema.parse(op.data);
  const byId = await tx
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.id, op.entityId), eq(habitLogs.userId, userId)));
  const byUniqueKey =
    byId.length > 0
      ? byId
      : await tx
          .select()
          .from(habitLogs)
          .where(
            and(
              eq(habitLogs.userId, userId),
              eq(habitLogs.habitId, data.habitId),
              eq(habitLogs.logDate, data.logDate),
            ),
          );
  const existing = byUniqueKey[0];

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

  const row = {
    id: existing?.id ?? op.entityId,
    userId,
    habitId: data.habitId,
    logDate: data.logDate,
    value: data.value,
    completedAt: data.completedAt ?? null,
    createdAt: data.createdAt ?? existing?.createdAt ?? op.updatedAt,
    updatedAt: op.updatedAt,
    deletedAt:
      op.op === "delete"
        ? (data.deletedAt ?? op.updatedAt)
        : (data.deletedAt ?? null),
    serverSeq: seq,
    lastDeviceId: deviceId,
  };

  if (existing) {
    await tx.update(habitLogs).set(row).where(eq(habitLogs.id, existing.id));
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
  const data = syncSettingsPayloadSchema.parse(op.data);
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

  const row = {
    id: existing?.id ?? `${userId}:settings`,
    userId,
    theme: data.theme,
    hapticsEnabled:
      data.hapticsEnabled === false || data.hapticsEnabled === 0 ? 0 : 1,
    reduceMotion: data.reduceMotion,
    qualityTier: data.qualityTier,
    dayStartOffsetMin: data.dayStartOffsetMin,
    backfillWindowDays: data.backfillWindowDays,
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
  const data = syncStreakFreezePayloadSchema.parse(op.data);
  const byId = await tx
    .select()
    .from(streakFreezes)
    .where(
      and(eq(streakFreezes.id, op.entityId), eq(streakFreezes.userId, userId)),
    );
  const byUniqueKey =
    byId.length > 0
      ? byId
      : await tx
          .select()
          .from(streakFreezes)
          .where(
            and(
              eq(streakFreezes.userId, userId),
              eq(streakFreezes.habitId, data.habitId),
              eq(streakFreezes.freezeDate, data.freezeDate),
            ),
          );
  const existing = byUniqueKey[0];

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

  const row = {
    id: existing?.id ?? op.entityId,
    userId,
    habitId: data.habitId,
    freezeDate: data.freezeDate,
    source: data.source,
    createdAt: data.createdAt ?? existing?.createdAt ?? op.updatedAt,
    updatedAt: op.updatedAt,
    deletedAt:
      op.op === "delete"
        ? (data.deletedAt ?? op.updatedAt)
        : (data.deletedAt ?? null),
    serverSeq: seq,
    lastDeviceId: deviceId,
  };

  if (existing) {
    await tx
      .update(streakFreezes)
      .set(row)
      .where(eq(streakFreezes.id, existing.id));
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
  const data = syncHeroProfilePayloadSchema.parse(op.data);
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

  const row = {
    id: existing?.id ?? `${userId}:hero_profile`,
    userId,
    avatarClass: data.avatarClass,
    equippedPaletteId: data.equippedPaletteId ?? null,
    equippedAuraId: data.equippedAuraId ?? null,
    equippedFrameId: data.equippedFrameId ?? null,
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
  const data = syncUserInventoryPayloadSchema.parse(op.data);
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

  const row = {
    id: op.entityId,
    userId,
    itemId: data.itemId,
    category: data.category,
    costGold: data.costGold,
    purchasedAt: data.purchasedAt ?? existing?.purchasedAt ?? op.updatedAt,
    createdAt: data.createdAt ?? existing?.createdAt ?? op.updatedAt,
    updatedAt: op.updatedAt,
    deletedAt:
      op.op === "delete"
        ? (data.deletedAt ?? op.updatedAt)
        : (data.deletedAt ?? null),
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
