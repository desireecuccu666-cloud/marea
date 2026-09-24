import { NextResponse } from "next/server";
import { eq, and, ne, gt, gte, sql } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db";
import * as s from "@/db/schema";
import { toPublic } from "@/lib/auth";
import { jerr, needUser } from "@/lib/server";
import { moderate } from "@/lib/moderation";
import { botForRoom, botReply, AUTO_REPLY_CHANCE } from "@/lib/bots";
import { emit, roomTarget } from "@/lib/liveBus";
import { isUnlimited, addPoints, FREE_LIMITS } from "@/lib/points";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = await needUser();
  if (!u) return jerr("nope", 401);
  const url = new URL(req.url);
  const slug = url.searchParams.get("room");

  const [allRooms, blockRows, tickets] = await Promise.all([
    db.select().from(s.rooms).orderBy(s.rooms.hue),
    db.select().from(s.blocks).where(eq(s.blocks.userId, u.id)),
    db
      .select()
      .from(s.transactions)
      .where(and(eq(s.transactions.userId, u.id), eq(s.transactions.kind, "premium"), gt(s.transactions.createdAt, new Date(Date.now() - 24 * 3600e3)))),
  ]);
  const unlocked = new Set(tickets.map((t) => t.targetId).filter(Boolean) as string[]);
  const rooms = allRooms
    .filter((r) => r.group === u.ageGroup)
    .map((r) => ({ ...r, locked: !!r.premium && !u.plus && !unlocked.has(r.id) }));
  const room = rooms.find((r) => r.slug === slug);
  let msgs: any[] = [];
  if (slug) {
    if (!room) return jerr("room not found", 404);
    const blocked = new Set(blockRows.map((b) => b.blockedId));
    const rows = await db
      .select({
        id: s.messages.id,
        content: s.messages.content,
        kind: s.messages.kind,
        flagged: s.messages.flagged,
        alias: s.messages.alias,
        createdAt: s.messages.createdAt,
        userId: s.users.id,
        nickname: s.users.nickname,
        hue: s.users.hue,
        plus: s.users.plus,
        isBot: s.users.isBot,
        ageGroup: s.users.ageGroup,
      })
      .from(s.messages)
      .innerJoin(s.users, eq(s.messages.userId, s.users.id))
      .where(and(eq(s.messages.roomId, room.id), eq(s.messages.hidden, false), ne(s.users.banned, true)))
      .orderBy(s.messages.createdAt)
      .limit(200);
    msgs = rows.filter((r) => !blocked.has(r.userId)).slice(-80);
  }

  return NextResponse.json({ rooms, messages: msgs });
}

function anonAlias(lang: string): string {
  const prefix = { it: "Anonimo", en: "Anon", es: "Anónimo", fr: "Anon", de: "Anonym" }[lang] ?? "Anon";
  return `${prefix} #${1000 + Math.floor(Math.random() * 9000)}`;
}

export async function POST(req: Request) {
  const u = await needUser();
  if (!u) return jerr("nope", 401);
  const body = await req.json().catch(() => ({}));

  if (body.action === "typing") {
    const slug = String(body.room ?? "");
    const room = (await db.select().from(s.rooms).where(eq(s.rooms.slug, slug)).limit(1))[0];
    if (room && room.group === u.ageGroup) {
      emit(roomTarget(room.slug), "typing", { nickname: u.nickname, self: u.id });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "send") {
    const slug = String(body.room ?? "");
    const room = (await db.select().from(s.rooms).where(eq(s.rooms.slug, slug)).limit(1))[0];
    if (!room) return jerr("room not found", 404);
    if (room.group !== u.ageGroup) return jerr("age", 403);
    if (room.isAdult && !u.adultRoomOk) return jerr("adult", 403);
    if (room.premium && !u.plus) {
      const [ticket] = await db
        .select()
        .from(s.transactions)
        .where(
          and(
            eq(s.transactions.userId, u.id),
            eq(s.transactions.kind, "premium"),
            eq(s.transactions.targetId, room.id),
            gt(s.transactions.createdAt, new Date(Date.now() - 24 * 3600e3))
          )
        )
        .limit(1);
      if (!ticket) return jerr("premium", 403);
    }

    const kind = body.kind === "voice" ? "voice" : "text";
    if (kind === "voice") {
      const content = String(body.content ?? "");
      if (!content.startsWith("data:audio") || content.length > 400000) return jerr("voice", 400);
      if (!isUnlimited(u)) {
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        const [vrow] = await db
          .select({ n: sql`count(*)::int` })
          .from(s.messages)
          .where(and(eq(s.messages.userId, u.id), eq(s.messages.kind, "voice"), gte(s.messages.createdAt, dayStart)))
          .limit(1);
        const vn = Number(vrow?.n ?? 0);
        if (vn >= FREE_LIMITS.voicePerDay) return jerr("limit", 403);
      }
      const [m] = await db
        .insert(s.messages)
        .values({ id: crypto.randomUUID(), roomId: room.id, userId: u.id, kind, content })
        .returning();
      emit(roomTarget(room.slug), "msg", {
        id: m.id, roomId: room.id, kind: m.kind, content: m.content, alias: null,
        flagged: m.flagged, userId: u.id, nickname: u.nickname, hue: u.hue,
        plus: u.plus, isBot: u.isBot, ageGroup: u.ageGroup, createdAt: m.createdAt.toISOString(),
      });
      addPoints(u.id, 2).catch(() => {});
      return NextResponse.json({ message: m });
    }
    const text = String(body.content ?? "").trim();
    if (!text || text.length > 500) return jerr("text", 400);
    const { clean, hits, scam } = moderate(text, u.language, u.ageGroup);
    const alias = room.kind === "live" ? anonAlias(u.language) : null;
    const [m] = await db
      .insert(s.messages)
      .values({
        id: crypto.randomUUID(),
        roomId: room.id,
        userId: u.id,
        kind: "text",
        content: clean,
        alias,
        flagged: hits > 0 || scam,
      })
      .returning();
    emit(roomTarget(room.slug), "msg", {
      id: m.id, roomId: room.id, kind: "text", content: m.content, alias,
      flagged: m.flagged, userId: u.id, nickname: u.nickname, hue: u.hue,
      plus: u.plus, isBot: u.isBot, ageGroup: u.ageGroup, createdAt: m.createdAt.toISOString(),
    });
    addPoints(u.id, 2).catch(() => {});

    // declared bot: occasional reply in the sender's language (same age group)
    const botId = botForRoom(room.kind, room.language, room.group);
    if (Math.random() < AUTO_REPLY_CHANCE) {
      const content = botReply(room.kind, u.language, u.nickname, room.group);
      const roomId = room.id;
      const bot = (await db.select().from(s.users).where(eq(s.users.id, botId)).limit(1))[0];
      setTimeout(() => {
        void (async () => {
          try {
            const [m2] = await db
              .insert(s.messages)
              .values({ id: crypto.randomUUID(), roomId, userId: botId, kind: "text" as const, content })
              .returning();
            if (bot && m2)
              emit(roomTarget(room.slug), "msg", {
                id: m2.id, roomId, kind: "text", content: m2.content, alias: null,
                flagged: false, userId: bot.id, nickname: bot.nickname, hue: bot.hue,
                plus: bot.plus, isBot: true, ageGroup: bot.ageGroup, createdAt: m2.createdAt.toISOString(),
              });
          } catch {}
        })();
      }, 2500 + Math.random() * 3500);
    }
    return NextResponse.json({ message: m });
  }

  if (body.action === "report") {
    const targetType = ["message", "user", "product"].includes(body.targetType) ? body.targetType : "message";
    const targetId = String(body.targetId ?? "");
    const reason = String(body.reason ?? "other");
    if (!targetId) return jerr("target", 400);
    await db.insert(s.reports).values({
      id: crypto.randomUUID(),
      reporterId: u.id,
      targetType,
      targetId,
      reason,
    });
    if (targetType === "message") {
      await db.update(s.messages).set({ flagged: true }).where(eq(s.messages.id, targetId));
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "block") {
    const id = String(body.userId ?? "");
    await db.insert(s.blocks).values({ id: crypto.randomUUID(), userId: u.id, blockedId: id }).onConflictDoNothing();
    return NextResponse.json({ ok: true });
  }

  if (body.action === "unblock") {
    const id = String(body.userId ?? "");
    await db.delete(s.blocks).where(and(eq(s.blocks.userId, u.id), eq(s.blocks.blockedId, id)));
    return NextResponse.json({ ok: true });
  }

  if (body.action === "adult") {
    await db.update(s.users).set({ adultRoomOk: true }).where(eq(s.users.id, u.id));
    return NextResponse.json({ ok: true });
  }

  return jerr("bad action", 400);
}
