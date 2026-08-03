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
      "Compact challenge cards for quick-turn objectives like check-ins, play streaks, or small score pushes.",
    meta: "24-hour cadence",
    icon: Zap,
  },
  {
    title: "Weekly Tracks",
    description:
      "Longer-running mission groups that sit between the homepage and the live leaderboard.",
    meta: "7-day cadence",
    icon: Target,
  },
  {
    title: "Milestone Goals",
    description:
      "Progress-based reward cards that give users a clear next step before they care about rank position.",
    meta: "Progress UI",
    icon: Flag,
  },
  {
    title: "Seasonal Campaigns",
    description:
      "Full campaign blocks with a prize headline, active dates, and a callout to the final leaderboard page.",
    meta: "Campaign framing",
    icon: Sparkles,
  },
  {
    title: "Leaderboard Unlocks",
    description:
      "Challenge completions can point back into the standings without changing the board logic itself.",
    meta: "Cross-route CTA",
    icon: Trophy,
  },
];

export default function ChallengesPage() {
  return (
    <>
      <PageHero
        eyebrow="Rewards"
        title="Challenges get their own destination."
        description="This page mirrors the reference-style challenge surface without changing any live ranking logic. It gives campaign objectives a dedicated UI layer before users jump into the board."
        icon={Target}
        actions={[
          { label: "View leaderboard", href: "/leaderboard" },
          { label: "Open store", href: "/store", variant: "secondary" },
        ]}
        stats={[
          { label: "Purpose", value: "Campaign entry point" },
          { label: "Board logic", value: "Unchanged" },
          { label: "Implementation", value: "UI-only surface" },
        ]}
      />
      <FeatureGridSection
        eyebrow="Challenges"
        title="Mission, milestone, and campaign blocks."
        description="These feature cards give the site the same kind of rewards depth the reference experience exposes around its public routes."
        items={challengeCards}
      />
    </>
  );
}
