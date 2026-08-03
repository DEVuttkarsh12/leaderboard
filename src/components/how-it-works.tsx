import { ArrowRight, Trophy, WalletCards } from "lucide-react";

const steps = [
  {
    icon: ArrowRight,
    title: "Join a campaign",
    description:
      "Start from the active reward campaign and move into the supported play or participation flow.",
  },
  {
    icon: Trophy,
    title: "Climb the board",
    description:
      "Progress through quests and score accumulation while the public board reflects the live ordering.",
  },
  {
    icon: WalletCards,
    title: "Claim rewards",
    description:
      "Once a campaign closes, the reward layer becomes the destination instead of the leaderboard itself.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-12 md:px-6 md:py-16">
      <div className="section-wrap section-shell">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="muted-label">How It Works</div>
            <h2 className="display-serif mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] md:text-5xl">
              A cleaner rewards flow.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
            The UX should make progression feel obvious: enter, compete, and claim
            without burying the live board beneath generic dashboard chrome.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={step.title}
                className="group border-t border-[rgba(255,216,166,0.12)] pt-6 transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(255,216,166,0.18)] text-[var(--shib-fur-bright)] transition-transform duration-300 group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium text-[var(--text-muted)]">
                    0{index + 1}
                  </div>
                </div>
                <h3 className="mt-6 text-xl font-medium text-[var(--text-primary)]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
