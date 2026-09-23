import { NextResponse } from "next/server";
import { jerr, needUser } from "@/lib/server";
import { paymentsLive, createCheckoutSession, confirmSession, recordPurchase } from "@/lib/payments";

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
    const d = await createCheckoutSession({
      userId: u.id,
      amountCents,
      kind,
      targetId: body.targetId ? String(body.targetId) : undefined,
      label: String(body.label ?? "Marea"),
    });
    return NextResponse.json(d);
  }

  if (body.action === "confirm") {
    const sessionId = String(body.sessionId ?? "");
    if (!sessionId.startsWith("cs_")) return jerr("session", 400);
    const res = await confirmSession(sessionId);
    if (!res) return NextResponse.json({ paid: false, simulated: true });
    if (res.paid && res.metadata.kind) {
      await recordPurchase(u.id, res.metadata.kind, res.metadata.amountCents, res.metadata.targetId || undefined);
    }
    return NextResponse.json({ paid: res.paid });
  }

  return jerr("bad action", 400);
}
