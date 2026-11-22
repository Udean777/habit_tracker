import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const habits = sqliteTable("habits", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("check"),
  color: text("color").notNull().default("primary"),
  type: text("type").notNull().default("boolean"),
  targetValue: integer("target_value"),
  scheduleType: text("schedule_type").notNull().default("daily"),
  scheduleDays: integer("schedule_days"),
  scheduleTimes: integer("schedule_times"),
  reminderTime: text("reminder_time"),
  sortOrder: integer("sort_order").notNull().default(0),
  archivedAt: text("archived_at"),
  startDate: text("start_date").notNull().default("2026-01-01"),
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),
  deletedAt: text("deleted_at"),
});

export const habitLogs = sqliteTable(
  "habit_logs",
  {
    id: text("id").primaryKey(),
    habitId: text("habit_id")
      .notNull()
      .references(() => habits.id),
    logDate: text("log_date").notNull(),
    value: integer("value").notNull(),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    uniqueIndex("habit_logs_habit_date_uq").on(table.habitId, table.logDate),
    index("habit_logs_log_date_idx").on(table.logDate),
  ],
);

export const streakFreezes = sqliteTable(
  "streak_freezes",
  {
    id: text("id").primaryKey(),
    habitId: text("habit_id")
      .notNull()
      .references(() => habits.id),
    freezeDate: text("freeze_date").notNull(),
    source: text("source").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    uniqueIndex("streak_freezes_habit_date_uq").on(
      table.habitId,
      table.freezeDate,
    ),
  ],
);

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(),
  theme: text("theme").notNull().default("system"),
  hapticsEnabled: integer("haptics_enabled").notNull().default(1),
  reduceMotion: text("reduce_motion").notNull().default("system"),
  qualityTier: text("quality_tier").notNull().default("auto"),
  dayStartOffsetMin: integer("day_start_offset_min").notNull().default(0),
  backfillWindowDays: integer("backfill_window_days").notNull().default(14),
  updatedAt: text("updated_at").notNull(),
});

export const outbox = sqliteTable("outbox", {
  opId: text("op_id").primaryKey(),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  op: text("op").notNull(),
  payload: text("payload").notNull(),
  createdAt: text("created_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
});

export const syncState = sqliteTable("sync_state", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  lastPullCursor: integer("last_pull_cursor").notNull().default(0),
  lastSyncedAt: text("last_synced_at"),
  userId: text("user_id"),
});
