import type { Metadata } from "next";
import { BadgeHelp, KeyRound, MessagesSquare, ShieldAlert } from "lucide-react";
import FeatureGridSection from "@/components/feature-grid";
import PageHero from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Support | RankBoard",
  description: "Support pages for the rewards hub.",
};

const supportCards = [
  {
    title: "Account Access",
    description:
      "Fix access fast.",
    meta: "Auth help",
    icon: KeyRound,
  },
  {
    title: "Reward Questions",
    description:
      "Store and prize questions.",
    meta: "Reward help",
    icon: BadgeHelp,
  },
  {
    title: "Claim Escalations",
    description:
      "Claim issues land here.",
    meta: "Claim route",
    icon: ShieldAlert,
  },
  {
    title: "Conversation Surface",
    description:
      "Tickets and chat energy.",
    meta: "Support shell",
    icon: MessagesSquare,
  },
];

export default function SupportPage() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title="Support"
        description=""
        icon={BadgeHelp}
        actions={[
          { label: "Open help center", href: "/help" },
          { label: "Open login", href: "/login", variant: "secondary" },
        ]}
        stats={[
          { label: "Mode", value: "Help desk" },
          { label: "State", value: "Claims" },
          { label: "Focus", value: "Fix fast" },
        ]}
      />
      <FeatureGridSection
        eyebrow="Support"
        title="Fix it fast."
        description=""
        items={supportCards}
        columns={2}
      />
    </>
  );
}
