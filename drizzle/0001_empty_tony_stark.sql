CREATE TABLE `score_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_hash` text NOT NULL,
	`normalized_name` text NOT NULL,
	`started_at` integer NOT NULL,
	`used` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `score_sessions_owner_started_idx` ON `score_sessions` (`owner_hash`,`started_at`);--> statement-breakpoint
ALTER TABLE `leaderboard_scores` ADD `owner_hash` text;--> statement-breakpoint
CREATE UNIQUE INDEX `leaderboard_owner_idx` ON `leaderboard_scores` (`owner_hash`);