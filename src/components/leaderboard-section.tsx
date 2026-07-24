"use client";

import { useState, useMemo, useCallback } from "react";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import type { NormalizedLeaderboardUser } from "@/types/leaderboard";
import type { SortField, SortDirection } from "./leaderboard-filters";

import LeaderboardStats from "./leaderboard-stats";
import TopThreePodium from "./top-three-podium";
import LeaderboardFilters from "./leaderboard-filters";
import LeaderboardTable from "./leaderboard-table";
import EmptyState from "./empty-state";
import ErrorState from "./error-state";
import { StatsSkeleton, PodiumSkeleton, TableSkeleton } from "./loading-skeleton";

const PAGE_SIZE = 20;

export default function LeaderboardSection() {
  const { users, total, highestScore, averageScore, lastUpdated, isLoading, error, retry } =
    useLeaderboard();

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
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
    let result: NormalizedLeaderboardUser[];

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = users.filter((u) => u.name.toLowerCase().includes(query));
    } else {
      result = [...users];
    }

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
    <section id="leaderboard" className="bg-[#f8f7fc] pt-20 pb-16 md:pt-28 md:pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-[#17151f] md:text-4xl">
            Live Leaderboard
          </h2>
          <p className="mt-2 text-[#6f6b7a]">
            Top participants ranked by their total wager amount.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            <StatsSkeleton />
            <PodiumSkeleton />
            <TableSkeleton />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={retry} />
        ) : users.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">
            <LeaderboardStats
              total={total}
              highestScore={highestScore}
              averageScore={averageScore}
              lastUpdated={lastUpdated}
            />

            <div className="flex flex-wrap items-center gap-4">
              <LeaderboardFilters
                search={search}
                onSearchChange={handleSearchChange}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
                resultCount={paginatedUsers.length}
                totalCount={filteredUsers.length}
              />
            </div>

            <TopThreePodium users={users} />

            <LeaderboardTable users={paginatedUsers} />

            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-[#e8e4f0] bg-white px-8 py-3 text-sm font-medium text-[#7257d5] transition-all hover:border-[#d4cee6] hover:bg-[#f2effc]"
                >
                  Load More ({filteredUsers.length - paginatedUsers.length} remaining)
                </button>
              </div>
            )}

            {lastUpdated && (
              <div className="text-center text-xs text-[#6f6b7a]">
                Last updated:{" "}
                {new Intl.DateTimeFormat("en-US", {
                  hour: "numeric",
                  minute: "numeric",
                  second: "numeric",
                  hour12: true,
                }).format(lastUpdated)}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
