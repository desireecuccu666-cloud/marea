import { NextResponse } from "next/server";
import { eq, and, ne, gte, inArray } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db";
import * as s from "@/db/schema";
import { toPublic } from "@/lib/auth";
import { jerr, needUser } from "@/lib/server";
import { isUnlimited, addPoints } from "@/lib/points";

export const dynamic = "force-dynamic";

const FREE_DAILY_LIMIT = 5;

export async function GET() {
  const u = await needUser();
  if (!u) return jerr("nope", 401);
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const [matches, usedRows] = await Promise.all([
    db
      .select()
      .from(s.matches)
      .where(eq(s.matches.userId, u.id))
      .orderBy(s.matches.createdAt)
      .limit(200),
    db.select({ n: s.matches.id }).from(s.matches).where(and(eq(s.matches.userId, u.id), gte(s.matches.createdAt, dayStart))),
  ]);
  const latest = matches.slice(-12).reverse();
  const peerIds = latest.map((m) => m.peerId).filter((v, i, a) => a.indexOf(v) === i);
  const peers = new Map(
    (peerIds.length ? await db.select().from(s.users).where(inArray(s.users.id, peerIds)) : []).map((p) => [p.id, p])
  );
  const reactRows = latest.length
    ? await db.select().from(s.matchReactions).where(inArray(s.matchReactions.matchId, latest.map((m) => m.id)))
    : [];
  return NextResponse.json({
    optIn: u.matchOptIn,
    plus: u.plus,
    usedToday: usedRows.length,
    limit: FREE_DAILY_LIMIT,
    matches: latest.map((m) => {
      const peer = peers.get(m.peerId);
      const rs = reactRows.filter((r) => r.matchId === m.id);
      return {
        id: m.id,
        score: m.score,
        reason: m.reason,
        status: m.status,
        createdAt: m.createdAt,
        peer: peer ? toPublic(peer) : null,
        shared: peer ? m && u.interests.filter((i) => peer.interests.includes(i)) : [],
        reactions: {
          wave: rs.filter((r) => r.kind === "wave").length,
          like: rs.filter((r) => r.kind === "like").length,
          myWave: rs.some((r) => r.kind === "wave" && r.userId === u.id),
          myLike: rs.some((r) => r.kind === "like" && r.userId === u.id),
        },
      };
    }),
  });
}

export async function POST(req: Request) {
  const u = await needUser();
  if (!u) return jerr("nope", 401);
  const body = await req.json().catch(() => ({}));

  if (body.action === "toggle-optin") {
    await db.update(s.users).set({ matchOptIn: !u.matchOptIn }).where(eq(s.users.id, u.id));
    return NextResponse.json({ optIn: !u.matchOptIn });
  }

  if (body.action === "find") {
    if (!u.matchOptIn) return jerr("optin", 403);
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const used = (
      await db.select({ n: s.matches.id }).from(s.matches).where(and(eq(s.matches.userId, u.id), gte(s.matches.createdAt, dayStart)))
    ).length;
    if (!isUnlimited(u) && used >= FREE_DAILY_LIMIT) return jerr("limit", 403);

    const candidates = await db
      .select()
      .from(s.users)
      .where(
        and(
          ne(s.users.id, u.id),
          eq(s.users.banned, false),
          eq(s.users.isBot, false),
          eq(s.users.publicProfile, true),
          eq(s.users.ageGroup, u.ageGroup)
        )
      );

    const already = new Set(
      (
        await db.select({ peerId: s.matches.peerId }).from(s.matches).where(and(eq(s.matches.userId, u.id), gte(s.matches.createdAt, dayStart)))
      ).map((m) => m.peerId)
    );

    const scored = candidates
      .map((c) => {
        const common = u.interests.filter((i) => c.interests.includes(i));
        let score = Math.min(common.length * 14, 42);
        if (c.language === u.language) score += 16;
        if (c.country === u.country) score += 10;
        score += 2 + Math.floor(Math.random() * 11);
        score = Math.max(20, Math.min(99, score));
        const why: string[] = [];
        if (common.length)
          why.push(
            u.language === "en"
              ? `${common.length} shared interest${common.length > 1 ? "s" : ""}`
              : `${common.length} interesse in comune${common.length > 1 ? "i" : ""}`
          );
        if (c.language === u.language) why.push(u.language === "en" ? "same language" : "stessa lingua");
        if (c.country === u.country) why.push(u.language === "en" ? "same country" : "stesso paese");
        return { c, score, reason: why.join(" · ") || (u.language === "en" ? "random current" : "corrente casuale"), common };
      })
      .filter((x) => !already.has(x.c.id))
      .sort((a, b) => b.score - a.score)
      .slice(0, 7);

    await Promise.all(
      scored.map((x) =>
        db.insert(s.matches).values({
          id: crypto.randomUUID(),
          userId: u.id,
          peerId: x.c.id,
          score: x.score,
          reason: x.reason,
        })
      )
    );
    if (scored.length) addPoints(u.id, 2 * scored.length).catch(() => {});
    return NextResponse.json({
      found: scored.length,
      matches: scored.map((x, i) => ({
        id: crypto.randomUUID(),
        score: x.score,
        reason: x.reason,
        status: "new",
        peer: toPublic(x.c),
        shared: x.common,
        reactions: { wave: 0, like: 0, myWave: false, myLike: false },
      })),
    });
  }

  if (body.action === "react") {
    const matchId = String(body.matchId ?? "");
    const kind = body.kind === "like" ? "like" : "wave";
    const m = (await db.select().from(s.matches).where(and(eq(s.matches.id, matchId), eq(s.matches.userId, u.id))).limit(1))[0];
    if (!m) return jerr("match", 404);
    const existing = (
      await db.select().from(s.matchReactions).where(and(eq(s.matchReactions.matchId, matchId), eq(s.matchReactions.userId, u.id), eq(s.matchReactions.kind, kind))).limit(1)
    )[0];
    let on = false;
    if (existing) {
      await db.delete(s.matchReactions).where(eq(s.matchReactions.id, existing.id));
    } else {
      await db.insert(s.matchReactions).values({ id: crypto.randomUUID(), matchId, userId: u.id, kind });
      on = true;
    }
    return NextResponse.json({ on });
  }

  if (body.action === "start-dm") {
    const matchId = String(body.matchId ?? "");
    const m = (await db.select().from(s.matches).where(and(eq(s.matches.id, matchId), eq(s.matches.userId, u.id))).limit(1))[0];
    if (!m) return jerr("match", 404);
    const pair = [u.id, m.peerId].sort();
    const existing = await db.select().from(s.dms).where(and(eq(s.dms.a, pair[0]), eq(s.dms.b, pair[1]))).limit(1);
    let dmId = existing[0]?.id;
    if (!dmId) {
      dmId = crypto.randomUUID();
      await db.insert(s.dms).values({ id: dmId, a: pair[0], b: pair[1] });
    }
    await db.update(s.matches).set({ status: "chatted" }).where(eq(s.matches.id, m.id));
    return NextResponse.json({ dmId });
  }

  return jerr("bad action", 400);
}
