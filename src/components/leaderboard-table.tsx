import type { CSSProperties } from "react";
import type { NormalizedLeaderboardUser } from "@/types/leaderboard";
import { formatNumberCompact } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import UserAvatar from "./user-avatar";

type LeaderboardTableProps = {
  users: NormalizedLeaderboardUser[];
};

function getMetaLine(user: NormalizedLeaderboardUser): string {
  if (user.globalName && user.globalName !== user.name) {
    return user.globalName;
  }

  if (user.username && user.username !== user.name) {
    return `@${user.username}`;
  }

  return "Live competitor";
}

export default function LeaderboardTable({ users }: LeaderboardTableProps) {
  if (users.length === 0) return null;

  return (
    <div className="space-y-3">
      {users.map((user, index) => (
        <article
          key={user.id}
          className={cn(
            "row-card group relative overflow-hidden rounded-[1.6rem] px-4 py-4 md:px-5 md:py-[1.125rem]",
            user.rank <= 3 ? "row-card--accent" : "row-card--default"
          )}
          style={{ animationDelay: `${Math.min(index, 14) * 40}ms` } as CSSProperties}
        >
          <div className="row-card__shine" aria-hidden="true" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3 md:min-w-[15rem]">
              <div
                className={cn(
                  "row-rank flex h-12 min-w-12 items-center justify-center rounded-[1rem] text-sm font-semibold",
                  user.rank === 1 && "row-rank--gold",
                  user.rank === 2 && "row-rank--silver",
                  user.rank === 3 && "row-rank--bronze",
                  user.rank > 3 && "row-rank--default"
                )}
              >
                #{user.rank}
              </div>

              <UserAvatar name={user.name} avatarUrl={user.avatarUrl} />

              <div className="min-w-0">
                <div className="truncate text-[0.96rem] font-semibold text-[#25143f] md:text-base">
                  {user.name}
                </div>
                <div className="mt-1 truncate text-sm text-[#735f97]">
                  {getMetaLine(user)}
                </div>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-between gap-3">
              <div className="hidden items-center gap-2 md:flex">
                {user.verified ? (
                  <span className="row-chip">Verified</span>
                ) : (
                  <span className="row-chip row-chip--muted">Active board</span>
                )}
              </div>

              <div className="text-right md:ml-auto">
                <div className="text-[0.68rem] uppercase tracking-[0.22em] text-[#8b79af]">
                  Score
                </div>
                <div className="mt-1 text-[1.6rem] font-semibold tracking-[-0.05em] text-[#23133d] tabular-nums md:text-[1.95rem]">
                  {formatNumberCompact(user.score)}
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
