"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { formatNumberCompact } from "@/lib/formatters";

type Provider = "kick" | "discord";
type Casino = "thrill" | "packdraw" | "shuffle";

type ConnectedAccount = {
  connected: boolean;
  username: string;
  id: string;
};

type Account = {
  handle: string;
  accessKey: string;
  points: number;
  xp: number;
  streak: number;
  inventory: string[];
  connected: Record<Provider, ConnectedAccount>;
  casinos: Record<Casino, string>;
  lifetimeWager: number;
  watchMinutes: number;
  banned: boolean;
  timeoutUntil: string;
  badges: string[];
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
  status: "Live" | "Locked" | "Settled";
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
  status: "Open" | "Won" | "Lost";
  paid: boolean;
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

function useStoredState<T>(key: string, fallback: T) {
  const [loaded, setLoaded] = useState(false);
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(key);
      if (saved) {
        try {
          setValue(JSON.parse(saved) as T);
        } catch {
          window.localStorage.removeItem(key);
        }
      }
      setLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [key]);

  useEffect(() => {
    if (loaded) {
      window.localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent("rankboard-storage"));
    }
  }, [key, loaded, value]);

  return [value, setValue] as const;
}

function useAccountState() {
  const [rawAccount, setRawAccount] = useStoredState<Account>("rankboard-account", defaultAccount);
  const account = useMemo(() => normalizeAccount(rawAccount), [rawAccount]);

  useEffect(() => {
    if (JSON.stringify(rawAccount) !== JSON.stringify(account)) {
      setRawAccount(account);
    }
  }, [account, rawAccount, setRawAccount]);

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

function StoreWorkspace({
  account,
  setAccount,
}: {
  account: Account;
  setAccount: (value: Account | ((current: Account) => Account)) => void;
}) {
  const [items, setItems] = useStoredState<StoreItem[]>("rankboard-store-items", defaultStoreItems);
  const [purchases, setPurchases] = useStoredState<Purchase[]>("rankboard-purchases", []);
  const [message, setMessage] = useState("Vault ready.");

  function redeem(item: StoreItem) {
    if (account.points < item.cost) {
      setMessage("Need more points.");
      return;
    }
    if (!item.unlimited && item.stock <= 0) {
      setMessage("Sold out.");
      return;
    }

    setAccount((current) => {
      const safe = normalizeAccount(current);
      return {
        ...safe,
        points: safe.points - item.cost,
        inventory: [...safe.inventory, item.title],
      };
    });
    setItems((current) => current.map((entry) => entry.id === item.id && !entry.unlimited ? { ...entry, stock: Math.max(0, entry.stock - 1) } : entry));
    setPurchases((current) => [{ id: uid("purchase"), item: item.title, cost: item.cost, status: "Pending", createdAt: nowStamp() }, ...current]);
    setMessage(`${item.title} pending.`);
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="VAULT REGISTER" title="Spend. Claim. Stash." meta={message} />
      <AccountStrip account={account} />
      <div className="workspace-grid">
        {items.map((item) => (
          <article className="action-card reward-card" key={item.id}>
            <small>{item.tag} / {item.unlimited ? "Unlimited" : `${item.stock} left`}</small>
            <div className="reward-art">{item.image}</div>
            <h3>{item.title}</h3>
            <p>{item.cost.toLocaleString()} pts</p>
            <div className="action-card__footer">
              <strong>{item.description}</strong>
              <button type="button" disabled={account.points < item.cost || (!item.unlimited && item.stock <= 0)} onClick={() => redeem(item)}>Redeem</button>
            </div>
          </article>
        ))}
      </div>
      <PurchaseList purchases={purchases} />
      <Inventory items={account.inventory} />
    </section>
  );
}

function CustomBetsWorkspace({
  account,
  setAccount,
}: {
  account: Account;
  setAccount: (value: Account | ((current: Account) => Account)) => void;
}) {
  const [markets] = useStoredState<BetMarket[]>("rankboard-bet-markets", defaultMarkets);
  const [bets, setBets] = useStoredState<Bet[]>("rankboard-bets", []);
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  function placeBet(market: BetMarket, sideIndex: 0 | 1) {
    const amount = Math.max(0, Math.floor(Number(amounts[market.id] || 0)));
    if (market.status !== "Live" || amount <= 0 || account.points < amount) return;
    const side = market.sides[sideIndex];
    const odds = market.odds[sideIndex];
    setAccount((current) => {
      const safe = normalizeAccount(current);
      return { ...safe, points: safe.points - amount };
    });
    setBets((current) => [{
      id: uid("bet"),
      marketId: market.id,
      marketTitle: market.title,
      side,
      amount,
      odds,
      status: "Open",
      paid: false,
      createdAt: nowStamp(),
    }, ...current]);
    setAmounts((current) => ({ ...current, [market.id]: "" }));
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="BET FLOOR" title="Pick. Bet. Sweat." meta={`${bets.filter((bet) => bet.status === "Open").length} live bets`} />
      <AccountStrip account={account} />
      <div className="workspace-grid">
        {markets.map((market) => (
          <article className={`action-card market-card ${market.status.toLowerCase()}`} key={market.id}>
            <small>{market.type} / {market.status} / {market.deadline}</small>
            <h3>{market.title}</h3>
            <p>{market.winner ? `${market.winner} won` : "Market live"}</p>
            <input className="inline-bet-input" value={amounts[market.id] ?? ""} inputMode="numeric" placeholder="Points" onChange={(event) => setAmounts((current) => ({ ...current, [market.id]: event.target.value.replace(/\D/g, "") }))} />
            <div className="odds-grid">
              {[0, 1].map((index) => (
                <button key={market.sides[index]} type="button" disabled={market.status !== "Live"} onClick={() => placeBet(market, index as 0 | 1)}>
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
  const linkedShuffle = account.casinos.shuffle.trim().toLowerCase();
  const liveUser = linkedShuffle ? users.find((user) => user.username?.toLowerCase() === linkedShuffle || user.name.toLowerCase() === linkedShuffle) : null;
  const lifetimeWager = liveUser?.points ?? account.lifetimeWager;

  function saveCasino(casino: Casino, value: string) {
    setAccount((current) => {
      const safe = normalizeAccount(current);
      return { ...safe, casinos: { ...safe.casinos, [casino]: value } };
    });
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="PLAYER PROFILE" title="Linked. Ranked. Paid." meta={liveUser ? `Rank #${liveUser.rank}` : "Link casino name"} />
      <div className="profile-layout">
        <article className="profile-card">
          <div className="profile-avatar">{account.handle.slice(1, 3).toUpperCase() || "RB"}</div>
          <h3>{account.handle}</h3>
          <p>{account.banned ? "Banned" : account.timeoutUntil ? "Timed out" : "Active"}</p>
          <StatusGrid items={[["Points", formatNumberCompact(account.points)], ["Lifetime", formatNumberCompact(lifetimeWager)], ["Rank", liveUser ? `#${liveUser.rank}` : "--"], ["Badges", String(account.badges.length)]]} />
        </article>
        <div className="profile-panels">
          <ConnectionPanel account={account} setAccount={setAccount} />
          <div className="casino-link-panel">
            {(Object.keys(account.casinos) as Casino[]).map((casino) => (
              <label key={casino}>{casino}<input value={account.casinos[casino]} onChange={(event) => saveCasino(casino, event.target.value)} placeholder={`${casino} username`} /></label>
            ))}
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
  const [markets, setMarkets] = useStoredState<BetMarket[]>("rankboard-bet-markets", defaultMarkets);
  const [bets, setBets] = useStoredState<Bet[]>("rankboard-bets", []);
  const [siteConfig, setSiteConfig] = useStoredState<SiteConfig>("rankboard-site-config", defaultSiteConfig);
  const [tickets] = useStoredState<Ticket[]>("rankboard-support-tickets", []);
  const [newItem, setNewItem] = useState({ title: "", cost: "5000", stock: "10", tag: "Reward", image: "NEW" });
  const [newMarket, setNewMarket] = useState({ title: "", type: "Stream", sideA: "Yes", sideB: "No", oddsA: "2.00", oddsB: "1.50", deadline: "23:00" });

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

  function addMarket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newMarket.title.trim()) return;
    setMarkets((current) => [{
      id: uid("market"),
      title: newMarket.title.trim(),
      type: newMarket.type,
      deadline: newMarket.deadline,
      status: "Live",
      sides: [newMarket.sideA || "Yes", newMarket.sideB || "No"],
      odds: [Math.max(1, Number(newMarket.oddsA) || 1), Math.max(1, Number(newMarket.oddsB) || 1)],
      winner: null,
    }, ...current]);
    setNewMarket({ title: "", type: "Stream", sideA: "Yes", sideB: "No", oddsA: "2.00", oddsB: "1.50", deadline: "23:00" });
  }

  function settleMarket(market: BetMarket, winner: string) {
    let payout = 0;
    const settledBets = bets.map((bet) => {
      if (bet.marketId !== market.id || bet.status !== "Open") return bet;
      const won = bet.side === winner;
      if (won) payout += Math.floor(bet.amount * bet.odds);
      return { ...bet, status: won ? "Won" : "Lost", paid: won } as Bet;
    });
    setBets(settledBets);
    setMarkets((current) => current.map((entry) => entry.id === market.id ? { ...entry, status: "Settled", winner } : entry));
    if (payout > 0) givePoints(payout);
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="ADMIN FLOOR" title="Control. Settle. Ship." meta={`${tickets.length} tickets / ${purchases.length} purchases`} />
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
      <form className="support-form account-form" onSubmit={addMarket}>
        <label>MARKET<input value={newMarket.title} onChange={(event) => setNewMarket((current) => ({ ...current, title: event.target.value }))} placeholder="Will streamer hit max win?" /></label>
        <label>SIDE A<input value={newMarket.sideA} onChange={(event) => setNewMarket((current) => ({ ...current, sideA: event.target.value }))} /></label>
        <label>SIDE B<input value={newMarket.sideB} onChange={(event) => setNewMarket((current) => ({ ...current, sideB: event.target.value }))} /></label>
        <button className="button primary" type="submit">Add bet <span>↗</span></button>
      </form>
      <div className="workspace-list">
        {markets.map((market) => (
          <article key={market.id}>
            <span>{market.status}</span>
            <div><h3>{market.title}</h3><p>{market.sides[0]} {market.odds[0]}x / {market.sides[1]} {market.odds[1]}x</p></div>
            <button type="button" disabled={market.status === "Settled"} onClick={() => settleMarket(market, market.sides[0])}>{market.sides[0]}</button>
            <button type="button" disabled={market.status === "Settled"} onClick={() => settleMarket(market, market.sides[1])}>{market.sides[1]}</button>
          </article>
        ))}
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
  const [handle, setHandle] = useState(account.handle);
  const [accessKey, setAccessKey] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccount((current) => {
      const safe = normalizeAccount(current);
      return {
        ...safe,
        handle: handle.trim().startsWith("@") ? handle.trim() : `@${handle.trim() || "guest"}`,
        accessKey,
        streak: Math.max(1, safe.streak),
      };
    });
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="PLAYER ACCOUNT" title="Kick. Discord. Go." meta={account.handle === "@guest" ? "Guest session" : `${account.handle} active`} />
      <ConnectionPanel account={account} setAccount={setAccount} />
      <form className="support-form account-form" onSubmit={submit}>
        <label>PLAYER HANDLE<input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@yourhandle" /></label>
        <label>ACCESS KEY<input type="password" value={accessKey} onChange={(event) => setAccessKey(event.target.value)} placeholder="Access key" /></label>
        <button className="button primary" type="submit">Save session <span>↗</span></button>
        <button className="button ghost" type="button" onClick={() => setAccount(defaultAccount)}>Reset local <span>↻</span></button>
      </form>
      <AccountStrip account={account} />
      <Inventory items={account.inventory} />
    </section>
  );
}

function ConnectionPanel({
  account,
  setAccount,
}: {
  account: Account;
  setAccount: (value: Account | ((current: Account) => Account)) => void;
}) {
  function toggle(provider: Provider) {
    setAccount((current) => {
      const safe = normalizeAccount(current);
      const connected = safe.connected[provider].connected;
      return {
        ...safe,
        connected: {
          ...safe.connected,
          [provider]: connected
            ? { connected: false, username: "", id: "" }
            : { connected: true, username: provider === "kick" ? safe.handle.replace("@", "") || "kick_user" : `${safe.handle.replace("@", "") || "player"}#0808`, id: uid(provider) },
        },
      };
    });
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
            <button type="button" onClick={() => toggle(provider)}>{state.connected ? "Disconnect" : `Login ${provider}`}</button>
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
      {items.length ? <div>{items.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div> : <p>Vault empty.</p>}
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
