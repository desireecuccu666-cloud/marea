"use client";
import { useCallback, useEffect, useState } from "react";
import { t as tFn } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Avatar, Btn, Chip, Modal, Stars, toast, timeAgo, fmtMoney, Empty } from "@/components/ui";
import {
  IcStore,
  IcSparkle,
  IcTag,
  IcSearch,
  IcShield,
  IcCrown,
  IcTrash,
  IcCard,
  IcCheck,
  IcX,
  IcLock,
} from "@/components/Icons";
import type { PublicUser } from "@/lib/types";

const CAT_ICON: Record<string, any> = { product: IcStore, service: IcSparkle, digital: IcTag };

export default function MarketView({ me, lang }: { me: PublicUser; lang: string }) {
  const t = (k: string) => tFn(lang, k);
  const [items, setItems] = useState<any[]>([]);
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<any | null>(null);
  const [pay, setPay] = useState<"form" | "processing" | "done" | null>(null);
  const [card, setCard] = useState({ num: "", exp: "", cvc: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [cf, setCf] = useState({ title: "", category: "digital", price: "9.90", description: "", promoted: false });
  const [rv, setRv] = useState({ rating: 5, comment: "" });

  const load = useCallback(async (c = cat, query = q) => {
    const url = new URL("/api/market", location.origin);
    if (c !== "all") url.searchParams.set("cat", c);
    if (query) url.searchParams.set("q", query);
    try {
      const d = await api(url.pathname + url.search);
      setItems(d.items);
      setSel((s: any) => (s ? d.items.find((i: any) => i.id === s.id) ?? null : null));
    } catch {}
  }, [cat, q]);

  useEffect(() => {
    load(cat, q);
    const iv = setInterval(() => load(cat, q), 15000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, q]);

  const openBuy = (i: any) => {
    setSel(i);
    setPay("form");
    setCard({ num: "", exp: "", cvc: "" });
  };

  const doPay = async () => {
    if (!sel) return;
    setPay("processing");
    await new Promise((r) => setTimeout(r, 900));
    try {
      await api("/api/market", { action: "buy", productId: sel.id });
      setPay("done");
      setTimeout(() => {
        setPay(null);
        setSel(null);
        load();
        toast(t("market.done"));
      }, 1500);
    } catch {
      setPay("form");
      toast(t("err.generic"), "err");
    }
  };

  const saveReview = async () => {
    if (!sel) return;
    try {
      await api("/api/market", { action: "review", productId: sel.id, rating: rv.rating, comment: rv.comment });
      toast("✓");
      load();
    } catch {}
  };

  const createItem = async () => {
    try {
      await api("/api/market", {
        action: "create",
        title: cf.title,
        category: cf.category,
        priceCents: Math.round(parseFloat(cf.price || "0") * 100),
        description: cf.description,
        promoted: cf.promoted,
      });
      setCreateOpen(false);
      setCf({ title: "", category: "digital", price: "9.90", description: "", promoted: false });
      load();
      toast("✓");
    } catch (e: any) {
      toast(e.message === "plus" ? t("match.plusNote") : t("err.generic"), "err");
    }
  };

  const removeItem = async (id: string) => {
    try {
      await api("/api/market", { action: "remove", productId: id });
      setSel(null);
      load();
    } catch {}
  };

  if (me.ageGroup === "minor") {
    return (
      <div className="grid h-full place-items-center p-6">
        <div className="card max-w-md p-8 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-coral-500/15 text-coral-300">
            <IcLock className="h-7 w-7" />
          </span>
          <h3 className="font-display text-lg font-bold">Marea+ 18+</h3>
          <p className="mt-2 text-xs leading-relaxed text-mist">{t("market.minorNote")}</p>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-mist-2">
            <IcShield className="h-3.5 w-3.5 text-tide-500" /> {t("saf.r4")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <IcSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-2" />
            <input
              className="field pl-9"
              placeholder={t("market.ph")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5">
            <Chip active={cat === "all"} onClick={() => setCat("all")}>
              {t("market.all")}
            </Chip>
            {["product", "service", "digital"].map((c) => (
              <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
                {t(`market.cat_${c}`)}
              </Chip>
            ))}
          </div>
          <Btn variant="sun" onClick={() => setCreateOpen(true)}>
            <IcTag className="h-4 w-4" /> {t("market.sell")}
          </Btn>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-mist-2">
          <IcShield className="h-3.5 w-3.5 text-tide-500" /> {t("market.secure")}
        </p>

        {/* grid */}
        {items.length === 0 ? (
          <Empty icon={<IcStore className="h-8 w-8" />} title={t("market.empty")} />
        ) : (
          <div className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((i, idx) => {
              const Icon = CAT_ICON[i.category] ?? IcTag;
              return (
                <button
                  key={i.id}
                  onClick={() => setSel(i)}
                  className={`card anim-fade-up group overflow-hidden text-left transition hover:-translate-y-0.5 hover:border-tide-500/40 ${
                    i.promoted ? "ring-1 ring-sun-400/40" : ""
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div
                    className="relative grid h-28 place-items-center"
                    style={{
                      background: `linear-gradient(135deg, hsl(${i.seller?.hue ?? 174} 55% 22%), hsl(${((i.seller?.hue ?? 174) + 60) % 360} 50% 13%))`,
                    }}
                  >
                    <Icon className="h-9 w-9 text-foam/50 transition group-hover:scale-110 group-hover:text-foam/75" />
                    {i.promoted && (
                      <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-sun-400 px-2 py-0.5 text-[10px] font-bold text-ink-950">
                        <IcCrown className="h-3 w-3" /> {t("market.promoted")}
                      </span>
                    )}
                    <span className="absolute bottom-2.5 right-2.5 rounded-md bg-ink-950/70 px-2 py-0.5 text-[10px] font-medium text-mist">
                      {i.sold} {t("market.sold")}
                    </span>
                  </div>
                  <div className="p-3.5">
                    <p className="truncate font-display text-sm font-bold">{i.title}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {i.seller && <Avatar name={i.seller.nickname} hue={i.seller.hue} size={20} plus={i.seller.plus} />}
                      <span className="truncate text-[11px] text-mist-2">{i.seller?.nickname}</span>
                      <span className="ml-auto flex items-center gap-1">
                        <Stars value={i.rating} size={11} />
                        {i.reviewCount > 0 && <span className="text-[10px] text-mist-2">({i.reviewCount})</span>}
                      </span>
                    </div>
                    <p className="mt-2.5 font-display text-base font-extrabold text-tide-300">{fmtMoney(i.priceCents)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* detail modal */}
      <Modal open={!!sel && !pay} onClose={() => setSel(null)} title={sel?.title} wide>
        {sel && (
          <div className="space-y-4">
            <div
              className="grid h-24 place-items-center rounded-lg"
              style={{
                background: `linear-gradient(135deg, hsl(${sel.seller?.hue ?? 174} 55% 22%), hsl(${((sel.seller?.hue ?? 174) + 60) % 360} 50% 13%))`,
              }}
            >
              {(() => {
                const Icon = CAT_ICON[sel.category] ?? IcTag;
                return <Icon className="h-8 w-8 text-foam/60" />;
              })()}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {sel.seller && <Avatar name={sel.seller.nickname} hue={sel.seller.hue} size={30} plus={sel.seller.plus} />}
                <div>
                  <p className="text-xs font-bold">{sel.seller?.nickname}</p>
                  <Stars value={sel.rating} size={11} />
                </div>
              </div>
              <p className="font-display text-2xl font-extrabold text-tide-300">{fmtMoney(sel.priceCents)}</p>
            </div>
            <p className="text-sm leading-relaxed text-mist">{sel.description}</p>

            {sel.mine ? (
              <Btn variant="danger" size="sm" onClick={() => removeItem(sel.id)}>
                <IcTrash className="h-3.5 w-3.5" /> {t("market.delete")}
              </Btn>
            ) : (
              !pay && (
                <div className="flex flex-wrap gap-2">
                  <Btn onClick={() => openBuy(sel)}>
                    <IcCard className="h-4 w-4" /> {t("market.buy")} · {fmtMoney(sel.priceCents)}
                  </Btn>
                  {sel.purchased && (
                    <span className="flex items-center gap-1.5 rounded-lg border border-tide-500/30 bg-tide-500/10 px-3 py-2 text-xs font-semibold text-tide-300">
                      <IcCheck className="h-3.5 w-3.5" /> {t("market.done")}
                    </span>
                  )}
                </div>
              )
            )}

            {/* review */}
            {!sel.mine && sel.purchased && (
              <div className="rounded-lg border border-line bg-ink-950 p-3.5">
                <p className="mb-2 text-xs font-bold text-mist">{t("market.yourReview")}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Stars value={rv.rating} onChange={(v) => setRv({ ...rv, rating: v })} size={18} />
                </div>
                <textarea
                  className="field mt-2.5 min-h-16 resize-none"
                  placeholder={t("market.reviewPh")}
                  value={rv.comment}
                  onChange={(e) => setRv({ ...rv, comment: e.target.value })}
                  maxLength={200}
                />
                <div className="mt-2 flex justify-end">
                  <Btn size="sm" onClick={saveReview}>
                    {t("c.save")}
                  </Btn>
                </div>
              </div>
            )}

            {/* reviews list */}
            {sel.reviews?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-mist-2">
                  {t("market.review")} ({sel.reviewCount})
                </p>
                <div className="space-y-2">
                  {sel.reviews.map((r: any) => (
                    <div key={r.id} className="rounded-lg border border-line bg-ink-950 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{r.buyer?.nickname ?? "—"}</span>
                        <Stars value={r.rating} size={10} />
                        <span className="ml-auto text-[10px] text-mist-2">{timeAgo(r.createdAt, lang)}</span>
                      </div>
                      {r.comment && <p className="mt-1.5 text-xs leading-relaxed text-mist">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* payment modal */}
      <Modal open={!!pay} onClose={pay === "form" ? () => setPay(null) : () => {}} title={t("market.pay")}>
        {pay === "form" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-line bg-ink-950 px-3.5 py-2.5">
              <span className="text-xs text-mist">{sel?.title}</span>
              <span className="font-display text-sm font-extrabold">{fmtMoney(sel?.priceCents ?? 0)}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-mist-2">{t("market.paySub")}</p>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-mist">{t("pr.card")}</label>
              <input
                className="field font-mono tracking-wider"
                placeholder="4242 4242 4242 4242"
                value={card.num}
                maxLength={19}
                onChange={(e) =>
                  setCard({
                    ...card,
                    num: e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "),
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-mist">{t("pr.exp")}</label>
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
                <label className="mb-1 block text-[11px] font-semibold text-mist">{t("pr.cvc")}</label>
                <input className="field font-mono" placeholder="123" value={card.cvc} maxLength={4} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "") })} />
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-mist-2">
              <IcShield className="h-3.5 w-3.5 text-tide-500" /> {t("market.fee")}
            </p>
            <Btn className="w-full" disabled={card.num.replace(/\s/g, "").length < 12 || card.exp.length < 5 || card.cvc.length < 3} onClick={doPay}>
              <IcCard className="h-4 w-4" /> {t("market.pay")} · {fmtMoney(sel?.priceCents ?? 0)}
            </Btn>
          </div>
        )}
        {pay === "processing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="wave-load h-2 w-48 rounded-full bg-ink-700" />
            <p className="text-xs text-mist-2">{t("c.loading")}</p>
          </div>
        )}
        {pay === "done" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <span className="anim-pop grid h-14 w-14 place-items-center rounded-full bg-tide-500/20 text-tide-300">
              <IcCheck className="h-7 w-7" />
            </span>
            <p className="font-display text-sm font-bold">{t("market.done")}</p>
          </div>
        )}
      </Modal>

      {/* create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t("market.create")}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-mist">{t("market.titlePh")}</label>
            <input className="field" value={cf.title} maxLength={60} onChange={(e) => setCf({ ...cf, title: e.target.value })} placeholder="Pack 12 beat lo-fi" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-mist">{t("market.all")}</label>
              <select className="field" value={cf.category} onChange={(e) => setCf({ ...cf, category: e.target.value })}>
                <option value="product">{t("market.cat_product")}</option>
                <option value="service">{t("market.cat_service")}</option>
                <option value="digital">{t("market.cat_digital")}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-mist">{t("market.price")}</label>
              <input className="field" value={cf.price} onChange={(e) => setCf({ ...cf, price: e.target.value })} inputMode="decimal" placeholder="9.90" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-mist">{t("market.desc")}</label>
            <textarea className="field min-h-24 resize-none" value={cf.description} maxLength={600} onChange={(e) => setCf({ ...cf, description: e.target.value })} placeholder={t("market.descPh")} />
          </div>
          <label className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${cf.promoted && me.plus ? "border-sun-400/40 bg-sun-400/8" : "border-line bg-ink-950"} ${!me.plus ? "opacity-70" : ""}`}>
            <span className="flex items-center gap-2 text-xs font-semibold">
              <IcCrown className="h-4 w-4 text-sun-400" /> {t("market.promoted")}
              {!me.plus && <span className="text-[10px] text-mist-2">· Marea+</span>}
            </span>
            <button
              onClick={() => me.plus && setCf({ ...cf, promoted: !cf.promoted })}
              className={`relative h-5 w-9 rounded-full transition ${cf.promoted && me.plus ? "bg-sun-400" : "bg-ink-700"} ${!me.plus ? "cursor-not-allowed" : ""}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-foam transition-all ${cf.promoted && me.plus ? "left-[18px]" : "left-0.5"}`} />
            </button>
          </label>
          <Btn
            className="w-full"
            onClick={createItem}
            disabled={cf.title.trim().length < 3 || cf.description.trim().length < 10 || !Number.parseFloat(cf.price)}
          >
            <IcTag className="h-4 w-4" /> {t("c.confirm")}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
