import HeroSection from "@/components/hero-section";
import FeatureGridSection from "@/components/feature-grid";
import HomeRouteHub from "@/components/home-route-hub";
import RewardsOverview from "@/components/rewards-overview";
import HowItWorks from "@/components/how-it-works";
import FAQSection from "@/components/faq-section";
import { platformCards, streamCards } from "@/lib/site-content";

export default function Home() {
  return (
    <>
      <HeroSection />
      <HomeRouteHub />
      <FeatureGridSection
        eyebrow="Stream"
        title="Reference-style hub features, split into real pages."
        description="The home page now routes outward into the same kinds of destination pages the reference site exposes, instead of collapsing the whole experience into one screen."
        items={streamCards}
      />
      <RewardsOverview />
      <FeatureGridSection
        eyebrow="Platform"
        title="More product surface around the leaderboard."
        description="These pages are UI-only additions. The live board keeps the same read-only data path while the surrounding site gets a fuller rewards shell."
        items={platformCards}
      />
      <HowItWorks />
      <FAQSection />
    </>
  );
}
