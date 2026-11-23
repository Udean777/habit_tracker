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
import { applyPulledChanges } from "./applyChanges";

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

async function pushPendingOutbox(
  db: AppDb,
  deviceId: string,
  initialToken: string,
): Promise<
  | { readonly ok: true; readonly pushed: number; readonly token: string }
  | { readonly ok: false; readonly result: SyncResult }
> {
  const pending = await db
    .select()
    .from(outbox)
    .orderBy(asc(outbox.createdAt))
    .limit(100);

  if (pending.length === 0) {
    return { ok: true, pushed: 0, token: initialToken };
  }

  const ops: SyncOp[] = pending.map((row) => ({
    opId: row.opId,
    entity: row.entity as OutboxEntity,
    entityId: row.entityId,
    op: row.op as OutboxOpType,
    updatedAt: row.createdAt,
    data: JSON.parse(row.payload) as Record<string, unknown>,
  }));

  let token = initialToken;
  let pushRes = await apiClient.sync.push.$post(
    { json: { deviceId, ops } },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (pushRes.status === 401) {
    const refreshed = await refreshAccessToken(deviceId);
    if (!refreshed) {
      return { ok: false, result: { kind: "signed_out" } };
    }
    token = refreshed;
    pushRes = await apiClient.sync.push.$post(
      { json: { deviceId, ops } },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }

  if (!pushRes.ok) {
    return {
      ok: false,
      result: { kind: "error", message: `Push failed (${pushRes.status})` },
    };
  }

  const pushBody = await pushRes.json();
  if (pushBody.acked.length > 0) {
    await db.delete(outbox).where(inArray(outbox.opId, pushBody.acked));
  }

  return { ok: true, pushed: pushBody.acked.length, token };
}

async function pullRemoteChanges(
  db: AppDb,
  startCursor: number,
  token: string,
): Promise<
  | { readonly ok: true; readonly pulled: number }
  | { readonly ok: false; readonly result: SyncResult }
> {
  let cursor = startCursor;
  let pulled = 0;
  let hasMore = true;

  while (hasMore) {
    const pullRes = await apiClient.sync.pull.$get(
      { query: { cursor: String(cursor), limit: "500" } },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!pullRes.ok) {
      return {
        ok: false,
        result: { kind: "error", message: `Pull failed (${pullRes.status})` },
      };
    }

    const body = await pullRes.json();
    if (body.changes.length > 0) {
      await db.transaction((tx) =>
        applyPulledChanges(tx, body.changes, body.nextCursor),
      );
      pulled += body.changes.length;
    }

    cursor = body.nextCursor;
    hasMore = body.hasMore;
  }

  return { ok: true, pulled };
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

  const pushOutcome = await pushPendingOutbox(
    db,
    state.deviceId,
    auth.accessToken,
  );
  if (!pushOutcome.ok) return pushOutcome.result;

  const pullOutcome = await pullRemoteChanges(
    db,
    state.lastPullCursor,
    pushOutcome.token,
  );
  if (!pullOutcome.ok) return pullOutcome.result;

  return {
    kind: "synced",
    pushed: pushOutcome.pushed,
    pulled: pullOutcome.pulled,
  };
}

export function runSyncCycle(db: AppDb = appDb): Promise<SyncResult> {
  if (!activeSync) {
    activeSync = runSyncInternal(db).finally(() => {
      activeSync = null;
    });
  }
  return activeSync;
}
