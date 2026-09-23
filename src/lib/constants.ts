export const COUNTRIES: { code: string; name: string }[] = [
  { code: "IT", name: "Italia" },
  { code: "ES", name: "España" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Deutschland" },
  { code: "PT", name: "Portugal" },
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "NL", name: "Nederland" },
  { code: "BE", name: "België" },
  { code: "CH", name: "Svizzera" },
  { code: "AT", name: "Österreich" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "México" },
  { code: "BR", name: "Brasil" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "JP", name: "日本" },
  { code: "KR", name: "대한민국" },
  { code: "IN", name: "India" },
  { code: "PH", name: "Philippines" },
  { code: "ID", name: "Indonesia" },
  { code: "AU", name: "Australia" },
  { code: "SE", name: "Sverige" },
  { code: "NO", name: "Norge" },
  { code: "PL", name: "Polska" },
  { code: "GR", name: "Ελλάδα" },
  { code: "TR", name: "Türkiye" },
  { code: "ZA", name: "South Africa" },
];

export const LANGS: { code: string; native: string; label: string }[] = [
  { code: "it", native: "Italiano", label: "Italian" },
  { code: "en", native: "English", label: "English" },
  { code: "es", native: "Español", label: "Spanish" },
  { code: "fr", native: "Français", label: "French" },
  { code: "de", native: "Deutsch", label: "German" },
];

export const INTERESTS: string[] = [
  "music",
  "gaming",
  "travel",
  "art",
  "sports",
  "study",
  "food",
  "sea",
  "tech",
  "books",
  "cinema",
  "dance",
  "space",
  "languages",
  "photography",
  "coding",
];

export const CATEGORIES: { code: string; label: string }[] = [
  { code: "product", label: "prodotti" },
  { code: "service", label: "servizi" },
  { code: "digital", label: "contenuti digitali" },
];

export const countryName = (code: string) =>
  COUNTRIES.find((c) => c.code === code)?.name ?? code;
export const langNative = (code: string) =>
  LANGS.find((l) => l.code === code)?.native ?? code;
