import Link from "next/link";
import { routeHubCards } from "@/lib/site-content";

export default function HomeRouteHub() {
  const [featuredCard, ...sideCards] = routeHubCards;

  return (
    <section className="product-section casino-lobby-section">
      <div className="product-section-title casino-section-title">
        <div>
          <span className="product-kicker">Casino Lobby</span>
          <h2>Pick a table.</h2>
        </div>
        <p className="casino-section-copy">
          Jump from live standings into missions, hunts, and fast support lanes.
        </p>
        <div className="casino-section-pulse" aria-hidden="true">
          <span>♠</span>
          <span>♦</span>
          <span>♣</span>
        </div>
      </div>

      <div className="casino-lobby-grid">
        {featuredCard ? (
          <Link className="casino-feature-table" href={featuredCard.href}>
            <span className="casino-table-badge">LIVE TABLE</span>
            <div className="casino-table-orbit" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <strong>{featuredCard.title}</strong>
            <small>{featuredCard.description}</small>
            <div className="casino-feature-stats" aria-hidden="true">
              <span>TOP 3</span>
              <span>60S SYNC</span>
              <span>XP RUSH</span>
            </div>
            <i aria-hidden="true">777</i>
            <b>
              PLAY NOW
              <span>↗</span>
            </b>
          </Link>
        ) : null}

        <div className="casino-table-stack">
          {sideCards.map((card, index) => (
            <Link className="casino-mini-table" href={card.href} key={card.href}>
              <span>{`0${index + 2}`}</span>
              <div>
                <small>{card.eyebrow}</small>
                <strong>{card.title}</strong>
              </div>
              <b>{card.description}</b>
              <em aria-hidden="true">↗</em>
            </Link>
          ))}
        </div>

        <div className="casino-side-meter" aria-label="Lobby status">
          <span>HEAT</span>
          <strong>97</strong>
          <i><b /></i>
          <small>LIVE</small>
        </div>

        <div className="casino-quick-actions" aria-label="Quick actions">
          <Link href="/challenges">MISSIONS</Link>
          <Link href="/wager-raffles">RAFFLES</Link>
          <Link href="/tournaments">EVENTS</Link>
        </div>
      </div>
    </section>
  );
}
