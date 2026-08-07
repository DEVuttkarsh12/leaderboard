"use client";

import { useMemo, useState } from "react";
import { MovementBadge, PageIntro, PlayerAvatar, ProductShell, SectionTitle } from "../components/ProductShell";
import { Player, players } from "../product-data";

const podiumOrder = [players[1], players[0], players[2]];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState("Weekly");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [signalError, setSignalError] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const filtered = useMemo(() => players.filter((player) => `${player.name} ${player.handle} ${player.rank}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const visible = filtered.slice(0, visibleCount);

  const changePeriod = (value: string) => {
    if (value === period) return;
    setPeriod(value);
    setLoading(true);
    window.setTimeout(() => setLoading(false), 560);
  };

  const refresh = () => {
    setSignalError(false);
    setLoading(true);
    window.setTimeout(() => setLoading(false), 650);
  };

  return (
    <ProductShell active="leaderboard">
      <PageIntro
        index="01"
        eyebrow="SEASON 08 · LIVE BOARD"
        title="THE BOARD"
        accent="NEVER SLEEPS."
        description="Every minute watched reshapes the line. Find your place and take the next one."
        aside={<div className="season-clock"><span>SEASON CLOSES</span><strong>04D : 17H : 32M</strong><i><b style={{ width: "73%" }} /></i></div>}
      />

      <section className="product-podium" aria-label="Top three players">
        <div className="podium-atmosphere"><i /><i /><i /></div>
        {podiumOrder.map((player) => (
          <button className={`product-podium-card place-${player.rank}`} key={player.rank} type="button" onClick={() => setSelectedPlayer(player)}>
            <span className="podium-place">#{player.rank.toString().padStart(2, "0")}</span>
            {player.rank === 1 && <span className="product-crown"><i /><i /><i /></span>}
            <PlayerAvatar player={player} size={player.rank === 1 ? "large" : "medium"} />
            <h2>{player.name}</h2><p>{player.handle}</p>
            <strong>{player.xp.toLocaleString()}</strong><small>SEASON XP</small>
            <div><span>LOCKED PRIZE</span><b>{player.reward}</b></div>
          </button>
        ))}
        <div className="podium-float float-rank"><span>+2,400</span><small>WATCH XP</small></div>
        <div className="podium-float float-move"><PlayerAvatar player={players[6]} size="small" /><span><strong>Kai is moving</strong><small>↑ 4 places</small></span></div>
      </section>

      <section className="product-section board-product-section">
        <SectionTitle eyebrow="COMPLETE STANDINGS" title="3,284 PLAYERS. ONE LINE." action={<button className={`signal-button${signalError ? " error" : ""}`} type="button" onClick={() => setSignalError(true)}><i /> {signalError ? "SIGNAL LOST" : "LIVE SYNC"}</button>} />

        <div className="board-product-grid">
          <div className="full-board-panel">
            <div className="full-board-controls">
              <label className="product-search"><span>⌕</span><input aria-label="Search players" placeholder="Search player, handle or rank" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button onClick={() => setQuery("")} type="button" aria-label="Clear search">×</button>}</label>
              <div className="product-segments" aria-label="Leaderboard period">
                {["Weekly", "Bi-weekly", "Monthly"].map((value) => <button key={value} type="button" aria-pressed={period === value} className={period === value ? "active" : ""} onClick={() => changePeriod(value)}>{value}</button>)}
              </div>
              <button className="refresh-board" type="button" onClick={refresh}>↻ <span>REFRESH</span></button>
            </div>

            <div className="full-board-head"><span>RANK / PLAYER</span><span>MOVEMENT</span><span>{period.toUpperCase()} XP</span><span>REWARD</span></div>

            <div className="full-board-body" aria-live="polite">
              {signalError ? (
                <div className="product-error-state"><div className="broken-signal"><i /><i /></div><strong>LEADERBOARD UNAVAILABLE</strong><p>The live signal paused. Your XP and position are safe.</p><button type="button" onClick={refresh}>RECONNECT BOARD</button></div>
              ) : loading ? (
                Array.from({ length: 8 }).map((_, index) => <div className="product-skeleton-row" key={index}><i /><i /><i /><i /></div>)
              ) : visible.length ? visible.map((player) => (
                <button className={`full-board-row${player.rank === 14 ? " is-you" : ""}`} key={player.rank} type="button" onClick={() => setSelectedPlayer(player)}>
                  <span className="full-rank">#{player.rank.toString().padStart(2, "0")}</span>
                  <PlayerAvatar player={player} size="small" />
                  <span className="full-identity"><strong>{player.name}{player.rank === 14 && <b>YOU</b>}</strong><small>{player.handle} · {player.streak} day streak</small></span>
                  <MovementBadge movement={player.movement} places={player.places} />
                  <span className="full-xp"><strong>{player.xp.toLocaleString()}</strong><i><b style={{ width: `${Math.round(player.xp / players[0].xp * 100)}%` }} /></i></span>
                  <span className="full-reward">{player.reward}</span><span className="row-open">↗</span>
                </button>
              )) : (
                <div className="product-empty-state"><div className="empty-stack"><i /><i /><i /></div><strong>NO PLAYER FOUND</strong><p>Try another username, handle or rank.</p><button type="button" onClick={() => setQuery("")}>CLEAR SEARCH</button></div>
              )}
            </div>
            {!signalError && !loading && visibleCount < filtered.length && <button className="load-more" type="button" onClick={() => setVisibleCount((value) => value + 8)}>LOAD MORE PLAYERS <span>{filtered.length - visibleCount} REMAIN</span></button>}
          </div>

          <aside className="board-product-aside">
            <article className="you-position-card">
              <div><span>THIS IS YOU</span><b>LIVE</b></div><strong><small>#</small>14</strong>
              <div className="you-player"><PlayerAvatar player={players[13]} /><p><b>PlayerOne</b><span>@playerone</span></p><MovementBadge movement="up" places={2} /></div>
              <div className="next-rank"><div><span>PROGRESS TO #13</span><b>4,180 XP</b></div><i><b style={{ width: "68%" }} /></i><small>38,210 / 42,390 XP</small></div>
              <a href="/profile">OPEN MY PROFILE <span>↗</span></a>
            </article>

            <article className="board-pulse-card"><div className="pulse-head"><span><i /> BOARD PULSE</span><b>NOW</b></div>{[
              ["K", "Kai climbed 4 places", "JUST NOW", "↑4"], ["L", "Luna entered the board", "1M AGO", "NEW"], ["N", "Nova crossed 84K XP", "3M AGO", "+800"], ["Z", "Zia passed Dax", "8M AGO", "↑1"],
            ].map((item) => <div className="pulse-item" key={item[1]}><span>{item[0]}</span><p><strong>{item[1]}</strong><small>{item[2]}</small></p><b>{item[3]}</b></div>)}</article>
          </aside>
        </div>
      </section>

      {selectedPlayer && (
        <div className="product-modal-layer" role="dialog" aria-modal="true" aria-label={`${selectedPlayer.name} profile preview`}>
          <button className="modal-scrim" type="button" aria-label="Close player preview" onClick={() => setSelectedPlayer(null)} />
          <article className="player-preview-modal">
            <button className="modal-close" type="button" onClick={() => setSelectedPlayer(null)}>×</button>
            <div className={`player-preview-art tone-${selectedPlayer.tone}`}><span>{selectedPlayer.initials}</span><b>#{selectedPlayer.rank.toString().padStart(2, "0")}</b></div>
            <div className="player-preview-content"><span className="product-kicker">PLAYER SNAPSHOT</span><h2>{selectedPlayer.name}</h2><p>{selectedPlayer.handle}</p><div><span><small>SEASON XP</small><strong>{selectedPlayer.xp.toLocaleString()}</strong></span><span><small>WATCH STREAK</small><strong>{selectedPlayer.streak} DAYS</strong></span><span><small>MOVEMENT</small><strong>{selectedPlayer.movement === "up" ? `↑ ${selectedPlayer.places}` : selectedPlayer.movement.toUpperCase()}</strong></span></div><a href={`/profile?player=${selectedPlayer.rank}`}>VIEW FULL PROFILE <span>↗</span></a></div>
          </article>
        </div>
      )}
    </ProductShell>
  );
}
