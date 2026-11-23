import { and, asc, eq, gt } from "drizzle-orm";
import type {
  SyncOp,
  SyncPullChange,
  SyncRejectedOp,
} from "@habit/shared";
import { db } from "../db/client";
import {
  habitLogs,
  habits,
  processedOps,
  streakFreezes,
  userSettings,
} from "../db/schema";
import {
  applyHabitLogPushOp,
  applyHabitPushOp,
  applySettingsPushOp,
} from "./syncEntityAppliers";

let lastSeq = Date.now();
function nextServerSeq(): number {
  const now = Date.now();
  lastSeq = now > lastSeq ? now : lastSeq + 1;
  return lastSeq;
}

export async function processSyncPush(
  userId: string,
  deviceId: string,
  ops: readonly SyncOp[],
  database = db,
) {
  const acked: string[] = [];
  const rejected: SyncRejectedOp[] = [];

  for (const op of ops) {
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

        const seq = nextServerSeq();
        if (op.entity === "habit") {
          await applyHabitPushOp(tx, userId, deviceId, op, seq);
        } else if (op.entity === "habit_log") {
          await applyHabitLogPushOp(tx, userId, deviceId, op, seq);
        } else if (op.entity === "settings") {
          await applySettingsPushOp(tx, userId, deviceId, op, seq);
        }

        await tx.insert(processedOps).values({
          userId,
          opId: op.opId,
          processedAt: new Date(),
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

  return { acked, rejected, serverTime: new Date().toISOString() };
}

export async function pullUserChanges(
  userId: string,
  cursor: number,
  limit: number,
  database = db,
) {
  const [habitRows, logRows, freezeRows, settingRows] = await Promise.all([
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
  ].sort((a, b) => a.serverSeq - b.serverSeq);

  const sliced = changes.slice(0, limit);
  const nextCursor = sliced[sliced.length - 1]?.serverSeq ?? cursor;
  const hasMore = changes.length > limit;

  return { changes: sliced, nextCursor, hasMore };
}
