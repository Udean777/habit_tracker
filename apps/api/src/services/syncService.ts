import { and, asc, eq, gt, sql } from "drizzle-orm";
import type {
  SyncOp,
  SyncPullChange,
  SyncRejectedOp,
} from "@habit/shared";
import { db, type ApiDb } from "../db/client";
import {
  habitLogs,
  habits,
  heroProfiles,
  processedOps,
  streakFreezes,
  userInventory,
  userSettings,
} from "../db/schema";
import {
  applyHabitLogPushOp,
  applyHabitPushOp,
  applyHeroProfilePushOp,
  applySettingsPushOp,
  applyStreakFreezePushOp,
  applyUserInventoryPushOp,
  type DbTx,
} from "./syncEntityAppliers";

const MAX_FUTURE_SKEW_MS = 24 * 60 * 60 * 1000;

async function nextServerSeq(tx: DbTx): Promise<number> {
  const rows = await tx.execute(sql`SELECT nextval('sync_server_seq') AS seq`);
  const first = rows[0] as { seq?: string | number } | undefined;
  const parsed = Number(first?.seq);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return Date.now();
}

export async function processSyncPush(
  userId: string,
  deviceId: string,
  ops: readonly SyncOp[],
  database: ApiDb = db,
  nowMs: number = Date.now(),
) {
  const acked: string[] = [];
  const rejected: SyncRejectedOp[] = [];

  for (const op of ops) {
    const opTimeMs = Date.parse(op.updatedAt);
    if (Number.isNaN(opTimeMs) || opTimeMs > nowMs + MAX_FUTURE_SKEW_MS) {
      rejected.push({
        opId: op.opId,
        code: "VALIDATION_ERROR",
        message: "Invalid or future-skewed updatedAt timestamp",
      });
      continue;
    }

    try {
      await database.transaction(async (tx) => {
        const already = await tx
          .select({ opId: processedOps.opId })
          .from(processedOps)
          .where(
            and(
              eq(processedOps.userId, userId),
              eq(processedOps.opId, op.opId),
            ),
          );
        if (already.length > 0) {
          acked.push(op.opId);
          return;
        }

        const seq = await nextServerSeq(tx);
        if (op.entity === "habit") {
          await applyHabitPushOp(tx, userId, deviceId, op, seq);
        } else if (op.entity === "habit_log") {
          await applyHabitLogPushOp(tx, userId, deviceId, op, seq);
        } else if (op.entity === "streak_freeze") {
          await applyStreakFreezePushOp(tx, userId, deviceId, op, seq);
        } else if (op.entity === "settings") {
          await applySettingsPushOp(tx, userId, deviceId, op, seq);
        } else if (op.entity === "hero_profile") {
          await applyHeroProfilePushOp(tx, userId, deviceId, op, seq);
        } else if (op.entity === "user_inventory") {
          await applyUserInventoryPushOp(tx, userId, deviceId, op, seq);
        }

        await tx.insert(processedOps).values({
          userId,
          opId: op.opId,
          processedAt: new Date(nowMs),
        });
        acked.push(op.opId);
      });
    } catch (err) {
      rejected.push({
        opId: op.opId,
        code: "VALIDATION_ERROR",
        message: err instanceof Error ? err.message : "Failed to apply op",
      });
    }
  }

  return { acked, rejected, serverTime: new Date(nowMs).toISOString() };
}

export async function pullUserChanges(
  userId: string,
  cursor: number,
  limit: number,
  database: ApiDb = db,
) {
  const [
    habitRows,
    logRows,
    freezeRows,
    settingRows,
    heroRows,
    inventoryRows,
  ] = await Promise.all([
    database
      .select()
      .from(habits)
      .where(and(eq(habits.userId, userId), gt(habits.serverSeq, cursor)))
      .orderBy(asc(habits.serverSeq))
      .limit(limit),
    database
      .select()
      .from(habitLogs)
      .where(
        and(eq(habitLogs.userId, userId), gt(habitLogs.serverSeq, cursor)),
      )
      .orderBy(asc(habitLogs.serverSeq))
      .limit(limit),
    database
      .select()
      .from(streakFreezes)
      .where(
        and(
          eq(streakFreezes.userId, userId),
          gt(streakFreezes.serverSeq, cursor),
        ),
      )
      .orderBy(asc(streakFreezes.serverSeq))
      .limit(limit),
    database
      .select()
      .from(userSettings)
      .where(
        and(
          eq(userSettings.userId, userId),
          gt(userSettings.serverSeq, cursor),
        ),
      )
      .orderBy(asc(userSettings.serverSeq))
      .limit(limit),
    database
      .select()
      .from(heroProfiles)
      .where(
        and(
          eq(heroProfiles.userId, userId),
          gt(heroProfiles.serverSeq, cursor),
        ),
      )
      .orderBy(asc(heroProfiles.serverSeq))
      .limit(limit),
    database
      .select()
      .from(userInventory)
      .where(
        and(
          eq(userInventory.userId, userId),
          gt(userInventory.serverSeq, cursor),
        ),
      )
      .orderBy(asc(userInventory.serverSeq))
      .limit(limit),
  ]);

  const changes: SyncPullChange[] = [
    ...habitRows.map((r) => ({
      entity: "habit" as const,
      entityId: r.id,
      op: (r.deletedAt ? "delete" : "upsert") as "upsert" | "delete",
      data: r,
      serverSeq: r.serverSeq,
    })),
    ...logRows.map((r) => ({
      entity: "habit_log" as const,
      entityId: r.id,
      op: (r.deletedAt ? "delete" : "upsert") as "upsert" | "delete",
      data: r,
      serverSeq: r.serverSeq,
    })),
    ...freezeRows.map((r) => ({
      entity: "streak_freeze" as const,
      entityId: r.id,
      op: (r.deletedAt ? "delete" : "upsert") as "upsert" | "delete",
      data: r,
      serverSeq: r.serverSeq,
    })),
    ...settingRows.map((r) => ({
      entity: "settings" as const,
      entityId: "singleton",
      op: "upsert" as const,
      data: r,
      serverSeq: r.serverSeq,
    })),
    ...heroRows.map((r) => ({
      entity: "hero_profile" as const,
      entityId: "singleton",
      op: "upsert" as const,
      data: r,
      serverSeq: r.serverSeq,
    })),
    ...inventoryRows.map((r) => ({
      entity: "user_inventory" as const,
      entityId: r.id,
      op: (r.deletedAt ? "delete" : "upsert") as "upsert" | "delete",
      data: r,
      serverSeq: r.serverSeq,
    })),
  ].sort((a, b) => a.serverSeq - b.serverSeq);

  const sliced = changes.slice(0, limit);
  const nextCursor = sliced[sliced.length - 1]?.serverSeq ?? cursor;
  const hasMore = changes.length > limit;

  return { changes: sliced, nextCursor, hasMore };
}
