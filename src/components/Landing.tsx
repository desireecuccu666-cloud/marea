"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LANGS, COUNTRIES, INTERESTS } from "@/lib/constants";
import { t as tFn, type Lang } from "@/lib/i18n";
import { api } from "@/lib/api";
import { toast, Chip, Avatar } from "./ui";
import {
  IcWave,
  IcShield,
  IcBolt,
  IcCard,
  IcLock,
  IcCheck,
  IcGlobe,
  IcEyeOff,
  IcArrowR,
} from "./Icons";

const t = (l: Lang, k: string) => tFn(l, k);

const SAMPLES = [
  { nick: "Kaito", hue: 205, text: "buonasera da Tokyo, chi è sveglio?", d: "0s" },
  { nick: "Mara_V", hue: 330, text: "buenas! vengo dal surf, qualcuno mi consiglia qualcosa?", d: "0.6s" },
  { nick: "Brisa", hue: 168, bot: true, text: "ogni mare ha le sue regole: qui si è gentili", d: "1.2s" },
];

export default function Landing() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("it");
  const [tab, setTab] = useState<"login" | "register">("register");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [f, setF] = useState({
    nickname: "",
    email: "",
    password: "",
    country: "IT",
    language: "it",
    interests: [] as string[],
    ageGroup: "adult" as "adult" | "minor",
  });
  const [code, setCode] = useState("");
  const [codeInput, setCodeInput] = useState("");

  const submit = async () => {
    setErr("");
    if (tab === "login") {
      if (!f.email || !f.password) return setErr(t(lang, "err.login"));
      setBusy(true);
      try {
        await api("/api/auth", { action: "login", email: f.email, password: f.password });
        router.push("/app");
      } catch (e: any) {
        setErr(e.message === "login" ? t(lang, "err.login") : t(lang, "err.generic"));
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!/^[A-Za-z0-9_]{3,20}$/.test(f.nickname)) return setErr(t(lang, "land.errNick"));
    if (f.password.length < 6) return setErr(t(lang, "land.errPw"));
    setBusy(true);
    try {
      const data = await api("/api/auth", {
        action: "register",
        nickname: f.nickname,
        email: f.email,
        password: f.password,
        country: f.country,
        language: f.language,
        interests: f.interests,
        ageGroup: f.ageGroup,
      });
      setCode(data.verifyCode);
      setStep("verify");
    } catch (e: any) {
      setErr(
        e.message === "taken"
          ? t(lang, "err.nickTaken")
          : e.message === "adult"
            ? t(lang, "land.errAdult")
            : e.message === "nick"
              ? t(lang, "land.errNick")
              : t(lang, "err.generic")
      );
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setErr("");
    setBusy(true);
    try {
      await api("/api/auth", { action: "verify", code: codeInput.trim() });
      router.push("/app");
    } catch {
      setErr(t(lang, "err.generic"));
    } finally {
      setBusy(false);
    }
  };

  const demo = async () => {
    setBusy(true);
    try {
      await api("/api/auth", { action: "demo" });
      router.push("/app");
    } catch {
      toast(t(lang, "err.generic"), "err");
    } finally {
      setBusy(false);
    }
  };

  const features = [
    { icon: <IcEyeOff className="h-4 w-4" />, text: t(lang, "land.f1") },
    { icon: <IcBolt className="h-4 w-4" />, text: t(lang, "land.f2") },
    { icon: <IcCard className="h-4 w-4" />, text: t(lang, "land.f3") },
    { icon: <IcShield className="h-4 w-4" />, text: t(lang, "land.f4") },
  ];

  return (
    <div className="bg-tide grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* ---- brand side ---- */}
      <div className="relative flex flex-col justify-between gap-10 p-7 sm:p-12 lg:p-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-tide-500/15 text-tide-300">
              <IcWave className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight">Marea</span>
          </div>
          <div className="flex gap-1 rounded-full border border-line bg-ink-900/60 p-1">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code as Lang)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase transition ${
                  lang === l.code ? "bg-tide-500 text-ink-950" : "text-mist hover:text-foam"
                }`}
              >
                {l.code}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-tide-500/30 bg-tide-500/10 px-3 py-1 text-xs font-semibold text-tide-300">
            <span className="h-1.5 w-1.5 rounded-full bg-tide-400" />
            {t(lang, "land.stat3")} · {t(lang, "land.stat2")} · {t(lang, "land.stat1")}
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
            {t(lang, "app.tag")}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-mist">{t(lang, "app.sub")}</p>

          <ul className="mt-8 space-y-3">
            {features.map((f2, i) => (
              <li key={i} className="anim-fade-up flex items-center gap-3" style={{ animationDelay: `${i * 90}ms` }}>
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-ink-900 text-tide-300">
                  {f2.icon}
                </span>
                <span className="text-sm text-foam/90">{f2.text}</span>
              </li>
            ))}
          </ul>

          {/* live-ish bubbles */}
          <div className="mt-10 space-y-2.5">
            {SAMPLES.map((s, i) => (
              <div
                key={s.nick}
                className="anim-fade-up flex w-fit max-w-sm items-center gap-2.5 rounded-xl border border-line bg-ink-900/80 px-3.5 py-2.5"
                style={{ animationDelay: `${400 + i * 250}ms` }}
              >
                <Avatar name={s.nick} hue={s.hue} size={26} bot={s.bot} />
                <div>
                  <p className="text-[11px] font-semibold text-mist">
                    {s.nick} {s.bot && <span className="ml-1 rounded bg-ink-700 px-1 py-px text-[9px] text-tide-300">bot</span>}
                  </p>
                  <p className="text-xs text-foam/85">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-mist-2">
          {t(lang, "saf.r1")} · {t(lang, "saf.r2")}
        </p>
      </div>

      {/* ---- auth side ---- */}
      <div className="relative flex items-center justify-center border-t border-line bg-ink-900/40 p-6 sm:p-10 lg:border-l lg:border-t-0">
        <div className="card w-full max-w-md p-6">
          {step === "form" ? (
            <>
              <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-line bg-ink-950 p-1">
                {(["register", "login"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      setTab(k);
                      setErr("");
                    }}
                    className={`rounded-md py-2 text-sm font-semibold transition ${
                      tab === k ? "bg-tide-500 text-ink-950" : "text-mist hover:text-foam"
                    }`}
                  >
                    {t(lang, k === "register" ? "land.register" : "land.login")}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {tab === "register" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-mist">{t(lang, "land.nick")}</label>
                    <input className="field" value={f.nickname} onChange={(e) => setF({ ...f, nickname: e.target.value })} placeholder="Onda_Demo" maxLength={20} />
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-mist">{t(lang, "land.email")}</label>
                  <input className="field" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="tu@esempio.com" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-mist">{t(lang, "land.pw")}</label>
                  <input
                    className="field"
                    type="password"
                    value={f.password}
                    onChange={(e) => setF({ ...f, password: e.target.value })}
                    placeholder="••••••••"
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                  />
                </div>

                {tab === "register" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-mist">{t(lang, "lang") === "lang" ? t(lang, "land.lang") : t(lang, "land.lang")}</label>
                        <select className="field" value={f.language} onChange={(e) => setF({ ...f, language: e.target.value })}>
                          {LANGS.map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.native}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-mist">{t(lang, "land.country")}</label>
                        <select className="field" value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })}>
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-mist">{t(lang, "land.interests")}</label>
                      <div className="flex flex-wrap gap-1.5">
                        {INTERESTS.map((i) => (
                          <Chip
                            key={i}
                            active={f.interests.includes(i)}
                            onClick={() =>
                              setF({
                                ...f,
                                interests: f.interests.includes(i)
                                  ? f.interests.filter((x) => x !== i)
                                  : f.interests.length < 8
                                    ? [...f.interests, i]
                                    : f.interests,
                              })
                            }
                          >
                            {i}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-mist">{t(lang, "land.age")}</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setF({ ...f, ageGroup: "adult" })}
                          className={`rounded-lg border p-3 text-left transition ${
                            f.ageGroup === "adult"
                              ? "border-coral-500/60 bg-coral-500/10"
                              : "border-line bg-ink-950 hover:border-mist-2/50"
                          }`}
                        >
                          <span className={`text-xs font-extrabold ${f.ageGroup === "adult" ? "text-coral-300" : "text-foam"}`}>18+</span>
                          <p className="mt-1 text-[10px] leading-snug text-mist">
                            {t(lang, "land.ageAdult")} · {t(lang, "land.ageAdultSub")}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setF({ ...f, ageGroup: "minor" })}
                          className={`rounded-lg border p-3 text-left transition ${
                            f.ageGroup === "minor" ? "border-sky-400/60 bg-sky-400/10" : "border-line bg-ink-950 hover:border-mist-2/50"
                          }`}
                        >
                          <span className={`text-xs font-extrabold ${f.ageGroup === "minor" ? "text-sky-300" : "text-foam"}`}>13-17</span>
                          <p className="mt-1 text-[10px] leading-snug text-mist">
                            {t(lang, "land.ageMinor")} · {t(lang, "land.ageMinorSub")}
                          </p>
                        </button>
                      </div>
                      <p className="mt-2 text-[10px] text-mist-2">{t(lang, "land.ageNote")}</p>
                    </div>
                  </>
                )}

                {err && <p className="rounded-lg border border-coral-500/30 bg-coral-500/10 px-3 py-2 text-xs text-coral-300">{err}</p>}

                <button
                  onClick={submit}
                  disabled={busy}
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-tide-500 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-tide-400 disabled:opacity-50"
                >
                  {t(lang, "land.enter")}
                  <IcArrowR className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </button>
              </div>

              <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-widest text-mist-2">
                <span className="h-px flex-1 bg-line" />
                {lang === "it" ? "oppure" : "or"}
                <span className="h-px flex-1 bg-line" />
              </div>
              <button
                onClick={demo}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-line py-2.5 text-sm font-semibold text-mist transition hover:border-tide-500/40 hover:text-foam"
              >
                <IcGlobe className="h-4 w-4" />
                {t(lang, "land.demo")}
              </button>
            </>
          ) : (
            <div className="text-center">
              <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-tide-500/15 text-tide-300">
                <IcLock className="h-6 w-6" />
              </span>
              <h2 className="font-display text-lg font-bold">{t(lang, "land.verify")}</h2>
              <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-mist">{t(lang, "land.verifySub")}</p>
              <input
                className="field mx-auto mt-5 w-44 text-center font-display text-xl tracking-[0.4em]"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                onKeyDown={(e) => e.key === "Enter" && verify()}
                inputMode="numeric"
              />
              <div className="mx-auto mt-3 w-44 rounded-lg border border-dashed border-sun-400/40 bg-sun-400/5 px-3 py-2 text-[11px] text-sun-300">
                {t(lang, "land.codeDemo")} <span className="font-display font-bold tracking-widest">{code}</span>
              </div>
              {err && <p className="mt-3 text-xs text-coral-300">{err}</p>}
              <button
                onClick={verify}
                disabled={busy || codeInput.length !== 6}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-tide-500 px-6 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-tide-400 disabled:opacity-40"
              >
                <IcCheck className="h-4 w-4" />
                {t(lang, "c.confirm")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
