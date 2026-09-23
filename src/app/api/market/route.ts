import { NextResponse } from "next/server";
import { eq, and, inArray, like, sql } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db";
import * as s from "@/db/schema";
import { toPublic } from "@/lib/auth";
import { jerr, needUser } from "@/lib/server";

export const dynamic = "force-dynamic";

async function loadItems(u: any, url: URL) {
  const q = url.searchParams.get("q");
  const cat = url.searchParams.get("cat");
  let items = await db.select().from(s.products).orderBy(s.products.createdAt);
  const sellerIds = items.map((i) => i.sellerId).filter((v, i, a) => a.indexOf(v) === i);
  const sellers = new Map(
    (sellerIds.length ? await db.select().from(s.users).where(inArray(s.users.id, sellerIds)) : []).map((p) => [p.id, p])
  );
  const reviews = (
    await db.select().from(s.reviews).where(inArray(s.reviews.productId, items.map((i) => i.id)))
  );
  const orders = await db
    .select()
    .from(s.orders)
    .where(and(eq(s.orders.buyerId, u.id), inArray(s.orders.productId, items.map((i) => i.id))));
  const purchased = new Set(orders.map((o) => o.productId));

  let out = items
    .map((i) => {
      const rs = reviews.filter((r) => r.productId === i.id);
      const avg = rs.length ? Math.round((rs.reduce((a, r) => a + r.rating, 0) / rs.length) * 10) / 10 : 0;
      return {
        id: i.id,
        title: i.title,
        description: i.description,
        category: i.category,
        priceCents: i.priceCents,
        promoted: i.promoted,
        sold: i.sold,
        createdAt: i.createdAt,
        seller: sellers.get(i.sellerId) ? toPublic(sellers.get(i.sellerId)!) : null,
        rating: avg,
        reviewCount: rs.length,
        purchased: purchased.has(i.id),
        reviews: [] as any[],
        mine: i.sellerId === u.id,
      };
    });

  if (cat && cat !== "all") out = out.filter((i) => i.category === cat);
  if (q) out = out.filter((i) => i.title.toLowerCase().includes(q.toLowerCase()));
  // promoted first, then newest
  out.sort((a, b) => Number(b.promoted) - Number(a.promoted) || b.createdAt.getTime() - a.createdAt.getTime());
  return out;
}

export async function GET(req: Request) {
  const u = await needUser();
  if (!u) return jerr("nope", 401);
  const items = await loadItems(u, new URL(req.url));
  // attach review authors (single fetch)
  const productIds = items.map((i) => i.id);
  const reviews = productIds.length ? await db.select().from(s.reviews).where(inArray(s.reviews.productId, productIds)) : [];
  const buyerIds = reviews.map((r) => r.buyerId).filter((v, i, a) => a.indexOf(v) === i);
  const buyers = new Map(
    (buyerIds.length ? await db.select().from(s.users).where(inArray(s.users.id, buyerIds)) : []).map((b) => [b.id, b])
  );
  const withReviews = items.map((i) => ({
    ...i,
    reviews: reviews
      .filter((r) => r.productId === i.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 4)
      .map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        buyer: buyers.get(r.buyerId) ? { nickname: buyers.get(r.buyerId)!.nickname, hue: buyers.get(r.buyerId)!.hue } : null,
        mine: r.buyerId === u.id,
      })),
  }));
  return NextResponse.json({ items: withReviews });
}

export async function POST(req: Request) {
  const u = await needUser();
  if (!u) return jerr("nope", 401);
  const body = await req.json().catch(() => ({}));

  if (body.action === "create") {
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const category = ["product", "service", "digital"].includes(body.category) ? body.category : "product";
    const priceCents = Math.round(Number(body.priceCents ?? 0));
    if (title.length < 3 || title.length > 60) return jerr("title", 400);
    if (description.length < 10 || description.length > 600) return jerr("desc", 400);
    if (!Number.isFinite(priceCents) || priceCents < 50 || priceCents > 1000000) return jerr("price", 400);
    if (body.promoted && !u.plus) return jerr("plus", 403);
    const p = await db
      .insert(s.products)
      .values({
        id: crypto.randomUUID(),
        sellerId: u.id,
        title,
        description,
        category,
        priceCents,
        promoted: body.promoted && u.plus,
      })
      .returning();
    return NextResponse.json({ product: p[0] });
  }

  if (body.action === "buy") {
    const p = (await db.select().from(s.products).where(eq(s.products.id, String(body.productId ?? ""))).limit(1))[0];
    if (!p) return jerr("item", 404);
    if (p.sellerId === u.id) return jerr("self", 400);
    const feeCents = Math.round(p.priceCents * 0.1);
    await db.insert(s.orders).values({
      id: crypto.randomUUID(),
      productId: p.id,
      buyerId: u.id,
      amountCents: p.priceCents,
      feeCents,
    });
    await db.update(s.products).set({ sold: sql`${s.products.sold} + 1` }).where(eq(s.products.id, p.id));
    return NextResponse.json({ amountCents: p.priceCents, feeCents, ok: true });
  }

  if (body.action === "review") {
    const productId = String(body.productId ?? "");
    const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating ?? 5))));
    const comment = String(body.comment ?? "").slice(0, 200);
    const order = (
      await db.select().from(s.orders).where(and(eq(s.orders.productId, productId), eq(s.orders.buyerId, u.id))).limit(1)
    )[0];
    if (!order) return jerr("buy", 403);
    const existing = (
      await db.select().from(s.reviews).where(and(eq(s.reviews.productId, productId), eq(s.reviews.buyerId, u.id))).limit(1)
    )[0];
    if (existing) {
      await db.update(s.reviews).set({ rating, comment }).where(eq(s.reviews.id, existing.id));
    } else {
      await db.insert(s.reviews).values({ id: crypto.randomUUID(), productId, buyerId: u.id, rating, comment });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "remove") {
    const p = (await db.select().from(s.products).where(eq(s.products.id, String(body.productId ?? ""))).limit(1))[0];
    if (!p || p.sellerId !== u.id) return jerr("item", 404);
    await db.delete(s.reviews).where(eq(s.reviews.productId, p.id));
    await db.delete(s.orders).where(eq(s.orders.productId, p.id));
    await db.delete(s.products).where(eq(s.products.id, p.id));
    return NextResponse.json({ ok: true });
  }

  return jerr("bad action", 400);
}
