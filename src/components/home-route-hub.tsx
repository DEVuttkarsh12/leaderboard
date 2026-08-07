import Link from "next/link";
import { routeHubCards } from "@/lib/site-content";
import TextRevealScroll from "./text-reveal-scroll";

export default function HomeRouteHub() {
  return (
    <section className="px-4 py-12 md:px-6 md:py-16">
      <div className="section-wrap section-shell">
        <div className="grid gap-12 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="hero-chip inline-flex items-center rounded-full px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em]">
              Ecosystem map
            </div>
            <TextRevealScroll
              as="h2"
              revealMode="chars"
              className="display-serif mt-6 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] md:text-4xl"
            >
              The board pulls attention. The surrounding routes keep it feeling like a real product.
            </TextRevealScroll>
            <TextRevealScroll
              as="p"
              revealMode="words"
              className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]"
            >
              RankBoard now has campaign routes, event surfaces, support pages,
              and store architecture so the leaderboard no longer has to carry
              the entire experience by itself.
            </TextRevealScroll>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {routeHubCards.map((card, index) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="home-route-link group"
                >
                  <div className="home-route-link__index">
                    {(index + 1).toString().padStart(2, "0")}
                  </div>
                  <div>
                    <div className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                      {card.eyebrow}
                    </div>
                    <TextRevealScroll
                      as="h3"
                      revealMode="chars"
                      className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-strong)]"
                    >
                      {card.title}
                    </TextRevealScroll>
                    <TextRevealScroll
                      as="p"
                      revealMode="words"
                      className="mt-2 text-sm leading-6 text-[var(--text-secondary)]"
                    >
                      {card.description}
                    </TextRevealScroll>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="xl:pt-14">
            <div className="muted-label">Protected core</div>
            <TextRevealScroll
              as="h3"
              revealMode="chars"
              className="display-serif mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]"
            >
              The leaderboard engine stays isolated.
            </TextRevealScroll>
            <TextRevealScroll
              as="p"
              revealMode="words"
              className="mt-4 text-sm leading-7 text-[var(--text-secondary)]"
            >
              The surrounding routes are presentation work. The live data route,
              provider selection, caching, polling, search, sort, and pagination
              all remain where they already were.
            </TextRevealScroll>

            <div className="home-route-meta mt-10 space-y-5">
              <div className="home-route-meta__item">
                <span className="leaderboard-stat-card__label">Provider flow</span>
                <span className="leaderboard-stat-card__value leaderboard-stat-card__value--small">
                  Unchanged server-side route
                </span>
              </div>
              <div className="home-route-meta__item">
                <span className="leaderboard-stat-card__label">Client mode</span>
                <span className="leaderboard-stat-card__value leaderboard-stat-card__value--small">
                  Read-only live fetch
                </span>
              </div>
              <div className="home-route-meta__item">
                <span className="leaderboard-stat-card__label">Site style</span>
                <span className="leaderboard-stat-card__value leaderboard-stat-card__value--small">
                  Sharper product shell
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
