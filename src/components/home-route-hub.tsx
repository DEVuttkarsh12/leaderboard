import Link from "next/link";
import { routeHubCards } from "@/lib/site-content";

export default function HomeRouteHub() {
  return (
    <section className="product-section">
      <div className="product-section-title">
        <div>
          <span className="product-kicker">ECOSYSTEM MAP</span>
          <h2>THE FLOOR IS BIGGER THAN THE BOARD.</h2>
        </div>
        <p className="design-section-copy">
          The live leaderboard remains the functional core, but the surrounding
          routes now feel like one connected rewards product instead of loose
          supporting pages.
        </p>
      </div>

      <div className="design-card-grid design-card-grid--4">
        {routeHubCards.map((card, index) => (
          <article className="design-card" key={card.href}>
            <div className="design-card__top">
              <span className="design-card__index">{`0${index + 1}`}</span>
            </div>
            <span className="product-kicker">{card.eyebrow}</span>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <div className="design-card__footer">
              <small>CONNECTED ROUTE</small>
              <Link href={card.href}>
                OPEN
                <span>↗</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
