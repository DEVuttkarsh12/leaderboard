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
      "Explain that the standings are live, public, and read-only from the browser experience.",
    meta: "Core guide",
    icon: CircleHelp,
    href: "/leaderboard",
    cta: "Open leaderboard",
  },
  {
    title: "Challenge and Reward Pages",
    description:
      "Show users where challenge, raffle, and store routes now live in the navigation shell.",
    meta: "Route guide",
    icon: BookOpen,
    href: "/challenges",
    cta: "Open challenges",
  },
  {
    title: "Support Escalation",
    description:
      "Move users into a dedicated support route instead of burying help text on the homepage.",
    meta: "Support route",
    icon: LifeBuoy,
    href: "/support",
    cta: "Open support",
  },
  {
    title: "Policy Links",
    description:
      "Privacy and terms are first-class routes now, matching the broader public-shell structure.",
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
        description="The reference site exposes separate help and policy routes. This page adds that support layer around your leaderboard app without touching the live data implementation."
        icon={CircleHelp}
        actions={[
          { label: "Open support", href: "/support" },
          { label: "Read terms", href: "/terms", variant: "secondary" },
        ]}
        stats={[
          { label: "Coverage", value: "Help and legal links" },
          { label: "Experience", value: "Multi-page" },
          { label: "Board data", value: "Still read-only" },
        ]}
      />
      <FeatureGridSection
        eyebrow="Help Center"
        title="FAQ, support routing, and policy entry points."
        description="This keeps the informational surfaces where users expect them while the competitive board stays focused on rankings."
        items={helpCards}
        columns={2}
      />
    </>
  );
}
