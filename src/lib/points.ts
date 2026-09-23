import { sql, eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import type { UserRow } from "./types";

/** Add Marea points to a user atomically. */
export async function addPoints(userId: string, n: number) {
  if (n === 0) return;
  await db.update(s.users).set({ points: sql`${s.users.points} + ${n}` }).where(eq(s.users.id, userId));
}

/** Unlimited = Marea+ OR active 24h free trial. */
export function isUnlimited(u: UserRow): boolean {
  if (u.plus) return true;
  return !!u.trialEndsAt && u.trialEndsAt.getTime() > Date.now();
}

export const FREE_LIMITS = {
  dmPerDay: 5,
  matchPerDay: 5,
  voicePerDay: 3,
};
