import type { Metadata } from "next";
import { Flag, Sparkles, Target, Trophy, Zap } from "lucide-react";
import FeatureGridSection from "@/components/feature-grid";
import PageHero from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Challenges | RankBoard",
  description: "Campaign and challenge UI for the rewards hub.",
};

const challengeCards = [
  {
    title: "Daily Missions",
    description:
      "Quick hits. Fast goals.",
    meta: "24-hour cadence",
    icon: Zap,
  },
  {
    title: "Weekly Tracks",
    description:
      "Longer arcs. Bigger swings.",
    meta: "7-day cadence",
    icon: Target,
  },
  {
    title: "Milestone Goals",
    description:
      "Clear next targets.",
    meta: "Progress UI",
    icon: Flag,
  },
  {
    title: "Seasonal Campaigns",
    description:
      "Big rounds. Big hooks.",
    meta: "Campaign framing",
    icon: Sparkles,
  },
  {
    title: "Leaderboard Unlocks",
    description:
      "Everything points back to rank.",
    meta: "Cross-route CTA",
    icon: Trophy,
  },
];

export default function ChallengesPage() {
  return (
    <>
      <PageHero
        eyebrow="Rewards"
        title="Challenges"
        description=""
        icon={Target}
        actions={[
          { label: "View leaderboard", href: "/leaderboard" },
          { label: "Open store", href: "/store", variant: "secondary" },
        ]}
        stats={[
          { label: "Mode", value: "Missions" },
          { label: "Flow", value: "Daily + weekly" },
          { label: "Focus", value: "Rank climb" },
        ]}
      />
      <FeatureGridSection
        eyebrow="Challenges"
        title="Pick a mission."
        description=""
        items={challengeCards}
      />
    </>
  );
}
