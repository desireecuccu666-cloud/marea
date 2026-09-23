import { NextResponse } from "next/server";
import { eq, and, gt, desc } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { toPublic } from "@/lib/auth";
import { jerr, needUser } from "@/lib/server";
import { ensureLiveEngine } from "@/lib/liveEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await needUser();
  if (!u) return jerr("nope", 401);
  ensureLiveEngine();

  const now = new Date();
  const [users, activeSlots] = await Promise.all([
    db
      .select()
      .from(s.users)
      .where(and(eq(s.users.banned, false), eq(s.users.publicProfile, true), eq(s.users.ageGroup, u.ageGroup)))
      .orderBy(desc(s.users.points))
      .limit(60),
    db.select().from(s.topSlots).where(gt(s.topSlots.expiresAt, now)),
  ]);

  const slotByUser = new Map(activeSlots.map((t) => [t.userId, t.expiresAt]));
  // top-slot holders first, then points
  const ranked = [...users].sort((a, b) => {
    const ta = slotByUser.get(a.id);
    const tb = slotByUser.get(b.id);
    if (ta && !tb) return -1;
    if (!ta && tb) return 1;
    if (ta && tb) return tb.getTime() - ta.getTime();
    return b.points - a.points;
  });
  const top30 = ranked.slice(0, 30);
  const myRank = ranked.findIndex((r) => r.id === u.id) + 1;
  const mySlot = slotByUser.get(u.id) ?? null;

  return NextResponse.json({
    list: top30.map((r, i) => ({
      rank: i + 1,
      user: toPublic(r),
      points: r.points,
      onTop: !!slotByUser.get(r.id),
    })),
    myRank: myRank > 0 ? myRank : null,
    myPoints: u.points,
    myOnTop: !!mySlot,
    myTopExpiresAt: mySlot ? mySlot.getTime() : null,
    total: ranked.length,
  });
}
