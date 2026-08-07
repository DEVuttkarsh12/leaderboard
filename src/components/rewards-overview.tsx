import TextRevealScroll from "./text-reveal-scroll";

const items = [
  {
    title: "Campaign framing",
    description:
      "Lead with why the round matters before sending people into a wall of rows and numbers.",
  },
  {
    title: "Quest-driven participation",
    description:
      "Give the platform room for daily missions, streaks, and event quests without crowding the live board.",
  },
  {
    title: "Reward architecture",
    description:
      "Store, claims, and account unlocks can plug into these routes later when backend support exists.",
  },
  {
    title: "Community loop",
    description:
      "Keep stream status, campaign updates, and support surfaces visible so the experience feels alive beyond the standings table.",
  },
];

export default function RewardsOverview() {
  return (
    <section id="rewards" className="px-4 py-12 md:px-6 md:py-16">
      <div className="section-wrap section-shell">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="muted-label">Rewards Overview</div>
            <TextRevealScroll
              as="h2"
              revealMode="chars"
              className="display-serif mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] md:text-5xl"
            >
              Built around competition, rewards, and return visits.
            </TextRevealScroll>
          </div>
          <TextRevealScroll
            as="div"
            revealMode="words"
            className="max-w-sm text-sm leading-6 text-[var(--text-secondary)]"
          >
            The homepage leads with energy, progression, and live board context
            instead of dropping people into a raw data table.
          </TextRevealScroll>
        </div>

        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <div className="flex flex-col justify-between md:row-span-2">
            <div>
              <div className="hero-chip inline-flex items-center rounded-full px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em]">
                Premium reward framing
              </div>
              <TextRevealScroll
                as="h3"
                revealMode="chars"
                className="display-serif mt-6 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] md:text-4xl"
              >
                Let the product story pull people in, then let the board sharpen the tension.
              </TextRevealScroll>
              <TextRevealScroll
                as="p"
                revealMode="words"
                className="mt-4 max-w-md text-sm leading-7 text-[var(--text-secondary)]"
              >
                The surrounding product story gives rankings context instead of
                making the leaderboard feel like an isolated admin table.
              </TextRevealScroll>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              <div className="border-l border-[rgba(255,216,166,0.18)] pl-4">
                <div className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--shib-muted)]">
                  Campaign
                </div>
                <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                  Quest-ready
                </div>
              </div>
              <div className="border-l border-[rgba(255,216,166,0.18)] pl-4">
                <div className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--shib-muted)]">
                  Status
                </div>
                <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                  Always visible
                </div>
              </div>
              <div className="border-l border-[rgba(255,216,166,0.18)] pl-4">
                <div className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--shib-muted)]">
                  Outcome
                </div>
                <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                  Stronger intent
                </div>
              </div>
            </div>
          </div>

          {items.map((item) => (
            <div key={item.title} className="border-t border-[rgba(255,216,166,0.12)] pt-6">
              <div className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--shib-muted)]">
                Detail
              </div>
              <TextRevealScroll
                as="h3"
                revealMode="chars"
                className="mt-4 text-xl font-medium text-[var(--text-primary)]"
              >
                {item.title}
              </TextRevealScroll>
              <TextRevealScroll
                as="p"
                revealMode="words"
                className="mt-3 text-sm leading-6 text-[var(--text-secondary)]"
              >
                {item.description}
              </TextRevealScroll>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
