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
      "As of Monday, August 3, 2026, RankBoard operates as a multi-page rewards shell around a live leaderboard module.",
      "The pages added in this pass are UI destinations intended to mirror the broader public feature set of the reference site.",
    ],
  },
  {
    heading: "Leaderboard Use",
    paragraphs: [
      "The leaderboard page remains informational and read-only from the browser.",
      "Search, sort, pagination, and refresh behavior continue to rely on the existing app logic already present in the repository.",
    ],
    bullets: [
      "No new browser-side mutation path was added for leaderboard data.",
      "Provider and upstream fetch logic remain server-controlled.",
      "Campaign and support pages are structural UI additions only.",
    ],
  },
  {
    heading: "Future Expansion",
    paragraphs: [
      "Challenge, raffle, store, login, and support routes can be connected to real backend flows later.",
      "Those future changes should be treated independently from this route-structure and visual-shell update.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms for the current rewards shell."
      intro="These terms summarize the current shape of the app after the multi-page UI expansion and clarify that the live leaderboard engine was not altered."
      sections={sections}
    />
  );
}
