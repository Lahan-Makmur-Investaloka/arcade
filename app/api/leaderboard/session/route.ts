import { releaseLegacyNames } from "../release-legacy-names";
import { and, count, eq, gt, isNull, lt } from "drizzle-orm";
import { getDb } from "../../../../db";
import { leaderboardScores, scoreSessions } from "../../../../db/schema";
import { cleanName, normalizeName, playerKeyHash, validName } from "../security";

const SESSION_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const SESSION_RATE_WINDOW_MS = 60 * 1000;
const SESSION_RATE_LIMIT = 5;

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { name?: unknown; playerKey?: unknown };
    const name = cleanName(payload.name), normalizedName = normalizeName(name);
    const ownerHash = await playerKeyHash(payload.playerKey);
    if (!validName(name)) return Response.json({ error: "Gunakan nama 2–18 karakter." }, { status: 400 });
    if (!ownerHash) return Response.json({ error: "Identitas pemain tidak valid." }, { status: 400 });

    await releaseLegacyNames();
    const db = getDb(), now = Date.now();
    await db.delete(scoreSessions).where(lt(scoreSessions.startedAt, now - SESSION_MAX_AGE_MS));

    const [recent] = await db.select({ value: count() }).from(scoreSessions).where(and(
      eq(scoreSessions.ownerHash, ownerHash),
      gt(scoreSessions.startedAt, now - SESSION_RATE_WINDOW_MS),
    ));
    if (Number(recent?.value ?? 0) >= SESSION_RATE_LIMIT) {
      return Response.json({ error: "Terlalu banyak sesi baru. Tunggu sebentar." }, { status: 429 });
    }

    const [ownedRow] = await db.select().from(leaderboardScores).where(eq(leaderboardScores.ownerHash, ownerHash)).limit(1);
    const [nameRow] = await db.select().from(leaderboardScores).where(eq(leaderboardScores.normalizedName, normalizedName)).limit(1);

    if (nameRow?.ownerHash && nameRow.ownerHash !== ownerHash) {
      return Response.json({ error: "Nama ini sudah digunakan di perangkat lain." }, { status: 409 });
    }

    if (ownedRow && ownedRow.normalizedName !== normalizedName) {
      if (nameRow && nameRow.id !== ownedRow.id) {
        return Response.json({ error: "Nama ini sudah digunakan di perangkat lain." }, { status: 409 });
      }
      await db.update(leaderboardScores).set({ normalizedName, displayName: name }).where(eq(leaderboardScores.id, ownedRow.id));
    } else if (nameRow && !nameRow.ownerHash) {
      // Existing pre-security scores are claimed once by the first returning device.
      const claimed = await db.update(leaderboardScores).set({ ownerHash, displayName: name }).where(and(eq(leaderboardScores.id, nameRow.id), isNull(leaderboardScores.ownerHash))).returning({ id: leaderboardScores.id });
      if (claimed.length !== 1) return Response.json({ error: "Nama ini baru saja digunakan di perangkat lain." }, { status: 409 });
    } else if (!ownedRow && !nameRow) {
      // Reserve the name immediately so two devices cannot claim it concurrently.
      await db.insert(leaderboardScores).values({ normalizedName, displayName: name, ownerHash, score: 0, distance: 0, hero: "timmy" });
    }

    const sessionId = crypto.randomUUID();
    await db.insert(scoreSessions).values({ id: sessionId, ownerHash, normalizedName, startedAt: now, used: false });
    return Response.json({ sessionId }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "Sesi ranking belum dapat dibuat." }, { status: 500 });
  }
}
