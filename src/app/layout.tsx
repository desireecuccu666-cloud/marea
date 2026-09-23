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

export const metadata: Metadata = {
  title: "Marea — la community internazionale",
  description:
    "Chat, stanze, match per interessi e marketplace. Nickname pubblico, identità verificata privatamente. Solo 18+.",
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
