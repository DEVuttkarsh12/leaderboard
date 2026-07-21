import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { StatsSkeleton, PodiumSkeleton, TableSkeleton } from "@/components/loading-skeleton";

export default function Loading() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="bg-[#f8f7fc] py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12">
              <div className="mb-2 h-9 w-56 animate-pulse rounded bg-[#e8e4f0]" />
              <div className="h-5 w-72 animate-pulse rounded bg-[#e8e4f0]" />
            </div>
            <div className="space-y-8">
              <StatsSkeleton />
              <PodiumSkeleton />
              <TableSkeleton />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
