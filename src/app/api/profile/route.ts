import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { toPublic } from "@/lib/auth";
import { jerr, needUser } from "@/lib/server";
import { LANGS, COUNTRIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const u = await needUser();
  if (!u) return jerr("nope", 401);
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if (body.bio !== undefined) patch.bio = String(body.bio).slice(0, 200);
  if (body.interests !== undefined) {
    if (!Array.isArray(body.interests) || body.interests.length > 8) return jerr("interests", 400);
    patch.interests = body.interests.map(String).slice(0, 8);
  }
  if (body.language !== undefined) {
    if (!LANGS.some((l) => l.code === body.language)) return jerr("lang", 400);
    patch.language = body.language;
  }
  if (body.country !== undefined) {
    if (!COUNTRIES.some((c) => c.code === body.country)) return jerr("country", 400);
    patch.country = body.country;
  }
  if (body.showVideo !== undefined) patch.showVideo = !!body.showVideo;
  if (body.publicProfile !== undefined) patch.publicProfile = !!body.publicProfile;
  if (body.hue !== undefined) {
    const h = Math.round(Number(body.hue));
    if (Number.isFinite(h) && h >= 0 && h <= 360) patch.hue = h;
  }

  const row = (await db.update(s.users).set(patch).where(eq(s.users.id, u.id)).returning())[0];
  return NextResponse.json({ user: toPublic(row) });
}
