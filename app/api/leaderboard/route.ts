import { releaseLegacyNames } from "./release-legacy-names";
import { LEADERBOARD_RESET_AT, LEADERBOARD_RESET_MS } from "../../leaderboard-season";
import { and, asc, desc, eq, gt, gte, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { leaderboardRuns, leaderboardScores, scoreSessions } from "../../../db/schema";
import { cleanName, HEROES, normalizeName, playerKeyHash, validName } from "./security";

const SESSION_MAX_AGE_MS = 2 * 60 * 60 * 1000;

type Period = "day" | "week" | "all";
type BoardRow = { name: string; score: number; distance: number; hero: string; ownerHash?: string | null; normalizedName?: string };

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function dateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function jakartaKeys(timestamp = Date.now()) {
  const local = new Date(timestamp + JAKARTA_OFFSET_MS);
  const dayKey = dateKey(local);
  const daysSinceMonday = (local.getUTCDay() + 6) % 7;
  const weekKey = dateKey(new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - daysSinceMonday * DAY_MS));
  return { dayKey, weekKey };
}

async function boardWithPlayer(name = "", period: Period = "all", requestedWeek = "") {
  await releaseLegacyNames();
  const db = getDb();
  const { dayKey, weekKey: currentWeekKey } = jakartaKeys();
  const weekKey = /^\d{4}-\d{2}-\d{2}$/.test(requestedWeek) ? requestedWeek : currentWeekKey;
  let rankedRows: BoardRow[];
  if (period === "all") {
    rankedRows = await db.select({ name: leaderboardScores.displayName, score: leaderboardScores.score, distance: leaderboardScores.distance, hero: leaderboardScores.hero, ownerHash: leaderboardScores.ownerHash, normalizedName: leaderboardScores.normalizedName })
      .from(leaderboardScores).where(and(gt(leaderboardScores.score, 0), sql`julianday(${leaderboardScores.updatedAt}) >= julianday(${LEADERBOARD_RESET_AT})`)).orderBy(desc(leaderboardScores.score), desc(leaderboardScores.distance), asc(leaderboardScores.updatedAt));
  } else {
    const filter = period === "day" ? eq(leaderboardRuns.dayKey, dayKey) : eq(leaderboardRuns.weekKey, weekKey);
    const runs = await db.select({ name: leaderboardRuns.displayName, score: leaderboardRuns.score, distance: leaderboardRuns.distance, hero: leaderboardRuns.hero, ownerHash: leaderboardRuns.ownerHash, normalizedName: leaderboardRuns.normalizedName })
      .from(leaderboardRuns).where(and(filter, gte(leaderboardRuns.playedAt, LEADERBOARD_RESET_MS))).orderBy(desc(leaderboardRuns.score), desc(leaderboardRuns.distance), asc(leaderboardRuns.playedAt));
    const seen = new Set<string>();
    rankedRows = runs.filter(row => { if (seen.has(row.ownerHash)) return false; seen.add(row.ownerHash); return true; });
  }
  const board = rankedRows.slice(0, 20).map(({ name: rowName, score, distance, hero }) => ({ name: rowName, score, distance, hero }));
  let player: { name: string; score: number; distance: number; hero: string; rank: number } | null = null;
  if (name) {
    const normalized = normalizeName(name);
    const index = rankedRows.findIndex(row => row.normalizedName === normalized);
    if (index >= 0) { const row = rankedRows[index]; player = { name: row.name, score: row.score, distance: row.distance, hero: row.hero, rank: index + 1 }; }
  }
  const weeks = await db.selectDistinct({ weekKey: leaderboardRuns.weekKey }).from(leaderboardRuns).where(gte(leaderboardRuns.playedAt, LEADERBOARD_RESET_MS)).orderBy(desc(leaderboardRuns.weekKey)).limit(52);
  const availableWeeks = Array.from(new Set([currentWeekKey, ...weeks.map(row => row.weekKey)]));
  return { board, player, period, dayKey, weekKey, currentWeekKey, availableWeeks };
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const name = cleanName(params.get("name"));
    const period = (["day", "week", "all"].includes(params.get("period") ?? "") ? params.get("period") : "all") as Period;
    return Response.json(await boardWithPlayer(name, period, params.get("week") ?? ""), { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "Leaderboard belum tersedia." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { name?: unknown; score?: unknown; distance?: unknown; hero?: unknown; playerKey?: unknown; sessionId?: unknown };
    const name = cleanName(payload.name), score = Math.floor(Number(payload.score)), distance = Math.floor(Number(payload.distance)), hero = String(payload.hero ?? "");
    const sessionId = String(payload.sessionId ?? ""), ownerHash = await playerKeyHash(payload.playerKey);
    if (!validName(name)) return Response.json({ error: "Gunakan nama 2–18 karakter." }, { status: 400 });
    if (!ownerHash || !/^[0-9a-f-]{36}$/i.test(sessionId)) return Response.json({ error: "Sesi ranking tidak valid." }, { status: 401 });
    if (!Number.isFinite(score) || score < 0 || score > 10_000_000 || !Number.isFinite(distance) || distance < 0 || distance > 1_000_000 || !HEROES.has(hero)) return Response.json({ error: "Data skor tidak valid." }, { status: 400 });
    if (score > distance * 40 + 2_500) return Response.json({ error: "Skor tidak dapat diverifikasi." }, { status: 400 });

    const db = getDb(), normalizedName = normalizeName(name), now = Date.now();
    const [session] = await db.select().from(scoreSessions).where(eq(scoreSessions.id, sessionId)).limit(1);
    if (!session || session.startedAt < LEADERBOARD_RESET_MS || session.used || session.ownerHash !== ownerHash || session.normalizedName !== normalizedName) return Response.json({ error: "Sesi ranking tidak valid atau sudah digunakan." }, { status: 401 });
    const elapsedMs = now - session.startedAt;
    if (elapsedMs < 500 || elapsedMs > SESSION_MAX_AGE_MS || distance > elapsedMs / 1000 * 45 + 35) return Response.json({ error: "Jarak tidak sesuai dengan durasi permainan." }, { status: 400 });

    const consumed = await db.update(scoreSessions).set({ used: true }).where(and(eq(scoreSessions.id, sessionId), eq(scoreSessions.used, false))).returning({ id: scoreSessions.id });
    if (consumed.length !== 1) return Response.json({ error: "Sesi ranking sudah digunakan." }, { status: 409 });

    const [existing] = await db.select().from(leaderboardScores).where(eq(leaderboardScores.ownerHash, ownerHash)).limit(1);
    if (!existing || existing.normalizedName !== normalizedName) return Response.json({ error: "Kepemilikan nama tidak cocok." }, { status: 409 });
    const { dayKey, weekKey } = jakartaKeys(now);
    await db.insert(leaderboardRuns).values({ ownerHash, normalizedName, displayName: name, score, distance, hero, dayKey, weekKey, playedAt: now });
    if (Date.parse(existing.updatedAt) < LEADERBOARD_RESET_MS || score > existing.score || (score === existing.score && distance > existing.distance)) {
      await db.update(leaderboardScores).set({ displayName: name, score, distance, hero, updatedAt: sqlNow() }).where(eq(leaderboardScores.id, existing.id));
    }
    return Response.json(await boardWithPlayer(name));
  } catch {
    return Response.json({ error: "Skor belum berhasil disimpan." }, { status: 500 });
  }
}

function sqlNow() {
  return new Date().toISOString();
}
