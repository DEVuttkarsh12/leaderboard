import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Instrument_Sans,
  Sedgwick_Ave,
} from "next/font/google";
import "./globals.css";
import "./artz-polish.css";
import "./casino-stage.css";

const artzBody = Instrument_Sans({
  variable: "--font-artz-body",
  subsets: ["latin"],
  display: "swap",
});

const artzDisplay = Bricolage_Grotesque({
  variable: "--font-artz-display",
  subsets: ["latin"],
  display: "swap",
});

const artzLogo = Sedgwick_Ave({
  variable: "--font-artz-logo",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ARTZ Rewards",
  description: "ARTZ live rewards, leaderboard rankings, missions, and prize drops.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0312",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${artzBody.variable} ${artzDisplay.variable} ${artzLogo.variable} antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
