CREATE TABLE `quiz_sessions` (
 `id` text PRIMARY KEY NOT NULL,
 `owner_hash` text NOT NULL,
 `display_name` text NOT NULL,
 `state` text NOT NULL,
 `revision` integer DEFAULT 0 NOT NULL,
 `status` text NOT NULL,
 `score` integer DEFAULT 0 NOT NULL,
 `elapsed_ms` integer DEFAULT 0 NOT NULL,
 `created_at` integer NOT NULL,
 `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quiz_one_active_owner_idx` ON `quiz_sessions` (`owner_hash`) WHERE `quiz_sessions`.`status` != 'ended';
--> statement-breakpoint
CREATE INDEX `quiz_board_idx` ON `quiz_sessions` (`status`,`score`,`elapsed_ms`);
