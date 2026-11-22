CREATE TABLE `habit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`habit_id` text NOT NULL,
	`log_date` text NOT NULL,
	`value` integer NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `habit_logs_habit_date_uq` ON `habit_logs` (`habit_id`,`log_date`);--> statement-breakpoint
CREATE INDEX `habit_logs_log_date_idx` ON `habit_logs` (`log_date`);--> statement-breakpoint
CREATE TABLE `outbox` (
	`op_id` text PRIMARY KEY NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`op` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`haptics_enabled` integer DEFAULT 1 NOT NULL,
	`reduce_motion` text DEFAULT 'system' NOT NULL,
	`quality_tier` text DEFAULT 'auto' NOT NULL,
	`day_start_offset_min` integer DEFAULT 0 NOT NULL,
	`backfill_window_days` integer DEFAULT 14 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `streak_freezes` (
	`id` text PRIMARY KEY NOT NULL,
	`habit_id` text NOT NULL,
	`freeze_date` text NOT NULL,
	`source` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `streak_freezes_habit_date_uq` ON `streak_freezes` (`habit_id`,`freeze_date`);--> statement-breakpoint
CREATE TABLE `sync_state` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`last_pull_cursor` integer DEFAULT 0 NOT NULL,
	`last_synced_at` text,
	`user_id` text
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_habits` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text DEFAULT 'check' NOT NULL,
	`color` text DEFAULT 'primary' NOT NULL,
	`type` text DEFAULT 'boolean' NOT NULL,
	`target_value` integer,
	`schedule_type` text DEFAULT 'daily' NOT NULL,
	`schedule_days` integer,
	`schedule_times` integer,
	`reminder_time` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` text,
	`start_date` text DEFAULT '2026-01-01' NOT NULL,
	`created_at` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
INSERT INTO `__new_habits`("id", "name", "created_at") SELECT "id", "name", CAST("created_at" AS text) FROM `habits`;--> statement-breakpoint
DROP TABLE `habits`;--> statement-breakpoint
ALTER TABLE `__new_habits` RENAME TO `habits`;--> statement-breakpoint
PRAGMA foreign_keys=ON;