"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FeatureWorkspace from "./feature-workspace";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { formatLastUpdated, formatNumberCompact, formatShortDate } from "@/lib/formatters";
import { getSearchableNames } from "@/lib/normalize-leaderboard";
import {
  getInitials,
  maskPlayerHandle,
  maskPlayerName,
} from "@/lib/player-presentation";
import type { NormalizedLeaderboardUser } from "@/types/leaderboard";

type Player = NormalizedLeaderboardUser;

const NAV = [
  ["Home", "/", "⌂"],
  ["Board", "/leaderboard", "↗"],
  ["Missions", "/challenges", "◎"],
  ["Hunts", "/bonus-hunts", "◈"],
  ["Tourneys", "/tournaments", "♜"],
  ["Raffles", "/wager-raffles", "◆"],
  ["Vault", "/store", "◇"],
  ["Help", "/help", "?"],
  ["Support", "/support", "!"],
  ["Account", "/login", "●"],
] as const;

const launchpad = [
  ["Live Board", "Climb ranks", "/leaderboard", "01", "lime"],
  ["Missions", "Stack XP", "/challenges", "02", "violet"],
  ["Bonus Hunts", "Chase heat", "/bonus-hunts", "03", "coral"],
  ["Tournaments", "Enter bracket", "/tournaments", "04", "blue"],
  ["Raffles", "Fire tickets", "/wager-raffles", "05", "yellow"],
  ["Store", "Spend points", "/store", "06", "pink"],
  ["Support", "Fix fast", "/support", "07", "mint"],
  ["Account", "Save rewards", "/login", "08", "orange"],
] as const;

const pageData: Record<string, { title: string; eyebrow: string; copy: string; actions: [string, string][]; stats: [string, string][]; features: [string, string, string][] }> = {
  challenges: {
    title: "Challenges", eyebrow: "MISSION CONTROL", copy: "Pick missions. Stack XP. Claim.",
    actions: [["View leaderboard", "/leaderboard"], ["Open store", "/store"]],
    stats: [["Mode", "Missions"], ["Flow", "Daily + weekly"], ["Focus", "Rank climb"]],
    features: [["Daily Missions", "Quick hits.", "12 live"], ["Weekly Tracks", "Bigger runs.", "04 tracks"], ["Milestone Goals", "XP checkpoints.", "8 tiers"], ["Seasonal Campaigns", "Limited runs.", "S08"], ["Leaderboard Unlocks", "Top rank drops.", "Top 50"]],
  },
  "bonus-hunts": {
    title: "Bonus Hunts", eyebrow: "STREAM HEAT", copy: "Follow heat. Save clips. Vote.",
    actions: [["Open tournaments", "/tournaments"], ["Open help", "/help"]],
    stats: [["Mode", "Stream"], ["State", "Live heat"], ["Focus", "Big hits"]],
    features: [["Live Session Cards", "Live heat.", "Live"], ["Schedule Blocks", "Next hunts.", "6 today"], ["Highlight Recaps", "Big hits.", "38 clips"], ["Clip Surface", "Save and vote.", "Trending"]],
  },
  tournaments: {
    title: "Tournaments", eyebrow: "BRACKET MODE", copy: "Enter brackets. Chase pools.",
    actions: [["Open bonus hunts", "/bonus-hunts"], ["View leaderboard", "/leaderboard"]],
    stats: [["Mode", "Bracket"], ["State", "Upcoming"], ["Focus", "Prize run"]],
    features: [["Upcoming Brackets", "Open events.", "3 open"], ["Match Flow", "Round flow.", "Round 02"], ["Prize Breakdown", "Prize pool.", "40K pts"], ["Winners Surface", "Champions.", "Hall of fame"]],
  },
  "wager-raffles": {
    title: "Wager Raffles", eyebrow: "TICKET DROP", copy: "Convert wagers. Fire tickets.",
    actions: [["Back to challenges", "/challenges"], ["Open leaderboard", "/leaderboard"]],
    stats: [["Mode", "Tickets"], ["State", "Draw ready"], ["Focus", "Prize drops"]],
    features: [["Ticket Thresholds", "Wager to ticket.", "1/10K"], ["Prize Tiers", "Drop levels.", "5 tiers"], ["Claim Readiness", "Ready state.", "Instant"], ["Entry Summary", "Ticket count.", "24 entries"]],
  },
  store: {
    title: "Reward Store", eyebrow: "THE VAULT", copy: "Spend points. Grab drops.",
    actions: [["Open challenges", "/challenges"], ["Need support?", "/support"]],
    stats: [["Mode", "Catalog"], ["State", "Drops"], ["Focus", "Redeem"]],
    features: [["Boost Packs", "Power-ups.", "From 2K"], ["Reward Drops", "Limited drops.", "6 live"], ["Merch Entries", "Gear shots.", "Limited"], ["Voucher Rewards", "Voucher claims.", "12 types"]],
  },
  help: {
    title: "Help Center", eyebrow: "FIND YOUR ANSWER", copy: "Search. Fix. Move.",
    actions: [["Open support", "/support"], ["Read terms", "/terms"]],
    stats: [["Response", "Under 2 min"], ["Guides", "28 live"], ["Status", "All green"]],
    features: [["Leaderboard Basics", "Ranks and XP.", "Start here"], ["Challenge and Reward Pages", "Missions and claims.", "8 guides"], ["Support Escalation", "Fast lane.", "Fast lane"], ["Policy Links", "Rules.", "Read"]],
  },
  support: {
    title: "Support", eyebrow: "WE’VE GOT YOU", copy: "Create ticket. Track it.",
    actions: [["Open help center", "/help"], ["Open login", "/login"]],
    stats: [["Team", "Online"], ["Queue", "4 ahead"], ["Typical", "8 minutes"]],
    features: [["Account Access", "Login help.", "Priority"], ["Reward Questions", "Point checks.", "Rewards"], ["Claim Escalations", "Prize issues.", "Escalate"], ["Conversation Surface", "Ticket flow.", "New ticket"]],
  },
  login: {
    title: "Account Entry", eyebrow: "PLAYER ACCESS", copy: "Save handle. Keep rewards.",
    actions: [["Open support", "/support"], ["View leaderboard", "/leaderboard"]],
    stats: [["Session", "Protected"], ["Rewards", "Synced"], ["Status", "Ready"]],
    features: [["Entry Surface", "Sign in.", "Sign in"], ["Account Benefits", "Saved state.", "Synced"], ["Reward Access", "Your vault.", "Your vault"], ["Security Messaging", "Local session.", "Protected"]],
  },
};

function fmt(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function playerScore(player: Player) {
  return player.score;
}

function playerName(player: Player) {
  return maskPlayerName(player.name);
}

function playerHandle(player: Player) {
  return maskPlayerHandle(player.username ?? player.globalName ?? player.kickUsername);
}

function totalWager(players: Player[]) {
  return players.reduce((sum, player) => sum + (player.points ?? 0), 0);
}

export default function RankBoardApp({
  route = "",
  countdownTarget = null,
}: {
  route?: string;
  countdownTarget?: string | null;
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const path = route ? `/${route}` : "/";
  return (
    <div className="site-shell">
      <Header path={path} accountOpen={accountOpen} setAccountOpen={setAccountOpen} />
      {route === "" ? <Home /> : route === "leaderboard" ? <Leaderboard countdownTarget={countdownTarget} /> : route === "privacy" || route === "terms" ? <Legal type={route} /> : <FeaturePage route={route} data={pageData[route] ?? pageData.help} />}
      <FloatingDock path={path} />
      <Footer />
    </div>
  );
}

function Header({ path, accountOpen, setAccountOpen }: { path: string; accountOpen: boolean; setAccountOpen: (v: boolean) => void }) {
  return <header className="header">
    <Link className="brand" href="/" aria-label="RankBoard home"><span className="brand-mark">R</span><span>RANK<span>BOARD</span></span></Link>
    <nav className="nav" aria-label="Primary navigation">{NAV.map(([label, href, icon]) => <Link key={href} className={path === href ? "active" : ""} href={href}><i>{icon}</i>{label}</Link>)}</nav>
    <div className="header-actions"><span className="live-pill"><b /> LIVE</span><button className="icon-button" aria-label="Leaderboard notifications">♜<span>3</span></button><div className="account-wrap"><button className="avatar-button" onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen}>DV</button>{accountOpen && <div className="account-menu"><p>PLAYER MENU <span>LV.12</span></p>{[["Login", "/login"], ["Support", "/support"], ["Privacy", "/privacy"], ["Terms", "/terms"]].map(([n,h]) => <Link key={h} href={h}>{n}<span>↗</span></Link>)}</div>}</div></div>
  </header>;
}

function Home() {
  const { users, total, highestScore, isLoading } = useLeaderboard();
  const livePlayers = total || users.length;
  const topPlayer = users[0] ?? null;
  const wager = totalWager(users);

  return <main>
    <section className="product-hero page-width">
      <div className="hero-copy">
        <p className="kicker"><span>●</span> SEASON 08 · LIVE FLOOR</p>
        <h1>PLAY THE <em>BOARD.</em><br/>OWN THE <strong>NIGHT.</strong></h1>
        <p className="hero-desc">Climb XP. Hit drops. Own the board.</p>
        <div className="button-row"><Link className="button primary" href="/leaderboard">View leaderboard <span>↗</span></Link><Link className="button ghost" href="/store">Explore rewards <span>◇</span></Link></div>
        <div className="micro-proof"><span>{isLoading ? "BOARD SYNCING" : `${livePlayers} PLAYERS MOVING`}</span><span>ROUND 08 IS LIVE</span></div>
      </div>
      <div className="hero-floor">
        <div className="floor-top"><span>FRONT THREE</span><span className="pulse-text">● UPDATING</span></div>
        <Podium players={users.slice(0, 3)} compact />
        <div className="floor-ticker"><span>{topPlayer ? playerName(topPlayer).toUpperCase() : "BOARD"} <b>{topPlayer ? `${fmt(playerScore(topPlayer))} XP` : "SYNCING"}</b></span><span>{users[1] ? playerName(users[1]).toUpperCase() : "LIVE"} <b>{users[1] ? "CHASING" : "STANDBY"}</b></span></div>
      </div>
      <div className="sticker sticker-one">+XP</div><div className="sticker sticker-two">HOT!</div>
    </section>
    <section className="metric-strip"><div><span>VISIBLE WAGER</span><strong>{formatNumberCompact(wager)}</strong><small>live volume</small></div><div><span>PLAYERS LIVE</span><strong>{livePlayers}</strong><small>{users.length} visible now</small></div><div><span>TOP XP</span><strong>{formatNumberCompact(highestScore)}</strong><small>{topPlayer ? `${playerName(topPlayer)} leads` : "syncing"}</small></div><div className="round-block"><span>BOARD STATE</span><strong>{isLoading ? "SYNC" : "LIVE"}</strong><small>refreshing data</small></div></section>
    <section className="section page-width"><SectionHeading overline="CHOOSE YOUR RUN" title="THE FLOOR IS YOURS." link={["Open live board", "/leaderboard"]}/><div className="launch-grid">{launchpad.map(([title,desc,href,num,color]) => <Link className={`launch-card ${color}`} href={href} key={href}><span className="launch-num">{num}</span><span className="launch-icon">↗</span><div><h3>{title}</h3><p>{desc}</p></div></Link>)}</div></section>
    <section className="section page-width rewards-section"><SectionHeading overline="KEEP THE HEAT" title="REWARDS THAT MOVE." link={["Enter the vault", "/store"]}/><div className="reward-grid">{[["Daily Drop","A fresh reward every 24 hours.","CLAIM IN 04:18","✦"],["Streak Heat","Play days stack into bigger multipliers.","7 DAY STREAK","≈"],["Prize Vault","Top placements unlock rare drops.","3 UNLOCKED","◇"],["Lucky Spin","Turn mission tokens into a wild card.","2 SPINS READY","◎"]].map(([n,d,s,i])=><article className="reward-item" key={n}><span>{i}</span><div><small>{s}</small><h3>{n}</h3><p>{d}</p></div><button aria-label={`Open ${n}`}>↗</button></article>)}</div></section>
  </main>;
}

function SectionHeading({ overline, title, link }: { overline: string; title: string; link: [string,string] }) { return <div className="section-heading"><div><p>{overline}</p><h2>{title}</h2></div><Link href={link[1]}>{link[0]} <span>↗</span></Link></div> }

function Podium({ players, compact = false }: { players: Player[]; compact?: boolean }) {
  if (players.length === 0) {
    return <div className={`podium ${compact ? "compact" : ""}`}>{[2, 1, 3].map((rank, idx) => <article className={`podium-card rank-${rank}`} key={rank}><div className="rank-badge">#{rank}</div><div className="avatar"><span>RB</span></div><div className="podium-copy"><strong>Syncing</strong><small>Live board</small><b>0 <em>XP</em></b><span>0 wagered</span></div>{idx === 1 && <div className="crown">♛</div>}</article>)}</div>;
  }

  const order = players.length === 3 ? [players[1], players[0], players[2]] : players;
  return <div className={`podium ${compact ? "compact" : ""}`}>{order.map((p, idx) => <article className={`podium-card rank-${p.rank}`} key={p.id}><div className="rank-badge">#{p.rank}</div><div className="avatar"><span>{getInitials(p.name)}</span>{p.verified && <i>✓</i>}</div><div className="podium-copy"><strong>{playerName(p)}</strong><small>{playerHandle(p)}</small><b>{fmt(playerScore(p))} <em>XP</em></b><span>{fmt(p.points)} wagered</span></div>{idx === 1 && <div className="crown">♛</div>}</article>)}</div>;
}

function Leaderboard({ countdownTarget = null }: { countdownTarget?: string | null }) {
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
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"xp"|"rank">("xp");
  const [visible, setVisible] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Player | null>(null);
  const filtered = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    const results = trimmedQuery
      ? users.filter((player) =>
          getSearchableNames(player).some((name) =>
            name.toLowerCase().includes(trimmedQuery)
          )
        )
      : [...users];

    results.sort((a,b) => sort === "xp" ? playerScore(b)-playerScore(a) : a.rank-b.rank);
    return results;
  }, [users, query, sort]);
  const visiblePlayers = filtered.slice(0, visible);
  const topPlayer = users[0] ?? null;
  const leaderScore = filtered[0] ? playerScore(filtered[0]) : 0;
  const wager = totalWager(users);
  const targetDate = countdownTarget ? new Date(countdownTarget) : null;

  function refresh(){
    setRefreshing(true);
    retry();
    setTimeout(() => setRefreshing(false),650);
  }

  return <main>
    <section className="board-hero page-width">
      <div><p className="kicker"><span>●</span> LIVE BOARD · ROUND 08</p><h1>THE BOARD<br/><em>NEVER SLEEPS.</em></h1><p>Every move counts. Every point shifts the floor.</p></div>
      <div className="round-ticket"><span>RANKBOARD / SEASON 08</span><b>{error ? "CHECKING" : "ROUND LIVE"}</b><strong>{targetDate ? formatShortDate(targetDate).toUpperCase() : "LIVE NOW"}</strong><small>LAST UPDATE · {lastUpdated ? formatLastUpdated(lastUpdated).toUpperCase() : isLoading ? "SYNCING" : "PENDING"}</small></div>
    </section>
    <section className="metric-strip board-metrics"><div><span>VISIBLE PLAYERS</span><strong>{total || users.length}</strong><small>{users.length} loaded now</small></div><div><span>VISIBLE WAGER</span><strong>{formatNumberCompact(wager)}</strong><small>live volume</small></div><div><span>TOP XP</span><strong>{formatNumberCompact(highestScore)}</strong><small>{topPlayer ? `${playerName(topPlayer)} leads` : "syncing"}</small></div><div className="round-block"><span>BOARD STATE</span><strong>{error ? "ISSUE" : isLoading ? "SYNC" : "LIVE"}</strong><small>refreshing every 60s</small></div></section>
    <section className="section page-width"><SectionHeading overline="THE ONES TO CATCH" title="FRONT THREE." link={["Reward routes", "/challenges"]}/><Podium players={users.slice(0, 3)} /></section>
    <section className="section page-width board-section">
      <div className="standings">
        <div className="standings-title"><div><p>FULL STANDINGS</p><h2>CHASE THE CLIMB.</h2></div><Link className="route-link" href="/challenges">Reward routes <span>↗</span></Link></div>
        <div className="board-controls"><label className="search"><span>⌕</span><input value={query} onChange={e=>{setQuery(e.target.value);setVisible(10)}} placeholder="Find player or handle" aria-label="Search players"/></label><div className="segment"><button type="button" className={sort==="xp"?"active":""} onClick={()=>{setSort("xp");setVisible(10)}}>Top XP</button><button type="button" className={sort==="rank"?"active":""} onClick={()=>{setSort("rank");setVisible(10)}}>Rank order</button></div><button type="button" className={`refresh ${refreshing?"spin":""}`} onClick={refresh} aria-label="Refresh leaderboard">↻ <span>Refresh</span></button></div>
        <div className="table-head"><span>RANK / PLAYER</span><span>STATUS</span><span>WEIGHTED XP</span><span>WAGERED</span><span /></div>
        <div className="player-list" aria-live="polite">
          {error ? (
            <div className="empty-state"><span>!</span><h3>THE BOARD BLINKED.</h3><p>{error}</p><button type="button" onClick={refresh}>Try again</button></div>
          ) : isLoading && users.length === 0 ? (
            Array.from({ length: 8 }).map((_, index) => <div className="skeleton-row board-skeleton-row" key={index}><i/><span><i/><i/></span></div>)
          ) : visiblePlayers.length ? (
            visiblePlayers.map(p=><PlayerRow key={p.id} player={p} leader={leaderScore} onOpen={()=>setSelected(p)}/>)
          ) : (
            <div className="empty-state"><span>⌕</span><h3>NO PLAYER ON THIS RUN.</h3><p>Try another masked name or handle.</p><button type="button" onClick={()=>setQuery("")}>Clear search</button></div>
          )}
        </div>
        {filtered.length > visible && !error && <button type="button" className="load-more" onClick={()=>setVisible(v=>v+8)}>Load more players <span>{Math.min(visible,filtered.length)} / {filtered.length}</span></button>}
      </div>
      <aside className="board-sidebar"><article className="side-card metrics-card"><p>BOARD METRICS <span>{error ? "CHECK" : "LIVE"}</span></p><div><small>VISIBLE PLAYERS</small><strong>{total || users.length}</strong></div><div><small>TOP PLAYER</small><strong>{topPlayer ? playerName(topPlayer) : "Syncing"}</strong><em>{topPlayer ? fmt(playerScore(topPlayer)) : "0"} XP</em></div><div><small>VISIBLE WAGER</small><strong>{formatNumberCompact(wager)}</strong></div><div><small>AVERAGE XP</small><strong>{formatNumberCompact(averageScore)}</strong></div><Link href="/support">Need board help? <span>↗</span></Link></article><article className="side-card pulse-card"><p>BOARD PULSE <span>●</span></p>{users.slice(3,7).map((p,i)=><div key={p.id}><b>+{[3,1,5,2][i]}</b><span><strong>{playerName(p)}</strong><small>{i%2?"holding pace":"moved up the board"}</small></span><em>{p.lastActive ?? "live"}</em></div>)}</article></aside>
    </section>
    <section className="section page-width state-lab"><SectionHeading overline="SYSTEM FEEDBACK" title="EVERY STATE, COVERED." link={["Get support", "/support"]}/><div className="state-grid"><article><p>LOADING</p><div className="skeleton-row"><i/><span><i/><i/></span></div><div className="skeleton-row"><i/><span><i/><i/></span></div></article><article className="mini-empty"><p>EMPTY SEARCH</p><span>⌕</span><strong>No players found</strong><small>Switch up the search.</small></article><article className="mini-error"><p>CONNECTION ERROR</p><span>!</span><strong>The board blinked.</strong><small>Last good data is still visible.</small><button onClick={refresh}>Try again</button></article></div></section>
    {selected && <div className="modal-backdrop" onClick={()=>setSelected(null)}><article className="player-modal" onClick={e=>e.stopPropagation()}><button type="button" onClick={()=>setSelected(null)} aria-label="Close">×</button><p>PLAYER SNAPSHOT · #{selected.rank}</p><div className="modal-identity"><div className="avatar"><span>{getInitials(selected.name)}</span></div><div><h2>{playerName(selected)}</h2><span>{playerHandle(selected)} · {selected.verified?"VERIFIED":"CHALLENGER"}</span></div></div><div className="modal-stats"><div><small>WEIGHTED XP</small><strong>{fmt(playerScore(selected))}</strong></div><div><small>WAGERED</small><strong>{fmt(selected.points)}</strong></div><div><small>LAST ACTIVE</small><strong>{selected.lastActive ?? "Live"}</strong></div></div><Link href="/challenges">View reward routes <span>↗</span></Link></article></div>}
  </main>;
}

function PlayerRow({ player, leader, onOpen }: { player: Player; leader: number; onOpen: () => void }) { const score = playerScore(player); return <button type="button" className={`player-row rank-row-${player.rank}`} onClick={onOpen}><div className="player-cell"><b className="row-rank">{String(player.rank).padStart(2,"0")}</b><div className="mini-avatar">{getInitials(player.name)}</div><span><strong>{playerName(player)}{player.verified&&<i>✓</i>}</strong><small>{playerHandle(player)}</small></span></div><div><span className={player.rank<7?"status hot":"status live"}>{player.rank<7?"HOT":"LIVE"}</span></div><div className="xp-cell"><strong>{fmt(score)} <small>XP</small></strong><span><i style={{width:`${leader > 0 ? (score/leader)*100 : 0}%`}}/></span></div><strong className="wager">{fmt(player.points)}</strong><span className="open-row">↗</span></button> }

function FeaturePage({ route, data }: { route: string; data: typeof pageData[string] }) {
  return <main><section className="subpage-hero page-width"><div><p className="kicker"><span>✦</span> {data.eyebrow}</p><h1>{data.title.toUpperCase()}<em>.</em></h1><p className="hero-hit">{data.copy}</p><div className="button-row">{data.actions.map(([n,h],i)=><Link key={h} className={`button ${i?"ghost":"primary"}`} href={h}>{n}<span>↗</span></Link>)}</div></div><div className="subpage-art"><span className="art-orbit">{data.title.slice(0,2).toUpperCase()}</span><strong>{data.stats[0][1]}</strong><small>RANKBOARD / SEASON 08</small><div className="art-stack">{data.features.slice(0,3).map(([n,,s])=><span key={n}><b>{s}</b>{n}</span>)}</div></div></section><section className="metric-strip sub-stats">{data.stats.map(([n,v],i)=><div key={n} className={i===2?"round-block":""}><span>{n}</span><strong>{v}</strong><small>{i===0?"ACTIVE":i===1?"NOW":"GOAL"}</small></div>)}</section><FeatureWorkspace route={route} /><section className="section page-width feature-flashes"><SectionHeading overline="FAST LANES" title="TAP. CLAIM. MOVE." link={[data.actions[0][0],data.actions[0][1]]}/><div className="feature-flash-grid">{data.features.map(([n,,s],i)=><Link href={data.actions[0][1]} key={n}><span>{String(i+1).padStart(2,"0")}</span><h3>{n}</h3><strong>{s}</strong><b>↗</b></Link>)}</div></section></main>;
}

function FloatingDock({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const [floatingState, setFloatingState] = useState({
    handle: "@guest",
    points: 18500,
    xp: 4200,
    streak: 3,
    inventory: 0,
    tickets: 12,
    entries: 0,
    readyMissions: 0,
  });

  useEffect(() => {
    function readFloatingState() {
      const account = window.localStorage.getItem("rankboard-account");
      const progress = window.localStorage.getItem("rankboard-mission-progress");
      const claimed = window.localStorage.getItem("rankboard-mission-claimed");
      const tickets = window.localStorage.getItem("rankboard-raffle-tickets");
      const entries = window.localStorage.getItem("rankboard-raffle-entries");

      try {
        const parsedAccount = account ? JSON.parse(account) as { handle?: string; points?: number; xp?: number; streak?: number; inventory?: string[] } : {};
        const parsedProgress = progress ? JSON.parse(progress) as Record<string, number> : {};
        const parsedClaimed = claimed ? JSON.parse(claimed) as string[] : [];
        const readyMissions = Object.entries(parsedProgress).filter(([id, value]) => value >= 100 && !parsedClaimed.includes(id)).length;

        setFloatingState({
          handle: parsedAccount.handle ?? "@guest",
          points: parsedAccount.points ?? 18500,
          xp: parsedAccount.xp ?? 4200,
          streak: parsedAccount.streak ?? 3,
          inventory: parsedAccount.inventory?.length ?? 0,
          tickets: tickets ? Number(JSON.parse(tickets)) : 12,
          entries: entries ? Number(JSON.parse(entries)) : 0,
          readyMissions,
        });
      } catch {
        setFloatingState((current) => ({ ...current, handle: "@guest" }));
      }
    }

    readFloatingState();
    window.addEventListener("storage", readFloatingState);
    window.addEventListener("rankboard-storage", readFloatingState);
    return () => {
      window.removeEventListener("storage", readFloatingState);
      window.removeEventListener("rankboard-storage", readFloatingState);
    };
  }, []);

  const quickLinks = [
    ["◎", "Missions", "/challenges"],
    ["◈", "Hunts", "/bonus-hunts"],
    ["◇", "Vault", "/store"],
    ["?", "Help", "/help"],
  ] as const;

  return (
    <div className="floating-layer" aria-label="Live RankBoard overlays">
      <aside className="floating-pulse-card floating-pulse-card--left">
        <p><span /> LIVE FLOOR</p>
        <strong>{floatingState.handle}</strong>
        <div>
          <small>POINTS</small>
          <b>{formatNumberCompact(floatingState.points)}</b>
        </div>
      </aside>

      <aside className="floating-pulse-card floating-pulse-card--right">
        <p><span /> VAULT WATCH</p>
        <div className="floating-stack">
          <span><b>{floatingState.readyMissions}</b> claims</span>
          <span><b>{floatingState.tickets}</b> tickets</span>
          <span><b>{floatingState.inventory}</b> vault</span>
        </div>
      </aside>

      <div className="floating-rail" aria-hidden="true">
        <span>XP {formatNumberCompact(floatingState.xp)}</span>
        <span>STREAK {floatingState.streak}</span>
        <span>DRAW {floatingState.entries}</span>
      </div>

      <div className="floating-casino-kit" aria-hidden="true">
        <div className="mini-roulette">
          <i />
          <span />
          <b />
        </div>
        <div className="chip-stack">
          <span />
          <span />
          <span />
        </div>
        <div className="card-fan">
          <i />
          <i />
          <i />
        </div>
      </div>

      <div className="floating-slot" aria-hidden="true">
        <span>7</span>
        <span>BAR</span>
        <span>★</span>
      </div>

      <aside className={`floating-hud ${open ? "open" : ""}`} aria-label="Quick actions">
        <button className="floating-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          <span>RB</span>
          <b>LIVE</b>
        </button>
        <div className="floating-panel">
          <div className="floating-panel__head">
            <span>{floatingState.handle}</span>
            <strong>QUICK FLOOR</strong>
          </div>
          <nav>
            {quickLinks.map(([icon, label, href]) => (
              <Link key={href} className={path === href ? "active" : ""} href={href}>
                <span>{icon}</span>
                {label}
              </Link>
            ))}
          </nav>
          <Link className="floating-primary" href="/leaderboard">Open live board <span>↗</span></Link>
        </div>
      </aside>
    </div>
  );
}

function Legal({ type }: { type: string }) { const privacy=type==="privacy"; return <main className="legal page-width"><p className="kicker"><span>◇</span> RANKBOARD LEGAL</p><h1>{privacy?"PRIVACY":"TERMS"}<em>.</em></h1><p className="legal-lead">{privacy?"How RankBoard handles player information, session data, and reward activity.":"The ground rules for using RankBoard, joining reward activity, and keeping play fair."}</p><div className="legal-layout"><aside><span>LAST UPDATED</span><strong>AUG 13, 2026</strong><Link href={privacy?"/terms":"/privacy"}>{privacy?"Read terms":"Read privacy"} ↗</Link></aside><article>{(privacy?[["1. Information we use","RankBoard may process account identifiers, leaderboard activity, reward progress, and basic device information needed to operate the product."],["2. Why we use it","We use this information to display ranks, maintain reward progress, protect the floor, and respond to support requests."],["3. Your choices","Players may request access, correction, or deletion of eligible account information through support."],["4. Data protection","Reasonable technical and organizational safeguards are used to protect information from unauthorized access."]]:[["1. Using RankBoard","Use the product lawfully, keep account access secure, and do not interfere with rankings, missions, or other players."],["2. Rankings and rewards","Rank calculations, challenge eligibility, and rewards may be reviewed when activity appears invalid, duplicated, or manipulated."],["3. Fair play","Automation, exploit attempts, false identities, and coordinated manipulation can lead to removal from a round."],["4. Availability","Live data can briefly lag or become unavailable. The latest verified state remains the basis for ranking decisions."]]).map(([h,p])=><section key={h}><h2>{h}</h2><p>{p}</p></section>)}</article></div></main> }

function Footer(){return <footer className="footer"><div className="footer-top page-width"><div><Link className="brand" href="/"><span className="brand-mark">R</span><span>RANK<span>BOARD</span></span></Link><p>PLAY THE BOARD.<br/>OWN THE NIGHT.</p></div><div className="footer-links">{[["Home","/"],["Leaderboard","/leaderboard"],["Challenges","/challenges"],["Store","/store"],["Bonus Hunts","/bonus-hunts"],["Tournaments","/tournaments"],["Wager Raffles","/wager-raffles"],["Support","/support"],["Help","/help"],["Privacy","/privacy"],["Terms","/terms"]].map(([n,h])=><Link key={h} href={h}>{n}<span>↗</span></Link>)}</div></div><div className="footer-bottom"><span>© 2026 RANKBOARD</span><span>THE BOARD IS LIVE <b>●</b></span><span>PLAY RESPONSIBLY · 18+</span></div></footer>}
