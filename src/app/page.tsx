import Navbar from "@/components/navbar";
import LeaderboardSection from "@/components/leaderboard-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <LeaderboardSection />
      </main>
      <Footer />
    </>
  );
}
