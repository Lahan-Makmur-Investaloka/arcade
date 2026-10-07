CREATE TABLE `leaderboard_scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`normalized_name` text NOT NULL,
	`display_name` text NOT NULL,
	`score` integer NOT NULL,
	`distance` integer NOT NULL,
	`hero` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leaderboard_name_idx` ON `leaderboard_scores` (`normalized_name`);