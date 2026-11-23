# SYNC

Offline-first synchronization between the local SQLite database and the server. The design favors simplicity and determinism over generality: **per-row last-write-wins with idempotent operations**.

## 1. Principles

1. The UI never waits on the network.
2. Every local write is also an `outbox` entry, created in the **same transaction**.
3. Pushes are **idempotent** (dedupe by `op_id`) so retries are always safe.
4. Pulls are **cursor-based** using a server-assigned monotonic `server_seq`.
5. Conflicts resolve deterministically, and all devices converge to the same state.

## 2. Entities

Synced: `habit`, `habit_log`, `streak_freeze`, `settings`, `hero_profile`, `user_inventory`.
Not synced: `outbox`, `sync_state`, ephemeral UI state, notification schedules (rebuilt locally).

## 3. Write Path (local)

```
user action
  → BEGIN TRANSACTION
      upsert row (set updated_at = now, bump as needed)
      insert outbox(op_id=uuidv7, entity, entity_id, op, payload=row snapshot)
    COMMIT
  → UI updates via live query
  → sync engine is nudged (debounced)
```

Coalescing: if an outbox entry for the same `(entity, entity_id)` is still pending and unsent, replace its payload with the newest snapshot instead of adding another entry. Keep the original ordering position.

## 4. Sync Engine

Triggers: app foreground, connectivity regained, after a local write (debounced ~2 s), periodic timer while foregrounded, and a background task (best-effort).

Cycle (single-flight; never run two at once):

1. **Push:** read up to N (for example 100) outbox entries oldest-first → `POST /sync/push`.
2. On success, delete the acknowledged entries. On partial success, delete only acknowledged `op_id`s.
3. **Pull:** `GET /sync/pull?cursor=<last_pull_cursor>&limit=500`, apply changes in a transaction, update the cursor. Repeat while `has_more`.
4. Update `last_synced_at` and the UI status.

Failure handling:
- Network error: keep entries, retry with exponential backoff + jitter (cap ~5 min).
- `401`: run token refresh once and retry; on failure, mark signed-out but keep local data and the outbox.
- `4xx` validation error on an op: mark `last_error`, increment `attempts`, move to a quarantine state after 5 attempts and surface in a debug screen. A poisoned op must never block the queue.
- `5xx`: treat as retryable.

## 5. API Contract

### `POST /sync/push`

Request:
```json
{
  "device_id": "string",
  "ops": [
    {
      "op_id": "uuid",
      "entity": "habit_log",
      "entity_id": "uuid",
      "op": "upsert",
      "updated_at": "2026-11-22T09:15:00.000Z",
      "data": { "...": "entity fields" }
    }
  ]
}
```

Response:
```json
{
  "acked": ["op_id", "…"],
  "rejected": [{ "op_id": "uuid", "code": "VALIDATION_ERROR", "message": "…" }],
  "server_time": "2026-11-22T09:15:01.200Z"
}
```

Server behavior per op (inside one transaction per op or batch):
1. If `(user_id, op_id)` exists in `processed_ops` → ack without applying.
2. Validate `data` against the shared Zod schema; force `user_id` from the auth token, never the payload.
3. Apply conflict resolution (section 6).
4. Assign `server_seq` from the global sequence **only if the row actually changed**.
5. Insert into `processed_ops`; add to `acked`.

### `GET /sync/pull`

Query: `cursor` (int, default 0), `limit` (default 500).

Response:
```json
{
  "changes": [
    { "entity": "habit", "entity_id": "uuid", "op": "upsert", "data": { }, "server_seq": 1042 }
  ],
  "next_cursor": 1042,
  "has_more": false
}
```

Rows include tombstones (`deleted_at` set) so deletions propagate. The pulling device skips changes it originated when `last_device_id == device_id` only as an optimization. Correctness must not depend on it.

## 6. Conflict Resolution

Rule: **last-write-wins per row**, ordered by `(updated_at, device_id)` where `device_id` is a deterministic tiebreaker (lexicographic).

- Incoming row wins if `incoming.updated_at > stored.updated_at`, or equal and `incoming.device_id > stored.last_device_id`.
- Otherwise the server keeps the stored row and still acks the op (it was processed, just superseded).
- The loser's device receives the winning row on its next pull and overwrites its local copy.

Entity-specific notes:

| Entity | Note |
|---|---|
| `habit_log` | Unique on `(habit_id, log_date)`. If two devices created different IDs for the same habit and day offline, the server merges by the unique key: the winner by LWW keeps its ID, the loser's row is tombstoned, and the client remaps on pull. |
| `habit` | Whole-row LWW. Field-level merge is a possible later improvement. |
| `streak_freeze` | Unique on `(habit_id, freeze_date)`, same merge approach as logs. |
| `settings` | Whole-row LWW. |
| `hero_profile` | Singleton per user, whole-row LWW. |
| `user_inventory` | Immutable purchase rows (UUIDv7) with soft-delete LWW; total spent gold is derived from active rows so balances converge offline without conflict. |
| deletes | A delete is an upsert with `deleted_at`; it wins or loses by the same rule. A later edit can resurrect only if its `updated_at` is newer. |

### Clock skew

Device clocks can be wrong. Mitigations:
- The server returns `server_time` on every push; the client stores `clock_offset = server_time - local_time_at_response` and applies it when stamping `updated_at` (with sanity bounds).
- The server rejects ops with `updated_at` more than a configured amount in the future (for example 24 h), asking the client to re-stamp.
- Upgrade path if skew proves a problem in practice: replace timestamps with a **Hybrid Logical Clock (HLC)**. The schema reserves `updated_at` semantics for this.

## 7. Guest → Account Transition

1. User registers or logs in; tokens are stored.
2. If local rows exist with no user association, enqueue **every** existing row into the outbox as an `upsert`.
3. Run a normal push then pull. Merge follows the same LWW rules, so signing in on a device that already has server data merges rather than overwrites.
4. Set `sync_state.user_id`.

On logout: stop the sync engine. Offer to keep or wipe local data. On switching to a *different* account, require wiping local data first to avoid cross-account leakage.

## 8. Status UI

| State | Meaning | Indicator |
|---|---|---|
| `synced` | Outbox empty, last pull ok | Subtle check |
| `pending` | Outbox non-empty | Small dot with count |
| `syncing` | Cycle in progress | Subtle animation |
| `offline` | No connectivity | Muted offline icon |
| `error` | Repeated failure or quarantined ops | Tappable, opens details |

Sync status must never be loud. It must not compete with the World visuals.

## 9. Testing Requirements

- Idempotency: pushing the same `op_id` twice changes nothing.
- Convergence: two simulated devices with interleaved offline edits end in identical state (property-based test with random operation sequences).
- Unique-key merge for `habit_log` created concurrently on two devices.
- Tombstone propagation and resurrection rules.
- Crash safety: kill between local commit and push; nothing is lost or duplicated.
- Poisoned op does not block the queue.
- Clock skew: devices ±1 h and ±1 day.
- Large backlog (10k ops) paginates without memory spikes.

## 10. Future Improvements (not v1)

- Field-level merge for `habit`
- HLC timestamps
- Server-sent events or push notification to trigger pulls
- Compression for large pushes
