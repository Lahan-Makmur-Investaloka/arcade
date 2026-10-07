import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../../../../db";
import { liveSessions } from "../../../../db/schema";

const LIVE_TTL_MS = 8_000;

export async function GET(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return Response.json({ error: "Siaran tidak ditemukan." }, { status: 404 });
    const [row] = await getDb().select({ name: liveSessions.displayName, score: liveSessions.score, distance: liveSessions.distance, elapsedMs: liveSessions.elapsedMs, snapshot: liveSessions.snapshot, updatedAt: liveSessions.updatedAt })
      .from(liveSessions).where(and(eq(liveSessions.sessionId, sessionId), gt(liveSessions.updatedAt, Date.now() - LIVE_TTL_MS))).limit(1);
    if (!row) return Response.json({ error: "Siaran telah selesai." }, { status: 404 });
    return Response.json({ ...row, snapshot: JSON.parse(row.snapshot) }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "Siaran belum dapat dimuat." }, { status: 500 });
  }
}
