import Stripe from "stripe";
import crypto from "node:crypto";
import { eq, gt, and, sql } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { addPoints } from "./points";

let stripe: Stripe | null = null;

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripe) stripe = new Stripe(key);
  return stripe;
}

/** True when real Stripe charges are live (key configured). */
export function paymentsLive(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export async function createCheckoutSession(opts: {
  userId: string;
  amountCents: number;
  kind: string;
  targetId?: string;
  label: string;
  origin: string;
}): Promise<{ url: string | null; id: string | null }> {
  const st = getStripe();
  if (!st) return { url: null, id: null };
  // Il ritorno post-pagamento va SEMPRE al sito dove l'utente si trova
  // (il suo dominio vero), con override opzionale via variabile d'ambiente.
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? opts.origin ?? "http://localhost:3000";
  const session = await st.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: { name: opts.label },
          unit_amount: opts.amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: opts.userId,
      kind: opts.kind,
      targetId: opts.targetId ?? "",
      amountCents: String(opts.amountCents),
    },
    success_url: `${origin}/app?paid=1&session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/app?cancelled=1`,
  });
  return { url: session.url, id: session.id };
}

/**
 * Atomic claim of a checkout session: the first caller (redirect confirm OR
 * app-start scan) wins; the session is then forgotten. Prevents double-credits.
 */
export async function claimSession(userId: string, sessionId: string): Promise<boolean> {
  const res = await db
    .update(s.users)
    .set({ stripeSession: null })
    .where(and(eq(s.users.id, userId), eq(s.users.stripeSession, sessionId)))
    .returning({ id: s.users.id });
  return res.length > 0;
}

export async function confirmSession(sessionId: string): Promise<{ paid: boolean; metadata: { kind: string; targetId: string; amountCents: number } } | null> {
  const st = getStripe();
  if (!st) return null;
  const sess = await st.checkout.sessions.retrieve(sessionId);
  return {
    paid: sess.payment_status === "paid",
    metadata: {
      kind: sess.metadata?.kind ?? "",
      targetId: sess.metadata?.targetId ?? "",
      amountCents: Number(sess.metadata?.amountCents ?? 0),
    },
  };
}

/**
 * Side effects for a completed purchase (simulated or Stripe-confirmed).
 * Idempotency note: called once per payment path only.
 */
export async function recordPurchase(userId: string, kind: string, amountCents: number, targetId?: string) {
  await db.insert(s.transactions).values({
    id: crypto.randomUUID(),
    userId,
    kind,
    amountCents,
    targetId: targetId ?? null,
  });

  if (kind === "top") {
    const now = new Date();
    const existing = (await db.select().from(s.topSlots).where(eq(s.topSlots.userId, userId)).limit(1))[0];
    const from = existing && existing.expiresAt > now ? existing.expiresAt : now;
    const to = new Date(from.getTime() + 24 * 3600e3);
    if (existing) await db.update(s.topSlots).set({ expiresAt: to, boughtAt: now }).where(eq(s.topSlots.id, existing.id));
    else await db.insert(s.topSlots).values({ id: crypto.randomUUID(), userId, expiresAt: to });
  }

  if (kind === "tip" && targetId) {
    const [target] = await db.select().from(s.users).where(eq(s.users.id, targetId)).limit(1);
    if (target && !target.isBot) {
      const net = Math.round(amountCents * 0.9);
      const cur = target.walletCents + net;
      await db.update(s.users).set({ walletCents: cur }).where(eq(s.users.id, targetId));
      await addPoints(targetId, 3);
    }
  }

  if (kind === "plus") {
    await db.update(s.users).set({ plus: true, plusRenewsAt: new Date(Date.now() + 30 * 864e5) }).where(eq(s.users.id, userId));
  }

  if (kind === "market" && targetId) {
    const [p] = await db.select().from(s.products).where(eq(s.products.id, targetId)).limit(1);
    if (p) {
      await db.insert(s.orders).values({
        id: crypto.randomUUID(),
        productId: p.id,
        buyerId: userId,
        amountCents,
        feeCents: Math.round(amountCents * 0.1),
      });
      await db.update(s.products).set({ sold: sql`${s.products.sold} + 1` }).where(eq(s.products.id, p.id));
    }
  }

  // 'premium' needs nothing extra: the transaction row IS the 24h ticket
}

export function hasPremiumTicket(userId: string, roomId: string) {
  return db
    .select({ id: s.transactions.id })
    .from(s.transactions)
    .where(
      and(
        eq(s.transactions.userId, userId),
        eq(s.transactions.kind, "premium"),
        eq(s.transactions.targetId, roomId),
        gt(s.transactions.createdAt, new Date(Date.now() - 24 * 3600e3))
      )
    )
    .limit(1);
}
