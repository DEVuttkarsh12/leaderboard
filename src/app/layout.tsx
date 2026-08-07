import type { Metadata, Viewport } from "next";
import { Caveat_Brush, Outfit } from "next/font/google";
import "./globals.css";
import SiteBackground from "@/components/site-background";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

const displayFont = Caveat_Brush({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const bodyFont = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "RankBoard | Rewards Hub",
  description:
    "A multi-page rewards hub with live read-only leaderboard standings, campaign pages, and support surfaces.",
  openGraph: {
    title: "RankBoard | Rewards Hub",
    description:
      "A multi-page rewards hub with live read-only leaderboard standings, campaign pages, and support surfaces.",
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
      className={`${displayFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col text-slate-950"
      >
        <SiteBackground />
        <SiteHeader />
        <main className="site-shell-content flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
