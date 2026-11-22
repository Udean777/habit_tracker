# DATABASE

Two schemas that mirror each other: **local SQLite** (source of truth for the UI) and **server PostgreSQL** (durability and cross-device convergence). Both are managed with Drizzle. Column names use `snake_case`.

## 1. Conventions

- **IDs:** UUIDv7 generated on the client (`text` in SQLite, `uuid` in Postgres). Time-sortable and safe for offline creation.
- **Timestamps:** `created_at`, `updated_at` as UTC ISO strings (SQLite) / `timestamptz` (Postgres).
- **Soft delete:** `deleted_at` nullable. Rows are never hard-deleted by sync.
- **Local calendar day:** `log_date` is `YYYY-MM-DD` text representing the user's day (after applying the day-start offset). This is not a UTC date.
- **Versioning for sync:** each synced row has `updated_at` plus a `device_id` tiebreaker. Server additionally assigns a monotonically increasing `server_seq` for pull cursors (see `docs/SYNC.md`).
- **Booleans in SQLite:** integer 0/1.

## 2. Local SQLite schema (mobile)

### `habits`
| Column | Type | Notes |
|---|---|---|
| id | text PK | UUIDv7 |
| name | text not null | |
| icon | text not null | icon key |
| color | text not null | theme token key, not raw hex |
| type | text not null | `boolean` \| `count` \| `duration` |
| target_value | integer | null for boolean; count or minutes |
| schedule_type | text not null | `daily` \| `weekdays` \| `times_per_week` |
| schedule_days | integer | bitmask Mon..Sun, for `weekdays` |
| schedule_times | integer | N for `times_per_week` |
| reminder_time | text | `HH:MM` local, nullable |
| sort_order | integer not null | |
| archived_at | text | nullable |
| start_date | text not null | `YYYY-MM-DD` |
| created_at | text not null | |
| updated_at | text not null | |
| deleted_at | text | |

### `habit_logs`
| Column | Type | Notes |
|---|---|---|
| id | text PK | UUIDv7 |
| habit_id | text not null FK → habits.id | |
| log_date | text not null | `YYYY-MM-DD` |
| value | integer not null | 1 for boolean done; amount for count/duration; 0 = cleared |
| completed_at | text | UTC timestamp of the completion gesture |
| created_at, updated_at | text not null | |
| deleted_at | text | |

Constraint: `UNIQUE(habit_id, log_date)` (one log row per habit per day; edits update the row).
Index: `(habit_id, log_date)`, `(log_date)`.

### `streak_freezes`
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| habit_id | text FK | |
| freeze_date | text not null | the missed day that was forgiven |
| source | text | `earned` \| `manual` |
| created_at, updated_at, deleted_at | text | |

Constraint: `UNIQUE(habit_id, freeze_date)`.

### `settings` (single row, synced)
| Column | Type | Notes |
|---|---|---|
| id | text PK | fixed `"singleton"` |
| theme | text | `system` \| `light` \| `dark` |
| haptics_enabled | integer | |
| reduce_motion | text | `system` \| `on` \| `off` |
| quality_tier | text | `auto` \| `high` \| `medium` \| `low` |
| day_start_offset_min | integer | minutes after midnight, default 0 |
| backfill_window_days | integer | default 14 |
| updated_at | text | |

### `outbox`
Pending operations to push. See `docs/SYNC.md`.
| Column | Type | Notes |
|---|---|---|
| op_id | text PK | UUIDv7; the idempotency key |
| entity | text not null | `habit` \| `habit_log` \| `streak_freeze` \| `settings` |
| entity_id | text not null | |
| op | text not null | `upsert` \| `delete` |
| payload | text not null | JSON snapshot of the row |
| created_at | text not null | |
| attempts | integer not null default 0 | |
| last_error | text | |

### `sync_state` (single row)
| Column | Type | Notes |
|---|---|---|
| id | text PK | `"singleton"` |
| device_id | text not null | generated once per install |
| last_pull_cursor | integer not null default 0 | server_seq |
| last_synced_at | text | |
| user_id | text | null in guest mode |

## 3. Server PostgreSQL schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | citext unique not null | |
| password_hash | text not null | Argon2id |
| created_at, updated_at | timestamptz | |
| deleted_at | timestamptz | |

### `refresh_tokens`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| family_id | uuid not null | rotation family; reuse revokes family |
| token_hash | text unique not null | SHA-256 of the opaque token |
| device_id | text | |
| expires_at | timestamptz | |
| revoked_at | timestamptz | |
| created_at | timestamptz | |

### `habits`, `habit_logs`, `streak_freezes`, `user_settings`
Same columns as local, plus:

| Extra column | Type | Notes |
|---|---|---|
| user_id | uuid not null FK | row owner; all queries are scoped by it |
| server_seq | bigint not null | assigned from a global sequence on every insert/update; used as the pull cursor |
| last_device_id | text | device that produced the winning write |

Constraints/indexes:
- `habit_logs`: `UNIQUE(user_id, habit_id, log_date)`
- `(user_id, server_seq)` index on every synced table (pull queries)
- FK `habit_id` with `ON DELETE CASCADE` only for account deletion; normal deletes are soft

### `processed_ops`
Idempotency record for pushed operations.
| Column | Type | Notes |
|---|---|---|
| user_id | uuid | |
| op_id | uuid | |
| processed_at | timestamptz | |

PK `(user_id, op_id)`. Prune entries older than a retention window (for example 90 days) with a scheduled job.

## 4. Migration Rules

- Generate with `drizzle-kit`; commit the SQL and snapshot.
- Never edit an applied migration. Add a new one.
- Client migrations are bundled with the app and run before the first query at startup. Test upgrading from every released schema version.
- Destructive changes (drop column) require a two-step rollout: stop reading → release → drop later.

## 5. Data Lifecycle

- **Export:** `/account/export` returns all of a user's rows as JSON (and the app can produce CSV locally).
- **Account deletion:** hard-delete the user and cascade all rows and tokens; confirm with the user in-app first.
- **Guest → account:** local rows are re-stamped with the new `user_id` context by enqueueing every existing row into the outbox on first login.
