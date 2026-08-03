"use client";

import { useState, useMemo, useCallback } from "react";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { formatLastUpdated, formatNumberCompact } from "@/lib/formatters";
import type { SortField, SortDirection } from "./leaderboard-filters";
import TopThreePodium from "./top-three-podium";
import LeaderboardFilters from "./leaderboard-filters";
import LeaderboardTable from "./leaderboard-table";
import EmptyState from "./empty-state";
import ErrorState from "./error-state";
import { PodiumSkeleton, TableSkeleton } from "./loading-skeleton";

const PAGE_SIZE = 20;

export default function LeaderboardSection() {
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

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSortChange = useCallback(
    (field: SortField, direction: SortDirection) => {
      setSortField(field);
      setSortDirection(direction);
    },
    []
  );

  const filteredUsers = useMemo(() => {
    const result = search.trim()
      ? users.filter((user) =>
          user.name.toLowerCase().includes(search.trim().toLowerCase())
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

  return (
    <section
      id="leaderboard"
      className="relative px-4 py-10 md:px-6 md:py-14"
    >
      <div className="section-wrap relative flex flex-col gap-6">
        <div className="absolute -left-12 top-20 hidden h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(47,143,131,0.18),transparent_68%)] blur-3xl lg:block" />
        <div className="absolute -right-10 top-64 hidden h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(255,199,106,0.16),transparent_70%)] blur-3xl lg:block" />

        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
          <div className="max-w-3xl">
            <div className="hero-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.26em]">
              <span className="live-dot" aria-hidden="true" />
              Live leaderboard
            </div>
            <h2 className="display-logo mt-5 text-[3.4rem] leading-none text-[var(--shib-cream)] drop-shadow-[0_6px_0_rgba(29,107,99,0.62)] md:text-[4.8rem]">
              RankBoard
            </h2>
            <div className="display-serif mt-3 text-[2.2rem] font-semibold tracking-[-0.06em] text-[var(--shib-heading)] md:text-[3rem]">
              Read-only live leaderboard
            </div>
            <h3 className="mt-4 text-5xl font-black tracking-[-0.06em] text-[var(--shib-fur)] md:text-6xl">
              $25,200
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--shib-muted-soft)]">
              Same ranking engine, same live feed, same search and sort behavior.
              Only the stage, motion, and board presentation have changed.
            </p>
          </div>

          <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
            <div className="leaderboard-stat-card">
              <span className="leaderboard-stat-card__label">Entries</span>
              <span className="leaderboard-stat-card__value">
                {isLoading ? "..." : total}
              </span>
            </div>
            <div className="leaderboard-stat-card">
              <span className="leaderboard-stat-card__label">Top score</span>
              <span className="leaderboard-stat-card__value">
                {isLoading ? "..." : formatNumberCompact(highestScore)}
              </span>
            </div>
            <div className="leaderboard-stat-card">
              <span className="leaderboard-stat-card__label">Last refresh</span>
              <span className="leaderboard-stat-card__value leaderboard-stat-card__value--small">
                {lastUpdated ? formatLastUpdated(lastUpdated) : "Waiting"}
              </span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <>
            <div className="mx-auto w-full max-w-5xl">
              <PodiumSkeleton />
            </div>
            <div className="mx-auto w-full max-w-3xl">
              <TableSkeleton />
            </div>
          </>
        ) : error ? (
          <div className="mx-auto w-full max-w-3xl">
            <ErrorState message={error} onRetry={retry} />
          </div>
        ) : users.length === 0 ? (
          <div className="mx-auto w-full max-w-3xl">
            <EmptyState />
          </div>
        ) : (
          <>
            <div className="leaderboard-shell premium-outline mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] px-5 py-5 md:px-7 md:py-7">
              <div className="flex flex-col gap-5 border-b border-[var(--border)] pb-6 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <div className="muted-label">Podium</div>
                  <h3 className="display-serif mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--shib-cream)] md:text-[3.4rem]">
                    Front-runner focus
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--shib-muted-soft)]">
                    The first three places get their own stage before the full board
                    settles into a tighter list view.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="tinted-panel rounded-[1.3rem] px-4 py-4">
                    <div className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--shib-muted)]">
                      Average score
                    </div>
                    <div className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--shib-cream)]">
                      {formatNumberCompact(averageScore)}
                    </div>
                  </div>
                  <div className="tinted-panel rounded-[1.3rem] px-4 py-4">
                    <div className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--shib-muted)]">
                      Board state
                    </div>
                    <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--shib-fur-bright)]">
                      <span className="live-dot" aria-hidden="true" />
                      Updated {lastUpdated ? formatLastUpdated(lastUpdated) : "recently"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <TopThreePodium users={users} />
              </div>
            </div>

            <div className="leaderboard-shell premium-outline mx-auto w-full max-w-3xl overflow-hidden rounded-[2rem] px-4 py-4 md:px-5 md:py-5">
              <div className="mb-5 flex flex-col gap-4 border-b border-[var(--border)] pb-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--shib-muted)]">
                    Ranked Players
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--shib-cream)] md:text-[2.4rem]">
                    Full standings
                  </h3>
                </div>

                <div className="score-pill rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[var(--shib-fur-bright)]">
                  {filteredUsers.length} Players visible
                </div>
              </div>

              <LeaderboardFilters
                search={search}
                onSearchChange={handleSearchChange}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
                resultCount={paginatedUsers.length}
                totalCount={filteredUsers.length}
              />

              <div className="mt-5">
                <LeaderboardTable users={paginatedUsers} />
              </div>
            </div>

            {hasMore && (
              <div className="flex justify-center pt-1">
                <button
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  className="primary-button rounded-full px-8 py-3 text-sm font-semibold text-[#2d1600]"
                >
                  Load More ({filteredUsers.length - paginatedUsers.length} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
