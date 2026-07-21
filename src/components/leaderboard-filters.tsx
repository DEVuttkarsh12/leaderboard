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
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f6b7a]" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="Search by name..."
          aria-label="Search by user name"
          className="w-full rounded-lg border border-[#e8e4f0] bg-white py-2.5 pl-10 pr-4 text-sm text-[#17151f] placeholder:text-[#6f6b7a] focus:border-[#7257d5] focus:outline-none focus:ring-1 focus:ring-[#7257d5]/20"
        />
        {localSearch && (
          <button
            onClick={() => {
              setLocalSearch("");
              onSearchChange("");
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6f6b7a] hover:text-[#17151f]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <button
        onClick={toggleSort}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors",
          "border-[#e8e4f0] bg-white text-[#6f6b7a] hover:border-[#d4cee6] hover:text-[#17151f]"
        )}
      >
        <ArrowUpDown className="h-4 w-4" />
        {sortField === "rank" ? "Rank" : "Score"}
        <span className="text-xs text-[#6f6b7a]">
          ({sortDirection === "asc" ? "↑" : "↓"})
        </span>
      </button>

      <div className="text-sm text-[#6f6b7a]">
        {resultCount}
        {resultCount !== totalCount && ` / ${totalCount}`} results
      </div>
    </div>
  );
}
