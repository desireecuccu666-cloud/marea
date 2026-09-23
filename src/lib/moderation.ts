const SLURS: Record<string, string[]> = {
  it: ["scemo", "idiota", "sfigato", "porco", "maledetto", "disgustoso", "inutil"],
  en: ["stupid", "idiot", "ugly", "disgusting", "useless", "hateyou"],
  es: ["idiota", "estupido", "cabron", "inutil", "disgustoso"],
  fr: ["stupid", "idiot", "merde", "inutile", "disgustant"],
  de: ["dumm", "idiot", "scheisse", "nutte", "unnutz"],
};

const SCAM_RE =
  /(https?:\/\/|www\.|bit\.ly|@[a-z0-9]+\.(com|net|org|io|app|xyz)|\b(whatsapp|paypal|bitcoin|crypto|telegram|western union|giftcard|gift card)\b)/i;

const MINOR_EXTRA = [
  "odio",
  "hate",
  "droga",
  "drugs",
  "alcol",
  "alcohol",
  "fumo",
  "sigaretta",
  "vape",
  "bevi",
  "guadagnare soldi",
  "giftcard",
];

export function moderate(
  text: string,
  lang: string,
  group?: string
): { clean: string; hits: number; scam: boolean } {
  let clean = text;
  let hits = 0;
  const words = new Set([...(SLURS[lang] ?? []), ...SLURS.en, ...(group === "minor" ? MINOR_EXTRA : [])]);
  for (const w of words) {
    const re = new RegExp(w, "gi");
    const m = text.match(new RegExp(w, "i"));
    if (m) {
      hits++;
      clean = clean.replace(re, (match) => "*".repeat(Math.min(match.length, 5)));
    }
  }
  const scam = SCAM_RE.test(text);
  return { clean, hits, scam };
}
