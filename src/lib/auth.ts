import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import type { UserRow } from "./types";

export const COOKIE = "marea_sid";

export function hashPw(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const h = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${h}`;
}

export function verifyPw(pw: string, stored: string): boolean {
  const [salt, h] = stored.split(":");
  if (!salt || !h) return false;
  const a = crypto.scryptSync(pw, salt, 64);
  const b = Buffer.from(h, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await db.insert(sessions).values({
    token,
    userId,
    expiresAt: new Date(Date.now() + 30 * 864e5),
  });
  return token;
}

export async function destroySession(token: string) {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function getSessionUser(): Promise<UserRow | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);
  const s = rows[0];
  if (!s || s.expiresAt.getTime() < Date.now()) return null;
  const u = await db.select().from(users).where(eq(users.id, s.userId)).limit(1);
  return u[0] ?? null;
}

export function sessionResponse(token: string): NextResponse {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 30 * 86400,
    path: "/",
  });
  return res;
}

export function clearSessionResponse(): NextResponse {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
  return res;
}

export function toPublic(u: UserRow) {
  return {
    id: u.id,
    nickname: u.nickname,
    country: u.country,
    language: u.language,
    ageGroup: u.ageGroup,
    bio: u.bio,
    hue: u.hue,
    interests: u.interests,
    verified: u.verified,
    plus: u.plus,
    plusRenewsAt: u.plusRenewsAt,
    matchOptIn: u.matchOptIn,
    adultRoomOk: u.adultRoomOk,
    showVideo: u.showVideo,
    publicProfile: u.publicProfile,
    isBot: u.isBot,
    points: u.points,
    walletCents: u.walletCents,
    trialEndsAt: u.trialEndsAt,
    createdAt: u.createdAt,
  };
}
