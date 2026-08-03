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
      "Use tournament cards to show windows, formats, and prize hooks before participants ever hit the live board.",
    meta: "Upcoming",
    icon: CalendarDays,
  },
  {
    title: "Match Flow",
    description:
      "Head-to-head or round-based UI can live here rather than trying to fit inside leaderboard rows.",
    meta: "Competition format",
    icon: Swords,
  },
  {
    title: "Prize Breakdown",
    description:
      "Tournament-specific prize cards let event pages carry their own hierarchy and incentives.",
    meta: "Reward summary",
    icon: Trophy,
  },
  {
    title: "Winners Surface",
    description:
      "Champion and finalist cards can be showcased in an event route without affecting the live ranking module.",
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
        description="This route gives tournaments a proper destination in the same navigation shape as the reference site, while preserving the existing board engine."
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
        description="Event pages are now independent routes in the app shell, which is the main structural change the user asked for."
        items={tournamentCards}
        columns={2}
      />
    </>
  );
}
