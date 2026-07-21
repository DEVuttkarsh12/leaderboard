import type { NormalizedLeaderboardUser } from "@/types/leaderboard";
import { formatNumberCompact } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type PodiumCardProps = {
  user: NormalizedLeaderboardUser;
  rank: number;
};

function Avatar({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f2effc] text-sm font-semibold text-[#7257d5]">
      {initials}
    </div>
  );
}

function PodiumCard({ user, rank }: PodiumCardProps) {
  const medalColors = [
    "bg-amber-50 border-amber-200 text-amber-700",
    "bg-slate-50 border-slate-200 text-slate-600",
    "bg-orange-50 border-orange-200 text-orange-700",
  ];

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center rounded-2xl border bg-white p-6 text-center transition-all hover:-translate-y-1",
        rank === 1 && "md:scale-105 shadow-md",
        rank === 1 && "border-[#e8e4f0]",
        rank !== 1 && "border-[#e8e4f0]"
      )}
    >
      <div
        className={cn(
          "mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
          medalColors[rank - 1]
        )}
      >
        <span>#{rank}</span>
      </div>
      <Avatar name={user.name} />
      <div className="mt-3 font-semibold text-[#17151f]">{user.name}</div>
      <div className="mt-1 text-xs text-[#6f6b7a]">
        {formatNumberCompact(user.score)} pts
      </div>
    </div>
  );
}

type TopThreePodiumProps = {
  users: NormalizedLeaderboardUser[];
};

export default function TopThreePodium({ users }: TopThreePodiumProps) {
  if (users.length === 0) return null;

  const topThree = users.slice(0, Math.min(3, users.length));

  if (topThree.length === 1) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-xs">
          <PodiumCard user={topThree[0]} rank={1} />
        </div>
      </div>
    );
  }

  const ordered =
    topThree.length === 3
      ? [topThree[1], topThree[0], topThree[2]]
      : topThree;

  return (
    <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:items-end">
      {ordered.map((user) => {
        const actualRank = topThree.length === 3
          ? user === topThree[0] ? 1 : user === topThree[1] ? 2 : 3
          : topThree.indexOf(user) + 1;
        return (
          <div
            key={user.id}
            className={cn(
              "w-full md:w-72",
              actualRank === 1 && "order-first md:order-none"
            )}
          >
            <PodiumCard user={user} rank={actualRank} />
          </div>
        );
      })}
    </div>
  );
}
