import { NextResponse } from "next/server";
import { getSessionUser } from "./auth";
import { ensureSeed } from "@/db/seed";
import type { UserRow } from "./types";

export function jerr(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function needUser(): Promise<UserRow | null> {
  await ensureSeed();
  const u = await getSessionUser();
  return u && !u.banned ? u : null;
}
