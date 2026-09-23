"use client";
import { useCallback, useEffect, useState } from "react";
import { t as tFn } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Avatar, Btn, toast, timeAgo, Empty } from "@/components/ui";
import { IcShield, IcFlag, IcLock, IcUsers, IcEyeOff, IcBolt, IcChat } from "@/components/Icons";
import type { PublicUser } from "@/lib/types";

const RULE_ICONS = [IcShield, IcEyeOff, IcBolt, IcFlag, IcLock];

export default function SafetyView({ me, lang }: { me: PublicUser; lang: string }) {
  const t = (k: string) => tFn(lang, k);
  const [data, setData] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      setData(await api("/api/safety"));
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unblock = async (userId: string) => {
    try {
      await api("/api/chat", { action: "unblock", userId });
      load();
    } catch {}
  };

  const rules = [t("saf.r1"), t("saf.r2"), t("saf.r3"), t("saf.r4"), t("saf.r5")];

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 md:p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* rules */}
        <div className="card p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-extrabold">
            <IcShield className="h-5 w-5 text-tide-400" /> {t("saf.title")}
          </h2>
          <ul className="mt-4 space-y-3">
            {rules.map((r, i) => {
              const Icon = RULE_ICONS[i];
              return (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-line bg-ink-950 text-tide-300">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-xs leading-relaxed text-mist">{r}</p>
                </li>
              );
            })}
          </ul>
        </div>

        {/* stats */}
        {data && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { n: data.stats.open, label: t("saf.statOpen") },
              { n: data.stats.resolved, label: t("saf.statResolved") },
              { n: data.stats.flagged, label: t("saf.statFlagged") },
            ].map((s, i) => (
              <div key={i} className="card p-3.5 text-center">
                <p className="font-display text-2xl font-extrabold text-tide-300">{s.n}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-mist-2">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* reports */}
        <div className="card p-5">
          <h3 className="font-display text-sm font-bold">{t("saf.reports")}</h3>
          {!data?.reports?.length ? (
            <Empty icon={<IcFlag className="h-7 w-7" />} title={t("saf.noReports")} />
          ) : (
            <div className="mt-3 space-y-2">
              {data.reports.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-line bg-ink-950 px-3 py-2.5">
                  <span className="rounded-md bg-ink-800 px-2 py-1 text-[10px] font-bold uppercase text-mist">
                    {r.targetType}
                  </span>
                  <span className="text-xs text-mist">{t(`saf.reason_${r.reason}`)}</span>
                  <span className="ml-auto text-[10px] text-mist-2">{timeAgo(r.createdAt, lang)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      r.status === "open" ? "bg-sun-400/15 text-sun-300" : "bg-tide-500/15 text-tide-300"
                    }`}
                  >
                    {t(r.status === "open" ? "saf.open" : "saf.resolved")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* blocks */}
        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold">
            <IcUsers className="h-4 w-4 text-mist" /> {t("saf.blocks")}
          </h3>
          {!data?.blocks?.length ? (
            <p className="mt-3 text-xs text-mist-2">{t("saf.noBlocks")}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {data.blocks.map((b: any) =>
                b.user ? (
                  <div key={b.id} className="flex items-center gap-3 rounded-lg border border-line bg-ink-950 px-3 py-2.5">
                    <Avatar name={b.user.nickname} hue={b.user.hue} size={30} />
                    <span className="text-xs font-semibold">{b.user.nickname}</span>
                    <Btn variant="danger" size="sm" className="ml-auto" onClick={() => unblock(b.user.id)}>
                      {t("saf.unblock")}
                    </Btn>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>

        <p className="pb-4 text-center text-[10px] text-mist-2">
          <IcChat className="mr-1 inline h-3 w-3" />
          Marea · {t("saf.r2")}
        </p>
      </div>
    </div>
  );
}
