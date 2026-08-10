"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { formatLastUpdated } from "@/lib/formatters";
import {
  getInitials,
  getToneByIndex,
  maskPlayerHandle,
  maskPlayerName,
} from "@/lib/player-presentation";
import CountUpValue from "./count-up-value";
import CountdownStrip from "./countdown-strip";

type HeroSectionProps = {
  countdownTarget?: string | null;
};

export default function HeroSection({
  countdownTarget = null,
}: HeroSectionProps) {
  const { users, total, highestScore, averageScore, lastUpdated, isLoading } =
    useLeaderboard();
  const totalWager = users.reduce((sum, user) => sum + (user.points ?? 0), 0);
  const leaders = users.slice(0, 3);
  const orderedLeaders =
    leaders.length === 3 ? [leaders[1], leaders[0], leaders[2]] : leaders;
  const stageLeaders =
    orderedLeaders.length > 0
      ? orderedLeaders
      : ([null, null, null] as Array<(typeof orderedLeaders)[number] | null>);

  return (
    <section className="px-4 pb-8 pt-8 md:px-6 md:pb-12 md:pt-10">
      <div className="rivl-hero-shell">
        <div className="rivl-hero">
          <div className="rivl-hero-copy">
            <div className="rivl-eyebrow">
              <i />
              LIVE LEADERBOARD FLOOR
              <span>HOT NOW</span>
            </div>
            <h1 id="hero-title">
              PLAY
              <span>THE BOARD.</span>
            </h1>
            <p>
              Chase rank. Hit rewards.
            </p>
            <div className="rivl-hero-actions">
              <Link className="primary-button" href="/leaderboard">
                VIEW LEADERBOARD
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link className="text-button" href="/challenges">
                <span>EXPLORE REWARDS</span>
                ↓
              </Link>
            </div>
            <div className="rivl-hero-meta">
              <div>
                <span>VISIBLE WAGER</span>
                <strong>
                  {isLoading ? "..." : <CountUpValue value={totalWager} mode="score" />}
                </strong>
              </div>
              <div>
                <span>PLAYERS LIVE</span>
                <strong>
                  {isLoading ? "..." : <CountUpValue value={total} mode="whole" />}
                </strong>
              </div>
              <div>
                <span>TOP XP</span>
                <strong>
                  {isLoading ? "..." : <CountUpValue value={highestScore} mode="score" />}
                </strong>
              </div>
            </div>
          </div>

          <div className="rivl-stage">
            <div className="rivl-stage-header">
              <div>
                <span className="rivl-stage-kicker">LIVE STANDINGS</span>
                <h2>THE FRONT THREE</h2>
              </div>
              <span className="rivl-stage-sync">
                <i />
                {lastUpdated
                  ? `UPDATED ${formatLastUpdated(lastUpdated).toUpperCase()}`
                  : "SYNCING"}
              </span>
            </div>

            <div className="rivl-podium-grid">
              {stageLeaders.map((user, index) => {
                if (!user) {
                  const rank = index === 1 ? 1 : index === 0 ? 2 : 3;

                  return (
                    <article
                      key={`loading-leader-${rank}`}
                      className={`rivl-podium-card rivl-podium-card--loading place-${rank}`}
                      aria-hidden="true"
                    >
                      <div className="rivl-rank-tab">
                        <span>#{rank.toString().padStart(2, "0")}</span>
                        <small>SYNC</small>
                      </div>
                      {rank === 1 ? (
                        <div className="rivl-crown" aria-label="Loading champion">
                          <i />
                          <i />
                          <i />
                        </div>
                      ) : null}
                      <div className="rivl-avatar">
                        <span>RB</span>
                        <i className="status-dot" />
                      </div>
                      <div className="rivl-podium-player">
                        <h3>Syncing</h3>
                        <p>Live competitor</p>
                      </div>
                      <div className="rivl-xp-block">
                        <strong>...</strong>
                        <span>WEIGHTED XP</span>
                      </div>
                      <div className="rivl-podium-prize">
                        <span>WAGERED</span>
                        <strong>...</strong>
                      </div>
                    </article>
                  );
                }

                const tone = getToneByIndex(user.rank - 1);

                return (
                  <article
                    key={user.id}
                    className={`rivl-podium-card place-${user.rank}`}
                    tabIndex={0}
                  >
                    <div className="rivl-rank-tab">
                      <span>#{user.rank.toString().padStart(2, "0")}</span>
                      <small>LIVE</small>
                    </div>
                    {user.rank === 1 ? (
                      <div className="rivl-crown" aria-label="Current champion">
                        <i />
                        <i />
                        <i />
                      </div>
                    ) : null}
                    <div className={`rivl-avatar tone-${tone}`}>
                      <span>{getInitials(user.name)}</span>
                      <i className="status-dot" />
                    </div>
                    <div className="rivl-podium-player">
                      <h3>{maskPlayerName(user.name)}</h3>
                      <p>{maskPlayerHandle(user.username)}</p>
                    </div>
                    <div className="rivl-xp-block">
                      <strong>
                        <CountUpValue value={user.score} mode="score" />
                      </strong>
                      <span>WEIGHTED XP</span>
                    </div>
                    <div className="rivl-podium-prize">
                      <span>WAGERED</span>
                      <strong>
                        <CountUpValue value={user.points ?? 0} mode="score" />
                      </strong>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="rivl-stage-ribbon">
              <span>{isLoading ? "..." : `${total.toLocaleString()} PLAYERS`}</span>
              <i />
              <span>
                {isLoading ? "..." : <><CountUpValue value={averageScore} mode="score" /> AVG XP</>}
              </span>
              <i />
              <span>
                {lastUpdated ? `UPDATED ${formatLastUpdated(lastUpdated).toUpperCase()}` : "CONNECTING"}
              </span>
            </div>
          </div>
        </div>

        {countdownTarget ? (
          <div className="mt-6">
            <CountdownStrip targetIso={countdownTarget} label="CURRENT ROUND ENDS" />
          </div>
        ) : null}

            <div className="marquee" aria-label="Live platform updates">
          <div>
            <span>♠ PLAY NOW.</span>
            <span>♦ CLIMB FAST.</span>
            <span>777 CHASE HEAT.</span>
            <span>♣ CLAIM DROPS.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
