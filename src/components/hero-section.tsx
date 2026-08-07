"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { formatLastUpdated } from "@/lib/formatters";
import { getInitials, getToneByIndex } from "@/lib/player-presentation";
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

  return (
    <section className="px-4 pb-8 pt-8 md:px-6 md:pb-12 md:pt-10">
      <div className="rivl-hero-shell">
        <div className="rivl-hero">
          <div className="rivl-hero-copy">
            <div className="rivl-eyebrow">
              <i />
              LIVE LEADERBOARD FLOOR
              <span>READ ONLY</span>
            </div>
            <h1 id="hero-title">
              CLIMB
              <span>THE FLOOR.</span>
            </h1>
            <p>
              The working leaderboard engine remains intact while the public
              frontend is rebuilt around the visual system from the Design
              reference.
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
              {orderedLeaders.map((user) => {
                if (!user) {
                  return null;
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
                      <h3>{user.name}</h3>
                      <p>{user.username ? `@${user.username}` : "Live competitor"}</p>
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
            <span>♠ LIVE BOARD READS FROM THE EXISTING API ROUTE</span>
            <span>♦ NO WRITE OPERATIONS WERE ADDED TO THE LEADERBOARD FLOW</span>
            <span>777 REAL XP, REAL RANKS, REBUILT PRESENTATION</span>
            <span>♣ SEARCH, SORT, AND REFRESH STILL USE THE EXISTING APP LOGIC</span>
          </div>
        </div>
      </div>
    </section>
  );
}
