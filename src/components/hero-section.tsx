"use client";

export default function HeroSection() {
  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[#f8f7fc] pt-24 pb-16 md:pt-32 md:pb-24"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#7257d5]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-[#7257d5]/3 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e8e4f0] bg-white px-4 py-1.5 text-xs font-medium text-[#7257d5]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7257d5] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7257d5]" />
              </span>
              Live Community Rankings
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#17151f] md:text-5xl lg:text-6xl">
              See Who&apos;s Leading the Way
            </h1>

            <p className="mt-4 text-lg leading-relaxed text-[#6f6b7a] md:text-xl">
              Real-time rankings powered by verified community activity. Track
              top performers, compare scores, and see where you stand.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => handleScroll("leaderboard")}
                className="rounded-lg bg-[#7257d5] px-7 py-3 text-sm font-medium text-white transition-all hover:bg-[#4f3aa8] hover:-translate-y-0.5 shadow-sm"
              >
                View Leaderboard
              </button>
              <button
                onClick={() => handleScroll("how-it-works")}
                className="rounded-lg border border-[#e8e4f0] bg-white px-7 py-3 text-sm font-medium text-[#6f6b7a] transition-all hover:border-[#d4cee6] hover:text-[#17151f]"
              >
                How It Works
              </button>
            </div>
          </div>

          <div className="hidden shrink-0 md:block">
            <div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-[#f2effc] border border-[#e8e4f0]">
              <div className="text-center">
                <div className="text-5xl font-bold text-[#7257d5]">
                  &gt;300
                </div>
                <div className="mt-1 text-sm text-[#6f6b7a]">
                  Active Participants
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
