import { NextResponse } from "next/server";
import { eq, and, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { toPublic } from "@/lib/auth";
import { jerr, needUser } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await needUser();
  if (!u) return jerr("nope", 401);

  const [myReports, blocks, openR, resolvedR, flaggedR] = await Promise.all([
    db.select().from(s.reports).where(eq(s.reports.reporterId, u.id)).orderBy(s.reports.createdAt).limit(200),
    db.select().from(s.blocks).where(eq(s.blocks.userId, u.id)).limit(50),
    db.select({ n: sql`count(*)::int` }).from(s.reports).where(eq(s.reports.status, "open")).limit(1),
    db.select({ n: sql`count(*)::int` }).from(s.reports).where(eq(s.reports.status, "resolved")).limit(1),
    db.select({ n: sql`count(*)::int` }).from(s.messages).where(eq(s.messages.flagged, true)).limit(1),
  ]);
  const stats = { open: openR[0]?.n ?? 0, resolved: resolvedR[0]?.n ?? 0, flagged: flaggedR[0]?.n ?? 0 };

  const blockedIds = blocks.map((b) => b.blockedId);
  const blocked = new Map(
    (blockedIds.length ? await db.select().from(s.users).where(inArray(s.users.id, blockedIds)) : []).map((p) => [p.id, p])
  );

  return NextResponse.json({
    reports: myReports.slice(-10).reverse().map((r) => ({
      id: r.id,
      targetType: r.targetType,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
    })),
    blocks: blocks.map((b) => ({
      id: b.id,
      user: blocked.get(b.blockedId) ? toPublic(blocked.get(b.blockedId)!) : null,
    })),
    stats,
  });
}
