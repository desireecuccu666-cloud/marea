import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Sora, Instrument_Sans } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--f-sora",
  display: "swap",
});
const inst = Instrument_Sans({
  subsets: ["latin"],
  variable: "--f-inst",
  display: "swap",
});

const SITE = "https://marea-seven-phi.vercel.app";

export const metadata: Metadata = {
  title: "Marea — la community internazionale",
  description:
    "Chat in tempo reale, stanze, match per interessi, sfoghi e marketplace. Spazi separati per età, identità verificata in privato, nickname pubblico.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Marea — la community internazionale",
    description:
      "Chat live, stanze, match per interessi, sfoghi e marketplace. Spazi separati per età (13-17 / 18+), identità verificata in privato.",
    type: "website",
    locale: "it_IT",
    siteName: "Marea",
    url: SITE,
    images: [{ url: "/og-marea.jpg", width: 1200, height: 630, alt: "Marea — la community internazionale" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Marea — la community internazionale",
    description: "Chat live, stanze, match e marketplace. Spazi separati per età, identità in privato.",
    images: ["/og-marea.jpg"],
  },
  other: {
    "google-site-verification": "PN4Ze91IciIBDibpPqZNKXMOwxIPpLdM9NqfVRBC2RM",
  },
};

export const viewport: Viewport = {
  themeColor: "#04101a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it" className={`${sora.variable} ${inst.variable}`}>
      <body className="bg-ink-950 font-body text-foam antialiased">{children}</body>
    </html>
  );
}
