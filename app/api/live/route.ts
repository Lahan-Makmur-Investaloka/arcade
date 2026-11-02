import { and, count, desc, eq, gt, inArray, lt } from "drizzle-orm";
import { getDb } from "../../../db";
import { liveSessions, liveViewers, scoreSessions } from "../../../db/schema";
import { cleanName, normalizeName, playerKeyHash, validName } from "../leaderboard/security";

const LIVE_TTL_MS = 8_000;
const VIEWER_TTL_MS = 12_000;
const MAX_SNAPSHOT_BYTES = 48_000;

export async function GET() {
  try {
    const db = getDb(), now = Date.now();
    await db.batch([
      db.delete(liveSessions).where(lt(liveSessions.updatedAt, now - LIVE_TTL_MS)),
      db.delete(liveViewers).where(lt(liveViewers.updatedAt, now - VIEWER_TTL_MS)),
    ]);
    const rows = await db.select({
      sessionId: liveSessions.sessionId,
      name: liveSessions.displayName,
      score: liveSessions.score,
      distance: liveSessions.distance,
      elapsedMs: liveSessions.elapsedMs,
      updatedAt: liveSessions.updatedAt,
    }).from(liveSessions).where(gt(liveSessions.updatedAt, now - LIVE_TTL_MS)).orderBy(desc(liveSessions.distance)).limit(24);
    const ids = rows.map(row => row.sessionId);
    const counts = ids.length ? await db.select({ sessionId: liveViewers.sessionId, value: count() }).from(liveViewers)
      .where(and(inArray(liveViewers.sessionId, ids), gt(liveViewers.updatedAt, now - VIEWER_TTL_MS))).groupBy(liveViewers.sessionId) : [];
    const viewers = new Map(counts.map(row => [row.sessionId, Number(row.value)]));
    return Response.json({ players: rows.map(row => ({ ...row, viewers: viewers.get(row.sessionId) ?? 0 })) }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "Daftar pemain live belum tersedia." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { sessionId?: unknown; playerKey?: unknown; name?: unknown; score?: unknown; distance?: unknown; elapsedMs?: unknown; snapshot?: unknown };
    const sessionId = String(payload.sessionId ?? ""), name = cleanName(payload.name), normalizedName = normalizeName(name);
    const ownerHash = await playerKeyHash(payload.playerKey), score = Math.floor(Number(payload.score)), distance = Math.floor(Number(payload.distance)), elapsedMs = Math.floor(Number(payload.elapsedMs));
    if (!ownerHash || !/^[0-9a-f-]{36}$/i.test(sessionId) || !validName(name)) return Response.json({ error: "Sesi live tidak valid." }, { status: 401 });
    if (!Number.isFinite(score) || score < 0 || score > 10_000_000 || !Number.isFinite(distance) || distance < 0 || distance > 1_000_000 || !Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs > 2 * 60 * 60 * 1000) return Response.json({ error: "Status live tidak valid." }, { status: 400 });
    const snapshot = JSON.stringify(payload.snapshot ?? null);
    if (snapshot.length < 2 || snapshot.length > MAX_SNAPSHOT_BYTES) return Response.json({ error: "Snapshot live terlalu besar." }, { status: 413 });
    const db = getDb(), now = Date.now();
    const [session] = await db.select().from(scoreSessions).where(eq(scoreSessions.id, sessionId)).limit(1);
    if (!session || session.used || session.ownerHash !== ownerHash || session.normalizedName !== normalizedName) return Response.json({ error: "Sesi live tidak valid." }, { status: 401 });
    await db.insert(liveSessions).values({ sessionId, ownerHash, displayName: name, score, distance, elapsedMs, snapshot, updatedAt: now })
      .onConflictDoUpdate({ target: liveSessions.sessionId, set: { displayName: name, score, distance, elapsedMs, snapshot, updatedAt: now } });
    return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "Status live belum berhasil dikirim." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = await request.json() as { sessionId?: unknown; playerKey?: unknown };
    const sessionId = String(payload.sessionId ?? ""), ownerHash = await playerKeyHash(payload.playerKey);
    if (!ownerHash || !/^[0-9a-f-]{36}$/i.test(sessionId)) return Response.json({ error: "Sesi live tidak valid." }, { status: 401 });
    const db = getDb();
    await db.batch([
      db.delete(liveSessions).where(and(eq(liveSessions.sessionId, sessionId), eq(liveSessions.ownerHash, ownerHash))),
      db.delete(liveViewers).where(eq(liveViewers.sessionId, sessionId)),
    ]);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Sesi live belum berhasil ditutup." }, { status: 500 });
  }
}
