"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FeatureWorkspace from "./feature-workspace";
import type { AuthAccountPayload } from "@/lib/auth/account";
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
  ["Bets", "/custom-bets", "$"],
  ["Watch", "/watch-points", "●"],
  ["Hunts", "/bonus-hunts", "◈"],
  ["Profile", "/profile", "◇"],
  ["Store", "/store", "◇"],
  ["Admin", "/admin", "♜"],
  ["Account", "/login", "●"],
] as const;

const launchpad = [
  ["Live Board", "Climb ranks", "/leaderboard", "01", "lime"],
  ["Custom Bets", "Pick sides", "/custom-bets", "02", "orange"],
  ["Watch Points", "Earn live", "/watch-points", "03", "violet"],
  ["Profile", "Link accounts", "/profile", "04", "blue"],
  ["Missions", "Stack XP", "/challenges", "05", "mint"],
  ["Store", "Spend points", "/store", "06", "pink"],
  ["Admin", "Run ops", "/admin", "07", "yellow"],
  ["Support", "Fix fast", "/support", "08", "coral"],
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
    title: "Reward Store", eyebrow: "REWARD STORE", copy: "Spend points. Grab drops.",
    actions: [["Open challenges", "/challenges"], ["Need support?", "/support"]],
    stats: [["Mode", "Catalog"], ["State", "Drops"], ["Focus", "Redeem"]],
    features: [["Boost Packs", "Power-ups.", "From 2K"], ["Reward Drops", "Limited drops.", "6 live"], ["Merch Entries", "Gear shots.", "Limited"], ["Voucher Rewards", "Voucher claims.", "12 types"]],
  },
  "custom-bets": {
    title: "Custom Bets", eyebrow: "PREDICTION FLOOR", copy: "Pick side. Bet points. Sweat.",
    actions: [["Open store", "/store"], ["View profile", "/profile"]],
    stats: [["Mode", "Markets"], ["State", "Live odds"], ["Focus", "Point wins"]],
    features: [["Custom Odds", "Streamer odds.", "2.00x"], ["Current Bets", "Open slips.", "Live"], ["Past Bets", "Settled slips.", "History"], ["Admin Settlement", "Pick winner.", "Auto pay"], ["Winnings", "Points paid.", "Instant"]],
  },
  "watch-points": {
    title: "Watch Points", eyebrow: "KICK BOT", copy: "Watch stream. Earn points.",
    actions: [["Open profile", "/profile"], ["Open store", "/store"]],
    stats: [["Mode", "Watch"], ["Rate", "Auto earn"], ["Focus", "Reward cash"]],
    features: [["Kick Link", "Connect once.", "OAuth"], ["Watch Timer", "Bot pulse.", "Live"], ["Daily Bonus", "Come back.", "+500"], ["Weekly Bonus", "Hold streak.", "7 days"], ["Spend Points", "Use store.", "Store"]],
  },
  profile: {
    title: "Profile", eyebrow: "PLAYER HUB", copy: "Accounts. Casinos. Rewards.",
    actions: [["Open bets", "/custom-bets"], ["Open watch", "/watch-points"]],
    stats: [["Mode", "Account"], ["State", "Linked"], ["Focus", "Progress"]],
    features: [["Kick Account", "Stream link.", "Status"], ["Discord Account", "Community link.", "Status"], ["Casino Names", "Match wagers.", "3 sites"], ["Purchase History", "Track claims.", "Store"], ["Badges", "Flex wins.", "Earned"]],
  },
  admin: {
    title: "Admin", eyebrow: "CONTROL ROOM", copy: "Manage users. Settle bets.",
    actions: [["Open bets", "/custom-bets"], ["Open store", "/store"]],
    stats: [["Mode", "Ops"], ["State", "Control"], ["Focus", "No dev needed"]],
    features: [["User Management", "Points and bans.", "Live"], ["Leaderboard Ops", "Mode and status.", "Rounds"], ["Store Builder", "Items and stock.", "Catalog"], ["Bet Settlement", "Winner and payout.", "Auto pay"], ["Site Banners", "Promos.", "Live"]],
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
    features: [["Entry Surface", "Sign in.", "Sign in"], ["Account Benefits", "Saved state.", "Synced"], ["Reward Access", "Your store.", "Your store"], ["Security Messaging", "Local session.", "Protected"]],
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

type HeaderAccount = {
  handle: string;
  image: string;
  profileProvider: "kick" | "discord" | "email";
  points: number;
  xp: number;
  authenticated: boolean;
  connected: {
    kick: {
      connected: boolean;
      username: string;
    };
    discord: {
      connected: boolean;
      username: string;
    };
  };
};

const guestHeaderAccount: HeaderAccount = {
  handle: "@guest",
  image: "",
  profileProvider: "email",
  points: 18500,
  xp: 4200,
  authenticated: false,
  connected: {
    kick: {
      connected: false,
      username: "",
    },
    discord: {
      connected: false,
      username: "",
    },
  },
};

function normalizeHeaderAccount(value: Partial<HeaderAccount> | null | undefined): HeaderAccount {
  const isAuth =
    typeof value?.authenticated === "boolean"
      ? value.authenticated
      : Boolean(
          value?.connected?.kick?.connected ||
          value?.connected?.discord?.connected ||
          (value?.handle && value.handle !== "@guest")
        );

  return {
    ...guestHeaderAccount,
    ...value,
    authenticated: isAuth,
    connected: {
      kick: {
        ...guestHeaderAccount.connected.kick,
        ...value?.connected?.kick,
      },
      discord: {
        ...guestHeaderAccount.connected.discord,
        ...value?.connected?.discord,
      },
    },
  };
}

function headerAccountFromPayload(payload: AuthAccountPayload): HeaderAccount {
  return normalizeHeaderAccount({
    handle: payload.handle,
    image: payload.image,
    profileProvider: payload.profileProvider,
    points: payload.points,
    xp: payload.xp,
    authenticated: true,
    connected: {
      kick: {
        connected: payload.connected.kick.connected,
        username: payload.connected.kick.username,
      },
      discord: {
        connected: payload.connected.discord.connected,
        username: payload.connected.discord.username,
      },
    },
  });
}

function HeaderAvatar({
  account,
  className = "avatar-button",
}: {
  account: HeaderAccount;
  className?: string;
}) {
  const cleanHandle = account.handle.replace(/^@/, "") || "guest";
  const initials = getInitials(cleanHandle);

  return (
    <span className={className}>
      {account.image ? <img src={account.image} alt="" /> : initials}
    </span>
  );
}

function readStoredHeaderAccount(): HeaderAccount {
  const stored = window.localStorage.getItem("rankboard-account");
  if (!stored) return guestHeaderAccount;

  try {
    return normalizeHeaderAccount(JSON.parse(stored) as Partial<HeaderAccount>);
  } catch {
    window.localStorage.removeItem("rankboard-account");
    return guestHeaderAccount;
  }
}

function useHeaderAccount() {
  const [account, setAccount] = useState<HeaderAccount>(guestHeaderAccount);

  useEffect(() => {
    let active = true;

    function syncFromStorage() {
      setAccount(readStoredHeaderAccount());
    }

    async function syncFromSession() {
      syncFromStorage();

      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          account: AuthAccountPayload | null;
        };

        if (!active) return;

        if (payload.account) {
          const nextAccount = headerAccountFromPayload(payload.account);
          setAccount(nextAccount);
          window.localStorage.setItem(
            "rankboard-account",
            JSON.stringify({ ...payload.account, accessKey: "" })
          );
          window.dispatchEvent(new CustomEvent("rankboard-storage"));
        } else {
          setAccount(guestHeaderAccount);
          window.localStorage.removeItem("rankboard-account");
          window.dispatchEvent(new CustomEvent("rankboard-storage"));
        }
      } catch {
        if (active) {
          syncFromStorage();
        }
      }
    }

    syncFromSession();
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("rankboard-storage", syncFromStorage);

    return () => {
      active = false;
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("rankboard-storage", syncFromStorage);
    };
  }, []);

  return account;
}

export default function RankBoardApp({
  route = "",
  countdownTarget = null,
}: {
  route?: string;
  countdownTarget?: string | null;
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const account = useHeaderAccount();
  const path = route ? `/${route}` : "/";
  return (
    <div className="site-shell">
      <div className="sky-props" aria-hidden="true">
        <span className="sky-prop sky-die" />
        <span className="sky-prop sky-coin">$</span>
        <span className="sky-prop sky-chip" />
        <span className="sky-prop sky-card" />
        <span className="sky-prop sky-gem" />
        <span className="sky-prop sky-seven">7</span>
      </div>
      <Header path={path} account={account} accountOpen={accountOpen} setAccountOpen={setAccountOpen} />
      {route === "" ? <Home /> : route === "leaderboard" ? <Leaderboard countdownTarget={countdownTarget} /> : route === "privacy" || route === "terms" ? <Legal type={route} /> : route === "profile" ? <Profile account={account} /> : <FeaturePage route={route} data={pageData[route] ?? pageData.help} />}
      <FloatingDock path={path} account={account} />
      <Footer />
    </div>
  );
}

function Header({ path, account, accountOpen, setAccountOpen }: { path: string; account: HeaderAccount; accountOpen: boolean; setAccountOpen: (v: boolean) => void }) {
  const cleanHandle = account.handle.replace(/^@/, "") || "guest";
  const initials = getInitials(cleanHandle);
  const menuName = account.profileProvider === "kick" && account.connected.kick.username ? account.connected.kick.username : account.profileProvider === "discord" && account.connected.discord.username ? account.connected.discord.username : account.handle;
  const accountStatus = !account.authenticated ? "GUEST" : account.profileProvider === "kick" ? "KICK" : account.profileProvider === "discord" ? "DISCORD" : "SIGNED IN";
  const menuLinks = account.authenticated
    ? [["Profile", "/profile"], ["Custom Bets", "/custom-bets"], ["Admin", "/admin"], ["Support", "/support"], ["Privacy", "/privacy"], ["Terms", "/terms"]]
    : [["Profile", "/profile"], ["Login", "/login"], ["Custom Bets", "/custom-bets"], ["Admin", "/admin"], ["Support", "/support"], ["Privacy", "/privacy"], ["Terms", "/terms"]];

  async function signOut() {
    await fetch("/api/auth/session", {
      method: "DELETE",
    }).catch(() => null);
    window.localStorage.removeItem("rankboard-account");
    window.dispatchEvent(new CustomEvent("rankboard-storage"));
    setAccountOpen(false);
  }

  return <header className="header">
    <Link className="brand" href="/" aria-label="RankBoard home"><span className="brand-mark">R</span><span>RANK<span>BOARD</span></span></Link>
    <nav className="nav" aria-label="Primary navigation">{NAV.map(([label, href, icon]) => <Link key={href} className={path === href ? "active" : ""} href={href}><i>{icon}</i>{label}</Link>)}</nav>
    <div className="header-actions"><span className="live-pill"><b /> LIVE</span><button className="icon-button" aria-label="Leaderboard notifications">♜<span>3</span></button><div className="account-wrap"><button className="avatar-button" onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen} aria-label={`Open account menu for ${menuName}`}>{account.image ? <img src={account.image} alt="" /> : initials}</button>{accountOpen && <div className="account-menu"><div className="account-menu__identity"><HeaderAvatar account={account} /><div><strong>{menuName}</strong><small>{accountStatus} · {formatNumberCompact(account.points)} PTS</small></div></div><p>PLAYER MENU <span>{formatNumberCompact(account.xp)} XP</span></p>{menuLinks.map(([n,h]) => <Link key={h} href={h}>{n}<span>↗</span></Link>)}{account.authenticated ? <button className="account-menu__logout" type="button" onClick={signOut}>Logout<span>↻</span></button> : null}</div>}</div></div>
  </header>;
}

function Home() {
  const { users, total, highestScore, isLoading } = useLeaderboard();
  const livePlayers = total || users.length;
  const wager = totalWager(users);

  return <main>
    <section className="product-hero page-width">
      <div className="hero-copy">
        <p className="kicker"><span>●</span> SEASON 08</p>
        <h1>PLAY THE <em>BOARD.</em><br/>OWN THE <strong>NIGHT.</strong></h1>
        <div className="button-row"><Link className="button primary" href="/leaderboard">View leaderboard <span>↗</span></Link><Link className="button ghost" href="/store">Rewards <span>◇</span></Link></div>
      </div>
      <div className="hero-floor">
        <div className="floor-top"><span>FRONT THREE</span><span className="pulse-text">●</span></div>
        <Podium players={users.slice(0, 3)} compact />
      </div>
      <div className="sticker sticker-one">+XP</div><div className="sticker sticker-two">HOT!</div>
    </section>
    <section className="metric-strip"><div><span>WAGERED</span><strong>{formatNumberCompact(wager)}</strong></div><div><span>PLAYERS</span><strong>{livePlayers}</strong></div><div><span>TOP XP</span><strong>{formatNumberCompact(highestScore)}</strong></div><div className="round-block"><span>BOARD</span><strong>{isLoading ? "SYNC" : "LIVE"}</strong></div></section>
    <section className="section page-width"><SectionHeading title="THE FLOOR IS YOURS." link={["Open board", "/leaderboard"]}/><div className="launch-grid">{launchpad.map(([title,,href,num,color]) => <Link className={`launch-card ${color}`} href={href} key={href}><span className="launch-num">{num}</span><span className="launch-icon">↗</span><div><h3>{title}</h3></div></Link>)}</div></section>
    <section className="section page-width rewards-section"><SectionHeading title="THE VAULT." link={["Enter", "/store"]}/><div className="reward-grid">{[["Daily Drop","IN 04:18","✦"],["Streak Heat","7 DAYS","≈"],["Prize Store","3 UNLOCKED","◇"],["Lucky Spin","2 READY","◎"]].map(([n,s,i])=><article className="reward-item" key={n}><span>{i}</span><div><small>{s}</small><h3>{n}</h3></div><button aria-label={`Open ${n}`}>↗</button></article>)}</div></section>
  </main>;
}

function SectionHeading({ title, link }: { title: string; link: [string,string] }) { return <div className="section-heading"><div><h2>{title}</h2></div><Link href={link[1]}>{link[0]} <span>↗</span></Link></div> }

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
      <div><p className="kicker"><span>●</span> ROUND 08</p><h1>THE BOARD<br/><em>NEVER SLEEPS.</em></h1></div>
      <div className="round-ticket"><span>SEASON 08</span><b>{error ? "CHECKING" : "LIVE"}</b><strong>{targetDate ? formatShortDate(targetDate).toUpperCase() : "NOW"}</strong><small>{lastUpdated ? formatLastUpdated(lastUpdated).toUpperCase() : "SYNC"}</small></div>
    </section>
    <section className="metric-strip board-metrics"><div><span>PLAYERS</span><strong>{total || users.length}</strong></div><div><span>WAGERED</span><strong>{formatNumberCompact(wager)}</strong></div><div><span>TOP XP</span><strong>{formatNumberCompact(highestScore)}</strong></div><div className="round-block"><span>BOARD</span><strong>{error ? "ISSUE" : isLoading ? "SYNC" : "LIVE"}</strong></div></section>
    <section className="section page-width"><SectionHeading title="FRONT THREE." link={["Rewards", "/challenges"]}/><Podium players={users.slice(0, 3)} /></section>
    <section className="section page-width board-section">
      <div className="standings">
        <div className="standings-title"><div><h2>THE CLIMB.</h2></div><Link className="route-link" href="/challenges">Rewards <span>↗</span></Link></div>
        <div className="board-controls"><label className="search"><span>⌕</span><input value={query} onChange={e=>{setQuery(e.target.value);setVisible(10)}} placeholder="Find a player…" aria-label="Search players"/></label><div className="segment"><button type="button" className={sort==="xp"?"active":""} onClick={()=>{setSort("xp");setVisible(10)}}>Top XP</button><button type="button" className={sort==="rank"?"active":""} onClick={()=>{setSort("rank");setVisible(10)}}>Rank</button></div><button type="button" className={`refresh ${refreshing?"spin":""}`} onClick={refresh} aria-label="Refresh leaderboard">↻</button></div>
        <div className="table-head"><span>RANK / PLAYER</span><span>STATUS</span><span>WEIGHTED XP</span><span>WAGERED</span><span /></div>
        <div className="player-list" aria-live="polite">
          {error ? (
            <div className="empty-state"><span>!</span><h3>THE BOARD BLINKED.</h3><button type="button" onClick={refresh}>Try again</button></div>
          ) : isLoading && users.length === 0 ? (
            Array.from({ length: 8 }).map((_, index) => <div className="skeleton-row board-skeleton-row" key={index}><i/><span><i/><i/></span></div>)
          ) : visiblePlayers.length ? (
            visiblePlayers.map(p=><PlayerRow key={p.id} player={p} leader={leaderScore} onOpen={()=>setSelected(p)}/>)
          ) : (
            <div className="empty-state"><span>⌕</span><h3>NOBODY HERE.</h3><button type="button" onClick={()=>setQuery("")}>Clear search</button></div>
          )}
        </div>
        {filtered.length > visible && !error && <button type="button" className="load-more" onClick={()=>setVisible(v=>v+8)}>Load more <span>{Math.min(visible,filtered.length)} / {filtered.length}</span></button>}
      </div>
      <aside className="board-sidebar"><article className="side-card metrics-card"><p>METRICS <span>{error ? "CHECK" : "LIVE"}</span></p><div><small>PLAYERS</small><strong>{total || users.length}</strong></div><div><small>TOP PLAYER</small><strong>{topPlayer ? playerName(topPlayer) : "Syncing"}</strong><em>{topPlayer ? fmt(playerScore(topPlayer)) : "0"} XP</em></div><div><small>WAGERED</small><strong>{formatNumberCompact(wager)}</strong></div><div><small>AVG XP</small><strong>{formatNumberCompact(averageScore)}</strong></div><Link href="/support">Help <span>↗</span></Link></article><article className="side-card pulse-card"><p>PULSE <span>●</span></p>{users.slice(3,7).map((p,i)=><div key={p.id}><b>+{[3,1,5,2][i]}</b><span><strong>{playerName(p)}</strong><small>{i%2?"holding":"climbing"}</small></span><em>{p.lastActive ?? "live"}</em></div>)}</article></aside>
    </section>
    {selected && <div className="modal-backdrop" onClick={()=>setSelected(null)}><article className="player-modal" onClick={e=>e.stopPropagation()}><button type="button" onClick={()=>setSelected(null)} aria-label="Close">×</button><p>PLAYER SNAPSHOT · #{selected.rank}</p><div className="modal-identity"><div className="avatar"><span>{getInitials(selected.name)}</span></div><div><h2>{playerName(selected)}</h2><span>{playerHandle(selected)} · {selected.verified?"VERIFIED":"CHALLENGER"}</span></div></div><div className="modal-stats"><div><small>WEIGHTED XP</small><strong>{fmt(playerScore(selected))}</strong></div><div><small>WAGERED</small><strong>{fmt(selected.points)}</strong></div><div><small>LAST ACTIVE</small><strong>{selected.lastActive ?? "Live"}</strong></div></div><Link href="/challenges">View reward routes <span>↗</span></Link></article></div>}
  </main>;
}

function PlayerRow({ player, leader, onOpen }: { player: Player; leader: number; onOpen: () => void }) { const score = playerScore(player); return <button type="button" className={`player-row rank-row-${player.rank}`} onClick={onOpen}><div className="player-cell"><b className="row-rank">{String(player.rank).padStart(2,"0")}</b><div className="mini-avatar">{getInitials(player.name)}</div><span><strong>{playerName(player)}{player.verified&&<i>✓</i>}</strong><small>{playerHandle(player)}</small></span></div><div><span className={player.rank<7?"status hot":"status live"}>{player.rank<7?"HOT":"LIVE"}</span></div><div className="xp-cell"><strong>{fmt(score)} <small>XP</small></strong><span><i style={{width:`${leader > 0 ? (score/leader)*100 : 0}%`}}/></span></div><strong className="wager">{fmt(player.points)}</strong><span className="open-row">↗</span></button> }

function FeaturePage({ route, data }: { route: string; data: typeof pageData[string] }) {
  return <main><section className="subpage-hero page-width"><div><p className="kicker"><span>✦</span> SEASON 08</p><h1>{data.title.toUpperCase()}<em>.</em></h1><div className="button-row">{data.actions.map(([n,h],i)=><Link key={h} className={`button ${i?"ghost":"primary"}`} href={h}>{n}<span>↗</span></Link>)}</div></div><div className="subpage-art"><span className="art-orbit">{data.title.slice(0,2).toUpperCase()}</span><strong>{data.stats[0][1]}</strong><small>S08</small><div className="art-stack">{data.features.slice(0,3).map(([n,,s])=><span key={n}><b>{s}</b>{n}</span>)}</div></div></section><section className="metric-strip sub-stats">{data.stats.map(([n,v],i)=><div key={n} className={i===2?"round-block":""}><span>{n}</span><strong>{v}</strong></div>)}</section><FeatureWorkspace route={route} /><section className="section page-width feature-flashes"><SectionHeading title="FAST LANES." link={[data.actions[0][0],data.actions[0][1]]}/><div className="feature-flash-grid">{data.features.map(([n,,s],i)=><Link href={data.actions[0][1]} key={n}><span>{String(i+1).padStart(2,"0")}</span><h3>{n}</h3><strong>{s}</strong><b>↗</b></Link>)}</div></section></main>;
}

function FloatingDock({ path, account }: { path: string; account: HeaderAccount }) {
  const [open, setOpen] = useState(false);
  const [floatingState, setFloatingState] = useState({
    handle: account.handle,
    points: account.points,
    xp: account.xp,
    streak: 3,
    inventory: 0,
    tickets: 12,
    entries: 0,
    readyMissions: 0,
  });

  useEffect(() => {
    function readFloatingState() {
      const storedAccountStr = window.localStorage.getItem("rankboard-account");
      const progress = window.localStorage.getItem("rankboard-mission-progress");
      const claimed = window.localStorage.getItem("rankboard-mission-claimed");
      const tickets = window.localStorage.getItem("rankboard-raffle-tickets");
      const entries = window.localStorage.getItem("rankboard-raffle-entries");

      try {
        const parsedAccount = storedAccountStr ? JSON.parse(storedAccountStr) as { streak?: number; inventory?: string[] } : {};
        const parsedProgress = progress ? JSON.parse(progress) as Record<string, number> : {};
        const parsedClaimed = claimed ? JSON.parse(claimed) as string[] : [];
        const readyMissions = Object.entries(parsedProgress).filter(([id, value]) => value >= 100 && !parsedClaimed.includes(id)).length;

        setFloatingState({
          handle: account.handle,
          points: account.points,
          xp: account.xp,
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
  }, [account]);

  const quickLinks = [
    ["◎", "Missions", "/challenges"],
    ["$", "Bets", "/custom-bets"],
    ["●", "Watch", "/watch-points"],
    ["◇", "Store", "/store"],
    ["◇", "Profile", "/profile"],
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
        <p><span /> STORE WATCH</p>
        <div className="floating-stack">
          <span><b>{floatingState.readyMissions}</b> claims</span>
          <span><b>{floatingState.tickets}</b> tickets</span>
          <span><b>{floatingState.inventory}</b> store</span>
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


function Profile({ account }: { account: HeaderAccount }) {
  const [transactions, setTransactions] = useState<{ id: string; amount: number; reason: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [casinoNames, setCasinoNames] = useState({ thrill: "", packdraw: "", shuffle: "" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (!account.authenticated) return;
    setLoading(true);
    fetch("/api/points", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.transactions) setTransactions(d.transactions); })
      .finally(() => setLoading(false));
  }, [account.authenticated]);

  useEffect(() => {
    if (!account.authenticated) return;
    fetch("/api/auth/profile", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.casinos) setCasinoNames(d.casinos); })
      .catch(() => null);
  }, [account.authenticated]);

  async function saveCasinos() {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ casinos: casinoNames }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setSaveMsg("Saved! Points will sync on next leaderboard refresh.");
      window.dispatchEvent(new CustomEvent("rankboard-storage"));
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function reasonLabel(reason: string) {
    const map: Record<string, string> = {
      leaderboard_sync: "Leaderboard sync",
      store_purchase: "Store purchase",
      admin_grant: "Admin adjustment",
    };
    return map[reason] ?? reason;
  }

  if (!account.authenticated) {
    return (
      <main>
        <section className="subpage-hero page-width">
          <div>
            <p className="kicker"><span>◇</span> PLAYER HUB</p>
            <h1>PROFILE<em>.</em></h1>
            <div className="button-row">
              <Link className="button primary" href="/login">Sign in <span>↗</span></Link>
            </div>
          </div>
          <div className="subpage-art">
            <span className="art-orbit">PR</span>
            <strong>LOCKED</strong>
            <small>S08</small>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="subpage-hero page-width">
        <div>
          <p className="kicker"><span>◇</span> PLAYER HUB</p>
          <h1>PROFILE<em>.</em></h1>
        </div>
        <div className="subpage-art">
          <span className="art-orbit">{getInitials(account.handle)}</span>
          <strong>{fmt(account.points)} PTS</strong>
          <small>S08</small>
        </div>
      </section>

      <section className="metric-strip sub-stats">
        <div><span>POINTS</span><strong>{fmt(account.points)}</strong></div>
        <div><span>XP</span><strong>{formatNumberCompact(account.xp)}</strong></div>
        <div><span>HANDLE</span><strong>{account.handle}</strong></div>
        <div className="round-block"><span>VIA</span><strong>{account.profileProvider.toUpperCase()}</strong></div>
      </section>

      <section className="section page-width">
        <div className="section-heading">
          <div><h2>LINK CASINOS.</h2></div>
        </div>
        <div style={{ maxWidth: 640 }}>
          {(["thrill", "packdraw", "shuffle"] as const).map((provider) => (
            <div key={provider} style={{ marginBottom: "1rem" }}>
              <small style={{ display: "block", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.6, marginBottom: "0.4rem" }}>{provider} username</small>
              <input
                value={casinoNames[provider]}
                onChange={(e) => setCasinoNames((p) => ({ ...p, [provider]: e.target.value }))}
                placeholder={`Your ${provider} username`}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "0.75rem 1rem", color: "inherit", fontSize: "0.9rem", width: "100%", boxSizing: "border-box" }}
              />
            </div>
          ))}
          <button
            className="button primary"
            onClick={saveCasinos}
            disabled={saving}
            style={{ marginTop: "0.5rem" }}
          >
            {saving ? "Saving..." : "Save Casino Names"} <span>↗</span>
          </button>
          {saveMsg && <p style={{ marginTop: "0.75rem", opacity: 0.7, fontSize: "0.85rem" }}>{saveMsg}</p>}
        </div>
      </section>

      <section className="section page-width">
        <div className="section-heading">
          <div><h2>HISTORY.</h2></div>
          <Link href="/store">Spend <span>↗</span></Link>
        </div>
        {loading ? (
          <div className="player-list">{Array.from({ length: 5 }).map((_, i) => <div className="skeleton-row board-skeleton-row" key={i}><i/><span><i/><i/></span></div>)}</div>
        ) : transactions.length === 0 ? (
          <div className="empty-state"><span>◎</span><h3>NOTHING YET.</h3><Link href="/store" className="button ghost">Store <span>↗</span></Link></div>
        ) : (
          <div className="player-list">
            {transactions.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <b style={{ color: t.amount > 0 ? "#22c55e" : "#f87171", minWidth: 90, fontVariantNumeric: "tabular-nums" }}>{t.amount > 0 ? "+" : ""}{fmt(t.amount)} PTS</b>
                <span style={{ flex: 1 }}>{reasonLabel(t.reason)}</span>
                <small style={{ opacity: 0.5 }}>{new Date(t.createdAt).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section page-width">
        <div className="section-heading">
          <div><h2>LINKS.</h2></div>
        </div>
        <div className="feature-flash-grid">
          <div>
            <span>●</span>
            <h3>Kick</h3>
            <strong>{account.connected.kick.connected ? account.connected.kick.username : "Not linked"}</strong>
            <b>{account.connected.kick.connected ? "✓" : "–"}</b>
          </div>
          <div>
            <span>◎</span>
            <h3>Discord</h3>
            <strong>{account.connected.discord.connected ? account.connected.discord.username : "Not linked"}</strong>
            <b>{account.connected.discord.connected ? "✓" : "–"}</b>
          </div>
        </div>
      </section>
    </main>
  );
}

function Footer(){return <footer className="footer"><div className="footer-top page-width"><div><Link className="brand" href="/"><span className="brand-mark">R</span><span>RANK<span>BOARD</span></span></Link><p>PLAY THE BOARD.<br/>OWN THE NIGHT.</p></div><div className="footer-links">{[["Live Board","/leaderboard"],["Custom Bets","/custom-bets"],["Store","/store"],["Watch Points","/watch-points"],["Profile","/profile"],["Support","/support"],["Privacy","/privacy"],["Terms","/terms"]].map(([n,h])=><Link key={h} href={h}>{n}<span>↗</span></Link>)}</div></div><div className="footer-bottom"><span>© 2026 RANKBOARD</span><span>THE BOARD IS LIVE <b>●</b></span><span>PLAY RESPONSIBLY · 18+</span></div></footer>}
