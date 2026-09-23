"use client";
import { useCallback, useEffect, useState } from "react";
import { t as tFn } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Avatar, Btn, Chip, ScoreRing, Toggle, toast, timeAgo, Empty } from "@/components/ui";
import { playSfx } from "@/lib/sounds";
import { IcHeart, IcWave, IcBolt, IcGlobe, IcCrown, IcSparkle, IcVideo } from "@/components/Icons";
import type { PublicUser } from "@/lib/types";
import { countryName, langNative } from "@/lib/constants";

export default function MatchView({
  me,
  lang,
  gotoDm,
}: {
  me: PublicUser;
  lang: string;
  gotoDm: (dmId: string, call?: boolean) => void;
}) {
  const t = (k: string) => tFn(lang, k);
  const [data, setData] = useState<any>(null);
  const [finding, setFinding] = useState(false);
  const [reacting, setReacting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api("/api/match"));
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleOptIn = async () => {
    const d = await api("/api/match", { action: "toggle-optin" }).catch(() => null);
    if (d) {
      setData((p: any) => ({ ...p, optIn: d.optIn }));
      toast(d.optIn ? "✓" : "", "ok");
    }
  };

  const find = async () => {
    if (finding) return;
    setFinding(true);
    await new Promise((r) => setTimeout(r, 1100));
    try {
      const d = await api("/api/match", { action: "find" });
      if (d.found > 0) {
        playSfx("match");
        toast(`+${d.found} ${t("match.matched")}`);
      }
      await load();
    } catch (e: any) {
      toast(e.message === "optin" ? t("match.optin") : e.message === "limit" ? t("match.limit") : t("err.generic"), "err");
    } finally {
      setFinding(false);
    }
  };

  const react = async (matchId: string, kind: "wave" | "like") => {
    if (reacting) return;
    setReacting(matchId + kind);
    try {
      const d = await api("/api/match", { action: "react", matchId, kind });
      await load();
    } catch {}
    setReacting(null);
  };

  const startDm = async (matchId: string, call = false) => {
    try {
      const d = await api("/api/match", { action: "start-dm", matchId });
      gotoDm(d.dmId, call);
    } catch (e: any) {
      toast(t("err.generic"), "err");
    }
  };

  const matches = data?.matches ?? [];

  return (
    <div className="mx-auto h-full max-w-4xl overflow-y-auto scroll-thin p-4 md:p-6">
      {/* header card */}
      <div className="card relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-tide-500/10 blur-2xl" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 max-w-lg">
            <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
              <IcSparkle className="h-5 w-5 text-tide-300" /> {t("match.title")}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-mist">{t("match.sub")}</p>
          </div>
          <div className="flex w-full max-w-xs flex-col gap-3 rounded-xl border border-line bg-ink-950 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold">{t("match.optin")}</p>
                <p className="text-[10px] text-mist-2">{t("match.optinDesc")}</p>
              </div>
              <Toggle on={!!data?.optIn} onChange={toggleOptIn} />
            </div>
            <Btn onClick={find} disabled={!data?.optIn || finding} className="wave-load" >
              {finding ? (
                <span>{t("match.searching")}</span>
              ) : (
                <>
                  <IcBolt className="h-4 w-4" /> {t("match.find")}
                </>
              )}
            </Btn>
            {data && !me.plus && (
              <p className="flex items-center justify-between text-[10px] text-mist-2">
                <span>
                  {data.usedToday}/{data.limit} · {t("match.limit")}
                </span>
                <span className="flex items-center gap-1 text-sun-300">
                  <IcCrown className="h-3 w-3" /> {t("match.plusNote")}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* matches */}
      {matches.length === 0 ? (
        <Empty icon={<IcHeart className="h-8 w-8" />} title={t("match.empty")} />
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {matches.map((m: any, i: number) => (
            <div key={m.id} className="card anim-fade-up p-4" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="flex items-start gap-3.5">
                <Avatar name={m.peer.nickname} hue={m.peer.hue} size={46} plus={m.peer.plus} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold">{m.peer.nickname}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-mist-2">
                    <IcGlobe className="h-3 w-3" />
                    {countryName(m.peer.country)} · {langNative(m.peer.language)}
                    {m.peer.ageGroup === "minor" && (
                      <span className="rounded bg-sky-400/15 px-1 py-px text-[9px] font-bold text-sky-300">{t("badge.minor")}</span>
                    )}
                    <span className="ml-auto text-mist-2/60">{timeAgo(m.createdAt, lang)}</span>
                  </p>
                  {m.shared?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.shared.slice(0, 4).map((s: string) => (
                        <span key={s} className="rounded-full bg-tide-500/10 px-2 py-0.5 text-[10px] font-medium text-tide-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ScoreRing score={m.score} />
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-mist">
                <span className="font-bold uppercase tracking-wide text-mist-2">{t("match.because")}:</span> {m.reason}
              </p>
              <div className="mt-3.5 flex items-center gap-2">
                <Btn size="sm" onClick={() => startDm(m.id)}>
                  {t("match.startDm")}
                </Btn>
                <Btn variant="line" size="sm" onClick={() => startDm(m.id, true)}>
                  <IcVideo className="h-3.5 w-3.5" /> {t("match.call")}
                </Btn>
                <button
                  onClick={() => react(m.id, "wave")}
                  className={`ml-auto flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                    m.reactions.myWave
                      ? "border-tide-500/60 bg-tide-500/15 text-tide-300"
                      : "border-line text-mist hover:text-tide-300"
                  }`}
                >
                  <IcWave className="h-4 w-4" /> {m.reactions.wave}
                </button>
                <button
                  onClick={() => react(m.id, "like")}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                    m.reactions.myLike
                      ? "border-coral-500/60 bg-coral-500/15 text-coral-300"
                      : "border-line text-mist hover:text-coral-300"
                  }`}
                >
                  <IcHeart className="h-4 w-4" /> {m.reactions.like}
                </button>
              </div>
              {m.status === "chatted" && (
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-tide-400">
                  · {lang === "it" ? "mini-chat avviata" : "mini-chat started"}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
