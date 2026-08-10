import type { Metadata } from "next";
import { BookOpen, CircleHelp, LifeBuoy, ShieldCheck } from "lucide-react";
import FeatureGridSection from "@/components/feature-grid";
import PageHero from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Help | RankBoard",
  description: "Help center pages for the rewards hub.",
};

const helpCards = [
  {
    title: "Leaderboard Basics",
    description:
      "How the board moves.",
    meta: "Core guide",
    icon: CircleHelp,
    href: "/leaderboard",
    cta: "Open leaderboard",
  },
  {
    title: "Challenge and Reward Pages",
    description:
      "Where rewards live.",
    meta: "Route guide",
    icon: BookOpen,
    href: "/challenges",
    cta: "Open challenges",
  },
  {
    title: "Support Escalation",
    description:
      "Take issues off the floor.",
    meta: "Support route",
    icon: LifeBuoy,
    href: "/support",
    cta: "Open support",
  },
  {
    title: "Policy Links",
    description:
      "Quick policy exits.",
    meta: "Legal route",
    icon: ShieldCheck,
    href: "/privacy",
    cta: "Open privacy",
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHero
        eyebrow="Help"
        title="Support and FAQ now have a dedicated home."
        description=""
        icon={CircleHelp}
        actions={[
          { label: "Open support", href: "/support" },
          { label: "Read terms", href: "/terms", variant: "secondary" },
        ]}
        stats={[
          { label: "Coverage", value: "Help and legal links" },
          { label: "Experience", value: "Multi-page" },
          { label: "Board focus", value: "Ranks and progress" },
        ]}
      />
      <FeatureGridSection
        eyebrow="Help Center"
        title="FAQ, support routing, and policy entry points."
        description=""
        items={helpCards}
        columns={2}
      />
    </>
  );
}
