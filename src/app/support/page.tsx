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
        title="Support now sits in its own route."
        description=""
        icon={BadgeHelp}
        actions={[
          { label: "Open help center", href: "/help" },
          { label: "Open login", href: "/login", variant: "secondary" },
        ]}
        stats={[
          { label: "Role", value: "Support destination" },
          { label: "Current scope", value: "Help and routing" },
          { label: "Board focus", value: "Stays clear" },
        ]}
      />
      <FeatureGridSection
        eyebrow="Support"
        title="Account, claim, and ticket-style surfaces."
        description=""
        items={supportCards}
        columns={2}
      />
    </>
  );
}
