CREATE TABLE `leaderboard_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_hash` text NOT NULL,
	`normalized_name` text NOT NULL,
	`display_name` text NOT NULL,
	`score` integer NOT NULL,
	`distance` integer NOT NULL,
	`hero` text NOT NULL,
	`day_key` text NOT NULL,
	`week_key` text NOT NULL,
	`played_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `leaderboard_runs_day_score_idx` ON `leaderboard_runs` (`day_key`,`score`);--> statement-breakpoint
CREATE INDEX `leaderboard_runs_week_score_idx` ON `leaderboard_runs` (`week_key`,`score`);--> statement-breakpoint
CREATE INDEX `leaderboard_runs_owner_played_idx` ON `leaderboard_runs` (`owner_hash`,`played_at`);