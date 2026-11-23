CREATE TABLE `hero_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`avatar_class` text DEFAULT 'knight' NOT NULL,
	`equipped_palette_id` text,
	`equipped_aura_id` text,
	`equipped_frame_id` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`category` text NOT NULL,
	`cost_gold` integer NOT NULL,
	`purchased_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `user_inventory_item_idx` ON `user_inventory` (`item_id`);