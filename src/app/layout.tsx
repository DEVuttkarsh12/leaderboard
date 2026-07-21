import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Live Leaderboard | Community Rankings",
  description:
    "View live community rankings, top performers, scores, and leaderboard updates.",
  openGraph: {
    title: "Live Leaderboard | Community Rankings",
    description:
      "View live community rankings, top performers, scores, and leaderboard updates.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7257d5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
