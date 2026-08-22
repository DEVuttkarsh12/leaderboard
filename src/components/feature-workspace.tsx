"use client";

import Link from "next/link";
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
};

type StoreItem = {
  id: string;
  title: string;
  description: string;
  cost: number;
  tag: string;
  stock: number;
  unlimited: boolean;
  image: string;
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

const missions = [
  { id: "daily-spin", title: "Daily Missions", reward: 1200, goal: 100, meta: "Daily" },
  { id: "weekly-track", title: "Weekly Tracks", reward: 4200, goal: 100, meta: "Weekly" },
  { id: "milestone", title: "Milestone Goals", reward: 2800, goal: 100, meta: "Milestone" },
  { id: "seasonal", title: "Seasonal Campaigns", reward: 6500, goal: 100, meta: "Season" },
  { id: "rank-unlock", title: "Leaderboard Unlocks", reward: 3500, goal: 100, meta: "Rank" },
];

const hunts = [
  { id: "midnight", title: "Midnight Multiplier", time: "22:30", host: "Vanta", status: "Live", heat: 86 },
  { id: "neon", title: "Neon Chase", time: "00:15", host: "Luxe", status: "Upcoming", heat: 72 },
  { id: "vault", title: "Vault Break", time: "02:00", host: "Midas", status: "Upcoming", heat: 64 },
];

const clips = [
  { id: "clip-01", title: "860x reveal", stat: "12.4K" },
  { id: "clip-02", title: "Last-spin save", stat: "8.1K" },
  { id: "clip-03", title: "Vault streak", stat: "5.7K" },
];

const tournaments = [
  { id: "rush", title: "Friday Rush", starts: "Tonight 21:00", prize: "40K pts", seats: 64, taken: 51 },
  { id: "duel", title: "Duel Ladder", starts: "Tomorrow 18:30", prize: "25K pts", seats: 32, taken: 18 },
  { id: "finals", title: "Season Finals", starts: "Sunday 20:00", prize: "120K pts", seats: 16, taken: 12 },
];

const defaultStoreItems: StoreItem[] = [
  { id: "cash-tip", title: "Cash Tip", description: "Manual payout.", cost: 12000, tag: "Cash", stock: 8, unlimited: false, image: "TIP" },
  { id: "discord-role", title: "VIP Role", description: "Discord flex.", cost: 6500, tag: "Role", stock: 999, unlimited: true, image: "VIP" },
  { id: "bonus-buy", title: "Bonus Buy", description: "Stream buy.", cost: 18000, tag: "Casino", stock: 3, unlimited: false, image: "BUY" },
  { id: "gift-card", title: "Gift Card", description: "Code drop.", cost: 22000, tag: "Gift", stock: 5, unlimited: false, image: "CARD" },
  { id: "merch", title: "Merch Entry", description: "Gear draw.", cost: 4000, tag: "Merch", stock: 40, unlimited: false, image: "DROP" },
  { id: "steam-key", title: "Steam Key", description: "Game key.", cost: 8500, tag: "Key", stock: 12, unlimited: false, image: "KEY" },
];

const defaultMarkets: BetMarket[] = [
  { id: "max-win", title: "Max Win Today?", type: "Stream", deadline: "22:00", status: "Live", sides: ["Yes", "No"], odds: [2.4, 1.35], winner: null },
  { id: "ufc-main", title: "UFC Main Event", type: "UFC", deadline: "23:30", status: "Live", sides: ["Islam", "Conor"], odds: [2, 1.3], winner: null },
  { id: "level-100", title: "Level 100 Run", type: "Casino", deadline: "01:00", status: "Locked", sides: ["Hits", "Misses"], odds: [1.8, 1.7], winner: null },
];

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

function nowStamp() {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date());
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
      {account.image ? <img src={account.image} alt="" /> : initials}
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
  if (route === "wager-raffles") return <RafflesWorkspace />;
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
  const [progress, setProgress] = useStoredState<Record<string, number>>("rankboard-mission-progress", {});
  const [claimed, setClaimed] = useStoredState<string[]>("rankboard-mission-claimed", []);
  const active = missions.filter((mission) => !claimed.includes(mission.id)).length;
  const claimable = missions.filter((mission) => (progress[mission.id] ?? 0) >= mission.goal && !claimed.includes(mission.id)).length;

  function pushProgress(id: string) {
    setProgress((current) => ({ ...current, [id]: Math.min(100, (current[id] ?? 0) + 25) }));
  }

  function claimMission(id: string, reward: number) {
    if (claimed.includes(id)) return;
    setClaimed((current) => [...current, id]);
    setAccount((current) => {
      const safe = normalizeAccount(current);
      return { ...safe, points: safe.points + reward, xp: safe.xp + reward };
    });
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="MISSION OPS" title="Progress. Claim. Climb." meta={`${active} active / ${claimable} ready`} />
      <div className="workspace-grid">
        {missions.map((mission) => {
          const percent = progress[mission.id] ?? 0;
          const isClaimed = claimed.includes(mission.id);
          const ready = percent >= mission.goal && !isClaimed;
          return (
            <article className="action-card" key={mission.id}>
              <small>{mission.meta}</small>
              <h3>{mission.title}</h3>
              <p>{percent}% charged</p>
              <ProgressBar value={percent} />
              <div className="action-card__footer">
                <strong>{isClaimed ? "Claimed" : `${mission.reward.toLocaleString()} pts`}</strong>
                <button type="button" onClick={() => ready ? claimMission(mission.id, mission.reward) : pushProgress(mission.id)} disabled={isClaimed}>
                  {isClaimed ? "Done" : ready ? "Claim" : "Progress"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <AccountStrip account={account} />
    </section>
  );
}

function HuntsWorkspace() {
  const [followed, setFollowed] = useStoredState<string[]>("rankboard-followed-hunts", []);
  const [savedClips, setSavedClips] = useStoredState<string[]>("rankboard-saved-clips", []);
  const [votes, setVotes] = useStoredState<Record<string, number>>("rankboard-clip-votes", {});

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="HUNT CONTROL" title="Follow. Save. Vote." meta={`${followed.length} followed / ${savedClips.length} saved`} />
      <div className="workspace-grid two">
        {hunts.map((hunt) => {
          const isFollowed = followed.includes(hunt.id);
          return (
            <article className="action-card casino-card" key={hunt.id}>
              <small>{hunt.status} / {hunt.time}</small>
              <h3>{hunt.title}</h3>
              <p>{hunt.host} / {hunt.heat}% heat</p>
              <ProgressBar value={hunt.heat} />
              <div className="action-card__footer">
                <strong>{isFollowed ? "Reminder on" : "Reminder off"}</strong>
                <button type="button" onClick={() => setFollowed((current) => isFollowed ? current.filter((id) => id !== hunt.id) : [...current, hunt.id])}>
                  {isFollowed ? "Unfollow" : "Follow"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="workspace-list">
        {clips.map((clip) => {
          const saved = savedClips.includes(clip.id);
          return (
            <article key={clip.id}>
              <span>CLIP</span>
              <div>
                <h3>{clip.title}</h3>
                <p>{votes[clip.id] ?? 0} votes / {saved ? "saved" : clip.stat}</p>
              </div>
              <button type="button" onClick={() => setVotes((current) => ({ ...current, [clip.id]: (current[clip.id] ?? 0) + 1 }))}>Vote</button>
              <button type="button" onClick={() => setSavedClips((current) => saved ? current.filter((id) => id !== clip.id) : [...current, clip.id])}>{saved ? "Saved" : "Save"}</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function TournamentsWorkspace() {
  const [registrations, setRegistrations] = useStoredState<string[]>("rankboard-tournament-registrations", []);
  const [selected, setSelected] = useState(tournaments[0].id);
  const tournament = tournaments.find((item) => item.id === selected) ?? tournaments[0];
  const joined = registrations.includes(tournament.id);

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="BRACKET DESK" title="Enter. Watch. Win." meta={`${registrations.length} entries active`} />
      <div className="workspace-grid three">
        {tournaments.map((item) => {
          const isJoined = registrations.includes(item.id);
          return (
            <article className={`action-card ${selected === item.id ? "selected" : ""}`} key={item.id}>
              <small>{item.starts}</small>
              <h3>{item.title}</h3>
              <p>{item.taken + (isJoined ? 1 : 0)} / {item.seats} / {item.prize}</p>
              <ProgressBar value={((item.taken + (isJoined ? 1 : 0)) / item.seats) * 100} />
              <div className="action-card__footer">
                <strong>{isJoined ? "Entered" : "Open"}</strong>
                <button type="button" onClick={() => setSelected(item.id)}>View</button>
              </div>
            </article>
          );
        })}
      </div>
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
        <button type="button" onClick={() => setRegistrations((current) => joined ? current.filter((id) => id !== tournament.id) : [...current, tournament.id])}>
          {joined ? "Withdraw" : "Enter"}
        </button>
      </div>
    </section>
  );
}

function RafflesWorkspace() {
  const [tickets, setTickets] = useStoredState<number>("rankboard-raffle-tickets", 12);
  const [entries, setEntries] = useStoredState<number>("rankboard-raffle-entries", 0);
  const [wager, setWager] = useState("10000");
  const generated = Math.max(0, Math.floor(Number(wager || 0) / 10000));

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="TICKET FLOOR" title="Wager in. Tickets out." meta={`${tickets} tickets / ${entries} entries`} />
      <div className="tool-panel">
        <label>
          WAGER AMOUNT
          <input value={wager} inputMode="numeric" onChange={(event) => setWager(event.target.value.replace(/\D/g, ""))} />
        </label>
        <div><small>GENERATES</small><strong>{generated}</strong><span>tickets</span></div>
        <button type="button" onClick={() => setTickets((current) => current + generated)} disabled={generated === 0}>Convert</button>
      </div>
      <div className="workspace-grid three">
        {[1, 5, 10].map((amount) => (
          <article className="action-card" key={amount}>
            <small>DRAW ENTRY</small>
            <h3>{amount} ticket{amount > 1 ? "s" : ""}</h3>
            <p>{tickets >= amount ? "Ready" : "Locked"}</p>
            <div className="action-card__footer">
              <strong>{tickets >= amount ? "Ready" : "Need tickets"}</strong>
              <button type="button" disabled={tickets < amount} onClick={() => { setTickets((current) => current - amount); setEntries((current) => current + amount); }}>
                Enter
              </button>
            </div>
          </article>
        ))}
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

type ApiPurchase = {
  id: string;
  itemId: string;
  itemTitle: string;
  cost: number;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  createdAt: string;
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
      <WorkspaceHeader overline="STORE REGISTER" title="Spend. Claim. Stash." meta={message} />
      <AccountStrip account={account} />
      {isGuest && (
        <div className="workspace-notice">
          <p>Sign in to redeem store rewards and track your purchases.</p>
          <a className="button primary" href="/login">Sign in <span>↗</span></a>
        </div>
      )}
      <div className="workspace-grid">
        {items.length === 0 && !isGuest && (
          <p style={{ opacity: 0.5 }}>Loading items...</p>
        )}
        {items.map((item) => {
          const isBusy = busyItemId === item.id;
          const canAfford = account.points >= item.cost;
          const inStock = item.unlimited || item.stock > 0;
          return (
            <article className="action-card reward-card" key={item.id}>
              <small>{item.tag} / {item.unlimited ? "Unlimited" : `${item.stock} left`}</small>
              <div className="reward-art">{item.imageLabel}</div>
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
      {purchases.length ? purchases.map((p) => (
        <article key={p.id}>
          <span>{statusLabel(p.status)}</span>
          <div>
            <h3>{p.itemTitle}</h3>
            <p>{p.cost.toLocaleString()} pts / {new Date(p.createdAt).toLocaleDateString()}</p>
          </div>
          <a href="/support">Track</a>
        </article>
      )) : (
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
        overline="BET FLOOR"
        title="Pick. Bet. Sweat."
        meta={message || `${bets.filter((bet) => bet.status === "Open").length} live bets`}
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
          <p style={{ opacity: 0.5 }}>Loading prediction markets...</p>
        )}
        {markets.map((market) => (
          <article className={`action-card market-card ${market.status.toLowerCase()}`} key={market.id}>
            <small>{market.type} / {market.status} / {market.deadline}</small>
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
  const earned = Math.floor(seconds / 10) * 25;
  const dailyBonus = account.connected.kick.connected ? 500 : 0;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  function claimWatchPoints() {
    if (earned <= 0) return;
    setAccount((current) => {
      const safe = normalizeAccount(current);
      return {
        ...safe,
        points: safe.points + earned + dailyBonus,
        xp: safe.xp + earned,
        watchMinutes: safe.watchMinutes + Math.floor(seconds / 60),
      };
    });
    setRunning(false);
    setSeconds(0);
  }

  function connectKick() {
    setAccount((current) => {
      const safe = normalizeAccount(current);
      return {
        ...safe,
        connected: {
          ...safe.connected,
          kick: { connected: true, username: safe.handle.replace("@", "") || "kick_user", id: uid("kick") },
        },
      };
    });
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="KICK WATCH" title="Watch. Earn. Spend." meta={account.connected.kick.connected ? "Kick linked" : "Kick needed"} />
      <div className="watch-console">
        <div className="watch-orb"><span>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</span><b>{earned + dailyBonus}</b><small>points ready</small></div>
        <div className="watch-actions">
          <StatusGrid items={[["Kick", account.connected.kick.connected ? account.connected.kick.username : "Not linked"], ["Rate", "25 / 10s"], ["Daily", dailyBonus ? "+500" : "Locked"], ["Total", `${account.watchMinutes}m`]]} />
          <div className="button-row">
            {!account.connected.kick.connected ? <button className="button primary" type="button" onClick={connectKick}>Connect Kick <span>↗</span></button> : null}
            <button className="button ghost" type="button" onClick={() => setRunning((value) => !value)}>{running ? "Pause bot" : "Start bot"} <span>●</span></button>
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
      <WorkspaceHeader overline="PLAYER PROFILE" title="Linked. Ranked. Paid." meta={profileStatus === "Profile ready" && liveUser ? `Rank #${liveUser.rank}` : profileStatus} />
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
  const [items, setItems] = useStoredState<StoreItem[]>("rankboard-store-items", defaultStoreItems);
  const [purchases, setPurchases] = useStoredState<Purchase[]>("rankboard-purchases", []);
  const [markets, setMarkets] = useState<BetMarket[]>([]);
  const [bets, setBets] = useStoredState<Bet[]>("rankboard-bets", []);
  const [siteConfig, setSiteConfig] = useStoredState<SiteConfig>("rankboard-site-config", defaultSiteConfig);
  const [newItem, setNewItem] = useState({ title: "", cost: "5000", stock: "10", tag: "Reward", image: "NEW" });
  const [newMarket, setNewMarket] = useState({ title: "", type: "Stream", sideA: "Yes", sideB: "No", oddsA: "2.00", oddsB: "1.50", deadline: "23:00" });
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminQuery, setAdminQuery] = useState("");
  const [selectedAdminUserId, setSelectedAdminUserId] = useState("");
  const [adminUserStatus, setAdminUserStatus] = useState("Loading users");
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminMarketMessage, setAdminMarketMessage] = useState("");
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

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newItem.title.trim()) return;
    setItems((current) => [{
      id: uid("item"),
      title: newItem.title.trim(),
      description: "Admin drop.",
      cost: Math.max(0, Number(newItem.cost) || 0),
      tag: newItem.tag,
      stock: Math.max(0, Number(newItem.stock) || 0),
      unlimited: false,
      image: newItem.image || "NEW",
    }, ...current]);
    setNewItem({ title: "", cost: "5000", stock: "10", tag: "Reward", image: "NEW" });
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

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="ADMIN FLOOR" title="Control. Settle. Ship." meta={adminUserStatus} />
      <div className="admin-user-manager">
        <div className="admin-user-manager__bar">
          <label>USER SEARCH<input value={adminQuery} onChange={(event) => setAdminQuery(event.target.value)} placeholder="Email, handle, Discord, Kick, casino" /></label>
          <button type="button" onClick={() => setAdminQuery((value) => value.trim())} disabled={adminUsersLoading}>{adminUsersLoading ? "Loading" : "Refresh"}</button>
        </div>
        <div className="admin-user-layout">
          <div className="admin-user-list">
            {adminUsers.length ? adminUsers.map((user) => (
              <button className={selectedAdminUser?.id === user.id ? "selected" : ""} key={user.id} type="button" onClick={() => setSelectedAdminUserId(user.id)}>
                <span>{user.image ? <img src={user.image} alt="" /> : user.handle.slice(1, 3).toUpperCase()}</span>
                <strong>{user.handle}</strong>
                <small>{user.role} / {user.banned ? "BANNED" : user.timeoutUntil ? "TIMEOUT" : "ACTIVE"}</small>
              </button>
            )) : <p>{adminUsersLoading ? "Loading users." : "No users found."}</p>}
          </div>
          <article className="admin-user-detail">
            {selectedAdminUser ? (
              <>
                <div className="admin-user-detail__head">
                  <span>{selectedAdminUser.image ? <img src={selectedAdminUser.image} alt="" /> : selectedAdminUser.handle.slice(1, 3).toUpperCase()}</span>
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
      </div>
      {/* Store Catalog Management */}
      <div className="section-heading" style={{ marginTop: "3rem", marginBottom: "1rem" }}>
        <div>
          <p style={{ color: "#eab308", fontWeight: 700, letterSpacing: "0.1em" }}>STORE REWARDS CATALOG</p>
          <h2>MANAGE STORE ITEMS</h2>
        </div>
      </div>
      <form className="support-form account-form" onSubmit={addItem}>
        <label>ITEM<input value={newItem.title} onChange={(event) => setNewItem((current) => ({ ...current, title: event.target.value }))} placeholder="Reward name" /></label>
        <label>PRICE<input value={newItem.cost} inputMode="numeric" onChange={(event) => setNewItem((current) => ({ ...current, cost: event.target.value.replace(/\D/g, "") }))} /></label>
        <label>STOCK<input value={newItem.stock} inputMode="numeric" onChange={(event) => setNewItem((current) => ({ ...current, stock: event.target.value.replace(/\D/g, "") }))} /></label>
        <button className="button primary" type="submit">Add item <span>↗</span></button>
      </form>
      <div className="workspace-list">
        {items.map((item) => (
          <article key={item.id}>
            <span>{item.tag}</span>
            <div><h3>{item.title}</h3><p>{item.cost.toLocaleString()} pts / {item.unlimited ? "unlimited" : `${item.stock} stock`}</p></div>
            <button type="button" onClick={() => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, unlimited: !entry.unlimited } : entry))}>{item.unlimited ? "Limit" : "Unlimited"}</button>
            <button type="button" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}>Remove</button>
          </article>
        ))}
      </div>

      {/* Bet Markets & Settlement Section */}
      <div className="section-heading" style={{ marginTop: "3rem", marginBottom: "1rem" }}>
        <div>
          <p style={{ color: "#f59e0b", fontWeight: 700, letterSpacing: "0.1em" }}>🎲 PREDICTION MARKETS & SETTLEMENT</p>
          <h2>SETTLE BETS & PAYOUT WINNERS</h2>
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
        <p style={{ margin: "0.75rem 0", padding: "0.75rem 1rem", borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", fontSize: "0.9rem", color: "#4ade80", fontWeight: 600 }}>
          {adminMarketMessage}
        </p>
      )}
      <div className="workspace-list" style={{ marginTop: "1rem" }}>
        {markets.map((market) => (
          <article
            key={market.id}
            style={{
              background: market.status === "Live" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
              border: market.status === "Live" ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
              marginBottom: "0.75rem",
            }}
          >
            <span
              style={{
                padding: "0.25rem 0.6rem",
                borderRadius: 6,
                fontSize: "0.75rem",
                fontWeight: 800,
                textTransform: "uppercase",
                background: market.status === "Live" ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.1)",
                color: market.status === "Live" ? "#4ade80" : "#a1a1aa",
                border: market.status === "Live" ? "1px solid rgba(34,197,94,0.4)" : "none",
              }}
            >
              {market.status}
            </span>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{market.title}</h3>
              <p style={{ margin: "0.25rem 0 0 0", opacity: 0.7, fontSize: "0.85rem" }}>
                <strong>{market.sides[0]}</strong> ({market.odds[0]}x) vs <strong>{market.sides[1]}</strong> ({market.odds[1]}x)
                {market.winner && (
                  <span style={{ marginLeft: "0.75rem", color: "#4ade80", fontWeight: 700 }}>
                    🏆 {market.winner} WON
                  </span>
                )}
              </p>
            </div>
            {market.status === "Live" && (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  style={{
                    background: "#22c55e",
                    color: "#000",
                    fontWeight: 700,
                    padding: "0.5rem 1rem",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                  onClick={() => settleMarket(market, market.sides[0])}
                >
                  SETTLE: {market.sides[0].toUpperCase()}
                </button>
                <button
                  type="button"
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    fontWeight: 700,
                    padding: "0.5rem 1rem",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                  onClick={() => settleMarket(market, market.sides[1])}
                >
                  SETTLE: {market.sides[1].toUpperCase()}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Store Claims Fulfillment */}
      <div className="section-heading" style={{ marginTop: "3rem", marginBottom: "1rem" }}>
        <div>
          <p style={{ color: "#a855f7", fontWeight: 700, letterSpacing: "0.1em" }}>REWARD CLAIMS</p>
          <h2>FULFILL RECENT PURCHASES</h2>
        </div>
      </div>
      <PurchaseList purchases={purchases} onAdvance={(purchase) => setPurchases((current) => current.map((entry) => entry.id === purchase.id ? { ...entry, status: entry.status === "Pending" ? "Completed" : "Pending" } : entry))} />
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
      <WorkspaceHeader overline="HELP INDEX" title="Search. Fix. Go." meta={`${results.length} answers`} />
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
  const [tickets, setTickets] = useStoredState<Ticket[]>("rankboard-support-tickets", []);
  const [category, setCategory] = useState("Reward");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setTickets((current) => [{
      id: uid("ticket"),
      subject: subject.trim(),
      category,
      message: message.trim(),
      status: "Open",
      createdAt: nowStamp(),
    }, ...current]);
    setSubject("");
    setMessage("");
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="SUPPORT DESK" title="Ticket. Track. Done." meta={`${tickets.length} tickets`} />
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
              <p>{ticket.category} / {ticket.createdAt}</p>
            </div>
            <button type="button" onClick={() => setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, status: item.status === "Open" ? "Waiting" : "Solved" } : item))}>Advance</button>
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
      <WorkspaceHeader overline="PLAYER ACCOUNT" title="Secure entry." meta={status} />
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
  return (
    <div className="workspace-heading">
      <div>
        <p>{overline}</p>
        <h2>{title}</h2>
      </div>
      <span>{meta}</span>
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
  return <div className="status-grid">{items.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>;
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
          <span>{purchase.status}</span>
          <div><h3>{purchase.item}</h3><p>{purchase.cost.toLocaleString()} pts / {purchase.createdAt}</p></div>
          {onAdvance ? <button type="button" onClick={() => onAdvance(purchase)}>Advance</button> : <Link href="/support">Track</Link>}
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
          <span>{bet.status}</span>
          <div><h3>{bet.marketTitle}</h3><p>{bet.side} / {bet.amount.toLocaleString()} @ {bet.odds.toFixed(2)}x</p></div>
          <strong>{bet.status === "Won" ? `+${Math.floor(bet.amount * bet.odds).toLocaleString()}` : bet.createdAt}</strong>
        </article>
      )) : <article><span>EMPTY</span><div><h3>No bets</h3><p>Pick a market.</p></div></article>}
    </div>
  );
}
