import type { Metadata } from "next";
import { KeyRound, Shield, UserRound, WalletCards } from "lucide-react";
import FeatureGridSection from "@/components/feature-grid";
import PageHero from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Login | RankBoard",
  description: "Authentication entry page for the rewards hub.",
};

const loginCards = [
  {
    title: "Entry Surface",
    description:
      "One door in.",
    meta: "Auth route",
    icon: KeyRound,
  },
  {
    title: "Account Benefits",
    description:
      "Why people connect.",
    meta: "Value framing",
    icon: UserRound,
  },
  {
    title: "Reward Access",
    description:
      "Accounts meet rewards here.",
    meta: "Rewards layer",
    icon: WalletCards,
  },
  {
    title: "Security Messaging",
    description:
      "Trust copy stays here.",
    meta: "Trust layer",
    icon: Shield,
  },
];

export default function LoginPage() {
  return (
    <>
      <PageHero
        eyebrow="Login"
        title="Authentication has a dedicated entry route."
        description=""
        icon={KeyRound}
        actions={[
          { label: "Open support", href: "/support" },
          { label: "View leaderboard", href: "/leaderboard", variant: "secondary" },
        ]}
        stats={[
          { label: "Mode", value: "Account entry" },
          { label: "Leaderboard access", value: "Open board view" },
          { label: "Future use", value: "Account gateway" },
        ]}
      />
      <FeatureGridSection
        eyebrow="Authentication"
        title="Entry-point UI for account features."
        description=""
        items={loginCards}
        columns={2}
      />
    </>
  );
}
