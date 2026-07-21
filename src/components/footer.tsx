"use client";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#e8e4f0] bg-white py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <span className="text-lg font-semibold text-[#17151f]">
              <span className="text-[#7257d5]">Rank</span>Board
            </span>
            <p className="mt-1 text-sm text-[#6f6b7a]">
              Live community rankings and leaderboards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-[#6f6b7a]">
            <span className="cursor-not-allowed">Privacy</span>
            <span className="cursor-not-allowed">Terms</span>
          </div>
        </div>

        <div className="mt-8 border-t border-[#e8e4f0] pt-6 text-center text-xs text-[#6f6b7a]">
          &copy; {year} RankBoard. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
