const items = [
  {
    title: "Monthly reward pool",
    description:
      "Show the headline reward number early so users understand the value of the active campaign immediately.",
  },
  {
    title: "Quest-driven participation",
    description:
      "Give users a reason to keep coming back with campaign objectives that sit between signup and leaderboard placement.",
  },
  {
    title: "Cross-site campaigns",
    description:
      "Treat the homepage like a shared rewards destination instead of a single isolated leaderboard page.",
  },
  {
    title: "Community loop",
    description:
      "Keep Discord, campaign updates, and claiming flows visible so the platform feels active beyond the rankings table.",
  },
];

export default function RewardsOverview() {
  return (
    <section id="rewards" className="px-4 py-12 md:px-6 md:py-16">
      <div className="section-wrap section-shell">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="muted-label">Rewards Overview</div>
            <h2 className="display-serif mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] md:text-5xl">
              Built around rewards, not just rankings.
            </h2>
          </div>
          <div className="max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
            The homepage now leads with campaign value, questing, and participation
            instead of dropping users straight into a raw leaderboard view.
          </div>
        </div>

        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <div className="flex flex-col justify-between md:row-span-2">
            <div>
              <div className="hero-chip inline-flex items-center rounded-full px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em]">
                Premium reward framing
              </div>
              <h3 className="display-serif mt-6 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] md:text-4xl">
                Lead with the reason to care, then let the board amplify competition.
              </h3>
              <p className="mt-4 max-w-md text-sm leading-7 text-[var(--text-secondary)]">
                The surrounding product story gives the rankings context instead of
                treating the leaderboard like a lonely admin table.
              </p>
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
                  Better intent
                </div>
              </div>
            </div>
          </div>

          {items.map((item) => (
            <div key={item.title} className="border-t border-[rgba(255,216,166,0.12)] pt-6">
              <div className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--shib-muted)]">
                Detail
              </div>
              <h3 className="mt-4 text-xl font-medium text-[var(--text-primary)]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
