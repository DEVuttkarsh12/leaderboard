import HeroSection from "@/components/hero-section";
import FeatureGridSection from "@/components/feature-grid";
import HomeRouteHub from "@/components/home-route-hub";
import RewardsOverview from "@/components/rewards-overview";
import HowItWorks from "@/components/how-it-works";
import FAQSection from "@/components/faq-section";
import { platformCards, streamCards } from "@/lib/site-content";
import { getShuffleLeaderboardWindow } from "@/lib/server/leaderboard/shuffle-window";

function getCountdownTarget(): string | null {
  if (process.env.LEADERBOARD_PROVIDER !== "shuffle") {
    return null;
  }

  try {
    const { endIso } = getShuffleLeaderboardWindow();
    return endIso;
  } catch {
    return null;
  }
}

export default function Home() {
  const countdownTarget = getCountdownTarget();

  return (
    <>
      <HeroSection countdownTarget={countdownTarget} />
      <HomeRouteHub />
      <FeatureGridSection
        eyebrow="Stream Surface"
        title="Campaign, stream, and event routes around the live board."
        description="The public shell now feels like a full streamer rewards ecosystem, while the standings module remains isolated and read-only."
        items={streamCards}
      />
      <RewardsOverview />
      <FeatureGridSection
        eyebrow="Platform"
        title="Support layers for rewards, help, and account entry."
        description="These routes establish the surrounding product experience without inventing backend actions that do not exist yet."
        items={platformCards}
      />
      <HowItWorks />
      <FAQSection />
    </>
  );
}
