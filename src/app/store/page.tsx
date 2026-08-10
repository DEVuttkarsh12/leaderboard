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
      "Boosts with bite.",
    meta: "Store item",
    icon: BadgePercent,
  },
  {
    title: "Reward Drops",
    description:
      "Drops worth checking.",
    meta: "Drop surface",
    icon: Gift,
  },
  {
    title: "Merch Entries",
    description:
      "Merch with some flex.",
    meta: "Catalog block",
    icon: ShoppingBag,
  },
  {
    title: "Voucher Rewards",
    description:
      "Vouchers and ticket loot.",
    meta: "Redemption block",
    icon: Ticket,
  },
];

export default function StorePage() {
  return (
    <>
      <PageHero
        eyebrow="Store"
        title="Reward store"
        description=""
        icon={ShoppingBag}
        actions={[
          { label: "Open challenges", href: "/challenges" },
          { label: "Need support?", href: "/support", variant: "secondary" },
        ]}
        stats={[
          { label: "Mode", value: "Catalog" },
          { label: "State", value: "Drops" },
          { label: "Focus", value: "Redeem" },
        ]}
      />
      <FeatureGridSection
        eyebrow="Store"
        title="Grab rewards."
        description=""
        items={storeCards}
        columns={2}
      />
    </>
  );
}
