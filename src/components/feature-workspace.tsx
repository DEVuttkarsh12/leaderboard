"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Coins,
  Crown,
  Dumbbell,
  Gamepad2,
  Gem,
  Gift,
  Headphones,
  LayoutDashboard,
  PackageCheck,
  PackageOpen,
  ReceiptText,
  Shield,
  Shirt,
  ShoppingBag,
  Sparkles,
  Ticket,
  Trophy,
  Tv,
  WalletCards,
  XCircle,
} from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { AuthAccountPayload } from "@/lib/auth/account";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { formatNumberCompact } from "@/lib/formatters";

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
  xp: number;
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
  claimablePoints: number;
  dailyBonusAvailable: boolean;
  dailyBonus: number;
  rateLabel: string;
  points: number;
  xp: number;
};

type ApiHunt = {
  id: string;
  title: string;
  time: string;
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
};

type ApiHuntClip = {
  id: string;
  huntId: string;
  title: string;
  stat: string;
  votes: number;
  saved: boolean;
  voted: boolean;
  multiplier: number;
};

type RafflePayload = {
  round: {
    id: string;
    title: string;
    ticketRateWager: number;
    status: "Open" | "Drawing" | "Closed";
    totalEntries: number;
    winnerEntryId: string | null;
    drawnAt: string | null;
  };
  account: {
    tickets: number;
    entries: number;
  };
  entries: {
    id: string;
    handle: string;
    ticketCount: number;
    createdAt: string;
  }[];
  winner?: {
    id: string;
    handle: string;
    ticketCount: number;
    createdAt: string;
  };
};

type ApiTournament = {
  id: string;
  title: string;
  starts: string;
  prize: string;
  seats: number;
  taken: number;
  joined: boolean;
  status: "Open" | "Locked" | "Completed";
};

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

type SiteConfig = {
  announcement: string;
  banner: string;
  promotion: string;
  prizePool: number;
  leaderboardMode: "Weekly" | "Bi-weekly" | "Monthly";
  leaderboardStatus: "Live" | "Ended";
};

const defaultAccount: Account = {
  handle: "@guest",
  image: "",
  profileProvider: "email",
  accessKey: "",
  points: 18500,
  xp: 4200,
  streak: 3,
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
  badges: ["Early", "Season 08"],
};

const defaultSiteConfig: SiteConfig = {
  announcement: "Double watch points live",
  banner: "Season 08 prize sprint",
  promotion: "VIP role restocked",
  prizePool: 40000,
  leaderboardMode: "Weekly",
  leaderboardStatus: "Live",
};

const faq = [
  { q: "Weighted XP", a: "Live API. Read-only." },
  { q: "Kick points", a: "Watch. Claim. Spend." },
  { q: "Store rewards", a: "Pending to fulfilled." },
  { q: "Custom bets", a: "Admin settles." },
  { q: "Casino names", a: "Link in profile." },
];

const workspaceIcons: Record<string, WorkspaceIcon> = {
  Admin: LayoutDashboard,
  Account: Shield,
  "Bonus Hunts": Sparkles,
  Challenges: BadgeCheck,
  "Custom Bets": Ticket,
  "Help Center": Headphones,
  Profile: WalletCards,
  "Reward Store": Gift,
  Support: Headphones,
  Tournaments: Trophy,
  "Wager Raffles": Ticket,
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
  XP: Sparkles,
};

function iconForLabel(label: string) {
  return statusIcons[label] ?? Activity;
}

function normalizeAccount(value: Partial<Account> | null | undefined): Account {
  return {
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
  const initials = account.handle.slice(1, 3).toUpperCase() || "RB";

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
  const account = useMemo(() => normalizeAccount(rawAccount), [rawAccount]);

  useEffect(() => {
    let active = true;

    async function syncSession() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const payload = (await res.json()) as { account: AuthAccountPayload | null };
        if (!active) return;

        if (payload.account) {
          const next = accountFromPayload(payload.account);
          setRawAccount(next);
        }
      } catch {
        // ignore
      }
    }

    syncSession();
    return () => {
      active = false;
    };
  }, [setRawAccount]);

  return [account, setRawAccount] as const;
}

export default function FeatureWorkspace({ route }: { route: string }) {
  const [account, setAccount] = useAccountState();

  if (route === "challenges") return <ChallengesWorkspace account={account} setAccount={setAccount} />;
  if (route === "bonus-hunts") return <HuntsWorkspace />;
  if (route === "tournaments") return <TournamentsWorkspace />;
  if (route === "wager-raffles") return <RafflesWorkspace account={account} />;
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
  const [message, setMessage] = useState("Loading missions...");
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
        setMessage("Charge missions and claim rewards.");
      } catch {
        if (activeRequest) setMessage("Could not load missions.");
      }
    }

    loadMissions();
    return () => {
      activeRequest = false;
    };
  }, []);

  async function pushProgress(id: string) {
    setPendingMissionId(id);
    setMessage("Saving progress...");
    try {
      const response = await fetch("/api/challenges/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId: id, amount: 25 }),
      });
      const payload = (await response.json()) as {
        mission?: ChallengeMission;
        error?: string;
      };
      if (!response.ok || !payload.mission) {
        setMessage(payload.error ?? "Progress failed.");
        return;
      }
      replaceMission(payload.mission);
      setMessage(payload.mission.progress >= payload.mission.goal ? "Mission ready to claim." : "Progress saved.");
    } catch {
      setMessage("Progress failed.");
    } finally {
      setPendingMissionId("");
    }
  }

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
        newXp?: number;
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
          xp: payload.newXp ?? safe.xp,
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
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="Missions" title="Daily & weekly missions" meta={`${active} active · ${claimable} ready · ${message}`} />
      <div className="workspace-grid">
        {missionList.map((mission) => {
          const percent = mission.goal > 0 ? Math.round((mission.progress / mission.goal) * 100) : 0;
          const displayPercent = Math.min(100, Math.max(0, percent));
          const isClaimed = mission.claimed;
          const ready = mission.progress >= mission.goal && !isClaimed;
          const isPending = pendingMissionId === mission.id;
          return (
            <article className="action-card" key={mission.id}>
              <small>{mission.meta}</small>
              <h3>{mission.title}</h3>
              <p>{displayPercent}% charged</p>
              <ProgressBar value={displayPercent} />
              <div className="action-card__footer">
                <strong>{isClaimed ? "Claimed" : `${mission.reward.toLocaleString()} pts`}</strong>
                <button type="button" onClick={() => ready ? claimMission(mission.id) : pushProgress(mission.id)} disabled={isClaimed || Boolean(pendingMissionId)}>
                  {isPending ? "Saving" : isClaimed ? "Done" : ready ? "Claim" : "Progress"}
                </button>
              </div>
            </article>
          );
        })}
        {!missionList.length && (
          <article className="action-card">
            <small>Loading</small>
            <h3>Missions syncing</h3>
            <p>Server mission state will appear here.</p>
            <ProgressBar value={0} />
          </article>
        )}
      </div>
      <AccountStrip account={account} />
    </section>
  );
}

function HuntsWorkspace() {
  const [huntList, setHuntList] = useState<ApiHunt[]>([]);
  const [clipList, setClipList] = useState<ApiHuntClip[]>([]);
  const [message, setMessage] = useState("Loading hunts...");
  const [busyId, setBusyId] = useState("");

  function applyHunts(payload: { hunts?: ApiHunt[]; clips?: ApiHuntClip[] }) {
    setHuntList(payload.hunts ?? []);
    setClipList(payload.clips ?? []);
  }

  useEffect(() => {
    let active = true;

    fetch("/api/hunts", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { hunts?: ApiHunt[]; clips?: ApiHuntClip[]; error?: string }) => {
        if (!active) return;
        if (payload.hunts && payload.clips) {
          applyHunts(payload);
          setMessage("Hunt sessions synced.");
        } else {
          setMessage(payload.error ?? "Could not load hunts.");
        }
      })
      .catch(() => { if (active) setMessage("Could not load hunts."); });

    return () => { active = false; };
  }, []);

  async function postHuntAction(path: string, body: Record<string, string>) {
    const id = body.huntId ?? body.clipId ?? path;
    setBusyId(id);

    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as {
        hunts?: ApiHunt[];
        clips?: ApiHuntClip[];
        error?: string;
      };
      if (!response.ok || !payload.hunts || !payload.clips) {
        throw new Error(payload.error ?? "Action failed.");
      }
      applyHunts(payload);
      setMessage("Hunt state saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusyId("");
    }
  }

  const followedCount = huntList.filter((hunt) => hunt.followed).length;
  const savedCount = clipList.filter((clip) => clip.saved).length;

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="Bonus Hunts" title="Live hunt sessions" meta={`${followedCount} followed · ${savedCount} clips saved · ${message}`} />
      <div className="workspace-grid two">
        {huntList.map((hunt) => (
          <article className="action-card casino-card" key={hunt.id}>
            <small>{hunt.status} / {hunt.time}</small>
            <h3>{hunt.title}</h3>
            <p>{hunt.host} / {hunt.heat}% heat / best {hunt.bestMultiplier.toLocaleString()}x</p>
            <ProgressBar value={hunt.heat} />
            <div className="action-card__footer">
              <strong>{hunt.followed ? "Reminder on" : "Reminder off"}</strong>
              <button type="button" disabled={busyId === hunt.id} onClick={() => postHuntAction("/api/hunts/follow", { huntId: hunt.id })}>
                {hunt.followed ? "Unfollow" : "Follow"}
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="workspace-list">
        {clipList.map((clip) => (
          <article key={clip.id}>
            <span>CLIP</span>
            <div>
              <h3>{clip.title}</h3>
              <p>{clip.votes} votes / {clip.saved ? "saved" : clip.stat}</p>
            </div>
            <button type="button" disabled={clip.voted || busyId === clip.id} onClick={() => postHuntAction("/api/hunts/clips/vote", { clipId: clip.id })}>{clip.voted ? "Voted" : "Vote"}</button>
            <button type="button" disabled={busyId === clip.id} onClick={() => postHuntAction("/api/hunts/clips/save", { clipId: clip.id })}>{clip.saved ? "Saved" : "Save"}</button>
          </article>
        ))}
        {!clipList.length && <article><span>EMPTY</span><div><h3>No clips yet</h3><p>Live hunt clips will appear here.</p></div></article>}
      </div>
    </section>
  );
}

function TournamentsWorkspace() {
  const [tournamentList, setTournamentList] = useState<ApiTournament[]>([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("Loading tournaments...");
  const tournament = tournamentList.find((item) => item.id === selected) ?? tournamentList[0] ?? null;
  const registrations = tournamentList.filter((item) => item.joined).length;

  useEffect(() => {
    let active = true;

    fetch("/api/tournaments", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { tournaments?: ApiTournament[]; error?: string }) => {
        if (!active) return;
        if (payload.tournaments) {
          setTournamentList(payload.tournaments);
          setSelected((current) => current || (payload.tournaments?.[0]?.id ?? ""));
          setMessage("Tournaments synced.");
        } else {
          setMessage(payload.error ?? "Could not load tournaments.");
        }
      })
      .catch(() => { if (active) setMessage("Could not load tournaments."); });

    return () => { active = false; };
  }, []);

  async function toggleEntry() {
    if (!tournament) return;
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
    }
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="Tournaments" title="Brackets & prize pools" meta={`${registrations} entries · ${message}`} />
      <div className="workspace-grid three">
        {tournamentList.map((item) => (
          <article className={`action-card ${selected === item.id ? "selected" : ""}`} key={item.id}>
            <small>{item.starts}</small>
            <h3>{item.title}</h3>
            <p>{item.taken} / {item.seats} / {item.prize}</p>
            <ProgressBar value={(item.taken / item.seats) * 100} />
            <div className="action-card__footer">
              <strong>{item.joined ? "Entered" : item.status}</strong>
              <button type="button" onClick={() => setSelected(item.id)}>View</button>
            </div>
          </article>
        ))}
      </div>
      {tournament ? (
        <div className="bracket-panel">
          <div>
            <small>ACTIVE BRACKET</small>
            <h3>{tournament.title}</h3>
            <p>{tournament.prize}</p>
          </div>
          <div className="bracket-lanes">
            {["Qualifiers", "Quarterfinal", "Semifinal", "Final"].map((round, index) => (
              <span key={round}>{round}<b>{index === 0 ? tournament.taken : Math.max(2, Math.round(tournament.taken / (index + 2)))}</b></span>
            ))}
          </div>
          <button type="button" onClick={toggleEntry} disabled={tournament.status !== "Open"}>
            {tournament.joined ? "Withdraw" : "Enter"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function RafflesWorkspace({ account }: { account: Account }) {
  const [raffle, setRaffle] = useState<RafflePayload | null>(null);
  const [message, setMessage] = useState("Loading raffle...");
  const [busy, setBusy] = useState(false);
  const [wager, setWager] = useState("10000");
  const ticketRate = raffle?.round.ticketRateWager ?? 10000;
  const tickets = raffle?.account.tickets ?? 0;
  const entries = raffle?.account.entries ?? 0;
  const generated = Math.max(0, Math.floor(Number(wager || 0) / ticketRate));

  useEffect(() => {
    let active = true;

    fetch("/api/raffles", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { raffle?: RafflePayload; error?: string }) => {
        if (!active) return;
        if (payload.raffle) {
          setRaffle(payload.raffle);
          setMessage("Raffle synced.");
        } else {
          setMessage(payload.error ?? "Could not load raffle.");
        }
      })
      .catch(() => { if (active) setMessage("Could not load raffle."); });

    return () => { active = false; };
  }, []);

  async function postRaffle(path: string, body: Record<string, number | string>) {
    setBusy(true);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as {
        raffle?: RafflePayload;
        error?: string;
      };
      if (!response.ok || !payload.raffle) {
        throw new Error(payload.error ?? "Raffle action failed.");
      }
      setRaffle(payload.raffle);
      setMessage(payload.raffle.winner ? `Winner: ${payload.raffle.winner.handle}` : "Raffle state saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Raffle action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="Wager Raffles" title={raffle?.round.title ?? "Turn wagers into tickets"} meta={`${tickets} tickets · ${entries} entries · ${message}`} />
      <div className="tool-panel">
        <label>
          WAGER AMOUNT
          <input value={wager} inputMode="numeric" onChange={(event) => setWager(event.target.value.replace(/\D/g, ""))} />
        </label>
        <div><small>GENERATES</small><strong>{generated}</strong><span>tickets</span></div>
        <button type="button" onClick={() => postRaffle("/api/raffles/convert", { wagerAmount: Number(wager || 0) })} disabled={busy || generated === 0}>Convert</button>
      </div>
      <div className="workspace-grid three">
        {[1, 5, 10].map((amount) => (
          <article className="action-card" key={amount}>
            <small>DRAW ENTRY</small>
            <h3>{amount} ticket{amount > 1 ? "s" : ""}</h3>
            <p>{tickets >= amount ? "Ready" : "Locked"}</p>
            <div className="action-card__footer">
              <strong>{tickets >= amount ? "Ready" : "Need tickets"}</strong>
              <button type="button" disabled={busy || tickets < amount} onClick={() => postRaffle("/api/raffles/enter", { ticketCount: amount })}>
                Enter
              </button>
            </div>
          </article>
        ))}
      </div>
      {account.badges.includes("Admin") && raffle?.round.status === "Open" && (
        <div className="tool-panel tool-panel--offset">
          <div><small>DRAW TOOL</small><strong>{raffle.round.totalEntries}</strong><span>weighted entries</span></div>
          <button type="button" disabled={busy || raffle.round.totalEntries <= 0} onClick={() => postRaffle("/api/admin/raffles/draw", { roundId: raffle.round.id })}>Draw winner</button>
        </div>
      )}
      <div className="workspace-list">
        {raffle?.entries.length ? raffle.entries.map((entry) => (
          <article key={entry.id}>
            <span>{entry.ticketCount}x</span>
            <div>
              <h3>{entry.handle}</h3>
              <p>{new Date(entry.createdAt).toLocaleString()}</p>
            </div>
          </article>
        )) : <article><span>EMPTY</span><div><h3>No raffle entries</h3><p>Convert wagers and enter tickets above.</p></div></article>}
      </div>
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
};

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
    fetch("/api/store/items", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { items?: ApiStoreItem[]; error?: string }) => {
        if (!active) return;
        if (data.items) {
          setItems(data.items);
          setMessage(isGuest ? "Sign in to redeem rewards." : "Store ready.");
        } else {
          setMessage(data.error ?? "Could not load items.");
        }
      })
      .catch(() => { if (active) setMessage("Could not load items."); });
    return () => { active = false; };
  }, [isGuest]);

  // Load purchase history from server (only if signed in)
  useEffect(() => {
    if (isGuest) return;
    let active = true;
    fetch("/api/store/purchases", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { purchases?: ApiPurchase[]; error?: string }) => {
        if (!active) return;
        if (data.purchases) setPurchases(data.purchases);
      })
      .catch(() => {});
    return () => { active = false; };
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
      setMessage(`${item.title} redeemed — pending fulfillment.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Redemption failed.");
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="Reward Store" title="Redeem your points" meta={message} />
      <AccountStrip account={account} />
      {isGuest && (
        <div className="workspace-notice">
          <p>Sign in to redeem store rewards and track your purchases.</p>
          <a className="button primary" href="/login">Sign in <span>↗</span></a>
        </div>
      )}
      <div className="workspace-grid">
        {items.length === 0 && !isGuest && (
          <p className="workspace-loading">Loading items...</p>
        )}
        {items.map((item) => {
          const isBusy = busyItemId === item.id;
          const canAfford = account.points >= item.cost;
          const inStock = item.unlimited || item.stock > 0;
          const StoreIcon = getStoreItemIcon(item);
          return (
            <article className="action-card reward-card" key={item.id}>
              <small>{item.tag} / {item.unlimited ? "Unlimited" : `${item.stock} left`}</small>
              <div className="reward-art" aria-hidden="true"><StoreIcon size={28} strokeWidth={2.5} /></div>
              <h3>{item.title}</h3>
              <p>{item.cost.toLocaleString()} pts</p>
              <div className="action-card__footer">
                <strong>{item.description}</strong>
                <button
                  type="button"
                  disabled={isBusy || isGuest || !canAfford || !inStock}
                  onClick={() => redeem(item)}
                >
                  {isBusy ? "Working..." : !inStock ? "Sold Out" : !canAfford ? "Need pts" : "Redeem"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <ApiPurchaseList purchases={purchases} />
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
        <article><span>EMPTY</span><div><h3>No purchases yet</h3><p>Redeem from the store above.</p></div></article>
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
    fetch("/api/bets/markets", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { markets?: BetMarket[]; error?: string }) => {
        if (!active) return;
        if (data.markets) {
          setMarkets(data.markets);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isGuest) return;
    let active = true;
    fetch("/api/bets/my-bets", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { bets?: Bet[]; error?: string }) => {
        if (!active) return;
        if (data.bets) {
          setBets(data.bets);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
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
    <section className="section page-width app-workspace">
      <WorkspaceHeader
        overline="Custom Bets"
        title="Live prediction markets"
        meta={message || `${bets.filter((bet) => bet.status === "Open").length} open bets`}
      />
      <AccountStrip account={account} />
      {isGuest && (
        <div className="workspace-notice">
          <p>Sign in to bet real points on live prediction markets and win rewards.</p>
          <a className="button primary" href="/login">Sign in <span>↗</span></a>
        </div>
      )}
      <div className="workspace-grid">
        {markets.length === 0 && (
          <p className="workspace-loading">Loading prediction markets...</p>
        )}
        {markets.map((market) => (
          <article className={`action-card market-card ${market.status.toLowerCase()}`} key={market.id}>
            <small><Ticket size={13} strokeWidth={3} aria-hidden="true" />{market.type} / {market.status} / {market.deadline}</small>
            <h3>{market.title}</h3>
            <p>{market.winner ? `${market.winner} won` : "Market live"}</p>
            <input
              className="inline-bet-input"
              value={amounts[market.id] ?? ""}
              inputMode="numeric"
              placeholder="Points"
              disabled={isGuest || market.status !== "Live" || busyMarketId === market.id}
              onChange={(event) =>
                setAmounts((current) => ({
                  ...current,
                  [market.id]: event.target.value.replace(/\D/g, ""),
                }))
              }
            />
            <div className="odds-grid">
              {[0, 1].map((index) => (
                <button
                  key={market.sides[index]}
                  type="button"
                  disabled={isGuest || market.status !== "Live" || busyMarketId === market.id}
                  onClick={() => placeBet(market, index as 0 | 1)}
                >
                  <span>{market.sides[index]}</span>
                  <b>{market.odds[index].toFixed(2)}x</b>
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
      <BetList bets={bets} />
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
  const [message, setMessage] = useState("Loading watch points...");
  const connected = summary?.connected ?? account.connected.kick.connected;
  const displayedSeconds = summary?.totalSecondsToday ?? seconds;
  const earned = summary?.claimablePoints ?? Math.floor(seconds / 10) * 25;
  const dailyBonus = summary?.dailyBonusAvailable ? summary.dailyBonus : 0;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    let active = true;

    fetch("/api/watch-points", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { summary?: WatchSummary; error?: string }) => {
        if (!active) return;
        if (payload.summary) {
          setSummary(payload.summary);
          setRunning(payload.summary.running);
          setSeconds(payload.summary.totalSecondsToday);
          setMessage(payload.summary.connected ? "Watch tracker synced." : "Connect Kick to start earning.");
        } else {
          setMessage(payload.error ?? "Could not load watch points.");
        }
      })
      .catch(() => { if (active) setMessage("Could not load watch points."); });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!running) return;

    const heartbeat = window.setInterval(() => {
      fetch("/api/watch-points/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ running: true }),
      })
        .then((response) => response.json())
        .then((payload: { summary?: WatchSummary }) => {
          if (payload.summary) {
            setSummary(payload.summary);
            setSeconds(payload.summary.totalSecondsToday);
          }
        })
        .catch(() => {});
    }, 10000);

    return () => window.clearInterval(heartbeat);
  }, [running]);

  async function sendHeartbeat(nextRunning: boolean) {
    try {
      const response = await fetch("/api/watch-points/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ running: nextRunning }),
      });
      const payload = (await response.json()) as { summary?: WatchSummary; error?: string };
      if (!response.ok || !payload.summary) {
        throw new Error(payload.error ?? "Watch update failed.");
      }
      setSummary(payload.summary);
      setRunning(payload.summary.running);
      setSeconds(payload.summary.totalSecondsToday);
      setMessage(nextRunning ? "Watch session running." : "Watch session paused.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Watch update failed.");
      setRunning(false);
    }
  }

  async function claimWatchPoints() {
    if (earned <= 0) return;

    try {
      const response = await fetch("/api/watch-points/claim", { method: "POST" });
      const payload = (await response.json()) as { summary?: WatchSummary; error?: string };
      if (!response.ok || !payload.summary) {
        throw new Error(payload.error ?? "Watch claim failed.");
      }
      setSummary(payload.summary);
      setSeconds(payload.summary.totalSecondsToday);
      setAccount((current) => {
        const safe = normalizeAccount(current);
        return {
          ...safe,
          points: payload.summary!.points,
          xp: payload.summary!.xp,
          watchMinutes: Math.floor(payload.summary!.totalSecondsToday / 60),
        };
      });
      setMessage("Watch points claimed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Watch claim failed.");
    }
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="Watch Points" title="Earn while you watch" meta={message} />
      <div className="watch-console">
        <div className="watch-orb"><span>{String(Math.floor(displayedSeconds / 60)).padStart(2, "0")}:{String(displayedSeconds % 60).padStart(2, "0")}</span><b>{earned + dailyBonus}</b><small>points ready</small></div>
        <div className="watch-actions">
          <StatusGrid items={[["Kick", connected ? account.connected.kick.username || "Linked" : "Not linked"], ["Verify", summary?.verified ? "Live" : summary?.verificationMode ?? "OAuth"], ["Daily", dailyBonus ? `+${dailyBonus}` : "Locked"], ["Total", `${Math.floor(displayedSeconds / 60)}m`]]} />
          <div className="button-row">
            {!connected ? <a className="button primary" href="/api/auth/kick">Connect Kick <span>↗</span></a> : null}
            <button className="button ghost" type="button" onClick={() => sendHeartbeat(!running)} disabled={!connected}>{running ? "Pause bot" : "Start bot"} <span>●</span></button>
            <button className="button primary" type="button" onClick={claimWatchPoints} disabled={earned <= 0}>Claim <span>↗</span></button>
          </div>
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
        <article className="profile-card">
          <AccountImage account={account} className="profile-avatar" />
          <h3>{accountDisplayName(account)}</h3>
          <p>{account.banned ? "Banned" : account.timeoutUntil ? "Timed out" : "Active"}</p>
          <StatusGrid items={[["Points", formatNumberCompact(account.points)], ["Lifetime", formatNumberCompact(lifetimeWager)], ["Rank", liveUser ? `#${liveUser.rank}` : "--"], ["Badges", String(account.badges.length)]]} />
        </article>
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
  const [siteConfig, setSiteConfig] = useStoredState<SiteConfig>("rankboard-site-config", defaultSiteConfig);
  const [newItem, setNewItem] = useState({ title: "", cost: "5000", stock: "10", tag: "Reward", image: "NEW" });
  const [newMarket, setNewMarket] = useState({ title: "", type: "Stream", sideA: "Yes", sideB: "No", oddsA: "2.00", oddsB: "1.50", deadline: "23:00" });
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminQuery, setAdminQuery] = useState("");
  const [selectedAdminUserId, setSelectedAdminUserId] = useState("");
  const [adminUserStatus, setAdminUserStatus] = useState("Loading users");
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminMarketMessage, setAdminMarketMessage] = useState("");
  const [adminStoreMessage, setAdminStoreMessage] = useState("Loading store");
  const [supportTickets, setSupportTickets] = useState<Ticket[]>([]);
  const [supportStatus, setSupportStatus] = useState("Loading support");
  const [adminRaffle, setAdminRaffle] = useState<RafflePayload | null>(null);
  const [adminRaffleStatus, setAdminRaffleStatus] = useState("Loading raffle");
  const [kickEventStatus, setKickEventStatus] = useState("Webhook subscription idle");
  const selectedAdminUser =
    adminUsers.find((user) => user.id === selectedAdminUserId) ??
    adminUsers[0] ??
    null;

  useEffect(() => {
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
  }, []);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([
      fetch("/api/admin/support/tickets", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/raffles", { cache: "no-store" }).then((response) => response.json()),
    ])
      .then(([ticketPayload, rafflePayload]: [
        { tickets?: Ticket[]; error?: string },
        { raffle?: RafflePayload; error?: string },
      ]) => {
        if (!active) return;
        if (ticketPayload.tickets) {
          setSupportTickets(ticketPayload.tickets);
          setSupportStatus(`${ticketPayload.tickets.length} tickets loaded`);
        } else {
          setSupportStatus(ticketPayload.error ?? "Could not load support");
        }
        if (rafflePayload.raffle) {
          setAdminRaffle(rafflePayload.raffle);
          setAdminRaffleStatus("Raffle loaded");
        } else {
          setAdminRaffleStatus(rafflePayload.error ?? "Could not load raffle");
        }
      })
      .catch(() => {
        if (!active) return;
        setSupportStatus("Could not load support");
        setAdminRaffleStatus("Could not load raffle");
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
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
        setAdminUserStatus(`${payload.users.length} users loaded`);
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
  }, [adminQuery]);

  function givePoints(amount: number) {
    setAccount((current) => {
      const safe = normalizeAccount(current);
      return { ...safe, points: Math.max(0, safe.points + amount) };
    });
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newItem.title.trim()) return;
    setAdminStoreMessage("Creating store item...");

    try {
      const response = await fetch("/api/admin/store/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newItem.title.trim(),
          description: "Admin drop.",
          cost: Math.max(0, Number(newItem.cost) || 0),
          tag: newItem.tag,
          stock: Math.max(0, Number(newItem.stock) || 0),
          unlimited: false,
          imageLabel: newItem.image || "NEW",
        }),
      });
      const payload = (await response.json()) as { item?: ApiStoreItem; error?: string };
      if (!response.ok || !payload.item) {
        throw new Error(payload.error ?? "Store item creation failed");
      }
      setItems((current) => [payload.item!, ...current]);
      setNewItem({ title: "", cost: "5000", stock: "10", tag: "Reward", image: "NEW" });
      setAdminStoreMessage(`Created ${payload.item.title}`);
    } catch (error) {
      setAdminStoreMessage(error instanceof Error ? error.message : "Store item creation failed");
    }
  }

  async function addMarket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newMarket.title.trim()) return;
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
      setAdminMarketMessage(`Settled! Paid ${data.winnersPaid ?? 0} winner(s) a total of ${(data.totalPointsPaid ?? 0).toLocaleString()} pts.`);
      window.dispatchEvent(new CustomEvent("rankboard-storage"));
    } catch (error) {
      setAdminMarketMessage(error instanceof Error ? error.message : "Settlement failed");
    }
  }

  async function updateSelectedUser(patch: Partial<Pick<AdminUser, "points" | "xp" | "banned" | "bannedReason" | "role">> & { timeoutUntil?: string | null }) {
    if (!selectedAdminUser) return;
    setAdminUserStatus("Updating user");

    try {
      const response = await fetch(`/api/admin/users/${selectedAdminUser.id}`, {
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
      setAdminUserStatus(error instanceof Error ? error.message : "User update failed");
    }
  }

  function adjustSelectedUser(field: "points" | "xp", amount: number) {
    if (!selectedAdminUser) return;
    updateSelectedUser({
      [field]: Math.max(0, selectedAdminUser[field] + amount),
    });
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

  async function drawAdminRaffle() {
    if (!adminRaffle) return;
    setAdminRaffleStatus("Drawing winner...");

    try {
      const response = await fetch("/api/admin/raffles/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId: adminRaffle.round.id }),
      });
      const payload = (await response.json()) as { raffle?: RafflePayload; error?: string };
      if (!response.ok || !payload.raffle) {
        throw new Error(payload.error ?? "Raffle draw failed");
      }
      setAdminRaffle(payload.raffle);
      setAdminRaffleStatus(payload.raffle.winner ? `Winner: ${payload.raffle.winner.handle}` : "Winner drawn");
    } catch (error) {
      setAdminRaffleStatus(error instanceof Error ? error.message : "Raffle draw failed");
    }
  }

  async function subscribeKickEvents() {
    setKickEventStatus("Subscribing Kick events...");

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
      setKickEventStatus(
        failed.length
          ? `${failed.length} Kick event subscription(s) failed`
          : "Kick chat/live events subscribed"
      );
    } catch (error) {
      setKickEventStatus(error instanceof Error ? error.message : "Kick subscription failed");
    }
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="Admin" title="Control room" meta={adminUserStatus} />
      <div className="admin-user-manager">
        <div className="admin-user-manager__bar">
          <label>USER SEARCH<input value={adminQuery} onChange={(event) => setAdminQuery(event.target.value)} placeholder="Email, handle, Discord, Kick, casino" /></label>
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
          <article className="admin-user-detail">
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
                <StatusGrid items={[["Points", formatNumberCompact(selectedAdminUser.points)], ["XP", formatNumberCompact(selectedAdminUser.xp)], ["Role", selectedAdminUser.role], ["State", selectedAdminUser.banned ? "Banned" : selectedAdminUser.timeoutUntil ? "Timed out" : "Active"]]} />
                <div className="admin-action-grid">
                  <button type="button" onClick={() => adjustSelectedUser("points", 1000)}>+1K points</button>
                  <button type="button" onClick={() => adjustSelectedUser("points", -1000)}>-1K points</button>
                  <button type="button" onClick={() => adjustSelectedUser("xp", 1000)}>+1K XP</button>
                  <button type="button" onClick={() => adjustSelectedUser("xp", -1000)}>-1K XP</button>
                  <button type="button" onClick={() => updateSelectedUser({ banned: !selectedAdminUser.banned, bannedReason: selectedAdminUser.banned ? "" : "Admin action" })}>{selectedAdminUser.banned ? "Unban" : "Ban"}</button>
                  <button type="button" onClick={() => timeoutSelectedUser(24)}>24h timeout</button>
                  <button type="button" onClick={() => updateSelectedUser({ timeoutUntil: null })}>Clear timeout</button>
                  <button type="button" onClick={() => updateSelectedUser({ role: selectedAdminUser.role === "ADMIN" ? "PLAYER" : "ADMIN" })}>{selectedAdminUser.role === "ADMIN" ? "Demote" : "Promote"}</button>
                </div>
                <div className="admin-casino-strip">
                  {(Object.keys(selectedAdminUser.casinos) as Casino[]).map((casino) => <span key={casino}>{casino}<b>{selectedAdminUser.casinos[casino] || "Not linked"}</b></span>)}
                </div>
              </>
            ) : (
              <p className="admin-empty-state">Sign in as an admin to manage users.</p>
            )}
          </article>
        </div>
      </div>
      <div className="admin-grid">
        <article className="admin-panel">
          <small>USER</small>
          <h3>{account.handle}</h3>
          <StatusGrid items={[["Points", formatNumberCompact(account.points)], ["Kick", account.connected.kick.connected ? "Linked" : "Off"], ["Discord", account.connected.discord.connected ? "Linked" : "Off"], ["State", account.banned ? "Banned" : "Active"]]} />
          <div className="button-row">
            <button className="button primary" type="button" onClick={() => givePoints(1000)}>+1K <span>+</span></button>
            <button className="button ghost" type="button" onClick={() => givePoints(-1000)}>-1K <span>-</span></button>
            <button className="button ghost" type="button" onClick={() => setAccount((current) => ({ ...normalizeAccount(current), banned: !normalizeAccount(current).banned }))}>{account.banned ? "Unban" : "Ban"} <span>!</span></button>
          </div>
        </article>
        <article className="admin-panel">
          <small>LEADERBOARD</small>
          <h3>{siteConfig.leaderboardMode}</h3>
          <StatusGrid items={[["Status", siteConfig.leaderboardStatus], ["Prize", formatNumberCompact(siteConfig.prizePool)], ["Winners", "Top 3"], ["Reset", "Ready"]]} />
          <div className="button-row">
            {(["Weekly", "Bi-weekly", "Monthly"] as SiteConfig["leaderboardMode"][]).map((mode) => <button className="button ghost" key={mode} type="button" onClick={() => setSiteConfig((current) => ({ ...current, leaderboardMode: mode }))}>{mode}<span>↗</span></button>)}
            <button className="button primary" type="button" onClick={() => setSiteConfig((current) => ({ ...current, leaderboardStatus: current.leaderboardStatus === "Live" ? "Ended" : "Live" }))}>{siteConfig.leaderboardStatus === "Live" ? "End" : "Start"} <span>●</span></button>
          </div>
        </article>
        <article className="admin-panel">
          <small>WEBSITE</small>
          <h3>Banners</h3>
          <label>Announcement<input value={siteConfig.announcement} onChange={(event) => setSiteConfig((current) => ({ ...current, announcement: event.target.value }))} /></label>
          <label>Banner<input value={siteConfig.banner} onChange={(event) => setSiteConfig((current) => ({ ...current, banner: event.target.value }))} /></label>
          <label>Promo<input value={siteConfig.promotion} onChange={(event) => setSiteConfig((current) => ({ ...current, promotion: event.target.value }))} /></label>
        </article>
        <article className="admin-panel">
          <small>DATA PIPELINE</small>
          <h3>API / Backend / DB</h3>
          <StatusGrid items={[["API", "GET only"], ["Backend", "Route live"], ["Cache", "No-store"], ["DB adapter", "Ready"]]} />
        </article>
        <article className="admin-panel">
          <small>KICK EVENTS</small>
          <h3>Watch verification</h3>
          <StatusGrid items={[["Mode", "Webhook"], ["Chat", "Signed"], ["Live", "Status"], ["State", kickEventStatus.includes("failed") ? "Check" : "Ready"]]} />
          <div className="button-row">
            <button className="button primary" type="button" onClick={subscribeKickEvents}>Subscribe events <span>↗</span></button>
          </div>
          <p className="admin-helper-text">{kickEventStatus}</p>
        </article>
      </div>
      {/* Store Catalog Management */}
      <div className="admin-section-title">
        <div>
          <p>Store rewards</p>
          <h2>Manage store items</h2>
        </div>
      </div>
      <p className="admin-note">{adminStoreMessage}</p>
      <form className="support-form account-form" onSubmit={addItem}>
        <label>ITEM<input value={newItem.title} onChange={(event) => setNewItem((current) => ({ ...current, title: event.target.value }))} placeholder="Reward name" /></label>
        <label>PRICE<input value={newItem.cost} inputMode="numeric" onChange={(event) => setNewItem((current) => ({ ...current, cost: event.target.value.replace(/\D/g, "") }))} /></label>
        <label>STOCK<input value={newItem.stock} inputMode="numeric" onChange={(event) => setNewItem((current) => ({ ...current, stock: event.target.value.replace(/\D/g, "") }))} /></label>
        <button className="button primary" type="submit">Add item <span>↗</span></button>
      </form>
      <div className="workspace-list">
        {items.map((item) => {
          const StoreIcon = getStoreItemIcon(item);
          return (
          <article key={item.id}>
            <span className="list-icon" title={item.tag}><StoreIcon size={16} strokeWidth={2.6} aria-hidden="true" /></span>
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
          <p>Prediction markets</p>
          <h2>Settle bets & pay winners</h2>
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
                  Settle {market.sides[0]}
                </button>
                <button
                  type="button"
                  className="settle-btn lose"
                  onClick={() => settleMarket(market, market.sides[1])}
                >
                  Settle {market.sides[1]}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Raffle Drawing */}
      <div className="admin-section-title">
        <div>
          <p>Wager raffles</p>
          <h2>Draw weighted winners</h2>
        </div>
      </div>
      <div className="tool-panel">
        <div>
          <small>{adminRaffle?.round.status ?? "Raffle"}</small>
          <strong>{adminRaffle?.round.totalEntries ?? 0}</strong>
          <span>{adminRaffleStatus}</span>
        </div>
        <button type="button" disabled={!adminRaffle || adminRaffle.round.totalEntries <= 0 || adminRaffle.round.status !== "Open"} onClick={drawAdminRaffle}>Draw winner</button>
      </div>

      {/* Support Inbox */}
      <div className="admin-section-title">
        <div>
          <p>Support inbox</p>
          <h2>Resolve player tickets</h2>
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
          <p>Reward claims</p>
          <h2>Fulfill recent purchases</h2>
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
      <WorkspaceHeader overline="Help Center" title="Find your answer" meta={`${results.length} answers`} />
      <label className="wide-search">
        <span>SEARCH HELP</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="XP, rewards, bets" />
      </label>
      <div className="workspace-list">
        {results.map((item) => (
          <article key={item.q}>
            <span>FAQ</span>
            <div>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
            <Link href="/support">Support</Link>
          </article>
        ))}
      </div>
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

    fetch("/api/support/tickets", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { tickets?: Ticket[]; error?: string }) => {
        if (!active) return;
        if (payload.tickets) {
          setTickets(payload.tickets);
          setStatus(payload.tickets.length ? "Tickets synced." : "No tickets yet.");
        } else {
          setStatus(payload.error ?? "Could not load tickets.");
        }
      })
      .catch(() => { if (active) setStatus("Could not load tickets."); });

    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subject.trim() || !message.trim()) return;
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
      <WorkspaceHeader overline="Support" title="Create a ticket" meta={`${tickets.length} tickets · ${status}`} />
      <form className="support-form" onSubmit={submit}>
        <label>CATEGORY<select value={category} onChange={(event) => setCategory(event.target.value)}><option>Reward</option><option>Account</option><option>Leaderboard</option><option>Claim</option></select></label>
        <label>SUBJECT<input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="What broke?" /></label>
        <label>MESSAGE<textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Useful details." /></label>
        <button className="button primary" type="submit">Create ticket <span>↗</span></button>
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
        )) : <article><span>EMPTY</span><div><h3>No tickets</h3><p>Open one above.</p></div></article>}
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
      <WorkspaceHeader overline="Account" title="Sign in to RankBoard" meta={status} />
      <div className="auth-modal-shell" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="auth-panel">
          <div className="auth-copy">
            <p>ACCOUNT ACCESS</p>
            <h3 id="auth-title">{signedIn ? "Account active" : "Login to RankBoard"}</h3>
            <span>{account.handle}</span>
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
                <StatusGrid items={[["Points", formatNumberCompact(account.points)], ["XP", formatNumberCompact(account.xp)], ["Kick", account.connected.kick.connected ? "Linked" : "Off"], ["Discord", account.connected.discord.connected ? "Linked" : "Off"]]} />
                <div className="auth-session-actions">
                  <Link className="button primary" href="/profile">Open profile <span>↗</span></Link>
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
                  <label>EMAIL<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
                  <label>PASSWORD<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 8 characters" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} /></label>
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
      <ConnectionPanel account={account} setAccount={setAccount} onStatus={setStatus} />
      <AccountStrip account={account} />
      <Inventory items={account.inventory} />
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
          <article className={`connection-card ${state.connected ? "connected" : ""}`} key={provider}>
            <small>{provider.toUpperCase()}</small>
            <h3>{state.connected ? state.username : "Not linked"}</h3>
            <p>{state.connected ? "Connected" : "OAuth ready"}</p>
            <button type="button" onClick={() => toggle(provider)} disabled={busyProvider === provider}>{busyProvider === provider ? "Working" : state.connected ? "Disconnect" : `Login ${provider}`}</button>
          </article>
        );
      })}
    </div>
  );
}

function WorkspaceHeader({ overline, title, meta }: { overline: string; title: string; meta: string }) {
  const Icon = workspaceIcons[overline] ?? Sparkles;
  return (
    <div className="workspace-heading">
      <div>
        <p><Icon size={16} strokeWidth={3} aria-hidden="true" />{overline}</p>
        <h2>{title}</h2>
      </div>
      <span><Activity size={14} strokeWidth={3} aria-hidden="true" />{meta}</span>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return <div className="workspace-progress"><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

function AccountStrip({ account }: { account: Account }) {
  return (
    <div className="account-strip">
      <div><span>PLAYER</span><strong>{account.handle}</strong></div>
      <div><span>POINTS</span><strong>{account.points.toLocaleString()}</strong></div>
      <div><span>XP</span><strong>{account.xp.toLocaleString()}</strong></div>
      <div><span>STREAK</span><strong>{account.streak} days</strong></div>
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
      )) : <article><span>EMPTY</span><div><h3>No purchases</h3><p>Store is ready.</p></div></article>}
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
      )) : <article><span>EMPTY</span><div><h3>No bets</h3><p>Pick a market.</p></div></article>}
    </div>
  );
}
