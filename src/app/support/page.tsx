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
      "A clean route for login or connection issues keeps account recovery separate from the leaderboard.",
    meta: "Auth help",
    icon: KeyRound,
  },
  {
    title: "Reward Questions",
    description:
      "Users can land here for store, raffle, or challenge clarifications instead of scanning the homepage for answers.",
    meta: "Reward help",
    icon: BadgeHelp,
  },
  {
    title: "Claim Escalations",
    description:
      "This is the right place for claim-status UI and issue funnels when backend claim logic arrives later.",
    meta: "Claim route",
    icon: ShieldAlert,
  },
  {
    title: "Conversation Surface",
    description:
      "Chat or ticket-style support layouts now have a route to live in without affecting the board module.",
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
        description="This is a UI-only support surface for the new shell. It gives the app the same structural depth as the reference site without changing your existing leaderboard logic."
        icon={BadgeHelp}
        actions={[
          { label: "Open help center", href: "/help" },
          { label: "Open login", href: "/login", variant: "secondary" },
        ]}
        stats={[
          { label: "Role", value: "Support destination" },
          { label: "Current scope", value: "UI only" },
          { label: "Board module", value: "Unaffected" },
        ]}
      />
      <FeatureGridSection
        eyebrow="Support"
        title="Account, claim, and ticket-style surfaces."
        description="These blocks complete the public shell around the leaderboard and give support-related UI a real home."
        items={supportCards}
        columns={2}
      />
    </>
  );
}
