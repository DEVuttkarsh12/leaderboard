import { Users } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#e8e4f0] bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f2effc]">
        <Users className="h-7 w-7 text-[#7257d5]" />
      </div>
      <h3 className="text-lg font-semibold text-[#17151f]">
        No rankings available yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-[#6f6b7a]">
        Leaderboard entries will appear here once users begin participating.
      </p>
    </div>
  );
}
