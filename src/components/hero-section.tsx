"use client";

import Link from "next/link";
import { ArrowRight, Radio, ShieldCheck, Sparkles } from "lucide-react";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { formatLastUpdated } from "@/lib/formatters";
import CountUpValue from "./count-up-value";
import CountdownStrip from "./countdown-strip";
import PixelRevealEngine from "./pixel-reveal-engine";
import TextRevealScroll from "./text-reveal-scroll";

type HeroSectionProps = {
  countdownTarget?: string | null;
};

export default function HeroSection({
  countdownTarget = null,
}: HeroSectionProps) {
  const { users, total, highestScore, averageScore, lastUpdated, isLoading } =
    useLeaderboard();
  const leaders = users.slice(0, 3);
  const totalWager = users.reduce((sum, user) => sum + (user.points ?? 0), 0);

  return (
    <section className="hero-stage relative overflow-hidden px-4 pb-18 pt-8 md:px-6 md:pb-24 md:pt-10">
      <PixelRevealEngine
        className="hero-pixel-reveal"
        pixelColor="#7f48ff"
        cols={22}
        rows={16}
        animationSpeed={1.05}
        animationPattern="center"
        opacity={0.06}
      />
      <div className="section-wrap relative">
        <div className="hero-layout">
          <div className="hero-copy">
            <div className="hero-kicker-row">
              <div className="hero-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.26em]">
                <span className="live-dot" aria-hidden="true" />
                Live leaderboard shell
              </div>
              <div className="hero-inline-note">
                Browser stays read only.
              </div>
            </div>

            <TextRevealScroll
              as="h1"
              revealMode="chars"
              className="display-serif mt-6 max-w-5xl text-6xl leading-[0.9] font-normal text-[var(--shib-cream)] sm:text-7xl lg:text-[7rem]"
            >
              Rewards pages around a live board.
            </TextRevealScroll>

            <TextRevealScroll
              as="p"
              revealMode="words"
              className="hero-intro mt-5 max-w-2xl text-base leading-7 text-[var(--shib-muted-soft)] md:text-lg"
            >
              RankBoard keeps the protected ranking engine intact and wraps it in
              a darker streamer-style rewards shell, with live standings,
              campaign routes, and tighter casino-inspired pacing.
            </TextRevealScroll>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/leaderboard"
                className="primary-button inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-[var(--shib-ink)]"
              >
                View leaderboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/challenges"
                className="secondary-button inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold text-[var(--shib-cream)]"
              >
                Explore rewards
              </Link>
            </div>

            <div className="hero-money-panel mt-10">
              <div className="hero-money-panel__label">Visible wager volume</div>
              <div className="hero-money-panel__value">
                {isLoading ? "..." : <CountUpValue value={totalWager} mode="score" />}
              </div>
              <div className="hero-money-panel__meta">
                Live total across the currently visible board
              </div>
            </div>

            {countdownTarget ? (
              <div className="mt-8">
                <CountdownStrip
                  targetIso={countdownTarget}
                  label="Current round ends"
                />
              </div>
            ) : null}

            <div className="hero-command-grid mt-8">
              <div className="hero-command-card hero-command-card--strong">
                <span className="hero-command-card__label">Players live</span>
                <span className="hero-command-card__value">
                  {isLoading ? "..." : <CountUpValue value={total} mode="whole" />}
                </span>
                <span className="hero-command-card__meta">Visible on the public board</span>
              </div>
              <div className="hero-command-card">
                <span className="hero-command-card__label">Top weighted XP</span>
                <span className="hero-command-card__value">
                  {isLoading ? "..." : <CountUpValue value={highestScore} mode="score" />}
                </span>
                <span className="hero-command-card__meta">Current front-runner pace</span>
              </div>
              <div className="hero-command-card">
                <span className="hero-command-card__label">Average board XP</span>
                <span className="hero-command-card__value">
                  {isLoading ? "..." : <CountUpValue value={averageScore} mode="score" />}
                </span>
                <span className="hero-command-card__meta">Mid-board pace right now</span>
              </div>
              <div className="hero-command-card">
                <span className="hero-command-card__label">Refresh mode</span>
                <span className="hero-command-card__value hero-command-card__value--small">
                  {lastUpdated ? `Updated ${formatLastUpdated(lastUpdated)}` : "Fetching now"}
                </span>
                <span className="hero-command-card__meta">60-second client polling</span>
              </div>
            </div>

            <div className="hero-support-strip mt-6 flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
              <div className="hero-support-card">
                <ShieldCheck className="h-4 w-4 text-[var(--shib-gold)]" />
                Read-only live data path
              </div>
              <div className="hero-support-card">
                <Radio className="h-4 w-4 text-[var(--shib-violet-soft)]" />
                Polls without browser-side writes
              </div>
              <div className="hero-support-card">
                <Sparkles className="h-4 w-4 text-[var(--shib-gold)]" />
                Features preserved, visuals rebuilt
              </div>
            </div>
          </div>

          <div className="hero-showcase">
            <div className="hero-showcase__top">
              <div>
                <div className="muted-label">Live board preview</div>
                <TextRevealScroll
                  as="h2"
                  revealMode="chars"
                  className="hero-showcase__title"
                >
                  Current top three
                </TextRevealScroll>
              </div>
              <div className="hero-score-badge">
                <span className="live-dot" aria-hidden="true" />
                {lastUpdated ? `Refreshed ${formatLastUpdated(lastUpdated)}` : "Fetching standings"}
              </div>
            </div>

            <div className="hero-showcase__stack">
              {isLoading
                ? [1, 2, 3].map((index) => (
                    <article
                      key={index}
                      className={`hero-rank-card ${index === 1 ? "hero-rank-card--primary" : ""}`}
                    >
                      <div className="hero-rank-card__header">
                        <span className="hero-rank-card__rank">Loading</span>
                      </div>
                      <div className="hero-rank-card__name">Preparing stage</div>
                      <div className="hero-rank-card__score">...</div>
                      <div className="hero-rank-card__footer">Live data only</div>
                    </article>
                  ))
                : leaders.map((user, index) => (
                    <article
                      key={user.id}
                      className={`hero-rank-card ${index === 0 ? "hero-rank-card--primary" : ""}`}
                    >
                      <div className="hero-rank-card__header">
                        <span className="hero-rank-card__rank">#{user.rank}</span>
                        {index === 0 ? (
                          <span className="hero-rank-card__crown">Front runner</span>
                        ) : null}
                      </div>
                      <div className="hero-rank-card__name">{user.name}</div>
                      <div className="hero-rank-card__score">
                        <CountUpValue value={user.score} mode="score" />
                      </div>
                      <div className="hero-rank-card__footer">
                        Wager volume {user.points ? <CountUpValue value={user.points} mode="score" /> : "0"}
                      </div>
                    </article>
                  ))}
            </div>

            <div className="hero-showcase__footer">
              <div className="hero-footer-panel">
                <div className="hero-footer-panel__title">01</div>
                <div>
                  <TextRevealScroll
                    as="div"
                    revealMode="words"
                    className="hero-footer-panel__copy"
                  >
                    Live leaderboard
                  </TextRevealScroll>
                  <TextRevealScroll
                    as="div"
                    revealMode="words"
                    className="hero-footer-panel__subcopy"
                  >
                    Standings, search, sort, and refresh still ride on the same protected route.
                  </TextRevealScroll>
                </div>
              </div>
              <div className="hero-footer-panel">
                <div className="hero-footer-panel__title">02</div>
                <div>
                  <TextRevealScroll
                    as="div"
                    revealMode="words"
                    className="hero-footer-panel__copy"
                  >
                    Protected fetch path
                  </TextRevealScroll>
                  <TextRevealScroll
                    as="div"
                    revealMode="words"
                    className="hero-footer-panel__subcopy"
                  >
                    Rewards, account actions, and event feeds still wait on backend support.
                  </TextRevealScroll>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
