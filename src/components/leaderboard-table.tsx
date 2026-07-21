import type { NormalizedLeaderboardUser } from "@/types/leaderboard";
import { formatNumberCompact } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type LeaderboardTableProps = {
  users: NormalizedLeaderboardUser[];
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
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f2effc] text-xs font-semibold text-[#7257d5]">
      {initials}
    </div>
  );
}

export default function LeaderboardTable({ users }: LeaderboardTableProps) {
  if (users.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8e4f0] bg-white">
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e8e4f0] bg-[#f8f7fc]">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#6f6b7a]">
                Rank
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#6f6b7a]">
                User
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[#6f6b7a]">
                Score
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[#6f6b7a]">
                Weighted Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8e4f0]">
            {users.map((user) => (
              <tr
                key={user.id}
                className={cn(
                  "transition-colors hover:bg-[#f8f7fc]",
                  user.rank <= 3 && "bg-[#f2effc]/30"
                )}
              >
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold",
                      user.rank === 1 && "bg-amber-100 text-amber-700",
                      user.rank === 2 && "bg-slate-100 text-slate-600",
                      user.rank === 3 && "bg-orange-100 text-orange-700",
                      user.rank > 3 && "text-[#6f6b7a]"
                    )}
                  >
                    {user.rank}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} />
                    <span className="font-medium text-[#17151f]">
                      {user.name}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-right font-medium text-[#17151f] tabular-nums">
                  {formatNumberCompact(user.score)}
                </td>
                <td className="px-5 py-4 text-right font-medium text-[#17151f] tabular-nums">
                  {formatNumberCompact(user.weightedScore)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-[#e8e4f0] md:hidden">
        {users.map((user) => (
          <div
            key={user.id}
            className={cn(
              "flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#f8f7fc]",
              user.rank <= 3 && "bg-[#f2effc]/30"
            )}
          >
            <span
              className={cn(
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                user.rank === 1 && "bg-amber-100 text-amber-700",
                user.rank === 2 && "bg-slate-100 text-slate-600",
                user.rank === 3 && "bg-orange-100 text-orange-700",
                user.rank > 3 && "text-[#6f6b7a]"
              )}
            >
              {user.rank}
            </span>
            <Avatar name={user.name} />
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium text-[#17151f]">
                {user.name}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-[#17151f] tabular-nums">
                {formatNumberCompact(user.score)}
              </div>
              <div className="text-xs text-[#6f6b7a] tabular-nums">
                w: {formatNumberCompact(user.weightedScore)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
