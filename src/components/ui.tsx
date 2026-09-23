"use client";
import { useEffect, useRef, useState, type ReactNode, type ButtonHTMLAttributes } from "react";
import { IcX, IcCrown, IcBolt, IcStar } from "./Icons";

/* ---------------- toast ---------------- */
export function toast(msg: string, kind: "ok" | "err" = "ok") {
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent("marea:toast", { detail: { msg, kind } }));
}

/* ---------------- avatar ---------------- */
export function Avatar({
  name,
  hue,
  size = 36,
  plus,
  bot,
  className = "",
}: {
  name: string;
  hue: number;
  size?: number;
  plus?: boolean;
  bot?: boolean;
  className?: string;
}) {
  const initials = name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "?";
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <div
        className="grid h-full w-full place-items-center rounded-full font-display font-bold text-foam/95 select-none"
        style={{
          fontSize: Math.max(10, size * 0.36),
          background: `linear-gradient(135deg, hsl(${hue} 62% 40%), hsl(${(hue + 55) % 360} 58% 24%))`,
        }}
      >
        {initials}
      </div>
      {plus && (
        <span className="absolute -top-1.5 -right-1.5 grid place-items-center rounded-full bg-ink-950 p-0.5 text-sun-400">
          <IcCrown style={{ width: size * 0.34, height: size * 0.34 }} />
        </span>
      )}
      {bot && (
        <span className="absolute -bottom-1 -right-1 grid place-items-center rounded-full border border-line bg-ink-800 p-0.5 text-tide-300">
          <IcBolt style={{ width: size * 0.32, height: size * 0.32 }} />
        </span>
      )}
    </div>
  );
}

/* ---------------- button ---------------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "sun" | "ghost" | "line" | "danger";
  size?: "sm" | "md" | "lg";
};
export function Btn({ variant = "primary", size = "md", className = "", children, ...p }: BtnProps) {
  const v = {
    primary: "bg-tide-500 text-ink-950 hover:bg-tide-400 shadow-[0_4px_20px_-6px_rgba(16,211,169,0.5)]",
    sun: "bg-sun-400 text-ink-950 hover:bg-sun-300 shadow-[0_4px_20px_-6px_rgba(255,180,87,0.5)]",
    ghost: "text-mist hover:text-foam hover:bg-ink-800",
    line: "border border-line text-foam hover:border-tide-500/50 hover:bg-ink-800",
    danger: "bg-coral-500/15 text-coral-300 hover:bg-coral-500/25",
  }[variant];
  const s = {
    sm: "px-2.5 py-1.5 text-xs rounded-md",
    md: "px-3.5 py-2 text-sm rounded-lg",
    lg: "px-5 py-2.5 text-sm rounded-lg",
  }[size];
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 ${v} ${s} ${className}`}
      {...p}
    >
      {children}
    </button>
  );
}

/* ---------------- chip ---------------- */
export function Chip({
  active,
  className = "",
  children,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-tide-500/50 bg-tide-500/15 text-tide-300"
          : "border-line text-mist hover:border-mist-2/50 hover:text-foam"
      } ${className}`}
      {...p}
    >
      {children}
    </button>
  );
}

/* ---------------- modal ---------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink-950/85" onClick={onClose} />
      <div className={`card anim-pop relative w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[86vh] overflow-y-auto scroll-thin p-5`}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="font-display text-base font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-mist transition hover:bg-ink-800 hover:text-foam" aria-label="close">
            <IcX className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------- toggle ---------------- */
export function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-40 ${on ? "bg-tide-500" : "bg-ink-700"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-foam shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

/* ---------------- stars ---------------- */
export function Stars({ value, onChange, size = 14 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={`${onChange ? "cursor-pointer transition hover:scale-110" : "cursor-default"} ${
            n <= Math.round(value) ? "text-sun-400" : "text-mist-2/40"
          }`}
        >
          <IcStar style={{ width: size, height: size }} fill={n <= Math.round(value) ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

/* ---------------- score ring ---------------- */
export function ScoreRing({ score, size = 54 }: { score: number; size?: number }) {
  const [dash, setDash] = useState(0);
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  useEffect(() => {
    const t = setTimeout(() => setDash((score / 100) * c), 60);
    return () => clearTimeout(t);
  }, [score, c]);
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-ink-700)" strokeWidth="4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-tide-400)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - dash}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.2,0.7,0.2,1)" }}
        />
      </svg>
      <span className="absolute font-display text-sm font-bold text-tide-300">{score}</span>
    </div>
  );
}

/* ---------------- empty ---------------- */
export function Empty({ icon, title, sub }: { icon: ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <div className="text-mist-2">{icon}</div>
      <p className="font-display text-sm font-semibold text-mist">{title}</p>
      {sub && <p className="max-w-xs text-xs text-mist-2">{sub}</p>}
    </div>
  );
}

/* ---------------- formatters ---------------- */
export const fmtMoney = (cents: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);

export const timeHM = (iso: Date | string, lang = "it") =>
  new Date(iso).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" });

export function dayLabel(iso: Date | string, lang = "it"): string {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(Date.now() - 864e5);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return lang === "en" ? "Today" : lang === "es" ? "Hoy" : lang === "fr" ? "Aujourd'hui" : lang === "de" ? "Heute" : "Oggi";
  if (same(d, yest)) return lang === "en" ? "Yesterday" : lang === "es" ? "Ayer" : lang === "fr" ? "Hier" : lang === "de" ? "Gestern" : "Ieri";
  return d.toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "short" });
}

export function timeAgo(iso: Date | string, lang = "it"): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
}

/* debounce hook */
export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/* auto-scroll ref */
export function useAutoScroll(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [dep]);
  return ref;
}
