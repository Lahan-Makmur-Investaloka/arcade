import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const leaderboardScores = sqliteTable("leaderboard_scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  normalizedName: text("normalized_name").notNull(),
  displayName: text("display_name").notNull(),
  ownerHash: text("owner_hash"),
  score: integer("score").notNull(),
  distance: integer("distance").notNull(),
  hero: text("hero").notNull(),
  rateScore: integer("rate_score").notNull().default(0),
  rateDistance: integer("rate_distance").notNull().default(0),
  rateHero: text("rate_hero").notNull().default("timmy"),
  rateUpdatedAt: text("rate_updated_at").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("leaderboard_name_idx").on(table.normalizedName),
  uniqueIndex("leaderboard_owner_idx").on(table.ownerHash),
]);

export const leaderboardRuns = sqliteTable("leaderboard_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerHash: text("owner_hash").notNull(),
  normalizedName: text("normalized_name").notNull(),
  displayName: text("display_name").notNull(),
  score: integer("score").notNull(),
  distance: integer("distance").notNull(),
  hero: text("hero").notNull(),
  dayKey: text("day_key").notNull(),
  weekKey: text("week_key").notNull(),
  playedAt: integer("played_at").notNull(),
}, (table) => [
  index("leaderboard_runs_day_score_idx").on(table.dayKey, table.score),
  index("leaderboard_runs_week_score_idx").on(table.weekKey, table.score),
  index("leaderboard_runs_owner_played_idx").on(table.ownerHash, table.playedAt),
]);

export const scoreSessions = sqliteTable("score_sessions", {
  id: text("id").primaryKey(),
  ownerHash: text("owner_hash").notNull(),
  normalizedName: text("normalized_name").notNull(),
  startedAt: integer("started_at").notNull(),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
}, (table) => [
  index("score_sessions_owner_started_idx").on(table.ownerHash, table.startedAt),
]);

export const liveSessions = sqliteTable("live_sessions", {
  sessionId: text("session_id").primaryKey(),
  ownerHash: text("owner_hash").notNull(),
  displayName: text("display_name").notNull(),
  score: integer("score").notNull().default(0),
  distance: integer("distance").notNull().default(0),
  elapsedMs: integer("elapsed_ms").notNull().default(0),
  snapshot: text("snapshot").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [
  index("live_sessions_updated_idx").on(table.updatedAt),
]);

export const liveViewers = sqliteTable("live_viewers", {
  sessionId: text("session_id").notNull(),
  viewerId: text("viewer_id").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [
  uniqueIndex("live_viewers_session_viewer_idx").on(table.sessionId, table.viewerId),
  index("live_viewers_updated_idx").on(table.updatedAt),
]);

export const quizSessions = sqliteTable('quiz_sessions', {
 id: text('id').primaryKey(),
 ownerHash: text('owner_hash').notNull(),
 displayName: text('display_name').notNull(),
 state: text('state').notNull(),
 revision: integer('revision').notNull().default(0),
 status: text('status').notNull(),
 score: integer('score').notNull().default(0),
 elapsedMs: integer('elapsed_ms').notNull().default(0),
 createdAt: integer('created_at').notNull(),
 updatedAt: integer('updated_at').notNull(),
}, t=>[
 uniqueIndex('quiz_one_active_owner_idx').on(t.ownerHash).where(sql`${t.status} != 'ended'`),
 index('quiz_board_idx').on(t.status,t.score,t.elapsedMs),
]);

export const bigTwoRooms = sqliteTable('big_two_rooms', {
 code:text('code').primaryKey(),
 creatorHash:text('creator_hash').notNull(),
 state:text('state').notNull(),
 revision:integer('revision').notNull().default(0),
 seen0:integer('seen0').notNull().default(0),
 seen1:integer('seen1').notNull().default(0),
 seen2:integer('seen2').notNull().default(0),
 seen3:integer('seen3').notNull().default(0),
 createdAt:integer('created_at').notNull(),
 expiresAt:integer('expires_at').notNull(),
},t=>[uniqueIndex('big_two_creator_idx').on(t.creatorHash),index('big_two_expiry_idx').on(t.expiresAt)]);

export const bigTwoLimits=sqliteTable('big_two_limits',{
 id:text('id').primaryKey(),hits:integer('hits').notNull().default(1),expiresAt:integer('expires_at').notNull(),
},t=>[index('big_two_limit_expiry_idx').on(t.expiresAt)]);

export const bigTwoPracticeRecords=sqliteTable('big_two_practice_records',{
 ownerHash:text('owner_hash').primaryKey(),
 state:text('state').notNull(),
 revision:integer('revision').notNull().default(0),
 updatedAt:integer('updated_at').notNull(),
});
