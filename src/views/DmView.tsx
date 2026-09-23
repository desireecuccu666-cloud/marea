"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { t as tFn } from "@/lib/i18n";
import { api } from "@/lib/api";
import { useVoice } from "@/lib/useVoice";
import { useLive } from "@/lib/useLive";
import { playSfx } from "@/lib/sounds";
import { Avatar, Btn, Chip, Modal, toast, timeHM, timeAgo, useAutoScroll, Empty, fmtMoney } from "@/components/ui";
import Checkout from "@/components/Checkout";
import {
  IcMic,
  IcStop,
  IcSend,
  IcVideo,
  IcVideoOff,
  IcFlag,
  IcShield,
  IcMicOff,
  IcChat,
  IcLock,
  IcX,
  IcEyeOff,
  IcGift,
} from "@/components/Icons";
import type { PublicUser } from "@/lib/types";

const REASONS = ["spam", "harass", "scam", "other"] as const;

export default function DmView({
  me,
  lang,
  initialDm,
  initCall,
  clearInitialDm,
}: {
  me: PublicUser;
  lang: string;
  initialDm: string | null;
  initCall: boolean;
  clearInitialDm: () => void;
}) {
  const t = (k: string, vars?: Record<string, string | number>) => tFn(lang, k, vars);
  const [convs, setConvs] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(initialDm);
  const [dmData, setDmData] = useState<any>(null);
  const [input, setInput] = useState("");
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [call, setCall] = useState(false);
  const [report, setReport] = useState(false);
  const [reason, setReason] = useState("");
  const [tipPick, setTipPick] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [tipAmt, setTipAmt] = useState(100);
  const listRef = useAutoScroll(dmData?.messages?.length + (active ?? ""));
  const didInit = useRef(false);

  const loadConvs = useCallback(async () => {
    try {
      const d = await api("/api/dm");
      setConvs(d.conversations);
    } catch {}
  }, []);

  const loadDm = useCallback(
    async (id: string | null, markRead = true) => {
      if (!id) {
        setDmData(null);
        return;
      }
      try {
        const d = await api(`/api/dm?dm=${id}`);
        setDmData(d);
        if (markRead) api("/api/dm", { action: "read", dmId: id }).catch(() => {});
      } catch {}
    },
    []
  );

  useEffect(() => {
    if (initialDm && !didInit.current) {
      didInit.current = true;
      setActive(initialDm);
      clearInitialDm();
    }
    loadConvs();
    const iv = setInterval(loadConvs, 5000);
    return () => clearInterval(iv);
  }, [initialDm, loadConvs, clearInitialDm]);

  useEffect(() => {
    loadDm(active);
    if (!active) return;
    const iv = setInterval(() => loadDm(active, true), 3000);
    return () => clearInterval(iv);
  }, [active, loadDm]);

  useEffect(() => {
    api("/api/safety")
      .then((d) => setBlockedIds(new Set(d.blocks.map((b: any) => b.user?.id))))
      .catch(() => {});
  }, []);

  /* auto-open video call when arriving from a match */
  useEffect(() => {
    if (initCall && dmData?.peer) {
      setCall(true);
      clearInitialDm();
    }
  }, [initCall, dmData, clearInitialDm]);

  /* real-time: SSE on the active conversation */
  useLive(active ? `dm:${active}` : null, (event, data) => {
    if (event !== "dm" || !active || data.dmId !== active) return;
    if (data.senderId !== me.id) playSfx("pop");
    setDmData((prev: any) => {
      if (!prev || prev.messages?.some((m: any) => m.id === data.id)) return prev;
      return { ...prev, messages: [...(prev.messages ?? []), data] };
    });
    api("/api/dm", { action: "read", dmId: active }).catch(() => {});
  });

  const send = async (kind: "text" | "voice" = "text", contentOverride?: string) => {
    if (!active) return;
    const content = kind === "voice" ? contentOverride : input.trim();
    if (!content) return;
    try {
      await api("/api/dm", { action: "send", dmId: active, content, kind });
      playSfx("send");
      if (kind === "text") setInput("");
      setTimeout(() => loadDm(active, true), 250);
    } catch (e: any) {
      toast(t("err.generic"), "err");
    }
  };

  const { recording, secs, start, stop } = useVoice((url) => send("voice", url), () => toast(t("chat.micErr"), "err"));

  const peer = dmData?.peer;
  const blocked = peer ? blockedIds.has(peer.id) : false;

  const blockToggle = async () => {
    if (!peer) return;
    try {
      await api("/api/chat", { action: blocked ? "unblock" : "block", userId: peer.id });
      setBlockedIds((s) => {
        const n = new Set(s);
        if (blocked) n.delete(peer.id);
        else n.add(peer.id);
        return n;
      });
    } catch {}
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[280px_1fr]">
      {/* conversations */}
      <aside className="hidden min-h-0 flex-col border-r border-line md:flex">
        <div className="flex-1 overflow-y-auto scroll-thin p-2">
          {convs.length === 0 && (
            <div className="p-4">
              <Empty icon={<IcChat className="h-7 w-7" />} title={t("dm.empty")} />
            </div>
          )}
          {convs.map((c) =>
            c.peer ? (
              <button
                key={c.dmId}
                onClick={() => setActive(c.dmId)}
                className={`mb-0.5 flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition ${
                  active === c.dmId ? "bg-tide-500/12" : "hover:bg-ink-800"
                }`}
              >
                <Avatar name={c.peer.nickname} hue={c.peer.hue} size={38} plus={c.peer.plus} bot={c.peer.isBot} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center justify-between gap-2">
                    <span className="truncate font-display text-sm font-bold">{c.peer.nickname}</span>
                    {c.last && <span className="shrink-0 text-[10px] text-mist-2">{timeAgo(c.last.at, lang)}</span>}
                  </p>
                  <p className="truncate text-xs text-mist-2">
                    {c.last ? (c.last.kind === "voice" ? "· " + (lang === "en" ? "voice message" : "messaggio vocale") : c.last.content) : ""}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-tide-500 px-1 text-[10px] font-bold text-ink-950">
                    {c.unread}
                  </span>
                )}
              </button>
            ) : null
          )}
        </div>
      </aside>

      {/* chat panel */}
      <section className="flex min-h-0 flex-col">
        {/* mobile conv picker */}
        <div className="border-b border-line p-2 md:hidden">
          <select className="field" value={active ?? ""} onChange={(e) => setActive(e.target.value || null)}>
            <option value="">{t("dm.title")}</option>
            {convs.map((c) => (
              <option key={c.dmId} value={c.dmId}>
                {c.peer?.nickname}
              </option>
            ))}
          </select>
        </div>

        {peer ? (
          <>
            <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={peer.nickname} hue={peer.hue} size={34} plus={peer.plus} bot={peer.isBot} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-display text-sm font-bold">
                    <span className="truncate">{peer.nickname}</span>
                    {peer.verified && <IcShield className="h-3.5 w-3.5 shrink-0 text-tide-400" />}
                    {peer.ageGroup === "minor" && (
                      <span className="rounded bg-sky-400/15 px-1 py-px text-[9px] font-bold text-sky-300">{t("badge.minor")}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-mist-2">{peer.country} · {peer.language.toUpperCase()}</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    if (peer.isBot) {
                      toast(t("tip.bot"), "err");
                      return;
                    }
                    setTipPick(true);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-mist transition hover:border-sun-400/50 hover:text-sun-300"
                  title={t("tip.title")}
                >
                  <IcGift className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCall(true)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-mist transition hover:border-tide-500/40 hover:text-tide-300"
                  title={lang === "en" ? "Video call" : "Videochiamata"}
                >
                  <IcVideo className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setReport(true)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-mist transition hover:border-coral-500/40 hover:text-coral-300"
                >
                  <IcFlag className="h-4 w-4" />
                </button>
                <button
                  onClick={blockToggle}
                  className={`grid h-8 w-8 place-items-center rounded-lg border transition ${
                    blocked
                      ? "border-coral-500/50 bg-coral-500/15 text-coral-300"
                      : "border-line text-mist hover:border-coral-500/40 hover:text-coral-300"
                  }`}
                >
                  <IcLock className="h-4 w-4" />
                </button>
              </div>
            </header>

            {blocked && (
              <div className="flex items-center justify-between gap-2 border-b border-coral-500/20 bg-coral-500/8 px-4 py-2">
                <span className="text-xs font-semibold text-coral-300">{t("dm.blocked")}</span>
                <Btn variant="danger" size="sm" onClick={blockToggle}>
                  {t("dm.unblock")}
                </Btn>
              </div>
            )}

            <div ref={listRef} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto scroll-thin px-4 py-3">
              {dmData?.messages.map((m: any) => {
                const mine = m.senderId === me.id;
                return (
                  <div key={m.id} className={`anim-msg flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                        mine
                          ? "rounded-br-md bg-tide-500/15 border border-tide-500/20"
                          : "rounded-bl-md border border-line bg-ink-800"
                      }`}
                    >
                      {m.kind === "voice" ? (
                        <audio controls src={m.content} className="mt-0.5" />
                      ) : (
                        <p className="break-words text-sm leading-relaxed text-foam/90">{m.content}</p>
                      )}
                      <p className={`mt-1 text-[10px] ${mine ? "text-right" : ""} text-mist-2`}>{timeHM(m.createdAt, lang)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

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
                    disabled={blocked}
                    placeholder={blocked ? t("dm.blocked") : t("chat.ph")}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    maxLength={500}
                  />
                  <Btn onClick={() => send()} disabled={!input.trim() || blocked} className="h-10">
                    <IcSend className="h-4 w-4" />
                  </Btn>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center">
            <Empty
              icon={<IcChat className="h-8 w-8" />}
              title={t("dm.empty")}
              sub={lang === "it" ? "Trova qualcuno nelle Maree o nei Match, poi scrivigli qui." : undefined}
            />
          </div>
        )}
      </section>

      {/* tip */}
      <Modal open={tipPick} onClose={() => setTipPick(false)} title={t("tip.title")}>
        <p className="text-xs leading-relaxed text-mist">{t("tip.sub", { name: peer?.nickname ?? "" })}</p>
        <div className="mt-4 flex gap-2">
          {[100, 200, 500].map((a) => (
            <Chip key={a} active={tipAmt === a} onClick={() => setTipAmt(a)} className="px-4 py-2 text-sm font-bold">
              {fmtMoney(a)}
            </Chip>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Btn variant="sun" onClick={() => { setTipPick(false); setTipOpen(true); }}>
            <IcGift className="h-4 w-4" /> {t("c.send")}
          </Btn>
        </div>
      </Modal>
      {peer && (
        <Checkout
          open={tipOpen}
          onClose={() => setTipOpen(false)}
          title={t("tip.title")}
          amountCents={tipAmt}
          sub={t("tip.sub", { name: peer.nickname })}
          payLabel={t("c.send")}
          payKind="tip"
          payTargetId={peer.id}
          onDone={async (card) => {
            try {
              await api("/api/store", { action: "tip", targetId: peer.id, amount: tipAmt, card });
              toast(t("tip.sent"));
            } catch (e: any) {
              throw e;
            }
          }}
        />
      )}

      {/* video call */}
      {peer && <CallModal open={call} onClose={() => setCall(false)} peer={peer} me={me} t={t} />}

      {/* report */}
      <Modal open={report} onClose={() => setReport(false)} title={t("chat.flag")}>
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
                await api("/api/chat", { action: "report", targetType: "user", targetId: peer!.id, reason });
                toast(t("saf.sent"));
                setReport(false);
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

/* ---------------- video call with consent ---------------- */
function CallModal({
  open,
  onClose,
  peer,
  me,
  t,
}: {
  open: boolean;
  onClose: () => void;
  peer: PublicUser;
  me: PublicUser;
  t: (k: string) => string;
}) {
  const [phase, setPhase] = useState<"consent" | "live" | "nocam">("consent");
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [secs, setSecs] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAll = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (!open) {
      stopAll();
      setPhase("consent");
      setSecs(0);
      setCamOn(true);
      setMicOn(true);
    }
  }, [open]);

  const begin = async () => {
    playSfx("call");
    if (!me.showVideo) {
      setPhase("live");
      timerRef.current = setInterval(() => setSecs((s) => s + 1), 1000);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setPhase("live");
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 50);
      timerRef.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } catch {
      setPhase("nocam");
      timerRef.current = setInterval(() => setSecs((s) => s + 1), 1000);
    }
  };

  const close = () => {
    stopAll();
    onClose();
  };

  const toggleCam = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    } else setCamOn(!camOn);
  };
  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    } else setMicOn(!micOn);
  };

  if (!open) return null;
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink-950/95" onClick={close} />
      <div className="card anim-pop relative w-full max-w-3xl overflow-hidden">
        {phase === "consent" ? (
          <div className="p-8 text-center">
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-tide-500/15 text-tide-300">
              <IcVideo className="h-7 w-7" />
            </span>
            <h3 className="font-display text-lg font-bold">{t("dm.consent")}</h3>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-mist">{t("dm.consentSub")}</p>
            <div className="mt-3 flex justify-center">
              <span className="flex items-center gap-1.5 rounded-full border border-line bg-ink-950 px-3 py-1 text-[10px] text-mist-2">
                <IcEyeOff className="h-3 w-3" /> {t("dm.norec")}
              </span>
            </div>
            <div className="mt-6 flex justify-center gap-2">
              <Btn variant="ghost" onClick={close}>
                {t("c.cancel")}
              </Btn>
              <Btn onClick={begin}>
                <IcVideo className="h-4 w-4" /> {t("dm.start")}
              </Btn>
            </div>
          </div>
        ) : (
          <>
            <div className="relative grid h-[420px] grid-cols-2 gap-px bg-line">
              {/* remote (peer placeholder) */}
              <div className="relative flex flex-col items-center justify-center gap-3 bg-ink-900">
                <Avatar name={peer.nickname} hue={peer.hue} size={84} plus={peer.plus} />
                <p className="font-display font-bold">{peer.nickname}</p>
                <p className="flex items-center gap-2 text-xs text-mist-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-tide-400 rec-dot" /> {t("dm.waiting")}
                </p>
              </div>
              {/* local */}
              <div className="relative flex flex-col items-center justify-center gap-3 bg-ink-950">
                {phase === "nocam" || !me.showVideo ? (
                  <>
                    <Avatar name={me.nickname} hue={me.hue} size={84} />
                    {phase === "nocam" && (
                      <div className="px-6 text-center">
                        <p className="text-sm font-semibold text-coral-300">{t("dm.noCam")}</p>
                        <p className="mt-1 text-[11px] text-mist-2">{t("dm.noCamSub")}</p>
                      </div>
                    )}
                  </>
                ) : camOn ? (
                  <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" style={{ transform: "scaleX(-1)" }} />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-mist-2">
                    <IcVideoOff className="h-10 w-10" />
                    <p className="text-xs">{t("dm.noCam")}</p>
                  </div>
                )}
                <span className="absolute bottom-3 left-3 rounded-md bg-ink-950/80 px-2 py-1 text-[10px] font-semibold text-mist">
                  {t("c.you")} · {mm}:{ss}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 border-t border-line p-4">
              <button
                onClick={toggleMic}
                className={`grid h-11 w-11 place-items-center rounded-full border transition ${
                  micOn ? "border-line text-mist hover:text-foam" : "border-coral-500/50 bg-coral-500/15 text-coral-300"
                }`}
              >
                {micOn ? <IcMic className="h-5 w-5" /> : <IcMicOff className="h-5 w-5" />}
              </button>
              <Btn variant="danger" size="lg" onClick={close}>
                <IcX className="h-4 w-4" /> {t("dm.end")}
              </Btn>
              <button
                onClick={toggleCam}
                disabled={!me.showVideo}
                className={`grid h-11 w-11 place-items-center rounded-full border transition disabled:opacity-30 ${
                  camOn && me.showVideo ? "border-line text-mist hover:text-foam" : "border-coral-500/50 bg-coral-500/15 text-coral-300"
                }`}
              >
                {camOn && me.showVideo ? <IcVideo className="h-5 w-5" /> : <IcVideoOff className="h-5 w-5" />}
              </button>
            </div>
            <p className="pb-3 text-center text-[10px] text-mist-2">
              <IcEyeOff className="mr-1 inline h-3 w-3" />
              {t("dm.norec")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
