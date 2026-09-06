import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const artzBody = localFont({
  variable: "--font-artz-body",
  src: [
    { path: "./fonts/Inter-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/Inter-SemiBold.otf", weight: "600", style: "normal" },
  ],
  display: "swap",
});

const artzDisplay = localFont({
  variable: "--font-artz-display",
  src: [
    { path: "./fonts/InterDisplay-Bold.otf", weight: "700", style: "normal" },
    { path: "./fonts/InterDisplay-BlackItalic.otf", weight: "900", style: "italic" },
  ],
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
  themeColor: "#050b13",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${artzBody.variable} ${artzDisplay.variable} antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
