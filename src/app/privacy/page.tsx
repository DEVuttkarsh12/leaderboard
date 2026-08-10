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
      "This page describes the privacy posture of the RankBoard rewards shell as of August 8, 2026.",
      "RankBoard presents standings, rewards, and support routes in one connected experience.",
    ],
  },
  {
    heading: "Leaderboard Experience",
    paragraphs: [
      "Players can browse standings, rankings, and round activity directly from the leaderboard.",
      "The board experience is designed to stay fast, clear, and focused during active competition.",
    ],
    bullets: [
      "Standings are available in the leaderboard route.",
      "Support, rewards, and account pages are accessible from the main shell.",
      "Competition views are kept separate from support and rewards flows.",
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
      intro="This route rounds out the public product structure and documents how RankBoard presents standings, rewards, and support surfaces."
      sections={sections}
    />
  );
}
