import { and, sql } from 'drizzle-orm';
import { getDb } from '../../../db';
import { leaderboardScores } from '../../../db/schema';
import { LEADERBOARD_RESET_AT, LEADERBOARD_RESET_MS } from '../../leaderboard-season';

// Owner-authorized, fixed-cutoff cleanup. Never release a post-reset reservation.
// Both operations execute in one D1 batch, before expiring old score sessions.
export async function releaseLegacyNames() {
  const db = getDb();
  const legacy = and(
    sql`julianday(${leaderboardScores.createdAt}) < julianday(${LEADERBOARD_RESET_AT})`,
    sql`julianday(${leaderboardScores.updatedAt}) < julianday(${LEADERBOARD_RESET_AT})`,
  );
  const unused = and(
    sql`NOT EXISTS (SELECT 1 FROM score_sessions s WHERE s.owner_hash = ${leaderboardScores.ownerHash} AND s.normalized_name = ${leaderboardScores.normalizedName} AND s.started_at >= ${LEADERBOARD_RESET_MS})`,
    sql`NOT EXISTS (SELECT 1 FROM leaderboard_runs r WHERE r.owner_hash = ${leaderboardScores.ownerHash} AND r.normalized_name = ${leaderboardScores.normalizedName} AND r.played_at >= ${LEADERBOARD_RESET_MS})`,
  );
  await db.batch([
    db.delete(leaderboardScores).where(and(legacy, unused)),
    // Remaining legacy names were used after reset. Make that reservation durable,
    // even after session expiry, without reviving their pre-reset high score.
    db.update(leaderboardScores).set({ score: 0, distance: 0, rateScore: 0, rateDistance: 0, updatedAt: new Date().toISOString() }).where(legacy),
  ]);
}
