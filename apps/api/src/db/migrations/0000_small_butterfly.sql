CREATE TABLE "habit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"habit_id" text NOT NULL,
	"log_date" text NOT NULL,
	"value" integer NOT NULL,
	"completed_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"deleted_at" text,
	"server_seq" bigint NOT NULL,
	"last_device_id" text
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT 'check' NOT NULL,
	"color" text DEFAULT 'primary' NOT NULL,
	"type" text DEFAULT 'boolean' NOT NULL,
	"target_value" integer,
	"schedule_type" text DEFAULT 'daily' NOT NULL,
	"schedule_days" integer,
	"schedule_times" integer,
	"reminder_time" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"archived_at" text,
	"start_date" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"deleted_at" text,
	"server_seq" bigint NOT NULL,
	"last_device_id" text
);
--> statement-breakpoint
CREATE TABLE "processed_ops" (
	"user_id" uuid NOT NULL,
	"op_id" text NOT NULL,
	"processed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "processed_ops_user_id_op_id_pk" PRIMARY KEY("user_id","op_id")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"device_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "streak_freezes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"habit_id" text NOT NULL,
	"freeze_date" text NOT NULL,
	"source" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"deleted_at" text,
	"server_seq" bigint NOT NULL,
	"last_device_id" text
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"haptics_enabled" integer DEFAULT 1 NOT NULL,
	"reduce_motion" text DEFAULT 'system' NOT NULL,
	"quality_tier" text DEFAULT 'auto' NOT NULL,
	"day_start_offset_min" integer DEFAULT 0 NOT NULL,
	"backfill_window_days" integer DEFAULT 14 NOT NULL,
	"updated_at" text NOT NULL,
	"server_seq" bigint NOT NULL,
	"last_device_id" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processed_ops" ADD CONSTRAINT "processed_ops_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streak_freezes" ADD CONSTRAINT "streak_freezes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "habit_logs_user_habit_date_uq" ON "habit_logs" USING btree ("user_id","habit_id","log_date");--> statement-breakpoint
CREATE INDEX "habit_logs_user_seq_idx" ON "habit_logs" USING btree ("user_id","server_seq");--> statement-breakpoint
CREATE INDEX "habits_user_seq_idx" ON "habits" USING btree ("user_id","server_seq");--> statement-breakpoint
CREATE UNIQUE INDEX "streak_freezes_user_habit_date_uq" ON "streak_freezes" USING btree ("user_id","habit_id","freeze_date");--> statement-breakpoint
CREATE INDEX "streak_freezes_user_seq_idx" ON "streak_freezes" USING btree ("user_id","server_seq");--> statement-breakpoint
CREATE UNIQUE INDEX "user_settings_user_uq" ON "user_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_settings_user_seq_idx" ON "user_settings" USING btree ("user_id","server_seq");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");