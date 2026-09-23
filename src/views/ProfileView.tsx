"use client";
import { useEffect, useState } from "react";
import { t as tFn } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Avatar, Btn, Chip, Modal, Toggle, toast, fmtMoney, timeAgo } from "@/components/ui";
import Checkout from "@/components/Checkout";
import {
  IcShield,
  IcCrown,
  IcGlobe,
  IcRefresh,
  IcCheck,
  IcCard,
  IcEye,
  IcUsers,
  IcBolt,
} from "@/components/Icons";
import { INTERESTS, COUNTRIES, LANGS, countryName, langNative } from "@/lib/constants";
import type { PublicUser } from "@/lib/types";

export default function ProfileView({
  me,
  verifyCode,
  lang,
  setMe,
}: {
  me: PublicUser;
  verifyCode: string | null;
  lang: string;
  setMe: (u: PublicUser) => void;
}) {
  const t = (k: string) => tFn(lang, k);
  const [bio, setBio] = useState(me.bio);
  const [interests, setInterests] = useState<string[]>(me.interests);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [plusOpen, setPlusOpen] = useState(false);
  const [card, setCard] = useState({ num: "", exp: "", cvc: "" });
  const [busy, setBusy] = useState(false);
  const [tx, setTx] = useState<any[]>([]);

  const loadTx = () =>
    api("/api/store", { action: "history" })
      .then((d) => setTx(d.tx))
      .catch(() => {});
  useEffect(() => {
    loadTx();
  }, []);

  const saveProfile = async (patch: Record<string, unknown>) => {
    try {
      const d = await api("/api/profile", { ...patch });
      setMe(d.user);
      toast("✓");
    } catch {}
  };

  const doVerify = async () => {
    try {
      await api("/api/auth", { action: "verify", code: codeInput.trim() });
      setMe({ ...me, verified: true });
      setVerifyOpen(false);
      toast("✓");
    } catch {
      toast(t("err.generic"), "err");
    }
  };

  const subscribe = async () => {
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      const d = await api("/api/plus", { card: card.num });
      setMe(d.user);
      setPlusOpen(false);
      toast("Marea+ ✓");
    } catch {
      toast(t("err.generic"), "err");
    } finally {
      setBusy(false);
    }
  };

  const perks = [t("pr.p1"), t("pr.p2"), t("pr.p3"), t("pr.p4")];
  const since = new Date(me.createdAt).toLocaleDateString(lang, { month: "long", year: "numeric" });
  const renews = me.plusRenewsAt ? new Date(me.plusRenewsAt).toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric" }) : "";

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 md:p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* identity */}
        <div className="card relative overflow-hidden p-5">
          <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full blur-3xl" style={{ background: `hsl(${me.hue} 60% 30% / 0.35)` }} />
          <div className="relative flex flex-wrap items-center gap-4">
            <Avatar name={me.nickname} hue={me.hue} size={72} plus={me.plus} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-display text-xl font-extrabold">{me.nickname}</h2>
                {me.verified ? (
                  <span className="flex items-center gap-1 rounded-full border border-tide-500/30 bg-tide-500/10 px-2 py-0.5 text-[10px] font-bold text-tide-300">
                    <IcShield className="h-3 w-3" /> {t("top.verified")}
                  </span>
                ) : (
                  <button onClick={() => setVerifyOpen(true)} className="rounded-full border border-sun-400/40 bg-sun-400/10 px-2 py-0.5 text-[10px] font-bold text-sun-300 transition hover:bg-sun-400/20">
                    {t("pr.verifyNow")}
                  </button>
                )}
                {me.plus && (
                  <span className="flex items-center gap-1 rounded-full border border-sun-400/40 bg-sun-400/10 px-2 py-0.5 text-[10px] font-bold text-sun-300">
                    <IcCrown className="h-3 w-3" /> Marea+
                  </span>
                )}
                {me.ageGroup === "minor" ? (
                  <span className="rounded-full border border-sky-400/40 bg-sky-400/10 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                    {t("badge.minor")}
                  </span>
                ) : (
                  <span className="rounded-full border border-coral-500/40 bg-coral-500/10 px-2 py-0.5 text-[10px] font-bold text-coral-300">
                    18+
                  </span>
                )}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mist">
                <span className="flex items-center gap-1"><IcGlobe className="h-3.5 w-3.5" /> {countryName(me.country)} · {langNative(me.language)}</span>
                <span>
                  {t("pr.since")} {since}
                </span>
              </p>
            </div>
            <Btn
              variant="line"
              size="sm"
              onClick={() => saveProfile({ hue: Math.floor(Math.random() * 360) })}
              title="avatar"
            >
              <IcRefresh className="h-3.5 w-3.5" />
            </Btn>
          </div>
        </div>

        {/* bio + interests */}
        <div className="card p-5">
          <h3 className="font-display text-sm font-bold">{t("pr.title")}</h3>
          <label className="mt-3 mb-1 block text-xs font-semibold text-mist">{t("pr.bio")}</label>
          <textarea className="field min-h-16 resize-none" value={bio} maxLength={200} placeholder={t("pr.bioPh")} onChange={(e) => setBio(e.target.value)} />
          <label className="mt-3 mb-1.5 block text-xs font-semibold text-mist">{t("pr.interests")}</label>
          <div className="flex flex-wrap gap-1.5">
            {INTERESTS.map((i) => (
              <Chip
                key={i}
                active={interests.includes(i)}
                onClick={() =>
                  setInterests(interests.includes(i) ? interests.filter((x) => x !== i) : interests.length < 8 ? [...interests, i] : interests)
                }
              >
                {i}
              </Chip>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Btn size="sm" onClick={() => saveProfile({ bio, interests })}>
              {t("c.save")}
            </Btn>
          </div>
        </div>

        {/* privacy */}
        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold">
            <IcShield className="h-4 w-4 text-tide-400" /> {t("pr.privacy")}
          </h3>
          <div className="mt-3 divide-y divide-line">
            <div className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <IcEye className="h-4 w-4 text-mist" /> {t("pr.showVideo")}
                </p>
                <p className="text-[11px] text-mist-2">{t("pr.showVideoSub")}</p>
              </div>
              <Toggle on={me.showVideo} onChange={(v) => saveProfile({ showVideo: v })} />
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <IcUsers className="h-4 w-4 text-mist" /> {t("pr.publicProfile")}
                </p>
                <p className="text-[11px] text-mist-2">{t("pr.publicProfileSub")}</p>
              </div>
              <Toggle on={me.publicProfile} onChange={(v) => saveProfile({ publicProfile: v })} />
            </div>
          </div>
        </div>

        {/* trial / limits */}
        {me.ageGroup === "adult" && !me.plus && (
          <div
            className={`card flex items-start gap-3 p-4 ${
              me.trialEndsAt && new Date(me.trialEndsAt).getTime() > Date.now() ? "border-tide-500/30" : "border-line"
            }`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-tide-500/15 text-tide-300">
              <IcBolt className="h-4 w-4" />
            </span>
            <p className="text-xs leading-relaxed text-mist">
              {me.trialEndsAt && new Date(me.trialEndsAt).getTime() > Date.now() ? t("trial.on") : t("limits.free")}
            </p>
          </div>
        )}

        {/* wallet + purchases */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold">{t("tx.title")}</h3>
            {me.walletCents > 0 && (
              <span className="rounded-full border border-tide-500/30 bg-tide-500/10 px-2.5 py-1 text-[11px] font-bold text-tide-300">
                {t("wallet")}: {fmtMoney(me.walletCents)}
              </span>
            )}
          </div>
          {tx.length === 0 ? (
            <p className="mt-3 text-xs text-mist-2">{t("tx.none")}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {tx.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-line bg-ink-950 px-3 py-2.5">
                  <span className="rounded-md bg-ink-800 px-2 py-1 text-[10px] font-bold uppercase text-mist">
                    {r.kind === "top" ? t("tx.top") : r.kind === "tip" ? `${t("tx.tip")} ${r.target ?? ""}` : r.kind === "premium" ? t("tx.premium") : t("tx.plus")}
                  </span>
                  <span className="ml-auto font-display text-xs font-extrabold text-tide-300">-{fmtMoney(r.amountCents)}</span>
                  <span className="text-[10px] text-mist-2">{timeAgo(r.createdAt, lang)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Marea+ */}
        {me.ageGroup === "minor" ? (
          <div className="card flex items-start gap-3 p-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-400/15 text-sky-300">
              <IcShield className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="font-display text-sm font-bold">{t("pr.title")}</p>
              <p className="mt-1 text-xs leading-relaxed text-mist">{t("profile.minorNote")}</p>
            </div>
          </div>
        ) : me.plus ? (
          <div className="card relative overflow-hidden border-sun-400/30 p-5">
            <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-sun-400/10 blur-2xl" />
            <p className="flex items-center gap-2 font-display text-sm font-extrabold text-sun-300">
              <IcCrown className="h-5 w-5" /> {t("pr.subscribed")}
            </p>
            <p className="mt-1 text-xs text-mist">
              {t("pr.renews")} {renews}
            </p>
            <ul className="mt-3 space-y-1.5">
              {perks.map((p) => (
                <li key={p} className="flex items-center gap-2 text-xs text-foam/85">
                  <IcCheck className="h-3.5 w-3.5 text-sun-400" /> {p}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="card relative overflow-hidden border-sun-400/30 p-5">
            <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-sun-400/12 blur-2xl" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-display text-base font-extrabold text-sun-300">
                  <IcCrown className="h-5 w-5" /> {t("pr.subTitle")}
                </p>
                <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-mist">{t("pr.subSub")}</p>
              </div>
              <Btn variant="sun" onClick={() => setPlusOpen(true)}>
                <IcBolt className="h-4 w-4" /> {t("pr.subscribe")}
              </Btn>
            </div>
            <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
              {perks.map((p) => (
                <li key={p} className="flex items-center gap-2 text-xs text-foam/85">
                  <IcCheck className="h-3.5 w-3.5 text-sun-400" /> {p}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* verify modal */}
      <Modal open={verifyOpen} onClose={() => setVerifyOpen(false)} title={t("pr.verified")}>
        <p className="text-xs leading-relaxed text-mist">{t("land.verifySub")}</p>
        <input
          className="field mt-4 text-center font-display text-xl tracking-[0.4em]"
          value={codeInput}
          maxLength={6}
          inputMode="numeric"
          onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ""))}
          placeholder="••••••"
        />
        {verifyCode && (
          <p className="mt-2 rounded-lg border border-dashed border-sun-400/40 bg-sun-400/5 px-3 py-2 text-center text-[11px] text-sun-300">
            {t("land.codeDemo")} <span className="font-bold tracking-widest">{verifyCode}</span>
          </p>
        )}
        <div className="mt-4 flex justify-end">
          <Btn size="sm" disabled={codeInput.length !== 6} onClick={doVerify}>
            <IcCheck className="h-3.5 w-3.5" /> {t("c.confirm")}
          </Btn>
        </div>
      </Modal>

      {/* plus checkout (real Stripe when configured, simulated otherwise) */}
      <Checkout
        open={plusOpen}
        onClose={() => setPlusOpen(false)}
        title={t("pr.subTitle")}
        amountCents={699}
        sub={t("pr.subSub")}
        payLabel={t("pr.pay")}
        payKind="plus"
        onDone={async () => {
          const d = await api("/api/plus", { card: "4242 4242 4242 4242" });
          setMe(d.user);
        }}
      />
    </div>
  );
}
