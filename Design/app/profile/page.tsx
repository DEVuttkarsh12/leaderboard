"use client";

import { useEffect, useState } from "react";
import { PageIntro, PlayerAvatar, ProductShell, SectionTitle, StatusBadge } from "../components/ProductShell";
import { notifications, players, profileAchievements, redemptions } from "../product-data";

type ProfileTab = "Overview" | "Progress" | "Achievements" | "Rewards" | "Account";

export default function ProfilePage() {
  const [tab, setTab] = useState<ProfileTab>("Overview");
  const [copied, setCopied] = useState(false);
  const [kickConnected, setKickConnected] = useState(true);
  const [discordConnected, setDiscordConnected] = useState(true);
  const [casinoEditing, setCasinoEditing] = useState(false);
  const [casinoUsername, setCasinoUsername] = useState("playerone_rivl");
  const [achievementFilter, setAchievementFilter] = useState("ALL");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (requested === "account") setTab("Account");
  }, []);

  const user = players[13];
  const achievements = profileAchievements.filter((item) => achievementFilter === "ALL" || (achievementFilter === "UNLOCKED" ? item.unlocked : !item.unlocked));

  const copyReferral = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <ProductShell active="profile">
      <section className="profile-product-hero">
        <div className="profile-hero-art"><div className="profile-grid-plane" /><span className="profile-live-id"><i /> LIVE IDENTITY</span><div className="profile-hero-monogram">P1</div><strong>#14</strong></div>
        <div className="profile-hero-content"><PlayerAvatar player={user} size="large" /><div><span className="product-kicker">PLAYER PROFILE · SEASON 08</span><h1>PlayerOne</h1><p>@playerone · Joined March 2026</p></div><button type="button">SHARE PROFILE <span>↗</span></button><div className="profile-hero-stats"><span><small>CURRENT RANK</small><strong>#14</strong><b>↑ 2 THIS WEEK</b></span><span><small>SEASON XP</small><strong>38,210</strong><b>TOP 4.2%</b></span><span><small>WATCH STREAK</small><strong>07 DAYS</strong><b>BEST: 17</b></span><span><small>EVENT POINTS</small><strong>14,820</strong><b>+1,240 WEEKLY</b></span></div></div>
      </section>

      <div className="profile-product-tabs" role="tablist" aria-label="Profile sections">{(["Overview", "Progress", "Achievements", "Rewards", "Account"] as ProfileTab[]).map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}{item === "Achievements" && <span>06</span>}{item === "Rewards" && <span>04</span>}</button>)}</div>

      {tab === "Overview" && (
        <section className="product-section profile-overview-grid">
          <div className="profile-main-column">
            <SectionTitle eyebrow="CURRENT PROGRESSION" title="THE NEXT PLACE IS CLOSE." />
            <article className="rank-chase-card"><div className="rank-chase-head"><span><small>YOU</small><strong>#14</strong></span><i>→</i><span><small>NEXT</small><strong>#13</strong></span></div><div className="rank-opponent"><PlayerAvatar player={user} /><div><strong>PlayerOne</strong><small>38,210 XP</small></div><span>4,180 XP GAP</span><PlayerAvatar player={players[12]} /><div><strong>Echo Lane</strong><small>42,390 XP</small></div></div><div className="rank-chase-track"><i><b style={{ width: "68%" }} /></i><span>68% OF THE GAP CLOSED</span></div><a href="/leaderboard">VIEW LIVE BOARD <span>↗</span></a></article>

            <SectionTitle eyebrow="RECENT ACTIVITY" title="YOUR SIGNAL." action={<button className="text-action" type="button">VIEW ALL <span>↗</span></button>} />
            <div className="profile-activity-list">{notifications.slice(0,4).map((notice, index) => <article key={notice.title}><span className={`notice-icon ${notice.kind}`}>0{index+1}</span><div><strong>{notice.title}</strong><p>{notice.body}</p></div><small>{notice.time} AGO</small></article>)}</div>
          </div>

          <aside className="profile-side-column">
            <article className="level-card"><span className="product-kicker">SEASON LEVEL</span><div className="level-number">27<small>LVL</small></div><p>2,420 / 3,000 XP</p><i><b style={{ width: "81%" }} /></i><div><span>NEXT UNLOCK</span><strong>500 XP BOOST</strong></div></article>
            <article className="profile-connections"><div><span className="product-kicker">CONNECTED SIGNALS</span><a href="#account" onClick={(event) => { event.preventDefault(); setTab("Account"); }}>MANAGE ↗</a></div><span><i>K</i><p><strong>Kick</strong><small>kainorth</small></p><b>CONNECTED</b></span><span><i>D</i><p><strong>Discord</strong><small>playerone</small></p><b>CONNECTED</b></span><span><i>T</i><p><strong>Thrill</strong><small>{casinoUsername}</small></p><b>VERIFIED</b></span></article>
            <article className="referral-card"><span className="product-kicker">RIVL REFERRALS</span><h3>BRING THE<br />CREW.</h3><p>Earn 1,000 XP for every friend who completes their first watch mission.</p><div><span><small>SUCCESSFUL</small><strong>08</strong></span><span><small>XP EARNED</small><strong>8,000</strong></span></div><button type="button" onClick={copyReferral}>{copied ? "LINK COPIED ✓" : "COPY REFERRAL LINK"}<span>↗</span></button></article>
          </aside>
        </section>
      )}

      {tab === "Progress" && (
        <section className="product-section progression-page">
          <PageIntro index="04" eyebrow="XP / PROGRESSION" title="MAKE EVERY" accent="MINUTE COUNT." description="Your route from Level 27 to the season’s final tier." aside={<div className="vault-balance"><span>SEASON XP</span><strong>38,210 <small>XP</small></strong><p>TOP 4.2% OF PLAYERS</p></div>} />
          <div className="progression-rail"><div className="progression-line"><i style={{ width: "64%" }} /></div>{[
            ["24","5K BONUS","UNLOCKED"],["25","RARE BADGE","UNLOCKED"],["26","1.2× BOOST","UNLOCKED"],["27","CURRENT","ACTIVE"],["28","500 XP BOOST","LOCKED"],["29","VAULT KEY","LOCKED"],["30","SEASON CHEST","LOCKED"],
          ].map((level, index) => <article className={`${level[2].toLowerCase()}${index === 3 ? " current" : ""}`} key={level[0]}><span>{level[0]}</span><strong>{level[1]}</strong><small>{level[2]}</small></article>)}</div>
          <div className="progression-panels"><article className="xp-source-card"><SectionTitle eyebrow="XP SOURCES" title="WHERE IT COMES FROM." /><div>{[["WATCH TIME","18,420 XP","48%"],["MISSIONS","8,150 XP","21%"],["EVENTS","6,840 XP","18%"],["REFERRALS","4,800 XP","13%"]].map((item) => <span key={item[0]}><i><b style={{ width: item[2] }} /></i><p><strong>{item[0]}</strong><small>{item[1]}</small></p><b>{item[2]}</b></span>)}</div></article><article className="milestone-card"><span className="product-kicker">NEXT MILESTONE</span><strong>790</strong><h3>XP TO LEVEL 28</h3><p>Unlock a 500 XP boost and a new profile frame.</p><div className="milestone-stack"><i /><i /><span>28</span></div><a href="/events">KEEP EARNING <span>↗</span></a></article></div>
        </section>
      )}

      {tab === "Achievements" && (
        <section className="product-section achievements-page"><SectionTitle eyebrow="COLLECTIBLE PROGRESSION" title="PROOF YOU WERE THERE." action={<div className="achievement-filters">{["ALL","UNLOCKED","LOCKED"].map((item) => <button type="button" className={achievementFilter === item ? "active" : ""} onClick={() => setAchievementFilter(item)} key={item}>{item}</button>)}</div>} /><div className="profile-achievement-grid">{achievements.map((item) => <article className={item.unlocked ? "unlocked" : "locked"} key={item.name}><div className="profile-badge"><i /><span>{item.symbol}</span><i /></div><StatusBadge status={item.rarity} /><h3>{item.name}</h3><p>{item.unlocked ? `EARNED ${item.earned}` : item.earned}</p><div><i><b style={{ width: `${item.progress}%` }} /></i><span>{item.progress}%</span></div><small>{item.unlocked ? "UNLOCKED" : "IN PROGRESS"}</small></article>)}</div></section>
      )}

      {tab === "Rewards" && (
        <section className="product-section profile-rewards-page"><SectionTitle eyebrow="REWARD HISTORY" title="EARNED. REDEEMED. YOURS." action={<a className="solid-action" href="/rewards">OPEN THE VAULT <span>↗</span></a>} /><div className="earned-reward-cards"><article><span className="reward-object small violet">V</span><div><StatusBadge status="ACTIVE" /><h3>VIP DISCORD ROLE</h3><p>Active until 19 Aug 2026</p></div><button type="button">VIEW ↗</button></article><article><span className="reward-object small lavender">×2</span><div><StatusBadge status="USED" /><h3>MYSTERY BOOST</h3><p>2× multiplier · 02 Jul 2026</p></div><button type="button">DETAILS ↗</button></article><article className="locked"><span className="reward-object small gold">01</span><div><StatusBadge status="LOCKED" /><h3>GOLDEN DROP TICKET</h3><p>6,790 XP still required</p></div><button type="button">EARN ↗</button></article></div><div className="history-table"><div className="history-head"><span>REWARD</span><span>REFERENCE</span><span>DATE</span><span>COST</span><span>STATUS</span></div>{redemptions.map((item) => <div className="history-row" key={item.reference}><span className="history-reward"><i>{item.reward.slice(0,1)}</i><strong>{item.reward}</strong></span><span>{item.reference}</span><span>{item.date}</span><span>{item.cost}</span><StatusBadge status={item.status} /></div>)}</div></section>
      )}

      {tab === "Account" && (
        <section className="product-section account-page" id="account"><SectionTitle eyebrow="ACCOUNT / CONNECTIONS" title="YOUR SIGNALS. CONNECTED." /><div className="account-grid"><div className="account-main"><article className="account-panel"><div className="account-panel-head"><div><span className="product-kicker">STREAMING & COMMUNITY</span><h3>CONNECTED ACCOUNTS</h3></div><StatusBadge status={`${Number(kickConnected)+Number(discordConnected)} CONNECTED`} /></div><div className="connection-row"><i className="connection-logo kick">K</i><p><strong>Kick</strong><small>{kickConnected ? "kainorth · Connected 12 Mar 2026" : "Connect Kick to sync watch activity"}</small></p><StatusBadge status={kickConnected ? "CONNECTED" : "NOT CONNECTED"} /><button type="button" onClick={() => setKickConnected((value) => !value)}>{kickConnected ? "DISCONNECT" : "CONNECT"}</button></div><div className="connection-row"><i className="connection-logo discord">D</i><p><strong>Discord</strong><small>{discordConnected ? "playerone · Connected 12 Mar 2026" : "Connect Discord to receive roles"}</small></p><StatusBadge status={discordConnected ? "CONNECTED" : "NOT CONNECTED"} /><button type="button" onClick={() => setDiscordConnected((value) => !value)}>{discordConnected ? "DISCONNECT" : "CONNECT"}</button></div></article><article className="account-panel"><div className="account-panel-head"><div><span className="product-kicker">SUPPORTED PLATFORM</span><h3>CASINO USERNAME</h3></div><StatusBadge status={casinoEditing ? "EDITING" : "VERIFIED"} /></div><div className="casino-link-card"><i className="connection-logo thrill">T</i><div><span>THRILL USERNAME</span>{casinoEditing ? <input value={casinoUsername} onChange={(event) => setCasinoUsername(event.target.value)} aria-label="Thrill username" /> : <strong>{casinoUsername}</strong>}<small>{casinoEditing ? "Enter the exact platform username." : "Verified · Last synced 8 minutes ago"}</small></div><button type="button" onClick={() => setCasinoEditing((value) => !value)}>{casinoEditing ? "SAVE & VERIFY" : "EDIT"}</button></div><div className="account-info-note"><i>i</i><p><strong>WHY LINK A USERNAME?</strong><span>It lets the production app map supported platform activity to your RIVL identity. This prototype does not perform verification.</span></p></div></article></div><aside className="account-aside"><article><span className="product-kicker">PROFILE STATUS</span><div className="completion-ring"><span>82<small>%</small></span></div><h3>ALMOST THERE.</h3><p>Link one more supported username to complete your profile.</p></article><article className="preference-card"><span className="product-kicker">NOTIFICATIONS</span>{[["RANK MOVEMENT",true],["REWARD UPDATES",true],["EVENT RESULTS",true],["STREAM LIVE",false]].map((item) => <label key={item[0]}><span>{item[0]}</span><input type="checkbox" defaultChecked={Boolean(item[1])} /><i /></label>)}</article></aside></div></section>
      )}
    </ProductShell>
  );
}
