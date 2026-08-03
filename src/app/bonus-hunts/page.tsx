import type { Metadata } from "next";
import { Clock3, Radio, Sparkles, Video } from "lucide-react";
import FeatureGridSection from "@/components/feature-grid";
import PageHero from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Bonus Hunts | RankBoard",
  description: "Bonus hunt stream pages for the rewards hub.",
};

const huntCards = [
  {
    title: "Live Session Cards",
    description:
      "Feature the active hunt, the host, and the current slot mix in a route that feels built for stream coverage.",
    meta: "Stream event",
    icon: Radio,
  },
  {
    title: "Schedule Blocks",
    description:
      "Future hunts can be listed with times, prize hooks, and CTA paths without polluting the leaderboard page.",
    meta: "Forward schedule",
    icon: Clock3,
  },
  {
    title: "Highlight Recaps",
    description:
      "Recap cards and standout moments belong in a stream page, not inside the standings shell.",
    meta: "Content recap",
    icon: Sparkles,
  },
  {
    title: "Clip Surface",
    description:
      "Video or highlight placeholders can live here while the board continues to focus on score ordering only.",
    meta: "Media block",
    icon: Video,
  },
];

export default function BonusHuntsPage() {
  return (
    <>
      <PageHero
        eyebrow="Stream"
        title="Bonus hunts get their own event page."
        description="The reference site separates stream-led content from the leaderboard. This route does the same, adding event UI without touching any ranking behavior."
        icon={Radio}
        actions={[
          { label: "Open tournaments", href: "/tournaments" },
          { label: "Open help", href: "/help", variant: "secondary" },
        ]}
        stats={[
          { label: "Route type", value: "Stream surface" },
          { label: "State", value: "UI-only" },
          { label: "Live board", value: "Unaffected" },
        ]}
      />
      <FeatureGridSection
        eyebrow="Bonus Hunts"
        title="Scheduling, highlights, and stream framing."
        description="Breaking this content out into its own route makes the overall site behave more like the reference hub."
        items={huntCards}
        columns={2}
      />
    </>
  );
}
