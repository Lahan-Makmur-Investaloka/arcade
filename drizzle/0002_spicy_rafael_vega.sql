CREATE TABLE `live_sessions` (
	`session_id` text PRIMARY KEY NOT NULL,
	`owner_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`distance` integer DEFAULT 0 NOT NULL,
	`elapsed_ms` integer DEFAULT 0 NOT NULL,
	`snapshot` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `live_sessions_updated_idx` ON `live_sessions` (`updated_at`);--> statement-breakpoint
CREATE TABLE `live_viewers` (
	`session_id` text NOT NULL,
	`viewer_id` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `live_viewers_session_viewer_idx` ON `live_viewers` (`session_id`,`viewer_id`);--> statement-breakpoint
CREATE INDEX `live_viewers_updated_idx` ON `live_viewers` (`updated_at`);