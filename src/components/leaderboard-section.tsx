"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { formatLastUpdated, formatShortDate } from "@/lib/formatters";
import { getSearchableNames } from "@/lib/normalize-leaderboard";
import { getInitials, getToneByIndex } from "@/lib/player-presentation";
import EmptyState from "./empty-state";
import ErrorState from "./error-state";
import CountUpValue from "./count-up-value";

const PAGE_SIZE = 20;

type SortField = "rank" | "score";
type SortDirection = "asc" | "desc";

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

      return sortDirection === "desc" ? b.score - a.score : a.score - b.score;
    });

    return result;
  }, [users, search, sortField, sortDirection]);

  const paginatedUsers = filteredUsers.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < filteredUsers.length;
  const totalWager = useMemo(() => getTotalWager(users), [users]);
  const topPlayer = users[0] ?? null;
  const targetDate = countdownTarget ? new Date(countdownTarget) : null;
  const hasSearchResults = filteredUsers.length > 0;
  const podiumUsers = users.slice(0, 3);
  const orderedPodiumUsers =
    podiumUsers.length === 3 ? [podiumUsers[1], podiumUsers[0], podiumUsers[2]] : podiumUsers;
  const boardPulseUsers = filteredUsers.slice(0, 4);

  return (
    <section id="leaderboard" className="product-section board-product-section">
      <section className="product-intro">
        <div className="intro-index">
          01
          <span>/05</span>
        </div>
        <div>
          <span className="product-kicker">LIVE BOARD · REAL DATA</span>
          <h1>
            THE BOARD
            <em> NEVER SLEEPS.</em>
          </h1>
        </div>
        <div className="intro-aside">
          <div className="season-clock">
            <span>BOARD STATE</span>
            <strong>
              {lastUpdated ? formatLastUpdated(lastUpdated).toUpperCase() : "CONNECTING"}
            </strong>
            <i>
              <b
                style={{
                  width: `${Math.max(
                    18,
                    Math.min(100, (averageScore / Math.max(highestScore, 1)) * 100)
                  )}%`,
                }}
              />
            </i>
            <p>
              {targetDate
                ? `Round target ${formatShortDate(targetDate)}`
                : "Existing provider and ranking logic preserved."}
            </p>
          </div>
        </div>
      </section>

      {!isLoading && podiumUsers.length > 0 ? (
        <section className="product-podium" aria-label="Top three players">
          <div className="podium-atmosphere">
            <i />
            <i />
            <i />
          </div>
          {orderedPodiumUsers.map((user) => {
            if (!user) {
              return null;
            }

            const tone = getToneByIndex(user.rank - 1);

            return (
              <article className={`product-podium-card place-${user.rank}`} key={user.id}>
                <span className="podium-place">#{user.rank.toString().padStart(2, "0")}</span>
                {user.rank === 1 ? (
                  <span className="product-crown">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : null}
                <span className={`product-avatar ${user.rank === 1 ? "large" : "medium"} tone-${tone}`}>
                  {getInitials(user.name)}
                  <i />
                </span>
                <h2>{user.name}</h2>
                <p>{user.username ? `@${user.username}` : "Live competitor"}</p>
                <strong>
                  <CountUpValue value={user.score} mode="score" />
                </strong>
                <small>WEIGHTED XP</small>
                <div>
                  <span>WAGERED</span>
                  <b>
                    <CountUpValue value={user.points ?? 0} mode="score" />
                  </b>
                </div>
              </article>
            );
          })}
          <div className="podium-float float-rank">
            <span>{topPlayer ? `#${topPlayer.rank}` : "#01"}</span>
            <small>LIVE LEAD</small>
          </div>
          <div className="podium-float float-move">
            <span className={`product-avatar small tone-${getToneByIndex(3)}`}>
              {topPlayer ? getInitials(topPlayer.name) : "RB"}
              <i />
            </span>
            <span>
              <strong>{topPlayer ? topPlayer.name : "Connecting"}</strong>
              <small>{lastUpdated ? `Updated ${formatLastUpdated(lastUpdated)}` : "Syncing"}</small>
            </span>
          </div>
        </section>
      ) : null}

      <section className="product-section board-product-section">
        <div className="product-section-title">
          <div>
            <span className="product-kicker">COMPLETE STANDINGS</span>
            <h2>REAL RANKS. LIVE ORDER.</h2>
          </div>
          <button className="refresh-board" type="button" onClick={retry}>
            <RefreshCcw className="h-4 w-4" />
            <span>REFRESH</span>
          </button>
        </div>

        <div className="board-product-grid">
          <div className="full-board-panel">
            <div className="full-board-controls">
              <label className="product-search">
                <span>⌕</span>
                <input
                  aria-label="Search players"
                  placeholder="Search player, username, or handle"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
                {search ? (
                  <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
                    ×
                  </button>
                ) : null}
              </label>
              <div className="product-segments" aria-label="Leaderboard sort">
                <button
                  type="button"
                  className={sortField === "score" && sortDirection === "desc" ? "active" : ""}
                  onClick={() => {
                    setSortField("score");
                    setSortDirection("desc");
                    setPage(1);
                  }}
                >
                  TOP XP
                </button>
                <button
                  type="button"
                  className={sortField === "rank" && sortDirection === "asc" ? "active" : ""}
                  onClick={() => {
                    setSortField("rank");
                    setSortDirection("asc");
                    setPage(1);
                  }}
                >
                  RANK ORDER
                </button>
              </div>
              <Link className="refresh-board" href="/challenges">
                <span>REWARD ROUTES</span>
              </Link>
            </div>

            <div className="full-board-head">
              <span>RANK / PLAYER</span>
              <span>STATUS</span>
              <span>WEIGHTED XP</span>
              <span>WAGERED</span>
            </div>

            <div className="full-board-body" aria-live="polite">
              {error ? (
                <ErrorState message={error} onRetry={retry} />
              ) : isLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <div className="product-skeleton-row" key={index}>
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                ))
              ) : hasSearchResults ? (
                paginatedUsers.map((user, index) => {
                  const leaderScore = filteredUsers[0]?.score ?? user.score;
                  const progressPercent =
                    leaderScore > 0
                      ? Math.max(8, Math.min(100, Math.round((user.score / leaderScore) * 100)))
                      : 0;
                  const tone = getToneByIndex(index);

                  return (
                    <article className="full-board-row" key={user.id}>
                      <span className="full-rank">#{user.rank.toString().padStart(2, "0")}</span>
                      <span className={`product-avatar small tone-${tone}`}>
                        {getInitials(user.name)}
                        <i />
                      </span>
                      <span className="full-identity">
                        <strong>{user.name}</strong>
                        <small>
                          {user.username
                            ? `@${user.username}`
                            : user.globalName ?? user.kickUsername ?? "Live competitor"}
                        </small>
                      </span>
                      <span className={`product-movement ${user.rank <= 3 ? "up" : "same"}`}>
                        {user.rank <= 3 ? "HOT" : "LIVE"}
                      </span>
                      <span className="full-xp">
                        <strong>
                          <CountUpValue value={user.score} mode="score" />
                        </strong>
                        <i>
                          <b style={{ width: `${progressPercent}%` }} />
                        </i>
                      </span>
                      <span className="full-reward">
                        <CountUpValue value={user.points ?? 0} mode="score" />
                      </span>
                      <span className="row-open">↗</span>
                    </article>
                  );
                })
              ) : (
                <EmptyState
                  title="No players matched that search"
                  description="Try another username or clear the filter to return to the full live board."
                  action={
                    <button type="button" onClick={() => setSearch("")}>
                      CLEAR SEARCH
                    </button>
                  }
                />
              )}
            </div>
            {hasMore && !error && hasSearchResults ? (
              <button className="load-more" type="button" onClick={() => setPage((value) => value + 1)}>
                LOAD MORE PLAYERS
                <span>{filteredUsers.length - paginatedUsers.length} REMAIN</span>
              </button>
            ) : null}
          </div>

          <aside className="board-product-aside">
            <article className="you-position-card">
              <div>
                <span>BOARD METRICS</span>
                <b>LIVE</b>
              </div>
              <strong>
                <small>#</small>
                {total}
              </strong>
              <div className="you-player">
                <span className={`product-avatar medium tone-${getToneByIndex(0)}`}>
                  {topPlayer ? getInitials(topPlayer.name) : "RB"}
                  <i />
                </span>
                <p>
                  <b>{topPlayer ? topPlayer.name : "Waiting for data"}</b>
                  <span>{lastUpdated ? `Updated ${formatLastUpdated(lastUpdated)}` : "Connecting"}</span>
                </p>
                <span className="product-movement up">LIVE</span>
              </div>
              <div className="next-rank">
                <div>
                  <span>VISIBLE WAGER VOLUME</span>
                  <b>
                    <CountUpValue value={totalWager} mode="score" />
                  </b>
                </div>
                <i>
                  <b
                    style={{
                      width: `${Math.max(
                        14,
                        Math.min(100, (averageScore / Math.max(highestScore, 1)) * 100)
                      )}%`,
                    }}
                  />
                </i>
                <small>
                  {targetDate
                    ? `Round target ${formatShortDate(targetDate)}`
                    : "Existing backend and provider remain unchanged."}
                </small>
              </div>
              <Link href="/support">OPEN SUPPORT ↗</Link>
            </article>

            <article className="board-pulse-card">
              <div className="pulse-head">
                <span>
                  <i />
                  BOARD PULSE
                </span>
                <b>NOW</b>
              </div>
              {boardPulseUsers.map((user) => (
                <div className="pulse-item" key={user.id}>
                  <span>{getInitials(user.name)}</span>
                  <p>
                    <strong>{user.name}</strong>
                    <small>RANK #{user.rank}</small>
                  </p>
                  <b>
                    <CountUpValue value={user.score} mode="score" />
                  </b>
                </div>
              ))}
            </article>
          </aside>
        </div>
      </section>
    </section>
  );
}
