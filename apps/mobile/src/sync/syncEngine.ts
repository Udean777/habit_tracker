import { asc, eq, inArray, lt, sql } from "drizzle-orm";
import type { OutboxEntity, OutboxOpType, SyncOp } from "@habit/shared";
import { appDb, type AppDb } from "@/db/client";
import {
  habitLogs,
  habits,
  heroProfile,
  outbox,
  settings,
  streakFreezes,
  syncState,
  userInventory,
} from "@/db/schema";
import {
  apiClient,
  clearAuthTokens,
  getAuthTokens,
  saveAuthTokens,
} from "@/lib/apiClient";
import { enqueueOutbox } from "@/sync/outbox";
import { applyPulledChanges } from "./applyChanges";

const MAX_OUTBOX_ATTEMPTS = 5;
const OUTBOX_BATCH_LIMIT = 100;
const PULL_PAGE_LIMIT = 500;
const SYNC_DEBOUNCE_MS = 8_000;
const PULL_COOLDOWN_MS = 5 * 60 * 1000;
const TOKEN_REFRESH_BUFFER_SEC = 60;
const INITIAL_BACKOFF_MS = 30_000;
const MAX_BACKOFF_MS = 5 * 60 * 1000;

const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

let activeSync: Promise<SyncResult> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastPullAtMs: number | null = null;
let consecutiveFailures = 0;
let nextAllowedAutoSyncAtMs = 0;

export type SyncMode = "auto" | "manual";

export type SyncResult =
  | { readonly kind: "synced"; readonly pushed: number; readonly pulled: number }
  | { readonly kind: "signed_out" }
  | { readonly kind: "error"; readonly message: string };

function decodeBase64Url(segment: string): string | null {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padding);

  let out = "";
  for (let i = 0; i < padded.length; i += 4) {
    const c1 = BASE64_CHARS.indexOf(padded[i] ?? "");
    const c2 = BASE64_CHARS.indexOf(padded[i + 1] ?? "");
    const c3 = padded[i + 2] === "=" ? -2 : BASE64_CHARS.indexOf(padded[i + 2] ?? "");
    const c4 = padded[i + 3] === "=" ? -2 : BASE64_CHARS.indexOf(padded[i + 3] ?? "");
    if (c1 < 0 || c2 < 0 || c3 === -1 || c4 === -1) return null;

    const bits = (c1 << 18) | (c2 << 12) | ((c3 < 0 ? 0 : c3) << 6) | (c4 < 0 ? 0 : c4);
    out += String.fromCharCode((bits >> 16) & 255);
    if (c3 >= 0) out += String.fromCharCode((bits >> 8) & 255);
    if (c4 >= 0) out += String.fromCharCode(bits & 255);
  }
  return out;
}

export function isTokenExpiringSoon(
  token: string,
  nowMs: number = Date.now(),
  bufferSec: number = TOKEN_REFRESH_BUFFER_SEC,
): boolean {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return false;
  const decoded = decodeBase64Url(parts[1]);
  if (!decoded) return false;
  try {
    const payload = JSON.parse(decoded) as { exp?: unknown };
    if (typeof payload.exp !== "number") return false;
    return payload.exp * 1000 <= nowMs + bufferSec * 1000;
  } catch {
    return false;
  }
}

export function computeBackoffMs(
  failures: number,
  jitterRatio: number = 0,
): number {
  if (failures <= 0) return 0;
  const base = Math.min(
    MAX_BACKOFF_MS,
    INITIAL_BACKOFF_MS * Math.pow(2, failures - 1),
  );
  return Math.max(1_000, Math.round(base * (1 + jitterRatio)));
}

export function shouldSkipAutoPull(
  lastPullMs: number | null,
  nowMs: number = Date.now(),
): boolean {
  return lastPullMs !== null && nowMs - lastPullMs < PULL_COOLDOWN_MS;
}

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

async function ensureFreshToken(
  deviceId: string,
  token: string,
): Promise<string | null> {
  if (!isTokenExpiringSoon(token)) return token;
  return refreshAccessToken(deviceId);
}

export async function enqueueAllLocalDataForSync(
  db: AppDb = appDb,
): Promise<void> {
  const [
    habitRows,
    logRows,
    freezeRows,
    settingRows,
    heroRows,
    inventoryRows,
  ] = await Promise.all([
    db.select().from(habits),
    db.select().from(habitLogs),
    db.select().from(streakFreezes),
    db.select().from(settings),
    db.select().from(heroProfile),
    db.select().from(userInventory),
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
    for (const f of freezeRows) {
      await enqueueOutbox(tx, {
        entity: "streak_freeze",
        entityId: f.id,
        op: f.deletedAt ? "delete" : "upsert",
        payload: f,
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
    for (const hp of heroRows) {
      await enqueueOutbox(tx, {
        entity: "hero_profile",
        entityId: "singleton",
        op: "upsert",
        payload: hp,
      });
    }
    for (const inv of inventoryRows) {
      await enqueueOutbox(tx, {
        entity: "user_inventory",
        entityId: inv.id,
        op: inv.deletedAt ? "delete" : "upsert",
        payload: inv,
      });
    }
  });
}

async function applyPushAckAndRejections(
  db: AppDb,
  acked: readonly string[],
  rejected: readonly { readonly opId: string; readonly message: string }[],
): Promise<void> {
  if (acked.length > 0) {
    await db.delete(outbox).where(inArray(outbox.opId, [...acked]));
  }
  for (const rej of rejected) {
    await db
      .update(outbox)
      .set({
        attempts: sql`${outbox.attempts} + 1`,
        lastError: rej.message,
      })
      .where(eq(outbox.opId, rej.opId));
  }
}

async function pushOnlyOutbox(
  db: AppDb,
  deviceId: string,
  ops: SyncOp[],
  initialToken: string,
): Promise<SyncResult> {
  let token = initialToken;
  let pushRes = await apiClient.sync.push.$post(
    { json: { deviceId, ops } },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (pushRes.status === 401) {
    const refreshed = await refreshAccessToken(deviceId);
    if (!refreshed) return { kind: "signed_out" };
    token = refreshed;
    pushRes = await apiClient.sync.push.$post(
      { json: { deviceId, ops } },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }

  if (!pushRes.ok) {
    return { kind: "error", message: `Push failed (${pushRes.status})` };
  }

  const pushBody = await pushRes.json();
  await applyPushAckAndRejections(db, pushBody.acked, pushBody.rejected);
  return { kind: "synced", pushed: pushBody.acked.length, pulled: 0 };
}

async function pullRemainingPages(
  db: AppDb,
  deviceId: string,
  startCursor: number,
  initialToken: string,
): Promise<
  | { readonly ok: true; readonly pulled: number }
  | { readonly ok: false; readonly result: SyncResult }
> {
  let cursor = startCursor;
  let pulled = 0;
  let hasMore = true;
  let token = initialToken;

  while (hasMore) {
    let pullRes = await apiClient.sync.pull.$get(
      { query: { cursor: String(cursor), limit: String(PULL_PAGE_LIMIT) } },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (pullRes.status === 401) {
      const refreshed = await refreshAccessToken(deviceId);
      if (!refreshed) return { ok: false, result: { kind: "signed_out" } };
      token = refreshed;
      pullRes = await apiClient.sync.pull.$get(
        { query: { cursor: String(cursor), limit: String(PULL_PAGE_LIMIT) } },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    }
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

async function batchPushAndPull(
  db: AppDb,
  deviceId: string,
  ops: SyncOp[],
  startCursor: number,
  initialToken: string,
): Promise<SyncResult> {
  let token = initialToken;
  let batchRes = await apiClient.sync.batch.$post(
    {
      json: {
        deviceId,
        ops,
        cursor: startCursor,
        limit: PULL_PAGE_LIMIT,
      },
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (batchRes.status === 401) {
    const refreshed = await refreshAccessToken(deviceId);
    if (!refreshed) return { kind: "signed_out" };
    token = refreshed;
    batchRes = await apiClient.sync.batch.$post(
      {
        json: {
          deviceId,
          ops,
          cursor: startCursor,
          limit: PULL_PAGE_LIMIT,
        },
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }

  if (!batchRes.ok) {
    return { kind: "error", message: `Sync failed (${batchRes.status})` };
  }

  const body = await batchRes.json();
  await applyPushAckAndRejections(db, body.acked, body.rejected);

  let pulled = 0;
  if (body.changes.length > 0) {
    await db.transaction((tx) =>
      applyPulledChanges(tx, body.changes, body.nextCursor),
    );
    pulled += body.changes.length;
  }

  if (body.hasMore) {
    const more = await pullRemainingPages(db, deviceId, body.nextCursor, token);
    if (!more.ok) return more.result;
    pulled += more.pulled;
  }

  lastPullAtMs = Date.now();
  return { kind: "synced", pushed: body.acked.length, pulled };
}

async function runSyncInternal(
  db: AppDb,
  mode: SyncMode,
): Promise<SyncResult> {
  const nowMs = Date.now();
  if (mode === "auto" && nowMs < nextAllowedAutoSyncAtMs) {
    return { kind: "synced", pushed: 0, pulled: 0 };
  }

  const auth = await getAuthTokens();
  if (!auth) return { kind: "signed_out" };

  const syncRows = await db
    .select()
    .from(syncState)
    .where(eq(syncState.id, "singleton"));
  const state = syncRows[0];
  if (!state) return { kind: "error", message: "Missing sync_state" };

  const pending = await db
    .select()
    .from(outbox)
    .where(lt(outbox.attempts, MAX_OUTBOX_ATTEMPTS))
    .orderBy(asc(outbox.createdAt))
    .limit(OUTBOX_BATCH_LIMIT);

  const needPull =
    mode === "manual" || !shouldSkipAutoPull(lastPullAtMs, nowMs);

  // Fast path: nothing to push and recent pull is still fresh → 0 network requests.
  if (pending.length === 0 && !needPull) {
    return { kind: "synced", pushed: 0, pulled: 0 };
  }

  const ops: SyncOp[] = pending.map((row) => ({
    opId: row.opId,
    entity: row.entity as OutboxEntity,
    entityId: row.entityId,
    op: row.op as OutboxOpType,
    updatedAt: row.createdAt,
    data: JSON.parse(row.payload) as Record<string, unknown>,
  }));

  try {
    const token = await ensureFreshToken(state.deviceId, auth.accessToken);
    if (!token) return { kind: "signed_out" };

    const result = needPull
      ? await batchPushAndPull(
          db,
          state.deviceId,
          ops,
          state.lastPullCursor,
          token,
        )
      : await pushOnlyOutbox(db, state.deviceId, ops, token);

    if (result.kind === "synced") {
      consecutiveFailures = 0;
      nextAllowedAutoSyncAtMs = 0;
    } else if (result.kind === "error") {
      consecutiveFailures += 1;
      const jitter = (Math.random() * 2 - 1) * 0.2;
      nextAllowedAutoSyncAtMs =
        Date.now() + computeBackoffMs(consecutiveFailures, jitter);
    }
    return result;
  } catch (err) {
    consecutiveFailures += 1;
    const jitter = (Math.random() * 2 - 1) * 0.2;
    nextAllowedAutoSyncAtMs =
      Date.now() + computeBackoffMs(consecutiveFailures, jitter);
    return {
      kind: "error",
      message: err instanceof Error ? err.message : "Network error during sync",
    };
  }
}

export function runSyncCycle(
  db: AppDb = appDb,
  options: { readonly mode?: SyncMode } = {},
): Promise<SyncResult> {
  const mode = options.mode ?? "manual";
  if (!activeSync) {
    activeSync = runSyncInternal(db, mode).finally(() => {
      activeSync = null;
    });
  }
  return activeSync;
}

export function nudgeSync(
  delayMs: number = SYNC_DEBOUNCE_MS,
  db: AppDb = appDb,
): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void runSyncCycle(db, { mode: "auto" });
  }, delayMs);
}

export function flushPendingSync(db: AppDb = appDb): void {
  if (debounceTimer === null) return;
  clearTimeout(debounceTimer);
  debounceTimer = null;
  void runSyncCycle(db, { mode: "auto" });
}
