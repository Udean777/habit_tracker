import { asc, eq, inArray } from "drizzle-orm";
import type { OutboxEntity, OutboxOpType, SyncOp } from "@habit/shared";
import { appDb, type AppDb } from "@/db/client";
import { habitLogs, habits, outbox, settings, syncState } from "@/db/schema";
import {
  apiClient,
  clearAuthTokens,
  getAuthTokens,
  saveAuthTokens,
} from "@/lib/apiClient";
import { enqueueOutbox } from "@/sync/outbox";

let activeSync: Promise<SyncResult> | null = null;

export type SyncResult =
  | { readonly kind: "synced"; readonly pushed: number; readonly pulled: number }
  | { readonly kind: "signed_out" }
  | { readonly kind: "error"; readonly message: string };

async function refreshAccessToken(deviceId: string): Promise<string | null> {
  const auth = await getAuthTokens();
  if (!auth) return null;

  const res = await apiClient.auth.refresh.$post({
    json: { refreshToken: auth.refreshToken, deviceId },
  });
  if (!res.ok) {
    await clearAuthTokens();
    return null;
  }

  const data = await res.json();
  await saveAuthTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    email: data.user.email,
  });
  return data.accessToken;
}

export async function enqueueAllLocalDataForSync(
  db: AppDb = appDb,
): Promise<void> {
  const [habitRows, logRows, settingRows] = await Promise.all([
    db.select().from(habits),
    db.select().from(habitLogs),
    db.select().from(settings),
  ]);

  await db.transaction(async (tx) => {
    for (const h of habitRows) {
      await enqueueOutbox(tx, {
        entity: "habit",
        entityId: h.id,
        op: h.deletedAt ? "delete" : "upsert",
        payload: h,
      });
    }
    for (const l of logRows) {
      await enqueueOutbox(tx, {
        entity: "habit_log",
        entityId: l.id,
        op: l.deletedAt ? "delete" : "upsert",
        payload: l,
      });
    }
    for (const s of settingRows) {
      await enqueueOutbox(tx, {
        entity: "settings",
        entityId: "singleton",
        op: "upsert",
        payload: s,
      });
    }
  });
}

async function runSyncInternal(db: AppDb): Promise<SyncResult> {
  const auth = await getAuthTokens();
  if (!auth) return { kind: "signed_out" };

  const syncRows = await db
    .select()
    .from(syncState)
    .where(eq(syncState.id, "singleton"));
  const state = syncRows[0];
  if (!state) return { kind: "error", message: "Missing sync_state" };

  let token = auth.accessToken;
  let pushed = 0;

  const pending = await db
    .select()
    .from(outbox)
    .orderBy(asc(outbox.createdAt))
    .limit(100);

  if (pending.length > 0) {
    const ops: SyncOp[] = pending.map((row) => ({
      opId: row.opId,
      entity: row.entity as OutboxEntity,
      entityId: row.entityId,
      op: row.op as OutboxOpType,
      updatedAt: row.createdAt,
      data: JSON.parse(row.payload) as Record<string, unknown>,
    }));

    let pushRes = await apiClient.sync.push.$post(
      { json: { deviceId: state.deviceId, ops } },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (pushRes.status === 401) {
      const refreshed = await refreshAccessToken(state.deviceId);
      if (!refreshed) return { kind: "signed_out" };
      token = refreshed;
      pushRes = await apiClient.sync.push.$post(
        { json: { deviceId: state.deviceId, ops } },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    }

    if (!pushRes.ok) {
      return { kind: "error", message: `Push failed (${pushRes.status})` };
    }

    const pushBody = await pushRes.json();
    if (pushBody.acked.length > 0) {
      await db.delete(outbox).where(inArray(outbox.opId, pushBody.acked));
      pushed = pushBody.acked.length;
    }
  }

  let cursor = state.lastPullCursor;
  let pulled = 0;
  let hasMore = true;

  while (hasMore) {
    const pullRes = await apiClient.sync.pull.$get(
      { query: { cursor: String(cursor), limit: "500" } },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!pullRes.ok) {
      return { kind: "error", message: `Pull failed (${pullRes.status})` };
    }

    const body = await pullRes.json();
    if (body.changes.length > 0) {
      await db.transaction(async (tx) => {
        for (const change of body.changes) {
          const d = change.data;
          if (change.entity === "habit") {
            const row = {
              id: change.entityId,
              name: String(d.name ?? "Habit"),
              icon: String(d.icon ?? "check"),
              color: String(d.color ?? "primary"),
              type: String(d.type ?? "boolean"),
              targetValue:
                typeof d.targetValue === "number" ? d.targetValue : null,
              scheduleType: String(d.scheduleType ?? "daily"),
              scheduleDays:
                typeof d.scheduleDays === "number" ? d.scheduleDays : null,
              scheduleTimes:
                typeof d.scheduleTimes === "number" ? d.scheduleTimes : null,
              reminderTime:
                typeof d.reminderTime === "string" ? d.reminderTime : null,
              sortOrder: typeof d.sortOrder === "number" ? d.sortOrder : 0,
              archivedAt:
                typeof d.archivedAt === "string" ? d.archivedAt : null,
              startDate: String(d.startDate ?? "2026-01-01"),
              createdAt: String(d.createdAt ?? new Date().toISOString()),
              updatedAt: String(d.updatedAt ?? new Date().toISOString()),
              deletedAt: typeof d.deletedAt === "string" ? d.deletedAt : null,
            };
            await tx
              .insert(habits)
              .values(row)
              .onConflictDoUpdate({ target: habits.id, set: row });
          } else if (change.entity === "habit_log") {
            const row = {
              id: change.entityId,
              habitId: String(d.habitId ?? ""),
              logDate: String(d.logDate ?? ""),
              value: typeof d.value === "number" ? d.value : 0,
              completedAt:
                typeof d.completedAt === "string" ? d.completedAt : null,
              createdAt: String(d.createdAt ?? new Date().toISOString()),
              updatedAt: String(d.updatedAt ?? new Date().toISOString()),
              deletedAt: typeof d.deletedAt === "string" ? d.deletedAt : null,
            };
            await tx
              .insert(habitLogs)
              .values(row)
              .onConflictDoUpdate({ target: habitLogs.id, set: row });
          }
        }

        await tx
          .update(syncState)
          .set({
            lastPullCursor: body.nextCursor,
            lastSyncedAt: new Date().toISOString(),
          })
          .where(eq(syncState.id, "singleton"));
      });
      pulled += body.changes.length;
    }

    cursor = body.nextCursor;
    hasMore = body.hasMore;
  }

  return { kind: "synced", pushed, pulled };
}

export function runSyncCycle(db: AppDb = appDb): Promise<SyncResult> {
  if (!activeSync) {
    activeSync = runSyncInternal(db).finally(() => {
      activeSync = null;
    });
  }
  return activeSync;
}
