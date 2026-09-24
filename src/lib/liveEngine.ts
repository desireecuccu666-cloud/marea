import { and, eq, like } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db";
import * as s from "@/db/schema";
import { emit, roomTarget } from "./liveBus";
import { botForRoom } from "./bots";

/**
 * Simulated community activity: real users (same age group as the room)
 * type, then write, into a random room. Keeps Marea feeling live.
 */
let started = false;

const PHRASES_ADULT = [
  "qualcuno da Roma stanotte?",
  "la marea qui è strana, ma bella",
  "sto provando la playlist nuova, opinioni?",
  "dimenticatevi il fuso orario, qui si parla sempre",
  "chi ha visto l'ultimo match di gaming zone?",
  "buona onda a chi entra ora",
  "io resto finché c'è qualcuno che risponde",
  "domani mattina presto da me, ma stanotte sono qui",
  "un consiglio: scrivete, qui si ascoltano",
  "la stanza sfoghi oggi è stata importante per due persone, grazie a chi c'era",
];
const PHRASES_MINOR = [
  "chi è online dal gaming zone?",
  "grgl, qualcuno ha passato il livello 7?!",
  "oggi ho provato una cosa nuova ed è andata bene",
  "hype per stasera, prometto che resto",
  "qualcuno ha una playlist per lo studio?",
  "sono qui dalla mensa, scusate se mi perdo",
  "il bot Corallo oggi è simpatico",
  "vado a dormire a mezzanotte al massimo",
  "chi gioca a cartoi? no, a carte",
  "buona notte a chi c'è già da un po'",
];

function anonAlias(lang: string): string {
  const prefix = { it: "Anonimo", en: "Anon", es: "Anónimo", fr: "Anon", de: "Anonym" }[lang] ?? "Anon";
  return `${prefix} #${1000 + Math.floor(Math.random() * 9000)}`;
}

async function tick() {
  try {
    const rooms = (await db.select().from(s.rooms)).filter(
      (r) => !r.isAdult && !r.premium
    );
    if (rooms.length) {
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      // SOLO i personaggi iniziali (id "u-..."): il motore NON deve mai
      // scrivere con il nome di utenti reali — altrimenti non si distingue
      // più chi scrive davvero
      const personas = await db
        .select()
        .from(s.users)
        .where(
          and(
            eq(s.users.banned, false),
            eq(s.users.isBot, false),
            eq(s.users.ageGroup, room.group),
            like(s.users.id, "u-%")
          )
        );
      const p = personas[Math.floor(Math.random() * personas.length)];
      if (p) {
        emit(roomTarget(room.slug), "typing", { nickname: p.nickname });
        const pool = room.group === "minor" ? PHRASES_MINOR : PHRASES_ADULT;
        const content = pool[Math.floor(Math.random() * pool.length)];
        const alias = room.kind === "live" ? anonAlias(p.language) : null;
        const botId = botForRoom(room.kind, room.language, room.group);
        const id = crypto.randomUUID();
        setTimeout(() => {
          void (async () => {
            try {
              const [m] = await db
                .insert(s.messages)
                .values({ id, roomId: room.id, userId: p.id, kind: "text" as const, content, alias })
                .returning();
              emit(roomTarget(room.slug), "msg", {
                id: m.id, roomId: room.id, kind: "text", content: m.content, alias,
                flagged: false, userId: p.id, nickname: p.nickname, hue: p.hue,
                plus: p.plus, isBot: false, ageGroup: p.ageGroup, createdAt: m.createdAt.toISOString(),
              });
              // occasionally a declared bot reacts
              if (Math.random() < 0.4) {
                setTimeout(() => {
                  void (async () => {
                    try {
                      const [b2] = await db
                        .insert(s.messages)
                        .values({
                          id: crypto.randomUUID(),
                          roomId: room.id,
                          userId: botId,
                          kind: "text" as const,
                          content:
                            room.group === "minor"
                              ? "sono Bolla (bot), qui si sta bene: continuate così"
                              : "buona onda (sono Brisa, il bot della stanza)",
                        })
                        .returning();
                      const bot = (await db.select().from(s.users).where(eq(s.users.id, botId)).limit(1))[0];
                      if (bot)
                        emit(roomTarget(room.slug), "msg", {
                          id: b2.id, roomId: room.id, kind: "text", content: b2.content, alias: null,
                          flagged: false, userId: bot.id, nickname: bot.nickname, hue: bot.hue,
                          plus: bot.plus, isBot: true, ageGroup: bot.ageGroup, createdAt: b2.createdAt.toISOString(),
                        });
                    } catch {}
                  })();
                }, 3500 + Math.random() * 4000);
              }
            } catch {}
          })();
        }, 1600 + Math.random() * 2600);
      }
    }
  } catch {
    /* engine never throws */
  } finally {
    setTimeout(tick, 24000 + Math.random() * 22000);
  }
}

export function ensureLiveEngine() {
  if (started || typeof window !== "undefined") return;
  started = true;
  setTimeout(tick, 10000);
}
