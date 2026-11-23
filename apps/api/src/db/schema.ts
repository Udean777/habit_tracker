import {
  bigint,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("users_email_uq").on(table.email)],
);

export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("oauth_accounts_provider_account_uq").on(
      table.provider,
      table.providerAccountId,
    ),
    index("oauth_accounts_user_idx").on(table.userId),
  ],
);

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  familyId: uuid("family_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  deviceId: text("device_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const habits = pgTable(
  "habits",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
    startDate: text("start_date").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
    serverSeq: bigint("server_seq", { mode: "number" }).notNull(),
    lastDeviceId: text("last_device_id"),
  },
  (table) => [index("habits_user_seq_idx").on(table.userId, table.serverSeq)],
);

export const habitLogs = pgTable(
  "habit_logs",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    habitId: text("habit_id").notNull(),
    logDate: text("log_date").notNull(),
    value: integer("value").notNull(),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
    serverSeq: bigint("server_seq", { mode: "number" }).notNull(),
    lastDeviceId: text("last_device_id"),
  },
  (table) => [
    uniqueIndex("habit_logs_user_habit_date_uq").on(
      table.userId,
      table.habitId,
      table.logDate,
    ),
    index("habit_logs_user_seq_idx").on(table.userId, table.serverSeq),
  ],
);

export const streakFreezes = pgTable(
  "streak_freezes",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    habitId: text("habit_id").notNull(),
    freezeDate: text("freeze_date").notNull(),
    source: text("source").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
    serverSeq: bigint("server_seq", { mode: "number" }).notNull(),
    lastDeviceId: text("last_device_id"),
  },
  (table) => [
    uniqueIndex("streak_freezes_user_habit_date_uq").on(
      table.userId,
      table.habitId,
      table.freezeDate,
    ),
    index("streak_freezes_user_seq_idx").on(table.userId, table.serverSeq),
  ],
);

export const userSettings = pgTable(
  "user_settings",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    theme: text("theme").notNull().default("system"),
    hapticsEnabled: integer("haptics_enabled").notNull().default(1),
    reduceMotion: text("reduce_motion").notNull().default("system"),
    qualityTier: text("quality_tier").notNull().default("auto"),
    dayStartOffsetMin: integer("day_start_offset_min").notNull().default(0),
    backfillWindowDays: integer("backfill_window_days").notNull().default(14),
    updatedAt: text("updated_at").notNull(),
    serverSeq: bigint("server_seq", { mode: "number" }).notNull(),
    lastDeviceId: text("last_device_id"),
  },
  (table) => [
    uniqueIndex("user_settings_user_uq").on(table.userId),
    index("user_settings_user_seq_idx").on(table.userId, table.serverSeq),
  ],
);

export const heroProfiles = pgTable(
  "hero_profiles",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    avatarClass: text("avatar_class").notNull().default("knight"),
    equippedPaletteId: text("equipped_palette_id"),
    equippedAuraId: text("equipped_aura_id"),
    equippedFrameId: text("equipped_frame_id"),
    updatedAt: text("updated_at").notNull(),
    serverSeq: bigint("server_seq", { mode: "number" }).notNull(),
    lastDeviceId: text("last_device_id"),
  },
  (table) => [
    uniqueIndex("hero_profiles_user_uq").on(table.userId),
    index("hero_profiles_user_seq_idx").on(table.userId, table.serverSeq),
  ],
);

export const userInventory = pgTable(
  "user_inventory",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    category: text("category").notNull(),
    costGold: integer("cost_gold").notNull(),
    purchasedAt: text("purchased_at").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
    serverSeq: bigint("server_seq", { mode: "number" }).notNull(),
    lastDeviceId: text("last_device_id"),
  },
  (table) => [
    index("user_inventory_user_seq_idx").on(table.userId, table.serverSeq),
  ],
);

export const processedOps = pgTable(
  "processed_ops",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    opId: text("op_id").notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.opId] })],
);
