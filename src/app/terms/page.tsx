import type { Metadata } from "next";
import LegalPage from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms | RankBoard",
  description: "Terms information for the rewards hub.",
};

const sections = [
  {
    heading: "Site Structure",
    paragraphs: [
      "As of Saturday, August 8, 2026, RankBoard operates as a multi-page rewards shell around its competition experience.",
      "The site includes standings, rewards, help, and account-oriented destinations within one connected surface.",
    ],
  },
  {
    heading: "Leaderboard Use",
    paragraphs: [
      "The leaderboard page is built for browsing standings, tracking momentum, and checking rank movement.",
      "Search, sort, pagination, and refresh behavior support a faster competition experience across the board.",
    ],
    bullets: [
      "Standings are presented through the leaderboard route.",
      "Campaign and support pages complement the main competition flow.",
      "Rewards and account surfaces remain clearly separated from the standings view.",
    ],
  },
  {
    heading: "Future Expansion",
    paragraphs: [
      "Challenge, raffle, store, login, and support routes can be connected to real backend flows later.",
      "Those future changes can expand the product without changing the public-facing navigation structure.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms"
      intro="The current app shape across standings, rewards, and support."
      sections={sections}
    />
  );
}
