"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Btn, Modal, toast, fmtMoney } from "./ui";
import { IcCard, IcCheck, IcShield } from "./Icons";
import { playSfx } from "@/lib/sounds";

/**
 * Checkout: if STRIPE_SECRET_KEY is configured the user is redirected to a
 * real Stripe payment (money lands on the owner's IBAN via Stripe).
 * Otherwise the card form runs a simulated payment and onDone persists it.
 */
export default function Checkout({
  open,
  onClose,
  title,
  amountCents,
  sub,
  payLabel,
  onDone,
  payKind = "purchase",
  payTargetId,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  amountCents: number;
  sub?: string;
  payLabel: string;
  onDone: (card: string) => Promise<void>;
  payKind?: string;
  payTargetId?: string;
}) {
  const [card, setCard] = useState({ num: "", exp: "", cvc: "" });
  const [step, setStep] = useState<"form" | "processing" | "done">("form");

  const close = () => {
    if (step === "processing") return;
    setStep("form");
    setCard({ num: "", exp: "", cvc: "" });
    onClose();
  };

  const pay = async () => {
    setStep("processing");
    try {
      const caps = await api("/api/checkout", { action: "caps" }).catch(() => ({ stripe: false }));
      if (caps.stripe) {
        const d = await api("/api/checkout", {
          action: "session",
          kind: payKind,
          amountCents,
          targetId: payTargetId,
          label: title,
        });
        if (d.url) {
          window.location.href = d.url;
          return;
        }
      }
      await new Promise((r) => setTimeout(r, 900));
      await onDone(card.num);
      setStep("done");
      playSfx("cash");
      setTimeout(close, 1400);
    } catch (e: any) {
      setStep("form");
      toast(e.message === "card" ? "Carta non valida" : "Errore di pagamento", "err");
    }
  };

  const valid = card.num.replace(/\s/g, "").length >= 12 && card.exp.length >= 5 && card.cvc.length >= 3;

  return (
    <Modal open={open} onClose={close} title={title}>
      {step === "form" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-line bg-ink-950 px-3.5 py-2.5">
            <span className="text-xs text-mist">{title}</span>
            <span className="font-display text-sm font-extrabold text-tide-300">{fmtMoney(amountCents)}</span>
          </div>
          {sub && <p className="text-[11px] leading-relaxed text-mist-2">{sub}</p>}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-mist">Numero carta</label>
            <input
              className="field font-mono tracking-wider"
              placeholder="4242 4242 4242 4242"
              value={card.num}
              maxLength={19}
              onChange={(e) =>
                setCard({ ...card, num: e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ") })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-mist">MM/AA</label>
              <input
                className="field font-mono"
                placeholder="12/27"
                value={card.exp}
                maxLength={5}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setCard({ ...card, exp: v.length > 2 ? v.slice(0, 2) + "/" + v.slice(2) : v });
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-mist">CVC</label>
              <input
                className="field font-mono"
                placeholder="123"
                maxLength={4}
                value={card.cvc}
                onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "") })}
              />
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-mist-2">
            <IcShield className="h-3.5 w-3.5 text-tide-500" /> Pagamento simulato in demo · protezione acquirenti
          </p>
          <Btn className="w-full" disabled={!valid} onClick={pay}>
            <IcCard className="h-4 w-4" /> {payLabel} · {fmtMoney(amountCents)}
          </Btn>
        </div>
      )}
      {step === "processing" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="wave-load h-2 w-48 rounded-full bg-ink-700" />
          <p className="text-xs text-mist-2">Elaborazione…</p>
        </div>
      )}
      {step === "done" && (
        <div className="flex flex-col items-center gap-3 py-8">
          <span className="anim-pop grid h-14 w-14 place-items-center rounded-full bg-tide-500/20 text-tide-300">
            <IcCheck className="h-7 w-7" />
          </span>
          <p className="font-display text-sm font-bold">Completato</p>
        </div>
      )}
    </Modal>
  );
}
