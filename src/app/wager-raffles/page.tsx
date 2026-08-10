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
      "Know the next threshold.",
    meta: "Ticket rules",
    icon: Tickets,
  },
  {
    title: "Prize Tiers",
    description:
      "Prize stacks with shape.",
    meta: "Tiered rewards",
    icon: Trophy,
  },
  {
    title: "Claim Readiness",
    description:
      "Claim flow stays off-board.",
    meta: "Claim surface",
    icon: Gift,
  },
  {
    title: "Entry Summary",
    description:
      "Your ticket stack, clean.",
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
        description=""
        icon={Tickets}
        actions={[
          { label: "Back to challenges", href: "/challenges" },
          { label: "Open leaderboard", href: "/leaderboard", variant: "secondary" },
        ]}
        stats={[
          { label: "Mode", value: "Raffle destination" },
          { label: "Board path", value: "Competition first" },
          { label: "Reference fit", value: "Rewards destination" },
        ]}
      />
      <FeatureGridSection
        eyebrow="Raffles"
        title="Ticket and prize surfaces."
        description=""
        items={raffleCards}
        columns={2}
      />
    </>
  );
}
