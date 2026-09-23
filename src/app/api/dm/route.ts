import { NextResponse } from "next/server";
import { eq, and, or, inArray, sql, gte } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db";
import * as s from "@/db/schema";
import { toPublic } from "@/lib/auth";
import { jerr, needUser } from "@/lib/server";
import { moderate } from "@/lib/moderation";
import { emit, dmTarget } from "@/lib/liveBus";
import { isUnlimited, addPoints, FREE_LIMITS } from "@/lib/points";

export const dynamic = "force-dynamic";

async function findDm(id: string, userId: string) {
  const rows = await db.select().from(s.dms).where(eq(s.dms.id, id)).limit(1);
  const d = rows[0];
  if (!d || (d.a !== userId && d.b !== userId)) return null;
  return d;
}

export async function GET(req: Request) {
  const u = await needUser();
  if (!u) return jerr("nope", 401);
  const url = new URL(req.url);
  const dmId = url.searchParams.get("dm");

  const myDms = await db
    .select()
    .from(s.dms)
    .where(or(eq(s.dms.a, u.id), eq(s.dms.b, u.id)))
    .orderBy(s.dms.createdAt);

  const dmIds = myDms.map((d) => d.id);
  const msgs = dmIds.length
    ? await db.select().from(s.dmMessages).where(and(inArray(s.dmMessages.dmId, dmIds), eq(s.dmMessages.hidden, false)))
    : [];

  const byDm = new Map<string, typeof msgs>();
  for (const m of msgs) {
    const arr = byDm.get(m.dmId) ?? [];
    arr.push(m);
    byDm.set(m.dmId, arr);
  }

  // latest peer per dm
  const peerIds = myDms
    .map((d) => (d.a === u.id ? d.b : d.a))
    .filter((v, i, a) => a.indexOf(v) === i);
  const peers = new Map(
    (peerIds.length ? await db.select().from(s.users).where(inArray(s.users.id, peerIds)) : []).map((p) => [p.id, p])
  );

  const conversations = myDms.map((d) => {
    const peerId = d.a === u.id ? d.b : d.a;
    const list = byDm.get(d.id) ?? [];
    const last = list[list.length - 1];
    const lastRead = d.a === u.id ? d.lastReadB : d.lastReadA;
    const unread = last
      ? list.filter((m) => m.senderId === peerId && (!lastRead || m.createdAt > lastRead)).length
      : 0;
    const peer = peers.get(peerId);
    return {
      dmId: d.id,
      peer: peer ? toPublic(peer) : null,
      last: last ? { content: last.content, kind: last.kind, at: last.createdAt, mine: last.senderId === u.id } : null,
      unread,
    };
  });
  conversations.sort((a, b) => (b.last?.at ?? b.peer?.createdAt ?? new Date(0)).getTime() - (a.last?.at ?? a.peer?.createdAt ?? new Date(0)).getTime());

  if (dmId) {
    const d = await findDm(dmId, u.id);
    if (!d) return jerr("dm not found", 404);
    const peerId = d.a === u.id ? d.b : d.a;
    const [peerRows, dmMsgs] = await Promise.all([
      db.select().from(s.users).where(eq(s.users.id, peerId)).limit(1),
      db.select().from(s.dmMessages).where(and(eq(s.dmMessages.dmId, d.id), eq(s.dmMessages.hidden, false))).orderBy(s.dmMessages.createdAt).limit(200),
    ]);
    return NextResponse.json({
      dm: d,
      peer: peerRows[0] ? toPublic(peerRows[0]) : null,
      messages: dmMsgs.slice(-80),
    });
  }

  return NextResponse.json({ conversations });
}

export async function POST(req: Request) {
  const u = await needUser();
  if (!u) return jerr("nope", 401);
  const body = await req.json().catch(() => ({}));

  if (body.action === "start") {
    const peerId = String(body.peerId ?? "");
    if (peerId === u.id) return jerr("self", 400);
    const [peer] = await db.select().from(s.users).where(eq(s.users.id, peerId)).limit(1);
    if (!peer || peer.banned) return jerr("peer", 404);
    if (peer.ageGroup !== u.ageGroup) return jerr("age", 403);
    const pair = [u.id, peerId].sort();
    const existing = await db.select().from(s.dms).where(and(eq(s.dms.a, pair[0]), eq(s.dms.b, pair[1]))).limit(1);
    if (existing[0]) return NextResponse.json({ dmId: existing[0].id });
    const id = crypto.randomUUID();
    await db.insert(s.dms).values({ id, a: pair[0], b: pair[1] });
    return NextResponse.json({ dmId: id });
  }

  if (body.action === "send") {
    const d = await findDm(String(body.dmId ?? ""), u.id);
    if (!d) return jerr("dm not found", 404);
    if (!isUnlimited(u)) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      const [drow] = await db
        .select({ n: sql`count(*)::int` })
        .from(s.dmMessages)
        .where(and(eq(s.dmMessages.senderId, u.id), gte(s.dmMessages.createdAt, dayStart)))
        .limit(1);
      const dn = Number(drow?.n ?? 0);
      if (dn >= FREE_LIMITS.dmPerDay) return jerr("limit", 403);
    }
    const kind = body.kind === "voice" ? "voice" : "text";
    let content = String(body.content ?? "");
    let flagged = false;
    if (kind === "voice") {
      if (!content.startsWith("data:audio") || content.length > 400000) return jerr("voice", 400);
    } else {
      content = content.trim();
      if (!content || content.length > 500) return jerr("text", 400);
      const r = moderate(content, u.language);
      content = r.clean;
      flagged = r.hits > 0 || r.scam;
    }
    const m = await db
      .insert(s.dmMessages)
      .values({ id: crypto.randomUUID(), dmId: d.id, senderId: u.id, kind, content })
      .returning();
    const [m2] = m;
    addPoints(u.id, 3).catch(() => {});
    emit(dmTarget(d.id), "dm", {
      id: m2.id, dmId: d.id, senderId: u.id, kind: m2.kind, content: m2.content,
      createdAt: m2.createdAt.toISOString(),
    });

    // declared bot replies once in the welcome DM
    const peerId = d.a === u.id ? d.b : d.a;
    const [peer] = await db.select().from(s.users).where(eq(s.users.id, peerId)).limit(1);
    if (peer?.isBot && kind === "text") {
      const cnt = (await db.select({ n: sql`count(*)::int` }).from(s.dmMessages).where(and(eq(s.dmMessages.dmId, d.id), eq(s.dmMessages.senderId, u.id))).limit(1))[0]?.n ?? 0;
      if (cnt === 1) {
        setTimeout(() => {
          void (async () => {
            try {
              const [b2] = await db.insert(s.dmMessages).values({
                id: crypto.randomUUID(),
                dmId: d.id,
                senderId: peerId,
                content:
                  u.language === "en"
                    ? "Got it. I'm here if you need the moderation queue, your profile settings, or just a friendly check-in."
                    : "Ricevuto. Sono qui se ti serve la coda moderazione, le impostazioni del profilo, o solo un check-in gentile.",
              }).returning();
              emit(dmTarget(d.id), "dm", {
                id: b2.id, dmId: d.id, senderId: peerId, kind: "text",
                content: b2.content, createdAt: b2.createdAt.toISOString(),
              });
            } catch {}
          })();
        }, 2500 + Math.random() * 2000);
      }
    }
    return NextResponse.json({ message: m[0] });
  }

  if (body.action === "read") {
    const d = await findDm(String(body.dmId ?? ""), u.id);
    if (!d) return jerr("dm not found", 404);
    const now = new Date();
    await db
      .update(s.dms)
      .set(d.a === u.id ? { lastReadB: now } : { lastReadA: now })
      .where(eq(s.dms.id, d.id));
    return NextResponse.json({ ok: true });
  }

  return jerr("bad action", 400);
}
