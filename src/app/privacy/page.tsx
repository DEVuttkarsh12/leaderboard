import type { Metadata } from "next";
import LegalPage from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy | RankBoard",
  description: "Privacy information for the rewards hub.",
};

const sections = [
  {
    heading: "Overview",
    paragraphs: [
      "This page describes the privacy posture of the RankBoard rewards shell as of August 3, 2026.",
      "The current implementation adds public-facing routes and UI surfaces around the leaderboard. It does not introduce new browser-side write access into the live leaderboard data flow.",
    ],
  },
  {
    heading: "Leaderboard Data",
    paragraphs: [
      "The leaderboard experience remains read-only from the client.",
      "Users browse leaderboard standings through the existing local API route and server-side provider selection already present in the project.",
    ],
    bullets: [
      "The browser reads from /api/leaderboard.",
      "Provider selection remains server-side.",
      "No new challenge, store, or raffle write operations were added in this UI pass.",
    ],
  },
  {
    heading: "Support and Account Surfaces",
    paragraphs: [
      "Support, login, and help pages were added as UI routes only.",
      "They currently act as structural destinations in the multi-page shell and do not add new production account-processing logic on their own.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy for the rewards shell."
      intro="This route rounds out the public product structure and documents the current read-only nature of the leaderboard experience."
      sections={sections}
    />
  );
}
