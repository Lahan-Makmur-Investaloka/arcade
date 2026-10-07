import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { liveSessions, liveViewers } from "../../../../../db/schema";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await context.params;
    const payload = await request.json() as { viewerId?: unknown };
    const viewerId = String(payload.viewerId ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(sessionId) || !/^[0-9a-f-]{36}$/i.test(viewerId)) return Response.json({ error: "Penonton tidak valid." }, { status: 400 });
    const db = getDb();
    const [live] = await db.select({ id: liveSessions.sessionId }).from(liveSessions).where(eq(liveSessions.sessionId, sessionId)).limit(1);
    if (!live) return Response.json({ error: "Siaran telah selesai." }, { status: 404 });
    await db.insert(liveViewers).values({ sessionId, viewerId, updatedAt: Date.now() })
      .onConflictDoUpdate({ target: [liveViewers.sessionId, liveViewers.viewerId], set: { updatedAt: Date.now() } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Status penonton belum tersimpan." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await context.params;
    const payload = await request.json() as { viewerId?: unknown };
    const viewerId = String(payload.viewerId ?? "");
    await getDb().delete(liveViewers).where(and(eq(liveViewers.sessionId, sessionId), eq(liveViewers.viewerId, viewerId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: true });
  }
}
