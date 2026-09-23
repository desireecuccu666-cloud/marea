"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { t as tFn } from "@/lib/i18n";
import { api } from "@/lib/api";
import { useVoice } from "@/lib/useVoice";
import { useLive } from "@/lib/useLive";
import { playSfx } from "@/lib/sounds";
import { Avatar, Btn, Chip, Modal, toast, timeHM, dayLabel, useAutoScroll, Empty } from "@/components/ui";
import {
  IcMic,
  IcStop,
  IcSend,
  IcFlag,
  IcShield,
  IcLock,
  IcGamepad,
  IcVent,
  IcGlobe,
  IcWave,
  IcChat,
  IcEye,
  IcStar2,
} from "@/components/Icons";
import Checkout from "@/components/Checkout";
import type { PublicUser } from "@/lib/types";

const REASONS = ["spam", "harass", "scam", "other"] as const;

function onlineBase(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 997;
  return 14 + (h % 64);
}

export default function ChatView({ me, lang }: { me: PublicUser; lang: string }) {
  const t = (k: string, vars?: Record<string, string | number>) => tFn(lang, k, vars);
  const [rooms, setRooms] = useState<any[]>([]);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [slug, setSlug] = useState("maree");
  const [input, setInput] = useState("");
  const [adultRoom, setAdultRoom] = useState<any | null>(null);
  const [report, setReport] = useState<{ type: "message" | "user"; id: string; nick: string } | null>(null);
  const [reason, setReason] = useState("");
  const [typingName, setTypingName] = useState<string | null>(null);
  const [online, setOnline] = useState<Record<string, number>>({});
  const [premiumRoom, setPremiumRoom] = useState<any | null>(null);
  const listRef = useAutoScroll(msgs.length + slug);
  const lastTyping = useRef(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenIds = useRef<Set<string>>(new Set());

  const load = useCallback(
    async (sl: string) => {
      try {
        const data = await api(`/api/chat?room=${encodeURIComponent(sl)}`);
        setRooms(data.rooms);
        setMsgs((prev) => {
          if (data.messages.length === 0) return prev;
          if (prev.length === 0 || prev[0].roomId !== data.messages[0]?.roomId && sl === slug) return data.messages;
          return data.messages.length !== prev.length ? data.messages : prev;
        });
      } catch {}
    },
    [slug]
  );

  useEffect(() => {
    setMsgs([]);
    seenIds.current = new Set();
    load(slug);
    const iv = setInterval(() => load(slug), 8000);
    return () => clearInterval(iv);
  }, [slug, load]);

  /* simulated presence */
  useEffect(() => {
    const upd = () =>
      setOnline((prev) => {
        const n = { ...prev };
        for (const r of rooms) {
          const base = onlineBase(r.slug);
          const cur = n[r.slug] ?? base;
          n[r.slug] = Math.max(4, cur + (Math.floor(Math.random() * 7) - 3));
        }
        return n;
      });
    upd();
    const iv = setInterval(upd, 18000);
    return () => clearInterval(iv);
  }, [rooms]);

  /* real-time: SSE */
  useLive(`room:${slug}`, (event, data) => {
    if (event === "msg") {
      if (seenIds.current.has(data.id)) return;
      seenIds.current.add(data.id);
      if (data.userId !== me.id) playSfx("pop");
      setMsgs((prev) => (prev.length >= 120 ? [...prev.slice(-119), data] : [...prev, data]));
    }
    if (event === "typing") {
      if (data.self === me.id || data.nickname === me.nickname) return;
      setTypingName(data.nickname);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingName(null), 3500);
    }
  });

  const pick = (r: any) => {
    if (r.isAdult && !me.adultRoomOk) setAdultRoom(r);
    else if (r.premium && r.locked) setPremiumRoom(r);
    else setSlug(r.slug);
  };

  const send = async (kind: "text" | "voice" = "text", contentOverride?: string) => {
    const content = kind === "voice" ? contentOverride : input.trim();
    if (!content) return;
    try {
      await api("/api/chat", { action: "send", room: slug, content, kind });
      playSfx("send");
      if (kind === "text") setInput("");
    } catch (e: any) {
      toast(
        e.message === "age" ? t("chat.ageErr") : e.message === "adult" ? t("err.adultOnly") : e.message === "premium" ? t("err.premium") : e.message === "limit" ? t("limits.msg") : t("err.generic"),
        "err"
      );
    }
  };

  const onTyping = () => {
    const now = Date.now();
    if (input.trim() && now - lastTyping.current > 2500) {
      lastTyping.current = now;
      api("/api/chat", { action: "typing", room: slug }).catch(() => {});
    }
  };

  const { recording, secs, start, stop } = useVoice((url) => send("voice", url), () =>
    toast(t("chat.micErr"), "err")
  );

  const groups: { label: string; icon: any; items: any[]; live?: boolean }[] = [
    { label: t("chat.global"), icon: IcWave, items: rooms.filter((r) => !r.language && !r.isAdult && r.kind === "general") },
    { label: t("chat.live"), icon: IcEye, items: rooms.filter((r) => r.kind === "live"), live: true },
    { label: t("chat.langRooms"), icon: IcGlobe, items: rooms.filter((r) => !!r.language) },
    { label: t("chat.thematic"), icon: IcGamepad, items: rooms.filter((r) => !r.language && !r.isAdult && r.kind === "gaming") },
    { label: lang === "it" ? "Sfoghi" : "Vent", icon: IcVent, items: rooms.filter((r) => !r.language && !r.isAdult && r.kind === "vent") },
    { label: t("chat.adult"), icon: IcLock, items: rooms.filter((r) => r.isAdult) },
  ];

  const room = rooms.find((r) => r.slug === slug);
  let lastDay = "";

  return (
    <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[250px_1fr]">
      {/* rooms */}
      <aside className="hidden min-h-0 flex-col border-r border-line md:flex">
        <div className="flex-1 overflow-y-auto scroll-thin p-3">
          {groups.map(
            (g) =>
              g.items.length > 0 && (
                <div key={g.label} className="mb-4">
                  <p className="mb-1.5 flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-mist-2">
                    <g.icon className="h-3 w-3" /> {g.label}
                    {g.live && (
                      <span className="live-pulse ml-1 rounded-sm bg-coral-500 px-1 py-px text-[8px] font-black text-white">LIVE</span>
                    )}
                  </p>
                  {g.items.map((r) => (
                    <button
                      key={r.slug}
                      onClick={() => pick(r)}
                      className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition ${
                        slug === r.slug ? "bg-tide-500/12 text-foam" : "text-mist hover:bg-ink-800 hover:text-foam"
                      }`}
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: `hsl(${r.hue} 70% 55%)` }} />
                      <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
                      {r.premium && <IcStar2 className="h-3.5 w-3.5 shrink-0 text-sun-400" />}
                      {r.kind === "live" && <span className="live-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-coral-500" />}
                      <span className="online-pop flex shrink-0 items-center gap-1 text-[9px] font-bold text-tide-400/80">
                        <span className="h-1 w-1 rounded-full bg-tide-400" /> {online[r.slug] ?? onlineBase(r.slug)}
                      </span>
                    </button>
                  ))}
                </div>
              )
          )}
        </div>
        <div className="border-t border-line p-3">
          <p className="flex items-center gap-2 text-[10px] font-semibold text-mist-2">
            <IcShield className="h-3.5 w-3.5 text-tide-500" />
            {t("chat.modNote")}
          </p>
        </div>
      </aside>

      {/* panel */}
      <section className="flex min-h-0 flex-col">
        <div className="border-b border-line p-2 md:hidden">
          <select className="field" value={slug} onChange={(e) => pick(rooms.find((r) => r.slug === e.target.value))}>
            {rooms.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
                {r.isAdult ? " · 18+" : ""}
                {r.kind === "live" ? " · LIVE" : ""}
              </option>
            ))}
          </select>
        </div>

        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-display text-base font-extrabold">
              {room?.name}
              {room?.language && (
                <span className="rounded bg-ink-700 px-1.5 py-px text-[10px] font-bold uppercase text-mist">{room.language}</span>
              )}
              {room?.kind === "live" && (
                <span className="live-pulse flex items-center gap-1 rounded-md bg-coral-500 px-1.5 py-px text-[9px] font-black text-white">
                  ● LIVE
                </span>
              )}
              {room?.premium && (
                <span className="flex items-center gap-1 rounded-md bg-sun-400/90 px-1.5 py-px text-[9px] font-black text-ink-950">
                  <IcStar2 className="h-2.5 w-2.5" /> PREMIUM
                </span>
              )}
              {room?.group === "minor" && (
                <span className="rounded-md bg-sky-400/15 px-1.5 py-px text-[10px] font-bold text-sky-300">{t("badge.minor")}</span>
              )}
            </h2>
            <p className="truncate text-xs text-mist-2">{room?.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="online-pop flex items-center gap-1.5 rounded-full border border-tide-500/25 bg-tide-500/8 px-2.5 py-1 text-[10px] font-bold text-tide-300">
              <span className="h-1.5 w-1.5 rounded-full bg-tide-400 rec-dot" />
              {t("chat.online", { n: online[slug] ?? onlineBase(slug) })}
            </span>
          </div>
        </header>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto scroll-thin px-4 py-3">
          {msgs.length === 0 && <Empty icon={<IcChat className="h-8 w-8" />} title={t("chat.empty")} />}
          {msgs.map((m) => {
            const day = dayLabel(m.createdAt, lang);
            const divider = day !== lastDay;
            lastDay = day;
            const anon = !!m.alias;
            if (m.kind === "system")
              return (
                <div key={m.id}>
                  {divider && <DaySep label={day} />}
                  <div className="my-3 flex justify-center">
                    <span className="flex items-center gap-1.5 rounded-full border border-line bg-ink-900 px-3 py-1 text-[11px] text-mist-2">
                      <IcShield className="h-3 w-3 text-tide-500" /> {m.content}
                    </span>
                  </div>
                </div>
              );
            return (
              <div key={m.id}>
                {divider && <DaySep label={day} />}
                <div
                  className={`group anim-msg relative mb-2.5 flex gap-3 rounded-lg p-2 transition ${
                    m.userId === me.id ? "bg-tide-500/6" : "hover:bg-ink-850"
                  } ${m.flagged ? "border-l-2 border-coral-500" : ""}`}
                >
                  <Avatar name={anon ? "Anon" : m.nickname} hue={anon ? 205 : m.hue} size={32} plus={!anon && m.plus} bot={m.isBot} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                      <span className="font-display font-bold text-foam/95">{anon ? m.alias : m.nickname}</span>
                      {m.isBot && (
                        <span className="rounded bg-ink-700 px-1 py-px text-[9px] font-bold uppercase text-tide-300">{t("chat.bot")}</span>
                      )}
                      {!anon && m.ageGroup === "minor" && (
                        <span className="rounded bg-sky-400/15 px-1 py-px text-[9px] font-bold text-sky-300">{t("badge.minor")}</span>
                      )}
                      {m.flagged && (
                        <span className="flex items-center gap-1 rounded bg-coral-500/15 px-1.5 py-px text-[9px] font-bold uppercase text-coral-300">
                          <IcFlag className="h-2.5 w-2.5" /> {t("chat.flagged")}
                        </span>
                      )}
                      <span className="text-[10px] text-mist-2">{timeHM(m.createdAt, lang)}</span>
                    </p>
                    {m.kind === "voice" ? (
                      <audio controls src={m.content} className="mt-1" />
                    ) : (
                      <p className="mt-0.5 break-words text-sm leading-relaxed text-foam/85">{m.content}</p>
                    )}
                  </div>
                  {!m.isBot && !anon && m.userId !== me.id && (
                    <button
                      onClick={() => setReport({ type: "message", id: m.id, nick: m.nickname })}
                      className="absolute -top-1.5 right-1 hidden rounded-md border border-line bg-ink-800 p-1 text-mist-2 transition hover:text-coral-300 group-hover:block"
                      title={t("chat.flag")}
                    >
                      <IcFlag className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* typing */}
        <div className="h-6 px-5">
          {typingName && (
            <p className="flex items-center gap-2 text-[11px] font-medium text-tide-300">
              <span className="flex gap-0.5">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </span>
              {t("chat.typing", { name: typingName })}
            </p>
          )}
        </div>

        {/* composer */}
        <div className="border-t border-line p-3">
          {recording ? (
            <div className="flex items-center gap-3 rounded-lg border border-coral-500/40 bg-coral-500/8 px-3 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-coral-500 rec-dot" />
              <span className="text-xs font-semibold text-coral-300">
                {t("chat.rec")} {secs}s / 20s
              </span>
              <div className="ml-auto flex gap-2">
                <Btn variant="danger" size="sm" onClick={stop}>
                  <IcStop className="h-3.5 w-3.5" /> {t("c.cancel")}
                </Btn>
                <Btn size="sm" onClick={stop}>
                  <IcSend className="h-3.5 w-3.5" /> {t("c.send")}
                </Btn>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={start}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-mist transition hover:border-tide-500/40 hover:text-tide-300"
              >
                <IcMic className="h-4 w-4" />
              </button>
              <input
                className="field flex-1"
                placeholder={t("chat.ph")}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  onTyping();
                }}
                onKeyDown={(e) => e.key === "Enter" && send()}
                maxLength={500}
              />
              <Btn onClick={() => send()} disabled={!input.trim()} className="h-10">
                <IcSend className="h-4 w-4" />
              </Btn>
            </div>
          )}
        </div>
      </section>

      {/* adult consent */}
      <Modal open={!!adultRoom} onClose={() => setAdultRoom(null)} title={t("chat.enterAdult")}>
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-coral-500/30 bg-coral-500/8 p-3">
          <IcLock className="mt-0.5 h-5 w-5 shrink-0 text-coral-300" />
          <p className="text-xs leading-relaxed text-mist">{t("chat.adultOk")}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={() => setAdultRoom(null)}>
            {t("c.cancel")}
          </Btn>
          <Btn
            onClick={async () => {
              try {
                await api("/api/chat", { action: "adult" });
                setSlug(adultRoom.slug);
                setAdultRoom(null);
              } catch {}
            }}
          >
            {t("c.confirm")}
          </Btn>
        </div>
      </Modal>

      {/* premium room checkout */}
      <Checkout
        open={!!premiumRoom}
        onClose={() => setPremiumRoom(null)}
        title={premiumRoom?.name ?? ""}
        amountCents={199}
        sub={t("premium.sub")}
        payLabel={t("premium.buy")}
        payKind="premium"
        payTargetId={premiumRoom?.id}
        onDone={async (card) => {
          await api("/api/store", { action: "premium-ticket", roomId: premiumRoom!.id, card });
          setSlug(premiumRoom!.slug);
          setPremiumRoom(null);
        }}
      />

      {/* report modal */}
      <Modal open={!!report} onClose={() => setReport(null)} title={t("chat.flag")}>
        <p className="mb-3 text-xs text-mist">{report?.nick}</p>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <Chip key={r} active={reason === r} onClick={() => setReason(r)}>
              {t(`saf.reason_${r}`)}
            </Chip>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Btn
            disabled={!reason}
            onClick={async () => {
              try {
                await api("/api/chat", { action: "report", targetType: report!.type, targetId: report!.id, reason });
                toast(t("saf.sent"));
                setReport(null);
                setReason("");
              } catch {}
            }}
          >
            <IcFlag className="h-4 w-4" /> {t("c.confirm")}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}

function DaySep({ label }: { label: string }) {
  return (
    <div className="my-3 flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-mist-2">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
