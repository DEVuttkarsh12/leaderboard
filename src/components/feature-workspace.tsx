"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Account = {
  handle: string;
  accessKey: string;
  points: number;
  xp: number;
  streak: number;
  inventory: string[];
};

type Ticket = {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: "Open" | "Waiting" | "Solved";
  createdAt: string;
};

const defaultAccount: Account = {
  handle: "@guest",
  accessKey: "",
  points: 18500,
  xp: 4200,
  streak: 3,
  inventory: [],
};

const missions = [
  { id: "daily-spin", title: "Daily Missions", description: "3 hits before reset.", reward: 1200, goal: 100, meta: "Daily" },
  { id: "weekly-track", title: "Weekly Tracks", description: "Hold the streak.", reward: 4200, goal: 100, meta: "Weekly" },
  { id: "milestone", title: "Milestone Goals", description: "Reach checkpoint.", reward: 2800, goal: 100, meta: "Milestone" },
  { id: "seasonal", title: "Seasonal Campaigns", description: "Push season.", reward: 6500, goal: 100, meta: "Season" },
  { id: "rank-unlock", title: "Leaderboard Unlocks", description: "Top-rank vault.", reward: 3500, goal: 100, meta: "Rank" },
];

const hunts = [
  { id: "midnight", title: "Midnight Multiplier", time: "22:30", host: "Vanta", status: "Live", heat: 86 },
  { id: "neon", title: "Neon Chase", time: "00:15", host: "Luxe", status: "Upcoming", heat: 72 },
  { id: "vault", title: "Vault Break", time: "02:00", host: "Midas", status: "Upcoming", heat: 64 },
];

const clips = [
  { id: "clip-01", title: "860x reveal", stat: "12.4K views" },
  { id: "clip-02", title: "Last-spin save", stat: "8.1K views" },
  { id: "clip-03", title: "Vault streak", stat: "5.7K views" },
];

const tournaments = [
  { id: "rush", title: "Friday Rush", starts: "Tonight 21:00", prize: "40K pts", seats: 64, taken: 51 },
  { id: "duel", title: "Duel Ladder", starts: "Tomorrow 18:30", prize: "25K pts", seats: 32, taken: 18 },
  { id: "finals", title: "Season Finals", starts: "Sunday 20:00", prize: "120K pts", seats: 16, taken: 12 },
];

const storeItems = [
  { id: "boost-small", title: "Boost Pack", description: "Mission boost.", cost: 2000, tag: "Boost" },
  { id: "drop-rare", title: "Reward Drop", description: "Rare claim.", cost: 6500, tag: "Drop" },
  { id: "merch-ticket", title: "Merch Entry", description: "Gear draw.", cost: 4000, tag: "Entry" },
  { id: "voucher", title: "Voucher Reward", description: "Voucher claim.", cost: 8500, tag: "Voucher" },
];

const faq = [
  { q: "Weighted XP", a: "Live API. Read-only." },
  { q: "Mission claims", a: "Local points." },
  { q: "Store rewards", a: "Spend. Stash." },
  { q: "Raffle tickets", a: "Wager to tickets." },
  { q: "Support backend", a: "Local tickets." },
];

function nowStamp() {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date());
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

export default function FeatureWorkspace({ route }: { route: string }) {
  const [account, setAccount] = useStoredState<Account>("rankboard-account", defaultAccount);

  if (route === "challenges") return <ChallengesWorkspace account={account} setAccount={setAccount} />;
  if (route === "bonus-hunts") return <HuntsWorkspace />;
  if (route === "tournaments") return <TournamentsWorkspace />;
  if (route === "wager-raffles") return <RafflesWorkspace />;
  if (route === "store") return <StoreWorkspace account={account} setAccount={setAccount} />;
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
    setAccount((current) => ({ ...current, points: current.points + reward, xp: current.xp + reward }));
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="MISSION OPS" title="Progress. Claim. Climb." meta={`${active} active · ${claimable} ready`} />
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
      <WorkspaceHeader overline="HUNT CONTROL" title="Follow. Save. Vote." meta={`${followed.length} followed · ${savedClips.length} saved`} />
      <div className="workspace-grid two">
        {hunts.map((hunt) => {
          const isFollowed = followed.includes(hunt.id);
          return (
            <article className="action-card" key={hunt.id}>
              <small>{hunt.status} · {hunt.time}</small>
              <h3>{hunt.title}</h3>
              <p>{hunt.host} · {hunt.heat}% heat</p>
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
                <p>{votes[clip.id] ?? 0} votes · {saved ? "saved" : clip.stat}</p>
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
              <p>{item.taken + (isJoined ? 1 : 0)} / {item.seats} · {item.prize}</p>
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
          {joined ? "Withdraw entry" : "Enter bracket"}
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
      <WorkspaceHeader overline="TICKET FLOOR" title="Wager in. Tickets out." meta={`${tickets} tickets · ${entries} entries`} />
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
  const [message, setMessage] = useState("Vault ready.");

  function redeem(item: typeof storeItems[number]) {
    if (account.points < item.cost) {
      setMessage("Not enough points for that reward.");
      return;
    }
    setAccount((current) => ({
      ...current,
      points: current.points - item.cost,
      inventory: [...current.inventory, item.title],
    }));
    setMessage(`${item.title} added to inventory.`);
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="VAULT REGISTER" title="Spend. Claim. Stash." meta={message} />
      <AccountStrip account={account} />
      <div className="workspace-grid">
        {storeItems.map((item) => (
          <article className="action-card" key={item.id}>
            <small>{item.tag}</small>
            <h3>{item.title}</h3>
            <p>{item.cost.toLocaleString()} pts</p>
            <div className="action-card__footer">
              <strong>{item.cost.toLocaleString()} pts</strong>
              <button type="button" disabled={account.points < item.cost} onClick={() => redeem(item)}>Redeem</button>
            </div>
          </article>
        ))}
      </div>
      <Inventory items={account.inventory} />
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
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="XP, rewards, tickets" />
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
      id: crypto.randomUUID(),
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
              <p>{ticket.category} · {ticket.createdAt}</p>
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
    setAccount((current) => ({
      ...current,
      handle: handle.trim().startsWith("@") ? handle.trim() : `@${handle.trim() || "guest"}`,
      accessKey,
      streak: Math.max(1, current.streak),
    }));
  }

  return (
    <section className="section page-width app-workspace">
      <WorkspaceHeader overline="PLAYER ACCOUNT" title="Handle. Points. Vault." meta={account.handle === "@guest" ? "Guest session" : `${account.handle} active`} />
      <form className="support-form account-form" onSubmit={submit}>
        <label>PLAYER HANDLE<input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@yourhandle" /></label>
        <label>ACCESS KEY<input type="password" value={accessKey} onChange={(event) => setAccessKey(event.target.value)} placeholder="Access key" /></label>
        <button className="button primary" type="submit">Save session <span>↗</span></button>
        <button className="button ghost" type="button" onClick={() => setAccount(defaultAccount)}>Reset local account <span>↻</span></button>
      </form>
      <AccountStrip account={account} />
      <Inventory items={account.inventory} />
    </section>
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

function Inventory({ items }: { items: string[] }) {
  return (
    <div className="inventory-panel">
      <small>INVENTORY</small>
      {items.length ? <div>{items.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div> : <p>Vault empty.</p>}
    </div>
  );
}
