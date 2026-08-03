import type { Metadata } from "next";
import { Gift, Tickets, Trophy, Wallet } from "lucide-react";
import FeatureGridSection from "@/components/feature-grid";
import PageHero from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Wager Raffles | RankBoard",
  description: "Raffle and ticket UI for the rewards hub.",
};

const raffleCards = [
  {
    title: "Ticket Thresholds",
    description:
      "Show how ticket counts are earned with clear thresholds and next-step messaging.",
    meta: "Ticket rules",
    icon: Tickets,
  },
  {
    title: "Prize Tiers",
    description:
      "Separate prize bands make raffles feel like a destination instead of a note buried on the homepage.",
    meta: "Tiered rewards",
    icon: Trophy,
  },
  {
    title: "Claim Readiness",
    description:
      "Claim-state UI can exist here without touching the live leaderboard provider or polling path.",
    meta: "Claim surface",
    icon: Gift,
  },
  {
    title: "Entry Summary",
    description:
      "Personal entry cards and totals fit naturally on this route while the leaderboard remains public-facing.",
    meta: "Account summary",
    icon: Wallet,
  },
];

export default function WagerRafflesPage() {
  return (
    <>
      <PageHero
        eyebrow="Rewards"
        title="Wager raffles sit outside the board page."
        description="Ticket-based reward mechanics now have a dedicated route in the shell, matching the reference product structure while leaving the leaderboard engine alone."
        icon={Tickets}
        actions={[
          { label: "Back to challenges", href: "/challenges" },
          { label: "Open leaderboard", href: "/leaderboard", variant: "secondary" },
        ]}
        stats={[
          { label: "Mode", value: "Raffle UI only" },
          { label: "Board path", value: "Still isolated" },
          { label: "Reference fit", value: "Rewards destination" },
        ]}
      />
      <FeatureGridSection
        eyebrow="Raffles"
        title="Ticket and prize surfaces."
        description="This page gives raffle mechanics a proper home and keeps the surrounding flows from crowding the live standings."
        items={raffleCards}
        columns={2}
      />
    </>
  );
}
