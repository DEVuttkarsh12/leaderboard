import TextRevealScroll from "./text-reveal-scroll";

const faqs = [
  {
    question: "How do rewards connect to the leaderboard?",
    answer:
      "The leaderboard is the visibility layer. Campaigns and quests drive participation, and reward claiming can sit after the campaign window once backend support exists.",
  },
  {
    question: "Why lead with rewards instead of the board?",
    answer:
      "That framing makes the site feel like a real campaign product, with the leaderboard supporting competition instead of carrying the whole experience alone.",
  },
  {
    question: "Does this change the live board logic?",
    answer:
      "No. These additions are presentation and routing upgrades only. The live board remains read-only and keeps the same data pipeline.",
  },
  {
    question: "What still needs backend work?",
    answer:
      "Account linking, live activity, reward redemption, claims, and prediction features still need dedicated backend logic. The shell now has clean places for those systems to plug in later.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="px-4 py-12 md:px-6 md:py-16">
      <div className="section-wrap section-shell">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="muted-label">FAQ</div>
            <TextRevealScroll
              as="h2"
              revealMode="chars"
              className="display-serif mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] md:text-5xl"
            >
              The questions the product should answer quickly.
            </TextRevealScroll>
          </div>
          <TextRevealScroll
            as="p"
            revealMode="words"
            className="max-w-sm text-sm leading-6 text-[var(--text-secondary)]"
          >
            Keep the explanations calm and product-level. The live board stays
            technically isolated while the UI around it becomes more premium.
          </TextRevealScroll>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {faqs.map((faq) => (
            <article
              key={faq.question}
              className="border-t border-[rgba(255,216,166,0.12)] pt-6"
            >
              <div className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                FAQ
              </div>
              <TextRevealScroll
                as="h3"
                revealMode="chars"
                className="mt-4 text-lg font-medium text-[var(--text-primary)]"
              >
                {faq.question}
              </TextRevealScroll>
              <TextRevealScroll
                as="p"
                revealMode="words"
                className="mt-3 text-sm leading-6 text-[var(--text-secondary)]"
              >
                {faq.answer}
              </TextRevealScroll>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
