import type { CSSProperties } from "react";
import type { NormalizedLeaderboardUser } from "@/types/leaderboard";
import { cn } from "@/lib/utils";
import CountUpValue from "./count-up-value";
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

  if (user.kickUsername) {
    return `Kick: ${user.kickUsername}`;
  }

  return "Live competitor";
}

export default function LeaderboardTable({ users }: LeaderboardTableProps) {
  if (users.length === 0) {
    return null;
  }

  const leaderScore = users[0]?.score ?? 0;

  return (
    <div className="table-stack">
      {users.map((user, index) => {
        const scoreShare =
          leaderScore > 0 ? Math.max(5, Math.min(100, (user.score / leaderScore) * 100)) : 0;
        const gapToLeader = Math.max(0, leaderScore - user.score);

        return (
          <article
            key={user.id}
            className={cn(
              "row-card group relative overflow-hidden rounded-[1.4rem] px-4 py-4 md:px-5 md:py-4.5",
              user.rank <= 3 ? "row-card--accent" : "row-card--default"
            )}
            style={{ animationDelay: `${Math.min(index, 14) * 38}ms` } as CSSProperties}
          >
            <div className="row-card__shine" aria-hidden="true" />

            <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_auto] lg:items-center">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "row-rank flex h-13 min-w-13 items-center justify-center rounded-[1rem] text-sm font-semibold",
                    user.rank === 1 && "row-rank--gold",
                    user.rank === 2 && "row-rank--silver",
                    user.rank === 3 && "row-rank--bronze",
                    user.rank > 3 && "row-rank--default"
                  )}
                >
                  #{user.rank}
                </div>

                <UserAvatar name={user.name} avatarUrl={user.avatarUrl} />

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[1rem] font-semibold text-[var(--text-primary)] md:text-[1.08rem]">
                    {user.name}
                  </div>
                  <div className="mt-1 truncate text-sm text-[var(--text-secondary)]">
                    {getMetaLine(user)}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="row-chip">
                      Weighted XP
                    </span>
                    <span className="row-chip row-chip--muted">
                      Gap {gapToLeader > 0 ? <CountUpValue value={gapToLeader} mode="score" /> : "Leader"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="row-stats">
                <div className="row-stat-block row-stat-block--score">
                  <div>
                    <div className="row-stat-block__label">Weighted XP</div>
                    <div className="row-stat-block__value">
                      <CountUpValue value={user.score} mode="score" />
                    </div>
                  </div>
                </div>

                <div className="row-stat-block row-stat-block--ticket">
                  <div>
                    <div className="row-stat-block__label">Wagered</div>
                    <div className="row-stat-block__value row-stat-block__value--secondary">
                      <CountUpValue value={user.points ?? 0} mode="score" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-4">
              <div className="row-progress">
                <div className="row-progress__label">
                  <span>Relative pace</span>
                  <span>{scoreShare.toFixed(0)}%</span>
                </div>
                <div className="row-progress__track">
                  <span
                    className="row-progress__fill"
                    style={{ width: `${scoreShare}%` }}
                  />
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
