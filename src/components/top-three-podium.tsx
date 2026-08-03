import type { CSSProperties } from "react";
import type { NormalizedLeaderboardUser } from "@/types/leaderboard";
import { formatNumberCompact } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import UserAvatar from "./user-avatar";

type PodiumCardProps = {
  user: NormalizedLeaderboardUser;
  rank: number;
  delay: number;
};

function getSecondaryLabel(user: NormalizedLeaderboardUser): string | null {
  if (user.globalName && user.globalName !== user.name) {
    return user.globalName;
  }

  if (user.username && user.username !== user.name) {
    return `@${user.username}`;
  }

  return null;
}

function PodiumCard({ user, rank, delay }: PodiumCardProps) {
  const secondaryLabel = getSecondaryLabel(user);

  return (
    <article
      className={cn(
        "podium-card group relative flex h-full flex-col overflow-hidden rounded-[0.6rem] p-6",
        rank === 1 ? "podium-card--first" : "podium-card--secondary"
      )}
      style={{ animationDelay: `${delay}ms` } as CSSProperties}
    >
      <div className="podium-card__glow" aria-hidden="true" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <UserAvatar
            name={user.name}
            avatarUrl={user.avatarUrl}
            size={rank === 1 ? "lg" : "sm"}
          />
          <div className="min-w-0">
            <div
              className={cn(
                "truncate text-lg font-semibold md:text-xl",
                rank === 1 ? "text-white" : "text-[var(--shib-cream)]"
              )}
            >
              {user.name}
            </div>
            {secondaryLabel ? (
              <div
                className={cn(
                  "mt-1 truncate text-sm",
                  rank === 1 ? "text-white/80" : "text-[var(--shib-muted-soft)]"
                )}
              >
                {secondaryLabel}
              </div>
            ) : (
              <div
                className={cn(
                  "mt-1 text-sm",
                  rank === 1 ? "text-white/80" : "text-[var(--shib-muted-soft)]"
                )}
              >
                Live competitor
              </div>
            )}
          </div>
        </div>

        <div className="podium-badge">
          <span>#{rank}</span>
        </div>
      </div>

      <div className="relative mt-8 flex items-end justify-between gap-4 border-t border-[rgba(255,209,120,0.12)] pt-5">
        <div>
          <div
            className={cn(
              "text-[0.68rem] uppercase tracking-[0.24em]",
              rank === 1 ? "text-white/70" : "text-[var(--shib-muted)]"
            )}
          >
            Current score
          </div>
          <div
              className={cn(
                "mt-2 text-[2rem] font-semibold tracking-[-0.06em] md:text-[2.6rem]",
                rank === 1 ? "text-white" : "text-[var(--shib-fur-bright)]"
              )}
            >
              {formatNumberCompact(user.score)}
          </div>
        </div>

        <div className="podium-meta">
          <span className="podium-meta__label">Position</span>
          <span className="podium-meta__value">
            {rank === 1 ? "Leader" : `Top ${rank}`}
          </span>
        </div>
      </div>
    </article>
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
      <div className="mx-auto max-w-md">
        <PodiumCard user={topThree[0]} rank={1} delay={0} />
      </div>
    );
  }

  const ordered =
    topThree.length === 3
      ? [
          { user: topThree[1], rank: 2, delay: 0 },
          { user: topThree[0], rank: 1, delay: 120 },
          { user: topThree[2], rank: 3, delay: 60 },
        ]
      : topThree.map((user, index) => ({
          user,
          rank: index + 1,
          delay: index * 90,
        }));

  return (
    <div className="grid gap-4 md:grid-cols-3 md:items-end">
      {ordered.map(({ user, rank, delay }) => (
        <div
          key={user.id}
          className={cn(
            "w-full",
            rank === 1 && "order-first md:order-none md:-translate-y-5"
          )}
        >
          <PodiumCard user={user} rank={rank} delay={delay} />
        </div>
      ))}
    </div>
  );
}
