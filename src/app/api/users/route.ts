import { NextResponse } from "next/server";
import { and, ne, eq, or, ilike, like } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { toPublic } from "@/lib/auth";
import { jerr, needUser } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = await needUser();
  if (!u) return jerr("nope", 401);
  const url = new URL(req.url);
  const q = String(url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ users: [] });
  const rows = await db
    .select()
    .from(s.users)
    .where(
      and(
        ne(s.users.id, u.id),
        eq(s.users.banned, false),
        eq(s.users.publicProfile, true),
        eq(s.users.ageGroup, u.ageGroup),
        or(ilike(s.users.nickname, `%${q}%`), like(s.users.bio, `%${q}%`))
      )
    )
    .limit(12);
  return NextResponse.json({ users: rows.map(toPublic) });
}
