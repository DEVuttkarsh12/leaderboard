"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Search, X } from "lucide-react";
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

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleSearchInput = (value: string) => {
    setLocalSearch(value);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 180);
  };

  const sortOptions: Array<{
    label: string;
    field: SortField;
    direction: SortDirection;
    icon: typeof ArrowDownWideNarrow;
  }> = [
    {
      label: "Top XP",
      field: "score",
      direction: "desc",
      icon: ArrowDownWideNarrow,
    },
    {
      label: "Rank order",
      field: "rank",
      direction: "asc",
      icon: ArrowUpWideNarrow,
    },
  ];

  return (
    <div className="filters-shell">
      <div className="relative min-w-[220px] flex-1">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-dim)]" />
        <input
          type="text"
          value={localSearch}
          onChange={(event) => handleSearchInput(event.target.value)}
          placeholder="Search masked player or handle"
          aria-label="Search players"
          className="search-shell w-full rounded-[1.15rem] py-3.5 pl-11 pr-12 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none"
        />
        {localSearch ? (
          <button
            type="button"
            onClick={() => {
              setLocalSearch("");
              onSearchChange("");
            }}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="sort-pill-group">
          {sortOptions.map((option) => {
            const active =
              sortField === option.field && sortDirection === option.direction;
            const Icon = option.icon;

            return (
              <button
                key={option.label}
                type="button"
                onClick={() => onSortChange(option.field, option.direction)}
                className={cn("sort-pill", active && "sort-pill--active")}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="score-pill rounded-full px-4 py-3 text-sm text-[var(--accent)]">
          {resultCount}
          {resultCount !== totalCount ? ` / ${totalCount}` : ""} shown
        </div>
      </div>
    </div>
  );
}
