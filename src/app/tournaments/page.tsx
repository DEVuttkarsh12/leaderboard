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
        title="Tournament pages no longer depend on the homepage."
        description=""
        icon={Trophy}
        actions={[
          { label: "Open bonus hunts", href: "/bonus-hunts" },
          { label: "View leaderboard", href: "/leaderboard", variant: "secondary" },
        ]}
        stats={[
          { label: "Purpose", value: "Event destination" },
          { label: "Ranking logic", value: "Unchanged" },
          { label: "Shell type", value: "Multi-page" },
        ]}
      />
      <FeatureGridSection
        eyebrow="Tournaments"
        title="Schedule, results, and prize framing."
        description=""
        items={tournamentCards}
        columns={2}
      />
    </>
  );
}
