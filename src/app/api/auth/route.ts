import { NextResponse } from "next/server";
import { eq, and, or, lt, gt, sql } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db";
import * as s from "@/db/schema";
import { hashPw, verifyPw, createSession, destroySession, getSessionUser, toPublic } from "@/lib/auth";
import { jerr } from "@/lib/server";
import { ensureSeed } from "@/db/seed";
import { LANGS, COUNTRIES } from "@/lib/constants";
import { botReply } from "@/lib/bots";

export const dynamic = "force-dynamic";

const APP_VERSION = 4;

export async function GET() {
  await ensureSeed();
  const u = await getSessionUser();
  if (!u) return jerr("nope", 401);

  // rete di sicurezza pagamenti: se una sessione Stripe è in attesa e ora è
  // risultata pagata, la registriamo qui (funziona anche se il redirect salta)
  let pendingPayment = false;
  let fresh = u;
  if (u.stripeSession) {
    try {
      const { confirmSession, claimSession, recordPurchase } = await import("@/lib/payments");
      const res = await confirmSession(u.stripeSession);
      if (res?.paid && res.metadata.kind) {
        if (await claimSession(u.id, u.stripeSession)) {
          await recordPurchase(u.id, res.metadata.kind, res.metadata.amountCents, res.metadata.targetId || undefined);
          pendingPayment = true;
          const rows = await db.select().from(s.users).where(eq(s.users.id, u.id)).limit(1);
          fresh = rows[0] ?? u;
        }
      } else if (res && !res.paid) {
        // non ancora pagata: la teniamo in attesa per il prossimo accesso
      } else {
        await db.update(s.users).set({ stripeSession: null }).where(eq(s.users.id, u.id));
      }
    } catch {
      await db.update(s.users).set({ stripeSession: null }).where(eq(s.users.id, u.id)).catch(() => {});
    }
  }

  return NextResponse.json({
    user: toPublic(fresh),
    verifyCode: !fresh.verified && fresh.verifyExp && fresh.verifyExp.getTime() > Date.now() ? fresh.verifyCode : null,
    pendingPayment,
    appVersion: APP_VERSION,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  await ensureSeed();

  if (body.action === "register") {
    const { nickname, email, password, country, language, interests } = body;
    const ageGroup = body.ageGroup === "minor" ? "minor" : body.ageGroup === "adult" ? "adult" : null;
    if (!ageGroup) return jerr("age", 403);
    if (!/^[A-Za-z0-9_]{3,20}$/.test(nickname ?? "")) return jerr("nick", 400);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email ?? "")) return jerr("email", 400);
    if ((password ?? "").length < 6) return jerr("pw", 400);
    if (!COUNTRIES.some((c) => c.code === country)) return jerr("country", 400);
    if (!LANGS.some((l) => l.code === language)) return jerr("lang", 400);
    const list = Array.isArray(interests) ? interests.slice(0, 8) : [];
    const existing = await db
      .select({ id: s.users.id })
      .from(s.users)
      .where(
        or(
          eq(sql`lower(${s.users.nickname})`, String(nickname).toLowerCase()),
          eq(s.users.email, String(email).toLowerCase())
        )
      )
      .limit(1);
    if (existing[0]) return jerr("taken", 409);

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const id = crypto.randomUUID();
    await db.insert(s.users).values({
      id,
      nickname,
      email: String(email).toLowerCase(),
      passwordHash: hashPw(password),
      country,
      language,
      ageGroup,
      interests: list,
      hue: Math.floor(Math.random() * 360),
      verified: false,
      verifyCode: code,
      verifyExp: new Date(Date.now() + 15 * 60000),
      trialEndsAt: new Date(Date.now() + 24 * 3600e3),
      bio: "",
    });

    // welcome DM from the declared bot
    const pair = ["u-assist", id].sort();
    const dmId = crypto.randomUUID();
    await db.insert(s.dms).values({ id: dmId, a: pair[0], b: pair[1] });
    await db.insert(s.dmMessages).values({
      id: crypto.randomUUID(),
      dmId,
      senderId: "u-assist",
      content: `Ciao ${nickname}! Sono Marea.Assist, il bot ufficiale di benvenuto. Sei in una community 18+ con identità privata: qui conta solo il nickname. Buona marea.`,
    });

    const user = (await db.select().from(s.users).where(eq(s.users.id, id)).limit(1))[0];
    const token = await createSession(id);
    const res = NextResponse.json({ user: toPublic(user), verifyCode: code });
    res.cookies.set("marea_sid", token, { httpOnly: true, sameSite: "lax", maxAge: 30 * 86400, path: "/" });
    return res;
  }

  if (body.action === "login") {
    const email = String(body.email ?? "").toLowerCase();
    const rows = await db.select().from(s.users).where(eq(s.users.email, email)).limit(1);
    const u = rows[0];
    if (!u || u.isBot || !verifyPw(String(body.password ?? ""), u.passwordHash))
      return jerr("login", 401);
    const token = await createSession(u.id);
    const res = NextResponse.json({ user: toPublic(u) });
    res.cookies.set("marea_sid", token, { httpOnly: true, sameSite: "lax", maxAge: 30 * 86400, path: "/" });
    return res;
  }

  if (body.action === "demo") {
    const rows = await db.select().from(s.users).where(eq(s.users.id, "u-onda")).limit(1);
    const u = rows[0];
    if (!u) return jerr("login", 401);
    const token = await createSession(u.id);
    const res = NextResponse.json({ user: toPublic(u) });
    res.cookies.set("marea_sid", token, { httpOnly: true, sameSite: "lax", maxAge: 30 * 86400, path: "/" });
    return res;
  }

  if (body.action === "verify") {
    const u = await getSessionUser();
    if (!u) return jerr("nope", 401);
    if (u.verified) return NextResponse.json({ ok: true });
    if (u.verifyCode !== String(body.code ?? "")) return jerr("code", 400);
    if (!u.verifyExp || u.verifyExp.getTime() < Date.now()) return jerr("code", 400);
    await db.update(s.users).set({ verified: true }).where(eq(s.users.id, u.id));
    return NextResponse.json({ ok: true });
  }

  if (body.action === "logout") {
    const store = await (await import("next/headers")).cookies();
    const token = store.get("marea_sid")?.value;
    if (token) await destroySession(token);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("marea_sid", "", { httpOnly: true, maxAge: 0, path: "/" });
    return res;
  }

  return jerr("bad action", 400);
}
