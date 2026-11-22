import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, gt } from "drizzle-orm";
import {
  syncPushRequestSchema,
  type SyncPullChange,
  type SyncRejectedOp,
} from "@habit/shared";
import { db } from "../db/client";
import {
  habitLogs,
  habits,
  processedOps,
  streakFreezes,
  userSettings,
} from "../db/schema";
import { requireAuth, type AuthVariables } from "../middleware/auth";

let lastSeq = Date.now();
function nextServerSeq(): number {
  const now = Date.now();
  lastSeq = now > lastSeq ? now : lastSeq + 1;
  return lastSeq;
}

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

export const syncRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", requireAuth)
  .post("/push", zValidator("json", syncPushRequestSchema), async (c) => {
    const userId = c.get("userId");
    const { deviceId, ops } = c.req.valid("json");
    const acked: string[] = [];
    const rejected: SyncRejectedOp[] = [];

    for (const op of ops) {
      try {
        await db.transaction(async (tx) => {
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
          const data = op.data;

          if (op.entity === "habit") {
            const existingRows = await tx
              .select()
              .from(habits)
              .where(and(eq(habits.id, op.entityId), eq(habits.userId, userId)));
            const existing = existingRows[0];

            if (
              !existing ||
              shouldApplyLww(
                op.updatedAt,
                deviceId,
                existing.updatedAt,
                existing.lastDeviceId,
              )
            ) {
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
                startDate: String(
                  data.startDate ?? existing?.startDate ?? "2026-01-01",
                ),
                createdAt: String(
                  data.createdAt ?? existing?.createdAt ?? op.updatedAt,
                ),
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
          } else if (op.entity === "habit_log") {
            const existingRows = await tx
              .select()
              .from(habitLogs)
              .where(
                and(
                  eq(habitLogs.id, op.entityId),
                  eq(habitLogs.userId, userId),
                ),
              );
            const existing = existingRows[0];

            if (
              !existing ||
              shouldApplyLww(
                op.updatedAt,
                deviceId,
                existing.updatedAt,
                existing.lastDeviceId,
              )
            ) {
              const row = {
                id: op.entityId,
                userId,
                habitId: String(data.habitId ?? existing?.habitId ?? ""),
                logDate: String(data.logDate ?? existing?.logDate ?? ""),
                value:
                  typeof data.value === "number"
                    ? data.value
                    : (existing?.value ?? 0),
                completedAt:
                  typeof data.completedAt === "string"
                    ? data.completedAt
                    : null,
                createdAt: String(
                  data.createdAt ?? existing?.createdAt ?? op.updatedAt,
                ),
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
                  .update(habitLogs)
                  .set(row)
                  .where(eq(habitLogs.id, row.id));
              } else {
                await tx.insert(habitLogs).values(row);
              }
            }
          } else if (op.entity === "settings") {
            const existingRows = await tx
              .select()
              .from(userSettings)
              .where(eq(userSettings.userId, userId));
            const existing = existingRows[0];

            if (
              !existing ||
              shouldApplyLww(
                op.updatedAt,
                deviceId,
                existing.updatedAt,
                existing.lastDeviceId,
              )
            ) {
              const row = {
                id: existing?.id ?? `${userId}:settings`,
                userId,
                theme: String(data.theme ?? existing?.theme ?? "system"),
                hapticsEnabled:
                  data.hapticsEnabled === false || data.hapticsEnabled === 0
                    ? 0
                    : 1,
                reduceMotion: String(
                  data.reduceMotion ?? existing?.reduceMotion ?? "system",
                ),
                qualityTier: String(
                  data.qualityTier ?? existing?.qualityTier ?? "auto",
                ),
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

    return c.json({
      acked,
      rejected,
      serverTime: new Date().toISOString(),
    });
  })
  .get("/pull", async (c) => {
    const userId = c.get("userId");
    const cursor = Math.max(0, Number(c.req.query("cursor") ?? 0));
    const limit = Math.min(500, Math.max(1, Number(c.req.query("limit") ?? 500)));

    const [habitRows, logRows, freezeRows, settingRows] = await Promise.all([
      db
        .select()
        .from(habits)
        .where(and(eq(habits.userId, userId), gt(habits.serverSeq, cursor)))
        .orderBy(asc(habits.serverSeq))
        .limit(limit),
      db
        .select()
        .from(habitLogs)
        .where(
          and(eq(habitLogs.userId, userId), gt(habitLogs.serverSeq, cursor)),
        )
        .orderBy(asc(habitLogs.serverSeq))
        .limit(limit),
      db
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
      db
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

    return c.json({ changes: sliced, nextCursor, hasMore });
  });
