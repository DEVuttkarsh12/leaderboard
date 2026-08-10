import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CustomCursor from "@/components/custom-cursor";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RankBoard | Live Rewards Floor",
  description:
    "A live rewards floor with standings, event routes, reward surfaces, and support pages.",
  openGraph: {
    title: "RankBoard | Live Rewards Floor",
    description:
      "A live rewards floor with standings, event routes, reward surfaces, and support pages.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#14061f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full bg-[var(--bg)] text-[var(--text-primary)]"
      >
        <div className="product-page app-product-shell">
          <div className="casino-suit-cloud" aria-hidden="true">
            <span>♠</span>
            <span>♦</span>
            <span>♣</span>
            <span>♥</span>
            <i>777</i>
          </div>
          <div className="product-noise" aria-hidden="true" />
          <SiteHeader />
          <main className="product-main">{children}</main>
          <SiteFooter />
          <CustomCursor />
        </div>
      </body>
    </html>
  );
}
