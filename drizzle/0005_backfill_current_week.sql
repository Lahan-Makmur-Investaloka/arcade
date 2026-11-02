INSERT INTO `leaderboard_runs` (
	`owner_hash`,
	`normalized_name`,
	`display_name`,
	`score`,
	`distance`,
	`hero`,
	`day_key`,
	`week_key`,
	`played_at`
)
SELECT
	`s`.`owner_hash`,
	`s`.`normalized_name`,
	`s`.`display_name`,
	`s`.`score`,
	`s`.`distance`,
	`s`.`hero`,
	date(`s`.`updated_at`, '+7 hours'),
	'2026-08-17',
	CAST(strftime('%s', `s`.`updated_at`) AS INTEGER) * 1000
FROM `leaderboard_scores` AS `s`
WHERE `s`.`owner_hash` IS NOT NULL
	AND `s`.`score` > 0
	AND datetime(`s`.`updated_at`) >= '2026-08-16 17:00:00'
	AND datetime(`s`.`updated_at`) < '2026-08-23 17:00:00'
	AND NOT EXISTS (
		SELECT 1
		FROM `leaderboard_runs` AS `r`
		WHERE `r`.`owner_hash` = `s`.`owner_hash`
			AND `r`.`week_key` = '2026-08-17'
			AND `r`.`score` = `s`.`score`
			AND `r`.`distance` = `s`.`distance`
	);
