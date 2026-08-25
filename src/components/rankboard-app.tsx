"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Crown,
  LogOut,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { cloneElement, useCallback, useEffect, useMemo, useState } from "react";
import CustomCursor from "./custom-cursor";
import FeatureWorkspace from "./feature-workspace";
import Lightspeed from "./lightspeed";
import SiteEntryLoader from "./site-entry-loader";
import type { AuthAccountPayload, CasinoAccountDetail } from "@/lib/auth/account";
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
  ["Home", "/"],
  ["Board", "/leaderboard"],
  ["Missions", "/challenges"],
  ["Bets", "/custom-bets"],
  ["Watch", "/watch-points"],
  ["Hunts", "/bonus-hunts"],
  ["Store", "/store"],
  ["Admin", "/admin"],
] as const;

const launchpad = [
  ["Board", "/leaderboard", "01", "lime", "Live ladder"],
  ["Bets", "/custom-bets", "02", "mint", "Prediction slips"],
  ["Missions", "/challenges", "03", "violet", "Reward goals"],
  ["Watch", "/watch-points", "04", "blue", "Stream earnings"],
  ["Hunts", "/bonus-hunts", "05", "coral", "Bonus tracker"],
  ["Store", "/store", "06", "yellow", "Point rewards"],
] as const;

const pageData: Record<string, { title: string; tagline: string; action: [string, string] }> = {
  challenges: {
    title: "Missions",
    tagline: "Complete goals, earn points, claim rewards.",
    action: ["View board", "/leaderboard"],
  },
  "bonus-hunts": {
    title: "Bonus Hunts",
    tagline: "Follow live hunt sessions and vote on the best hits.",
    action: ["Open tournaments", "/tournaments"],
  },
  tournaments: {
    title: "Tournaments",
    tagline: "Enter brackets and chase prize pools.",
    action: ["View board", "/leaderboard"],
  },
  "wager-raffles": {
    title: "Wager Raffles",
    tagline: "Turn wagers into tickets for the prize draw.",
    action: ["View board", "/leaderboard"],
  },
  store: {
    title: "Reward Store",
    tagline: "Spend your points on real rewards.",
    action: ["Need help?", "/support"],
  },
  "custom-bets": {
    title: "Custom Bets",
    tagline: "Bet points on live prediction markets.",
    action: ["Open store", "/store"],
  },
  "watch-points": {
    title: "Watch Points",
    tagline: "Earn points while the stream is live.",
    action: ["Open store", "/store"],
  },
  admin: {
    title: "Admin",
    tagline: "Manage users, markets, and the store.",
    action: ["Open board", "/leaderboard"],
  },
  help: {
    title: "Help Center",
    tagline: "Quick answers to common questions.",
    action: ["Contact support", "/support"],
  },
  support: {
    title: "Support",
    tagline: "Open a ticket and track it here.",
    action: ["Read FAQ", "/help"],
  },
  login: {
    title: "Sign in",
    tagline: "Save your progress and keep your rewards.",
    action: ["View board", "/leaderboard"],
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
  email?: string;
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
  casinos: {
    thrill: string;
    packdraw: string;
    shuffle: string;
  };
  casinoAccounts: CasinoAccountDetail[];
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
  casinos: {
    thrill: "",
    packdraw: "",
    shuffle: "",
  },
  casinoAccounts: [],
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
    casinos: {
      thrill: value?.casinos?.thrill ?? "",
      packdraw: value?.casinos?.packdraw ?? "",
      shuffle: value?.casinos?.shuffle ?? "",
    },
    casinoAccounts: value?.casinoAccounts ?? [],
  };
}

function headerAccountFromPayload(payload: AuthAccountPayload): HeaderAccount {
  return normalizeHeaderAccount({
    handle: payload.handle,
    image: payload.image,
    email: payload.email,
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
    casinos: payload.casinos,
    casinoAccounts: payload.casinoAccounts,
  });
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
      <div className="site-tunnel-background" aria-hidden="true">
        <Lightspeed />
      </div>
      <CustomCursor />
      <SiteEntryLoader />
      <div className="top-chrome">
        <Header path={path} account={account} accountOpen={accountOpen} setAccountOpen={setAccountOpen} />
        <Ticker />
      </div>
      {route === "" ? <Home /> : route === "leaderboard" ? <Leaderboard countdownTarget={countdownTarget} /> : route === "privacy" || route === "terms" ? <Legal type={route} /> : route === "profile" ? <Profile account={account} /> : <FeaturePage route={route} data={pageData[route] ?? pageData.help} />}
      <Footer />
    </div>
  );
}

function Ticker() {
  const { users, error } = useLeaderboard();
  const group = error || users.length === 0
    ? [<span className="ticker-item" key="sync"><b>LIVE</b>Season 08 · board syncing<em>●</em></span>, <span className="ticker-item" key="s08"><b>S08</b>Missions · Bets · Raffles · Hunts<em>●</em></span>]
    : users.slice(0, 8).map((p) => (
        <span className="ticker-item" key={p.id}>
          <b>#{p.rank}</b>{playerName(p)}<em>+{fmt(playerScore(p))} XP</em>
        </span>
      ));

  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {[0, 1].map((half) => (
          <div className="ticker-half" key={half}>
            {[0, 1, 2].flatMap((rep) => group.map((item, i) => cloneElement(item, { key: `${half}-${rep}-${i}` })))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Header({ path, account, accountOpen, setAccountOpen }: { path: string; account: HeaderAccount; accountOpen: boolean; setAccountOpen: (v: boolean) => void }) {
  const cleanHandle = account.handle.replace(/^@/, "") || "guest";
  const initials = getInitials(cleanHandle);
  const menuName = account.profileProvider === "kick" && account.connected.kick.username ? account.connected.kick.username : account.profileProvider === "discord" && account.connected.discord.username ? account.connected.discord.username : account.handle;
  const accountStatus = !account.authenticated ? "Guest" : account.profileProvider === "kick" ? "Kick" : account.profileProvider === "discord" ? "Discord" : "Signed in";
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
    <nav className="nav" aria-label="Primary navigation">{NAV.map(([label, href]) => <Link key={href} className={path === href ? "active" : ""} href={href}>{label}</Link>)}</nav>
    <div className="header-actions"><span className="live-pill"><b /> LIVE</span><div className="account-wrap"><button className="avatar-button" onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen} aria-label={`Open account menu for ${menuName}`}>{account.image ? <img src={account.image} alt="" /> : initials}</button>{accountOpen && <div className="account-menu"><div className="account-menu__identity"><span className="avatar-button">{account.image ? <img src={account.image} alt="" /> : initials}</span><div><strong>{menuName}</strong><small>{accountStatus} · {formatNumberCompact(account.points)} PTS</small></div></div><p>PLAYER <span>{formatNumberCompact(account.xp)} XP</span></p>{menuLinks.map(([n,h]) => <Link key={h} href={h}>{n}<ArrowUpRight size={14} strokeWidth={2.5} aria-hidden="true" /></Link>)}{account.authenticated ? <button className="account-menu__logout" type="button" onClick={signOut}>Logout<LogOut size={14} strokeWidth={2.5} aria-hidden="true" /></button> : null}</div>}</div></div>
  </header>;
}

function Home() {
  const { users, total, highestScore, isLoading } = useLeaderboard();
  const livePlayers = total || users.length;
  const wager = totalWager(users);

  return <main>
    <section className="product-hero page-width">
      <div className="hero-props" aria-hidden="true">
        <span className="h-prop h-coin">$</span>
        <span className="h-prop h-chip" />
        <span className="h-prop h-die" />
        <span className="h-prop h-card"><i>A</i><b>♠</b></span>
        <span className="h-prop h-seven">7</span>
        <span className="h-prop h-card-stack">
          <i>K</i>
          <i>Q</i>
          <i>A</i>
        </span>
        <span className="h-prop h-cash-stack">
          <i />
          <i />
          <b>$</b>
        </span>
        <span className="h-prop h-chip-trail">
          <i />
          <i />
          <i />
        </span>
        <span className="h-prop h-left-card"><i>J</i><b>♦</b></span>
        <span className="h-prop h-left-cash">
          <i />
          <b>$</b>
        </span>
        <span className="sparkle sp-1">✦</span>
        <span className="sparkle sp-2">✦</span>
        <span className="sparkle sp-3">✦</span>
        <span className="sparkle sp-4">✦</span>
      </div>
      <div className="hero-copy">
        <p className="kicker"><span>●</span> Live rewards</p>
        <h1>Rank<br /><em>Rewards</em></h1>
        <div className="hero-jackpot" aria-label="Live rewards jackpot">
          <span>Pool</span>
          <strong>{formatNumberCompact(wager || highestScore || 40000)}</strong>
          <b>PTS</b>
        </div>
        <div className="button-row"><Link className="button primary" href="/leaderboard">Play</Link><Link className="button ghost" href="/store">Claim</Link></div>
      </div>
      <div className="hero-floor">
        <div className="floor-top"><span>Top 3</span><span className="pulse-text">●</span></div>
        <div className="home-prize-core" aria-hidden="true">
          <span>Live Pool</span>
          <strong>{formatNumberCompact(wager || highestScore || 40000)}</strong>
          <b>PTS</b>
        </div>
        <Podium players={users.slice(0, 3)} compact />
      </div>
    </section>
    <section className="stat-strip page-width"><div><span>Wager</span><strong>{formatNumberCompact(wager)}</strong></div><div><span>Players</span><strong>{livePlayers}</strong></div><div><span>Top</span><strong>{formatNumberCompact(highestScore)}</strong></div><div className="round-block"><span>Board</span><strong>{isLoading ? "Sync" : "Live"}</strong></div></section>
    <section className="section page-width home-zones"><SectionHeading title="Zones" link={["Board", "/leaderboard"]}/><div className="launch-grid">{launchpad.map(([title,href,num,color,meta]) => <Link className={`launch-card ${color}`} href={href} key={href}><span className="launch-num">{num}</span><span className="launch-icon"><ArrowUpRight size={20} strokeWidth={2.4} aria-hidden="true" /></span><div><small>{meta}</small><h3>{title}</h3></div></Link>)}</div></section>
  </main>;
}

function SectionHeading({ title, link }: { title: string; link: [string,string] }) { return <div className="section-heading"><div><h2>{title}</h2></div><Link href={link[1]}>{link[0]} <ArrowUpRight size={14} strokeWidth={2.5} aria-hidden="true" /></Link></div> }

function Podium({ players, compact = false }: { players: Player[]; compact?: boolean }) {
  const prizes: Record<number, string> = { 1: "$600", 2: "$325", 3: "$225" };

  if (players.length === 0) {
    return <div className={`podium ${compact ? "compact" : ""}`}>{[2, 1, 3].map((rank, idx) => <article className={`podium-card rank-${rank}`} key={rank}><div className="rank-badge">#{rank}</div><div className="prize-ribbon">{prizes[rank]}</div><div className="avatar"><span>RB</span></div><div className="podium-copy"><strong>Syncing</strong><small>Live board</small><b>0 <em>XP</em></b><span>0 wagered</span></div>{idx === 1 && <div className="crown"><Crown size={22} fill="currentColor" aria-hidden="true" /></div>}</article>)}</div>;
  }

  const order = players.length === 3 ? [players[1], players[0], players[2]] : players;
  return <div className={`podium ${compact ? "compact" : ""}`}>{order.map((p, idx) => <article className={`podium-card rank-${p.rank}`} key={p.id}><div className="rank-badge">#{p.rank}</div><div className="prize-ribbon">{prizes[p.rank] ?? "Prize"}</div><div className="avatar"><span>{getInitials(p.name)}</span>{p.verified && <i><Check size={10} strokeWidth={3} aria-hidden="true" /></i>}</div><div className="podium-copy"><strong>{playerName(p)}</strong><small>{playerHandle(p)}</small><b>{fmt(playerScore(p))} <em>XP</em></b><span>{fmt(p.points)} wagered</span></div>{idx === 1 && <div className="crown"><Crown size={22} fill="currentColor" aria-hidden="true" /></div>}</article>)}</div>;
}

function Leaderboard({ countdownTarget = null }: { countdownTarget?: string | null }) {
  const {
    users,
    total,
    highestScore,
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
  const leaderScore = filtered[0] ? playerScore(filtered[0]) : 0;
  const wager = totalWager(users);
  const targetWager = Math.max(200000, wager || 200000);
  const wagerProgress = Math.min(100, Math.round(((wager || 0) / targetWager) * 100));
  const targetDate = countdownTarget ? new Date(countdownTarget) : null;

  function refresh(){
    setRefreshing(true);
    retry();
    setTimeout(() => setRefreshing(false),650);
  }

  return <main>
    <section className="board-hero page-width">
      <div><p className="kicker"><span>●</span> Live leaderboard</p><h1>Global Leaderboard</h1><p className="hero-desc">Compete for the top spot in the RankBoard rewards sprint.</p></div>
      <div className="round-ticket"><b>{error ? "CHECKING" : "LIVE"}</b><strong>{targetDate ? formatShortDate(targetDate).toUpperCase() : "NOW"}</strong><span>{lastUpdated ? formatLastUpdated(lastUpdated).toUpperCase() : "SYNC"}</span></div>
    </section>
    <section className="leaderboard-progress page-width" aria-label="Season wager progress">
      <div className="progress-medal">$</div>
      <div>
        <div className="progress-head"><span>Season prize track</span><strong>{fmt(wager)} / {fmt(targetWager)} wager</strong><b>{wagerProgress}%</b></div>
        <div className="progress-bar"><i style={{ width: `${wagerProgress}%` }} /></div>
      </div>
    </section>
    <section className="board-top-three page-width" aria-label="Top three players">
      <div className="floor-top"><span>Top 3</span><span className="pulse-text">●</span></div>
      <div className="winner-arena">
        <div className="arena-core" aria-hidden="true">
          <span>Prize Core</span>
          <strong>$1,150</strong>
          <b>Top 3 pool</b>
        </div>
        <Podium players={users.slice(0, 3)} />
      </div>
    </section>
    <section className="stat-strip page-width board-metrics"><div><span>Players</span><strong>{total || users.length}</strong></div><div><span>Wagered</span><strong>{formatNumberCompact(wager)}</strong></div><div><span>Top XP</span><strong>{formatNumberCompact(highestScore)}</strong></div><div className="round-block"><span>Board</span><strong>{error ? "Issue" : isLoading ? "Sync" : "Live"}</strong></div></section>
    <section className="section page-width board-section">
      <div className="standings">
        <div className="board-controls"><label className="search"><Search size={16} strokeWidth={2.4} aria-hidden="true" /><input value={query} onChange={e=>{setQuery(e.target.value);setVisible(10)}} placeholder="Find a player…" aria-label="Search players"/></label><div className="segment"><button type="button" className={sort==="xp"?"active":""} onClick={()=>{setSort("xp");setVisible(10)}}>Top XP</button><button type="button" className={sort==="rank"?"active":""} onClick={()=>{setSort("rank");setVisible(10)}}>Rank</button></div><button type="button" className={`refresh ${refreshing?"spin":""}`} onClick={refresh} aria-label="Refresh leaderboard"><RefreshCw size={16} strokeWidth={2.4} aria-hidden="true" /></button></div>
        <div className="table-head"><span>Rank / Player</span><span>Status</span><span>Weighted XP</span><span>Wagered</span><span /></div>
        <div className="player-list" aria-live="polite">
          {error ? (
            <div className="empty-state"><span>!</span><h3>The board blinked.</h3><button type="button" onClick={refresh}>Try again</button></div>
          ) : isLoading && users.length === 0 ? (
            Array.from({ length: 8 }).map((_, index) => <div className="skeleton-row" key={index}><i/><span><i/><i/></span></div>)
          ) : visiblePlayers.length ? (
            visiblePlayers.map(p=><PlayerRow key={p.id} player={p} leader={leaderScore} onOpen={()=>setSelected(p)}/>)
          ) : (
            <div className="empty-state"><span><Search size={34} strokeWidth={1.8} aria-hidden="true" /></span><h3>Nobody here.</h3><button type="button" onClick={()=>setQuery("")}>Clear search</button></div>
          )}
        </div>
        {filtered.length > visible && !error && <button type="button" className="load-more" onClick={()=>setVisible(v=>v+8)}>Load more <span>{Math.min(visible,filtered.length)} / {filtered.length}</span></button>}
      </div>
    </section>
    {selected && <div className="modal-backdrop" onClick={()=>setSelected(null)}><article className="player-modal" onClick={e=>e.stopPropagation()}><button type="button" onClick={()=>setSelected(null)} aria-label="Close"><X size={18} strokeWidth={2.5} aria-hidden="true" /></button><p>Player · #{selected.rank}</p><div className="modal-identity"><div className="avatar"><span>{getInitials(selected.name)}</span></div><div><h2>{playerName(selected)}</h2><span>{playerHandle(selected)} · {selected.verified?"Verified":"Challenger"}</span></div></div><div className="modal-stats"><div><small>Weighted XP</small><strong>{fmt(playerScore(selected))}</strong></div><div><small>Wagered</small><strong>{fmt(selected.points)}</strong></div><div><small>Last active</small><strong>{selected.lastActive ?? "Live"}</strong></div></div><Link href="/challenges">View missions <ArrowUpRight size={15} strokeWidth={2.5} aria-hidden="true" /></Link></article></div>}
  </main>;
}

function PlayerRow({ player, leader, onOpen }: { player: Player; leader: number; onOpen: () => void }) { const score = playerScore(player); return <button type="button" className={`player-row rank-row-${player.rank}`} onClick={onOpen}><div className="player-cell"><b className="row-rank">{String(player.rank).padStart(2,"0")}</b><div className="mini-avatar">{getInitials(player.name)}</div><span><strong>{playerName(player)}{player.verified&&<i><Check size={10} strokeWidth={3} aria-hidden="true" /></i>}</strong><small>{playerHandle(player)}</small></span></div><div><span className={player.rank<7?"status hot":"status live"}>{player.rank<7?"HOT":"LIVE"}</span></div><div className="xp-cell"><strong>{fmt(score)} <small>XP</small></strong><span><i style={{width:`${leader > 0 ? (score/leader)*100 : 0}%`}}/></span></div><strong className="wager">{fmt(player.points)}</strong><span className="open-row"><ArrowUpRight size={16} strokeWidth={2.5} aria-hidden="true" /></span></button> }

function FeaturePage({ route, data }: { route: string; data: { title: string; tagline: string; action: [string, string] } }) {
  return <main><section className="board-hero page-width"><div><p className="kicker"><span>●</span> Season 08</p><h1>{data.title}</h1><p className="hero-desc">{data.tagline}</p><div className="button-row"><Link className="button ghost" href={data.action[1]}>{data.action[0]}</Link></div></div></section><FeatureWorkspace route={route} /></main>;
}

function Legal({ type }: { type: string }) { const privacy=type==="privacy"; return <main className="legal page-width"><p className="kicker"><span>●</span> RankBoard legal</p><h1>{privacy?"Privacy":"Terms"}<em>.</em></h1><p className="legal-lead">{privacy?"How RankBoard handles player information, session data, and reward activity.":"The ground rules for using RankBoard, joining reward activity, and keeping play fair."}</p><div className="legal-layout"><aside><span>Last updated</span><strong>Aug 13, 2026</strong><Link href={privacy?"/terms":"/privacy"}>{privacy?"Read terms":"Read privacy"} ↗</Link></aside><article>{(privacy?[["1. Information we use","RankBoard may process account identifiers, leaderboard activity, reward progress, and basic device information needed to operate the product."],["2. Why we use it","We use this information to display ranks, maintain reward progress, protect the floor, and respond to support requests."],["3. Your choices","Players may request access, correction, or deletion of eligible account information through support."],["4. Data protection","Reasonable technical and organizational safeguards are used to protect information from unauthorized access."]]:[["1. Using RankBoard","Use the product lawfully, keep account access secure, and do not interfere with rankings, missions, or other players."],["2. Rankings and rewards","Rank calculations, challenge eligibility, and rewards may be reviewed when activity appears invalid, duplicated, or manipulated."],["3. Fair play","Automation, exploit attempts, false identities, and coordinated manipulation can lead to removal from a round."],["4. Availability","Live data can briefly lag or become unavailable. The latest verified state remains the basis for ranking decisions."]]).map(([h,p])=><section key={h}><h2>{h}</h2><p>{p}</p></section>)}</article></div></main> }


function CasinoCard({
  provider,
  account,
  detail,
  onRefresh,
}: {
  provider: "shuffle" | "thrill" | "packdraw";
  account: HeaderAccount;
  detail?: CasinoAccountDetail | null;
  onRefresh: () => void;
}) {
  const [mode, setMode] = useState<"username" | "email">("username");
  const [usernameInput, setUsernameInput] = useState(detail?.username ?? "");
  const [emailInput, setEmailInput] = useState(detail?.email ?? "");
  const [codeInput, setCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const [detailDraft, setDetailDraft] = useState(detail);
  if (detail !== detailDraft) {
    setDetailDraft(detail);
    if (detail?.username) setUsernameInput(detail.username);
    if (detail?.email) setEmailInput(detail.email);
  }

  const isVerified = detail?.isVerified;
  const isPending = detail && !detail.isVerified;
  const kickName = account.connected.kick.connected ? account.connected.kick.username : "";

  async function handleLink(customUser?: string) {
    setLoading(true);
    setStatusMsg(null);
    try {
      const userVal = (customUser || usernameInput).trim();
      const payload: Record<string, string> = { provider, username: userVal };
      if (mode === "email" && emailInput.trim()) payload.email = emailInput.trim();

      const res = await fetch("/api/casino/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to link");
      setStatusMsg({ type: "success", text: data.message });
      window.dispatchEvent(new CustomEvent("rankboard-storage"));
      onRefresh();
    } catch (e: unknown) {
      setStatusMsg({ type: "error", text: e instanceof Error ? e.message : "Failed to link" });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!codeInput.trim()) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/casino/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, code: codeInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Verification failed");
      setStatusMsg({ type: "success", text: data.message });
      setCodeInput("");
      window.dispatchEvent(new CustomEvent("rankboard-storage"));
      onRefresh();
    } catch (e: unknown) {
      setStatusMsg({ type: "error", text: e instanceof Error ? e.message : "Verification failed" });
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoVerify() {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/casino/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, recheck: true }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Auto-verification failed");
      setStatusMsg({ type: "success", text: data.message });
      window.dispatchEvent(new CustomEvent("rankboard-storage"));
      onRefresh();
    } catch (e: unknown) {
      setStatusMsg({ type: "error", text: e instanceof Error ? e.message : "Auto-verification failed" });
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlink() {
    if (!confirm(`Are you sure you want to unlink your ${provider} account?`)) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/casino/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Unlink failed");
      setStatusMsg({ type: "success", text: data.message });
      setUsernameInput("");
      setEmailInput("");
      window.dispatchEvent(new CustomEvent("rankboard-storage"));
      onRefresh();
    } catch (e: unknown) {
      setStatusMsg({ type: "error", text: e instanceof Error ? e.message : "Unlink failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <article
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: isVerified
          ? "1px solid rgba(34, 197, 94, 0.35)"
          : isPending
          ? "1px solid rgba(234, 179, 8, 0.35)"
          : "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 12,
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ textTransform: "capitalize", fontSize: "1.1rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>{provider}</span>
            {provider === "shuffle" && (
              <small style={{ opacity: 0.6, fontSize: "0.75rem", fontWeight: 400 }}>(Live Affiliate Wager)</small>
            )}
          </h3>
        </div>
        {isVerified ? (
          <span style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", border: "1px solid rgba(34, 197, 94, 0.4)", padding: "0.25rem 0.6rem", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700 }}>
            VERIFIED ✓
          </span>
        ) : isPending ? (
          <span style={{ background: "rgba(234, 179, 8, 0.15)", color: "#eab308", border: "1px solid rgba(234, 179, 8, 0.4)", padding: "0.25rem 0.6rem", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700 }}>
            PENDING VERIFICATION ⏳
          </span>
        ) : (
          <span style={{ opacity: 0.5, fontSize: "0.75rem", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "0.25rem 0.6rem", borderRadius: 6 }}>
            NOT LINKED
          </span>
        )}
      </div>

      {isVerified ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <div style={{ background: "rgba(34, 197, 94, 0.08)", padding: "0.75rem 1rem", borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              Username: <strong style={{ color: "#fff" }}>@{detail.username}</strong>
            </p>
            {detail.email && (
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", opacity: 0.8 }}>
                Casino Email: {detail.email}
              </p>
            )}
            <small style={{ display: "block", marginTop: "0.4rem", color: "#22c55e", fontSize: "0.75rem" }}>
              ● Points sync active ({detail.verificationMethod === "KICK_OAUTH" ? "Auto-matched with Kick" : detail.verificationMethod === "EMAIL_MATCH" ? "Matched with verified email" : "Security Code Verified"})
            </small>
          </div>
          <button
            type="button"
            className="button ghost"
            onClick={handleUnlink}
            disabled={loading}
            style={{ alignSelf: "flex-start", fontSize: "0.8rem", padding: "0.4rem 0.8rem", color: "#f87171" }}
          >
            {loading ? "Unlinking..." : "Unlink Account"}
          </button>
        </div>
      ) : isPending ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ background: "rgba(234, 179, 8, 0.08)", padding: "0.75rem 1rem", borderRadius: 8, border: "1px dashed rgba(234, 179, 8, 0.3)" }}>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              Linked Handle: <strong style={{ color: "#fff" }}>@{detail.username}</strong>
            </p>
            {detail.verificationCode && (
              <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Verification Code:</span>
                <code style={{ background: "rgba(0,0,0,0.4)", color: "#eab308", padding: "0.2rem 0.5rem", borderRadius: 4, fontWeight: "bold", letterSpacing: "0.05em" }}>
                  {detail.verificationCode}
                </code>
              </div>
            )}
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", opacity: 0.8, lineHeight: 1.4 }}>
              To ensure players cannot impersonate each other, enter your code below or auto-verify with your Kick OAuth account.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Enter code (e.g. RANK-1234)"
              style={{ flex: 1, minWidth: 180, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "0.5rem 0.75rem", color: "#fff", fontSize: "0.85rem" }}
            />
            <button
              type="button"
              className="button primary"
              onClick={handleVerify}
              disabled={loading || !codeInput.trim()}
              style={{ fontSize: "0.85rem", padding: "0.5rem 0.9rem" }}
            >
              {loading ? "Verifying..." : "Confirm Code"}
            </button>
          </div>

          {account.connected.kick.connected && (
            <button
              type="button"
              className="button ghost"
              onClick={handleAutoVerify}
              disabled={loading}
              style={{ alignSelf: "flex-start", fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
            >
              ⚡ Auto-Verify with Kick (@{account.connected.kick.username})
            </button>
          )}

          <button
            type="button"
            className="button ghost"
            onClick={handleUnlink}
            disabled={loading}
            style={{ alignSelf: "flex-start", fontSize: "0.75rem", opacity: 0.6, padding: "0.2rem 0.4rem" }}
          >
            Change or remove handle
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem" }}>
            <button
              type="button"
              onClick={() => setMode("username")}
              style={{
                background: mode === "username" ? "rgba(255,255,255,0.15)" : "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                borderRadius: 4,
                padding: "0.3rem 0.6rem",
                cursor: "pointer",
              }}
            >
              By Username
            </button>
            <button
              type="button"
              onClick={() => setMode("email")}
              style={{
                background: mode === "email" ? "rgba(255,255,255,0.15)" : "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                borderRadius: 4,
                padding: "0.3rem 0.6rem",
                cursor: "pointer",
              }}
            >
              By Casino Email
            </button>
          </div>

          {mode === "username" ? (
            <input
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder={`Your ${provider} username`}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "0.6rem 0.8rem", color: "#fff", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <input
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder={`Your ${provider} username`}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "0.6rem 0.8rem", color: "#fff", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" }}
              />
              <input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={`Your ${provider} account email`}
                type="email"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "0.6rem 0.8rem", color: "#fff", fontSize: "0.85rem", width: "100%", boxSizing: "border-box" }}
              />
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              className="button primary"
              onClick={() => handleLink()}
              disabled={loading || !usernameInput.trim()}
              style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}
            >
              {loading ? "Linking..." : "Link & Verify"} <span>↗</span>
            </button>

            {kickName && (
              <button
                type="button"
                className="button ghost"
                onClick={() => {
                  setUsernameInput(kickName);
                  handleLink(kickName);
                }}
                disabled={loading}
                style={{ fontSize: "0.8rem", padding: "0.45rem 0.8rem" }}
              >
                ⚡ Auto-Link Kick (@{kickName})
              </button>
            )}
          </div>
        </div>
      )}

      {statusMsg && (
        <div
          style={{
            fontSize: "0.8rem",
            color: statusMsg.type === "success" ? "#22c55e" : "#f87171",
            background: statusMsg.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(248, 113, 113, 0.1)",
            border: statusMsg.type === "success" ? "1px solid rgba(34, 197, 94, 0.2)" : "1px solid rgba(248, 113, 113, 0.2)",
            padding: "0.5rem 0.75rem",
            borderRadius: 6,
          }}
        >
          {statusMsg.text}
        </div>
      )}
    </article>
  );
}

function Profile({ account }: { account: HeaderAccount }) {
  const [transactions, setTransactions] = useState<{ id: string; amount: number; reason: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [casinoAccounts, setCasinoAccounts] = useState<CasinoAccountDetail[]>(account.casinoAccounts ?? []);

  const refreshProfileData = useCallback(() => {
    if (!account.authenticated) return;
    fetch("/api/auth/profile", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.casinoAccounts) setCasinoAccounts(d.casinoAccounts);
      })
      .catch(() => null);

    fetch("/api/points", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.transactions) setTransactions(d.transactions);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [account.authenticated]);

  useEffect(() => {
    refreshProfileData();
  }, [refreshProfileData]);

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
        <section className="board-hero page-width">
          <div>
            <p className="kicker"><span>●</span> Player hub</p>
            <h1>Profile</h1>
            <p className="hero-desc">Sign in to view your points, link casinos, and track your history.</p>
            <div className="button-row">
              <Link className="button primary" href="/login">Sign in</Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const shuffleAccount = casinoAccounts?.find((c) => c.provider === "shuffle");
  const thrillAccount = casinoAccounts?.find((c) => c.provider === "thrill");
  const packdrawAccount = casinoAccounts?.find((c) => c.provider === "packdraw");

  return (
    <main>
      <section className="board-hero page-width">
        <div>
          <p className="kicker"><span>●</span> Player hub</p>
          <h1>Profile</h1>
        </div>
        <div className="round-ticket"><strong>{fmt(account.points)} PTS</strong><span>{account.profileProvider.toUpperCase()}</span></div>
      </section>

      <section className="stat-strip page-width">
        <div><span>Points</span><strong>{fmt(account.points)}</strong></div>
        <div><span>XP</span><strong>{formatNumberCompact(account.xp)}</strong></div>
        <div><span>Handle</span><strong>{account.handle}</strong></div>
        <div className="round-block"><span>Via</span><strong>{account.profileProvider.toUpperCase()}</strong></div>
      </section>

      <section className="section page-width app-workspace">
        <div className="workspace-heading">
          <div>
            <p>Protected Casino Links</p>
            <h2>Verified Casino Accounts</h2>
          </div>
          <span>Points only sync to verified accounts to prevent username theft</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
          <CasinoCard
            provider="shuffle"
            account={account}
            detail={shuffleAccount}
            onRefresh={refreshProfileData}
          />
          <CasinoCard
            provider="thrill"
            account={account}
            detail={thrillAccount}
            onRefresh={refreshProfileData}
          />
          <CasinoCard
            provider="packdraw"
            account={account}
            detail={packdrawAccount}
            onRefresh={refreshProfileData}
          />
        </div>
      </section>

      <section className="section page-width" style={{ paddingTop: 0 }}>
        <div className="workspace-heading">
          <div>
            <p>Ledger</p>
            <h2>Point history</h2>
          </div>
          <Link className="route-link" href="/store">Spend <span>↗</span></Link>
        </div>
        {loading ? (
          <div className="player-list">{Array.from({ length: 5 }).map((_, i) => <div className="skeleton-row" key={i}><i/><span><i/><i/></span></div>)}</div>
        ) : transactions.length === 0 ? (
          <div className="empty-state"><span>◎</span><h3>Nothing yet.</h3><Link href="/store" className="button ghost">Open store</Link></div>
        ) : (
          <div className="workspace-list" style={{ marginTop: 0 }}>
            {transactions.map((t) => (
              <article key={t.id}>
                <span>{t.amount > 0 ? "Credit" : "Debit"}</span>
                <div>
                  <h3>{reasonLabel(t.reason)}</h3>
                  <p>{new Date(t.createdAt).toLocaleDateString()}</p>
                </div>
                <strong style={{ color: t.amount > 0 ? "var(--green)" : "var(--coral)", fontSize: 13 }}>{t.amount > 0 ? "+" : ""}{fmt(t.amount)} PTS</strong>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section page-width" style={{ paddingTop: 0 }}>
        <div className="workspace-heading">
          <div>
            <p>Logins</p>
            <h2>Linked accounts</h2>
          </div>
        </div>
        <div className="connection-grid">
          <div className={`connection-card ${account.connected.kick.connected ? "connected" : ""}`}>
            <small>Kick</small>
            <h3>{account.connected.kick.connected ? account.connected.kick.username : "Not linked"}</h3>
            <p>{account.connected.kick.connected ? "Connected" : "Connect from the login page"}</p>
          </div>
          <div className={`connection-card ${account.connected.discord.connected ? "connected" : ""}`}>
            <small>Discord</small>
            <h3>{account.connected.discord.connected ? account.connected.discord.username : "Not linked"}</h3>
            <p>{account.connected.discord.connected ? "Connected" : "Connect from the login page"}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Footer(){return <footer className="footer"><div className="footer-top page-width"><div><Link className="brand" href="/"><span className="brand-mark">R</span><span>RANK<span>BOARD</span></span></Link><p>Live rankings, missions, and rewards.<br/>Play responsibly · 18+</p></div><div className="footer-links">{[["Live Board","/leaderboard"],["Custom Bets","/custom-bets"],["Store","/store"],["Watch Points","/watch-points"],["Missions","/challenges"],["Profile","/profile"],["Support","/support"],["Privacy","/privacy"],["Terms","/terms"]].map(([n,h])=><Link key={h} href={h}>{n}<span>↗</span></Link>)}</div></div><div className="footer-bottom"><span>© 2026 RANKBOARD</span><span>THE BOARD IS LIVE <b>●</b></span><span>PLAY RESPONSIBLY · 18+</span></div></footer>}
