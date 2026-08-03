import Link from "next/link";
import { routeHubCards } from "@/lib/site-content";

export default function HomeRouteHub() {
  return (
    <section className="px-4 py-12 md:px-6 md:py-16">
      <div className="section-wrap section-shell">
        <div className="grid gap-12 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="hero-chip inline-flex items-center rounded-full px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em]">
              Route structure
            </div>
            <h2 className="display-serif mt-6 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] md:text-4xl">
              The site now has real destinations around the live board.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              Instead of treating the leaderboard as the whole product, the app
              now fans out into the same public-facing feature areas the reference
              site exposes: rewards pages, stream pages, store, help, and legal.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {routeHubCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group border-l border-[rgba(255,216,166,0.18)] pl-5 transition-transform hover:translate-x-1"
                >
                  <div className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--shib-muted)]">
                    {card.eyebrow}
                  </div>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] transition-colors group-hover:text-[var(--shib-fur-bright)]">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    {card.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="xl:pt-14">
            <div className="muted-label">Read-only guarantee</div>
            <h3 className="display-serif mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
              The leaderboard engine stays isolated.
            </h3>
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
              All of the new pages are static UI surfaces around the board. The
              live data route, provider selection, caching, polling, search, sort,
              and pagination behavior remain exactly where they already were.
            </p>

            <div className="mt-10 space-y-5">
              <div className="border-b border-[rgba(255,216,166,0.12)] pb-4">
                <span className="leaderboard-stat-card__label">Provider flow</span>
                <span className="leaderboard-stat-card__value leaderboard-stat-card__value--small">
                  Unchanged server-side route
                </span>
              </div>
              <div className="border-b border-[rgba(255,216,166,0.12)] pb-4">
                <span className="leaderboard-stat-card__label">Client mode</span>
                <span className="leaderboard-stat-card__value leaderboard-stat-card__value--small">
                  Read-only live fetch
                </span>
              </div>
              <div className="border-b border-[rgba(255,216,166,0.12)] pb-4">
                <span className="leaderboard-stat-card__label">Site style</span>
                <span className="leaderboard-stat-card__value leaderboard-stat-card__value--small">
                  Same premium visual language
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
