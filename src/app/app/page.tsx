"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { t as tFn, type Lang } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Avatar, toast, useDebounced } from "@/components/ui";
import { LANGS, COUNTRIES } from "@/lib/constants";
import type { PublicUser } from "@/lib/types";
import {
  IcWave,
  IcChat,
  IcUsers,
  IcHeart,
  IcStore,
  IcShield,
  IcSearch,
  IcLogout,
  IcCrown,
  IcGlobe,
  IcChevronD,
  IcTrophy,
  IcSound,
  IcMute,
} from "@/components/Icons";
import {
  restoreSoundPreference,
  setSoundEnabled,
  soundEnabled,
  playSfx,
  unlockAudio,
} from "@/lib/sounds";
import ChatView from "@/views/ChatView";
import DmView from "@/views/DmView";
import MatchView from "@/views/MatchView";
import MarketView from "@/views/MarketView";
import ProfileView from "@/views/ProfileView";
import SafetyView from "@/views/SafetyView";
import LeaderboardView from "@/views/LeaderboardView";

type View = "chat" | "dms" | "match" | "lb" | "market" | "profile" | "safety";

export default function AppShell() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | undefined>(undefined);
  const [verifyCode, setVerifyCode] = useState<string | null>(null);
  const [view, setView] = useState<View>("chat");
  const [initDm, setInitDm] = useState<string | null>(null);
  const [initCall, setInitCall] = useState(false);
  const [unread, setUnread] = useState(0);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PublicUser[]>([]);
  const [searchFocus, setSearchFocus] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: "ok" | "err" }[]>([]);
  const [onlineTotal, setOnlineTotal] = useState(112);
  const [soundOn, setSoundOn] = useState(false);
  const dq = useDebounced(q, 300);

  const lang: Lang = ((user?.language ?? "it") as Lang) || "it";
  const t = (k: string, vars?: Record<string, string | number>) => tFn(lang, k, vars);

  /* boot */
  useEffect(() => {
    (async () => {
      try {
        const d = await api("/api/auth");
        setUser(d.user);
        setVerifyCode(d.verifyCode);
        if (d.pendingPayment) {
          toast("Pagamento ricevuto ✓");
          playSfx("cash");
          const d2 = await api("/api/auth");
          setUser(d2.user);
        }
      } catch {
        router.replace("/");
      }
    })();
  }, [router]);

  /* toasts */
  useEffect(() => {
    const h = (e: Event) => {
      const { msg, kind } = (e as CustomEvent).detail;
      if (!msg) return;
      playSfx(kind === "err" ? "err" : "pop");
      const id = Date.now() + Math.random();
      setToasts((ts) => [...ts, { id, msg, kind }]);
      setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3200);
    };
    window.addEventListener("marea:toast", h);
    return () => window.removeEventListener("marea:toast", h);
  }, []);

  /* sound preference + audio unlock on first gesture */
  useEffect(() => {
    restoreSoundPreference();
    setSoundOn(soundEnabled());
    const un = () => unlockAudio();
    window.addEventListener("pointerdown", un, { once: true });
    return () => window.removeEventListener("pointerdown", un);
  }, []);

  /* Stripe redirect return: confirm + record the purchase */
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const session = sp.get("session");
    if (!sp.get("paid") && !sp.get("cancelled")) return;
    history.replaceState({}, "", "/app");
    if (sp.get("cancelled")) {
      toast("Pagamento annullato", "err");
      return;
    }
    if (session) {
      api("/api/checkout", { action: "confirm", sessionId: session })
        .then((d) => {
          if (d?.paid) {
            toast("Pagamento ricevuto ✓");
            playSfx("cash");
            api("/api/auth").then((d2) => setUser(d2.user)).catch(() => {});
          } else {
            toast("Pagamento annullato", "err");
          }
        })
        .catch(() => toast("Pagamento annullato", "err"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* unread badge + presence total */
  useEffect(() => {
    if (!user) return;
    const check = () =>
      api("/api/dm")
        .then((d) => setUnread(d.conversations.reduce((a: number, c: any) => a + c.unread, 0)))
        .catch(() => {});
    check();
    const iv = setInterval(check, 20000);
    const pop = setInterval(() => setOnlineTotal((n) => Math.max(60, n + Math.floor(Math.random() * 11) - 5)), 20000);
    return () => {
      clearInterval(iv);
      clearInterval(pop);
    };
  }, [user]);

  /* search */
  useEffect(() => {
    if (dq.trim().length < 2) {
      setResults([]);
      return;
    }
    (async () => {
      try {
        const d = await api(`/api/users?q=${encodeURIComponent(dq.trim())}`);
        setResults(d.users);
      } catch {
        setResults([]);
      }
    })();
  }, [dq]);

  const gotoDm = useCallback((dmId: string, call = false) => {
    setInitDm(dmId);
    setInitCall(call);
    setView("dms");
  }, []);

  const changeLang = (l: string) => {
    if (!user) return;
    setUser({ ...user, language: l });
    api("/api/profile", { language: l }).catch(() => {});
  };
  const changeCountry = (c: string) => {
    if (!user) return;
    setUser({ ...user, country: c });
    api("/api/profile", { country: c }).catch(() => {});
  };

  const logout = async () => {
    await api("/api/auth", { action: "logout" }).catch(() => {});
    router.replace("/");
  };

  const startDmFromSearch = async (peerId: string) => {
    setQ("");
    setResults([]);
    try {
      const d = await api("/api/dm", { action: "start", peerId });
      gotoDm(d.dmId);
    } catch (e: any) {
      toast(e.message === "age" ? t("dm.ageErr") : t("err.generic"), "err");
    }
  };

  if (user === undefined) {
    return (
      <div className="bg-tide grid h-dvh place-items-center">
        <div className="flex flex-col items-center gap-4">
          <span className="anim-float grid h-14 w-14 place-items-center rounded-2xl bg-tide-500/15 text-tide-300">
            <IcWave className="h-7 w-7" />
          </span>
          <div className="wave-load h-1.5 w-40 rounded-full bg-ink-700" />
        </div>
      </div>
    );
  }

  const NAV: { id: View; icon: any; label: string; badge?: number }[] = [
    { id: "chat", icon: IcWave, label: t("nav.chat") },
    { id: "dms", icon: IcChat, label: t("nav.dms"), badge: unread },
    { id: "match", icon: IcHeart, label: t("nav.match") },
    { id: "lb", icon: IcTrophy, label: t("nav.lb") },
    { id: "market", icon: IcStore, label: t("nav.market") },
    { id: "profile", icon: IcUsers, label: t("nav.profile") },
    { id: "safety", icon: IcShield, label: t("nav.safety") },
  ];
  const current = NAV.find((n) => n.id === view);

  const tickerItems = [
    `LIVE · ${onlineTotal} ${lang === "it" ? "persone in mare adesso" : lang === "es" ? "personas en el mar ahora" : lang === "fr" ? "personnes sur la vague" : lang === "de" ? "Menschen gerade im Meer" : "people on the tide now"}`,
    t("ticker.1"),
    t("ticker.2"),
    t("ticker.3"),
    t("ticker.4"),
    t("ticker.5"),
    t("ticker.6"),
  ];

  return (
    <div className="bg-tide flex h-dvh overflow-hidden">
      {/* sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-ink-900/70 md:flex">
        <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-tide-500/15 text-tide-300">
            <IcWave className="h-4 w-4" />
          </span>
          <span className="text-tide-grad font-display text-lg font-extrabold tracking-tight">Marea</span>
          <span className="ml-auto flex items-center gap-1 rounded bg-ink-700 px-1.5 py-0.5 text-[9px] font-bold text-mist">
            <span className="h-1 w-1 rounded-full bg-tide-400 rec-dot" /> {onlineTotal}
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                view === n.id ? "bg-tide-500/12 text-foam shadow-[inset_2px_0_0_0_var(--color-tide-400)]" : "text-mist hover:bg-ink-800 hover:text-foam"
              }`}
            >
              <n.icon className={`h-4 w-4 ${view === n.id ? "text-tide-300" : ""}`} />
              {n.label}
              {!!n.badge && (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-tide-500 px-1 text-[10px] font-bold text-ink-950">
                  {n.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {!user.plus && (
          <button
            onClick={() => setView("profile")}
            className="mx-3 mb-3 rounded-xl border border-sun-400/30 bg-gradient-to-br from-sun-400/15 to-sun-500/5 p-3.5 text-left transition hover:border-sun-400/50"
          >
            <p className="flex items-center gap-1.5 text-xs font-extrabold text-sun-300">
              <IcCrown className="h-4 w-4" /> Marea+
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-mist">
              {lang === "it" ? "Match illimitati, annunci in evidenza, corona dorata." : "Unlimited matches, featured listings, golden crown."}
            </p>
          </button>
        )}

        <div className="flex items-center gap-2.5 border-t border-line p-3.5">
          <button onClick={() => setView("profile")} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
            <Avatar name={user.nickname} hue={user.hue} size={34} plus={user.plus} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user.nickname}</p>
              <p className="flex items-center gap-1 text-[10px] text-mist-2">
                {user.ageGroup === "minor" ? (
                  <span className="rounded bg-sky-400/15 px-1 text-[9px] font-bold text-sky-300">{t("badge.minor")}</span>
                ) : (
                  <span className="rounded bg-coral-500/15 px-1 text-[9px] font-bold text-coral-300">18+</span>
                )}
                {user.country}
              </p>
            </div>
          </button>
          <button onClick={logout} className="rounded-lg p-2 text-mist-2 transition hover:bg-ink-800 hover:text-coral-300" title="logout">
            <IcLogout className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line bg-ink-900/40 px-4 py-2.5">
          <h1 className="hidden shrink-0 font-display text-base font-extrabold md:block">{current?.label}</h1>

          <div className="relative max-w-xs flex-1">
            <IcSearch className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mist-2" />
            <input
              className="field py-2 pl-8 text-xs"
              placeholder={t("top.searchPh")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setTimeout(() => setSearchFocus(false), 150)}
            />
            {searchFocus && results.length > 0 && (
              <div className="card absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden p-1.5">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onMouseDown={() => startDmFromSearch(r.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-ink-800"
                  >
                    <Avatar name={r.nickname} hue={r.hue} size={28} plus={r.plus} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-xs font-bold">
                        {r.nickname}
                        {r.ageGroup === "minor" && (
                          <span className="rounded bg-sky-400/15 px-1 text-[9px] font-bold text-sky-300">{t("badge.minor")}</span>
                        )}
                      </p>
                      <p className="truncate text-[10px] text-mist-2">
                        {r.country} · {r.bio || r.interests.join(", ")}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                const v = !soundOn;
                setSoundEnabled(v);
                setSoundOn(v);
              }}
              className={`grid h-9 w-9 place-items-center rounded-lg border transition ${
                soundOn ? "border-tide-500/50 bg-tide-500/10 text-tide-300" : "border-line text-mist-2 hover:text-mist"
              }`}
              title={soundOn ? "Suoni: on (effetti + onde)" : "Suoni: off"}
            >
              {soundOn ? <IcSound className="h-4 w-4" /> : <IcMute className="h-4 w-4" />}
            </button>
            <div className="relative hidden sm:block">
              <select className="field w-auto appearance-none py-2 pl-3 pr-7 text-xs" value={user.language} onChange={(e) => changeLang(e.target.value)}>
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native}
                  </option>
                ))}
              </select>
              <IcChevronD className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-mist-2" />
            </div>
            <div className="relative hidden lg:block">
              <select className="field w-auto appearance-none py-2 pl-3 pr-7 text-xs" value={user.country} onChange={(e) => changeCountry(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
              <IcGlobe className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mist-2" />
            </div>
            {!user.plus && user.ageGroup === "adult" && (
              <button
                onClick={() => setView("profile")}
                className="hidden items-center gap-1.5 rounded-lg border border-sun-400/40 bg-sun-400/10 px-2.5 py-2 text-xs font-bold text-sun-300 transition hover:bg-sun-400/20 sm:flex"
              >
                <IcCrown className="h-3.5 w-3.5" /> Marea+
              </button>
            )}
            <button onClick={() => setView("profile")} className="md:hidden">
              <Avatar name={user.nickname} hue={user.hue} size={30} plus={user.plus} />
            </button>
          </div>
        </header>

        {/* live ticker */}
        <div className="overflow-hidden border-b border-line bg-ink-900/60 py-1.5">
          <div className="ticker-track">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} className="flex shrink-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-mist-2">
                <span className={i % 2 === 0 ? "h-1.5 w-1.5 rounded-full bg-coral-500 live-pulse" : "h-1.5 w-1.5 rounded-full bg-tide-400"} />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-b border-line px-2 py-1.5 md:hidden">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                view === n.id ? "bg-tide-500/12 text-tide-300" : "text-mist"
              }`}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
              {!!n.badge && (
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-tide-500 px-0.5 text-[9px] font-bold text-ink-950">{n.badge}</span>
              )}
            </button>
          ))}
        </div>

        <main key={view} className="anim-fade-up min-h-0 flex-1">
          {view === "chat" && <ChatView me={user} lang={lang} />}
          {view === "dms" && (
            <DmView
              me={user}
              lang={lang}
              initialDm={initDm}
              initCall={initCall}
              clearInitialDm={() => {
                setInitDm(null);
                setInitCall(false);
              }}
            />
          )}
          {view === "match" && <MatchView me={user} lang={lang} gotoDm={gotoDm} />}
          {view === "lb" && <LeaderboardView me={user} lang={lang} setMe={setUser} />}
          {view === "market" && <MarketView me={user} lang={lang} />}
          {view === "profile" && <ProfileView me={user} verifyCode={verifyCode} lang={lang} setMe={setUser} />}
          {view === "safety" && <SafetyView me={user} lang={lang} />}
        </main>
      </div>

      {/* toasts */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
        {toasts.map((x) => (
          <div
            key={x.id}
            className={`anim-pop pointer-events-auto rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg backdrop-blur ${
              x.kind === "ok" ? "border-tide-500/40 bg-ink-900/95 text-tide-200" : "border-coral-500/40 bg-ink-900/95 text-coral-300"
            }`}
          >
            {x.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
