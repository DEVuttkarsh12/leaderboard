"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, RefreshCcw, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import {
  formatLastUpdated,
  formatShortDate,
} from "@/lib/formatters";
import { getSearchableNames } from "@/lib/normalize-leaderboard";
import type { SortField, SortDirection } from "./leaderboard-filters";
import TopThreePodium from "./top-three-podium";
import LeaderboardFilters from "./leaderboard-filters";
import LeaderboardTable from "./leaderboard-table";
import EmptyState from "./empty-state";
import ErrorState from "./error-state";
import { PodiumSkeleton, TableSkeleton } from "./loading-skeleton";
import CountUpValue from "./count-up-value";
import CountdownStrip from "./countdown-strip";

const PAGE_SIZE = 20;

type LeaderboardSectionProps = {
  countdownTarget?: string | null;
};

function getTotalWager(users: ReturnType<typeof useLeaderboard>["users"]): number {
  return users.reduce((sum, user) => sum + (user.points ?? 0), 0);
}

export default function LeaderboardSection({
  countdownTarget = null,
}: LeaderboardSectionProps) {
  const {
    users,
    total,
    highestScore,
    averageScore,
    lastUpdated,
    isLoading,
    error,
    retry,
  } = useLeaderboard();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = query
      ? users.filter((user) =>
          getSearchableNames(user).some((name) =>
            name.toLowerCase().includes(query)
          )
        )
      : [...users];

    result.sort((a, b) => {
      if (sortField === "rank") {
        return sortDirection === "asc" ? a.rank - b.rank : b.rank - a.rank;
      }

      return sortDirection === "desc"
        ? b.score - a.score
        : a.score - b.score;
    });

    return result;
  }, [users, search, sortField, sortDirection]);

  const paginatedUsers = filteredUsers.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < filteredUsers.length;
  const totalWager = useMemo(() => getTotalWager(users), [users]);
  const topPlayer = users[0] ?? null;
  const targetDate = countdownTarget ? new Date(countdownTarget) : null;
  const hasSearchResults = filteredUsers.length > 0;

  return (
    <section id="leaderboard" className="relative px-4 py-10 md:px-6 md:py-14">
      <div className="section-wrap relative flex flex-col gap-6">
        <div className="leaderboard-hero">
          <div className="leaderboard-hero__copy">
            <div className="hero-kicker-row">
              <div className="hero-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.26em]">
                <span className="live-dot" aria-hidden="true" />
                Live leaderboard
              </div>
              <div className="hero-inline-note">
                Live route. Read only client.
              </div>
            </div>

            <h1 className="display-serif mt-5 max-w-4xl text-6xl font-normal leading-[0.9] text-[var(--shib-cream)] md:text-7xl">
              Current leaderboard round.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--shib-muted-soft)]">
              Search, sort, refresh cadence, and rank order still run through
              the same protected route. Only the presentation layer changed.
            </p>
            <div className="leaderboard-hero__actions mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={retry}
                className="secondary-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[var(--shib-cream)]"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh board
              </button>
              <Link
                href="/challenges"
                className="primary-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[var(--shib-ink)]"
              >
                Open reward routes
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="leaderboard-hero__signals mt-7 flex flex-wrap gap-3">
              <div className="hero-support-card">
                <ShieldCheck className="h-4 w-4 text-[var(--shib-gold)]" />
                Read-only leaderboard API
              </div>
              <div className="hero-support-card">
                <Trophy className="h-4 w-4 text-[var(--shib-violet-soft)]" />
                Weighted XP determines order
              </div>
              <div className="hero-support-card">
                <Sparkles className="h-4 w-4 text-[var(--shib-gold)]" />
                Search, sort, and paging remain intact
              </div>
            </div>

            <div className="leaderboard-summary-card mt-8">
              <div className="leaderboard-summary-card__header">
                <span className="muted-label">Board state</span>
                <span className="leaderboard-summary-card__status">
                  <span className="live-dot" aria-hidden="true" />
                  {lastUpdated
                    ? `Updated ${formatLastUpdated(lastUpdated)}`
                    : "Connecting"}
                </span>
              </div>

              <div className="leaderboard-summary-card__leader">
                <div className="leaderboard-summary-card__label">Current leader</div>
                <div className="leaderboard-summary-card__title">
                  {topPlayer ? topPlayer.name : "Waiting for data"}
                </div>
                <div className="leaderboard-summary-card__value">
                  {topPlayer ? (
                    <CountUpValue value={topPlayer.score} mode="score" />
                  ) : (
                    "..."
                  )}
                </div>
                <div className="leaderboard-summary-card__subvalue">
                  {targetDate ? `Round target ${formatShortDate(targetDate)}` : "Live standings"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {countdownTarget ? (
          <CountdownStrip
            targetIso={countdownTarget}
            label="Leaderboard window closes"
          />
        ) : null}

        {isLoading ? (
          <>
            <div className="mx-auto w-full max-w-6xl">
              <PodiumSkeleton />
            </div>
            <div className="mx-auto w-full max-w-6xl">
              <TableSkeleton />
            </div>
          </>
        ) : error ? (
          <div className="mx-auto w-full max-w-4xl">
            <ErrorState message={error} onRetry={retry} />
          </div>
        ) : users.length === 0 ? (
          <div className="mx-auto w-full max-w-4xl">
            <EmptyState />
          </div>
        ) : (
          <>
            <div className="leaderboard-shell premium-outline mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] px-5 py-7 md:px-7 md:py-9">
              <div className="leaderboard-stage-head">
                <div className="muted-label">Top positions</div>
                <h2 className="display-serif mt-4 text-5xl font-normal leading-[0.92] text-[var(--shib-cream)] md:text-6xl">
                  Front-runners on the board.
                </h2>
                <div className="leaderboard-stage-metrics mt-6">
                  <div className="leaderboard-stat-card">
                    <span className="leaderboard-stat-card__label">Entries</span>
                    <span className="leaderboard-stat-card__value">
                      {isLoading ? "..." : <CountUpValue value={total} mode="whole" />}
                    </span>
                  </div>
                  <div className="leaderboard-stat-card">
                    <span className="leaderboard-stat-card__label">Top weighted XP</span>
                    <span className="leaderboard-stat-card__value">
                      {isLoading ? "..." : <CountUpValue value={highestScore} mode="score" />}
                    </span>
                  </div>
                  <div className="leaderboard-stat-card">
                    <span className="leaderboard-stat-card__label">Average XP</span>
                    <span className="leaderboard-stat-card__value">
                      {isLoading ? "..." : <CountUpValue value={averageScore} mode="score" />}
                    </span>
                  </div>
                  <div className="leaderboard-stat-card">
                    <span className="leaderboard-stat-card__label">Visible wager volume</span>
                    <span className="leaderboard-stat-card__value">
                      {isLoading ? "..." : <CountUpValue value={totalWager} mode="score" />}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <TopThreePodium users={users} />
              </div>
            </div>

            <div className="leaderboard-shell premium-outline mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] px-4 py-5 md:px-5 md:py-6">
              <div className="section-head section-head--tight">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--shib-muted)]">
                    Ranked players
                  </div>
                  <h2 className="display-serif mt-3 text-5xl font-normal leading-[0.92] text-[var(--shib-cream)] md:text-[3.6rem]">
                    Full standings
                  </h2>
                </div>

                <div className="score-pill rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[var(--shib-gold)]">
                  {filteredUsers.length} visible
                </div>
              </div>

              <LeaderboardFilters
                search={search}
                onSearchChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={(field, direction) => {
                  setSortField(field);
                  setSortDirection(direction);
                  setPage(1);
                }}
                resultCount={paginatedUsers.length}
                totalCount={filteredUsers.length}
              />

              <div className="mt-5">
                {hasSearchResults ? (
                  <LeaderboardTable users={paginatedUsers} />
                ) : (
                  <EmptyState
                    title="No players matched that search"
                    description="Try another handle, username, or clear the filter to return to the full board."
                    action={
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="primary-button rounded-full px-5 py-3 text-sm font-semibold text-[var(--accent-ink)]"
                      >
                        Clear search
                      </button>
                    }
                  />
                )}
              </div>
            </div>

            {hasMore ? (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  className="primary-button rounded-full px-8 py-3 text-sm font-semibold text-[var(--accent-ink)]"
                >
                  Load more players ({filteredUsers.length - paginatedUsers.length} remaining)
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
