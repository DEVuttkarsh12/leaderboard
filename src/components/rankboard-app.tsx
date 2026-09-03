"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  Coins,
  Crown,
  Gift,
  LogOut,
  RefreshCw,
  Search,
  Sparkles,
  Timer,
  Trophy,
  Tv,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import CustomCursor from "./custom-cursor";
import FeatureWorkspace from "./feature-workspace";
import LiquidGlass from "./liquid-glass";
import SiteEntryLoader from "./site-entry-loader";
import StaggeredMenu from "./staggered-menu";
import VolcanoBackground from "./volcano-background";
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
type ZoneIcon = typeof ArrowUpRight;

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

const DESKTOP_NAV = [
  ["Home", "/"],
  ["Board", "/leaderboard"],
  ["Missions", "/challenges"],
  ["Bets", "/custom-bets"],
  ["Watch", "/watch-points"],
  ["Store", "/store"],
] as const;

const launchpad: [string, string, string, string, string, ZoneIcon][] = [
  ["Board", "/leaderboard", "LB", "ember", "View board", Trophy],
  ["Bets", "/custom-bets", "BET", "mint", "Place slips", Coins],
  ["Missions", "/challenges", "XP", "violet", "Earn rewards", BadgeCheck],
  ["Watch", "/watch-points", "GO", "blue", "Watch live", Tv],
  ["Hunts", "/bonus-hunts", "H", "coral", "Track hunts", Sparkles],
  ["Store", "/store", "PTS", "magma", "Claim prizes", Gift],
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

function poolFractionDigits(value: number) {
  if (!Number.isFinite(value)) return 0;
  const thousandths = Math.round(Math.abs(value % 1) * 1000);
  if (!thousandths) return 0;
  return thousandths.toString().padStart(3, "0").replace(/0+$/, "").length;
}

function formatPoolValue(value: number, fractionDigits = poolFractionDigits(value)) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(safeValue);
}

function formatPoolDisplay(value: number, fractionDigits = poolFractionDigits(value)) {
  const safeValue = Number.isFinite(value) ? value : 0;
  if (Math.abs(safeValue) >= 100_000) {
    return formatNumberCompact(safeValue);
  }
  return formatPoolValue(safeValue, fractionDigits);
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
  badges: string[];
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
  badges: ["Season 08"],
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
    badges: Array.isArray(value?.badges) ? value.badges : guestHeaderAccount.badges,
  };
}

function isAdminHeaderAccount(account: HeaderAccount) {
  return account.authenticated && account.badges.includes("Admin");
}

function headerAccountDestination(account: HeaderAccount) {
  return isAdminHeaderAccount(account) ? "/admin" : "/profile";
}

function headerAccountDestinationLabel(account: HeaderAccount) {
  return isAdminHeaderAccount(account) ? "admin panel" : "profile";
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
    badges: payload.badges,
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

async function clearRankBoardSession() {
  await fetch("/api/auth/session", {
    method: "DELETE",
  }).catch(() => null);
  window.localStorage.removeItem("rankboard-account");
  window.dispatchEvent(new CustomEvent("rankboard-storage"));
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
  return (
    <div className="site-shell">
      <div className="site-tunnel-background" aria-hidden="true">
        <VolcanoBackground
          skyColorTop="#08030f"
          skyColorBottom="#26080b"
          lavaColor="#ff4f00"
          glowColor="#ff7a00"
          meteorColor="#ffd166"
          meteorCount={3}
          eruptionIntensity={0.38}
          starCount={36}
          maxLavaParticles={95}
          simulationSpeed={0.38}
          animationStyle="default"
        />
      </div>
      <CustomCursor />
      <SiteEntryLoader />
      <div className="top-chrome">
        <Header account={account} accountOpen={accountOpen} setAccountOpen={setAccountOpen} />
      </div>
      {route === "" ? <Home /> : route === "leaderboard" ? <Leaderboard countdownTarget={countdownTarget} /> : route === "privacy" || route === "terms" ? <Legal type={route} /> : route === "profile" ? <Profile account={account} /> : <FeaturePage route={route} data={pageData[route] ?? pageData.help} />}
      <Footer />
    </div>
  );
}

function Header({ account, accountOpen, setAccountOpen }: { account: HeaderAccount; accountOpen: boolean; setAccountOpen: (v: boolean) => void }) {
  const pathname = usePathname();
  const cleanHandle = account.handle.replace(/^@/, "") || "guest";
  const initials = getInitials(cleanHandle);
  const isAdmin = isAdminHeaderAccount(account);
  const accountStatus = !account.authenticated ? "Guest" : isAdmin ? "Admin" : account.profileProvider === "kick" ? "Kick" : account.profileProvider === "discord" ? "Discord" : "Signed in";
  const accountHref = headerAccountDestination(account);
  const menuLinks = account.authenticated
    ? isAdmin
      ? [["Admin", "/admin"], ["Profile", "/profile"], ["Custom Bets", "/custom-bets"], ["Support", "/support"], ["Privacy", "/privacy"], ["Terms", "/terms"]]
      : [["Profile", "/profile"], ["Custom Bets", "/custom-bets"], ["Support", "/support"], ["Privacy", "/privacy"], ["Terms", "/terms"]]
    : [["Profile", "/profile"], ["Login", "/login"], ["Custom Bets", "/custom-bets"], ["Support", "/support"], ["Privacy", "/privacy"], ["Terms", "/terms"]];

  async function signOut() {
    await clearRankBoardSession();
    setAccountOpen(false);
  }

  const logo = (
    <div className="menu-logo-lockup">
      <span className="brand-mark">{account.image ? <Image src={account.image} alt="" width={42} height={42} unoptimized /> : initials}</span>
      <span className="menu-logo-text">
        <span className="menu-logo-word">
          RANK<span>BOARD</span>
        </span>
        <small>{accountStatus} · {formatNumberCompact(account.points)} PTS</small>
      </span>
    </div>
  );
  const items = NAV.filter(([label]) => isAdmin || label !== "Admin").map(([label, href]) => ({
    label,
    ariaLabel: `Go to ${label}`,
    link: href,
  }));
  const socialItems = menuLinks.map(([label, link]) => ({ label, link }));
  const isActiveLink = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <>
      <LiquidGlass as="nav" className="desktop-nav" depth="clear" tone="violet" aria-label="Primary navigation">
        <Link className="desktop-nav__brand" href="/" aria-label="RankBoard home">
          <span className="desktop-nav__mark">R</span>
          <span className="desktop-nav__word">
            RANK<span>BOARD</span>
          </span>
        </Link>
        <div className="desktop-nav__links">
          {DESKTOP_NAV.map(([label, href]) => (
            <Link className={isActiveLink(href) ? "active" : undefined} href={href} key={href}>
              {label}
            </Link>
          ))}
        </div>
        <div className="desktop-nav__account-group">
          <Link className="desktop-nav__account" href={accountHref} aria-label={`Open ${headerAccountDestinationLabel(account)}`}>
            <span className="desktop-nav__avatar">{account.image ? <Image src={account.image} alt="" width={36} height={36} unoptimized /> : initials}</span>
            <span>
              <strong>{accountStatus}</strong>
              <small>{formatNumberCompact(account.points)} PTS</small>
            </span>
          </Link>
          {account.authenticated ? (
            <button className="desktop-nav__logout" type="button" onClick={signOut} aria-label="Logout of RankBoard">
              <LogOut size={15} strokeWidth={2.6} aria-hidden="true" />
              <span>Logout</span>
            </button>
          ) : (
            <Link className="desktop-nav__logout desktop-nav__logout--login" href="/login">
              <span>Login</span>
            </Link>
          )}
        </div>
      </LiquidGlass>
      <StaggeredMenu
        className="mobile-menu-only"
        position="left"
        items={items}
        socialItems={socialItems}
        displaySocials
        displayItemNumbering
        logo={logo}
        colors={["#ff7a00", "#8b1e1e", "#ff4f3d"]}
        menuButtonColor="#ff7a00"
        openMenuButtonColor="#08030F"
        accentColor="#ff4f00"
        onMenuOpen={() => setAccountOpen(true)}
        onMenuClose={() => setAccountOpen(false)}
        footer={
          account.authenticated ? (
            <button type="button" onClick={signOut}>
              Logout <LogOut size={14} strokeWidth={2.5} aria-hidden="true" />
            </button>
          ) : null
        }
      />
      <span className="sr-only">{accountOpen ? "Menu open" : "Menu closed"}</span>
    </>
  );
}

function Home() {
  const { users, total, highestScore } = useLeaderboard();
  const livePlayers = total || users.length;
  const wager = totalWager(users);
  const livePool = wager || highestScore || 40000;
  const livePoolLabel = formatPoolValue(livePool);

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
        <motion.div
          className="hero-word-block"
          initial={{ opacity: 0, x: -28, rotate: -1.5 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ delay: 1.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="hero-brackoz-title">
            <span aria-label="Rank Up">
              {"Rank Up".split("").map((char, index) => <i key={`rank-${index}`} className={char === " " ? "hero-title-space" : undefined}>{char}</i>)}
            </span>
            <em aria-label="Grab Rewards">
              {"Grab Rewards".split("").map((char, index) => <i key={`rewards-${index}`} className={char === " " ? "hero-title-space" : undefined}>{char}</i>)}
            </em>
          </h1>
          <p className="hero-mini-line">Play. Climb. Claim.</p>
          <div className="home-prize-core home-prize-core--hero" aria-label={`Live pool ${livePoolLabel} points`}>
            <span>Live Pool</span>
            <AnimatedPoolNumber value={livePool} />
            <b>PTS</b>
          </div>
          <div className="button-row">
            <MagneticLink className="button primary" href="/leaderboard">Play</MagneticLink>
            <MagneticLink className="button ghost" href="/store">Claim</MagneticLink>
          </div>
        </motion.div>
        <HeroRankTracker activity={livePool} players={users.slice(0, 3)} />
      </div>
    </section>
    <HomeBoardPreview users={users} />
    <section className="home-action-zone page-width" aria-label="RankBoard routes and live stats">
      <div className="home-signal-row">
        <div><span>Players</span><strong>{livePlayers}</strong></div>
        <div><span>Wager</span><strong>{formatNumberCompact(wager)}</strong></div>
        <div><span>Top XP</span><strong>{formatNumberCompact(highestScore)}</strong></div>
        <Link href="/leaderboard">Leaderboard <ArrowUpRight size={14} strokeWidth={2.6} aria-hidden="true" /></Link>
      </div>
      <div className="home-route-strip">
        {launchpad.map(([title, href, badge, color, action, Icon]) => (
          <SpotlightRouteCard action={action} badge={badge} color={color} href={href} icon={Icon} key={href} title={title} />
        ))}
      </div>
    </section>
  </main>;
}

function HeroRankTracker({ activity, players }: { activity: number; players: Player[] }) {
  const leaderScore = Math.max(1, ...players.map(playerScore));
  const leader = players[0];
  const leaderValue = leader ? playerScore(leader) : 0;
  const prizes = ["$600", "$325", "$225"];

  return (
    <motion.div
      className="hero-live-panel-wrap"
      initial={{ opacity: 0, x: 42, y: 20, rotate: 5 }}
      animate={{ opacity: 1, x: 0, y: 0, rotate: -2 }}
      transition={{ delay: 1.22, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <LiquidGlass as="section" className="hero-live-panel hero-rank-tracker" tone="ember" aria-label="Live leaderboard snapshot">
        <div className="hero-rank-tracker__top">
          <span className="hero-rank-tracker__live"><i /> Live board</span>
          <Link href="/leaderboard" aria-label="Open full leaderboard"><ArrowUpRight size={18} strokeWidth={2.5} aria-hidden="true" /></Link>
        </div>
        <div className="hero-rank-tracker__title">
          <span>Race snapshot</span>
          <strong>Top players</strong>
        </div>
        <div className="hero-rank-tracker__leader">
          <div className="hero-rank-tracker__leader-top">
            <span className="hero-rank-tracker__crown"><Crown size={16} fill="currentColor" aria-hidden="true" /> #1</span>
            <span className="hero-rank-tracker__prize">{prizes[0]} reward</span>
          </div>
          <div className="hero-rank-tracker__leader-main">
            <span className="hero-rank-tracker__avatar hero-rank-tracker__avatar--leader">{leader ? getInitials(leader.name) : "RB"}</span>
            <span className="hero-rank-tracker__identity">
              <small>Current leader</small>
              <strong>{leader ? playerName(leader) : "Syncing live data"}</strong>
              <i><span style={{ width: leader ? "100%" : "8%" }} /></i>
            </span>
            <span className="hero-rank-tracker__score hero-rank-tracker__score--leader"><strong>{formatNumberCompact(leaderValue)}</strong><small>Weighted XP</small></span>
          </div>
        </div>
        <div className="hero-rank-tracker__chasers" aria-label="Second and third place players">
          {[1, 2].map((index) => {
            const player = players[index];
            const score = player ? playerScore(player) : 0;
            const progress = player ? Math.max(8, (score / leaderScore) * 100) : 8;

            return (
              <article className={`hero-rank-tracker__chaser hero-rank-tracker__chaser--${index + 1}`} key={player?.id ?? `sync-${index + 1}`}>
                <div className="hero-rank-tracker__chaser-top"><b>#{index + 1}</b><span>{prizes[index]}</span></div>
                <div className="hero-rank-tracker__chaser-player">
                  <span className="hero-rank-tracker__avatar">{player ? getInitials(player.name) : "RB"}</span>
                  <span><small>In pursuit</small><strong>{player ? playerName(player) : "Syncing"}</strong></span>
                </div>
                <i className="hero-rank-tracker__chaser-track"><span style={{ width: `${progress}%` }} /></i>
                <strong className="hero-rank-tracker__chaser-score">{formatNumberCompact(score)} <small>XP</small></strong>
              </article>
            );
          })}
        </div>
        <div className="hero-rank-tracker__footer">
          <span><small>Live activity</small><strong>{formatNumberCompact(activity)} PTS</strong></span>
          <Link href="/leaderboard">Full ranking <ArrowUpRight size={15} strokeWidth={2.6} aria-hidden="true" /></Link>
        </div>
      </LiquidGlass>
    </motion.div>
  );
}

function HomeBoardPreview({ users }: { users: Player[] }) {
  return (
    <section className="home-board-preview page-width" id="home-board-preview" aria-label="Top three leaderboard players">
      <div className="home-board-preview__top">
        <span>Top 3</span>
        <Link href="/leaderboard">Full Board <ArrowUpRight size={14} strokeWidth={2.6} aria-hidden="true" /></Link>
      </div>
      <div className="home-board-preview__stage">
        <Podium players={users.slice(0, 3)} compact />
      </div>
    </section>
  );
}

function AnimatedPoolNumber({ value }: { value: number }) {
  const prefersReducedMotion = useReducedMotion();
  const fractionDigits = useMemo(() => poolFractionDigits(value), [value]);
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }),
    [fractionDigits]
  );
  const [introDelay, setIntroDelay] = useState(1.55);
  const count = useMotionValue(0);
  const display = useTransform(count, (latest) => formatPoolDisplay(latest, fractionDigits));
  const displayLabel = formatPoolDisplay(value, fractionDigits);
  const fullLabel = formatter.format(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIntroDelay(0), 3400);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      count.set(value);
      return undefined;
    }

    const controls = animate(count, value, {
      delay: introDelay,
      duration: introDelay ? 1.9 : 0.85,
      ease: [0.16, 1, 0.3, 1],
    });

    return () => controls.stop();
  }, [count, introDelay, prefersReducedMotion, value]);

  if (prefersReducedMotion) {
    return <strong aria-label={fullLabel}>{displayLabel}</strong>;
  }

  return <motion.strong className="pool-count-number" aria-label={fullLabel}>{display}</motion.strong>;
}

function MagneticLink({ className, href, children }: { className: string; href: string; children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 180, damping: 18, mass: 0.45 });
  const springY = useSpring(y, { stiffness: 180, damping: 18, mass: 0.45 });

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLSpanElement>) => {
      if (prefersReducedMotion) return;
      const rect = event.currentTarget.getBoundingClientRect();
      x.set((event.clientX - rect.left - rect.width / 2) * 0.18);
      y.set((event.clientY - rect.top - rect.height / 2) * 0.24);
    },
    [prefersReducedMotion, x, y]
  );

  const resetPosition = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.span className="magnetic-link" onPointerLeave={resetPosition} onPointerMove={handlePointerMove} style={{ x: springX, y: springY }}>
      <Link className={className} href={href}>{children}</Link>
    </motion.span>
  );
}

function SpotlightRouteCard({
  action,
  badge,
  color,
  href,
  icon: Icon,
  title,
}: {
  action: string;
  badge: string;
  color: string;
  href: string;
  icon: ZoneIcon;
  title: string;
}) {
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, opacity: 0 });

  const handlePointerMove = useCallback((event: PointerEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSpotlight({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      opacity: 1,
    });
  }, []);

  return (
    <Link
      className={`home-route-card ${color}`}
      href={href}
      onPointerLeave={() => setSpotlight((current) => ({ ...current, opacity: 0 }))}
      onPointerMove={handlePointerMove}
      style={{
        "--spotlight-x": `${spotlight.x}px`,
        "--spotlight-y": `${spotlight.y}px`,
        "--spotlight-opacity": spotlight.opacity,
      } as CSSProperties}
    >
      <span className="home-route-card__badge">{badge}</span>
      <Icon className="home-route-card__mark" size={62} strokeWidth={1.8} aria-hidden="true" />
      <strong>{title}</strong>
      <small className="home-route-card__action">{action} ↗</small>
    </Link>
  );
}

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
    <section className="board-hero board-hero--leaderboard page-width">
      <div><p className="kicker"><span>●</span> Live leaderboard</p><h1>Global Leaderboard</h1><p className="hero-desc">Compete for the top spot in the RankBoard rewards sprint.</p></div>
      <SeasonClock error={Boolean(error)} lastUpdated={lastUpdated} targetDate={targetDate} />
    </section>
    <LiquidGlass as="section" className="leaderboard-progress page-width" tone="ember" aria-label="Season wager progress">
      <div className="progress-medal">$</div>
      <div>
        <div className="progress-head"><span>Season prize track</span><strong>{fmt(wager)} / {fmt(targetWager)} wager</strong><b>{wagerProgress}%</b></div>
        <div className="progress-bar"><i style={{ width: `${wagerProgress}%` }} /></div>
      </div>
    </LiquidGlass>
    <section className="board-top-three page-width" aria-label="Top three players">
      <div className="floor-top">
        <span>Top 3</span>
        <div className="live-pool">
          <small>Live pool</small>
          <strong>$1,150</strong>
          <b>Paid to podium</b>
        </div>
        <span className="pulse-text">●</span>
      </div>
      <div className="winner-arena">
        <Podium players={users.slice(0, 3)} />
      </div>
    </section>
    <section className="stat-strip page-width board-metrics"><div><span>Players</span><strong>{total || users.length}</strong></div><div><span>Wagered</span><strong>{formatNumberCompact(wager)}</strong></div><div><span>Top XP</span><strong>{formatNumberCompact(highestScore)}</strong></div><div className="round-block"><span>Board</span><strong>{error ? "Issue" : isLoading ? "Sync" : "Live"}</strong></div></section>
    <section className="section page-width board-section">
      <LiquidGlass className="standings" tone="cyan">
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
      </LiquidGlass>
    </section>
    {selected && <div className="modal-backdrop" onClick={()=>setSelected(null)}><article className="player-modal" onClick={e=>e.stopPropagation()}><button type="button" onClick={()=>setSelected(null)} aria-label="Close"><X size={18} strokeWidth={2.5} aria-hidden="true" /></button><p>Player · #{selected.rank}</p><div className="modal-identity"><div className="avatar"><span>{getInitials(selected.name)}</span></div><div><h2>{playerName(selected)}</h2><span>{playerHandle(selected)} · {selected.verified?"Verified":"Challenger"}</span></div></div><div className="modal-stats"><div><small>Weighted XP</small><strong>{fmt(playerScore(selected))}</strong></div><div><small>Wagered</small><strong>{fmt(selected.points)}</strong></div><div><small>Last active</small><strong>{selected.lastActive ?? "Live"}</strong></div></div><Link href="/challenges">View missions <ArrowUpRight size={15} strokeWidth={2.5} aria-hidden="true" /></Link></article></div>}
  </main>;
}

function SeasonClock({
  error,
  lastUpdated,
  targetDate,
}: {
  error: boolean;
  lastUpdated: Date | null;
  targetDate: Date | null;
}) {
  const [now, setNow] = useState<number | null>(null);
  const validTarget = targetDate && !Number.isNaN(targetDate.getTime()) ? targetDate : null;

  useEffect(() => {
    if (!validTarget) return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [validTarget]);

  const remaining = validTarget && now !== null ? Math.max(0, validTarget.getTime() - now) : null;
  const countdown = validTarget
    ? [
        [remaining === null ? null : Math.floor(remaining / 86_400_000), "Days"],
        [remaining === null ? null : Math.floor((remaining / 3_600_000) % 24), "Hrs"],
        [remaining === null ? null : Math.floor((remaining / 60_000) % 60), "Min"],
        [remaining === null ? null : Math.floor((remaining / 1000) % 60), "Sec"],
      ] as const
    : null;

  return (
    <LiquidGlass as="aside" className="season-clock" depth="clear" tone="violet" aria-label="Leaderboard season status">
      <div className="season-clock__head">
        <span><Timer size={16} strokeWidth={2.5} aria-hidden="true" /> Season clock</span>
        <b>{error ? "Checking" : "Live"}</b>
      </div>
      <div className={`season-clock__digits ${countdown ? "" : "season-clock__digits--live"}`}>
        {countdown ? countdown.map(([value, label]) => (
          <span key={label}><strong>{value === null ? "--" : String(value).padStart(2, "0")}</strong><small>{label}</small></span>
        )) : (
          <>
            <span><strong>NOW</strong><small>Window</small></span>
            <span><strong>AUTO</strong><small>Updates</small></span>
          </>
        )}
      </div>
      <small className="season-clock__meta">
        {validTarget
          ? `Closes ${formatShortDate(validTarget)}`
          : lastUpdated
            ? `Feed ${formatLastUpdated(lastUpdated)}`
            : "Standings update automatically"}
      </small>
    </LiquidGlass>
  );
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

  const cardState = isVerified ? "is-verified" : isPending ? "is-pending" : "is-empty";
  const statusKey = isVerified ? "verified" : isPending ? "pending" : "empty";
  const statusLabel = isVerified ? "Verified" : isPending ? "Pending" : "Not linked";
  const verificationMethodLabel = detail?.verificationMethod === "KICK_OAUTH"
    ? "Auto-matched with Kick"
    : detail?.verificationMethod === "EMAIL_MATCH"
    ? "Matched with verified email"
    : "Security code verified";

  return (
    <article className={`casino-link-card ${cardState}`}>
      <div className="casino-link-card__head">
        <div>
          <h3>
            <span>{provider}</span>
            {provider === "shuffle" && (
              <small>Live affiliate wager</small>
            )}
          </h3>
        </div>
        <span className={`casino-status casino-status--${statusKey}`}>{statusLabel}</span>
      </div>

      {isVerified ? (
        <div className="casino-stack">
          <div className="casino-proof-box casino-proof-box--verified">
            <p>
              Username: <strong>@{detail?.username}</strong>
            </p>
            {detail?.email && (
              <p className="casino-muted">
                Casino Email: {detail.email}
              </p>
            )}
            <small>Points sync active - {verificationMethodLabel}</small>
          </div>
          <button
            type="button"
            className="button ghost casino-button casino-button--danger"
            onClick={handleUnlink}
            disabled={loading}
          >
            {loading ? "Unlinking..." : "Unlink Account"}
          </button>
        </div>
      ) : isPending ? (
        <div className="casino-stack">
          <div className="casino-proof-box casino-proof-box--pending">
            <p>
              Linked Handle: <strong>@{detail?.username}</strong>
            </p>
            {detail?.verificationCode && (
              <div className="casino-code-row">
                <span>Verification Code</span>
                <code>
                  {detail.verificationCode}
                </code>
              </div>
            )}
            <p className="casino-muted">
              To ensure players cannot impersonate each other, enter your code below or auto-verify with your Kick OAuth account.
            </p>
          </div>

          <div className="casino-inline-form">
            <input
              className="casino-input"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Enter code (e.g. RANK-1234)"
            />
            <button
              type="button"
              className="button primary casino-button"
              onClick={handleVerify}
              disabled={loading || !codeInput.trim()}
            >
              {loading ? "Verifying..." : "Confirm Code"}
            </button>
          </div>

          {account.connected.kick.connected && (
            <button
              type="button"
              className="button ghost casino-button casino-button--compact"
              onClick={handleAutoVerify}
              disabled={loading}
            >
              Auto-Verify with Kick (@{account.connected.kick.username})
            </button>
          )}

          <button
            type="button"
            className="button ghost casino-button casino-button--quiet"
            onClick={handleUnlink}
            disabled={loading}
          >
            Change or remove handle
          </button>
        </div>
      ) : (
        <div className="casino-stack">
          <div className="casino-mode-tabs" role="tablist" aria-label={`${provider} link mode`}>
            <button
              type="button"
              className={mode === "username" ? "active" : ""}
              onClick={() => setMode("username")}
            >
              By Username
            </button>
            <button
              type="button"
              className={mode === "email" ? "active" : ""}
              onClick={() => setMode("email")}
            >
              By Casino Email
            </button>
          </div>

          {mode === "username" ? (
            <input
              className="casino-input"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder={`Your ${provider} username`}
            />
          ) : (
            <div className="casino-stack casino-stack--tight">
              <input
                className="casino-input"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder={`Your ${provider} username`}
              />
              <input
                className="casino-input"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={`Your ${provider} account email`}
                type="email"
              />
            </div>
          )}

          <div className="casino-inline-form">
            <button
              type="button"
              className="button primary casino-button"
              onClick={() => handleLink()}
              disabled={loading || !usernameInput.trim()}
            >
              {loading ? "Linking..." : "Link & Verify"}
            </button>

            {kickName && (
              <button
                type="button"
                className="button ghost casino-button casino-button--compact"
                onClick={() => {
                  setUsernameInput(kickName);
                  handleLink(kickName);
                }}
                disabled={loading}
              >
                Auto-Link Kick (@{kickName})
              </button>
            )}
          </div>
        </div>
      )}

      {statusMsg && (
        <div className={`casino-status-message ${statusMsg.type}`}>
          {statusMsg.text}
        </div>
      )}
    </article>
  );
}

function Profile({ account }: { account: HeaderAccount }) {
  const [transactions, setTransactions] = useState<{ id: string; amount: number; reason: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [casinoAccounts, setCasinoAccounts] = useState<CasinoAccountDetail[]>(account.casinoAccounts ?? []);
  const isAdmin = isAdminHeaderAccount(account);

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

  useEffect(() => {
    if (isAdmin) {
      window.location.replace("/admin");
    }
  }, [isAdmin]);

  function reasonLabel(reason: string) {
    const map: Record<string, string> = {
      leaderboard_sync: "Leaderboard sync",
      store_purchase: "Store purchase",
      admin_grant: "Admin adjustment",
    };
    return map[reason] ?? reason;
  }

  function connectProvider(provider: "kick" | "discord") {
    window.location.assign(`/api/auth/${provider}`);
  }

  async function signOut() {
    setSessionBusy(true);
    await clearRankBoardSession();
    setSessionBusy(false);
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

  if (isAdmin) {
    return (
      <main>
        <section className="board-hero page-width">
          <div>
            <p className="kicker"><span>●</span> Admin lane</p>
            <h1>Opening Admin</h1>
            <p className="hero-desc">Your admin account is being sent to the control room.</p>
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

        <div className="casino-link-grid">
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

      <section className="section page-width section-tight">
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
          <div className="workspace-list workspace-list--flush">
            {transactions.map((t) => (
              <article key={t.id}>
                <span>{t.amount > 0 ? "Credit" : "Debit"}</span>
                <div>
                  <h3>{reasonLabel(t.reason)}</h3>
                  <p>{new Date(t.createdAt).toLocaleDateString()}</p>
                </div>
                <strong className={`transaction-delta ${t.amount < 0 ? "negative" : ""}`}>{t.amount > 0 ? "+" : ""}{fmt(t.amount)} PTS</strong>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section page-width section-tight">
        <div className="workspace-heading">
          <div>
            <p>Logins</p>
            <h2>Account controls</h2>
          </div>
        </div>
        <div className="connection-grid">
          <div className={`connection-card ${account.connected.kick.connected ? "connected" : ""}`}>
            <small>Kick</small>
            <h3>{account.connected.kick.connected ? account.connected.kick.username : "Not linked"}</h3>
            <p>{account.connected.kick.connected ? "Connected" : "Needed for watch points"}</p>
            <button type="button" onClick={() => connectProvider("kick")}>
              <RefreshCw size={14} strokeWidth={2.8} aria-hidden="true" />
              {account.connected.kick.connected ? "Reconnect Kick" : "Connect Kick"}
            </button>
          </div>
          <div className={`connection-card ${account.connected.discord.connected ? "connected" : ""}`}>
            <small>Discord</small>
            <h3>{account.connected.discord.connected ? account.connected.discord.username : "Not linked"}</h3>
            <p>{account.connected.discord.connected ? "Connected" : "Optional community login"}</p>
            <button type="button" onClick={() => connectProvider("discord")}>
              <RefreshCw size={14} strokeWidth={2.8} aria-hidden="true" />
              {account.connected.discord.connected ? "Reconnect Discord" : "Connect Discord"}
            </button>
          </div>
          <div className="connection-card connection-card--session">
            <small>Session</small>
            <h3>{account.handle}</h3>
            <p>{account.profileProvider.toUpperCase()} login active</p>
            <button className="connection-card__danger" type="button" onClick={signOut} disabled={sessionBusy}>
              <LogOut size={14} strokeWidth={2.8} aria-hidden="true" />
              {sessionBusy ? "Signing out" : "Logout"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Footer(){return <footer className="footer"><div className="footer-top page-width"><div><Link className="brand" href="/"><span className="brand-mark">R</span><span>RANK<span>BOARD</span></span></Link><p>Live rankings, missions, and rewards.<br/>Play responsibly · 18+</p></div><div className="footer-links">{[["Live Board","/leaderboard"],["Custom Bets","/custom-bets"],["Store","/store"],["Watch Points","/watch-points"],["Missions","/challenges"],["Profile","/profile"],["Support","/support"],["Privacy","/privacy"],["Terms","/terms"]].map(([n,h])=><Link key={h} href={h}>{n}<span>↗</span></Link>)}</div></div><div className="footer-bottom"><span>© 2026 RANKBOARD</span><span>THE BOARD IS LIVE <b>●</b></span><span>PLAY RESPONSIBLY · 18+</span></div></footer>}
