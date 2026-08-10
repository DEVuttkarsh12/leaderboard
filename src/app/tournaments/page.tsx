import type { Metadata } from "next";
import { CalendarDays, Medal, Swords, Trophy } from "lucide-react";
import FeatureGridSection from "@/components/feature-grid";
import PageHero from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Tournaments | RankBoard",
  description: "Tournament pages for the rewards hub.",
};

const tournamentCards = [
  {
    title: "Upcoming Brackets",
    description:
      "Set the bracket table.",
    meta: "Upcoming",
    icon: CalendarDays,
  },
  {
    title: "Match Flow",
    description:
      "Head-to-head belongs here.",
    meta: "Competition format",
    icon: Swords,
  },
  {
    title: "Prize Breakdown",
    description:
      "Let prizes hit harder.",
    meta: "Reward summary",
    icon: Trophy,
  },
  {
    title: "Winners Surface",
    description:
      "Give winners a proper wall.",
    meta: "Results layout",
    icon: Medal,
  },
];

export default function TournamentsPage() {
  return (
    <>
      <PageHero
        eyebrow="Stream"
        title="Tournaments"
        description=""
        icon={Trophy}
        actions={[
          { label: "Open bonus hunts", href: "/bonus-hunts" },
          { label: "View leaderboard", href: "/leaderboard", variant: "secondary" },
        ]}
        stats={[
          { label: "Mode", value: "Bracket" },
          { label: "State", value: "Upcoming" },
          { label: "Focus", value: "Prize run" },
        ]}
      />
      <FeatureGridSection
        eyebrow="Tournaments"
        title="Enter the bracket."
        description=""
        items={tournamentCards}
        columns={2}
      />
    </>
  );
}
