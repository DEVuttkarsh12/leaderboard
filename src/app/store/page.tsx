import type { Metadata } from "next";
import { BadgePercent, Gift, ShoppingBag, Ticket } from "lucide-react";
import FeatureGridSection from "@/components/feature-grid";
import PageHero from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Store | RankBoard",
  description: "Reward store UI for the rewards hub.",
};

const storeCards = [
  {
    title: "Boost Packs",
    description:
      "Promotional reward cards for XP boosts, access perks, or time-limited campaign bonuses.",
    meta: "Store item",
    icon: BadgePercent,
  },
  {
    title: "Reward Drops",
    description:
      "Spotlight cards for claimable drops and reward releases keep the store distinct from the standings screen.",
    meta: "Drop surface",
    icon: Gift,
  },
  {
    title: "Merch Entries",
    description:
      "Catalog cards can tease physical or digital merch-style rewards without needing live redemption logic yet.",
    meta: "Catalog block",
    icon: ShoppingBag,
  },
  {
    title: "Voucher Rewards",
    description:
      "Coupon, voucher, or ticket items fit better on a dedicated store route than inside challenge cards.",
    meta: "Redemption block",
    icon: Ticket,
  },
];

export default function StorePage() {
  return (
    <>
      <PageHero
        eyebrow="Store"
        title="The rewards store now lives on its own route."
        description="This page mirrors the reference product shape by giving reward inventory a dedicated destination. The live standings and their data flow stay exactly where they were."
        icon={ShoppingBag}
        actions={[
          { label: "Open challenges", href: "/challenges" },
          { label: "Need support?", href: "/support", variant: "secondary" },
        ]}
        stats={[
          { label: "Surface", value: "Reward catalog" },
          { label: "Engine", value: "Leaderboard untouched" },
          { label: "Use", value: "UI-only preview" },
        ]}
      />
      <FeatureGridSection
        eyebrow="Store"
        title="Catalog and redemption-inspired cards."
        description="The goal here is route completeness and UI parity around the leaderboard, not new transactional logic."
        items={storeCards}
        columns={2}
      />
    </>
  );
}
