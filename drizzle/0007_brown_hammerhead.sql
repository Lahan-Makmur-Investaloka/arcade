CREATE TABLE `big_two_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`hits` integer DEFAULT 1 NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `big_two_limit_expiry_idx` ON `big_two_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `big_two_rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`creator_hash` text NOT NULL,
	`state` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`seen0` integer DEFAULT 0 NOT NULL,
	`seen1` integer DEFAULT 0 NOT NULL,
	`seen2` integer DEFAULT 0 NOT NULL,
	`seen3` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `big_two_creator_idx` ON `big_two_rooms` (`creator_hash`);--> statement-breakpoint
CREATE INDEX `big_two_expiry_idx` ON `big_two_rooms` (`expires_at`);