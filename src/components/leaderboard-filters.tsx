"use client";

import { useState, useCallback, useRef } from "react";
import { Search, ArrowUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortField = "rank" | "score";
export type SortDirection = "asc" | "desc";

type LeaderboardFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  resultCount: number;
  totalCount: number;
};

export default function LeaderboardFilters({
  search,
  onSearchChange,
  sortField,
  sortDirection,
  onSortChange,
  resultCount,
  totalCount,
}: LeaderboardFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback(
    (value: string) => {
      onSearchChange(value);
    },
    [onSearchChange]
  );

  const handleSearchInput = (value: string) => {
    setLocalSearch(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => debouncedSearch(value), 250);
  };

  const toggleSort = () => {
    if (sortField === "rank") {
      onSortChange("score", "desc");
    } else {
      onSortChange("rank", "asc");
    }
  };

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--shib-muted)]" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="Search by name..."
          aria-label="Search by user name"
          className="search-shell w-full rounded-[1.35rem] py-3.5 pl-11 pr-12 text-sm text-[var(--shib-cream)] placeholder:text-[var(--shib-muted)] focus:outline-none"
        />
        {localSearch && (
          <button
            onClick={() => {
              setLocalSearch("");
              onSearchChange("");
            }}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--shib-muted)] transition-colors hover:text-[var(--shib-cream)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={toggleSort}
          className={cn(
            "filter-button inline-flex items-center gap-2 rounded-[1.2rem] px-4 py-3 text-sm font-medium"
          )}
        >
          <ArrowUpDown className="h-4 w-4" />
          Sort: {sortField === "rank" ? "Rank" : "Score"}
          <span className="text-xs text-[var(--shib-muted)]">
            ({sortDirection === "asc" ? "↑" : "↓"})
          </span>
        </button>

        <div className="score-pill rounded-[1.2rem] px-4 py-3 text-sm text-[var(--shib-fur-bright)]">
          {resultCount}
          {resultCount !== totalCount && ` / ${totalCount}`} results
        </div>
      </div>
    </div>
  );
}
