"use client";

import { useState } from "react";
import { notifications, Player } from "../product-data";

export type ProductRoute = "home" | "leaderboard" | "rewards" | "events" | "profile" | "admin";

const links: Array<{ key: ProductRoute; label: string; href: string }> = [
  { key: "home", label: "Home", href: "/" },
  { key: "leaderboard", label: "Leaderboard", href: "/leaderboard" },
  { key: "rewards", label: "Rewards", href: "/rewards" },
  { key: "events", label: "Events", href: "/events" },
  { key: "profile", label: "Profile", href: "/profile" },
];

export function ProductLogo() {
  return (
    <a className="p-brand" href="/" aria-label="RIVL home">
      <span className="p-brand-mark" aria-hidden="true"><i /><i /><i /></span>
      <span>RIVL</span>
      <small>// LIVE</small>
    </a>
  );
}

export function ProductShell({ active, children, admin = false }: { active: ProductRoute; children: React.ReactNode; admin?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [readAll, setReadAll] = useState(false);

  return (
    <div className={`product-page${admin ? " admin-product" : ""}`}>
      <div className="casino-suit-cloud" aria-hidden="true"><span>♠</span><span>♦</span><span>♣</span><span>♥</span><i>777</i></div>
      <div className="product-noise" aria-hidden="true" />
      <header className="product-header">
        <ProductLogo />
        <nav className={`product-nav${menuOpen ? " open" : ""}`} aria-label="Product navigation">
          {links.map((link) => (
            <a key={link.key} className={active === link.key ? "active" : ""} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</a>
          ))}
        </nav>
        <div className="product-actions">
          <span className="product-live"><i /> 18.4K LIVE</span>
          <button className="notification-trigger" type="button" aria-label="Open notifications" onClick={() => { setNotificationsOpen(true); setAccountOpen(false); }}>
            <span>◇</span><b>{readAll ? 0 : 3}</b>
          </button>
          <div className="account-wrap">
            <button className="account-trigger" type="button" aria-expanded={accountOpen} onClick={() => { setAccountOpen((value) => !value); setNotificationsOpen(false); }}>
              <span className="mini-player tone-coral">P1<i /></span>
              <span><strong>PLAYERONE</strong><small>38,210 XP</small></span>
              <b>⌄</b>
            </button>
            {accountOpen && (
              <div className="account-menu">
                <div><span className="mini-player tone-coral">P1<i /></span><p><strong>PlayerOne</strong><small>Rank #14 · Level 27</small></p></div>
                <a href="/profile">MY PROFILE <span>↗</span></a>
                <a href="/profile?tab=account">CONNECTED ACCOUNTS <span>↗</span></a>
                <a href="/admin">ADMIN CONSOLE <span>↗</span></a>
                <button type="button">SIGN OUT <span>→</span></button>
              </div>
            )}
          </div>
          <button className="product-menu" type="button" aria-label="Toggle product navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><i /><i /></button>
        </div>
      </header>

      <div className="casino-status-strip" aria-label="Live RIVL floor status">
        <div>
          <span><i>♠</i> LIVE TABLE <strong>SEASON 08</strong></span>
          <span><i className="red">♦</i> DROP POT <strong>1.2M XP</strong></span>
          <span><i>♣</i> HOT STREAK <strong>×7</strong></span>
          <span><i className="red">♥</i> GOLDEN DROP <strong>03 LEFT</strong></span>
          <span><b>777</b> WEEKEND BOOST <strong>×2 XP</strong></span>
        </div>
      </div>

      {notificationsOpen && (
        <>
          <button className="drawer-backdrop" aria-label="Close notifications" type="button" onClick={() => setNotificationsOpen(false)} />
          <aside className="notification-drawer" aria-label="Notifications">
            <div className="drawer-head"><div><span className="product-kicker">SIGNAL CENTER</span><h2>NOTIFICATIONS</h2></div><button type="button" onClick={() => setNotificationsOpen(false)}>×</button></div>
            <div className="drawer-summary"><span>{readAll ? "ALL CAUGHT UP" : "3 UNREAD"}</span><button type="button" onClick={() => setReadAll(true)}>MARK ALL READ</button></div>
            <div className="notification-list">
              {notifications.map((item, index) => (
                <article className={`${item.unread && !readAll ? "unread" : ""}`} key={item.title}>
                  <span className={`notice-icon ${item.kind}`}>{index + 1 < 10 ? `0${index + 1}` : index + 1}</span>
                  <div><strong>{item.title}</strong><p>{item.body}</p><small>{item.time} AGO</small></div>
                  {item.unread && !readAll && <i />}
                </article>
              ))}
            </div>
            <div className="drawer-empty"><i /><span>Older notifications appear here.</span></div>
          </aside>
        </>
      )}

      <main className="product-main">{children}</main>

      <footer className="product-footer">
        <div><ProductLogo /><p>Watch. Call it. Stack XP. Own the floor.</p></div>
        <nav aria-label="Footer product navigation">{links.slice(1).map((link) => <a href={link.href} key={link.key}>{link.label}</a>)}<a href="/admin">Admin</a></nav>
        <span>RIVL LIVE FLOOR · SEASON 08 · 2026</span>
      </footer>
    </div>
  );
}

export function PageIntro({ index, eyebrow, title, accent, description, aside }: { index: string; eyebrow: string; title: string; accent: string; description: string; aside?: React.ReactNode }) {
  return (
    <section className="product-intro">
      <div className="intro-index">{index}<span>/05</span></div>
      <div><span className="product-kicker">{eyebrow}</span><h1>{title}<em>{accent}</em></h1></div>
      <div className="intro-aside">{aside ?? <p>{description}</p>}</div>
    </section>
  );
}

export function PlayerAvatar({ player, size = "medium" }: { player: Pick<Player, "initials" | "tone" | "online">; size?: "small" | "medium" | "large" }) {
  return <span className={`product-avatar ${size} tone-${player.tone}`}>{player.initials}{player.online && <i />}</span>;
}

export function MovementBadge({ movement, places }: Pick<Player, "movement" | "places">) {
  if (movement === "new") return <span className="product-movement new">NEW</span>;
  if (movement === "same") return <span className="product-movement same">—</span>;
  return <span className={`product-movement ${movement}`}>{movement === "up" ? "↑" : "↓"} {places}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>;
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return <div className="product-section-title"><div><span className="product-kicker">{eyebrow}</span><h2>{title}</h2></div>{action}</div>;
}
