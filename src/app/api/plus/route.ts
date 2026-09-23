import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { toPublic } from "@/lib/auth";
import { jerr, needUser } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const u = await needUser();
  if (!u) return jerr("nope", 401);
  const body = await req.json().catch(() => ({}));
  const card = String(body.card ?? "").replace(/[\s-]/g, "");
  if (!/^\d{12,19}$/.test(card)) return jerr("card", 400);

  const now = new Date();
  const row = await db
    .update(s.users)
    .set({ plus: true, plusRenewsAt: new Date(now.getTime() + 30 * 864e5) })
    .where(eq(s.users.id, u.id))
    .returning();
  return NextResponse.json({ ok: true, user: toPublic(row[0]) });
}
