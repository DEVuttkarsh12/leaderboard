"use client";

import { cn } from "@/lib/utils";

export default function Navbar() {
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "bg-white/80 backdrop-blur-md",
        "border-b border-[#e8e4f0]"
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <span className="text-lg font-semibold text-[#17151f]">
          <span className="text-[#7257d5]">Rank</span>Board
        </span>
      </nav>
    </header>
  );
}
