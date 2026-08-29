import type { Metadata, Viewport } from "next";
import { Fredoka, Saira_Condensed, Space_Mono } from "next/font/google";
import "./globals.css";

const sairaCondensed = Saira_Condensed({
  variable: "--font-dg-display",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  display: "swap",
});

const fredoka = Fredoka({
  variable: "--font-dg-body",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-dg-label",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RankBoard",
  description: "Live gaming rewards, leaderboard rankings, missions, and prize drops.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08030F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sairaCondensed.variable} ${fredoka.variable} ${spaceMono.variable} antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
