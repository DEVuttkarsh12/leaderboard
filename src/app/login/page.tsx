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
      "A separate auth route makes the site feel like a real product shell instead of a single marketing page.",
    meta: "Auth route",
    icon: KeyRound,
  },
  {
    title: "Account Benefits",
    description:
      "Use this area to explain why users would connect for rewards, store access, or campaign tracking.",
    meta: "Value framing",
    icon: UserRound,
  },
  {
    title: "Reward Access",
    description:
      "Claim, store, and challenge-account UI can all branch out from this route without touching the leaderboard page.",
    meta: "Rewards layer",
    icon: WalletCards,
  },
  {
    title: "Security Messaging",
    description:
      "Support text and security reassurance belong on the auth route, not scattered through content sections.",
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
        description="This page is a UI placeholder for the broader app shell. It gives you the same route completeness as the reference site while keeping the leaderboard experience browseable and read-only."
        icon={KeyRound}
        actions={[
          { label: "Open support", href: "/support" },
          { label: "View leaderboard", href: "/leaderboard", variant: "secondary" },
        ]}
        stats={[
          { label: "Mode", value: "UI-only auth page" },
          { label: "Leaderboard access", value: "Public and read-only" },
          { label: "Future use", value: "Account gateway" },
        ]}
      />
      <FeatureGridSection
        eyebrow="Authentication"
        title="Entry-point UI for account features."
        description="This route exists to round out the product shell and to keep auth-related messaging separated from the leaderboard itself."
        items={loginCards}
        columns={2}
      />
    </>
  );
}
