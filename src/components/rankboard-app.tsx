"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  Coins,
  Crown,
  Gift,
  Flame,
  LogOut,
  Radio,
  RefreshCw,
  Search,
  Sparkles,
  Timer,
  Trophy,
  Tv,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import CustomCursor from "./custom-cursor";
import FeatureWorkspace from "./feature-workspace";
import LiquidGlass from "./liquid-glass";
import { PrizeDropField, RevealBlock } from "./showcase-motion";
import SiteEntryLoader from "./site-entry-loader";
import StaggeredMenu from "./staggered-menu";
import ArtzStageBackground from "./artz-stage-background";
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
  ["Leaderboard", "/leaderboard"],
  ["Missions", "/challenges"],
  ["Bets", "/custom-bets"],
  ["Bonus Hunts", "/bonus-hunts"],
  ["Tournaments", "/tournaments"],
  ["Store", "/store"],
  ["Admin", "/admin"],
] as const;

const DESKTOP_NAV = [
  ["Home", "/"],
  ["Leaderboard", "/leaderboard"],
  ["Missions", "/challenges"],
  ["Bets", "/custom-bets"],
  ["Bonus Hunts", "/bonus-hunts"],
  ["Tournaments", "/tournaments"],
  ["Store", "/store"],
] as const;

const launchpad: [string, string, string, string, ZoneIcon][] = [
  ["Leaderboard", "/leaderboard", "LB", "ember", Trophy],
  ["Bets", "/custom-bets", "BET", "mint", Coins],
  ["Missions", "/challenges", "PTS", "violet", BadgeCheck],
  ["Bonus Hunts", "/bonus-hunts", "LIVE", "blue", Flame],
  ["Tournaments", "/tournaments", "VS", "coral", Trophy],
  ["Store", "/store", "PTS", "magma", Gift],
] as const;

const featurePageIcons: Record<string, ZoneIcon> = {
  challenges: BadgeCheck,
  tournaments: Trophy,
  "bonus-hunts": Flame,
  store: Gift,
  "custom-bets": Coins,
  "watch-points": Tv,
  admin: Crown,
  help: Search,
  support: BadgeCheck,
  login: BadgeCheck,
};

const featurePageOrnaments: Record<string, CasinoOrnamentVariant> = {
  challenges: "candy-tumble",
  tournaments: "olympus-scatter",
  "bonus-hunts": "olympus-scatter",
  store: "holiday-drop",
  "custom-bets": "neon-city",
  "watch-points": "candy-tumble",
  admin: "vault",
  help: "vault",
  support: "vault",
  login: "vault",
};

type CasinoOrnamentVariant =
  | "candy-tumble"
  | "holiday-drop"
  | "neon-city"
  | "olympus-scatter"
  | "gold-bars"
  | "dice-chips"
  | "vault"
  | "slot-reels";

const casinoOrnamentImages: Record<CasinoOrnamentVariant, string> = {
  "candy-tumble": "/artz-candy-tumble.webp",
  "holiday-drop": "/artz-holiday-drop.webp",
  "neon-city": "/artz-neon-city.webp",
  "olympus-scatter": "/artz-olympus-scatter.webp",
  "gold-bars": "/artz-gold-bars.webp",
  "dice-chips": "/artz-dice-chips.webp",
  vault: "/artz-vault-jackpot.webp",
  "slot-reels": "/artz-slot-reels.webp",
};

const pageData: Record<string, { title: string; tagline: string; action: [string, string] }> = {
  challenges: {
    title: "Missions",
    tagline: "Earn. Claim. Repeat.",
    action: ["Leaderboard", "/leaderboard"],
  },
  tournaments: {
    title: "Tournaments",
    tagline: "Enter. Compete. Climb.",
    action: ["Leaderboard", "/leaderboard"],
  },
  "bonus-hunts": {
    title: "Bonus Hunts",
    tagline: "Follow the hunt. Catch the biggest hits.",
    action: ["Leaderboard", "/leaderboard"],
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
    action: ["Leaderboard", "/leaderboard"],
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
    action: ["Leaderboard", "/leaderboard"],
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

type HeaderAccount = {
  handle: string;
  image: string;
  email?: string;
  profileProvider: "kick" | "discord" | "email";
  points: number;
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

type HomeWatchSummary = {
  connected: boolean;
  running: boolean;
  verified: boolean;
  verificationMessage: string;
  streamLive: boolean;
  totalSecondsToday: number;
  earnedPointsToday: number;
  rateLabel: string;
  points: number;
};

type PublicKickStream = {
  channelSlug: string;
  isLive: boolean;
  startedAt: string | null;
  endedAt: string | null;
  lastEventAt: string | null;
  checkedAt: string | null;
  source: "kick_api" | "webhook";
};

const guestHeaderAccount: HeaderAccount = {
  handle: "@guest",
  image: "",
  profileProvider: "email",
  points: 0,
  authenticated: false,
  badges: [],
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

  if (!isAuth) {
    return guestHeaderAccount;
  }

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

    async function syncFromSession() {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Session check failed.");
        }
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
        } else {
          setAccount(guestHeaderAccount);
          window.localStorage.removeItem("rankboard-account");
        }
      } catch {
        if (active) {
          setAccount(guestHeaderAccount);
          window.localStorage.removeItem("rankboard-account");
        }
      }
    }

    function refreshFromSession() {
      void syncFromSession();
    }

    void syncFromSession();
    const refreshWhenActive = () => {
      if (document.visibilityState === "visible") void syncFromSession();
    };
    const refreshInterval = window.setInterval(refreshWhenActive, 30_000);
    window.addEventListener("storage", refreshFromSession);
    window.addEventListener("rankboard-storage", refreshFromSession);
    window.addEventListener("focus", refreshWhenActive);
    document.addEventListener("visibilitychange", refreshWhenActive);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener("storage", refreshFromSession);
      window.removeEventListener("rankboard-storage", refreshFromSession);
      window.removeEventListener("focus", refreshWhenActive);
      document.removeEventListener("visibilitychange", refreshWhenActive);
    };
  }, []);

  return [account, setAccount] as const;
}

export default function RankBoardApp({
  route = "",
  countdownTarget = null,
}: {
  route?: string;
  countdownTarget?: string | null;
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [account, setAccount] = useHeaderAccount();
  return (
    <div className="site-shell">
      <div className="site-tunnel-background" aria-hidden="true">
        <ArtzStageBackground />
      </div>
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
        <SiteBanner />
      </div>
      {route === "" ? <Home account={account} setAccount={setAccount} /> : route === "leaderboard" ? <Leaderboard countdownTarget={countdownTarget} /> : route === "privacy" || route === "terms" ? <Legal type={route} /> : route === "profile" ? <Profile account={account} /> : <FeaturePage route={route} data={pageData[route] ?? pageData.help} />}
      <Footer />
    </div>
  );
}

type SiteBannerPayload = {
  announcement: string;
  banner: string;
  promotion: string;
};

function SiteBanner() {
  const [banner, setBanner] = useState<SiteBannerPayload | null>(null);

  useEffect(() => {
    let active = true;

    async function refreshBanner() {
      try {
        const response = await fetch("/api/site/banners", { cache: "no-store" });
        const payload = (await response.json()) as { banner?: SiteBannerPayload; error?: string };
        if (!active) return;
        if (response.ok && payload.banner) setBanner(payload.banner);
      } catch {
        // Keep showing the last known banner on transient errors.
      }
    }

    void refreshBanner();
    const timer = window.setInterval(refreshBanner, 30_000);
    const onFocus = () => { void refreshBanner(); };
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const items = banner
    ? ([
        ["announcement", banner.announcement],
        ["banner", banner.banner],
        ["promotion", banner.promotion],
      ] as const).filter(([, value]) => value.trim().length > 0)
    : [];

  if (items.length === 0) return null;

  return (
    <div className="site-banner-strip" role="status">
      <div className="site-banner-strip__track">
        {items.map(([kind, value]) => (
          <span className={`site-banner-strip__item site-banner-strip__item--${kind}`} key={kind}>
            {value}
          </span>
        ))}
      </div>
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
      <LiquidGlass as="nav" className="desktop-nav" depth="clear" interactive={false} tone="violet" aria-label="Primary navigation">
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
              <strong>{account.authenticated ? cleanHandle : "Guest"}</strong>
              <small>{accountStatus} · {formatNumberCompact(account.points)} PTS</small>
            </span>
          </Link>
          {account.authenticated ? (
            <button className="desktop-nav__logout" type="button" onClick={signOut} aria-label="Logout of ARTZ Rewards" title="Logout">
              <LogOut size={15} strokeWidth={2.6} aria-hidden="true" />
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
        colors={["#ff7a1a", "#ffb02e", "#d7ff3f"]}
        menuButtonColor="#ff4d6d"
        openMenuButtonColor="#f8faf2"
        accentColor="#ff4d6d"
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

function Home({
  account,
  setAccount,
}: {
  account: HeaderAccount;
  setAccount: Dispatch<SetStateAction<HeaderAccount>>;
}) {
  const { users } = useLeaderboard();

  return <main className="artz-home">
    <section className="product-hero product-hero--centered">
      <PrizeDropField className="hero-prize-drops" />
      <div className="hero-casino-props" aria-hidden="true">
        <motion.figure
          className="hero-casino-prop hero-casino-prop--left"
          initial={{ opacity: 0, x: -46, rotate: -16, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, rotate: -8, scale: 1 }}
          transition={{ delay: 0.62, duration: 0.86, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image src="/artz-candy-tumble.webp" alt="" width={768} height={768} priority sizes="(max-width: 760px) 150px, 300px" />
        </motion.figure>
        <motion.figure
          className="hero-casino-prop hero-casino-prop--right"
          initial={{ opacity: 0, x: 46, rotate: 18, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, rotate: 9, scale: 1 }}
          transition={{ delay: 0.72, duration: 0.86, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image src="/artz-olympus-scatter.webp" alt="" width={768} height={768} priority sizes="(max-width: 760px) 150px, 300px" />
        </motion.figure>
      </div>
      <motion.div
        className="home-center-stage"
        initial={{ opacity: 0, y: 26, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.38, duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="home-hero-emblem" aria-hidden="true"><Crown size={22} strokeWidth={2.5} /><b>A</b></span>
        <span className="home-welcome">ARTZ presents</span>
        <h1 className="home-artz-title" aria-label="ARTZ Rewards">
          <PlayfulWord text="ARTZ" />
          <PlayfulWord accent text="Rewards" />
        </h1>
        <p className="home-artz-subtitle">Play. Climb. Win.</p>
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
      </motion.div>
      <HomeKickStream account={account} setAccount={setAccount} />
    </section>
    <section className="home-action-zone" aria-label="ARTZ Rewards destinations">
      <RevealBlock className="home-action-zone__inner">
        <div className="home-section-heading">
          <span>Rewards hub</span>
          <h2>Rewards <em>&amp;</em> Perks</h2>
          <p>Everything you need. Nothing you don&apos;t.</p>
        </div>
        <motion.figure
          className="home-lucky-slot"
          aria-hidden="true"
          initial={{ opacity: 0, y: 30, rotate: 15, scale: 0.78 }}
          whileInView={{ opacity: 1, y: 0, rotate: 7, scale: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.82, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image src="/artz-holiday-drop.webp" alt="" width={768} height={768} sizes="(max-width: 780px) 132px, 220px" />
          <span><Sparkles size={18} strokeWidth={2.4} /></span>
        </motion.figure>
        <CasinoOrnament className="home-gold-bars" variant="gold-bars" reveal delay={0.12} />
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
          <p>Every player counts. Your move.</p>
        </div>
        <div className="home-board-showcase__arena">
          <motion.figure
            className="home-board-slots"
            aria-hidden="true"
            initial={{ opacity: 0, x: -34, y: 28, rotate: -20, scale: 0.78 }}
            whileInView={{ opacity: 1, x: 0, y: 0, rotate: -9, scale: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.88, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image src="/artz-neon-city.webp" alt="" width={768} height={768} sizes="(max-width: 780px) 124px, 236px" />
            <span><Sparkles size={17} strokeWidth={2.5} /></span>
          </motion.figure>
          <CasinoOrnament className="home-dice-chips" variant="dice-chips" reveal delay={0.18} />
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

function HomeKickStream({
  account,
  setAccount,
}: {
  account: HeaderAccount;
  setAccount: Dispatch<SetStateAction<HeaderAccount>>;
}) {
  const [stream, setStream] = useState<PublicKickStream | null>(null);
  const [summary, setSummary] = useState<HomeWatchSummary | null>(null);
  const [streamMessage, setStreamMessage] = useState("Checking channel");
  const heartbeatActive = useRef(false);
  const kickConnected = account.authenticated && account.connected.kick.connected;

  const applySummary = useCallback((nextSummary: HomeWatchSummary) => {
    setSummary(nextSummary);
    setAccount((current) => ({
      ...current,
      points: nextSummary.points,
    }));
  }, [setAccount]);

  useEffect(() => {
    let active = true;

    async function refreshStream() {
      try {
        const response = await fetch("/api/kick/stream", { cache: "no-store" });
        const payload = (await response.json()) as { stream?: PublicKickStream; error?: string };
        if (!active) return;
        if (!response.ok || !payload.stream) {
          throw new Error(payload.error ?? "Channel unavailable");
        }
        setStream(payload.stream);
      } catch (error) {
        if (active) setStreamMessage(error instanceof Error ? error.message : "Channel unavailable");
      }
    }

    void refreshStream();
    const timer = window.setInterval(refreshStream, 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!account.authenticated) {
      return () => { active = false; };
    }

    if (!kickConnected) {
      return () => { active = false; };
    }

    async function sendHeartbeat() {
      if (document.visibilityState !== "visible" || heartbeatActive.current) return;
      heartbeatActive.current = true;
      try {
        const response = await fetch("/api/watch-points/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ running: true }),
        });
        const payload = (await response.json()) as { summary?: HomeWatchSummary; error?: string };
        if (!active) return;
        if (!response.ok || !payload.summary) {
          throw new Error(payload.error ?? "Auto earn unavailable");
        }
        applySummary(payload.summary);
        setStreamMessage(`Auto earning ${payload.summary.rateLabel}`);
      } catch (error) {
        if (active) setStreamMessage(error instanceof Error ? error.message : "Auto earn unavailable");
      } finally {
        heartbeatActive.current = false;
      }
    }

    async function loadSummary() {
      try {
        const response = await fetch("/api/watch-points", { cache: "no-store" });
        const payload = (await response.json()) as { summary?: HomeWatchSummary; error?: string };
        if (!active) return;
        if (!response.ok || !payload.summary) {
          throw new Error(payload.error ?? "Auto earn unavailable");
        }
        applySummary(payload.summary);
        setStreamMessage(payload.summary.verified ? `Auto earning ${payload.summary.rateLabel}` : payload.summary.verificationMessage);
        await sendHeartbeat();
      } catch (error) {
        if (active) setStreamMessage(error instanceof Error ? error.message : "Auto earn unavailable");
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void sendHeartbeat();
        return;
      }

      void fetch("/api/watch-points/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ running: false }),
        keepalive: true,
      }).catch(() => null);
    }

    void loadSummary();
    const timer = window.setInterval(sendHeartbeat, 10000);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void fetch("/api/watch-points/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ running: false }),
        keepalive: true,
      }).catch(() => null);
    };
  }, [account.authenticated, applySummary, kickConnected]);

  const playerUrl = stream?.channelSlug
    ? `https://player.kick.com/${encodeURIComponent(stream.channelSlug)}?autoplay=true&muted=true`
    : "";
  const isLive = stream?.isLive ?? summary?.streamLive ?? false;
  const earningMessage = !account.authenticated
    ? "Sign in with Kick to earn"
    : !kickConnected
      ? "Connect Kick to earn"
      : streamMessage;

  return (
    <motion.section
      className={`home-kick-stream${isLive ? " is-live" : ""}`}
      id="live"
      initial={{ opacity: 0, y: 28, rotate: -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: -0.45 }}
      transition={{ delay: 0.82, duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Kick livestream"
    >
      <div className="home-kick-stream__bar">
        <span className="home-kick-stream__status"><i />{isLive ? "Live now" : "Channel offline"}</span>
        <strong>{stream?.channelSlug ? `@${stream.channelSlug}` : "Kick stream"}</strong>
        <span className="home-kick-stream__earning"><Radio size={15} strokeWidth={2.6} aria-hidden="true" />{earningMessage}</span>
      </div>
      <div className="home-kick-stream__player">
        {playerUrl ? (
          <iframe
            src={playerUrl}
            title={`${stream?.channelSlug ?? "Kick"} livestream`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            scrolling="no"
          />
        ) : (
          <div className="home-kick-stream__empty"><Tv size={34} strokeWidth={2.1} /><span>{earningMessage}</span></div>
        )}
      </div>
      <div className="home-kick-stream__footer">
        <span><small>Earned today</small><strong>{fmt(summary?.earnedPointsToday)} PTS</strong></span>
        <span><small>Total balance</small><strong>{fmt(summary?.points ?? account.points)} PTS</strong></span>
        <a href={stream?.channelSlug ? `https://kick.com/${stream.channelSlug}` : "https://kick.com"} target="_blank" rel="noreferrer">
          Open Kick <ArrowUpRight size={14} strokeWidth={2.7} aria-hidden="true" />
        </a>
      </div>
    </motion.section>
  );
}

function PlayfulWord({ accent = false, text }: { accent?: boolean; text: string }) {
  return (
    <span className={`playful-word${accent ? " playful-word--accent" : ""}`} aria-hidden="true">
      {[...text].map((character, index) => (
        <i key={`${character}-${index}`}>{character}</i>
      ))}
    </span>
  );
}

function CasinoOrnament({
  className,
  delay = 0,
  reveal = false,
  variant,
}: {
  className?: string;
  delay?: number;
  reveal?: boolean;
  variant: CasinoOrnamentVariant;
}) {
  const figureClass = `casino-ornament casino-ornament--${variant}${className ? ` ${className}` : ""}`;
  const motionProps = reveal
    ? {
        initial: { opacity: 0, y: 28, scale: 0.78, rotate: variant === "dice-chips" ? 12 : -10 },
        whileInView: { opacity: 1, y: 0, scale: 1, rotate: 0 },
        viewport: { once: true, amount: 0.2 },
      }
    : {
        initial: { opacity: 0, x: 28, y: 14, scale: 0.76, rotate: 8 },
        animate: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 },
      };

  return (
    <motion.figure
      {...motionProps}
      className={figureClass}
      aria-hidden="true"
      transition={{ delay, duration: 0.78, ease: [0.16, 1, 0.3, 1] }}
    >
      <Image
        src={casinoOrnamentImages[variant]}
        alt=""
        width={920}
        height={920}
        sizes="(max-width: 780px) 116px, 220px"
      />
      <span><Sparkles size={16} strokeWidth={2.6} /></span>
    </motion.figure>
  );
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
  const handlePointerMove = useCallback((event: PointerEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--spotlight-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--spotlight-y", `${event.clientY - rect.top}px`);
    event.currentTarget.style.setProperty("--spotlight-opacity", "1");
  }, []);

  return (
    <Link
      className={`home-route-card ${color}`}
      href={href}
      onPointerLeave={(event) => event.currentTarget.style.setProperty("--spotlight-opacity", "0")}
      onPointerMove={handlePointerMove}
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
    return <div className={`podium ${compact ? "compact" : ""}`}>{[2, 1, 3].map((rank, idx) => <article className={`podium-card rank-${rank}`} key={rank}><div className="rank-badge">#{rank}</div><div className="prize-ribbon">{prizes[rank]}</div><div className="avatar"><span>AR</span></div><div className="podium-copy"><strong>Syncing</strong>{compact ? <b>0 <em>SCORE</em></b> : <span><b>0</b> wagered</span>}</div>{idx === 1 && <div className="crown"><Crown size={22} fill="currentColor" aria-hidden="true" /></div>}</article>)}</div>;
  }

  const order = players.length === 3 ? [players[1], players[0], players[2]] : players;
  return <div className={`podium ${compact ? "compact" : ""}`}>{order.map((p, idx) => <article className={`podium-card rank-${p.rank}`} key={p.id}><div className="rank-badge">#{p.rank}</div><div className="prize-ribbon">{prizes[p.rank] ?? "PRIZE"}</div><div className="avatar"><span>{getInitials(p.name)}</span>{p.verified && <i><Check size={10} strokeWidth={3} aria-hidden="true" /></i>}</div><div className="podium-copy"><strong>{compact ? playerHandle(p) : playerName(p)}</strong>{compact ? <b>{fmt(playerScore(p))} <em>SCORE</em></b> : <span><b>{fmt(p.points)}</b> wagered</span>}</div>{idx === 1 && <div className="crown"><Crown size={22} fill="currentColor" aria-hidden="true" /></div>}</article>)}</div>;
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
  const [visible, setVisible] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const filtered = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    const results = trimmedQuery
      ? users.filter((player) =>
          getSearchableNames(player).some((name) =>
            name.toLowerCase().includes(trimmedQuery)
          )
        )
      : [...users];

    results.sort((a,b) => a.rank-b.rank);
    return results;
  }, [users, query]);
  const visiblePlayers = filtered.slice(0, visible);
  const targetDate = countdownTarget ? new Date(countdownTarget) : null;

  function refresh(){
    setRefreshing(true);
    retry();
    setTimeout(() => setRefreshing(false),650);
  }

  return <main>
    <section className="board-hero board-hero--leaderboard page-width">
      <PrizeDropField compact />
      <div className="board-hero__title">
        <p className="board-hero__badge"><i />Season 08 · Live now</p>
        <h1><span>Monthly</span> Leaderboard</h1>
        <p className="board-hero__sub">Top wagers take the pot. No fluff, just hits.</p>
      </div>
      <SeasonClock error={Boolean(error)} lastUpdated={lastUpdated} targetDate={targetDate} />
    </section>
    <section className="board-top-three page-width" aria-label="Top three players">
      <div className="board-prize-spotlight" aria-label="Total prize pool: $1,150">
        <span className="prize-ticket__coin" aria-hidden="true"><Trophy size={26} strokeWidth={2.4} /></span>
        <span className="prize-ticket__main">
          <small><i />Prize pot · paid in cash</small>
          <strong>$1,150</strong>
        </span>
        <span className="prize-ticket__splits">
          <b className="split split--first">1st · $600</b>
          <b className="split split--second">2nd · $325</b>
          <b className="split split--third">3rd · $225</b>
        </span>
      </div>
      <CasinoOrnament className="leaderboard-gold-bars" variant="olympus-scatter" reveal delay={0.08} />
      <div className="winner-arena">
        <Podium players={users.slice(0, 3)} />
      </div>
    </section>
    <section className="section page-width board-section">
      <LiquidGlass className="standings" tone="cyan">
        <div className="board-controls"><label className="search"><Search size={16} strokeWidth={2.4} aria-hidden="true" /><input value={query} onChange={e=>{setQuery(e.target.value);setVisible(10)}} placeholder="Find a player…" aria-label="Search players"/></label><button type="button" className={`refresh ${refreshing?"spin":""}`} onClick={refresh} aria-label="Refresh leaderboard"><RefreshCw size={16} strokeWidth={2.4} aria-hidden="true" /></button></div>
        <div className="table-head"><span>Rank / Player</span><span>Wagered</span></div>
        <div className="player-list" aria-live="polite">
          {error ? (
            <div className="empty-state"><span>!</span><h3>The leaderboard blinked.</h3><button type="button" onClick={refresh}>Try again</button></div>
          ) : isLoading && users.length === 0 ? (
            Array.from({ length: 8 }).map((_, index) => <div className="skeleton-row" key={index}><i/><span><i/><i/></span></div>)
          ) : visiblePlayers.length ? (
            visiblePlayers.map(p=><PlayerRow key={p.id} player={p} />)
          ) : (
            <div className="empty-state"><span><Search size={34} strokeWidth={1.8} aria-hidden="true" /></span><h3>Nobody here.</h3><button type="button" onClick={()=>setQuery("")}>Clear search</button></div>
          )}
        </div>
        {filtered.length > visible && !error && <button type="button" className="load-more" onClick={()=>setVisible(v=>v+8)}>Load more <span>{Math.min(visible,filtered.length)} / {filtered.length}</span></button>}
      </LiquidGlass>
    </section>
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
    const initial = window.setTimeout(() => setNow(Date.now()), 0);
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
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
        <span><Timer size={16} strokeWidth={2.5} aria-hidden="true" /> Round ends in</span>
        <i className="season-clock__live" aria-hidden="true" />
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
        {error
          ? "Syncing season data"
          : validTarget
          ? `Closes ${formatShortDate(validTarget)}`
          : lastUpdated
            ? `Updated ${formatLastUpdated(lastUpdated)}`
            : "Auto-updates"}
      </small>
    </LiquidGlass>
  );
}

function PlayerRow({ player }: { player: Player }) {
  return <div className={`player-row rank-row-${player.rank}`}><div className="player-cell"><b className="row-rank">{String(player.rank).padStart(2,"0")}</b><div className="mini-avatar">{getInitials(player.name)}</div><span><strong>{playerName(player)}{player.verified&&<i><Check size={10} strokeWidth={3} aria-hidden="true" /></i>}</strong></span></div><strong className="wager">{fmt(player.points)} <small>wagered</small></strong></div>;
}

function FeaturePage({ route, data }: { route: string; data: { title: string; tagline: string; action: [string, string] } }) {
  const Icon = featurePageIcons[route] ?? Sparkles;
  const ornament = featurePageOrnaments[route] ?? "slot-reels";
  return <main>
    <section className="board-hero feature-page-hero page-width">
      <PrizeDropField compact />
      <CasinoOrnament className="feature-casino-ornament" variant={ornament} delay={0.48} />
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

function Legal({ type }: { type: string }) {
  const privacy = type === "privacy";
  const sections = privacy
    ? [["1. Information we use", "ARTZ Rewards may process account identifiers, leaderboard activity, reward progress, and basic device information needed to operate the product."], ["2. Why we use it", "We use this information to display ranks, maintain reward progress, protect the floor, and respond to support requests."], ["3. Your choices", "Players may request access, correction, or deletion of eligible account information through support."], ["4. Data protection", "Reasonable technical and organizational safeguards are used to protect information from unauthorized access."]]
    : [["1. Using ARTZ Rewards", "Use the product lawfully, keep account access secure, and do not interfere with rankings, missions, or other players."], ["2. Rankings and rewards", "Rank calculations, challenge eligibility, and rewards may be reviewed when activity appears invalid, duplicated, or manipulated."], ["3. Fair play", "Automation, exploit attempts, false identities, and coordinated manipulation can lead to removal from a round."], ["4. Availability", "Live data can briefly lag or become unavailable. The latest verified state remains the basis for ranking decisions."]];

  return (
    <main className="legal page-width">
      <CasinoOrnament className="legal-vault" variant="vault" delay={0.3} />
      <p className="kicker"><span>●</span> ARTZ Rewards legal</p>
      <h1>{privacy ? "Privacy" : "Terms"}<em>.</em></h1>
      <p className="legal-lead">{privacy ? "How ARTZ Rewards handles your data." : "The rules for playing fair."}</p>
      <div className="legal-layout">
        <aside><span>Last updated</span><strong>Aug 13, 2026</strong><Link href={privacy ? "/terms" : "/privacy"}>{privacy ? "Read terms" : "Read privacy"} ↗</Link></aside>
        <article>{sections.map(([heading, copy]) => <section key={heading}><h2>{heading}</h2><p>{copy}</p></section>)}</article>
      </div>
    </main>
  );
}


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
            <p className="casino-muted">
              Verification pending. Connect the matching Kick account or contact support.
            </p>
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
          {provider !== "shuffle" && <div className="casino-mode-tabs" role="tablist" aria-label={`${provider} link mode`}>
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
          </div>}

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
              {loading ? "Checking..." : provider === "shuffle" ? "Find & Link" : "Link account"}
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
      admin_add: "Admin credit",
      admin_deduct: "Admin debit",
      admin_set: "Admin balance set",
      watch_points: "Watch points",
      challenge_claim: "Mission reward",
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
          <CasinoOrnament className="profile-vault" variant="vault" delay={0.28} />
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
          <CasinoOrnament className="profile-vault" variant="vault" delay={0.18} />
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
        <CasinoOrnament className="profile-vault" variant="vault" delay={0.28} />
        <div>
          <p className="kicker"><span>●</span> Player hub</p>
          <h1>Profile</h1>
        </div>
        <div className="round-ticket"><strong>{fmt(account.points)} PTS</strong><span>{account.profileProvider.toUpperCase()}</span></div>
      </section>

      <section className="stat-strip page-width">
        <div><span>Points</span><strong>{fmt(account.points)}</strong></div>
        <div><span>Account</span><strong>{account.profileProvider.toUpperCase()}</strong></div>
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
    ["Leaderboard", "/leaderboard"],
    ["Bets", "/custom-bets"],
    ["Store", "/store"],
    ["Missions", "/challenges"],
    ["Tournaments", "/tournaments"],
    ["Bonus Hunts", "/bonus-hunts"],
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
