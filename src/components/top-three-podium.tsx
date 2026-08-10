import type { CSSProperties } from "react";
import { Crown, Sparkles } from "lucide-react";
import type { NormalizedLeaderboardUser } from "@/types/leaderboard";
import { maskPlayerHandle, maskPlayerName } from "@/lib/player-presentation";
import { cn } from "@/lib/utils";
import CountUpValue from "./count-up-value";
import UserAvatar from "./user-avatar";

type PodiumCardProps = {
  user: NormalizedLeaderboardUser;
  rank: number;
  delay: number;
  leaderScore: number;
};

function getSecondaryLabel(user: NormalizedLeaderboardUser): string {
  if (user.globalName && user.globalName !== user.name) {
    return maskPlayerHandle(user.globalName);
  }

  if (user.username && user.username !== user.name) {
    return maskPlayerHandle(user.username);
  }

  return "Live competitor";
}

function getProgressPercent(score: number, leaderScore: number): number {
  if (leaderScore <= 0) {
    return 0;
  }

  return Math.max(6, Math.min(100, (score / leaderScore) * 100));
}

function PodiumCard({ user, rank, delay, leaderScore }: PodiumCardProps) {
  const secondaryLabel = getSecondaryLabel(user);
  const progress = getProgressPercent(user.score, leaderScore);

  return (
    <article
      className={cn(
        "podium-card group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] p-6",
        rank === 1 ? "podium-card--first" : "podium-card--secondary",
        rank === 1 && "podium-card--featured"
      )}
      style={{ animationDelay: `${delay}ms` } as CSSProperties}
    >
      <div className="podium-card__glow" aria-hidden="true" />
      <div className="podium-card__noise" aria-hidden="true" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="podium-avatar-shell">
            <UserAvatar
              name={user.name}
              avatarUrl={user.avatarUrl}
              size={rank === 1 ? "lg" : "sm"}
            />
          </div>

          <div className="min-w-0">
            <div className="podium-chip">
              {rank === 1 ? <Crown className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              {rank === 1 ? "Top seat" : `Podium ${rank}`}
            </div>
            <div className="mt-3 truncate text-xl font-semibold text-white md:text-2xl">
              {maskPlayerName(user.name)}
            </div>
            <div className="mt-1 truncate text-sm text-white/72">
              {secondaryLabel}
            </div>
          </div>
        </div>

        <div className="podium-badge">
          <span>#{rank}</span>
        </div>
      </div>

      <div className="relative mt-8">
        <div className="podium-kicker">Weighted XP</div>
        <div className="podium-score">
          <CountUpValue value={user.score} mode="score" />
        </div>
        <div className="podium-points">
          Raw wager {user.points ? <CountUpValue value={user.points} mode="score" /> : "0"}
        </div>
      </div>

      <div className="podium-progress mt-6">
        <div className="podium-progress__label">
          <span>Pressure bar</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div className="podium-progress__track">
          <span
            className="podium-progress__fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="relative mt-6 flex items-end justify-between gap-4 border-t border-white/8 pt-5">
        <div className="podium-meta">
          <span className="podium-meta__label">Board status</span>
          <span className="podium-meta__value">
            {rank === 1 ? "Front runner" : `Chasing #${rank - 1}`}
          </span>
        </div>
        <div className="podium-meta">
          <span className="podium-meta__label">Rank lock</span>
          <span className="podium-meta__value">
            {rank <= 2 ? "Hot zone" : "Still alive"}
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
  if (users.length === 0) {
    return null;
  }

  const topThree = users.slice(0, Math.min(3, users.length));
  const leaderScore = topThree[0]?.score ?? 0;

  if (topThree.length === 1) {
    return (
      <div className="mx-auto max-w-xl">
        <PodiumCard user={topThree[0]} rank={1} delay={0} leaderScore={leaderScore} />
      </div>
    );
  }

  const ordered =
    topThree.length === 3
      ? [
          { user: topThree[1], rank: 2, delay: 30 },
          { user: topThree[0], rank: 1, delay: 120 },
          { user: topThree[2], rank: 3, delay: 60 },
        ]
      : topThree.map((user, index) => ({
          user,
          rank: index + 1,
          delay: index * 90,
        }));

  return (
    <div className="podium-grid">
      {ordered.map(({ user, rank, delay }) => (
        <div
          key={user.id}
          className={cn(
            "podium-grid__slot",
            rank === 1 && "podium-grid__slot--primary",
            rank === 2 && "podium-grid__slot--secondary-left",
            rank === 3 && "podium-grid__slot--secondary-right"
          )}
        >
          <PodiumCard
            user={user}
            rank={rank}
            delay={delay}
            leaderScore={leaderScore}
          />
        </div>
      ))}
    </div>
  );
}
