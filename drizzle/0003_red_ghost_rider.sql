ALTER TABLE `leaderboard_scores` ADD `rate_score` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `leaderboard_scores` ADD `rate_distance` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `leaderboard_scores` ADD `rate_hero` text DEFAULT 'timmy' NOT NULL;--> statement-breakpoint
ALTER TABLE `leaderboard_scores` ADD `rate_updated_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE `leaderboard_scores` SET `rate_score` = `score`, `rate_distance` = `distance`, `rate_hero` = `hero`, `rate_updated_at` = `updated_at` WHERE `score` > 0 AND `distance` > 0;
