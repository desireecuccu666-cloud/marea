import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { jerr, needUser } from "@/lib/server";
import { paymentsLive, createCheckoutSession, confirmSession, recordPurchase, claimSession } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const u = await needUser();
  if (!u) return jerr("nope", 401);
  const body = await req.json().catch(() => ({}));

  if (body.action === "caps") {
    return NextResponse.json({ stripe: paymentsLive() });
  }

  if (body.action === "session") {
    const amountCents = Math.round(Number(body.amountCents ?? 0));
    const kind = String(body.kind ?? "purchase");
    if (!Number.isFinite(amountCents) || amountCents < 50 || amountCents > 1000000) return jerr("amount", 400);
    if (!paymentsLive()) return NextResponse.json({ url: null, simulated: true });
    // origine reale della richiesta = il sito vero dove l'utente si trova
    const host = req.headers.get("host") ?? "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto")?.split(",")[0] ?? "http";
    const d = await createCheckoutSession({
      userId: u.id,
      amountCents,
      kind,
      targetId: body.targetId ? String(body.targetId) : undefined,
      label: String(body.label ?? "Marea"),
      origin: `${proto}://${host}`,
    });
    // rete di sicurezza: memorizziamo la sessione; se il redirect salta,
    // il pagamento viene comunque riconosciuto quando l'utente apre il sito
    if (d.id) {
      await db.update(s.users).set({ stripeSession: d.id }).where(eq(s.users.id, u.id)).catch(() => {});
    }
    return NextResponse.json(d);
  }

  if (body.action === "confirm") {
    const sessionId = String(body.sessionId ?? "");
    if (!sessionId.startsWith("cs_")) return jerr("session", 400);
    const res = await confirmSession(sessionId);
    if (!res) return NextResponse.json({ paid: false, simulated: true });
    let credited = false;
    if (res.paid && res.metadata.kind) {
      if (await claimSession(u.id, sessionId)) {
        await recordPurchase(u.id, res.metadata.kind, res.metadata.amountCents, res.metadata.targetId || undefined);
        credited = true;
      }
    }
    return NextResponse.json({ paid: res.paid, credited });
  }

  return jerr("bad action", 400);
}
