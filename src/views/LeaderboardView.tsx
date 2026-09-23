"use client";
import { useCallback, useEffect, useState } from "react";
import { t as tFn } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Avatar, Btn, Empty, toast } from "@/components/ui";
import Checkout from "@/components/Checkout";
import { IcTrophy, IcCrown, IcStar2 } from "@/components/Icons";
import type { PublicUser } from "@/lib/types";
import { countryName } from "@/lib/constants";

export default function LeaderboardView({ me, lang, setMe }: { me: PublicUser; lang: string; setMe: (u: PublicUser) => void }) {
  const t = (k: string, vars?: Record<string, string | number>) => tFn(lang, k, vars);
  const [data, setData] = useState<any>(null);
  const [buyOpen, setBuyOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api("/api/leaderboard"));
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 20000);
    return () => clearInterval(iv);
  }, [load]);

  const buyTop = async (card: string) => {
    await api("/api/store", { action: "buy-top", card });
    setBuyOpen(false);
    toast("5,00 € ✓");
    load();
    // refresh me (points/wallet irrelevant here but keep fresh)
    const d = await api("/api/auth").catch(() => null);
    if (d) setMe(d.user);
  };

  const hoursLeft = data?.myTopExpiresAt ? Math.max(0, Math.ceil((data.myTopExpiresAt - Date.now()) / 3600e3)) : 0;

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="card relative overflow-hidden p-5">
          <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-sun-400/12 blur-2xl" />
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
            <IcTrophy className="h-5 w-5 text-sun-400" /> {t("lb.title")}
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-mist">{t("lb.sub")}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {data?.myOnTop ? (
              <span className="flex items-center gap-2 rounded-lg border border-sun-400/50 bg-sun-400/10 px-3 py-2 text-xs font-bold text-sun-300">
                <IcCrown className="h-4 w-4" /> {t("lb.topActive", { h: hoursLeft })}
              </span>
            ) : (
              <Btn variant="sun" onClick={() => setBuyOpen(true)}>
                <IcCrown className="h-4 w-4" /> {t("lb.topBuy")}
              </Btn>
            )}
            <p className="text-[11px] text-mist-2">
              {t("lb.you")}: {data?.myPoints ?? me.points} {t("lb.points")}
              {data?.myRank ? ` · #${data.myRank}` : ""} · {data?.total ?? 0} {lang === "it" ? "in classifica" : "ranked"}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {data?.list?.length === 0 && <Empty icon={<IcTrophy className="h-8 w-8" />} title={t("lb.empty")} />}
          {data?.list?.map((r: any, i: number) => {
            const isMe = r.user.id === me.id;
            const top = r.onTop;
            return (
              <div
                key={r.user.id}
                className={`anim-fade-up flex items-center gap-3 rounded-xl border p-3 transition ${
                  top
                    ? "border-sun-400/60 bg-gradient-to-r from-sun-400/12 to-transparent shadow-[0_0_24px_-8px_rgba(255,180,87,0.5)]"
                    : isMe
                      ? "border-tide-500/50 bg-tide-500/8"
                      : "border-line bg-ink-900/70"
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-display text-sm font-extrabold ${
                    r.rank === 1 && top
                      ? "bg-sun-400 text-ink-950"
                      : r.rank === 1
                        ? "bg-sun-400/25 text-sun-300"
                        : r.rank === 2
                          ? "bg-ink-700 text-mist"
                          : r.rank === 3
                            ? "bg-ink-800 text-mist-2"
                            : "bg-ink-800/60 text-mist-2"
                  }`}
                >
                  {r.rank}
                </span>
                <Avatar name={r.user.nickname} hue={r.user.hue} size={38} plus={r.user.plus} bot={r.user.isBot} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-bold">
                    <span className="truncate">{r.user.nickname}</span>
                    {top && (
                      <span className="flex items-center gap-1 rounded bg-sun-400 px-1.5 py-px text-[9px] font-black text-ink-950">
                        <IcStar2 className="h-2.5 w-2.5" /> {t("lb.topBadge")}
                      </span>
                    )}
                    {isMe && (
                      <span className="rounded bg-tide-500/15 px-1.5 py-px text-[9px] font-bold text-tide-300">{t("lb.you")}</span>
                    )}
                    {r.user.ageGroup === "minor" && (
                      <span className="rounded bg-sky-400/15 px-1 py-px text-[9px] font-bold text-sky-300">{t("badge.minor")}</span>
                    )}
                  </p>
                  <p className="truncate text-[11px] text-mist-2">{countryName(r.user.country)}</p>
                </div>
                <span className="shrink-0 font-display text-sm font-extrabold text-tide-300">
                  {r.points} <span className="text-[10px] font-semibold text-mist-2">{t("lb.points")}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Checkout
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
        title={t("lb.topBuy")}
        amountCents={5000}
        payLabel={t("c.confirm")}
        payKind="top"
        onDone={buyTop}
      />
    </div>
  );
}
