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
import { PrizeDropField, RevealBlock } from "./showcase-motion";
import SiteEntryLoader from "./site-entry-loader";
import StaggeredMenu from "./staggered-menu";
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

const launchpad: [string, string, string, string, ZoneIcon][] = [
  ["Board", "/leaderboard", "LB", "ember", Trophy],
  ["Bets", "/custom-bets", "BET", "mint", Coins],
  ["Missions", "/challenges", "XP", "violet", BadgeCheck],
  ["Watch", "/watch-points", "GO", "blue", Tv],
  ["Hunts", "/bonus-hunts", "H", "coral", Sparkles],
  ["Store", "/store", "PTS", "magma", Gift],
] as const;

const featurePageIcons: Record<string, ZoneIcon> = {
  challenges: BadgeCheck,
  "bonus-hunts": Sparkles,
  tournaments: Trophy,
  "wager-raffles": Gift,
  store: Gift,
  "custom-bets": Coins,
  "watch-points": Tv,
  admin: Crown,
  help: Search,
  support: BadgeCheck,
  login: BadgeCheck,
};

const pageData: Record<string, { title: string; tagline: string; action: [string, string] }> = {
  challenges: {
    title: "Missions",
    tagline: "Earn. Claim. Repeat.",
    action: ["Board", "/leaderboard"],
  },
  "bonus-hunts": {
    title: "Bonus Hunts",
    tagline: "Track. Vote. Win.",
    action: ["Tournaments", "/tournaments"],
  },
  tournaments: {
    title: "Tournaments",
    tagline: "Enter. Compete. Climb.",
    action: ["Board", "/leaderboard"],
  },
  "wager-raffles": {
    title: "Wager Raffles",
    tagline: "Wager → Tickets → Prizes.",
    action: ["Board", "/leaderboard"],
  },
  store: {
    title: "Reward Store",
    tagline: "Points. Redemption. Done.",
    action: ["Help", "/support"],
  },
  "custom-bets": {
    title: "Custom Bets",
    tagline: "Predict. Bet. Cash out.",
    action: ["Store", "/store"],
  },
  "watch-points": {
    title: "Watch Points",
    tagline: "Watch live. Earn passive.",
    action: ["Store", "/store"],
  },
  admin: {
    title: "Admin",
    tagline: "Command. Control. Ship.",
    action: ["Board", "/leaderboard"],
  },
  help: {
    title: "Help Center",
    tagline: "Answers fast.",
    action: ["Support", "/support"],
  },
  support: {
    title: "Support",
    tagline: "Report. Track. Resolve.",
    action: ["FAQ", "/help"],
  },
  login: {
    title: "Sign in",
    tagline: "Your rewards, saved.",
    action: ["Board", "/leaderboard"],
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
      <div className="site-tunnel-background" aria-hidden="true" />
      <div className="site-floating-rewards" aria-hidden="true">
        <span className="site-floating-reward site-floating-reward--crown"><Crown size={20} strokeWidth={2.4} /></span>
        <span className="site-floating-reward site-floating-reward--coins"><Coins size={20} strokeWidth={2.4} /></span>
        <span className="site-floating-reward site-floating-reward--gift"><Gift size={19} strokeWidth={2.5} /></span>
        <span className="site-floating-reward site-floating-reward--spark"><Sparkles size={19} strokeWidth={2.5} /></span>
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
      <span className="brand-mark">A</span>
      <span className="menu-logo-text">
        <span className="menu-logo-word">
          ARTZ<span>REWARDS</span>
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
        <Link className="desktop-nav__brand" href="/" aria-label="ARTZ Rewards home">
          <span className="desktop-nav__mark">A</span>
          <span className="desktop-nav__word">
            ARTZ<span>REWARDS</span>
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
            <button className="desktop-nav__logout" type="button" onClick={signOut} aria-label="Logout of ARTZ Rewards">
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
        colors={["#ff3cac", "#a148ff", "#d7ff3f"]}
        menuButtonColor="#ff4fac"
        openMenuButtonColor="#f8faf2"
        accentColor="#ff4fac"
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
  const { users, highestScore } = useLeaderboard();
  const wager = totalWager(users);
  const livePool = wager || highestScore || 40000;
  const livePoolLabel = formatPoolValue(livePool);

  return <main className="artz-home">
    <section className="product-hero product-hero--centered">
      <PrizeDropField className="hero-prize-drops" />
      <motion.div
        className="home-center-stage"
        initial={{ opacity: 0, y: 26, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.38, duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="home-welcome">Welcome to</span>
        <h1 className="home-artz-title"><span>ARTZ</span><strong>REWARDS</strong></h1>
        <p className="home-artz-subtitle">Play. Climb. Get rewarded.</p>
        <div className="home-hero-actions">
          <MagneticLink className="button secondary home-rewards-cta" href="/store">
            <Gift size={17} strokeWidth={2.7} aria-hidden="true" />
            View rewards
            <ArrowUpRight size={15} strokeWidth={2.7} aria-hidden="true" />
          </MagneticLink>
          <MagneticLink className="button primary home-board-cta" href="/leaderboard">
            <Trophy size={17} strokeWidth={2.7} aria-hidden="true" />
            View leaderboard
            <ArrowUpRight size={15} strokeWidth={2.7} aria-hidden="true" />
          </MagneticLink>
        </div>
        <div className="home-live-stat" aria-label={`Live pool ${livePoolLabel} points`}>
          <span><i /> Live pool</span>
          <AnimatedPoolNumber value={livePool} />
          <small>points</small>
        </div>
      </motion.div>
    </section>
    <section className="home-signal-dock" aria-label="Live ARTZ reward signals">
      <RevealBlock className="home-signal-dock__inner">
        <article className="home-signal home-signal--players">
          <span><Trophy size={19} strokeWidth={2.5} aria-hidden="true" /></span>
          <div><small>Players</small><strong>{users.length ? formatNumberCompact(users.length) : "Live"}</strong></div>
          <i aria-hidden="true" />
        </article>
        <article className="home-signal home-signal--earn">
          <span><Tv size={19} strokeWidth={2.5} aria-hidden="true" /></span>
          <div><small>Auto earn</small><strong>25 / 10s</strong></div>
          <i aria-hidden="true" />
        </article>
        <article className="home-signal home-signal--season">
          <span><Gift size={19} strokeWidth={2.5} aria-hidden="true" /></span>
          <div><small>Season</small><strong>08</strong></div>
          <i aria-hidden="true" />
        </article>
      </RevealBlock>
    </section>
    <section className="home-action-zone" aria-label="ARTZ Rewards destinations">
      <RevealBlock className="home-action-zone__inner">
        <div className="home-section-heading">
          <span>Rewards hub</span>
          <h2>Rewards <em>&amp;</em> Perks</h2>
          <p>Everything you need. Nothing you don&apos;t.</p>
        </div>
        <div className="home-route-strip">
          {launchpad.map(([title, href, badge, color, Icon]) => (
            <SpotlightRouteCard badge={badge} color={color} href={href} icon={Icon} key={href} title={title} />
          ))}
        </div>
      </RevealBlock>
    </section>
    <section className="home-board-showcase" aria-label="ARTZ leaderboard preview">
      <RevealBlock className="home-board-showcase__inner">
        <div className="home-section-heading">
          <span>Live rankings</span>
          <h2>Leader <em>Boards</em></h2>
          <p>Three spots. One crown.</p>
        </div>
        <div className="home-board-showcase__arena">
          <div className="home-board-showcase__pool">
            <span><i /> Live pool</span>
            <strong>{formatPoolDisplay(livePool)}</strong>
            <small>points</small>
          </div>
          <HeroPodium players={users.slice(0, 3)} />
          <MagneticLink className="button primary home-board-cta" href="/leaderboard">
            <Trophy size={17} strokeWidth={2.7} aria-hidden="true" />
            Open leaderboard
            <ArrowUpRight size={15} strokeWidth={2.7} aria-hidden="true" />
          </MagneticLink>
        </div>
      </RevealBlock>
    </section>
  </main>;
}

function HeroPodium({ players }: { players: Player[] }) {
  return (
    <motion.div
      className="home-hero-podium"
      initial={{ opacity: 0, y: 38, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.56, duration: 0.78, ease: [0.16, 1, 0.3, 1] }}
    >
      <h2 className="sr-only">Live top three</h2>
      <Podium players={players} compact />
    </motion.div>
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
  const [introDelay, setIntroDelay] = useState(0.78);
  const count = useMotionValue(0);
  const display = useTransform(count, (latest) => formatPoolDisplay(latest, fractionDigits));
  const displayLabel = formatPoolDisplay(value, fractionDigits);
  const fullLabel = formatter.format(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIntroDelay(0), 2400);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      count.set(value);
      return undefined;
    }

    const controls = animate(count, value, {
      delay: introDelay,
      duration: introDelay ? 1.45 : 0.85,
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
  badge,
  color,
  href,
  icon: Icon,
  title,
}: {
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
      <ArrowUpRight className="home-route-card__arrow" size={19} strokeWidth={2.7} aria-hidden="true" />
    </Link>
  );
}

function Podium({ players, compact = false }: { players: Player[]; compact?: boolean }) {
  const prizes: Record<number, string> = { 1: "$600", 2: "$325", 3: "$225" };

  if (players.length === 0) {
    return <div className={`podium ${compact ? "compact" : ""}`}>{[2, 1, 3].map((rank, idx) => <article className={`podium-card rank-${rank}`} key={rank}><div className="rank-badge">#{rank}</div><div className="prize-ribbon">{prizes[rank]}</div><div className="avatar"><span>AR</span></div><div className="podium-copy"><strong>Syncing</strong>{!compact && <small>Live</small>}<b>0 <em>XP</em></b>{!compact && <span>0 wagered</span>}</div>{idx === 1 && <div className="crown"><Crown size={22} fill="currentColor" aria-hidden="true" /></div>}</article>)}</div>;
  }

  const order = players.length === 3 ? [players[1], players[0], players[2]] : players;
  return <div className={`podium ${compact ? "compact" : ""}`}>{order.map((p, idx) => <article className={`podium-card rank-${p.rank}`} key={p.id}><div className="rank-badge">#{p.rank}</div><div className="prize-ribbon">{prizes[p.rank] ?? "PRIZE"}</div><div className="avatar"><span>{getInitials(p.name)}</span>{p.verified && <i><Check size={10} strokeWidth={3} aria-hidden="true" /></i>}</div><div className="podium-copy"><strong>{compact ? playerHandle(p) : playerName(p)}</strong>{!compact && <small>{playerHandle(p)}</small>}<b>{fmt(playerScore(p))} <em>XP</em></b>{!compact && <span>{fmt(p.points)} wagered</span>}</div>{idx === 1 && <div className="crown"><Crown size={22} fill="currentColor" aria-hidden="true" /></div>}</article>)}</div>;
}

function Leaderboard({ countdownTarget = null }: { countdownTarget?: string | null }) {
  const {
    users,
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
  const wagerStep = 500_000;
  const targetWager = Math.max(wagerStep, (Math.floor(wager / wagerStep) + 1) * wagerStep);
  const wagerProgress = Math.min(100, Math.round(((wager || 0) / targetWager) * 100));
  const targetDate = countdownTarget ? new Date(countdownTarget) : null;

  function refresh(){
    setRefreshing(true);
    retry();
    setTimeout(() => setRefreshing(false),650);
  }

  return <main>
    <section className="board-hero board-hero--leaderboard page-width">
      <PrizeDropField compact />
      <div><p className="kicker"><span>●</span> Live</p><h1>Leaderboard</h1></div>
      <SeasonClock error={Boolean(error)} lastUpdated={lastUpdated} targetDate={targetDate} />
    </section>
    <LiquidGlass as="section" className="leaderboard-progress page-width" tone="ember" aria-label="Season wager progress">
      <div className="progress-medal"><Trophy size={23} strokeWidth={2.7} aria-hidden="true" /></div>
      <div>
        <div className="progress-head"><span>Next drop</span><strong>{fmt(wager)} / {fmt(targetWager)}</strong><b>{wagerProgress}%</b></div>
        <div className="progress-bar"><i style={{ width: `${wagerProgress}%` }} /></div>
      </div>
    </LiquidGlass>
    <section className="board-top-three page-width" aria-label="Top three players">
      <div className="floor-top">
        <span>Top 3</span>
        <div className="live-pool">
          <small>Pool</small>
          <strong>$1,150</strong>
        </div>
        <span className="pulse-text">●</span>
      </div>
      <div className="winner-arena">
        <Podium players={users.slice(0, 3)} />
      </div>
    </section>
    <section className="section page-width board-section">
      <LiquidGlass className="standings" tone="cyan">
        <div className="board-controls"><label className="search"><Search size={16} strokeWidth={2.4} aria-hidden="true" /><input value={query} onChange={e=>{setQuery(e.target.value);setVisible(10)}} placeholder="Find a player…" aria-label="Search players"/></label><div className="segment"><button type="button" className={sort==="xp"?"active":""} onClick={()=>{setSort("xp");setVisible(10)}}>Top XP</button><button type="button" className={sort==="rank"?"active":""} onClick={()=>{setSort("rank");setVisible(10)}}>Rank</button></div><button type="button" className={`refresh ${refreshing?"spin":""}`} onClick={refresh} aria-label="Refresh leaderboard"><RefreshCw size={16} strokeWidth={2.4} aria-hidden="true" /></button></div>
        <div className="table-head"><span>Rank / Player</span><span>Status</span><span>XP</span><span>Wagered</span><span /></div>
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
    {selected && <div className="modal-backdrop" onClick={()=>setSelected(null)}><article className="player-modal" onClick={e=>e.stopPropagation()}><button type="button" onClick={()=>setSelected(null)} aria-label="Close"><X size={18} strokeWidth={2.5} aria-hidden="true" /></button><p>Player · #{selected.rank}</p><div className="modal-identity"><div className="avatar"><span>{getInitials(selected.name)}</span></div><div><h2>{playerName(selected)}</h2><span>{playerHandle(selected)} · {selected.verified?"Verified":"Challenger"}</span></div></div><div className="modal-stats"><div><small>XP</small><strong>{fmt(playerScore(selected))}</strong></div><div><small>Wagered</small><strong>{fmt(selected.points)}</strong></div><div><small>Active</small><strong>{selected.lastActive ?? "Live"}</strong></div></div><Link href="/challenges">Missions <ArrowUpRight size={15} strokeWidth={2.5} aria-hidden="true" /></Link></article></div>}
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
        <span><Timer size={16} strokeWidth={2.5} aria-hidden="true" /> Countdown</span>
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
            ? `Updated ${formatLastUpdated(lastUpdated)}`
            : "Auto-updates"}
      </small>
    </LiquidGlass>
  );
}

function PlayerRow({ player, leader, onOpen }: { player: Player; leader: number; onOpen: () => void }) { const score = playerScore(player); return <button type="button" className={`player-row rank-row-${player.rank}`} onClick={onOpen}><div className="player-cell"><b className="row-rank">{String(player.rank).padStart(2,"0")}</b><div className="mini-avatar">{getInitials(player.name)}</div><span><strong>{playerName(player)}{player.verified&&<i><Check size={10} strokeWidth={3} aria-hidden="true" /></i>}</strong><small>{playerHandle(player)}</small></span></div><div><span className={player.rank<7?"status hot":"status live"}>{player.rank<7?"HOT":"LIVE"}</span></div><div className="xp-cell"><strong>{fmt(score)} <small>XP</small></strong><span><i style={{width:`${leader > 0 ? (score/leader)*100 : 0}%`}}/></span></div><strong className="wager">{fmt(player.points)}</strong><span className="open-row"><ArrowUpRight size={16} strokeWidth={2.5} aria-hidden="true" /></span></button> }

function FeaturePage({ route, data }: { route: string; data: { title: string; tagline: string; action: [string, string] } }) {
  const Icon = featurePageIcons[route] ?? Sparkles;
  return <main>
    <section className="board-hero feature-page-hero page-width">
      <PrizeDropField compact />
      <motion.div
        className="feature-page-hero__inner"
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.42, duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="feature-page-hero__icon"><Icon size={28} strokeWidth={2.6} aria-hidden="true" /></span>
        <div><p className="kicker"><span>●</span> Season 08</p><h1>{data.title}</h1></div>
        <Link className="feature-page-hero__action" href={data.action[1]} title={data.action[0]}><span>{data.action[0]}</span><ArrowUpRight size={18} strokeWidth={2.7} aria-hidden="true" /></Link>
      </motion.div>
    </section>
    <FeatureWorkspace route={route} />
  </main>;
}

function Legal({ type }: { type: string }) { const privacy=type==="privacy"; return <main className="legal page-width"><p className="kicker"><span>●</span> ARTZ Rewards legal</p><h1>{privacy?"Privacy":"Terms"}<em>.</em></h1><p className="legal-lead">{privacy?"How ARTZ Rewards handles your data.":"The rules for playing fair."}</p><div className="legal-layout"><aside><span>Last updated</span><strong>Aug 13, 2026</strong><Link href={privacy?"/terms":"/privacy"}>{privacy?"Read terms":"Read privacy"} ↗</Link></aside><article>{(privacy?[["1. Information we use","ARTZ Rewards may process account identifiers, leaderboard activity, reward progress, and basic device information needed to operate the product."],["2. Why we use it","We use this information to display ranks, maintain reward progress, protect the floor, and respond to support requests."],["3. Your choices","Players may request access, correction, or deletion of eligible account information through support."],["4. Data protection","Reasonable technical and organizational safeguards are used to protect information from unauthorized access."]]:[["1. Using ARTZ Rewards","Use the product lawfully, keep account access secure, and do not interfere with rankings, missions, or other players."],["2. Rankings and rewards","Rank calculations, challenge eligibility, and rewards may be reviewed when activity appears invalid, duplicated, or manipulated."],["3. Fair play","Automation, exploit attempts, false identities, and coordinated manipulation can lead to removal from a round."],["4. Availability","Live data can briefly lag or become unavailable. The latest verified state remains the basis for ranking decisions."]]).map(([h,p])=><section key={h}><h2>{h}</h2><p>{p}</p></section>)}</article></div></main> }


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
            <small>Sync active · {verificationMethodLabel}</small>
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
              Anti-spoof: enter your code or auto-verify with Kick.
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
            Change handle
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
              placeholder={`${provider} username`}
            />
          ) : (
            <div className="casino-stack casino-stack--tight">
              <input
                className="casino-input"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder={`${provider} username`}
              />
              <input
                className="casino-input"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={`${provider} email`}
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
            <p className="hero-desc">Sign in to see points, links & history.</p>
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
            <p className="hero-desc">Redirecting to control room.</p>
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
            <p>Casino Links</p>
            <h2>Verified Accounts</h2>
          </div>
          <span>Verified only. No impersonation.</span>
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
            <h2>Connections</h2>
          </div>
        </div>
        <div className="connection-grid">
          <div className={`connection-card ${account.connected.kick.connected ? "connected" : ""}`}>
            <small>Kick</small>
            <h3>{account.connected.kick.connected ? account.connected.kick.username : "Not linked"}</h3>
            <p>{account.connected.kick.connected ? "Connected" : "For watch points"}</p>
            <button type="button" onClick={() => connectProvider("kick")}>
              <RefreshCw size={14} strokeWidth={2.8} aria-hidden="true" />
              {account.connected.kick.connected ? "Reconnect" : "Connect"}
            </button>
          </div>
          <div className={`connection-card ${account.connected.discord.connected ? "connected" : ""}`}>
            <small>Discord</small>
            <h3>{account.connected.discord.connected ? account.connected.discord.username : "Not linked"}</h3>
            <p>{account.connected.discord.connected ? "Connected" : "Optional"}</p>
            <button type="button" onClick={() => connectProvider("discord")}>
              <RefreshCw size={14} strokeWidth={2.8} aria-hidden="true" />
              {account.connected.discord.connected ? "Reconnect" : "Connect"}
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

function Footer() {
  const links = [
    ["Board", "/leaderboard"],
    ["Bets", "/custom-bets"],
    ["Store", "/store"],
    ["Watch", "/watch-points"],
    ["Missions", "/challenges"],
    ["Profile", "/profile"],
    ["Support", "/support"],
    ["Privacy", "/privacy"],
    ["Terms", "/terms"],
  ];

  return (
    <footer className="footer">
      <div className="footer-top page-width">
        <div>
          <Link className="brand" href="/"><span className="brand-mark">A</span><span>ARTZ<span>REWARDS</span></span></Link>
          <p>Live rewards by ARTZ. Play responsibly · 18+</p>
        </div>
        <div className="footer-links">
          {links.map(([name, href]) => (
            <Link key={href} href={href}>{name}<ArrowUpRight size={13} strokeWidth={2.6} aria-hidden="true" /></Link>
          ))}
        </div>
      </div>
      <div className="footer-bottom"><span>© 2026 ARTZ REWARDS</span><span>LIVE <b>●</b></span></div>
    </footer>
  );
}
