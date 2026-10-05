"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  CircleUserRound,
  Clock3,
  Coins,
  Crown,
  Dumbbell,
  Flame,
  Gamepad2,
  Gem,
  Gift,
  Headphones,
  LayoutDashboard,
  PackageCheck,
  PackageOpen,
  Radio,
  ReceiptText,
  Shield,
  Shirt,
  ShoppingBag,
  Sparkles,
  Ticket,
  Target,
  TrendingUp,
  Trophy,
  Tv,
  WalletCards,
  XCircle,
} from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { AuthAccountPayload } from "@/lib/auth/account";
import TournamentBracket from "./tournament-bracket";
import type { MatchUpdate } from "@/lib/tournament-bracket";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { formatNumberCompact } from "@/lib/formatters";
import LiquidGlass from "./liquid-glass";
import SignalChip from "./signal-chip";

type Provider = "kick" | "discord";
type Casino = "thrill" | "packdraw" | "shuffle";
type WorkspaceIcon = typeof Sparkles;

type Account = AuthAccountPayload & {
  handle: string;
  accessKey: string;
};

type AdminUser = {
  id: string;
  handle: string;
  email: string;
  image: string;
  points: number;
  role: "PLAYER" | "ADMIN";
  banned: boolean;
  bannedReason: string;
  timeoutUntil: string;
  connected: {
    kick: {
      connected: boolean;
      username: string;
      id: string;
    };
    discord: {
      connected: boolean;
      username: string;
      id: string;
    };
  };
  casinos: Record<Casino, string>;
  createdAt: string;
  updatedAt: string;
};

type Ticket = {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: "Open" | "Waiting" | "Solved";
  createdAt: string;
  updatedAt?: string;
  handle?: string;
  email?: string;
};

type WatchSummary = {
  connected: boolean;
  running: boolean;
  verified: boolean;
  verificationMode: "oauth" | "chat";
  verificationMessage: string;
  streamLive: boolean;
  lastActivityAt: string | null;
  totalSecondsToday: number;
  earnedPointsToday: number;
  dailyBonusAvailable: boolean;
  dailyBonus: number;
  rateLabel: string;
  points: number;
};

type WatchPointConfig = {
  pointsPerInterval: number;
  intervalSeconds: number;
  dailyBonus: number;
  updatedAt: string;
};

type AdminKickStream = {
  channelSlug: string;
  isLive: boolean;
  startedAt: string | null;
  endedAt: string | null;
  lastEventAt: string | null;
  checkedAt: string | null;
  source: "kick_api" | "webhook";
};

type ApiTournament = {
  id: string;
  code: string;
  title: string;
  starts: string;
  prize: string;
  seats: number;
  taken: number;
  joined: boolean;
  status: "Open" | "Locked" | "Completed";
  active: boolean;
  entrants: string[];
  matches: ApiTournamentMatch[];
  updatedAt: string;
};

type ApiTournamentMatch = {
  id: string;
  round: number;
  position: number;
  participantA: string | null;
  participantB: string | null;
  scoreA: number | null;
  scoreB: number | null;
  winner: string | null;
  status: "Pending" | "Live" | "Completed";
};

type BonusHunt = {
  id: string;
  title: string;
  time: string;
  startsAt: string | null;
  host: string;
  status: "Live" | "Upcoming" | "Completed";
  heat: number;
  followed: boolean;
  startBankroll: number;
  currentBankroll: number;
  bonusCount: number;
  openedCount: number;
  totalPayout: number;
  bestMultiplier: number;
  active: boolean;
  sortOrder: number;
};

type BonusHuntClip = {
  id: string;
  huntId: string;
  title: string;
  stat: string;
  votes: number;
  saved: boolean;
  voted: boolean;
  multiplier: number;
};

type BonusHuntsPayload = { hunts: BonusHunt[]; clips: BonusHuntClip[] };
type AdminHuntStatus = "SCHEDULED" | "LIVE" | "COMPLETED";

type AdminHuntDraft = {
  title: string;
  host: string;
  startsAt: string;
  status: AdminHuntStatus;
  startBankroll: string;
  currentBankroll: string;
  bonusCount: string;
  openedCount: string;
  totalPayout: string;
  bestMultiplier: string;
  sortOrder: string;
};

function huntStatusValue(status: BonusHunt["status"]): AdminHuntStatus {
  return status === "Live" ? "LIVE" : status === "Completed" ? "COMPLETED" : "SCHEDULED";
}

function localDateTimeValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function adminHuntDraft(hunt: BonusHunt): AdminHuntDraft {
  return {
    title: hunt.title,
    host: hunt.host,
    startsAt: localDateTimeValue(hunt.startsAt),
    status: huntStatusValue(hunt.status),
    startBankroll: String(hunt.startBankroll),
    currentBankroll: String(hunt.currentBankroll),
    bonusCount: String(hunt.bonusCount),
    openedCount: String(hunt.openedCount),
    totalPayout: String(hunt.totalPayout),
    bestMultiplier: String(hunt.bestMultiplier),
    sortOrder: String(hunt.sortOrder),
  };
}

function formatHuntTime(hunt: Pick<BonusHunt, "startsAt" | "time">) {
  if (!hunt.startsAt) return hunt.time;
  return new Date(hunt.startsAt).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type Purchase = {
  id: string;
  item: string;
  cost: number;
  status: "Pending" | "Completed";
  createdAt: string;
};

type BetMarket = {
  id: string;
  title: string;
  type: string;
  deadline: string;
  status: "Live" | "Locked" | "Settled" | "Cancelled";
  sides: [string, string];
  odds: [number, number];
  winner: string | null;
};

type Bet = {
  id: string;
  marketId: string;
  marketTitle: string;
  side: string;
  amount: number;
  odds: number;
  status: "Open" | "Won" | "Lost" | "Refunded";
  paid?: boolean;
  payout?: number;
  createdAt: string;
};

type ChallengeMission = {
  id: string;
  code: string;
  title: string;
  reward: number;
  goal: number;
  meta: string;
  cadence: "Daily" | "Weekly" | "Milestone" | "Seasonal";
  progress: number;
  claimed: boolean;
  claimedAt: string | null;
};

type AdminChallengeCadence = "DAILY" | "WEEKLY" | "MILESTONE" | "SEASONAL";

type AdminChallengeMission = ChallengeMission & {
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

const adminChallengeCadences: { value: AdminChallengeCadence; label: string }[] = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MILESTONE", label: "Milestone" },
  { value: "SEASONAL", label: "Seasonal" },
];

const defaultAccount: Account = {
  handle: "@guest",
  image: "",
  profileProvider: "email",
  accessKey: "",
  points: 0,
  streak: 0,
  inventory: [],
  connected: {
    kick: { connected: false, username: "", id: "" },
    discord: { connected: false, username: "", id: "" },
  },
  casinos: {
    thrill: "",
    packdraw: "",
    shuffle: "",
  },
  lifetimeWager: 0,
  watchMinutes: 0,
  banned: false,
  timeoutUntil: "",
  badges: [],
};

const faq = [
  { q: "Wager score", a: "Your eligible casino wagers set your leaderboard score." },
  { q: "Kick points", a: "Connect Kick and watch live to earn points." },
  { q: "Store rewards", a: "Redeem points and track delivery in your orders." },
  { q: "Custom bets", a: "Pick a side. Winning bets pay the listed odds." },
  { q: "Casino names", a: "Link and verify casino usernames in your profile." },
];

const workspaceIcons: Record<string, WorkspaceIcon> = {
  Admin: LayoutDashboard,
  Account: Shield,
  Challenges: BadgeCheck,
  Missions: BadgeCheck,
  "Custom Bets": Ticket,
  "Help Center": Headphones,
  Profile: WalletCards,
  "Reward Store": Gift,
  Support: Headphones,
  Tournaments: Trophy,
  "Bonus Hunts": Flame,
  "Watch Points": Tv,
};

const statusIcons: Record<string, WorkspaceIcon> = {
  API: Activity,
  Backend: Shield,
  Badges: BadgeCheck,
  Board: Trophy,
  Cache: Activity,
  Chat: Headphones,
  Daily: Gift,
  Discord: Headphones,
  Entries: Ticket,
  Entry: Ticket,
  Gates: Shield,
  Heat: Activity,
  Kick: Tv,
  Lifetime: Coins,
  Live: Tv,
  Mode: Shield,
  Points: Coins,
  Pool: Trophy,
  Prize: Gift,
  Rank: Trophy,
  Reset: Activity,
  Role: Shield,
  State: Activity,
  Status: Activity,
  Streak: Activity,
  Tickets: Ticket,
  Total: Coins,
  Users: WalletCards,
  Verify: BadgeCheck,
  Winners: Trophy,
  Score: Sparkles,
};

function iconForLabel(label: string) {
  return statusIcons[label] ?? Activity;
}

function normalizeAccount(value: Partial<Account> | null | undefined): Account {
  const normalized = {
    ...defaultAccount,
    ...value,
    inventory: Array.isArray(value?.inventory) ? value.inventory : [],
    connected: {
      kick: { ...defaultAccount.connected.kick, ...value?.connected?.kick },
      discord: { ...defaultAccount.connected.discord, ...value?.connected?.discord },
    },
    casinos: {
      ...defaultAccount.casinos,
      ...value?.casinos,
    },
    badges: Array.isArray(value?.badges) ? value.badges : defaultAccount.badges,
  };

  return normalized.handle === "@guest" ? defaultAccount : normalized;
}

function accountFromPayload(payload: AuthAccountPayload): Account {
  return normalizeAccount({
    ...payload,
    accessKey: "",
  });
}

function AccountImage({
  account,
  className,
}: {
  account: Account;
  className: string;
}) {
  const initials = account.handle.slice(1, 3).toUpperCase() || "AR";

  return (
    <span className={className}>
      {account.image ? <Image src={account.image} alt="" width={42} height={42} unoptimized /> : initials}
    </span>
  );
}

function accountProviderLabel(account: Account) {
  if (account.profileProvider === "kick" && account.connected.kick.username) {
    return "Kick";
  }

  if (account.profileProvider === "discord" && account.connected.discord.username) {
    return "Discord";
  }

  if (account.connected.kick.connected) {
    return "Kick";
  }

  if (account.connected.discord.connected) {
    return "Discord";
  }

  return "Signed in";
}

function accountDisplayName(account: Account) {
  if (account.profileProvider === "kick" && account.connected.kick.username) {
    return `@${account.connected.kick.username.replace(/^@/, "")}`;
  }

  if (account.profileProvider === "discord" && account.connected.discord.username) {
    return account.connected.discord.username;
  }

  return account.handle;
}

function isAdminAccount(account: Pick<Account, "badges">) {
  return account.badges.includes("Admin");
}

function accountDestination(account: Account) {
  return isAdminAccount(account) ? "/admin" : "/profile";
}

function accountDestinationLabel(account: Account) {
  return isAdminAccount(account) ? "Open admin" : "Open profile";
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("rankboard-storage", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("rankboard-storage", callback);
  };
}

function useStoredState<T>(key: string, fallback: T) {
  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);

  const getServerSnapshot = useCallback(() => null, []);

  const raw = useSyncExternalStore(subscribeToStorage, getSnapshot, getServerSnapshot);

  const value: T = useMemo(() => {
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }, [raw, fallback]);

  const setStoredValue = useCallback(
    (nextOrUpdater: T | ((current: T) => T)) => {
      try {
        const currentSaved = window.localStorage.getItem(key);
        const current: T = currentSaved ? (JSON.parse(currentSaved) as T) : fallback;
        const next =
          typeof nextOrUpdater === "function"
            ? (nextOrUpdater as (current: T) => T)(current)
            : nextOrUpdater;
        window.localStorage.setItem(key, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent("rankboard-storage"));
      } catch {
        // ignore
      }
    },
    [key, fallback]
  );

  return [value, setStoredValue] as const;
}

function useAccountState() {
  const [rawAccount, setRawAccount] = useStoredState<Account>("rankboard-account", defaultAccount);
  const [sessionValidated, setSessionValidated] = useState(false);
  const account = useMemo(
    () => sessionValidated ? normalizeAccount(rawAccount) : defaultAccount,
    [rawAccount, sessionValidated]
  );

  useEffect(() => {
    let active = true;

    async function syncSession() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Session check failed.");
        }
        const payload = (await res.json()) as { account: AuthAccountPayload | null };
        if (!active) return;

        if (payload.account) {
          const next = accountFromPayload(payload.account);
          setRawAccount(next);
        } else {
          setRawAccount(defaultAccount);
          window.localStorage.removeItem("rankboard-account");
          window.dispatchEvent(new CustomEvent("rankboard-storage"));
        }
      } catch {
        if (active) {
          setRawAccount(defaultAccount);
          window.localStorage.removeItem("rankboard-account");
          window.dispatchEvent(new CustomEvent("rankboard-storage"));
        }
      } finally {
        if (active) {
          setSessionValidated(true);
        }
      }
    }

    void syncSession();
    return () => {
      active = false;
    };
  }, [setRawAccount]);

  return [account, setRawAccount] as const;
}

export default function FeatureWorkspace({ route }: { route: string }) {
  const [account, setAccount] = useAccountState();

  if (route === "challenges") return <ChallengesWorkspace account={account} setAccount={setAccount} />;
  if (route === "tournaments") return <TournamentsWorkspace />;
  if (route === "bonus-hunts") return <BonusHuntsWorkspace />;
  if (route === "store") return <StoreWorkspace account={account} setAccount={setAccount} />;
  if (route === "custom-bets") return <CustomBetsWorkspace account={account} setAccount={setAccount} />;
  if (route === "watch-points") return <WatchPointsWorkspace account={account} setAccount={setAccount} />;
  if (route === "profile") return <ProfileWorkspace account={account} setAccount={setAccount} />;
  if (route === "admin") return <AdminWorkspace account={account} setAccount={setAccount} />;
  if (route === "support") return <SupportWorkspace />;
  if (route === "help") return <HelpWorkspace />;
  if (route === "login") return <LoginWorkspace account={account} setAccount={setAccount} />;

  return null;
}

function ChallengesWorkspace({
  account,
  setAccount,
}: {
  account: Account;
  setAccount: (value: Account | ((current: Account) => Account)) => void;
}) {
  const [missionList, setMissionList] = useState<ChallengeMission[]>([]);
  const [message, setMessage] = useState("Syncing...");
  const [pendingMissionId, setPendingMissionId] = useState("");
  const active = missionList.filter((mission) => !mission.claimed).length;
  const claimable = missionList.filter((mission) => mission.progress >= mission.goal && !mission.claimed).length;

  function replaceMission(nextMission: ChallengeMission) {
    setMissionList((current) =>
      current.map((mission) => mission.id === nextMission.id ? nextMission : mission)
    );
  }

  useEffect(() => {
    let activeRequest = true;

    async function loadMissions() {
      try {
        const response = await fetch("/api/challenges", { cache: "no-store" });
        const payload = (await response.json()) as {
          missions?: ChallengeMission[];
          error?: string;
        };
        if (!activeRequest) return;
        if (!response.ok) {
          setMessage(payload.error ?? "Could not load missions.");
          return;
        }
        setMissionList(payload.missions ?? []);
        setMessage("");
      } catch {
        if (activeRequest) setMessage("Could not load missions.");
      }
    }

    void loadMissions();
    const refresh = () => {
      if (document.visibilityState === "visible") void loadMissions();
    };
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener("focus", refresh);
    return () => {
      activeRequest = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  async function claimMission(id: string) {
    setPendingMissionId(id);
    setMessage("Claiming reward...");
    try {
      const response = await fetch("/api/challenges/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId: id }),
      });
      const payload = (await response.json()) as {
        mission?: ChallengeMission;
        newPoints?: number;
        error?: string;
      };
      if (!response.ok || !payload.mission) {
        setMessage(payload.error ?? "Claim failed.");
        return;
      }
      replaceMission(payload.mission);
      setAccount((current) => {
        const safe = normalizeAccount(current);
        return {
          ...safe,
          points: payload.newPoints ?? safe.points,
        };
      });
      setMessage("Reward claimed.");
    } catch {
      setMessage("Claim failed.");
    } finally {
      setPendingMissionId("");
    }
  }

  return (
    <section className="section page-width app-workspace workspace--missions">
      <WorkspaceHeader overline="Missions" title="Daily missions" meta={message || `${active} active · ${claimable} ready`} />
      <div className="workspace-grid">
        {missionList.map((mission) => {
          const percent = mission.goal > 0 ? Math.round((mission.progress / mission.goal) * 100) : 0;
          const displayPercent = Math.min(100, Math.max(0, percent));
          const isClaimed = mission.claimed;
          const isReady = mission.progress >= mission.goal;
          const isPending = pendingMissionId === mission.id;
          const showMissionMeta = mission.meta.trim().toLowerCase() !== mission.cadence.toLowerCase();
          return (
            <LiquidGlass as="article" className="action-card mission-card" key={mission.id} tone="violet">
              <div className="card-topline">
                <SignalChip icon={BadgeCheck} label={`Cadence: ${mission.cadence}`} value={mission.cadence} tone="acid" />
                {showMissionMeta ? <SignalChip icon={Target} label={`Slot: ${mission.meta}`} value={mission.meta} tone="cyan" /> : null}
              </div>
              <h3>{mission.title}</h3>
              <div className="card-progress-line">
                <span><Target size={16} strokeWidth={2.7} aria-hidden="true" />{mission.goal.toLocaleString()}x</span>
                <strong>{displayPercent}%</strong>
              </div>
              <ProgressBar value={displayPercent} />
              <div className="action-card__footer">
                <strong>{isClaimed ? <CheckCircle2 size={17} aria-hidden="true" /> : <Coins size={17} aria-hidden="true" />}{isClaimed ? "Claimed" : `${mission.reward.toLocaleString()} pts`}</strong>
                <button type="button" onClick={() => claimMission(mission.id)} disabled={!isReady || isClaimed || Boolean(pendingMissionId)}>
                  <Gift size={15} strokeWidth={2.7} aria-hidden="true" />
                  {isPending ? "Saving" : isClaimed ? "Claimed" : isReady ? "Claim" : "Locked"}
                </button>
              </div>
            </LiquidGlass>
          );
        })}
        {!missionList.length && (
          <LiquidGlass as="article" className="action-card mission-card workspace-empty-card" tone="violet">
            <BadgeCheck size={24} aria-hidden="true" />
            <h3>Missions syncing</h3>
            <ProgressBar value={0} />
          </LiquidGlass>
        )}
      </div>
      <AccountStrip account={account} />
    </section>
  );
}

function TournamentsWorkspace() {
  const [tournamentList, setTournamentList] = useState<ApiTournament[]>([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("Loading tournaments...");
  const tournament = tournamentList.find((item) => item.id === selected) ?? tournamentList[0] ?? null;
  const registrations = tournamentList.filter((item) => item.joined).length;
  const [entryBusy, setEntryBusy] = useState(false);
  const requestId = useRef(0);
  const mutationPending = useRef(false);

  const loadTournaments = useCallback(async (announce = false) => {
    if (mutationPending.current) return;
    const request = ++requestId.current;
    try {
      const response = await fetch("/api/tournaments", { cache: "no-store" });
      const payload = (await response.json()) as { tournaments?: ApiTournament[]; error?: string };
      if (!response.ok || !payload.tournaments) {
        throw new Error(payload.error ?? "Could not load tournaments.");
      }
      if (request !== requestId.current || mutationPending.current) return;
      setTournamentList(payload.tournaments);
      setSelected((current) => payload.tournaments?.some((item) => item.id === current) ? current : (payload.tournaments?.[0]?.id ?? ""));
      if (announce) setMessage("");
    } catch (error) {
      if (announce && request === requestId.current) setMessage(error instanceof Error ? error.message : "Could not load tournaments.");
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadTournaments(true), 0);
    const refresh = () => {
      if (document.visibilityState === "visible" && document.hasFocus()) void loadTournaments(false);
    };
    const interval = window.setInterval(refresh, 5_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [loadTournaments]);

  async function toggleEntry() {
    if (!tournament || entryBusy) return;
    mutationPending.current = true;
    requestId.current += 1;
    setEntryBusy(true);
    setMessage(tournament.joined ? "Withdrawing entry..." : "Entering tournament...");

    try {
      const response = await fetch("/api/tournaments/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId: tournament.id }),
      });
      const payload = (await response.json()) as { tournaments?: ApiTournament[]; error?: string };
      if (!response.ok || !payload.tournaments) {
        throw new Error(payload.error ?? "Tournament entry failed.");
      }
      setTournamentList(payload.tournaments);
      setMessage("Tournament state saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tournament entry failed.");
    } finally {
      mutationPending.current = false;
      setEntryBusy(false);
    }
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="Tournaments" title="Brackets & prizes" meta={message || `${registrations} entries`} />
      {!tournamentList.length && <p className="tournament-empty">{message || "No tournaments scheduled yet."}</p>}
      <div className="workspace-grid three">
        {tournamentList.map((item) => (
          <LiquidGlass as="article" className={`action-card ${selected === item.id ? "selected" : ""}`} key={item.id} tone="cyan">
            <small>{item.starts}</small>
            <h3>{item.title}</h3>
            <p>{item.taken} / {item.seats} seats · {item.prize}</p>
            <ProgressBar value={(item.taken / item.seats) * 100} />
            <div className="action-card__footer">
              <strong>{item.joined ? "Entered" : item.status}</strong>
              <button type="button" onClick={() => setSelected(item.id)}>View</button>
            </div>
          </LiquidGlass>
        ))}
      </div>
      {tournament ? (
        <LiquidGlass className="bracket-panel bracket-panel--live" tone="violet">
          <div className="bracket-panel__head">
            <div><h3>{tournament.title}</h3><p>{tournament.prize}</p></div>
            <button type="button" onClick={toggleEntry} disabled={entryBusy || tournament.status !== "Open" || (!tournament.joined && tournament.taken >= tournament.seats)}>
              {entryBusy ? "Saving…" : tournament.joined ? "Withdraw" : tournament.status !== "Open" ? tournament.status : tournament.taken >= tournament.seats ? "Full" : "Enter"}
            </button>
          </div>
          {tournament.matches.length ? (
            <TournamentBracket tournament={tournament} />
          ) : (
            <div className="tournament-empty"><Trophy size={24} aria-hidden="true" /><strong>Bracket coming soon</strong></div>
          )}
        </LiquidGlass>
      ) : null}
    </section>
  );
}

function BonusHuntsWorkspace() {
  const [data, setData] = useState<BonusHuntsPayload>({ hunts: [], clips: [] });
  const [message, setMessage] = useState("Loading hunts...");
  const [busy, setBusy] = useState("");
  const [selectedHuntId, setSelectedHuntId] = useState("");
  const requestId = useRef(0);
  const mutationPending = useRef(false);

  useEffect(() => {
    let active = true;
    async function loadHunts() {
      if (mutationPending.current) return;
      const request = ++requestId.current;
      try {
        const response = await fetch("/api/hunts", { cache: "no-store" });
        const payload = (await response.json()) as BonusHuntsPayload & { error?: string };
        if (!response.ok || !payload.hunts) throw new Error(payload.error ?? "Could not load hunts.");
        if (active && request === requestId.current) {
          setData({ hunts: payload.hunts, clips: payload.clips ?? [] });
          setMessage("");
        }
      } catch (error) {
        if (active && request === requestId.current) setMessage(error instanceof Error ? error.message : "Could not load hunts.");
      }
    }
    void loadHunts();
    const refresh = () => { if (document.visibilityState === "visible") void loadHunts(); };
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  async function act(path: string, key: string, body: Record<string, string>) {
    if (mutationPending.current) return;
    mutationPending.current = true;
    requestId.current += 1;
    setBusy(key);
    try {
      const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = (await response.json()) as BonusHuntsPayload & { error?: string };
      if (!response.ok || !payload.hunts) throw new Error(payload.error ?? "Action failed.");
      setData({ hunts: payload.hunts, clips: payload.clips ?? [] });
      setMessage("Saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed.");
    } finally {
      mutationPending.current = false;
      setBusy("");
    }
  }

  const live = data.hunts.find((hunt) => hunt.status === "Live");
  const featured = data.hunts.find((hunt) => hunt.id === selectedHuntId) ?? live ?? data.hunts[0];
  const highlights = data.clips.filter((clip) => clip.huntId === featured?.id);
  const money = (value: number) => `$${value.toLocaleString("en-US")}`;

  return (
    <section className="section page-width app-workspace bonus-hunts-workspace">
      <WorkspaceHeader overline="Bonus Hunts" title="Hunt lineup" meta={message || (live ? "Live now" : "")} />
      {featured ? (
        <LiquidGlass as="article" className="hunt-feature" tone="violet">
          <div className="hunt-feature__intro">
            <span className={`hunt-status hunt-status--${featured.status.toLowerCase()}`}>{featured.status === "Live" ? <Radio size={15} aria-hidden="true" /> : <Clock3 size={15} aria-hidden="true" />}{featured.status} hunt</span>
            <h2>{featured.title}</h2>
            <p>Hosted by {featured.host} · {formatHuntTime(featured)}</p>
            <button type="button" disabled={Boolean(busy)} onClick={() => void act("/api/hunts/follow", `hunt-${featured.id}`, { huntId: featured.id })}>{featured.followed ? "Following" : "Follow hunt"} <ArrowUpRight size={15} aria-hidden="true" /></button>
          </div>
          <div className="hunt-feature__stats">
            <div><small>Bonuses opened</small><strong>{featured.openedCount}<span> / {featured.bonusCount}</span></strong></div>
            <div><small>Total payout</small><strong>{money(featured.totalPayout)}</strong></div>
            <div><small>Best hit</small><strong>{featured.bestMultiplier.toLocaleString()}x</strong></div>
            <div><small>Current bankroll</small><strong>{money(featured.currentBankroll)}</strong></div>
          </div>
          <div className="hunt-feature__progress"><span style={{ width: `${Math.min(100, Math.max(0, featured.bonusCount ? featured.openedCount / featured.bonusCount * 100 : 0))}%` }} /></div>
        </LiquidGlass>
      ) : <div className="hunt-empty">{message || "No bonus hunts scheduled yet."}</div>}
      {data.hunts.length > 1 && <div className="hunt-list" aria-label="All bonus hunts">{data.hunts.filter((hunt) => hunt.id !== featured?.id).map((hunt) => (
        <LiquidGlass as="article" className="hunt-list__card" key={hunt.id} tone="cyan">
          <span className={`hunt-status hunt-status--${hunt.status.toLowerCase()}`}>{hunt.status}</span>
          <h3>{hunt.title}</h3>
          <p>{hunt.host} · {formatHuntTime(hunt)}</p>
          <div><span>{hunt.openedCount} / {hunt.bonusCount} bonuses</span><strong>{hunt.bestMultiplier.toLocaleString()}x best</strong></div>
          <button type="button" onClick={() => setSelectedHuntId(hunt.id)}>View hunt</button>
          <button type="button" disabled={Boolean(busy)} onClick={() => void act("/api/hunts/follow", `hunt-${hunt.id}`, { huntId: hunt.id })}>{hunt.followed ? "Following" : "Follow hunt"}</button>
        </LiquidGlass>
      ))}</div>}
      {highlights.length > 0 && <section className="hunt-clips" aria-label="Hunt highlights"><h2>Big hit highlights</h2><div>{highlights.map((clip) => (
        <article key={clip.id}><span><Flame size={18} aria-hidden="true" /> {clip.stat}</span><h3>{clip.title}</h3><div><button type="button" disabled={Boolean(busy) || clip.voted} onClick={() => void act("/api/hunts/clips/vote", `vote-${clip.id}`, { clipId: clip.id })}>{clip.voted ? "Voted" : "Vote"} · {clip.votes}</button><button type="button" disabled={Boolean(busy)} onClick={() => void act("/api/hunts/clips/save", `save-${clip.id}`, { clipId: clip.id })}>{clip.saved ? "Saved" : "Save"}</button></div></article>
      ))}</div></section>}
    </section>
  );
}

type ApiStoreItem = {
  id: string;
  title: string;
  description: string;
  cost: number;
  tag: string;
  stock: number;
  unlimited: boolean;
  imageLabel: string;
  imageUrl: string;
};

const storeImageMaxBytes = 550_000;
const supportedStoreImageTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function getStoreItemIcon(item: Pick<ApiStoreItem, "title" | "tag" | "imageLabel">): WorkspaceIcon {
  const value = `${item.title} ${item.tag} ${item.imageLabel}`.toLowerCase();

  if (value.includes("cash") || value.includes("tip") || value.includes("$")) return Banknote;
  if (value.includes("vip") || value.includes("crown")) return Crown;
  if (value.includes("merch") || value.includes("shirt") || value.includes("hoodie")) return Shirt;
  if (value.includes("gift") || value.includes("bonus")) return Gift;
  if (value.includes("game") || value.includes("spin") || value.includes("slot")) return Gamepad2;
  if (value.includes("ticket") || value.includes("raffle")) return Ticket;
  if (value.includes("gem") || value.includes("premium")) return Gem;
  if (value.includes("boost") || value.includes("challenge")) return Dumbbell;
  if (value.includes("package") || value.includes("crate")) return PackageOpen;

  return ShoppingBag;
}

function storeImageStyle(imageUrl: string) {
  const cleanUrl = imageUrl.trim();
  return cleanUrl ? { backgroundImage: `url(${JSON.stringify(cleanUrl)})` } : undefined;
}

function readImageFileAsDataUrl(file: File) {
  if (!supportedStoreImageTypes.has(file.type)) {
    return Promise.reject(new Error("Upload a PNG, JPEG, WebP, or GIF image."));
  }
  if (file.size > storeImageMaxBytes) {
    return Promise.reject(new Error("Choose an image smaller than 550 KB."));
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result ?? "")), { once: true });
    reader.addEventListener("error", () => reject(new Error("Could not read image file.")), { once: true });
    reader.readAsDataURL(file);
  });
}

function getPurchaseStatusIcon(status: ApiPurchase["status"]): WorkspaceIcon {
  if (status === "COMPLETED") return CheckCircle2;
  if (status === "REJECTED") return XCircle;
  return PackageCheck;
}

type ApiPurchase = {
  id: string;
  itemId: string;
  itemTitle: string;
  cost: number;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  createdAt: string;
};

type AdminApiPurchase = ApiPurchase & {
  userId: string;
  userHandle: string;
  userEmail: string;
};

function StoreWorkspace({
  account,
  setAccount,
}: {
  account: Account;
  setAccount: (value: Account | ((current: Account) => Account)) => void;
}) {
  const [items, setItems] = useState<ApiStoreItem[]>([]);
  const [purchases, setPurchases] = useState<ApiPurchase[]>([]);
  const [message, setMessage] = useState("Loading store...");
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const isGuest = account.handle === "@guest";

  // Load items from server
  useEffect(() => {
    let active = true;
    async function loadItems() {
      try {
        const response = await fetch("/api/store/items", { cache: "no-store" });
        const data = (await response.json()) as { items?: ApiStoreItem[]; error?: string };
        if (!active) return;
        if (data.items) {
          setItems(data.items);
          setMessage("");
        } else {
          setMessage(data.error ?? "Could not load items.");
        }
      } catch {
        if (active) setMessage("Could not load items.");
      }
    }

    void loadItems();
    const refresh = () => {
      if (document.visibilityState === "visible") void loadItems();
    };
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [isGuest]);

  // Load purchase history from server (only if signed in)
  useEffect(() => {
    if (isGuest) return;
    let active = true;
    async function loadPurchases() {
      try {
        const response = await fetch("/api/store/purchases", { cache: "no-store" });
        const data = (await response.json()) as { purchases?: ApiPurchase[]; error?: string };
        if (active && data.purchases) setPurchases(data.purchases);
      } catch {
        // Keep the last known purchase list on transient errors.
      }
    }

    void loadPurchases();
    const refresh = () => {
      if (document.visibilityState === "visible") void loadPurchases();
    };
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [isGuest]);

  async function redeem(item: ApiStoreItem) {
    if (isGuest) { setMessage("Sign in to redeem rewards."); return; }
    if (account.points < item.cost) { setMessage("Not enough points."); return; }
    if (!item.unlimited && item.stock <= 0) { setMessage("Item is sold out."); return; }

    setBusyItemId(item.id);
    setMessage(`Redeeming ${item.title}...`);

    try {
      const response = await fetch("/api/store/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      const data = (await response.json()) as {
        purchase?: ApiPurchase;
        newPoints?: number;
        error?: string;
      };

      if (!response.ok || !data.purchase) {
        throw new Error(data.error ?? "Redemption failed.");
      }

      // Update account points from server response
      setAccount((current) => {
        const safe = normalizeAccount(current);
        return { ...safe, points: data.newPoints ?? Math.max(0, safe.points - item.cost) };
      });

      // Update item stock locally
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id && !entry.unlimited
            ? { ...entry, stock: Math.max(0, entry.stock - 1) }
            : entry
        )
      );

      // Prepend the new purchase to history
      setPurchases((current) => [data.purchase!, ...current]);
      setMessage("Redemption queued");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Redemption failed.");
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <section className="section page-width app-workspace workspace--store">
      <WorkspaceHeader overline="Reward Store" title="Redeem points" meta={message} />
      <AccountStrip account={account} />
      {isGuest && (
        <div className="workspace-notice">
          <p>Sign in to redeem rewards.</p>
          <a className="button primary" href="/login">Sign in <span>↗</span></a>
        </div>
      )}
      <div className="workspace-grid">
        {items.length === 0 && !isGuest && (
          <p className="workspace-loading">Loading...</p>
        )}
        {items.map((item) => {
          const isBusy = busyItemId === item.id;
          const canAfford = account.points >= item.cost;
          const inStock = item.unlimited || item.stock > 0;
          const StoreIcon = getStoreItemIcon(item);
          return (
            <LiquidGlass as="article" className="action-card reward-card" key={item.id} tone="ember">
              <div className="card-topline">
                <SignalChip icon={StoreIcon} label={`Category: ${item.tag}`} value={item.tag} tone="acid" />
                <SignalChip
                  icon={PackageOpen}
                  label={item.unlimited ? "Unlimited stock" : `${item.stock} in stock`}
                  value={item.unlimited ? undefined : item.stock}
                  tone="cyan"
                />
              </div>
              <div
                className={`reward-art ${item.imageUrl ? "reward-art--image" : ""}`}
                style={storeImageStyle(item.imageUrl)}
                aria-hidden="true"
              >
                {!item.imageUrl && <StoreIcon size={32} strokeWidth={2.5} />}
              </div>
              <div className="reward-card__copy">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <div className="action-card__footer">
                <strong><Coins size={17} aria-hidden="true" />{item.cost.toLocaleString()} pts</strong>
                <button
                  type="button"
                  disabled={isBusy || isGuest || !canAfford || !inStock}
                  onClick={() => redeem(item)}
                >
                  <ShoppingBag size={15} strokeWidth={2.7} aria-hidden="true" />
                  {isBusy ? "Working..." : !inStock ? "Sold Out" : !canAfford ? "Need pts" : "Redeem"}
                </button>
              </div>
            </LiquidGlass>
          );
        })}
      </div>
      {!isGuest && <ApiPurchaseList purchases={purchases} />}
    </section>
  );
}

function ApiPurchaseList({ purchases }: { purchases: ApiPurchase[] }) {
  function statusLabel(status: ApiPurchase["status"]) {
    if (status === "COMPLETED") return "Done";
    if (status === "REJECTED") return "Rejected";
    return "Pending";
  }

  return (
    <div className="workspace-list">
      {purchases.length ? purchases.map((p) => {
        const StatusIcon = getPurchaseStatusIcon(p.status);
        return (
          <article key={p.id}>
            <span className="list-icon" title={statusLabel(p.status)}><StatusIcon size={16} strokeWidth={2.6} aria-hidden="true" /></span>
            <div>
              <h3>{p.itemTitle}</h3>
              <p>{statusLabel(p.status)} / {p.cost.toLocaleString()} pts / {new Date(p.createdAt).toLocaleDateString()}</p>
            </div>
            <a href="/support">Track</a>
          </article>
        );
      }) : (
        <article><span className="list-icon"><PackageOpen size={16} aria-hidden="true" /></span><div><h3>No purchases</h3></div></article>
      )}
    </div>
  );
}

function CustomBetsWorkspace({
  account,
  setAccount,
}: {
  account: Account;
  setAccount: (value: Account | ((current: Account) => Account)) => void;
}) {
  const [markets, setMarkets] = useState<BetMarket[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busyMarketId, setBusyMarketId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const isGuest = account.handle === "@guest";

  useEffect(() => {
    let active = true;
    async function loadMarkets() {
      try {
        const response = await fetch("/api/bets/markets", { cache: "no-store" });
        const data = (await response.json()) as { markets?: BetMarket[]; error?: string };
        if (active && data.markets) setMarkets(data.markets);
      } catch {
        // Keep the last known markets on transient errors.
      }
    }

    void loadMarkets();
    const refresh = () => {
      if (document.visibilityState === "visible") void loadMarkets();
    };
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    if (isGuest) return;
    let active = true;
    async function loadBets() {
      try {
        const response = await fetch("/api/bets/my-bets", { cache: "no-store" });
        const data = (await response.json()) as { bets?: Bet[]; error?: string };
        if (active && data.bets) setBets(data.bets);
      } catch {
        // Keep the last known bets on transient errors.
      }
    }

    void loadBets();
    const refresh = () => {
      if (document.visibilityState === "visible") void loadBets();
    };
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [isGuest]);

  async function placeBet(market: BetMarket, sideIndex: 0 | 1) {
    if (isGuest) {
      setMessage("Sign in to place bets.");
      return;
    }
    const amount = Math.max(0, Math.floor(Number(amounts[market.id] || 0)));
    if (market.status !== "Live") {
      setMessage("This market is closed.");
      return;
    }
    if (amount <= 0) {
      setMessage("Enter a valid points amount.");
      return;
    }
    if (account.points < amount) {
      setMessage("Not enough points.");
      return;
    }

    const side = market.sides[sideIndex];
    setBusyMarketId(market.id);
    setMessage(`Placing bet on ${side}...`);

    try {
      const response = await fetch("/api/bets/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: market.id,
          side,
          amount,
        }),
      });
      const data = (await response.json()) as {
        bet?: Bet;
        newPoints?: number;
        error?: string;
      };

      if (!response.ok || !data.bet) {
        throw new Error(data.error ?? "Failed to place bet.");
      }

      setAccount((current) => {
        const safe = normalizeAccount(current);
        return {
          ...safe,
          points: data.newPoints ?? Math.max(0, safe.points - amount),
        };
      });

      setBets((current) => [data.bet!, ...current]);
      setAmounts((current) => ({ ...current, [market.id]: "" }));
      setMessage(`Bet placed on ${side} for ${amount.toLocaleString()} pts!`);
      window.dispatchEvent(new CustomEvent("rankboard-storage"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bet failed.");
    } finally {
      setBusyMarketId(null);
    }
  }

  return (
    <section className="section page-width app-workspace workspace--bets">
      <WorkspaceHeader
        overline="Custom Bets"
        title="Live markets"
        meta={message}
      />
      <AccountStrip account={account} />
      {isGuest && (
        <div className="workspace-notice">
          <p>Sign in to bet points.</p>
          <a className="button primary" href="/login">Sign in <span>↗</span></a>
        </div>
      )}
      <div className="workspace-grid">
        {markets.length === 0 && (
          <p className="workspace-loading">Loading markets...</p>
        )}
        {markets.map((market) => (
          <LiquidGlass as="article" className={`action-card market-card ${market.status.toLowerCase()}`} key={market.id} tone="cyan">
            <div className="card-topline">
              <SignalChip icon={Ticket} label={`Market: ${market.type}`} value={market.type} tone="cyan" />
              <SignalChip icon={Radio} label={`Status: ${market.status}`} value={market.status} tone={market.status === "Live" ? "acid" : "neutral"} active={market.status === "Live"} />
            </div>
            <h3>{market.title}</h3>
            <SignalChip
              icon={Clock3}
              label={market.winner ? "Winning side" : "Market deadline"}
              value={market.winner ? `${market.winner} won` : market.deadline}
              tone="pink"
              className="market-card__deadline"
            />
            <label className="bet-amount-control">
              <Coins size={17} strokeWidth={2.6} aria-hidden="true" />
              <input
                className="inline-bet-input"
                value={amounts[market.id] ?? ""}
                inputMode="numeric"
                placeholder="Points"
                aria-label={`Points to bet on ${market.title}`}
                disabled={isGuest || market.status !== "Live" || busyMarketId === market.id}
                onChange={(event) =>
                  setAmounts((current) => ({
                    ...current,
                    [market.id]: event.target.value.replace(/\D/g, ""),
                  }))
                }
              />
            </label>
            <div className="odds-grid">
              {[0, 1].map((index) => (
                <button
                  key={market.sides[index]}
                  type="button"
                  disabled={isGuest || market.status !== "Live" || busyMarketId === market.id}
                  onClick={() => placeBet(market, index as 0 | 1)}
                >
                  <span><TrendingUp size={14} strokeWidth={2.7} aria-hidden="true" />{market.sides[index]}</span>
                  <b>{market.odds[index].toFixed(2)}x</b>
                </button>
              ))}
            </div>
          </LiquidGlass>
        ))}
      </div>
      {!isGuest && <BetList bets={bets} />}
    </section>
  );
}

function WatchPointsWorkspace({
  account,
  setAccount,
}: {
  account: Account;
  setAccount: (value: Account | ((current: Account) => Account)) => void;
}) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [summary, setSummary] = useState<WatchSummary | null>(null);
  const [message, setMessage] = useState("Syncing...");
  const autoStartAttempted = useRef(false);
  const connected = summary?.connected ?? account.connected.kick.connected;
  const displayedSeconds = seconds;
  const earnedToday = summary?.earnedPointsToday ?? 0;

  const applyWatchSummary = useCallback((nextSummary: WatchSummary) => {
    setSummary(nextSummary);
    setRunning(nextSummary.running);
    setSeconds(nextSummary.totalSecondsToday);
    setAccount((current) => {
      const safe = normalizeAccount(current);
      return {
        ...safe,
        points: nextSummary.points,
        watchMinutes: Math.floor(nextSummary.totalSecondsToday / 60),
      };
    });
  }, [setAccount]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const sendHeartbeat = useCallback(async (quiet = false) => {
    try {
      const response = await fetch("/api/watch-points/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ running: true }),
      });
      const payload = (await response.json()) as { summary?: WatchSummary; error?: string };
      if (!response.ok || !payload.summary) {
        throw new Error(payload.error ?? "Watch update failed.");
      }
      applyWatchSummary(payload.summary);
      setMessage("Auto earning");
      return payload.summary;
    } catch (error) {
      if (!quiet) {
        setMessage(error instanceof Error ? error.message : "Watch update failed.");
      }
      setRunning(false);
      return null;
    }
  }, [applyWatchSummary]);

  useEffect(() => {
    let active = true;

    async function startAutoEarning() {
      try {
        const response = await fetch("/api/watch-points", { cache: "no-store" });
        const payload = (await response.json()) as { summary?: WatchSummary; error?: string };
        if (!active) return;

        if (!payload.summary) {
          setMessage(payload.error ?? "Could not load watch points.");
          return;
        }

        applyWatchSummary(payload.summary);
        if (!payload.summary.connected) {
          setMessage("Connect Kick");
          return;
        }
        if (!payload.summary.verified) {
          setMessage(payload.summary.verificationMessage);
          return;
        }

        setMessage("Starting auto earn...");
        if (!autoStartAttempted.current) {
          autoStartAttempted.current = true;
          await sendHeartbeat();
        }
      } catch {
        if (active) setMessage("Could not load watch points.");
      }
    }

    void startAutoEarning();
    return () => { active = false; };
  }, [applyWatchSummary, sendHeartbeat]);

  useEffect(() => {
    if (!connected) return;

    const heartbeat = window.setInterval(() => {
      void sendHeartbeat(true);
    }, 10000);

    return () => window.clearInterval(heartbeat);
  }, [connected, sendHeartbeat]);

  return (
    <section className="section page-width app-workspace workspace--watch">
      <WorkspaceHeader overline="Watch Points" title="Watch & earn" meta={message} />
      <div className="watch-console">
        <div className="watch-orb">
          <span><Clock3 size={22} strokeWidth={2.6} aria-hidden="true" />{String(Math.floor(displayedSeconds / 60)).padStart(2, "0")}:{String(displayedSeconds % 60).padStart(2, "0")}</span>
          <b>{earnedToday.toLocaleString()}</b>
          <small>earned</small>
        </div>
        <div className="watch-actions">
          <StatusGrid items={[["Kick", connected ? account.connected.kick.username || "Linked" : "Not linked"], ["Verify", summary?.verified ? "Live" : summary?.verificationMode === "chat" ? "Chat" : "OAuth"], ["Rate", summary?.rateLabel ?? "50 / 1m"], ["Earned today", `${earnedToday.toLocaleString()} pts`]]} />
          <div className="watch-credit-row">
            <SignalChip
              icon={Activity}
              label="Watch points credit automatically"
              value={running ? "Earning now" : connected ? "Waiting for stream" : "Connect Kick"}
              tone={running ? "acid" : "cyan"}
              active={running}
            />
          </div>
          {!connected ? <div className="button-row"><a className="button primary" href="/api/auth/kick"><Tv size={16} aria-hidden="true" />Connect Kick</a></div> : null}
        </div>
      </div>
      <AccountStrip account={account} />
    </section>
  );
}

function ProfileWorkspace({
  account,
  setAccount,
}: {
  account: Account;
  setAccount: (value: Account | ((current: Account) => Account)) => void;
}) {
  const { users } = useLeaderboard();
  const [purchases] = useStoredState<Purchase[]>("rankboard-purchases", []);
  const [bets] = useStoredState<Bet[]>("rankboard-bets", []);
  const [profileStatus, setProfileStatus] = useState("Profile ready");
  const [savingCasinos, setSavingCasinos] = useState(false);
  const linkedShuffle = account.casinos.shuffle.trim().toLowerCase();
  const liveUser = linkedShuffle ? users.find((user) => user.username?.toLowerCase() === linkedShuffle || user.name.toLowerCase() === linkedShuffle) : null;
  const lifetimeWager = liveUser?.points ?? account.lifetimeWager;

  function updateCasinoDraft(casino: Casino, value: string) {
    setAccount((current) => {
      const safe = normalizeAccount(current);
      return { ...safe, casinos: { ...safe.casinos, [casino]: value } };
    });
    setProfileStatus("Unsaved casino names");
  }

  async function saveCasinos() {
    setSavingCasinos(true);
    setProfileStatus("Saving casino names");

    if (account.handle === "@guest") {
      setAccount((current) => {
        const safe = normalizeAccount(current);
        return { ...safe, casinos: account.casinos };
      });
      setSavingCasinos(false);
      setProfileStatus("Sign in to sync casino names");
      return;
    }

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ casinos: account.casinos }),
      });
      const payload = (await response.json()) as {
        account?: AuthAccountPayload;
        error?: string;
      };

      if (!response.ok || !payload.account) {
        throw new Error(payload.error ?? "Profile update failed");
      }

      setAccount(accountFromPayload(payload.account));
      setProfileStatus("Casino names saved");
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : "Profile update failed");
    } finally {
      setSavingCasinos(false);
    }
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="Profile" title="Your account" meta={profileStatus === "Profile ready" && liveUser ? `Rank #${liveUser.rank}` : profileStatus} />
      <div className="profile-layout">
        <LiquidGlass as="article" className="profile-card" tone="cyan">
          <AccountImage account={account} className="profile-avatar" />
          <h3>{accountDisplayName(account)}</h3>
          <p>{account.banned ? "Banned" : account.timeoutUntil ? "Timed out" : "Active"}</p>
          <StatusGrid items={[["Points", formatNumberCompact(account.points)], ["Lifetime", formatNumberCompact(lifetimeWager)], ["Rank", liveUser ? `#${liveUser.rank}` : "--"], ["Badges", String(account.badges.length)]]} />
        </LiquidGlass>
        <div className="profile-panels">
          <ConnectionPanel account={account} setAccount={setAccount} onStatus={setProfileStatus} />
          <div className="casino-link-panel">
            {(Object.keys(account.casinos) as Casino[]).map((casino) => (
              <label key={casino}>{casino}<input value={account.casinos[casino]} onChange={(event) => updateCasinoDraft(casino, event.target.value)} placeholder={`${casino} username`} /></label>
            ))}
            <button type="button" onClick={saveCasinos} disabled={savingCasinos}>{savingCasinos ? "Saving" : "Save names"}</button>
          </div>
        </div>
      </div>
      <Inventory items={account.inventory} />
      <PurchaseList purchases={purchases} />
      <BetList bets={bets} />
    </section>
  );
}

function AdminWorkspace({
  account,
  setAccount,
}: {
  account: Account;
  setAccount: (value: Account | ((current: Account) => Account)) => void;
}) {
  const [items, setItems] = useState<ApiStoreItem[]>([]);
  const [purchases, setPurchases] = useState<AdminApiPurchase[]>([]);
  const [markets, setMarkets] = useState<BetMarket[]>([]);
  const [siteBannerInputs, setSiteBannerInputs] = useState({ announcement: "", banner: "", promotion: "" });
  const [siteBannerLoaded, setSiteBannerLoaded] = useState({ announcement: "", banner: "", promotion: "" });
  const [siteBannerBusy, setSiteBannerBusy] = useState(false);
  const [siteBannerStatus, setSiteBannerStatus] = useState("");
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    cost: "5000",
    stock: "10",
    tag: "Reward",
    image: "NEW",
    imageUrl: "",
    imageName: "",
  });
  const [newMarket, setNewMarket] = useState({ title: "", type: "Stream", sideA: "Yes", sideB: "No", oddsA: "2.00", oddsB: "1.50", deadline: "23:00" });
  const [challengeMissions, setChallengeMissions] = useState<AdminChallengeMission[]>([]);
  const [newChallenge, setNewChallenge] = useState({
    slotName: "",
    title: "",
    multiplier: "100",
    reward: "1000",
    cadence: "MILESTONE" as AdminChallengeCadence,
  });
  const [adminChallengeStatus, setAdminChallengeStatus] = useState("Loading missions");
  const [adminTournaments, setAdminTournaments] = useState<ApiTournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [adminTournamentStatus, setAdminTournamentStatus] = useState("Loading tournaments");
  const [bracketParticipants, setBracketParticipants] = useState("");
  const [tournamentBusy, setTournamentBusy] = useState(false);
  const tournamentMutationPending = useRef(false);
  const tournamentMutationVersion = useRef(0);
  const [newTournament, setNewTournament] = useState({
    title: "",
    starts: "",
    prize: "",
    seats: "8",
    participants: "",
  });
  const [tournamentDraft, setTournamentDraft] = useState({ title: "", starts: "", prize: "", seats: "8" });
  const [adminHunts, setAdminHunts] = useState<BonusHunt[]>([]);
  const [adminHuntClips, setAdminHuntClips] = useState<BonusHuntClip[]>([]);
  const [selectedHuntId, setSelectedHuntId] = useState("");
  const [adminHuntStatus, setAdminHuntStatus] = useState("Loading bonus hunts");
  const [huntBusy, setHuntBusy] = useState(false);
  const [newHunt, setNewHunt] = useState<AdminHuntDraft>({
    title: "",
    host: "",
    startsAt: "",
    status: "SCHEDULED",
    startBankroll: "0",
    currentBankroll: "0",
    bonusCount: "10",
    openedCount: "0",
    totalPayout: "0",
    bestMultiplier: "0",
    sortOrder: "0",
  });
  const [huntEditor, setHuntEditor] = useState<AdminHuntDraft | null>(null);
  const [newHuntClipTitle, setNewHuntClipTitle] = useState("");
  const [newHuntClipMultiplier, setNewHuntClipMultiplier] = useState("1");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminQuery, setAdminQuery] = useState("");
  const [selectedAdminUserId, setSelectedAdminUserId] = useState("");
  const [adminUserStatus, setAdminUserStatus] = useState("Loading users");
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [pointAmount, setPointAmount] = useState("1000");
  const [pointNote, setPointNote] = useState("");
  const [pointUpdateBusy, setPointUpdateBusy] = useState(false);
  const [moderationReason, setModerationReason] = useState("Admin action");
  const [adminMarketMessage, setAdminMarketMessage] = useState("");
  const [adminStoreMessage, setAdminStoreMessage] = useState("Loading store");
  const [supportTickets, setSupportTickets] = useState<Ticket[]>([]);
  const [supportStatus, setSupportStatus] = useState("Loading support");
  const [kickEventStatus, setKickEventStatus] = useState("Loading Kick status");
  const [kickStream, setKickStream] = useState<AdminKickStream | null>(null);
  const [kickSubscribeBusy, setKickSubscribeBusy] = useState(false);
  const [watchConfig, setWatchConfig] = useState<WatchPointConfig | null>(null);
  const [watchPointsInput, setWatchPointsInput] = useState("50");
  const [watchMinutesInput, setWatchMinutesInput] = useState("1");
  const [watchConfigBusy, setWatchConfigBusy] = useState(false);
  const isAdmin = isAdminAccount(account);
  const selectedAdminUser =
    adminUsers.find((user) => user.id === selectedAdminUserId) ??
    adminUsers[0] ??
    null;
  const selectedTournament =
    adminTournaments.find((tournament) => tournament.id === selectedTournamentId) ??
    adminTournaments[0] ??
    null;
  const selectedHunt = adminHunts.find((hunt) => hunt.id === selectedHuntId) ?? adminHunts[0] ?? null;
  const selectedHuntClips = selectedHunt ? adminHuntClips.filter((clip) => clip.huntId === selectedHunt.id) : [];

  const reloadAdminHunts = useCallback(async (preferredId?: string) => {
    const response = await fetch("/api/admin/hunts", { cache: "no-store" });
    const payload = (await response.json()) as BonusHuntsPayload & { error?: string };
    if (!response.ok || !payload.hunts) throw new Error(payload.error ?? "Could not load bonus hunts.");
    setAdminHunts(payload.hunts);
    setAdminHuntClips(payload.clips ?? []);
    const nextHunt = payload.hunts.find((hunt) => hunt.id === preferredId) ?? payload.hunts[0] ?? null;
    setSelectedHuntId(nextHunt?.id ?? "");
    setHuntEditor(nextHunt ? adminHuntDraft(nextHunt) : null);
    setAdminHuntStatus(`${payload.hunts.length} hunts loaded · ${payload.hunts.filter((hunt) => hunt.active).length} published`);
    return payload;
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;

    fetch("/api/admin/challenges", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { missions?: AdminChallengeMission[]; error?: string }) => {
        if (!active) return;
        if (payload.missions) {
          setChallengeMissions(payload.missions);
          setAdminChallengeStatus(`${payload.missions.filter((mission) => mission.active).length} published`);
        } else {
          setAdminChallengeStatus(payload.error ?? "Could not load missions");
        }
      })
      .catch(() => {
        if (active) setAdminChallengeStatus("Could not load missions");
      });

    return () => { active = false; };
  }, [isAdmin]);

  const selectedTournamentTitle = selectedTournament?.title ?? "";
  const selectedTournamentStarts = selectedTournament?.starts ?? "";
  const selectedTournamentPrize = selectedTournament?.prize ?? "";
  const selectedTournamentSeats = selectedTournament?.seats ?? 8;
  const currentTournamentId = selectedTournament?.id ?? "";

  useEffect(() => {
    const syncDraft = window.setTimeout(() => {
      setTournamentDraft({ title: selectedTournamentTitle, starts: selectedTournamentStarts, prize: selectedTournamentPrize, seats: String(selectedTournamentSeats) });
    }, 0);
    return () => window.clearTimeout(syncDraft);
  }, [currentTournamentId, selectedTournamentTitle, selectedTournamentStarts, selectedTournamentPrize, selectedTournamentSeats]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    const initialLoad = window.setTimeout(() => {
      void reloadAdminHunts().catch((error) => {
        if (active) setAdminHuntStatus(error instanceof Error ? error.message : "Could not load bonus hunts.");
      });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(initialLoad);
    };
  }, [isAdmin, reloadAdminHunts]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;

    async function refresh() {
      if (tournamentMutationPending.current) return;
      const version = tournamentMutationVersion.current;
      try {
        const response = await fetch("/api/admin/tournaments", { cache: "no-store" });
        const payload = (await response.json()) as { tournaments?: ApiTournament[]; error?: string };
        if (!response.ok || !payload.tournaments) throw new Error(payload.error ?? "Could not load tournaments");
        if (!active || tournamentMutationPending.current || version !== tournamentMutationVersion.current) return;
        setAdminTournaments(payload.tournaments);
        setSelectedTournamentId((current) => payload.tournaments?.some((item) => item.id === current) ? current : (payload.tournaments?.[0]?.id ?? ""));
        setAdminTournamentStatus((current) => current === "Loading tournaments" ? `${payload.tournaments!.length} tournaments loaded` : current);
      } catch (error) {
        if (active) setAdminTournamentStatus(error instanceof Error ? error.message : "Could not load tournaments");
      }
    }
    void refresh();
    const visibleRefresh = () => { if (document.visibilityState === "visible") void refresh(); };
    const interval = window.setInterval(visibleRefresh, 10_000);
    window.addEventListener("focus", visibleRefresh);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener("focus", visibleRefresh); };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;
    fetch("/api/admin/watch-points/config", { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }: { response: Response; payload: { config?: WatchPointConfig; error?: string } }) => {
        if (!active) return;
        if (!response.ok || !payload.config) {
          throw new Error(payload.error ?? "Could not load watch settings");
        }
        setWatchConfig(payload.config);
        setWatchPointsInput(String(payload.config.pointsPerInterval));
        setWatchMinutesInput(String(payload.config.intervalSeconds / 60));
      })
      .catch((error) => {
        if (active) setKickEventStatus(error instanceof Error ? error.message : "Could not load watch settings");
      });

    return () => { active = false; };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;

    async function refreshKickStream() {
      try {
        const response = await fetch("/api/kick/stream", { cache: "no-store" });
        const payload = (await response.json()) as { stream?: AdminKickStream; error?: string };
        if (!active) return;
        if (!response.ok || !payload.stream) {
          throw new Error(payload.error ?? "Could not load Kick stream state");
        }
        setKickStream(payload.stream);
        setKickEventStatus(payload.stream.isLive ? "Automatic earning is active" : "Waiting for the stream to go live");
      } catch (error) {
        if (active) setKickEventStatus(error instanceof Error ? error.message : "Could not load Kick stream state");
      }
    }

    void refreshKickStream();
    const timer = window.setInterval(refreshKickStream, 30000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;
    fetch("/api/bets/markets", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { markets?: BetMarket[] }) => {
        if (!active) return;
        if (data.markets) {
          setMarkets(data.markets);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;
    fetch("/api/admin/site/banners", { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }: { response: Response; payload: { banner?: { announcement: string; banner: string; promotion: string }; error?: string } }) => {
        if (!active) return;
        if (!response.ok || !payload.banner) {
          throw new Error(payload.error ?? "Could not load site banner");
        }
        const next = { announcement: payload.banner.announcement, banner: payload.banner.banner, promotion: payload.banner.promotion };
        setSiteBannerInputs(next);
        setSiteBannerLoaded(next);
        setSiteBannerStatus("Synced with site");
      })
      .catch((error) => {
        if (active) {
          setSiteBannerStatus(error instanceof Error ? error.message : "Could not load site banner");
        }
      });

    return () => { active = false; };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;

    Promise.all([
      fetch("/api/store/items", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/admin/store/purchases", { cache: "no-store" }).then((response) => response.json()),
    ])
      .then(([itemsPayload, purchasesPayload]: [
        { items?: ApiStoreItem[]; error?: string },
        { purchases?: AdminApiPurchase[]; error?: string },
      ]) => {
        if (!active) return;
        if (itemsPayload.items) setItems(itemsPayload.items);
        if (purchasesPayload.purchases) setPurchases(purchasesPayload.purchases);
        setAdminStoreMessage(
          purchasesPayload.error ??
          itemsPayload.error ??
          `${itemsPayload.items?.length ?? 0} items / ${purchasesPayload.purchases?.length ?? 0} purchases`
        );
      })
      .catch(() => {
        if (active) setAdminStoreMessage("Could not load store admin data");
      });

    return () => { active = false; };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;

    fetch("/api/admin/support/tickets", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ tickets?: Ticket[]; error?: string }>)
      .then((ticketPayload) => {
        if (!active) return;
        if (ticketPayload.tickets) {
          setSupportTickets(ticketPayload.tickets);
          setSupportStatus(`${ticketPayload.tickets.length} tickets loaded`);
        } else {
          setSupportStatus(ticketPayload.error ?? "Could not load support");
        }
      })
      .catch(() => {
        if (!active) return;
        setSupportStatus("Could not load support");
      });

    return () => { active = false; };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setAdminUsersLoading(true);

      try {
        const params = new URLSearchParams();
        if (adminQuery.trim()) {
          params.set("q", adminQuery.trim());
        }
        const response = await fetch(`/api/admin/users?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          users?: AdminUser[];
          error?: string;
        };

        if (!response.ok || !payload.users) {
          throw new Error(payload.error ?? "Could not load users");
        }

        setAdminUsers(payload.users);
        setSelectedAdminUserId((current) => {
          if (current && payload.users?.some((user) => user.id === current)) {
            return current;
          }
          return payload.users?.[0]?.id ?? "";
        });
        setAdminUserStatus(`${payload.users.length} user${payload.users.length === 1 ? "" : "s"} loaded`);
      } catch (error) {
        if (!controller.signal.aborted) {
          setAdminUserStatus(error instanceof Error ? error.message : "Could not load users");
        }
      } finally {
        if (!controller.signal.aborted) {
          setAdminUsersLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [account.handle, adminQuery, isAdmin]);

  if (!isAdmin) {
    return (
      <section className="section page-width app-workspace">
        <WorkspaceHeader
          overline="Admin"
          title="Admin access only"
          meta={account.handle === "@guest" ? "Sign in with an admin account" : `${account.handle} is a player account`}
        />
        <div className="workspace-notice">
          <p>Admin keys required.</p>
          <Link className="button primary" href={account.handle === "@guest" ? "/login" : "/profile"}>
            {account.handle === "@guest" ? "Login" : "Open profile"} <span>↗</span>
          </Link>
        </div>
      </section>
    );
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newItem.title.trim()) {
      setAdminStoreMessage("Add an item name");
      return;
    }
    setAdminStoreMessage("Creating store item...");

    try {
      const response = await fetch("/api/admin/store/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newItem.title.trim(),
          description: newItem.description.trim() || "Admin reward.",
          cost: Math.max(0, Number(newItem.cost) || 0),
          tag: newItem.tag.trim() || "Reward",
          stock: Math.max(0, Number(newItem.stock) || 0),
          unlimited: false,
          imageLabel: newItem.image || "NEW",
          imageUrl: newItem.imageUrl.trim(),
        }),
      });
      const payload = (await response.json()) as { item?: ApiStoreItem; error?: string };
      if (!response.ok || !payload.item) {
        throw new Error(payload.error ?? "Store item creation failed");
      }
      setItems((current) => [payload.item!, ...current]);
      setNewItem({
        title: "",
        description: "",
        cost: "5000",
        stock: "10",
        tag: "Reward",
        image: "NEW",
        imageUrl: "",
        imageName: "",
      });
      setAdminStoreMessage(`Created ${payload.item.title}`);
    } catch (error) {
      setAdminStoreMessage(error instanceof Error ? error.message : "Store item creation failed");
    }
  }

  async function chooseStoreItemImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAdminStoreMessage("Choose an image file");
      event.target.value = "";
      return;
    }

    if (file.size > storeImageMaxBytes) {
      setAdminStoreMessage("Choose an image under 550 KB");
      event.target.value = "";
      return;
    }

    try {
      const imageUrl = await readImageFileAsDataUrl(file);
      setNewItem((current) => ({
        ...current,
        imageUrl,
        imageName: file.name,
      }));
      setAdminStoreMessage(`Image ready: ${file.name}`);
    } catch (error) {
      setAdminStoreMessage(error instanceof Error ? error.message : "Could not read image file");
    } finally {
      event.target.value = "";
    }
  }

  function parseParticipants(value: string) {
    return value.split(/[\n,]+/).map((name) => name.trim()).filter(Boolean);
  }

  function replaceAdminTournament(tournament: ApiTournament) {
    setAdminTournaments((current) => {
      const exists = current.some((item) => item.id === tournament.id);
      return exists
        ? current.map((item) => item.id === tournament.id ? tournament : item)
        : [tournament, ...current];
    });
    setSelectedTournamentId(tournament.id);
  }

  async function publishTournament(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (tournamentBusy) return;
    if (!newTournament.title.trim() || !newTournament.starts.trim() || !newTournament.prize.trim()) {
      setAdminTournamentStatus("Add a title, start time, and prize");
      return;
    }
    setAdminTournamentStatus("Publishing tournament...");

    tournamentMutationVersion.current += 1;
    tournamentMutationPending.current = true;
    setTournamentBusy(true);
    try {
      const response = await fetch("/api/admin/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTournament.title.trim(),
          starts: newTournament.starts.trim(),
          prize: newTournament.prize.trim(),
          seats: Number(newTournament.seats),
          participants: parseParticipants(newTournament.participants),
        }),
      });
      const payload = (await response.json()) as { tournament?: ApiTournament; error?: string };
      if (!response.ok || !payload.tournament) throw new Error(payload.error ?? "Tournament creation failed");
      replaceAdminTournament(payload.tournament);
      setBracketParticipants("");
      setNewTournament({ title: "", starts: "", prize: "", seats: "8", participants: "" });
      setAdminTournamentStatus(`Published ${payload.tournament.title}`);
    } catch (error) {
      setAdminTournamentStatus(error instanceof Error ? error.message : "Tournament creation failed");
    } finally {
      tournamentMutationPending.current = false;
      setTournamentBusy(false);
    }
  }

  async function patchAdminTournament(tournament: ApiTournament, patch: Record<string, string | number | boolean>) {
    if (tournamentBusy) return;
    setAdminTournamentStatus(`Updating ${tournament.title}`);
    tournamentMutationVersion.current += 1;
    tournamentMutationPending.current = true;
    setTournamentBusy(true);
    try {
      const response = await fetch(`/api/admin/tournaments/${tournament.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = (await response.json()) as { tournament?: ApiTournament; error?: string };
      if (!response.ok || !payload.tournament) throw new Error(payload.error ?? "Tournament update failed");
      replaceAdminTournament(payload.tournament);
      setAdminTournamentStatus(`${payload.tournament.title} updated`);
    } catch (error) {
      setAdminTournamentStatus(error instanceof Error ? error.message : "Tournament update failed");
    } finally {
      tournamentMutationPending.current = false;
      setTournamentBusy(false);
    }
  }

  async function saveTournamentDetails() {
    if (!selectedTournament || tournamentBusy) return;
    setAdminTournamentStatus(`Saving ${selectedTournament.title}...`);
    tournamentMutationVersion.current += 1;
    tournamentMutationPending.current = true;
    setTournamentBusy(true);
    try {
      const response = await fetch(`/api/admin/tournaments/${selectedTournament.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: tournamentDraft.title.trim(),
          starts: tournamentDraft.starts.trim(),
          prize: tournamentDraft.prize.trim(),
          seats: Number(tournamentDraft.seats),
        }),
      });
      const payload = (await response.json()) as { tournament?: ApiTournament; error?: string };
      if (!response.ok || !payload.tournament) throw new Error(payload.error ?? "Tournament details could not be saved.");
      replaceAdminTournament(payload.tournament);
      setAdminTournamentStatus(`${payload.tournament.title} saved and published to players`);
    } catch (error) {
      setAdminTournamentStatus(error instanceof Error ? error.message : "Tournament details could not be saved.");
    } finally {
      tournamentMutationPending.current = false;
      setTournamentBusy(false);
    }
  }

  async function generateAdminBracket() {
    if (!selectedTournament || tournamentBusy) return;
    setAdminTournamentStatus("Generating bracket...");
    tournamentMutationVersion.current += 1;
    tournamentMutationPending.current = true;
    setTournamentBusy(true);
    try {
      const response = await fetch(`/api/admin/tournaments/${selectedTournament.id}/bracket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants: parseParticipants(bracketParticipants) }),
      });
      const payload = (await response.json()) as { tournament?: ApiTournament; error?: string };
      if (!response.ok || !payload.tournament) throw new Error(payload.error ?? "Bracket generation failed");
      replaceAdminTournament(payload.tournament);
      setAdminTournamentStatus(`${payload.tournament.matches.length} bracket matches ready`);
    } catch (error) {
      setAdminTournamentStatus(error instanceof Error ? error.message : "Bracket generation failed");
    } finally {
      tournamentMutationPending.current = false;
      setTournamentBusy(false);
    }
  }

  async function updateAdminMatch(match: ApiTournamentMatch, update: MatchUpdate) {
    if (!selectedTournament || tournamentBusy) return;
    setAdminTournamentStatus("Updating bracket...");
    tournamentMutationVersion.current += 1;
    tournamentMutationPending.current = true;
    setTournamentBusy(true);
    try {
      const response = await fetch(`/api/admin/tournaments/${selectedTournament.id}/matches/${match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      const payload = (await response.json()) as { tournament?: ApiTournament; error?: string };
      if (!response.ok || !payload.tournament) throw new Error(payload.error ?? "Match update failed");
      replaceAdminTournament(payload.tournament);
      setAdminTournamentStatus("Bracket published live");
    } catch (error) {
      setAdminTournamentStatus(error instanceof Error ? error.message : "Match update failed");
    } finally {
      tournamentMutationPending.current = false;
      setTournamentBusy(false);
    }
  }

  async function resetAdminBracket() {
    if (!selectedTournament || tournamentBusy || !window.confirm("Reset this bracket and all match results? Registered players are kept and registration reopens.")) return;
    tournamentMutationVersion.current += 1;
    tournamentMutationPending.current = true;
    setTournamentBusy(true);
    try {
      const response = await fetch(`/api/admin/tournaments/${selectedTournament.id}/bracket`, { method: "DELETE" });
      const payload = (await response.json()) as { tournament?: ApiTournament; error?: string };
      if (!response.ok || !payload.tournament) throw new Error(payload.error ?? "Bracket reset failed.");
      replaceAdminTournament(payload.tournament);
      setBracketParticipants("");
      setAdminTournamentStatus("Bracket reset. Registration is open.");
    } catch (error) {
      setAdminTournamentStatus(error instanceof Error ? error.message : "Bracket reset failed.");
    } finally {
      tournamentMutationPending.current = false;
      setTournamentBusy(false);
    }
  }

  function selectAdminHunt(hunt: BonusHunt) {
    setSelectedHuntId(hunt.id);
    setHuntEditor(adminHuntDraft(hunt));
  }

  function huntDraftPayload(draft: AdminHuntDraft) {
    return {
      title: draft.title.trim(),
      host: draft.host.trim(),
      startsAt: draft.startsAt ? new Date(draft.startsAt).toISOString() : null,
      status: draft.status,
      startBankroll: Math.max(0, Number(draft.startBankroll) || 0),
      currentBankroll: Math.max(0, Number(draft.currentBankroll) || 0),
      bonusCount: Math.max(0, Number(draft.bonusCount) || 0),
      openedCount: Math.max(0, Number(draft.openedCount) || 0),
      totalPayout: Math.max(0, Number(draft.totalPayout) || 0),
      bestMultiplier: Math.max(0, Number(draft.bestMultiplier) || 0),
      sortOrder: Math.trunc(Number(draft.sortOrder) || 0),
    };
  }

  async function publishBonusHunt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newHunt.title.trim() || !newHunt.host.trim()) {
      setAdminHuntStatus("Add a hunt title and host.");
      return;
    }
    setHuntBusy(true);
    setAdminHuntStatus("Publishing bonus hunt...");
    try {
      const response = await fetch("/api/admin/hunts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...huntDraftPayload(newHunt), active: true }),
      });
      const payload = (await response.json()) as { hunt?: { id: string }; error?: string };
      if (!response.ok || !payload.hunt) throw new Error(payload.error ?? "Bonus hunt could not be created.");
      await reloadAdminHunts(payload.hunt.id);
      setNewHunt({ title: "", host: "", startsAt: "", status: "SCHEDULED", startBankroll: "0", currentBankroll: "0", bonusCount: "10", openedCount: "0", totalPayout: "0", bestMultiplier: "0", sortOrder: "0" });
      setAdminHuntStatus("Bonus hunt published. Players can see it now.");
    } catch (error) {
      setAdminHuntStatus(error instanceof Error ? error.message : "Bonus hunt could not be created.");
    } finally {
      setHuntBusy(false);
    }
  }

  async function saveBonusHunt() {
    if (!selectedHunt || !huntEditor) return;
    setHuntBusy(true);
    setAdminHuntStatus(`Saving ${selectedHunt.title}...`);
    try {
      const response = await fetch(`/api/admin/hunts/${selectedHunt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(huntDraftPayload(huntEditor)),
      });
      const payload = (await response.json()) as { hunt?: BonusHunt; error?: string };
      if (!response.ok || !payload.hunt) throw new Error(payload.error ?? "Bonus hunt could not be updated.");
      await reloadAdminHunts(selectedHunt.id);
      setAdminHuntStatus(`${payload.hunt.title} saved. Player page will refresh automatically.`);
    } catch (error) {
      setAdminHuntStatus(error instanceof Error ? error.message : "Bonus hunt could not be updated.");
    } finally {
      setHuntBusy(false);
    }
  }

  async function patchBonusHunt(hunt: BonusHunt, patch: { active?: boolean; status?: AdminHuntStatus }) {
    setHuntBusy(true);
    setAdminHuntStatus(`Updating ${hunt.title}...`);
    try {
      const response = await fetch(`/api/admin/hunts/${hunt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = (await response.json()) as { hunt?: BonusHunt; error?: string };
      if (!response.ok || !payload.hunt) throw new Error(payload.error ?? "Bonus hunt could not be updated.");
      await reloadAdminHunts(hunt.id);
      setAdminHuntStatus(`${payload.hunt.title} updated and synced to the player page.`);
    } catch (error) {
      setAdminHuntStatus(error instanceof Error ? error.message : "Bonus hunt could not be updated.");
    } finally {
      setHuntBusy(false);
    }
  }

  async function addBonusHuntClip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedHunt || !newHuntClipTitle.trim()) return;
    setHuntBusy(true);
    try {
      const response = await fetch(`/api/admin/hunts/${selectedHunt.id}/clips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newHuntClipTitle.trim(), multiplier: Math.max(0, Number(newHuntClipMultiplier) || 0) }),
      });
      const payload = (await response.json()) as { clip?: BonusHuntClip; error?: string };
      if (!response.ok || !payload.clip) throw new Error(payload.error ?? "Highlight could not be added.");
      await reloadAdminHunts(selectedHunt.id);
      setNewHuntClipTitle("");
      setNewHuntClipMultiplier("1");
      setAdminHuntStatus("Highlight added and visible to players.");
    } catch (error) {
      setAdminHuntStatus(error instanceof Error ? error.message : "Highlight could not be added.");
    } finally {
      setHuntBusy(false);
    }
  }

  async function saveBonusHuntClip(event: FormEvent<HTMLFormElement>, clip: BonusHuntClip) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const multiplier = Number(form.get("multiplier"));
    if (!selectedHunt || !title || !Number.isFinite(multiplier) || multiplier < 0) return;
    setHuntBusy(true);
    try {
      const response = await fetch(`/api/admin/hunts/${selectedHunt.id}/clips/${clip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, multiplier }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Highlight could not be updated.");
      await reloadAdminHunts(selectedHunt.id);
      setAdminHuntStatus("Highlight saved and synced to players.");
    } catch (error) {
      setAdminHuntStatus(error instanceof Error ? error.message : "Highlight could not be updated.");
    } finally {
      setHuntBusy(false);
    }
  }

  async function removeBonusHuntClip(clip: BonusHuntClip) {
    if (!selectedHunt || !window.confirm(`Remove “${clip.title}”? Its votes and saves will also be removed.`)) return;
    setHuntBusy(true);
    try {
      const response = await fetch(`/api/admin/hunts/${selectedHunt.id}/clips/${clip.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Highlight could not be removed.");
      await reloadAdminHunts(selectedHunt.id);
      setAdminHuntStatus("Highlight removed.");
    } catch (error) {
      setAdminHuntStatus(error instanceof Error ? error.message : "Highlight could not be removed.");
    } finally {
      setHuntBusy(false);
    }
  }

  async function publishChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const slotName = newChallenge.slotName.trim();
    const title = newChallenge.title.trim();
    const multiplier = Math.max(1, Number(newChallenge.multiplier) || 0);
    const reward = Math.max(0, Number(newChallenge.reward) || 0);

    if (!slotName || !title) {
      setAdminChallengeStatus("Add a slot name and challenge name");
      return;
    }

    setAdminChallengeStatus("Publishing mission...");

    try {
      const response = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotName,
          title,
          multiplier,
          reward,
          cadence: newChallenge.cadence,
          active: true,
        }),
      });
      const payload = (await response.json()) as {
        mission?: AdminChallengeMission;
        error?: string;
      };

      if (!response.ok || !payload.mission) {
        throw new Error(payload.error ?? "Mission publish failed");
      }

      setChallengeMissions((current) => [payload.mission!, ...current]);
      setNewChallenge({
        slotName: "",
        title: "",
        multiplier: "100",
        reward: "1000",
        cadence: "MILESTONE",
      });
      setAdminChallengeStatus(`Published ${payload.mission.title}`);
    } catch (error) {
      setAdminChallengeStatus(error instanceof Error ? error.message : "Mission publish failed");
    }
  }

  async function updateChallengeMission(
    mission: AdminChallengeMission,
    patch: Partial<Pick<AdminChallengeMission, "active">>
  ) {
    setAdminChallengeStatus(`Updating ${mission.title}`);

    try {
      const response = await fetch(`/api/admin/challenges/${mission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = (await response.json()) as {
        mission?: AdminChallengeMission;
        error?: string;
      };

      if (!response.ok || !payload.mission) {
        throw new Error(payload.error ?? "Mission update failed");
      }

      setChallengeMissions((current) =>
        current.map((entry) => entry.id === payload.mission?.id ? payload.mission : entry)
      );
      setAdminChallengeStatus(`${payload.mission.title} ${payload.mission.active ? "published" : "hidden"}`);
    } catch (error) {
      setAdminChallengeStatus(error instanceof Error ? error.message : "Mission update failed");
    }
  }

  async function addMarket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newMarket.title.trim()) {
      setAdminMarketMessage("Add a market title");
      return;
    }
    setAdminMarketMessage("Creating market...");
    try {
      const response = await fetch("/api/admin/bets/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newMarket.title.trim(),
          type: newMarket.type,
          deadline: newMarket.deadline,
          sideA: newMarket.sideA || "Yes",
          sideB: newMarket.sideB || "No",
          oddsA: Math.max(1.01, Number(newMarket.oddsA) || 2.0),
          oddsB: Math.max(1.01, Number(newMarket.oddsB) || 1.5),
        }),
      });
      const data = (await response.json()) as { market?: BetMarket; error?: string };
      if (!response.ok || !data.market) {
        throw new Error(data.error ?? "Failed to create market");
      }
      setMarkets((current) => [data.market!, ...current]);
      setNewMarket({ title: "", type: "Stream", sideA: "Yes", sideB: "No", oddsA: "2.00", oddsB: "1.50", deadline: "23:00" });
      setAdminMarketMessage(`Market created: ${data.market.title}`);
    } catch (error) {
      setAdminMarketMessage(error instanceof Error ? error.message : "Failed to create market");
    }
  }

  async function settleMarket(market: BetMarket, winner: string) {
    setAdminMarketMessage(`Settling ${market.title} for ${winner}...`);
    try {
      const response = await fetch("/api/admin/bets/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: market.id,
          winningSide: winner,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        winnersPaid?: number;
        totalPointsPaid?: number;
        error?: string;
      };
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Settlement failed");
      }
      setMarkets((current) =>
        current.map((entry) => (entry.id === market.id ? { ...entry, status: "Settled", winner } : entry))
      );
      setAdminMarketMessage(`Winner picked! Paid ${data.winnersPaid ?? 0} winner${data.winnersPaid === 1 ? "" : "s"} a total of ${(data.totalPointsPaid ?? 0).toLocaleString()} pts.`);
      window.dispatchEvent(new CustomEvent("rankboard-storage"));
    } catch (error) {
      setAdminMarketMessage(error instanceof Error ? error.message : "Settlement failed");
    }
  }

  async function updateSelectedUser(patch: Partial<Pick<AdminUser, "banned" | "bannedReason" | "role">> & { timeoutUntil?: string | null }) {
    if (!selectedAdminUser) return;
    const userId = selectedAdminUser.id;
    const previousUser = selectedAdminUser;
    // Optimistic update so moderation actions feel instant; reverted on failure.
    setAdminUsers((current) =>
      current.map((user) => (user.id === userId ? {
        ...user,
        ...(patch.banned !== undefined ? { banned: patch.banned } : {}),
        ...(patch.bannedReason !== undefined ? { bannedReason: patch.bannedReason } : {}),
        ...(patch.role !== undefined ? { role: patch.role } : {}),
        ...(patch.timeoutUntil !== undefined ? { timeoutUntil: patch.timeoutUntil ?? "" } : {}),
      } : user))
    );
    setAdminUserStatus("Updating user");

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      });
      const payload = (await response.json()) as {
        user?: AdminUser;
        error?: string;
      };

      if (!response.ok || !payload.user) {
        throw new Error(payload.error ?? "User update failed");
      }

      setAdminUsers((current) =>
        current.map((user) => (user.id === payload.user?.id ? payload.user : user))
      );
      setSelectedAdminUserId(payload.user.id);
      setAdminUserStatus(`${payload.user.handle} updated`);
    } catch (error) {
      setAdminUsers((current) =>
        current.map((user) => (user.id === userId ? previousUser : user))
      );
      setAdminUserStatus(error instanceof Error ? error.message : "User update failed");
    }
  }

  async function adjustSelectedPoints(operation: "add" | "deduct" | "set") {
    if (!selectedAdminUser) return;
    const amount = Number(pointAmount);
    if (!Number.isInteger(amount) || amount < 0 || amount > 2_000_000_000) {
      setAdminUserStatus("Enter a whole-number amount from 0 to 2,000,000,000");
      return;
    }

    const previousPoints = selectedAdminUser.points;
    const optimisticPoints =
      operation === "set" ? amount
      : operation === "add" ? Math.min(2_000_000_000, previousPoints + amount)
      : Math.max(0, previousPoints - amount);

    setAdminUsers((current) => current.map((user) =>
      user.id === selectedAdminUser.id ? { ...user, points: optimisticPoints } : user
    ));
    if (selectedAdminUser.handle === account.handle) {
      setAccount((current) => ({ ...normalizeAccount(current), points: optimisticPoints }));
    }
    setAdminUserStatus(`${operation === "set" ? "Setting" : operation === "add" ? "Adding" : "Deducting"} points`);
    setPointUpdateBusy(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedAdminUser.id}/points`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation, amount, note: pointNote.trim() }),
      });
      const payload = (await response.json()) as { ok?: boolean; points?: number; error?: string };
      if (!response.ok || !payload.ok || typeof payload.points !== "number") {
        throw new Error(payload.error ?? "Point update failed");
      }
      setAdminUsers((current) => current.map((user) =>
        user.id === selectedAdminUser.id ? { ...user, points: payload.points! } : user
      ));
      if (selectedAdminUser.handle === account.handle) {
        setAccount((current) => ({ ...normalizeAccount(current), points: payload.points! }));
      }
      setAdminUserStatus(`${selectedAdminUser.handle}: ${payload.points.toLocaleString()} points`);
      setPointNote("");
    } catch (error) {
      setAdminUsers((current) => current.map((user) =>
        user.id === selectedAdminUser.id ? { ...user, points: previousPoints } : user
      ));
      if (selectedAdminUser.handle === account.handle) {
        setAccount((current) => ({ ...normalizeAccount(current), points: previousPoints }));
      }
      setAdminUserStatus(error instanceof Error ? error.message : "Point update failed");
    } finally {
      setPointUpdateBusy(false);
    }
  }

  function timeoutSelectedUser(hours: number) {
    updateSelectedUser({
      timeoutUntil: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
    });
  }

  async function updateStoreItem(item: ApiStoreItem, patch: Partial<ApiStoreItem> & { active?: boolean }) {
    setAdminStoreMessage(`Updating ${item.title}`);

    try {
      const response = await fetch(`/api/admin/store/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = (await response.json()) as { item?: ApiStoreItem; error?: string };
      if (!response.ok || !payload.item) {
        throw new Error(payload.error ?? "Store item update failed");
      }
      if (patch.active === false) {
        setItems((current) => current.filter((entry) => entry.id !== item.id));
      } else {
        setItems((current) => current.map((entry) => entry.id === item.id ? payload.item! : entry));
      }
      setAdminStoreMessage(`${item.title} updated`);
    } catch (error) {
      setAdminStoreMessage(error instanceof Error ? error.message : "Store item update failed");
    }
  }

  async function updatePurchase(purchase: AdminApiPurchase) {
    const nextStatus =
      purchase.status === "PENDING"
        ? "COMPLETED"
        : purchase.status === "COMPLETED"
          ? "PENDING"
          : "PENDING";
    setAdminStoreMessage(`Updating ${purchase.itemTitle}`);

    try {
      const response = await fetch(`/api/admin/store/purchases/${purchase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = (await response.json()) as { purchase?: AdminApiPurchase; error?: string };
      if (!response.ok || !payload.purchase) {
        throw new Error(payload.error ?? "Purchase update failed");
      }
      setPurchases((current) => current.map((entry) => entry.id === purchase.id ? payload.purchase! : entry));
      setAdminStoreMessage(`${purchase.itemTitle} set to ${payload.purchase.status}`);
    } catch (error) {
      setAdminStoreMessage(error instanceof Error ? error.message : "Purchase update failed");
    }
  }

  async function updateTicket(ticket: Ticket) {
    const nextStatus = ticket.status === "Open" ? "Waiting" : ticket.status === "Waiting" ? "Solved" : "Open";
    setSupportStatus(`Updating ${ticket.subject}`);

    try {
      const response = await fetch(`/api/admin/support/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = (await response.json()) as { ticket?: Ticket; error?: string };
      if (!response.ok || !payload.ticket) {
        throw new Error(payload.error ?? "Ticket update failed");
      }
      setSupportTickets((current) => current.map((entry) => entry.id === ticket.id ? payload.ticket! : entry));
      setSupportStatus(`${payload.ticket.subject} set to ${payload.ticket.status}`);
    } catch (error) {
      setSupportStatus(error instanceof Error ? error.message : "Ticket update failed");
    }
  }

  async function subscribeKickEvents() {
    setKickSubscribeBusy(true);
    setKickEventStatus("Syncing Kick events...");

    try {
      const response = await fetch("/api/admin/kick/events/subscribe", { method: "POST" });
      const payload = (await response.json()) as {
        results?: { event: string; ok: boolean; status: number; body: string }[];
        error?: string;
      };
      if (!response.ok || !payload.results) {
        throw new Error(payload.error ?? "Kick subscription failed");
      }
      const failed = payload.results.filter((result) => !result.ok);
      setKickEventStatus(failed.length ? `${failed.length} Kick event subscription(s) failed` : "Kick events are synced");
    } catch (error) {
      setKickEventStatus(error instanceof Error ? error.message : "Kick subscription failed");
    } finally {
      setKickSubscribeBusy(false);
    }
  }

  async function saveWatchConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pointsPerInterval = Number(watchPointsInput);
    const intervalSeconds = Math.round(Number(watchMinutesInput) * 60);

    if (
      !Number.isInteger(pointsPerInterval) || pointsPerInterval < 0 || pointsPerInterval > 1_000_000 ||
      !Number.isInteger(intervalSeconds) || intervalSeconds < 10 || intervalSeconds > 3_600
    ) {
      setKickEventStatus("Use whole-number points and an interval from 0.17 to 60 minutes");
      return;
    }

    setWatchConfigBusy(true);
    setKickEventStatus("Saving automatic earning rate...");
    try {
      const response = await fetch("/api/admin/watch-points/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pointsPerInterval, intervalSeconds, dailyBonus: 0 }),
      });
      const payload = (await response.json()) as { config?: WatchPointConfig; error?: string };
      if (!response.ok || !payload.config) {
        throw new Error(payload.error ?? "Watch settings could not be saved");
      }
      setWatchConfig(payload.config);
      setWatchPointsInput(String(payload.config.pointsPerInterval));
      setWatchMinutesInput(String(payload.config.intervalSeconds / 60));
      setKickEventStatus(`Saved ${payload.config.pointsPerInterval} points every ${payload.config.intervalSeconds / 60} minute(s)`);
    } catch (error) {
      setKickEventStatus(error instanceof Error ? error.message : "Watch settings could not be saved");
    } finally {
      setWatchConfigBusy(false);
    }
  }

  async function saveSiteBanner() {
    const next = siteBannerInputs;
    const previous = siteBannerLoaded;
    setSiteBannerBusy(true);
    setSiteBannerLoaded(next);
    setSiteBannerStatus("Saving banner...");

    try {
      const response = await fetch("/api/admin/site/banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const payload = (await response.json()) as {
        banner?: { announcement: string; banner: string; promotion: string };
        error?: string;
      };
      if (!response.ok || !payload.banner) {
        throw new Error(payload.error ?? "Site banner could not be saved");
      }
      const saved = {
        announcement: payload.banner.announcement,
        banner: payload.banner.banner,
        promotion: payload.banner.promotion,
      };
      setSiteBannerInputs(saved);
      setSiteBannerLoaded(saved);
      setSiteBannerStatus("Live on site");
    } catch (error) {
      setSiteBannerLoaded(previous);
      setSiteBannerStatus(error instanceof Error ? error.message : "Site banner could not be saved");
    } finally {
      setSiteBannerBusy(false);
    }
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="Admin" title="Control room" meta={adminUserStatus} />
      <LiquidGlass className="admin-user-manager" tone="violet">
        <div className="admin-user-manager__bar">
          <label>FIND A PLAYER<input value={adminQuery} onChange={(event) => setAdminQuery(event.target.value)} placeholder="Name, email, Kick, Discord, or Shuffle" /></label>
          <button type="button" onClick={() => setAdminQuery((value) => value.trim())} disabled={adminUsersLoading}>{adminUsersLoading ? "Loading" : "Refresh"}</button>
        </div>
        <div className="admin-user-layout">
          <div className="admin-user-list">
            {adminUsers.length ? adminUsers.map((user) => (
              <button className={selectedAdminUser?.id === user.id ? "selected" : ""} key={user.id} type="button" onClick={() => setSelectedAdminUserId(user.id)}>
                <span>{user.image ? <Image src={user.image} alt="" width={42} height={42} unoptimized /> : user.handle.slice(1, 3).toUpperCase()}</span>
                <strong>{user.handle}</strong>
                <small>{user.role} / {user.banned ? "BANNED" : user.timeoutUntil ? "TIMEOUT" : "ACTIVE"}</small>
              </button>
            )) : <p>{adminUsersLoading ? "Loading users." : "No users found."}</p>}
          </div>
          <LiquidGlass as="article" className="admin-user-detail" tone="cyan">
            {selectedAdminUser ? (
              <>
                <div className="admin-user-detail__head">
                  <span>{selectedAdminUser.image ? <Image src={selectedAdminUser.image} alt="" width={42} height={42} unoptimized /> : selectedAdminUser.handle.slice(1, 3).toUpperCase()}</span>
                  <div>
                    <small>{selectedAdminUser.email || "No email"}</small>
                    <h3>{selectedAdminUser.handle}</h3>
                    <p>{selectedAdminUser.connected.kick.connected ? `Kick ${selectedAdminUser.connected.kick.username}` : "Kick off"} / {selectedAdminUser.connected.discord.connected ? `Discord ${selectedAdminUser.connected.discord.username}` : "Discord off"}</p>
                  </div>
                </div>
                <StatusGrid items={[["Points", formatNumberCompact(selectedAdminUser.points)], ["Role", selectedAdminUser.role], ["State", selectedAdminUser.banned ? "Banned" : selectedAdminUser.timeoutUntil ? "Timed out" : "Active"]]} />
                <div className="admin-point-control">
                  <div>
                    <label>POINT AMOUNT<input type="number" min="0" max="2000000000" step="1" inputMode="numeric" value={pointAmount} onChange={(event) => setPointAmount(event.target.value)} /></label>
                    <label>NOTE (OPTIONAL)<input value={pointNote} maxLength={120} onChange={(event) => setPointNote(event.target.value)} placeholder="Reason for the ledger" /></label>
                  </div>
                  <div className="admin-point-actions">
                    <button type="button" disabled={pointUpdateBusy} onClick={() => adjustSelectedPoints("add")}>Add</button>
                    <button type="button" disabled={pointUpdateBusy} onClick={() => adjustSelectedPoints("deduct")}>Deduct</button>
                    <button type="button" disabled={pointUpdateBusy} onClick={() => adjustSelectedPoints("set")}>Set exact</button>
                  </div>
                  <small>Current balance: {selectedAdminUser.points.toLocaleString()} points</small>
                </div>
                <div className="admin-moderation-control">
                  <label>MODERATION REASON<input value={moderationReason} maxLength={160} onChange={(event) => setModerationReason(event.target.value)} /></label>
                  <div className="admin-action-grid">
                    <button type="button" onClick={() => updateSelectedUser({ banned: !selectedAdminUser.banned, bannedReason: selectedAdminUser.banned ? "" : moderationReason.trim() || "Admin action" })}>{selectedAdminUser.banned ? "Unban" : "Ban"}</button>
                    <button type="button" onClick={() => timeoutSelectedUser(24)}>24h timeout</button>
                    <button type="button" onClick={() => updateSelectedUser({ timeoutUntil: null })}>Clear timeout</button>
                    <button type="button" onClick={() => updateSelectedUser({ role: selectedAdminUser.role === "ADMIN" ? "PLAYER" : "ADMIN" })}>{selectedAdminUser.role === "ADMIN" ? "Demote" : "Promote"}</button>
                  </div>
                </div>
                <div className="admin-casino-strip">
                  {(Object.keys(selectedAdminUser.casinos) as Casino[]).map((casino) => <span key={casino}>{casino}<b>{selectedAdminUser.casinos[casino] || "Not linked"}</b></span>)}
                </div>
              </>
            ) : (
              <p className="admin-empty-state">Choose a player to manage points and access.</p>
            )}
          </LiquidGlass>
        </div>
      </LiquidGlass>
      <div className="admin-grid">
        <LiquidGlass as="article" className="admin-panel admin-panel--wide" tone="violet">
          <h3>Site banners</h3>
          <label>Announcement<input maxLength={200} value={siteBannerInputs.announcement} onChange={(event) => setSiteBannerInputs((current) => ({ ...current, announcement: event.target.value }))} /></label>
          <label>Banner<input maxLength={200} value={siteBannerInputs.banner} onChange={(event) => setSiteBannerInputs((current) => ({ ...current, banner: event.target.value }))} /></label>
          <label>Promo<input maxLength={200} value={siteBannerInputs.promotion} onChange={(event) => setSiteBannerInputs((current) => ({ ...current, promotion: event.target.value }))} /></label>
          <div className="button-row">
            <button className="button primary" type="button" onClick={saveSiteBanner} disabled={siteBannerBusy}>{siteBannerBusy ? "Saving" : "Save banners"} <span>↗</span></button>
          </div>
          <p className="admin-helper-text">{siteBannerStatus || "Publishes to the site ticker"}</p>
        </LiquidGlass>
        <LiquidGlass as="article" className="admin-panel admin-panel--wide" tone="success">
          <small>KICK WATCH</small>
          <h3>Automatic earning</h3>
          <div className={`admin-kick-monitor${kickStream?.isLive ? " is-live" : ""}`}>
            <span><Radio size={21} strokeWidth={2.6} aria-hidden="true" /></span>
            <div>
              <small>{kickStream?.channelSlug ? `@${kickStream.channelSlug}` : "Kick channel"}</small>
              <strong>{kickStream?.isLive ? "Stream is live" : "Stream is offline"}</strong>
            </div>
            <time>{kickStream?.checkedAt || kickStream?.lastEventAt ? `Checked ${new Date(kickStream.checkedAt ?? kickStream.lastEventAt ?? "").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Waiting for Kick"}</time>
          </div>
          <StatusGrid items={[["Signal", kickStream?.isLive ? "Live" : "Offline"], ["Source", kickStream?.source === "kick_api" ? "Kick API" : "Webhook"], ["Rate", watchConfig ? `${watchConfig.pointsPerInterval} / ${watchConfig.intervalSeconds / 60}m` : "Loading"]]} />
          <form className="admin-watch-config" onSubmit={saveWatchConfig}>
            <label>POINTS<input type="number" min="0" max="1000000" step="1" inputMode="numeric" value={watchPointsInput} onChange={(event) => setWatchPointsInput(event.target.value)} /></label>
            <label>EVERY (MINUTES)<input type="number" min="0.17" max="60" step="0.01" inputMode="decimal" value={watchMinutesInput} onChange={(event) => setWatchMinutesInput(event.target.value)} /></label>
            <button className="button primary" type="submit" disabled={watchConfigBusy}>{watchConfigBusy ? "Saving" : "Save rate"}</button>
          </form>
          <div className="button-row">
            <button className="button ghost" type="button" onClick={subscribeKickEvents} disabled={kickSubscribeBusy}>{kickSubscribeBusy ? "Syncing" : "Sync Kick events"} <span>↗</span></button>
          </div>
          <p className="admin-helper-text">{kickEventStatus}</p>
        </LiquidGlass>
      </div>
      <div className="admin-section-title">
        <div>
          <p>Tournaments</p>
          <h2>Create & manage</h2>
        </div>
      </div>
      <p className="admin-note" role="status">{adminTournamentStatus}</p>
      <form className="support-form account-form tournament-create-form" onSubmit={publishTournament}>
        <label>TITLE<input required maxLength={100} value={newTournament.title} onChange={(event) => setNewTournament((current) => ({ ...current, title: event.target.value }))} placeholder="ARTZ Friday Clash" /></label>
        <label>START<input required maxLength={100} value={newTournament.starts} onChange={(event) => setNewTournament((current) => ({ ...current, starts: event.target.value }))} placeholder="Friday 21:00" /></label>
        <label>PRIZE<input required maxLength={80} value={newTournament.prize} onChange={(event) => setNewTournament((current) => ({ ...current, prize: event.target.value }))} placeholder="50K pts" /></label>
        <label>SEATS<input type="number" min="2" max="64" step="1" required value={newTournament.seats} inputMode="numeric" onChange={(event) => setNewTournament((current) => ({ ...current, seats: event.target.value.replace(/\D/g, "") }))} /></label>
        <label className="tournament-participant-field">SEEDS (OPTIONAL)<textarea value={newTournament.participants} onChange={(event) => setNewTournament((current) => ({ ...current, participants: event.target.value }))} placeholder={"One player per line\n@player_one\n@player_two"} /></label>
        <button className="button primary" type="submit" disabled={tournamentBusy}>{tournamentBusy ? "Saving…" : "Create tournament"} <span>↗</span></button>
      </form>
      <div className="workspace-list admin-tournament-list">
        {adminTournaments.map((tournament) => (
          <article className={selectedTournament?.id === tournament.id ? "selected" : ""} key={tournament.id}>
            <span>{tournament.active ? tournament.status : "Hidden"}</span>
            <div><h3>{tournament.title}</h3><p>{tournament.starts} · {tournament.prize} · {tournament.matches.length} matches</p></div>
            <button type="button" disabled={tournamentBusy} onClick={() => {
              setSelectedTournamentId(tournament.id);
              setBracketParticipants("");
            }}>Edit</button>
            <button type="button" disabled={tournamentBusy} onClick={() => patchAdminTournament(tournament, { active: !tournament.active })}>{tournament.active ? "Hide" : "Publish"}</button>
          </article>
        ))}
      </div>
      {selectedTournament ? (
        <LiquidGlass className="admin-tournament-manager" tone="violet">
          <div className="admin-tournament-manager__head">
            <div><small>BRACKET EDITOR</small><h3>{selectedTournament.title}</h3><p>{selectedTournament.taken} registered · {selectedTournament.matches.length} matches</p></div>
            <div className="button-row">
              <button className="button ghost" type="button" onClick={() => patchAdminTournament(selectedTournament, { status: "OPEN" })} disabled={tournamentBusy || Boolean(selectedTournament.matches.length)}>Open registration</button>
              <button className="button ghost" type="button" onClick={() => patchAdminTournament(selectedTournament, { status: "LOCKED" })} disabled={tournamentBusy || selectedTournament.status === "Completed"}>Lock registration</button>
              {selectedTournament.matches.length > 0 && <button className="button ghost" type="button" disabled={tournamentBusy} onClick={() => void resetAdminBracket()}>Reset bracket</button>}
            </div>
          </div>
          <form className="support-form account-form tournament-edit-form" onSubmit={(event) => { event.preventDefault(); void saveTournamentDetails(); }}>
            <label>TITLE<input required maxLength={100} value={tournamentDraft.title} onChange={(event) => setTournamentDraft((current) => ({ ...current, title: event.target.value }))} /></label>
            <label>START<input required maxLength={100} value={tournamentDraft.starts} onChange={(event) => setTournamentDraft((current) => ({ ...current, starts: event.target.value }))} /></label>
            <label>PRIZE<input required maxLength={80} value={tournamentDraft.prize} onChange={(event) => setTournamentDraft((current) => ({ ...current, prize: event.target.value }))} /></label>
            <label>SEAT LIMIT<input type="number" min="2" max="64" step="1" value={tournamentDraft.seats} onChange={(event) => setTournamentDraft((current) => ({ ...current, seats: event.target.value }))} /></label>
            <button className="button primary" type="submit" disabled={tournamentBusy}>Save tournament details <span>↗</span></button>
          </form>
          <div className="admin-tournament-entrants">
            <div><small>REGISTRATION</small><strong>{selectedTournament.taken} / {selectedTournament.seats} players</strong></div>
            {selectedTournament.entrants.length ? <ul>{selectedTournament.entrants.map((entrant, index) => <li key={`${entrant}-${index}`}>{entrant}</li>)}</ul> : <p>No players registered yet.</p>}
          </div>
          <div className="admin-bracket-seeds" hidden={Boolean(selectedTournament.matches.length)}>
            <label>BRACKET SEEDS<textarea value={bracketParticipants} onChange={(event) => setBracketParticipants(event.target.value)} placeholder="Leave blank to use registered players" /></label>
            <button className="button primary" type="button" onClick={generateAdminBracket} disabled={tournamentBusy}>Generate bracket <span>↗</span></button>
          </div>
          {selectedTournament.matches.length ? <TournamentBracket tournament={selectedTournament} busy={tournamentBusy} onUpdate={updateAdminMatch} /> : <p className="admin-note">Add seed names or use registered players, then generate the bracket.</p>}
        </LiquidGlass>
      ) : null}
      <div className="admin-section-title">
        <div>
          <p>Bonus hunts</p>
          <h2>Create & run hunts</h2>
        </div>
      </div>
      <p className="admin-note" role="status">{adminHuntStatus}</p>
      <form className="support-form account-form bonus-hunt-admin-form" onSubmit={publishBonusHunt}>
        <label>HUNT TITLE<input required maxLength={100} value={newHunt.title} onChange={(event) => setNewHunt((current) => ({ ...current, title: event.target.value }))} placeholder="ARTZ Friday Bonus Hunt" /></label>
        <label>HOST<input required maxLength={80} value={newHunt.host} onChange={(event) => setNewHunt((current) => ({ ...current, host: event.target.value }))} placeholder="Streamer name" /></label>
        <label>START TIME<input type="datetime-local" value={newHunt.startsAt} onChange={(event) => setNewHunt((current) => ({ ...current, startsAt: event.target.value }))} /></label>
        <label>STATUS<select value={newHunt.status} onChange={(event) => setNewHunt((current) => ({ ...current, status: event.target.value as AdminHuntStatus }))}><option value="SCHEDULED">Upcoming</option><option value="LIVE">Live</option><option value="COMPLETED">Completed</option></select></label>
        <label>START BANKROLL<input type="number" min="0" max="2000000000" step="1" value={newHunt.startBankroll} onChange={(event) => setNewHunt((current) => ({ ...current, startBankroll: event.target.value }))} /></label>
        <label>CURRENT BANKROLL<input type="number" min="0" max="2000000000" step="1" value={newHunt.currentBankroll} onChange={(event) => setNewHunt((current) => ({ ...current, currentBankroll: event.target.value }))} /></label>
        <label>BONUSES PLANNED<input type="number" min="0" max="100000" step="1" value={newHunt.bonusCount} onChange={(event) => setNewHunt((current) => ({ ...current, bonusCount: event.target.value }))} /></label>
        <label>BONUSES OPENED<input type="number" min="0" max="100000" step="1" value={newHunt.openedCount} onChange={(event) => setNewHunt((current) => ({ ...current, openedCount: event.target.value }))} /></label>
        <label>TOTAL PAYOUT<input type="number" min="0" max="2000000000" step="1" value={newHunt.totalPayout} onChange={(event) => setNewHunt((current) => ({ ...current, totalPayout: event.target.value }))} /></label>
        <label>BEST MULTIPLIER<input type="number" min="0" max="1000000000" step="any" value={newHunt.bestMultiplier} onChange={(event) => setNewHunt((current) => ({ ...current, bestMultiplier: event.target.value }))} /></label>
        <label>SORT ORDER<input type="number" min="-1000000" max="1000000" step="1" value={newHunt.sortOrder} onChange={(event) => setNewHunt((current) => ({ ...current, sortOrder: event.target.value }))} /></label>
        <button className="button primary" type="submit" disabled={huntBusy}>{huntBusy ? "Saving" : "Create & publish hunt"} <span>↗</span></button>
      </form>
      <div className="workspace-list admin-hunt-list">
        {adminHunts.length ? adminHunts.map((hunt) => (
          <article className={selectedHunt?.id === hunt.id ? "selected" : ""} key={hunt.id}>
            <span>{hunt.active ? hunt.status : "Hidden"}</span>
            <div><h3>{hunt.title}</h3><p>{hunt.host} · {formatHuntTime(hunt)} · {hunt.openedCount}/{hunt.bonusCount} bonuses · {adminHuntClips.filter((clip) => clip.huntId === hunt.id).length} highlights</p></div>
            <button type="button" onClick={() => selectAdminHunt(hunt)}>Manage</button>
            <button type="button" disabled={huntBusy} onClick={() => void patchBonusHunt(hunt, { active: !hunt.active })}>{hunt.active ? "Hide" : "Publish"}</button>
          </article>
        )) : <article><span>EMPTY</span><div><h3>No bonus hunts yet</h3><p>Create a hunt above to publish it to players.</p></div></article>}
      </div>
      {selectedHunt && huntEditor ? (
        <LiquidGlass className="admin-hunt-manager" tone="violet">
          <div className="admin-tournament-manager__head">
            <div><h3>{selectedHunt.title}</h3><p>{selectedHunt.active ? "Published" : "Hidden"} · {selectedHuntClips.length} highlights</p></div>
            <div className="button-row">
              <button className="button ghost" type="button" disabled={huntBusy} onClick={() => void patchBonusHunt(selectedHunt, { status: "SCHEDULED" })}>Set upcoming</button>
              <button className="button ghost" type="button" disabled={huntBusy} onClick={() => void patchBonusHunt(selectedHunt, { status: "LIVE" })}>Go live</button>
              <button className="button primary" type="button" disabled={huntBusy} onClick={() => void patchBonusHunt(selectedHunt, { status: "COMPLETED" })}>Complete</button>
            </div>
          </div>
          <form className="support-form account-form bonus-hunt-admin-form bonus-hunt-edit-form" onSubmit={(event) => { event.preventDefault(); void saveBonusHunt(); }}>
            <label>TITLE<input required maxLength={100} value={huntEditor.title} onChange={(event) => setHuntEditor((current) => current ? { ...current, title: event.target.value } : current)} /></label>
            <label>HOST<input required maxLength={80} value={huntEditor.host} onChange={(event) => setHuntEditor((current) => current ? { ...current, host: event.target.value } : current)} /></label>
            <label>START TIME<input type="datetime-local" value={huntEditor.startsAt} onChange={(event) => setHuntEditor((current) => current ? { ...current, startsAt: event.target.value } : current)} /></label>
            <label>STATUS<select value={huntEditor.status} onChange={(event) => setHuntEditor((current) => current ? { ...current, status: event.target.value as AdminHuntStatus } : current)}><option value="SCHEDULED">Upcoming</option><option value="LIVE">Live</option><option value="COMPLETED">Completed</option></select></label>
            <label>START BANKROLL<input type="number" min="0" max="2000000000" step="1" value={huntEditor.startBankroll} onChange={(event) => setHuntEditor((current) => current ? { ...current, startBankroll: event.target.value } : current)} /></label>
            <label>CURRENT BANKROLL<input type="number" min="0" max="2000000000" step="1" value={huntEditor.currentBankroll} onChange={(event) => setHuntEditor((current) => current ? { ...current, currentBankroll: event.target.value } : current)} /></label>
            <label>BONUSES PLANNED<input type="number" min="0" max="100000" step="1" value={huntEditor.bonusCount} onChange={(event) => setHuntEditor((current) => current ? { ...current, bonusCount: event.target.value } : current)} /></label>
            <label>BONUSES OPENED<input type="number" min="0" max="100000" step="1" value={huntEditor.openedCount} onChange={(event) => setHuntEditor((current) => current ? { ...current, openedCount: event.target.value } : current)} /></label>
            <label>TOTAL PAYOUT<input type="number" min="0" max="2000000000" step="1" value={huntEditor.totalPayout} onChange={(event) => setHuntEditor((current) => current ? { ...current, totalPayout: event.target.value } : current)} /></label>
            <label>BEST MULTIPLIER<input type="number" min="0" max="1000000000" step="any" value={huntEditor.bestMultiplier} onChange={(event) => setHuntEditor((current) => current ? { ...current, bestMultiplier: event.target.value } : current)} /></label>
            <label>SORT ORDER<input type="number" min="-1000000" max="1000000" step="1" value={huntEditor.sortOrder} onChange={(event) => setHuntEditor((current) => current ? { ...current, sortOrder: event.target.value } : current)} /></label>
            <button className="button primary" type="submit" disabled={huntBusy}>{huntBusy ? "Saving" : "Save hunt details"} <span>↗</span></button>
          </form>
          <div className="admin-section-title"><div><h2>Highlights</h2></div></div>
          <form className="support-form account-form admin-hunt-clip-create" onSubmit={addBonusHuntClip}>
            <label>HIGHLIGHT TITLE<input required maxLength={100} value={newHuntClipTitle} onChange={(event) => setNewHuntClipTitle(event.target.value)} placeholder="The 500x reveal" /></label>
            <label>MULTIPLIER<input type="number" min="0" max="1000000000" step="any" value={newHuntClipMultiplier} onChange={(event) => setNewHuntClipMultiplier(event.target.value)} /></label>
            <button className="button primary" type="submit" disabled={huntBusy}>Add highlight <span>↗</span></button>
          </form>
          <div className="workspace-list admin-hunt-clips">
            {selectedHuntClips.length ? selectedHuntClips.map((clip) => (
              <form key={`${clip.id}-${clip.title}-${clip.multiplier}`} onSubmit={(event) => void saveBonusHuntClip(event, clip)}>
                <label>TITLE<input name="title" required maxLength={100} defaultValue={clip.title} /></label>
                <label>MULTIPLIER<input name="multiplier" type="number" min="0" max="1000000000" step="any" defaultValue={clip.multiplier} /></label>
                <span>{clip.votes} votes</span>
                <button type="submit" disabled={huntBusy}>Save</button>
                <button type="button" disabled={huntBusy} onClick={() => void removeBonusHuntClip(clip)}>Remove</button>
              </form>
            )) : <article><span>EMPTY</span><div><h3>No highlights yet</h3><p>Add a highlight to feature it on the player page.</p></div></article>}
          </div>
        </LiquidGlass>
      ) : null}
      <div className="admin-section-title">
        <div>
          <p>Bonus challenges</p>
          <h2>Add a challenge</h2>
        </div>
      </div>
      <p className="admin-note">{adminChallengeStatus}</p>
      <form className="support-form account-form" onSubmit={publishChallenge}>
        <label>SLOT<input value={newChallenge.slotName} onChange={(event) => setNewChallenge((current) => ({ ...current, slotName: event.target.value }))} placeholder="Sweet Bonanza" /></label>
        <label>CHALLENGE<input value={newChallenge.title} onChange={(event) => setNewChallenge((current) => ({ ...current, title: event.target.value }))} placeholder="Hit 500x multi" /></label>
        <label>MULTI<input value={newChallenge.multiplier} inputMode="numeric" onChange={(event) => setNewChallenge((current) => ({ ...current, multiplier: event.target.value.replace(/\D/g, "") }))} placeholder="500" /></label>
        <label>POINTS<input value={newChallenge.reward} inputMode="numeric" onChange={(event) => setNewChallenge((current) => ({ ...current, reward: event.target.value.replace(/\D/g, "") }))} placeholder="1000" /></label>
        <label>TYPE<select value={newChallenge.cadence} onChange={(event) => setNewChallenge((current) => ({ ...current, cadence: event.target.value as AdminChallengeCadence }))}>{adminChallengeCadences.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <button className="button primary" type="submit">Publish mission <span>↗</span></button>
      </form>
      <div className="workspace-list">
        {challengeMissions.length ? challengeMissions.map((mission) => (
          <article key={mission.id}>
            <span>{mission.active ? "Published" : "Hidden"}</span>
            <div>
              <h3>{mission.title}</h3>
              <p>{mission.meta} / {mission.goal.toLocaleString()}x / {mission.reward.toLocaleString()} pts / {mission.cadence}</p>
            </div>
            <button type="button" onClick={() => updateChallengeMission(mission, { active: !mission.active })}>
              {mission.active ? "Hide" : "Publish"}
            </button>
          </article>
        )) : <article><span>EMPTY</span><div><h3>No missions</h3><p>{adminChallengeStatus}</p></div></article>}
      </div>
      {/* Store Catalog Management */}
      <div className="admin-section-title">
        <div>
          <p>Store rewards</p>
          <h2>Manage items</h2>
        </div>
      </div>
      <p className="admin-note">{adminStoreMessage}</p>
      <form className="support-form account-form" onSubmit={addItem}>
        <label>ITEM<input value={newItem.title} onChange={(event) => setNewItem((current) => ({ ...current, title: event.target.value }))} placeholder="Reward name" /></label>
        <label>DESC<input value={newItem.description} onChange={(event) => setNewItem((current) => ({ ...current, description: event.target.value }))} placeholder="Short item detail" /></label>
        <label>PRICE<input value={newItem.cost} inputMode="numeric" onChange={(event) => setNewItem((current) => ({ ...current, cost: event.target.value.replace(/\D/g, "") }))} /></label>
        <label>STOCK<input value={newItem.stock} inputMode="numeric" onChange={(event) => setNewItem((current) => ({ ...current, stock: event.target.value.replace(/\D/g, "") }))} /></label>
        <label>TAG<input value={newItem.tag} onChange={(event) => setNewItem((current) => ({ ...current, tag: event.target.value }))} placeholder="Reward" /></label>
        <label>BADGE<input value={newItem.image} onChange={(event) => setNewItem((current) => ({ ...current, image: event.target.value.toUpperCase().slice(0, 12) }))} placeholder="NEW" /></label>
        <label>IMAGE URL<input value={newItem.imageUrl.startsWith("data:image/") ? newItem.imageName || "Uploaded image" : newItem.imageUrl} onChange={(event) => setNewItem((current) => ({ ...current, imageUrl: event.target.value, imageName: "" }))} placeholder="https://..." /></label>
        <label>IMAGE FILE<input type="file" accept="image/*" onChange={chooseStoreItemImage} /></label>
        {newItem.imageUrl && (
          <div className="store-image-preview">
            <span style={storeImageStyle(newItem.imageUrl)} aria-hidden="true" />
            <p>{newItem.imageName || "Image preview"}</p>
            <button type="button" onClick={() => setNewItem((current) => ({ ...current, imageUrl: "", imageName: "" }))}>Clear</button>
          </div>
        )}
        <button className="button primary" type="submit">Add item <span>↗</span></button>
      </form>
      <div className="workspace-list">
        {items.map((item) => {
          const StoreIcon = getStoreItemIcon(item);
          return (
          <article key={item.id}>
            <span
              className={`list-icon store-list-thumb ${item.imageUrl ? "store-list-thumb--image" : ""}`}
              style={storeImageStyle(item.imageUrl)}
              title={item.tag}
            >
              {!item.imageUrl && <StoreIcon size={16} strokeWidth={2.6} aria-hidden="true" />}
            </span>
            <div><h3>{item.title}</h3><p>{item.cost.toLocaleString()} pts / {item.unlimited ? "unlimited" : `${item.stock} stock`}</p></div>
            <button type="button" onClick={() => updateStoreItem(item, { unlimited: !item.unlimited })}>{item.unlimited ? "Limit" : "Unlimited"}</button>
            <button type="button" onClick={() => updateStoreItem(item, { active: false })}>Remove</button>
          </article>
          );
        })}
      </div>

      {/* Bet Markets & Settlement Section */}
      <div className="admin-section-title">
        <div>
          <p>Betting</p>
          <h2>Pick the winner</h2>
        </div>
      </div>
      <form className="support-form account-form" onSubmit={addMarket}>
        <label>MARKET<input value={newMarket.title} onChange={(event) => setNewMarket((current) => ({ ...current, title: event.target.value }))} placeholder="Will streamer hit max win?" /></label>
        <label>SIDE A<input value={newMarket.sideA} onChange={(event) => setNewMarket((current) => ({ ...current, sideA: event.target.value }))} placeholder="Yes" /></label>
        <label>ODDS A<input value={newMarket.oddsA} onChange={(event) => setNewMarket((current) => ({ ...current, oddsA: event.target.value }))} placeholder="2.00" /></label>
        <label>SIDE B<input value={newMarket.sideB} onChange={(event) => setNewMarket((current) => ({ ...current, sideB: event.target.value }))} placeholder="No" /></label>
        <label>ODDS B<input value={newMarket.oddsB} onChange={(event) => setNewMarket((current) => ({ ...current, oddsB: event.target.value }))} placeholder="1.50" /></label>
        <button className="button primary" type="submit">Add bet market <span>↗</span></button>
      </form>
      {adminMarketMessage && (
        <p className="admin-success-callout">
          {adminMarketMessage}
        </p>
      )}
      <div className="workspace-list workspace-list--offset">
        {markets.map((market) => (
          <article
            key={market.id}
            className={`market-admin-row ${market.status === "Live" ? "live" : ""}`}
          >
            <span className="status-badge">{market.status}</span>
            <div className="market-admin-info">
              <h3>{market.title}</h3>
              <p>
                {market.sides[0]} ({market.odds[0]}x) vs {market.sides[1]} ({market.odds[1]}x)
                {market.winner && (
                  <span className="market-winner">
                    · {market.winner} won
                  </span>
                )}
              </p>
            </div>
            {market.status === "Live" && (
              <div className="admin-inline-actions">
                <button
                  type="button"
                  className="settle-btn win"
                  onClick={() => settleMarket(market, market.sides[0])}
                >
                  {market.sides[0]} wins
                </button>
                <button
                  type="button"
                  className="settle-btn lose"
                  onClick={() => settleMarket(market, market.sides[1])}
                >
                  {market.sides[1]} wins
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Support Inbox */}
      <div className="admin-section-title">
        <div>
          <p>Support</p>
          <h2>Reply to tickets</h2>
        </div>
      </div>
      <div className="workspace-list">
        {supportTickets.length ? supportTickets.map((ticket) => (
          <article key={ticket.id}>
            <span>{ticket.status}</span>
            <div>
              <h3>{ticket.subject}</h3>
              <p>{ticket.handle ?? "Guest"} / {ticket.category} / {new Date(ticket.updatedAt ?? ticket.createdAt).toLocaleString()}</p>
            </div>
            <button type="button" onClick={() => updateTicket(ticket)}>Advance</button>
          </article>
        )) : <article><span>EMPTY</span><div><h3>No support tickets</h3><p>{supportStatus}</p></div></article>}
      </div>

      {/* Store Claims Fulfillment */}
      <div className="admin-section-title">
        <div>
          <p>Store orders</p>
          <h2>Deliver rewards</h2>
        </div>
      </div>
      <div className="workspace-list">
        {purchases.length ? purchases.map((purchase) => (
          <article key={purchase.id}>
            <span>{purchase.status === "COMPLETED" ? "Done" : purchase.status === "REJECTED" ? "Rejected" : "Pending"}</span>
            <div>
              <h3>{purchase.itemTitle}</h3>
              <p>{purchase.userHandle} / {purchase.cost.toLocaleString()} pts / {new Date(purchase.createdAt).toLocaleString()}</p>
            </div>
            <button type="button" onClick={() => updatePurchase(purchase)}>Advance</button>
          </article>
        )) : <article><span>EMPTY</span><div><h3>No purchases</h3><p>Recent store redemptions will appear here.</p></div></article>}
      </div>
    </section>
  );
}

function HelpWorkspace() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const clean = query.trim().toLowerCase();
    return clean ? faq.filter((item) => `${item.q} ${item.a}`.toLowerCase().includes(clean)) : faq;
  }, [query]);

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="Help Center" title="Find answers" meta="" />
      <label className="wide-search">
        <span>SEARCH HELP</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Points, rewards, bets" />
      </label>
      <div className="workspace-list help-answers">
        {!results.length && <article><div><h3>No answers found</h3><p>Try another search or contact support.</p></div></article>}
        {results.map((item) => (
          <article key={item.q}>
            <div>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          </article>
        ))}
      </div>
      <Link className="button ghost" href="/support">Contact support <ArrowUpRight size={16} aria-hidden="true" /></Link>
    </section>
  );
}

function SupportWorkspace() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [category, setCategory] = useState("Reward");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("Loading tickets...");

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      try {
        const response = await fetch("/api/support/tickets", { cache: "no-store" });
        const payload = (await response.json()) as { tickets?: Ticket[]; error?: string };
        if (!active) return;
        if (payload.tickets) {
          setTickets(payload.tickets);
          setStatus("");
        } else {
          setStatus(payload.error ?? "Could not load tickets.");
        }
      } catch {
        if (active) setStatus("Could not load tickets.");
      }
    }

    void loadTickets();
    const refresh = () => {
      if (document.visibilityState === "visible") void loadTickets();
    };
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setStatus("Add a subject and message.");
      return;
    }
    setStatus("Creating ticket...");

    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, message }),
      });
      const payload = (await response.json()) as { ticket?: Ticket; error?: string };
      if (!response.ok || !payload.ticket) {
        throw new Error(payload.error ?? "Ticket creation failed.");
      }
      setTickets((current) => [payload.ticket!, ...current]);
      setSubject("");
      setMessage("");
      setStatus("Ticket created.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ticket creation failed.");
    }
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="Support" title="Open a ticket" meta={status} />
      <form className="support-form" onSubmit={submit}>
        <label>CATEGORY<select value={category} onChange={(event) => setCategory(event.target.value)}><option>Reward</option><option>Account</option><option>Leaderboard</option><option>Claim</option></select></label>
        <label>SUBJECT<input required value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="What broke?" /></label>
        <label>MESSAGE<textarea required value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Useful details." /></label>
        <button className="button primary" type="submit" disabled={!subject.trim() || !message.trim()}>Create ticket <span>↗</span></button>
      </form>
      <div className="workspace-list">
        {tickets.length ? tickets.map((ticket) => (
          <article key={ticket.id}>
            <span>{ticket.status}</span>
            <div>
              <h3>{ticket.subject}</h3>
              <p>{ticket.category} / {new Date(ticket.createdAt).toLocaleString()}</p>
            </div>
          </article>
        )) : <article className="workspace-empty-card"><h3>No tickets yet</h3></article>}
      </div>
    </section>
  );
}

function LoginWorkspace({
  account,
  setAccount,
}: {
  account: Account;
  setAccount: (value: Account | ((current: Account) => Account)) => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState(account.handle === "@guest" ? "" : account.handle.replace(/^@/, ""));
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(account.handle === "@guest" ? "Signed out" : "Session active");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          account: AuthAccountPayload | null;
        };

        if (!active) {
          return;
        }

        if (payload.account) {
          const nextAccount = accountFromPayload(payload.account);
          setAccount(nextAccount);
          setDisplayName(nextAccount.handle.replace(/^@/, ""));
          setStatus("Session active");
          return;
        }

        setAccount(defaultAccount);
        setStatus("Signed out");
      } catch {
        if (active) {
          setStatus("Session check failed");
        }
      }
    }

    loadSession();

    return () => {
      active = false;
    };
  }, [setAccount]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const authError = params.get("auth_error");
      const discord = params.get("discord");
      const kick = params.get("kick");

      if (kick === "connected") {
        setStatus("Kick connected");
      } else if (discord === "connected") {
        setStatus("Discord connected");
      } else if (authError) {
        setStatus("Login failed");
      }

      if (kick || discord || authError) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(mode === "signup" ? "Creating account" : "Signing in");

    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          email,
          password,
          displayName: mode === "signup" ? displayName : undefined,
        }),
      });
      const payload = (await response.json()) as {
        account?: AuthAccountPayload;
        error?: string;
      };

      if (!response.ok || !payload.account) {
        throw new Error(payload.error ?? "Login failed");
      }

      const nextAccount = accountFromPayload(payload.account);
      setAccount(nextAccount);
      setDisplayName(nextAccount.handle.replace(/^@/, ""));
      setPassword("");
      setStatus("Session active");
      window.location.assign(accountDestination(nextAccount));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setStatus("Signing out");

    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
      });
      setAccount(defaultAccount);
      setEmail("");
      setDisplayName("");
      setPassword("");
      setStatus("Signed out");
      window.localStorage.removeItem("rankboard-account");
      window.dispatchEvent(new CustomEvent("rankboard-storage"));
    } catch {
      setStatus("Sign out failed");
    } finally {
      setBusy(false);
    }
  }

  function beginOauth(provider: Provider) {
    setBusy(true);
    setStatus(`Opening ${provider === "kick" ? "Kick" : "Discord"}`);
    window.location.assign(`/api/auth/${provider}`);
  }

  const signedIn = account.handle !== "@guest";

  return (
    <section className="section page-width app-workspace auth-workspace">
      <WorkspaceHeader overline="Account" title={signedIn ? "Your account" : "Choose your login"} meta={status === "Signed out" || status === "Session active" ? "" : status} />
      <div className="auth-modal-shell" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="auth-panel">
          <div className="auth-copy">
            <h3 id="auth-title">{signedIn ? "Account active" : "Let’s play."}</h3>
            {signedIn && <span>{account.handle}</span>}
          </div>
          <div className="auth-card">
            {signedIn ? (
              <>
                <div className="auth-session-card">
                  <AccountImage account={account} className="auth-avatar" />
                  <div>
                    <strong>{accountDisplayName(account)}</strong>
                    <small>{accountProviderLabel(account)}</small>
                  </div>
                </div>
                <StatusGrid items={[["Points", formatNumberCompact(account.points)], ["Role", isAdminAccount(account) ? "Admin" : "Player"], ["Kick", account.connected.kick.connected ? "Linked" : "Off"], ["Discord", account.connected.discord.connected ? "Linked" : "Off"]]} />
                <div className="auth-session-actions">
                  <Link className="button primary" href={accountDestination(account)}>{accountDestinationLabel(account)} <span>↗</span></Link>
                  <button className="button ghost" type="button" onClick={signOut} disabled={busy}>{busy ? "Working" : "Logout"} <span>↻</span></button>
                </div>
              </>
            ) : (
              <>
                <div className="auth-tabs" role="tablist" aria-label="Login mode">
                  <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button>
                  <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create</button>
                </div>
                <form className="auth-form" onSubmit={submit}>
                  {mode === "signup" ? <label>DISPLAY NAME<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Player name" autoComplete="name" /></label> : null}
                  <label>EMAIL<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" autoComplete="email" required /></label>
                  <label>PASSWORD<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "signup" ? "12+ chars" : "Password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? 12 : 1} maxLength={128} /></label>
                  <button className="button primary" type="submit" disabled={busy}>{busy ? "Working" : mode === "signup" ? "Create account" : "Sign in"} <span>↗</span></button>
                </form>
                <div className="auth-divider"><span>OR</span></div>
                <div className="auth-actions">
                  <button className="button ghost" type="button" onClick={() => beginOauth("discord")} disabled={busy}>Login with Discord <span>◇</span></button>
                  <button className="button ghost" type="button" onClick={() => beginOauth("kick")} disabled={busy}>Login with Kick <span>●</span></button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {signedIn && <ConnectionPanel account={account} setAccount={setAccount} onStatus={setStatus} />}
      {signedIn && <Inventory items={account.inventory} />}
    </section>
  );
}

function ConnectionPanel({
  account,
  setAccount,
  onStatus,
}: {
  account: Account;
  setAccount: (value: Account | ((current: Account) => Account)) => void;
  onStatus?: (status: string) => void;
}) {
  const [busyProvider, setBusyProvider] = useState<Provider | null>(null);

  async function toggle(provider: Provider) {
    const label = provider === "kick" ? "Kick" : "Discord";

    if (provider === "kick" && !account.connected.kick.connected) {
      onStatus?.("Opening Kick");
      window.location.assign("/api/auth/kick");
      return;
    }

    if (provider === "discord" && !account.connected.discord.connected) {
      onStatus?.("Opening Discord");
      window.location.assign("/api/auth/discord");
      return;
    }

    setBusyProvider(provider);
    onStatus?.(`Disconnecting ${label}`);

    try {
      const response = await fetch(`/api/auth/connections/${provider}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as {
        account?: AuthAccountPayload;
        error?: string;
      };

      if (!response.ok || !payload.account) {
        throw new Error(payload.error ?? `Could not disconnect ${label}`);
      }

      setAccount(accountFromPayload(payload.account));
      onStatus?.(`${label} disconnected`);
    } catch (error) {
      onStatus?.(error instanceof Error ? error.message : `Could not disconnect ${label}`);
    } finally {
      setBusyProvider(null);
    }
  }

  return (
    <div className="connection-grid">
      {(["kick", "discord"] as Provider[]).map((provider) => {
        const state = account.connected[provider];
        return (
          <LiquidGlass
            as="article"
            className={`connection-card ${state.connected ? "connected" : ""}`}
            key={provider}
            tone={provider === "kick" ? "success" : "violet"}
          >
            <small>{provider.toUpperCase()}</small>
            <h3>{state.connected ? state.username : "Not linked"}</h3>
            <button type="button" onClick={() => toggle(provider)} disabled={busyProvider === provider}>{busyProvider === provider ? "Working" : state.connected ? "Disconnect" : `Login ${provider}`}</button>
          </LiquidGlass>
        );
      })}
    </div>
  );
}

function WorkspaceHeader({ overline, title, meta }: { overline: string; title: string; meta: string }) {
  const Icon = workspaceIcons[overline] ?? Sparkles;
  return (
    <div className="workspace-heading">
      <div className="workspace-heading__title">
        <span className="workspace-heading__icon" title={overline}><Icon size={19} strokeWidth={2.8} aria-hidden="true" /><span className="sr-only">{overline}</span></span>
        <h2>{title}</h2>
      </div>
      {meta.trim() && <LiquidGlass as="span" className="workspace-heading__status" depth="clear" interactive={false} tone="cyan" role="status">
        <Activity size={16} strokeWidth={3} aria-hidden="true" />{meta}
      </LiquidGlass>}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return <div className="workspace-progress"><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

function AccountStrip({ account }: { account: Account }) {
  if (account.handle === "@guest") return null;
  const stats: { label: string; value: string; icon: WorkspaceIcon }[] = [
    { label: "Player", value: account.handle, icon: CircleUserRound },
    { label: "Points", value: account.points.toLocaleString(), icon: Coins },
  ];

  return (
    <div className="account-strip" aria-label="Player summary">
      {stats.map(({ label, value, icon: Icon }) => (
        <div key={label}>
          <span className="account-strip__icon"><Icon size={18} strokeWidth={2.6} aria-hidden="true" /></span>
          <span className="account-strip__copy"><small>{label}</small><strong>{value}</strong></span>
        </div>
      ))}
    </div>
  );
}

function StatusGrid({ items }: { items: [string, string][] }) {
  return (
    <div className="status-grid">
      {items.map(([label, value]) => {
        const Icon = iconForLabel(label);
        return (
          <div key={label}>
            <span><Icon size={13} strokeWidth={3} aria-hidden="true" />{label}</span>
            <strong>{value}</strong>
          </div>
        );
      })}
    </div>
  );
}

function Inventory({ items }: { items: string[] }) {
  return (
    <div className="inventory-panel">
      <small>INVENTORY</small>
      {items.length ? <div>{items.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div> : <p>Store empty.</p>}
    </div>
  );
}

function PurchaseList({ purchases, onAdvance }: { purchases: Purchase[]; onAdvance?: (purchase: Purchase) => void }) {
  return (
    <div className="workspace-list">
      {purchases.length ? purchases.map((purchase) => (
        <article key={purchase.id}>
          <span><PackageCheck size={13} strokeWidth={3} aria-hidden="true" />{purchase.status}</span>
          <div><h3>{purchase.item}</h3><p>{purchase.cost.toLocaleString()} pts / {purchase.createdAt}</p></div>
          {onAdvance ? <button type="button" onClick={() => onAdvance(purchase)}>Advance</button> : <Link href="/support">Track <ArrowUpRight size={13} strokeWidth={3} aria-hidden="true" /></Link>}
        </article>
      )) : <article><span>EMPTY</span><div><h3>No purchases</h3><p>Store ready.</p></div></article>}
    </div>
  );
}

function BetList({ bets }: { bets: Bet[] }) {
  return (
    <div className="workspace-list">
      {bets.length ? bets.map((bet) => (
        <article key={bet.id}>
          <span><ReceiptText size={13} strokeWidth={3} aria-hidden="true" />{bet.status}</span>
          <div><h3>{bet.marketTitle}</h3><p>{bet.side} / {bet.amount.toLocaleString()} @ {bet.odds.toFixed(2)}x</p></div>
          <strong>{bet.status === "Won" ? `+${Math.floor(bet.amount * bet.odds).toLocaleString()}` : bet.createdAt}</strong>
        </article>
      )) : <article><span className="list-icon"><ReceiptText size={16} aria-hidden="true" /></span><div><h3>No bets</h3></div></article>}
    </div>
  );
}
