"use client";

import { useEffect, useState } from "react";

type PodiumPlayer = {
  rank: number;
  name: string;
  handle: string;
  xp: string;
  prize: string;
  initials: string;
  avatar: string;
  move: string;
};

type LeaderPlayer = {
  rank: number;
  name: string;
  handle: string;
  xp: number;
  movement: "up" | "down" | "same" | "new";
  places: number;
  reward: string;
  initials: string;
  avatar: string;
  streak: number;
};

const podium: PodiumPlayer[] = [
  {
    rank: 2,
    name: "Nova Vale",
    handle: "@novaspins",
    xp: "84,260",
    prize: "$2,500",
    initials: "NV",
    avatar: "avatar-violet",
    move: "+2",
  },
  {
    rank: 1,
    name: "Ace Rowe",
    handle: "@aceonair",
    xp: "96,840",
    prize: "$5,000",
    initials: "AR",
    avatar: "avatar-orange",
    move: "+1",
  },
  {
    rank: 3,
    name: "Milo Knox",
    handle: "@knoxlive",
    xp: "78,950",
    prize: "$1,500",
    initials: "MK",
    avatar: "avatar-cream",
    move: "—",
  },
];

const leaderboard: LeaderPlayer[] = [
  { rank: 4, name: "Zia Quinn", handle: "@ziaafterdark", xp: 71480, movement: "up", places: 3, reward: "$1,000", initials: "ZQ", avatar: "avatar-coral", streak: 12 },
  { rank: 5, name: "Dax Mercer", handle: "@daxplays", xp: 68120, movement: "down", places: 1, reward: "$750", initials: "DM", avatar: "avatar-blue", streak: 8 },
  { rank: 6, name: "Luna Bloom", handle: "@lunabloom", xp: 63750, movement: "new", places: 0, reward: "$600", initials: "LB", avatar: "avatar-pink", streak: 5 },
  { rank: 7, name: "Kai North", handle: "@kainorth", xp: 58930, movement: "up", places: 4, reward: "$450", initials: "KN", avatar: "avatar-green", streak: 17 },
  { rank: 8, name: "Rhea Stone", handle: "@rheastone", xp: 55480, movement: "same", places: 0, reward: "$300", initials: "RS", avatar: "avatar-violet", streak: 4 },
  { rank: 9, name: "Jett Rio", handle: "@jettrio", xp: 52160, movement: "up", places: 2, reward: "$250", initials: "JR", avatar: "avatar-orange", streak: 9 },
  { rank: 10, name: "Fable Fox", handle: "@fablefox", xp: 49840, movement: "down", places: 3, reward: "$200", initials: "FF", avatar: "avatar-cream", streak: 6 },
  { rank: 11, name: "Pixel Ray", handle: "@pixelray", xp: 46390, movement: "same", places: 0, reward: "$150", initials: "PR", avatar: "avatar-blue", streak: 3 },
  { rank: 12, name: "Nyx Wilder", handle: "@nyxwilder", xp: 44120, movement: "new", places: 0, reward: "$100", initials: "NW", avatar: "avatar-pink", streak: 2 },
];

const activities = [
  { initials: "K", title: "Kai jumped 4 places", meta: "Rank #7 · just now", tag: "↑ 4", tone: "positive" },
  { initials: "L", title: "Luna entered the board", meta: "Rank #6 · 1m ago", tag: "NEW", tone: "violet" },
  { initials: "N", title: "Nova unlocked High Roller", meta: "Epic badge · 3m ago", tag: "+800", tone: "orange" },
  { initials: "Z", title: "Zia completed Night Shift", meta: "Mission · 7m ago", tag: "+1.2K", tone: "positive" },
];

const storeItems = [
  { name: "$50 CASH TIP", type: "Instant drop", price: "8,500 XP", stock: "12 LEFT", art: "cash", symbol: "$" },
  { name: "VIP DISCORD ROLE", type: "30 day access", price: "4,200 XP", stock: "OPEN", art: "role", symbol: "V" },
  { name: "RIVL DROP KIT", type: "Limited merch", price: "12,000 XP", stock: "7 LEFT", art: "merch", symbol: "R" },
  { name: "MYSTERY BOOST", type: "XP multiplier", price: "6,800 XP", stock: "RARE", art: "boost", symbol: "×2" },
];

const achievements = [
  { name: "NIGHT SHIFT", rarity: "RARE", progress: 100, symbol: "NS", unlocked: true },
  { name: "HIGH ROLLER", rarity: "EPIC", progress: 100, symbol: "HR", unlocked: true },
  { name: "HOT STREAK", rarity: "LEGENDARY", progress: 72, symbol: "17", unlocked: false },
  { name: "FRONT ROW", rarity: "RARE", progress: 48, symbol: "01", unlocked: false },
];

function Logo() {
  return (
    <a className="brand" href="#top" aria-label="RIVL home">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>RIVL</span>
      <small>// LIVE</small>
    </a>
  );
}

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function Loader() {
  return (
    <div className="loader" aria-label="Loading RIVL">
      <div className="loader-glow" />
      <div className="loader-deck" aria-hidden="true">
        <div className="loader-card loader-card-back">
          <span>#03</span>
          <strong>78,950</strong>
        </div>
        <div className="loader-card loader-card-mid">
          <span>#02</span>
          <strong>84,260</strong>
        </div>
        <div className="loader-card loader-card-front">
          <span>#01</span>
          <strong>96,840 XP</strong>
          <i />
        </div>
        <div className="loader-chip">XP</div>
      </div>
      <div className="loader-wordmark">
        <span>RIVL</span>
        <small>BUILDING THE BOARD</small>
      </div>
      <div className="loader-track"><i /></div>
    </div>
  );
}

function PodiumCard({ player }: { player: PodiumPlayer }) {
  return (
    <article className={`podium-card rank-${player.rank}`} tabIndex={0}>
      <div className="rank-tab">
        <span>#{player.rank.toString().padStart(2, "0")}</span>
        <small>{player.move}</small>
      </div>
      {player.rank === 1 && (
        <div className="crown" aria-label="Current champion">
          <i />
          <i />
          <i />
        </div>
      )}
      <div className={`avatar ${player.avatar}`}>
        <span>{player.initials}</span>
        <i className="status-dot" />
      </div>
      <div className="podium-player">
        <h3>{player.name}</h3>
        <p>{player.handle}</p>
      </div>
      <div className="xp-block">
        <strong>{player.xp}</strong>
        <span>SEASON XP</span>
      </div>
      <div className="podium-prize">
        <span>LOCKED PRIZE</span>
        <strong>{player.prize}</strong>
      </div>
    </article>
  );
}

function Movement({ player }: { player: LeaderPlayer }) {
  if (player.movement === "new") return <span className="movement new">NEW</span>;
  if (player.movement === "same") return <span className="movement same">—</span>;
  return (
    <span className={`movement ${player.movement}`}>
      {player.movement === "up" ? "↑" : "↓"} {player.places}
    </span>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("Weekly");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("Kai North");
  const [profileTab, setProfileTab] = useState("Overview");
  const [feedError, setFeedError] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 2600);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredPlayers = leaderboard.filter((player) =>
    `${player.name} ${player.handle} ${player.rank}`.toLowerCase().includes(query.toLowerCase()),
  );

  const profilePlayer = leaderboard.find((player) => player.name === selectedPlayer) ?? leaderboard[3];

  const changePeriod = (nextPeriod: string) => {
    if (period === nextPeriod) return;
    setPeriod(nextPeriod);
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 520);
  };

  const showProfile = (name: string) => {
    setSelectedPlayer(name);
    window.setTimeout(() => document.querySelector("#profile")?.scrollIntoView({ behavior: "smooth", block: "center" }), 20);
  };

  return (
    <>
      {loading && <Loader />}
      <main id="top" className={`site-shell ${loading ? "is-loading" : "is-ready"}`}>
        <div className="page-noise" aria-hidden="true" />
        <div className="ambient-orbit orbit-one" aria-hidden="true" />
        <div className="ambient-orbit orbit-two" aria-hidden="true" />
        <div className="home-casino-suits" aria-hidden="true"><span>♠</span><span>♦</span><span>♣</span><span>♥</span><i>777</i></div>

        <header className="topbar">
          <Logo />
          <nav className={menuOpen ? "nav-links is-open" : "nav-links"} aria-label="Main navigation">
            <a className="active" href="/leaderboard">Leaderboard</a>
            <a href="/rewards">Rewards</a>
            <a href="/events">Events</a>
            <a href="/profile">Profile</a>
          </nav>
          <div className="nav-actions">
            <div className="live-pill"><i /> 18.4K WATCHING</div>
            <button className="nav-cta" type="button" onClick={() => document.querySelector("#my-rank")?.scrollIntoView({ behavior: "smooth" })}>MY RANK <ArrowIcon /></button>
            <button
              className="menu-button"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
              type="button"
            >
              <span />
              <span />
            </button>
          </div>
        </header>

        <div className="home-casino-rail" aria-label="Live RIVL floor status">
          <span><i>♠</i> LIVE TABLE <strong>SEASON 08</strong></span>
          <span><i className="red">♦</i> DROP POT <strong>1.2M XP</strong></span>
          <span><b>777</b> HOT WEEKEND <strong>×2 XP</strong></span>
          <span><i className="red">♥</i> GOLDEN DROP <strong>03 LEFT</strong></span>
        </div>

        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><i /> SEASON 08 · WEEK 03 <span>LIVE</span></div>
            <h1 id="hero-title">
              CLIMB
              <span>THE RANKS.</span>
            </h1>
            <p>Watch. Call it. Stack XP. Own the floor.</p>
            <div className="casino-mini-badges" aria-label="Current boosts"><span>♠ ACE STATUS</span><span>×2 HOT BOOST</span><span>777 DROP LIVE</span></div>
            <div className="hero-actions">
              <a className="primary-button" href="/leaderboard">FIND MY RANK <ArrowIcon /></a>
              <a className="text-button" href="/rewards"><span>VIEW REWARDS</span> ↓</a>
            </div>
            <div className="hero-meta">
              <div>
                <span>PRIZE POOL</span>
                <strong>$12,500</strong>
              </div>
              <div>
                <span>SEASON ENDS</span>
                <strong>04D : 17H : 32M</strong>
              </div>
            </div>
          </div>

          <div className="championship-stage" id="podium">
            <div className="casino-card-fan" aria-hidden="true"><span><b>A</b><i>♠</i></span><span><b>K</b><i>♦</i></span><span><b>Q</b><i>♣</i></span></div>
            <div className="stage-header">
              <div>
                <span className="stage-kicker">LIVE STANDINGS</span>
                <h2>THE FRONT THREE</h2>
              </div>
              <span className="sync-status"><i /> UPDATED 12s AGO</span>
            </div>

            <div className="podium-grid">
              {podium.map((player) => <PodiumCard key={player.rank} player={player} />)}
            </div>

            <div className="stage-ribbon">
              <span>3,284 PLAYERS</span>
              <i />
              <span>1.92M XP EARNED</span>
              <i />
              <span>NEXT REFRESH 00:48</span>
            </div>

            <div className="floating-alert alert-left">
              <span className="mini-avatar">K</span>
              <p><strong>Kai jumped 4 places</strong><small>just now</small></p>
              <b>↑ 4</b>
            </div>
            <div className="floating-chip chip-right"><span>+2,400</span><small>WATCH XP</small></div>
            <div className="jackpot-orbit-badge" aria-hidden="true"><span>777</span><small>HOT DROP</small></div>
          </div>
        </section>

        <div className="marquee" aria-label="Live platform updates">
          <div>
            <span>♠ DAILY MISSIONS RESET IN 02:14:08</span>
            <span>♦ LEGENDARY DROP CLAIMED BY NOVA</span>
            <span>777 DOUBLE XP LIVE THIS WEEKEND</span>
            <span>♣ 18,438 PLAYERS ON THE FLOOR</span>
            <span>♥ GOLDEN DROP · 03 TICKETS LEFT</span>
            <span>♠ DAILY MISSIONS RESET IN 02:14:08</span>
          </div>
        </div>

        <section className="board-section section-wrap" id="leaderboard" aria-labelledby="board-title">
          <div className="section-heading">
            <div className="section-index">01 <span>/ 05</span></div>
            <div>
              <span className="section-kicker">THE LIVE BOARD</span>
              <h2 id="board-title">EVERY PLACE<br /><em>COUNTS.</em></h2>
            </div>
            <p>One board. Thousands watching. Every minute moves the line.</p>
          </div>

          <div className="board-layout">
            <div className="leaderboard-panel">
              <div className="board-controls">
                <label className="search-box">
                  <span aria-hidden="true">⌕</span>
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search player or rank"
                    aria-label="Search leaderboard"
                  />
                  {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
                </label>
                <div className="period-control" aria-label="Leaderboard period">
                  {["Weekly", "Bi-weekly", "Monthly"].map((item) => (
                    <button
                      key={item}
                      className={period === item ? "active" : ""}
                      aria-pressed={period === item}
                      onClick={() => changePeriod(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="table-head" aria-hidden="true">
                <span>RANK / PLAYER</span>
                <span>MOVEMENT</span>
                <span>{period.toUpperCase()} XP</span>
                <span>REWARD</span>
              </div>

              <div className="leader-rows" aria-live="polite">
                {refreshing ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div className="skeleton-row" key={index}><i /><i /><i /><i /></div>
                  ))
                ) : filteredPlayers.length ? (
                  filteredPlayers.map((player) => (
                    <button className="leader-row" key={player.rank} type="button" onClick={() => showProfile(player.name)}>
                      <span className="row-rank">#{player.rank.toString().padStart(2, "0")}</span>
                      <span className={`row-avatar ${player.avatar}`}>{player.initials}<i /></span>
                      <span className="row-identity"><strong>{player.name}</strong><small>{player.handle} · {player.streak} day streak</small></span>
                      <Movement player={player} />
                      <span className="row-xp"><strong>{player.xp.toLocaleString()}</strong><i><b style={{ width: `${Math.round((player.xp / 96840) * 100)}%` }} /></i></span>
                      <span className="row-reward">{player.reward}</span>
                      <span className="row-arrow" aria-hidden="true">↗</span>
                    </button>
                  ))
                ) : (
                  <div className="empty-board">
                    <div className="empty-cards"><i /><i /><i /></div>
                    <strong>NO PLAYER FOUND</strong>
                    <p>Try a username, handle, or rank number.</p>
                    <button type="button" onClick={() => setQuery("")}>CLEAR SEARCH</button>
                  </div>
                )}
              </div>
            </div>

            <aside className="board-side">
              <div className="my-rank-card" id="my-rank">
                <div className="my-rank-top"><span>YOUR LIVE POSITION</span><i>SYNCED</i></div>
                <div className="my-rank-number"><small>#</small>14</div>
                <div className="my-rank-user"><span className="row-avatar avatar-coral">P1<i /></span><div><strong>PlayerOne</strong><small>48,210 XP</small></div></div>
                <div className="rank-gap"><span><b style={{ width: "68%" }} /></span><small>4,180 XP TO #13</small></div>
                <button type="button" onClick={() => showProfile("Kai North")}>VIEW MY PROFILE <ArrowIcon /></button>
              </div>

              <div className="activity-panel" id="activity">
                <div className="side-title"><div><i /> LIVE ACTIVITY</div><span>ALL</span></div>
                {feedError ? (
                  <div className="activity-error" role="status">
                    <div><i /><i /></div>
                    <strong>LIVE FEED PAUSED</strong>
                    <p>The signal dropped. Your rank and XP are safe.</p>
                    <button type="button" onClick={() => setFeedError(false)}>RECONNECT</button>
                  </div>
                ) : (
                  <>
                    <div className="activity-list">
                      {activities.map((activity) => (
                        <div className="activity-item" key={activity.title}>
                          <span className={`activity-avatar ${activity.tone}`}>{activity.initials}</span>
                          <p><strong>{activity.title}</strong><small>{activity.meta}</small></p>
                          <b className={activity.tone}>{activity.tag}</b>
                        </div>
                      ))}
                    </div>
                    <button className="ghost-link" type="button" onClick={() => setFeedError(true)}>VIEW FULL FEED <span>↓</span></button>
                  </>
                )}
              </div>
            </aside>
          </div>
        </section>

        <section className="prize-section" id="rewards" aria-labelledby="prize-title">
          <div className="prize-inner section-wrap">
            <div className="prize-copy">
              <span className="section-kicker dark">SEASON 08 PRIZE POOL</span>
              <h2 id="prize-title">$12.5K<br /><em>ON THE LINE.</em></h2>
              <p>Finish in the money. Unlock the vault. Spend the XP.</p>
              <div className="prize-deadline"><i /> FINAL SNAPSHOT · SUNDAY 23:59 UTC</div>
            </div>

            <div className="reward-deck" aria-label="Reward card stack">
              <div className="deck-card deck-third"><span>#03</span><strong>$1,500</strong></div>
              <div className="deck-card deck-second"><span>#02</span><strong>$2,500</strong></div>
              <div className="deck-card deck-first">
                <div><span>CHAMPION DROP</span><small>SEASON 08</small></div>
                <strong>$5,000</strong>
                <div className="deck-token">01</div>
              </div>
            </div>

            <div className="reward-tiers">
              <div><span>01</span><p><small>CHAMPION</small><strong>$5,000</strong></p><i>40%</i></div>
              <div><span>02</span><p><small>RUNNER UP</small><strong>$2,500</strong></p><i>20%</i></div>
              <div><span>03</span><p><small>THIRD PLACE</small><strong>$1,500</strong></p><i>12%</i></div>
              <div><span>04—12</span><p><small>BOARD FINISHERS</small><strong>$3,500</strong></p><i>28%</i></div>
            </div>
          </div>
        </section>

        <section className="store-section" aria-labelledby="store-title">
          <div className="section-wrap">
            <div className="store-heading">
              <div>
                <span className="section-kicker dark">THE XP VAULT</span>
                <h2 id="store-title">EARN IT.<br /><em>SPEND IT.</em></h2>
              </div>
              <p>XP is more than a number. Trade it for drops, access, status and live rewards.</p>
              <button type="button" onClick={() => { window.location.href = "/rewards"; }}>OPEN FULL STORE <ArrowIcon /></button>
            </div>

            <div className="store-grid">
              {storeItems.map((item, index) => (
                <article className="store-card" key={item.name} tabIndex={0}>
                  <div className={`store-art ${item.art}`}>
                    <div className="art-grid" />
                    <span>{item.symbol}</span>
                    <small>0{index + 1}</small>
                  </div>
                  <div className="store-card-meta"><span>{item.type}</span><i>{item.stock}</i></div>
                  <h3>{item.name}</h3>
                  <div className="store-price"><strong>{item.price}</strong><button type="button" aria-label={`View ${item.name}`}>↗</button></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="progression-section section-wrap" aria-labelledby="progress-title">
          <div className="section-heading progression-heading">
            <div className="section-index">04 <span>/ 05</span></div>
            <div>
              <span className="section-kicker">ACHIEVEMENTS</span>
              <h2 id="progress-title">PROVE IT.<br /><em>KEEP IT.</em></h2>
            </div>
            <p>Milestones that travel with your streaming identity.</p>
          </div>

          <div className="achievement-grid">
            {achievements.map((achievement) => (
              <article className={`achievement-card ${achievement.unlocked ? "unlocked" : "locked"}`} key={achievement.name}>
                <div className="badge-shell"><i /><span>{achievement.symbol}</span><i /></div>
                <div className="achievement-info">
                  <small>{achievement.rarity}</small>
                  <h3>{achievement.name}</h3>
                  <div className="achievement-progress"><i><b style={{ width: `${achievement.progress}%` }} /></i><span>{achievement.progress}%</span></div>
                </div>
                <b className="achievement-state">{achievement.unlocked ? "UNLOCKED" : "IN PROGRESS"}</b>
              </article>
            ))}
          </div>
        </section>

        <section className="profile-section section-wrap" id="profile" aria-labelledby="profile-title">
          <div className="profile-frame">
            <div className="profile-cover">
              <div className="profile-broadcast"><i /> LIVE IDENTITY</div>
              <div className="profile-monogram">{profilePlayer.initials}</div>
              <span className="profile-rank-watermark">#{profilePlayer.rank.toString().padStart(2, "0")}</span>
            </div>
            <div className="profile-body">
              <div className="profile-head">
                <div className={`profile-avatar ${profilePlayer.avatar}`}>{profilePlayer.initials}<i /></div>
                <div><span className="section-kicker">PLAYER PROFILE</span><h2 id="profile-title">{profilePlayer.name}</h2><p>{profilePlayer.handle}</p></div>
                <button type="button">FOLLOW PLAYER <span>＋</span></button>
              </div>

              <div className="profile-tabs" role="tablist" aria-label="Profile sections">
                {["Overview", "Achievements", "Activity", "Connections"].map((tab) => (
                  <button key={tab} role="tab" aria-selected={profileTab === tab} className={profileTab === tab ? "active" : ""} onClick={() => setProfileTab(tab)} type="button">{tab}</button>
                ))}
              </div>

              <div className="profile-content" key={profileTab}>
                {profileTab === "Overview" && (
                  <>
                    <div className="profile-stats">
                      <div><span>CURRENT RANK</span><strong>#{profilePlayer.rank.toString().padStart(2, "0")}</strong><small>↑ 4 THIS WEEK</small></div>
                      <div><span>SEASON XP</span><strong>{profilePlayer.xp.toLocaleString()}</strong><small>TOP 1.8%</small></div>
                      <div><span>WATCH STREAK</span><strong>{profilePlayer.streak} DAYS</strong><small>PERSONAL BEST</small></div>
                    </div>
                    <div className="profile-lower">
                      <div className="season-track"><div><span>SEASON LEVEL 27</span><strong>2,420 / 3,000 XP</strong></div><i><b /></i><small>NEXT: 500 XP BOOST</small></div>
                      <div className="connected-accounts"><span>CONNECTED</span><div><i>K</i><p><strong>Kick</strong><small>kainorth</small></p><b>✓</b></div><div><i>D</i><p><strong>Discord</strong><small>kai.north</small></p><b>✓</b></div></div>
                    </div>
                  </>
                )}
                {profileTab === "Achievements" && <div className="profile-message"><span>02</span><strong>BADGES UNLOCKED</strong><p>Night Shift and High Roller are pinned to this identity.</p></div>}
                {profileTab === "Activity" && <div className="profile-message"><span>17</span><strong>DAY WATCH STREAK</strong><p>Latest movement: climbed four places in under twelve hours.</p></div>}
                {profileTab === "Connections" && <div className="profile-message"><span>02</span><strong>ACCOUNTS CONNECTED</strong><p>Kick and Discord are verified and syncing activity.</p></div>}
              </div>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div className="footer-top section-wrap">
            <div><Logo /><p>THE BOARD IS LIVE.<br />WHERE DO YOU RANK?</p></div>
            <a className="footer-cta" href="/leaderboard"><span>ENTER<br />THE BOARD</span><ArrowIcon /></a>
          </div>
          <div className="footer-bottom section-wrap"><span>RIVL © 2026</span><nav aria-label="Footer navigation"><a href="/leaderboard">BOARD</a><a href="/rewards">REWARDS</a><a href="/events">EVENTS</a><a href="/profile">PROFILE</a><a href="/admin">ADMIN</a></nav><span>BUILT FOR THE LIVE</span></div>
        </footer>
      </main>
    </>
  );
}
