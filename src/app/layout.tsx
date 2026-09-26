import type { Metadata, Viewport } from "next";
import {
  Fredoka,
  Instrument_Sans,
} from "next/font/google";
import "./globals.css";
import "./artz-polish.css";
import "./casino-stage.css";
import "./leaderboard-refresh.css";
import "./funky-gamified.css";

const artzBody = Instrument_Sans({
  variable: "--font-artz-body",
  subsets: ["latin"],
  display: "swap",
});

const artzDisplay = Fredoka({
  variable: "--font-artz-display",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

const artzLogo = Fredoka({
  variable: "--font-artz-logo",
  weight: ["500", "600", "700"],
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
