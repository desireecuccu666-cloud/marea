import { NextResponse } from "next/server";
import { eq, and, gt, inArray } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db";
import * as s from "@/db/schema";
import { toPublic } from "@/lib/auth";
import { jerr, needUser } from "@/lib/server";
import { addPoints } from "@/lib/points";

export const dynamic = "force-dynamic";

const TOP_CENTS = 5000;
const PREMIUM_CENTS = 199;
const TIP_AMOUNTS = [100, 200, 500];

function validCard(card: string): boolean {
  return /^\d{12,19}$/.test(card.replace(/[\s-]/g, ""));
}

async function charge(userId: string, kind: string, amountCents: number, targetId?: string) {
  await db.insert(s.transactions).values({
    id: crypto.randomUUID(),
    userId,
    kind,
    amountCents,
    targetId: targetId ?? null,
  });
}

export async function POST(req: Request) {
  const u = await needUser();
  if (!u) return jerr("nope", 401);
  const body = await req.json().catch(() => ({}));

  if (body.action === "buy-top") {
    if (!validCard(String(body.card ?? ""))) return jerr("card", 400);
    const now = new Date();
    const exp = new Date(now.getTime() + 24 * 3600e3);
    const existing = (await db.select().from(s.topSlots).where(eq(s.topSlots.userId, u.id)).limit(1))[0];
    const from = existing && existing.expiresAt > now ? existing.expiresAt : now;
    const to = new Date(from.getTime() + 24 * 3600e3);
    if (existing) {
      await db.update(s.topSlots).set({ expiresAt: to, boughtAt: now }).where(eq(s.topSlots.id, existing.id));
    } else {
      await db.insert(s.topSlots).values({ id: crypto.randomUUID(), userId: u.id, expiresAt: to });
    }
    await charge(u.id, "top", TOP_CENTS);
    return NextResponse.json({ ok: true, expiresAt: to });
  }

  if (body.action === "premium-ticket") {
    const roomId = String(body.roomId ?? "");
    if (!validCard(String(body.card ?? ""))) return jerr("card", 400);
    const [room] = await db.select().from(s.rooms).where(eq(s.rooms.id, roomId)).limit(1);
    if (!room?.premium) return jerr("room", 404);
    if (room.group !== u.ageGroup) return jerr("age", 403);
    await charge(u.id, "premium", PREMIUM_CENTS, roomId);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "tip") {
    const amount = Number(body.amount);
    if (!TIP_AMOUNTS.includes(amount)) return jerr("amount", 400);
    if (!validCard(String(body.card ?? ""))) return jerr("card", 400);
    const targetId = String(body.targetId ?? "");
    const [target] = await db.select().from(s.users).where(eq(s.users.id, targetId)).limit(1);
    if (!target || target.banned) return jerr("peer", 404);
    if (target.isBot) return jerr("bot", 403);
    if (target.id === u.id) return jerr("self", 400);
    if (target.ageGroup !== u.ageGroup) return jerr("age", 403);
    const net = Math.round(amount * 0.9);
    const cur = (await db.select({ w: s.users.walletCents }).from(s.users).where(eq(s.users.id, target.id)).limit(1))[0]?.w ?? 0;
    await db.update(s.users).set({ walletCents: cur + net }).where(eq(s.users.id, target.id));
    await addPoints(target.id, 3);
    await charge(u.id, "tip", amount, targetId);
    return NextResponse.json({ ok: true, netCents: net });
  }

  if (body.action === "history") {
    const rows = await db
      .select()
      .from(s.transactions)
      .where(eq(s.transactions.userId, u.id))
      .orderBy(s.transactions.createdAt)
      .limit(200);
    // resolve tip recipients
    const tipTargets = [...new Set(rows.filter((r) => r.kind === "tip").map((r) => r.targetId).filter(Boolean) as string[])];
    const ts = tipTargets.length ? await db.select().from(s.users).where(inArray(s.users.id, tipTargets)) : [];
    const targets = new Map(ts.map((t) => [t.id, t]));
    return NextResponse.json({
      tx: rows.slice(-12).reverse().map((r) => ({
        id: r.id,
        kind: r.kind,
        amountCents: r.amountCents,
        target: r.kind === "tip" && r.targetId ? targets.get(r.targetId)?.nickname ?? null : null,
        createdAt: r.createdAt,
      })),
      walletCents: u.walletCents,
    });
  }

  return jerr("bad action", 400);
}

export async function GET() {
  const u = await needUser();
  if (!u) return jerr("nope", 401);
  return NextResponse.json({
    topCents: TOP_CENTS,
    premiumCents: PREMIUM_CENTS,
    tipAmounts: TIP_AMOUNTS,
    user: toPublic(u),
  });
}
