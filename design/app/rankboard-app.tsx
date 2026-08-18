"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Player, players } from "./data";

const NAV = [
  ["Home", "/", "⌂"],
  ["Board", "/leaderboard", "↗"],
  ["Missions", "/challenges", "◎"],
  ["Hunts", "/bonus-hunts", "◈"],
  ["Vault", "/store", "◇"],
  ["Help", "/help", "?"],
] as const;

const launchpad = [
  ["Live Board", "Climb the ranks", "/leaderboard", "01", "lime"],
  ["Missions", "Stack daily XP", "/challenges", "02", "violet"],
  ["Bonus Hunts", "Chase the big hit", "/bonus-hunts", "03", "coral"],
  ["Tournaments", "Enter the bracket", "/tournaments", "04", "blue"],
  ["Raffles", "Turn wagers into tickets", "/wager-raffles", "05", "yellow"],
  ["Store", "Spend your points", "/store", "06", "pink"],
  ["Support", "Get unstuck fast", "/support", "07", "mint"],
  ["Account", "Track your rewards", "/login", "08", "orange"],
] as const;

const pageData: Record<string, { title: string; eyebrow: string; copy: string; actions: [string, string][]; stats: [string, string][]; features: [string, string, string][] }> = {
  challenges: {
    title: "Challenges", eyebrow: "MISSION CONTROL", copy: "Turn every session into a route up the board. Pick a mission, build heat, and bank the XP.",
    actions: [["View leaderboard", "/leaderboard"], ["Open store", "/store"]],
    stats: [["Mode", "Missions"], ["Flow", "Daily + weekly"], ["Focus", "Rank climb"]],
    features: [["Daily Missions", "Quick hits that refresh every 24 hours.", "12 live"], ["Weekly Tracks", "Longer runs with stacked checkpoint rewards.", "04 tracks"], ["Milestone Goals", "Big XP for the moments worth chasing.", "8 tiers"], ["Seasonal Campaigns", "Limited-time worlds with their own reward paths.", "S08"], ["Leaderboard Unlocks", "Placements open exclusive store drops.", "Top 50"]],
  },
  "bonus-hunts": {
    title: "Bonus Hunts", eyebrow: "STREAM HEAT", copy: "Follow live sessions, lock in the schedule, and catch the clips that shook the floor.",
    actions: [["Open tournaments", "/tournaments"], ["Open help", "/help"]],
    stats: [["Mode", "Stream"], ["State", "Live heat"], ["Focus", "Big hits"]],
    features: [["Live Session Cards", "See who is streaming and where the heat is building.", "Live"], ["Schedule Blocks", "Know the next hunt before the first spin lands.", "6 today"], ["Highlight Recaps", "Fast cuts of the biggest multipliers and reactions.", "38 clips"], ["Clip Surface", "Save, share, and vote on the night’s wildest moments.", "Trending"]],
  },
  tournaments: {
    title: "Tournaments", eyebrow: "BRACKET MODE", copy: "Short runs. Sharp stakes. One clean route from qualifier to champion.",
    actions: [["Open bonus hunts", "/bonus-hunts"], ["View leaderboard", "/leaderboard"]],
    stats: [["Mode", "Bracket"], ["State", "Upcoming"], ["Focus", "Prize run"]],
    features: [["Upcoming Brackets", "Scan open events, start times, and entry windows.", "3 open"], ["Match Flow", "Follow every round without losing the bigger picture.", "Round 02"], ["Prize Breakdown", "Clear rewards for every meaningful placement.", "40K pts"], ["Winners Surface", "Champions, streaks, and final-run highlights.", "Hall of fame"]],
  },
  "wager-raffles": {
    title: "Wager Raffles", eyebrow: "TICKET DROP", copy: "Your play earns entries. Your entries unlock shots at the vault.",
    actions: [["Back to challenges", "/challenges"], ["Open leaderboard", "/leaderboard"]],
    stats: [["Mode", "Tickets"], ["State", "Draw ready"], ["Focus", "Prize drops"]],
    features: [["Ticket Thresholds", "See exactly how activity converts into entries.", "1/10K"], ["Prize Tiers", "From instant boosts to headline vault drops.", "5 tiers"], ["Claim Readiness", "Know when a reward is cleared and ready to collect.", "Instant"], ["Entry Summary", "One view for active tickets and draw history.", "24 entries"]],
  },
  store: {
    title: "Reward Store", eyebrow: "THE VAULT", copy: "Cash in the climb. Redeem earned points for boosts, drops, entries, and limited gear.",
    actions: [["Open challenges", "/challenges"], ["Need support?", "/support"]],
    stats: [["Mode", "Catalog"], ["State", "Drops"], ["Focus", "Redeem"]],
    features: [["Boost Packs", "Small power-ups for your next mission run.", "From 2K"], ["Reward Drops", "Rotating limited items—when they’re gone, they’re gone.", "6 live"], ["Merch Entries", "Use points for chances at exclusive RankBoard gear.", "Limited"], ["Voucher Rewards", "Turn consistent play into flexible value.", "12 types"]],
  },
  help: {
    title: "Help Center", eyebrow: "FIND YOUR ANSWER", copy: "Simple answers for ranks, XP, rewards, claims, and everything around the board.",
    actions: [["Open support", "/support"], ["Read terms", "/terms"]],
    stats: [["Response", "Under 2 min"], ["Guides", "28 live"], ["Status", "All green"]],
    features: [["Leaderboard Basics", "How ranks, weighted XP, and updates work.", "Start here"], ["Challenge and Reward Pages", "Understand missions, unlocks, and redemptions.", "8 guides"], ["Support Escalation", "What to send when you need a human answer.", "Fast lane"], ["Policy Links", "Privacy, terms, and fair-play information.", "Read"]],
  },
  support: {
    title: "Support", eyebrow: "WE’VE GOT YOU", copy: "Tell us where the run broke. We’ll help you get back on the board.",
    actions: [["Open help center", "/help"], ["Open login", "/login"]],
    stats: [["Team", "Online"], ["Queue", "4 ahead"], ["Typical", "8 minutes"]],
    features: [["Account Access", "Login, identity, and profile recovery help.", "Priority"], ["Reward Questions", "Missing points, locked drops, or redemption checks.", "Rewards"], ["Claim Escalations", "A clear route for time-sensitive prize issues.", "Escalate"], ["Conversation Surface", "Keep the full support thread in one place.", "New ticket"]],
  },
  login: {
    title: "Account Entry", eyebrow: "PLAYER ACCESS", copy: "Sign in to keep your streak, track rewards, and make every point count.",
    actions: [["Open support", "/support"], ["View leaderboard", "/leaderboard"]],
    stats: [["Session", "Protected"], ["Rewards", "Synced"], ["Status", "Ready"]],
    features: [["Entry Surface", "One clean route back into your player account.", "Sign in"], ["Account Benefits", "Saved missions, streaks, and personal movement.", "Synced"], ["Reward Access", "See claims, points, and unlock history.", "Your vault"], ["Security Messaging", "Clear status and recovery guidance when needed.", "Protected"]],
  },
};

function fmt(value: number) { return new Intl.NumberFormat("en-US").format(value); }
function initials(name: string) { return name.replace(/•/g, "").split(/\s|(?=[A-Z])/).filter(Boolean).slice(0, 2).map(v => v[0]).join(""); }

export default function RankBoardApp({ route = "" }: { route?: string }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const path = route ? `/${route}` : "/";
  return (
    <div className="site-shell">
      <Header path={path} accountOpen={accountOpen} setAccountOpen={setAccountOpen} />
      {route === "" ? <Home /> : route === "leaderboard" ? <Leaderboard /> : route === "privacy" || route === "terms" ? <Legal type={route} /> : <FeaturePage data={pageData[route] ?? pageData.help} isLogin={route === "login"} />}
      <Footer />
    </div>
  );
}

function Header({ path, accountOpen, setAccountOpen }: { path: string; accountOpen: boolean; setAccountOpen: (v: boolean) => void }) {
  return <header className="header">
    <Link className="brand" href="/" aria-label="RankBoard home"><span className="brand-mark">R</span><span>RANK<span>BOARD</span></span></Link>
    <nav className="nav" aria-label="Primary navigation">{NAV.map(([label, href, icon]) => <Link key={href} className={path === href ? "active" : ""} href={href}><i>{icon}</i>{label}</Link>)}</nav>
    <div className="header-actions"><span className="live-pill"><b /> LIVE</span><button className="icon-button" aria-label="Leaderboard notifications">♜<span>3</span></button><div className="account-wrap"><button className="avatar-button" onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen}>DV</button>{accountOpen && <div className="account-menu"><p>PLAYER MENU <span>LV.12</span></p>{[["Login", "/login"], ["Support", "/support"], ["Privacy", "/privacy"], ["Terms", "/terms"]].map(([n,h]) => <Link key={h} href={h}>{n}<span>↗</span></Link>)}</div>}</div></div>
  </header>;
}

function Home() {
  return <main>
    <section className="product-hero page-width">
      <div className="hero-copy">
        <p className="kicker"><span>●</span> SEASON 08 · LIVE FLOOR</p>
        <h1>PLAY THE <em>BOARD.</em><br/>OWN THE <strong>NIGHT.</strong></h1>
        <p className="hero-desc">Climb on weighted XP, turn every wager into momentum, and unlock the loudest rewards on the floor.</p>
        <div className="button-row"><Link className="button primary" href="/leaderboard">View leaderboard <span>↗</span></Link><Link className="button ghost" href="/store">Explore rewards <span>◇</span></Link></div>
        <div className="micro-proof"><span>28 PLAYERS MOVING</span><span>ROUND 08 ENDS IN 02D : 14H</span></div>
      </div>
      <div className="hero-floor">
        <div className="floor-top"><span>FRONT THREE</span><span className="pulse-text">● UPDATING</span></div>
        <Podium compact />
        <div className="floor-ticker"><span>VANTA•••ACE <b>+12,480 XP</b></span><span>LUXE•••RIOT <b>STREAK ×7</b></span></div>
      </div>
      <div className="sticker sticker-one">+XP</div><div className="sticker sticker-two">HOT!</div>
    </section>
    <section className="metric-strip"><div><span>VISIBLE WAGER</span><strong>18.4M</strong><small>+8.2% today</small></div><div><span>PLAYERS LIVE</span><strong>28</strong><small>19 running hot</small></div><div><span>TOP XP</span><strong>982K</strong><small>Vanta leads</small></div><div className="round-block"><span>NEXT DROP</span><strong>18:42</strong><small>Prize vault</small></div></section>
    <section className="section page-width"><SectionHeading overline="CHOOSE YOUR RUN" title="THE FLOOR IS YOURS." link={["Open live board", "/leaderboard"]}/><div className="launch-grid">{launchpad.map(([title,desc,href,num,color]) => <Link className={`launch-card ${color}`} href={href} key={href}><span className="launch-num">{num}</span><span className="launch-icon">↗</span><div><h3>{title}</h3><p>{desc}</p></div></Link>)}</div></section>
    <section className="section page-width rewards-section"><SectionHeading overline="KEEP THE HEAT" title="REWARDS THAT MOVE." link={["Enter the vault", "/store"]}/><div className="reward-grid">{[["Daily Drop","A fresh reward every 24 hours.","CLAIM IN 04:18","✦"],["Streak Heat","Play days stack into bigger multipliers.","7 DAY STREAK","≈"],["Prize Vault","Top placements unlock rare drops.","3 UNLOCKED","◇"],["Lucky Spin","Turn mission tokens into a wild card.","2 SPINS READY","◎"]].map(([n,d,s,i])=><article className="reward-item" key={n}><span>{i}</span><div><small>{s}</small><h3>{n}</h3><p>{d}</p></div><button aria-label={`Open ${n}`}>↗</button></article>)}</div></section>
  </main>;
}

function SectionHeading({ overline, title, link }: { overline: string; title: string; link: [string,string] }) { return <div className="section-heading"><div><p>{overline}</p><h2>{title}</h2></div><Link href={link[1]}>{link[0]} <span>↗</span></Link></div> }

function Podium({ compact = false }: { compact?: boolean }) {
  const order = [players[1], players[0], players[2]];
  return <div className={`podium ${compact ? "compact" : ""}`}>{order.map((p, idx) => <article className={`podium-card rank-${p.rank}`} key={p.id}><div className="rank-badge">#{p.rank}</div><div className="avatar"><span>{initials(p.name)}</span>{p.verified && <i>✓</i>}</div><div className="podium-copy"><strong>{p.name}</strong><small>{p.username}</small><b>{fmt(p.xp)} <em>XP</em></b><span>{fmt(p.points)} wagered</span></div>{idx === 1 && <div className="crown">♛</div>}</article>)}</div>;
}

function Leaderboard() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"xp"|"rank">("xp");
  const [visible, setVisible] = useState(10);
  const [updated, setUpdated] = useState("JUST NOW");
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Player | null>(null);
  const filtered = useMemo(() => players.filter(p => `${p.name} ${p.username}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => sort === "xp" ? b.xp-a.xp : a.rank-b.rank), [query,sort]);
  function refresh(){ setRefreshing(true); setTimeout(()=>{setRefreshing(false);setUpdated("JUST NOW")},650); }
  return <main>
    <section className="board-hero page-width">
      <div><p className="kicker"><span>●</span> LIVE BOARD · ROUND 08</p><h1>THE BOARD<br/><em>NEVER SLEEPS.</em></h1><p>Every move counts. Every point shifts the floor.</p></div>
      <div className="round-ticket"><span>RANKBOARD / SEASON 08</span><b>ROUND LIVE</b><strong>02D : 14H : 33M</strong><small>LAST UPDATE · {updated}</small></div>
    </section>
    <section className="metric-strip board-metrics"><div><span>VISIBLE PLAYERS</span><strong>{players.length}</strong><small>19 live now</small></div><div><span>VISIBLE WAGER</span><strong>18.4M</strong><small>+1.2M today</small></div><div><span>PRIZE VAULT</span><strong>250K</strong><small>points + drops</small></div><div className="round-block"><span>BOARD STATE</span><strong>LIVE</strong><small>refreshing every 60s</small></div></section>
    <section className="section page-width"><SectionHeading overline="THE ONES TO CATCH" title="FRONT THREE." link={["Reward routes", "/challenges"]}/><Podium /></section>
    <section className="section page-width board-section">
      <div className="standings">
        <div className="standings-title"><div><p>FULL STANDINGS</p><h2>CHASE THE CLIMB.</h2></div><Link className="route-link" href="/challenges">Reward routes <span>↗</span></Link></div>
        <div className="board-controls"><label className="search"><span>⌕</span><input value={query} onChange={e=>{setQuery(e.target.value);setVisible(10)}} placeholder="Find player or handle" aria-label="Search players"/></label><div className="segment"><button className={sort==="xp"?"active":""} onClick={()=>setSort("xp")}>Top XP</button><button className={sort==="rank"?"active":""} onClick={()=>setSort("rank")}>Rank order</button></div><button className={`refresh ${refreshing?"spin":""}`} onClick={refresh} aria-label="Refresh leaderboard">↻ <span>Refresh</span></button></div>
        <div className="table-head"><span>RANK / PLAYER</span><span>STATUS</span><span>WEIGHTED XP</span><span>WAGERED</span><span /></div>
        <div className="player-list">{filtered.length ? filtered.slice(0,visible).map(p=><PlayerRow key={p.id} player={p} leader={players[0].xp} onOpen={()=>setSelected(p)}/>) : <div className="empty-state"><span>⌕</span><h3>NO PLAYER ON THIS RUN.</h3><p>Try another masked name or handle.</p><button onClick={()=>setQuery("")}>Clear search</button></div>}</div>
        {filtered.length > visible && <button className="load-more" onClick={()=>setVisible(v=>v+8)}>Load more players <span>{Math.min(visible,filtered.length)} / {filtered.length}</span></button>}
      </div>
      <aside className="board-sidebar"><article className="side-card metrics-card"><p>BOARD METRICS <span>LIVE</span></p><div><small>VISIBLE PLAYERS</small><strong>{players.length}</strong></div><div><small>TOP PLAYER</small><strong>{players[0].name}</strong><em>{fmt(players[0].xp)} XP</em></div><div><small>VISIBLE WAGER</small><strong>18.4M</strong></div><div><small>CURRENT ROUND</small><strong>08 / LIVE</strong></div><Link href="/support">Need board help? <span>↗</span></Link></article><article className="side-card pulse-card"><p>BOARD PULSE <span>●</span></p>{players.slice(3,7).map((p,i)=><div key={p.id}><b>+{[3,1,5,2][i]}</b><span><strong>{p.name}</strong><small>{i%2?"broke a streak":"moved up the board"}</small></span><em>{p.lastActive}</em></div>)}</article></aside>
    </section>
    <section className="section page-width state-lab"><SectionHeading overline="SYSTEM FEEDBACK" title="EVERY STATE, COVERED." link={["Get support", "/support"]}/><div className="state-grid"><article><p>LOADING</p><div className="skeleton-row"><i/><span><i/><i/></span></div><div className="skeleton-row"><i/><span><i/><i/></span></div></article><article className="mini-empty"><p>EMPTY SEARCH</p><span>⌕</span><strong>No players found</strong><small>Switch up the search.</small></article><article className="mini-error"><p>CONNECTION ERROR</p><span>!</span><strong>The board blinked.</strong><small>Last good data is still visible.</small><button onClick={refresh}>Try again</button></article></div></section>
    {selected && <div className="modal-backdrop" onClick={()=>setSelected(null)}><article className="player-modal" onClick={e=>e.stopPropagation()}><button onClick={()=>setSelected(null)} aria-label="Close">×</button><p>PLAYER SNAPSHOT · #{selected.rank}</p><div className="modal-identity"><div className="avatar"><span>{initials(selected.name)}</span></div><div><h2>{selected.name}</h2><span>{selected.username} · {selected.verified?"VERIFIED":"CHALLENGER"}</span></div></div><div className="modal-stats"><div><small>WEIGHTED XP</small><strong>{fmt(selected.xp)}</strong></div><div><small>WAGERED</small><strong>{fmt(selected.points)}</strong></div><div><small>LAST ACTIVE</small><strong>{selected.lastActive}</strong></div></div><Link href="/challenges">View reward routes <span>↗</span></Link></article></div>}
  </main>;
}

function PlayerRow({ player, leader, onOpen }: { player: Player; leader: number; onOpen: () => void }) { return <button className={`player-row rank-row-${player.rank}`} onClick={onOpen}><div className="player-cell"><b className="row-rank">{String(player.rank).padStart(2,"0")}</b><div className="mini-avatar">{initials(player.name)}</div><span><strong>{player.name}{player.verified&&<i>✓</i>}</strong><small>{player.username}</small></span></div><div><span className={player.rank<7?"status hot":"status live"}>{player.rank<7?"HOT":"LIVE"}</span></div><div className="xp-cell"><strong>{fmt(player.xp)} <small>XP</small></strong><span><i style={{width:`${(player.xp/leader)*100}%`}}/></span></div><strong className="wager">{fmt(player.points)}</strong><span className="open-row">↗</span></button> }

function FeaturePage({ data, isLogin = false }: { data: typeof pageData[string]; isLogin?: boolean }) {
  return <main><section className="subpage-hero page-width"><div><p className="kicker"><span>✦</span> {data.eyebrow}</p><h1>{data.title.toUpperCase()}<em>.</em></h1><p>{data.copy}</p><div className="button-row">{data.actions.map(([n,h],i)=><Link key={h} className={`button ${i?"ghost":"primary"}`} href={h}>{n}<span>↗</span></Link>)}</div></div><div className="subpage-art"><span className="art-orbit">{data.title.slice(0,2).toUpperCase()}</span><strong>{data.stats[0][1]}</strong><small>RANKBOARD / SEASON 08</small></div></section><section className="metric-strip sub-stats">{data.stats.map(([n,v],i)=><div key={n} className={i===2?"round-block":""}><span>{n}</span><strong>{v}</strong><small>{i===0?"ACTIVE SYSTEM":i===1?"CURRENT STATE":"PLAYER OBJECTIVE"}</small></div>)}</section>{isLogin && <section className="login-panel page-width"><div><p>WELCOME BACK, PLAYER</p><h2>KEEP THE STREAK ALIVE.</h2></div><form onSubmit={e=>e.preventDefault()}><label>PLAYER HANDLE<input placeholder="@yourhandle" /></label><label>ACCESS KEY<input type="password" placeholder="••••••••" /></label><button className="button primary" type="submit">Enter RankBoard <span>↗</span></button></form></section>}<section className="section page-width"><SectionHeading overline="WHAT’S INSIDE" title="BUILT FOR THE RUN." link={[data.actions[0][0],data.actions[0][1]]}/><div className="feature-grid">{data.features.map(([n,d,s],i)=><article key={n}><span>{String(i+1).padStart(2,"0")}</span><small>{s}</small><div><h3>{n}</h3><p>{d}</p></div><Link href={data.actions[0][1]}>Explore <b>↗</b></Link></article>)}</div></section></main>;
}

function Legal({ type }: { type: string }) { const privacy=type==="privacy"; return <main className="legal page-width"><p className="kicker"><span>◇</span> RANKBOARD LEGAL</p><h1>{privacy?"PRIVACY":"TERMS"}<em>.</em></h1><p className="legal-lead">{privacy?"How RankBoard handles player information, session data, and reward activity.":"The ground rules for using RankBoard, joining reward activity, and keeping play fair."}</p><div className="legal-layout"><aside><span>LAST UPDATED</span><strong>AUG 13, 2026</strong><Link href={privacy?"/terms":"/privacy"}>{privacy?"Read terms":"Read privacy"} ↗</Link></aside><article>{(privacy?[["1. Information we use","RankBoard may process account identifiers, leaderboard activity, reward progress, and basic device information needed to operate the product."],["2. Why we use it","We use this information to display ranks, maintain reward progress, protect the floor, and respond to support requests."],["3. Your choices","Players may request access, correction, or deletion of eligible account information through support."],["4. Data protection","Reasonable technical and organizational safeguards are used to protect information from unauthorized access."]]:[["1. Using RankBoard","Use the product lawfully, keep account access secure, and do not interfere with rankings, missions, or other players."],["2. Rankings and rewards","Rank calculations, challenge eligibility, and rewards may be reviewed when activity appears invalid, duplicated, or manipulated."],["3. Fair play","Automation, exploit attempts, false identities, and coordinated manipulation can lead to removal from a round."],["4. Availability","Live data can briefly lag or become unavailable. The latest verified state remains the basis for ranking decisions."]]).map(([h,p])=><section key={h}><h2>{h}</h2><p>{p}</p></section>)}</article></div></main> }

function Footer(){return <footer className="footer"><div className="footer-top page-width"><div><Link className="brand" href="/"><span className="brand-mark">R</span><span>RANK<span>BOARD</span></span></Link><p>PLAY THE BOARD.<br/>OWN THE NIGHT.</p></div><div className="footer-links">{[["Home","/"],["Leaderboard","/leaderboard"],["Challenges","/challenges"],["Store","/store"],["Bonus Hunts","/bonus-hunts"],["Tournaments","/tournaments"],["Wager Raffles","/wager-raffles"],["Support","/support"],["Help","/help"],["Privacy","/privacy"],["Terms","/terms"]].map(([n,h])=><Link key={h} href={h}>{n}<span>↗</span></Link>)}</div></div><div className="footer-bottom"><span>© 2026 RANKBOARD</span><span>THE BOARD IS LIVE <b>●</b></span><span>PLAY RESPONSIBLY · 18+</span></div></footer>}

