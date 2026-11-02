CREATE TABLE IF NOT EXISTS `arcade_auth_sessions` (
	`id_hash` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`expires_at` integer NOT NULL,
	`lock_until` integer DEFAULT 0 NOT NULL,
	`lock_id` text,
	`revision` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `arcade_auth_sessions_expiry_idx` ON `arcade_auth_sessions` (`expires_at`);
