import { NextResponse } from "next/server";
import { eq, and, gt, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { jerr, needUser } from "@/lib/server";
import { toPublic } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Cruscotto proprietario: visibile SOLO all'utente il cui nickname corrisponde
 * alla variabile d'ambiente OWNER_NICKNAME (impostata dal proprietario su Vercel).
 */
export async function GET() {
  const owner = process.env.OWNER_NICKNAME;
  const u = await needUser();
  if (!owner || !u || u.nickname !== owner) return jerr("nope", 403);

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 864e5);
  const d0 = new Date();
  d0.setHours(0, 0, 0, 0);

  const [usersC, newUsers, latestUsers, msgsC, realMsgs, msgsToday, roomsTop, txs, reportsC, flaggedC] =
    await Promise.all([
      db.select({ n: sql`count(*)::int` }).from(s.users).where(and(eq(s.users.isBot, false), eq(s.users.banned, false))).limit(1),
      db.select({ n: sql`count(*)::int` }).from(s.users).where(and(eq(s.users.isBot, false), gt(s.users.createdAt, d7))).limit(1),
      db.select().from(s.users).where(eq(s.users.isBot, false)).orderBy(desc(s.users.createdAt)).limit(12),
      db.select({ n: sql`count(*)::int` }).from(s.messages).limit(1),
      db
        .select({ n: sql`count(*)::int` })
        .from(s.messages)
        .innerJoin(s.users, eq(s.messages.userId, s.users.id))
        .where(eq(s.users.isBot, false))
        .limit(1),
      db.select({ n: sql`count(*)::int` }).from(s.messages).where(gt(s.messages.createdAt, d0)).limit(1),
      db
        .select({ roomId: s.messages.roomId, n: sql`count(*)::int` })
        .from(s.messages)
        .groupBy(s.messages.roomId)
        .orderBy(desc(sql`count(*)`))
        .limit(5),
      db.select().from(s.transactions).orderBy(desc(s.transactions.createdAt)).limit(20),
      db.select({ n: sql`count(*)::int` }).from(s.reports).limit(1),
      db.select({ n: sql`count(*)::int` }).from(s.messages).where(eq(s.messages.flagged, true)).limit(1),
    ]);

  const allRooms = await db.select().from(s.rooms);
  const roomName = new Map(allRooms.map((r) => [r.id, r.name]));
  const targetIds = [...new Set(txs.map((t) => t.targetId).filter(Boolean) as string[])];
  let txTargets: { id: string; nickname: string }[] = [];
  if (targetIds.length) {
    const { inArray } = await import("drizzle-orm");
    txTargets = await db.select().from(s.users).where(inArray(s.users.id, targetIds));
  }
  const txTargetName = new Map(txTargets.map((t) => [t.id, t.nickname]));

  return NextResponse.json({
    users: usersC[0]?.n ?? 0,
    newUsers7: newUsers[0]?.n ?? 0,
    latestUsers: latestUsers.map((r) => ({
      nickname: r.nickname,
      country: r.country,
      createdAt: r.createdAt,
      plus: r.plus,
    })),
    messages: msgsC[0]?.n ?? 0,
    realMessages: realMsgs[0]?.n ?? 0,
    messagesToday: msgsToday[0]?.n ?? 0,
    topRooms: roomsTop.map((r) => ({ name: roomName.get(r.roomId) ?? r.roomId, n: r.n })),
    txs: txs.map((t) => ({
      id: t.id,
      kind: t.kind,
      amountCents: t.amountCents,
      target: t.targetId ? txTargetName.get(t.targetId) ?? null : null,
      createdAt: t.createdAt,
    })),
    txTotalCents: txs.reduce((a, t) => a + t.amountCents, 0),
    reports: reportsC[0]?.n ?? 0,
    flagged: flaggedC[0]?.n ?? 0,
    me: toPublic(u),
  });
}
