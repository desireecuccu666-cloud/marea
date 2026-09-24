"use client";
import { useCallback, useEffect, useState } from "react";
import { t as tFn } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Avatar, fmtMoney, timeAgo, Empty } from "@/components/ui";
import { IcStats, IcUsers, IcChat, IcTrophy, IcFlag, IcShield, IcGlobe } from "@/components/Icons";
import type { PublicUser } from "@/lib/types";

export default function OwnerView({ me, lang }: { me: PublicUser; lang: string }) {
  const t = (k: string, vars?: Record<string, string | number>) => tFn(lang, k, vars);
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    try {
      setD(await api("/api/admin"));
      setErr(false);
    } catch {
      setErr(true);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [load]);

  if (err) {
    return (
      <div className="grid h-full place-items-center">
        <Empty icon={<IcShield className="h-8 w-8" />} title={t("st.locked")} />
      </div>
    );
  }

  const cards = d
    ? [
        { icon: IcUsers, n: d.users, label: t("st.users"), sub: `+${d.newUsers7} ${t("st.usersNew")}` },
        { icon: IcChat, n: d.messages, label: t("st.msgs"), sub: `${d.realMessages} ${t("st.msgsReal")} · ${d.messagesToday} ${t("st.msgsToday")}` },
        { icon: IcTrophy, n: fmtMoney(d.txTotalCents), label: t("st.tx"), sub: `${d.txs.length} ${t("st.txsN")}` },
        { icon: IcFlag, n: d.reports, label: t("st.reports"), sub: `${d.flagged} ${t("st.flagged")}` },
      ]
    : [];

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 md:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="card p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
            <IcStats className="h-5 w-5 text-tide-400" /> {t("st.title")}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-mist">{t("st.sub")}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map((c, i) => (
            <div key={i} className="card anim-fade-up p-4" style={{ animationDelay: `${i * 60}ms` }}>
              <c.icon className="h-4 w-4 text-mist-2" />
              <p className="mt-2 font-display text-2xl font-extrabold">{c.n}</p>
              <p className="text-[11px] font-semibold text-mist">{c.label}</p>
              <p className="text-[10px] text-mist-2">{c.sub}</p>
            </div>
          ))}
        </div>

        <div className="card mt-4 p-5">
          <h3 className="font-display text-sm font-bold">{t("st.latest")}</h3>
          {!d?.latestUsers?.length ? (
            <p className="mt-3 text-xs text-mist-2">{t("st.noUsers")}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {d.latestUsers.map((r: any, i: number) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-line bg-ink-950 px-3 py-2.5">
                  <Avatar name={r.nickname} hue={i * 47 + 10} size={30} plus={r.plus} />
                  <span className="text-xs font-bold">{r.nickname}</span>
                  <span className="text-[10px] text-mist-2">{r.country}</span>
                  <span className="ml-auto text-[10px] text-mist-2">{timeAgo(r.createdAt, lang)}</span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-tide-500/25 bg-tide-500/8 p-3 text-[11px] leading-relaxed text-mist">
            <IcShield className="mt-0.5 h-4 w-4 shrink-0 text-tide-400" /> {t("st.who")}
          </p>
        </div>

        <div className="card mt-4 p-5">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold">
            <IcGlobe className="h-4 w-4 text-mist" /> {t("st.rooms")}
          </h3>
          <div className="mt-3 space-y-1.5">
            {d?.topRooms?.map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-40 truncate text-xs font-medium">{r.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-tide-600 to-tide-400 transition-all duration-700"
                    style={{ width: `${Math.max(6, (r.n / (d.topRooms[0]?.n || 1)) * 100)}%` }}
                  />
                </div>
                <span className="w-8 text-right font-display text-xs font-bold text-tide-300">{r.n}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card mt-4 p-5">
          <h3 className="font-display text-sm font-bold">{t("st.txs")}</h3>
          {!d?.txs?.length ? (
            <p className="mt-3 text-xs text-mist-2">{t("st.txNone")}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {d.txs.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-line bg-ink-950 px-3 py-2.5">
                  <span className="rounded-md bg-ink-800 px-2 py-1 text-[10px] font-bold uppercase text-mist">
                    {r.kind === "top" ? t("tx.top") : r.kind === "tip" ? `${t("tx.tip")} ${r.target ?? ""}` : r.kind === "premium" ? t("tx.premium") : r.kind === "plus" ? t("tx.plus") : r.kind}
                  </span>
                  <span className="ml-auto font-display text-xs font-extrabold text-tide-300">+{fmtMoney(r.amountCents)}</span>
                  <span className="text-[10px] text-mist-2">{timeAgo(r.createdAt, lang)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="py-5 text-center text-[10px] text-mist-2">{t("st.traffic")}</p>
      </div>
    </div>
  );
}
