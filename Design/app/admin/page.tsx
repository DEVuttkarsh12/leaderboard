"use client";

import { useMemo, useState } from "react";
import { PlayerAvatar, ProductShell, StatusBadge } from "../components/ProductShell";
import { events, players, rewards } from "../product-data";

type AdminTab = "Overview" | "Users" | "Leaderboards" | "Rewards" | "Events" | "Announcements";

const adminUsers = players.slice(0, 9).map((player, index) => ({
  ...player,
  email: `${player.handle.replace("@", "")}@rivl.gg`,
  level: 31 - index,
  status: index === 4 ? "Flagged" : index === 7 ? "Banned" : "Active",
  joined: `${String(index + 2).padStart(2, "0")} Mar 2026`,
}));

const adminActivity = [
  ["SYSTEM", "Season 08 leaderboard recalculated", "12 SEC"],
  ["REWARD", "Golden Drop inventory adjusted to 3", "4 MIN"],
  ["USER", "Nova Vale crossed 84,000 season XP", "11 MIN"],
  ["EVENT", "Aurora Major moved to live status", "18 MIN"],
  ["SECURITY", "Automated review flagged one account", "32 MIN"],
];

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("Overview");
  const [userQuery, setUserQuery] = useState("");
  const [userFilter, setUserFilter] = useState("All");
  const [openUser, setOpenUser] = useState<string | null>(null);
  const [snapshotQueued, setSnapshotQueued] = useState(false);
  const [selectedReward, setSelectedReward] = useState(rewards[0]);
  const [rewardEnabled, setRewardEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(rewards.map((reward) => [reward.id, reward.stock > 0])));
  const [eventStates, setEventStates] = useState<Record<string, string>>(() => Object.fromEntries(events.map((event) => [event.id, event.status])));
  const [announcement, setAnnouncement] = useState("Double XP goes live Friday at 18:00 UTC. Watch any RIVL partner stream to activate your multiplier.");
  const [audience, setAudience] = useState("All Players");
  const [published, setPublished] = useState(false);
  const [toast, setToast] = useState("");

  const filteredUsers = useMemo(() => adminUsers.filter((user) => {
    const matchesQuery = `${user.name} ${user.handle} ${user.email}`.toLowerCase().includes(userQuery.toLowerCase());
    return matchesQuery && (userFilter === "All" || user.status === userFilter);
  }), [userQuery, userFilter]);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const tabs: AdminTab[] = ["Overview", "Users", "Leaderboards", "Rewards", "Events", "Announcements"];

  return (
    <ProductShell active="admin" admin>
      {toast && <div className="admin-toast" role="status"><i />{toast}<b>✓</b></div>}

      <section className="admin-hero">
        <div className="admin-hero-index">A<span>//08</span></div>
        <div className="admin-hero-copy"><span className="product-kicker">RIVL OPERATIONS / LIVE CONTROL</span><h1>CONTROL<br /><em>THE SIGNAL.</em></h1><p>Frontend operations workspace for the RIVL product prototype.</p></div>
        <aside className="admin-operator-card"><span><i /> SYSTEM HEALTHY</span><div><small>ACTIVE OPERATOR</small><strong>PLAYERONE / ADMIN</strong></div><div><small>LAST SYNC</small><strong>08 AUG · 14:42 IST</strong></div><button type="button" onClick={() => flash("All product data refreshed")}>REFRESH DATA ↻</button></aside>
      </section>

      <nav className="admin-tabs" aria-label="Admin sections">
        {tabs.map((item, index) => <button type="button" key={item} className={tab === item ? "active" : ""} aria-current={tab === item ? "page" : undefined} onClick={() => setTab(item)}><span>0{index + 1}</span>{item}{item === "Users" && <b>3,284</b>}{item === "Announcements" && <b>02</b>}</button>)}
      </nav>

      {tab === "Overview" && (
        <section className="admin-workspace">
          <AdminHeading kicker="LIVE PRODUCT OVERVIEW" title="THE BOARD, FROM ABOVE." action={<span className="admin-live-pill"><i /> LIVE TELEMETRY</span>} />
          <div className="admin-metrics">
            <Metric label="PLAYERS ONLINE" value="18,438" delta="↑ 8.4%" note="LAST 60 MIN" tone="orange" />
            <Metric label="ACTIVE ACCOUNTS" value="3,284" delta="↑ 128" note="SEASON 08" tone="violet" />
            <Metric label="XP MINTED" value="1.92M" delta="↑ 12.7%" note="THIS WEEK" tone="green" />
            <Metric label="PREDICTION POOL" value="2.50M" delta="4 LIVE" note="EVENT PTS" tone="pink" />
          </div>

          <div className="admin-overview-grid">
            <article className="admin-panel admin-traffic-panel">
              <PanelHead eyebrow="ENGAGEMENT" title="LIVE PRODUCT TRAFFIC" meta="24 HOURS" />
              <div className="traffic-chart">
                <div className="chart-scale"><span>24K</span><span>16K</span><span>8K</span><span>0</span></div>
                <svg viewBox="0 0 720 230" preserveAspectRatio="none" aria-label="Player activity over 24 hours"><defs><linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff9b45" stopOpacity=".3"/><stop offset="1" stopColor="#8f5cff" stopOpacity="0"/></linearGradient></defs><path d="M0 190 C45 175 65 195 110 162 S185 151 225 128 S300 154 345 108 S420 88 470 112 S545 84 590 62 S665 75 720 32 L720 230 L0 230 Z" fill="url(#trafficFill)"/><path d="M0 190 C45 175 65 195 110 162 S185 151 225 128 S300 154 345 108 S420 88 470 112 S545 84 590 62 S665 75 720 32" fill="none" stroke="#ff9b45" strokeWidth="3"/><circle cx="720" cy="32" r="6" fill="#ff9b45"/><circle cx="720" cy="32" r="13" fill="none" stroke="#ff9b45" strokeOpacity=".25"/></svg>
                <div className="chart-times"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>NOW</span></div>
                <span className="chart-current"><small>NOW</small><strong>18,438</strong></span>
              </div>
            </article>

            <article className="admin-panel admin-system-panel"><PanelHead eyebrow="SYSTEM" title="SERVICE STATUS" meta="ALL GREEN" /><div className="service-list">{[["LEADERBOARD SYNC","Operational","18ms"],["WATCH / EARN","Operational","42ms"],["REWARDS VAULT","Operational","31ms"],["PREDICTION ENGINE","Operational","54ms"],["NOTIFICATIONS","Operational","27ms"]].map((service) => <div key={service[0]}><i /><span><strong>{service[0]}</strong><small>{service[1]}</small></span><b>{service[2]}</b></div>)}</div></article>
            <article className="admin-panel admin-funnel-panel"><PanelHead eyebrow="TODAY" title="PLAYER LOOP" meta="UTC" /><div className="funnel-list">{[["VISITED","24,820","100%"],["WATCHED","18,438","74%"],["EARNED XP","14,206","57%"],["PREDICTED","5,482","22%"],["REDEEMED","1,204","4.8%"]].map((row) => <div key={row[0]}><span><strong>{row[0]}</strong><small>{row[1]}</small></span><i><b style={{ width: row[2] }} /></i><em>{row[2]}</em></div>)}</div></article>
            <article className="admin-panel admin-activity-panel"><PanelHead eyebrow="AUDIT TRAIL" title="RECENT ACTIVITY" meta="LIVE" /><div className="admin-activity-list">{adminActivity.map((item, index) => <div key={item[1]}><span className={`admin-activity-icon tone-${index}`}>0{index + 1}</span><p><small>{item[0]}</small><strong>{item[1]}</strong></p><time>{item[2]}</time></div>)}</div></article>
          </div>
        </section>
      )}

      {tab === "Users" && (
        <section className="admin-workspace">
          <AdminHeading kicker="USER OPERATIONS" title="KNOW EVERY SIGNAL." action={<button className="admin-primary" type="button" onClick={() => flash("User export prepared")}>EXPORT USERS <span>↗</span></button>} />
          <div className="admin-toolbar"><label className="admin-search"><span>⌕</span><input value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="Search name, handle or email" aria-label="Search users" />{userQuery && <button onClick={() => setUserQuery("")} type="button">×</button>}</label><div className="admin-filters">{["All","Active","Flagged","Banned"].map((filter) => <button type="button" className={userFilter === filter ? "active" : ""} key={filter} onClick={() => setUserFilter(filter)}>{filter}{filter === "Flagged" && <b>01</b>}</button>)}</div></div>
          <div className="admin-user-table">
            <div className="admin-user-head"><span>PLAYER</span><span>STATUS</span><span>LEVEL / XP</span><span>JOINED</span><span>LAST ACTIVE</span><span /></div>
            {filteredUsers.length ? filteredUsers.map((user, index) => <div className="admin-user-row" key={user.name}><span className="admin-user-id"><PlayerAvatar player={user} size="small"/><p><strong>{user.name}</strong><small>{user.email}</small></p></span><StatusBadge status={user.status}/><span className="admin-user-level"><b>LVL {user.level}</b><small>{user.xp.toLocaleString()} XP</small></span><span>{user.joined}</span><span className="admin-last-active"><i />{index < 4 ? `${index + 1}m ago` : `${index * 6}m ago`}</span><span className="admin-row-actions"><button type="button" aria-label={`Actions for ${user.name}`} onClick={() => setOpenUser(openUser === user.name ? null : user.name)}>•••</button>{openUser === user.name && <div><button type="button" onClick={() => { flash(`Opened ${user.name}`); setOpenUser(null); }}>VIEW PROFILE <b>↗</b></button><button type="button" onClick={() => { flash(`XP adjustment queued for ${user.name}`); setOpenUser(null); }}>ADJUST XP <b>＋</b></button><button type="button" onClick={() => { flash(`${user.name} sent to review`); setOpenUser(null); }}>FLAG ACCOUNT <b>!</b></button></div>}</span></div>) : <div className="admin-empty"><i>⌕</i><strong>NO USERS MATCH</strong><p>Try a different search or status filter.</p><button type="button" onClick={() => { setUserQuery(""); setUserFilter("All"); }}>RESET FILTERS</button></div>}
          </div>
        </section>
      )}

      {tab === "Leaderboards" && (
        <section className="admin-workspace">
          <AdminHeading kicker="COMPETITION OPERATIONS" title="RUN THE BOARD." action={<button className="admin-primary" type="button" onClick={() => { setSnapshotQueued(true); flash("Final snapshot queued"); }}>{snapshotQueued ? "SNAPSHOT QUEUED ✓" : "QUEUE SNAPSHOT"}<span>↗</span></button>} />
          <article className="admin-season-card"><div className="admin-season-mark"><span>08</span><small>ACTIVE<br/>SEASON</small></div><div><StatusBadge status="LIVE"/><h2>SEASON 08 · WEEK 03</h2><p>Weekly creator leaderboard · 3,284 eligible players</p></div><div className="admin-season-time"><span>FINAL SNAPSHOT</span><strong>04D : 17H : 32M</strong><i><b style={{width:"69%"}}/></i></div><button type="button" onClick={() => flash("Season configuration opened")}>CONFIGURE ↗</button></article>
          <div className="admin-board-grid"><article className="admin-panel admin-periods"><PanelHead eyebrow="ACTIVE WINDOWS" title="LEADERBOARD PERIODS" meta="03" />{[["WEEKLY","05—11 AUG","LIVE","3,284"],["BI-WEEKLY","29 JUL—11 AUG","ACTIVE","4,106"],["MONTHLY","01—31 AUG","ACTIVE","4,982"]].map((period,index) => <div key={period[0]}><span>0{index+1}</span><p><strong>{period[0]}</strong><small>{period[1]}</small></p><StatusBadge status={period[2]}/><b>{period[3]} PLAYERS</b><button type="button" onClick={() => flash(`${period[0]} board opened`)}>MANAGE ↗</button></div>)}</article><article className="admin-panel admin-prize-control"><PanelHead eyebrow="PRIZE CONTROL" title="CURRENT PAYOUTS" meta="$12,500" /><div className="payout-stack">{[["01","$5,000","40%"],["02","$2,500","20%"],["03","$1,500","12%"],["04—12","$3,500","28%"]].map((row) => <div key={row[0]}><span>{row[0]}</span><strong>{row[1]}</strong><i><b style={{width:row[2]}}/></i><small>{row[2]}</small></div>)}</div><button type="button" onClick={() => flash("Prize editor opened")}>EDIT PAYOUT STRUCTURE <span>↗</span></button></article></div>
          <article className="admin-panel admin-winners"><PanelHead eyebrow="PENDING VERIFICATION" title="CURRENT TOP THREE" meta="AUTO-SYNC" /><div className="admin-winner-head"><span>PLACE / PLAYER</span><span>SEASON XP</span><span>PROJECTED PAYOUT</span><span>VERIFICATION</span></div>{players.slice(0,3).map((player) => <div className="admin-winner-row" key={player.name}><span><b>#{String(player.rank).padStart(2,"0")}</b><PlayerAvatar player={player} size="small"/><p><strong>{player.name}</strong><small>{player.handle}</small></p></span><strong>{player.xp.toLocaleString()}</strong><strong>{player.reward}</strong><StatusBadge status={player.rank === 1 ? "VERIFIED" : "PENDING"}/></div>)}</article>
        </section>
      )}

      {tab === "Rewards" && (
        <section className="admin-workspace">
          <AdminHeading kicker="REWARD OPERATIONS" title="STOCK THE VAULT." action={<button className="admin-primary" type="button" onClick={() => flash("New reward draft created")}>NEW REWARD <span>＋</span></button>} />
          <div className="admin-reward-layout"><div className="admin-inventory-grid">{rewards.map((reward,index) => <button className={`admin-inventory-card${selectedReward.id === reward.id ? " selected" : ""}`} type="button" key={reward.id} onClick={() => setSelectedReward(reward)}><span className={`admin-reward-object reward-tone-${reward.tone}`}>{reward.symbol}<i>0{index+1}</i></span><div><StatusBadge status={rewardEnabled[reward.id] ? reward.stock ? "ACTIVE" : "SOLD OUT" : "PAUSED"}/><h3>{reward.name}</h3><p>{reward.category} · {reward.price.toLocaleString()} XP</p></div><strong>{reward.stock}<small>STOCK</small></strong></button>)}</div><aside className="admin-reward-editor"><span className="product-kicker">REWARD EDITOR</span><div className={`editor-reward-art reward-tone-${selectedReward.tone}`}>{selectedReward.symbol}<small>LIVE PREVIEW</small></div><label>DISPLAY NAME<input defaultValue={selectedReward.name} key={`${selectedReward.id}-name`}/></label><div><label>XP PRICE<input type="number" defaultValue={selectedReward.price} key={`${selectedReward.id}-price`}/></label><label>STOCK<input type="number" defaultValue={selectedReward.stock} key={`${selectedReward.id}-stock`}/></label></div><label className="admin-toggle-row"><span><strong>REWARD AVAILABLE</strong><small>Visible in the player vault</small></span><input type="checkbox" checked={rewardEnabled[selectedReward.id]} onChange={() => setRewardEnabled((value) => ({...value,[selectedReward.id]:!value[selectedReward.id]}))}/><i/></label><button type="button" onClick={() => flash(`${selectedReward.name} saved`)}>SAVE REWARD <span>↗</span></button></aside></div>
        </section>
      )}

      {tab === "Events" && (
        <section className="admin-workspace">
          <AdminHeading kicker="EVENT OPERATIONS" title="SET THE MOMENT." action={<button className="admin-primary" type="button" onClick={() => flash("New event draft created")}>NEW EVENT <span>＋</span></button>} />
          <div className="admin-event-summary"><Metric label="LIVE EVENTS" value="01" delta="3,904" note="PARTICIPANTS" tone="pink"/><Metric label="OPEN EVENTS" value="02" delta="4,253" note="PREDICTIONS" tone="orange"/><Metric label="UPCOMING" value="01" delta="1D 06H" note="NEXT OPEN" tone="violet"/><Metric label="POINTS LOCKED" value="2.50M" delta="↑ 18%" note="TODAY" tone="green"/></div>
          <div className="admin-event-list">{events.map((event,index) => <article key={event.id}><div className={`admin-event-art event-${event.tone}`}><span>{event.options[0].name.slice(0,1)}</span><b>VS</b><span>{event.options[1].name.slice(0,1)}</span><small>0{index+1}</small></div><div className="admin-event-info"><span className="product-kicker">{event.sport} · {event.subtitle}</span><h3>{event.title}</h3><p>{event.entrants.toLocaleString()} participants · {event.pool} locked</p></div><StatusBadge status={eventStates[event.id]}/><div className="admin-event-time"><span>{eventStates[event.id] === "LIVE" ? "LIVE STATUS" : "DEADLINE"}</span><strong>{event.deadline}</strong></div><div className="admin-event-actions"><button type="button" onClick={() => flash(`${event.title} editor opened`)}>EDIT</button><button type="button" onClick={() => { const next = eventStates[event.id] === "LIVE" ? "SETTLED" : "LIVE"; setEventStates((value) => ({...value,[event.id]:next})); flash(`${event.title} set to ${next}`); }}>{eventStates[event.id] === "LIVE" ? "SETTLE" : "GO LIVE"}</button></div></article>)}</div>
        </section>
      )}

      {tab === "Announcements" && (
        <section className="admin-workspace">
          <AdminHeading kicker="COMMUNICATIONS" title="SEND THE SIGNAL." action={<StatusBadge status="02 SCHEDULED"/>} />
          <div className="announcement-layout"><article className="announcement-composer"><PanelHead eyebrow="NEW ANNOUNCEMENT" title="COMPOSE" meta={`${announcement.length}/240`} /><label><span>MESSAGE</span><textarea maxLength={240} value={announcement} onChange={(event) => { setAnnouncement(event.target.value); setPublished(false); }}/></label><div className="audience-picker"><span>AUDIENCE</span><div>{["All Players","Top 100","Event Players","New Users"].map((item) => <button type="button" className={audience === item ? "active" : ""} key={item} onClick={() => setAudience(item)}>{item}</button>)}</div></div><div className="delivery-options"><label><input type="checkbox" defaultChecked/><i/><span><strong>IN-APP</strong><small>Notification drawer</small></span></label><label><input type="checkbox" defaultChecked/><i/><span><strong>DISCORD</strong><small>Community channel</small></span></label><label><input type="checkbox"/><i/><span><strong>EMAIL</strong><small>Campaign send</small></span></label></div><div className="composer-actions"><button type="button" onClick={() => flash("Announcement saved as draft")}>SAVE DRAFT</button><button type="button" disabled={!announcement.trim()} onClick={() => {setPublished(true); flash("Announcement published");}}>{published ? "PUBLISHED ✓" : "PUBLISH NOW"}<span>↗</span></button></div></article><aside className="announcement-preview"><span className="product-kicker">PLAYER PREVIEW</span><div className="preview-phone"><div className="preview-phone-head"><span className="p-brand-mark"><i/><i/><i/></span><strong>RIVL</strong><small>NOW</small></div><div className="preview-notification"><span>◆</span><div><small>RIVL ANNOUNCEMENT · {audience.toUpperCase()}</small><p>{announcement || "Your announcement preview will appear here."}</p></div><i/></div><div className="preview-board-lines"><i/><i/><i/><i/></div></div><p>Preview approximates the in-app notification drawer. Delivery is mocked in this frontend prototype.</p></aside></div>
          <article className="admin-panel scheduled-announcements"><PanelHead eyebrow="QUEUE" title="SCHEDULED & RECENT" meta="03" />{[["SEASON 08 FINAL WEEK","All Players","09 AUG · 18:00","SCHEDULED"],["AURORA MAJOR IS LIVE","Event Players","TODAY · 13:04","SENT"],["GOLDEN DROP: 3 LEFT","Top 100","TODAY · 09:30","SENT"]].map((item,index) => <div key={item[0]}><span>0{index+1}</span><p><strong>{item[0]}</strong><small>{item[1]}</small></p><time>{item[2]}</time><StatusBadge status={item[3]}/><button type="button" onClick={() => flash(`${item[0]} opened`)}>•••</button></div>)}</article>
        </section>
      )}
    </ProductShell>
  );
}

function AdminHeading({ kicker, title, action }: { kicker: string; title: string; action?: React.ReactNode }) {
  return <div className="admin-heading"><div><span className="product-kicker">{kicker}</span><h2>{title}</h2></div>{action}</div>;
}

function Metric({ label, value, delta, note, tone }: { label: string; value: string; delta: string; note: string; tone: string }) {
  return <article className={`admin-metric metric-${tone}`}><span>{label}</span><strong>{value}</strong><div><b>{delta}</b><small>{note}</small></div><i /></article>;
}

function PanelHead({ eyebrow, title, meta }: { eyebrow: string; title: string; meta: string }) {
  return <div className="admin-panel-head"><div><span>{eyebrow}</span><h3>{title}</h3></div><b>{meta}</b></div>;
}
