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
      "Show the live hunt fast.",
    meta: "Stream event",
    icon: Radio,
  },
  {
    title: "Schedule Blocks",
    description:
      "Line up the next hit.",
    meta: "Forward schedule",
    icon: Clock3,
  },
  {
    title: "Highlight Recaps",
    description:
      "Save the loud moments.",
    meta: "Content recap",
    icon: Sparkles,
  },
  {
    title: "Clip Surface",
    description:
      "Clips live here, not on-rank.",
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
        description=""
        icon={Radio}
        actions={[
          { label: "Open tournaments", href: "/tournaments" },
          { label: "Open help", href: "/help", variant: "secondary" },
        ]}
        stats={[
          { label: "Route type", value: "Stream surface" },
          { label: "State", value: "Event stage" },
          { label: "Live board", value: "Competition focus" },
        ]}
      />
      <FeatureGridSection
        eyebrow="Bonus Hunts"
        title="Scheduling, highlights, and stream framing."
        description=""
        items={huntCards}
        columns={2}
      />
    </>
  );
}
