CREATE TABLE "hero_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"avatar_class" text DEFAULT 'knight' NOT NULL,
	"equipped_palette_id" text,
	"equipped_aura_id" text,
	"equipped_frame_id" text,
	"updated_at" text NOT NULL,
	"server_seq" bigint NOT NULL,
	"last_device_id" text
);
--> statement-breakpoint
CREATE TABLE "user_inventory" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"item_id" text NOT NULL,
	"category" text NOT NULL,
	"cost_gold" integer NOT NULL,
	"purchased_at" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"deleted_at" text,
	"server_seq" bigint NOT NULL,
	"last_device_id" text
);
--> statement-breakpoint
ALTER TABLE "hero_profiles" ADD CONSTRAINT "hero_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hero_profiles_user_uq" ON "hero_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "hero_profiles_user_seq_idx" ON "hero_profiles" USING btree ("user_id","server_seq");--> statement-breakpoint
CREATE INDEX "user_inventory_user_seq_idx" ON "user_inventory" USING btree ("user_id","server_seq");