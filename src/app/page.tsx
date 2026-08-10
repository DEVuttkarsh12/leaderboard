import HeroSection from "@/components/hero-section";
import FeatureLaunchpad from "@/components/feature-launchpad";
import HomeRouteHub from "@/components/home-route-hub";
import RewardsOverview from "@/components/rewards-overview";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeatureLaunchpad />
      <HomeRouteHub />
      <RewardsOverview />
    </>
  );
}
