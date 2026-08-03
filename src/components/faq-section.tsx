const faqs = [
  {
    question: "How do rewards connect to the leaderboard?",
    answer:
      "The leaderboard is the visibility layer. Campaigns and quests drive participation, and reward claiming sits after the campaign window.",
  },
  {
    question: "Why lead with rewards instead of the board?",
    answer:
      "That framing makes the site feel like a real campaign product first, with the leaderboard supporting competition instead of carrying the whole experience alone.",
  },
  {
    question: "Does this change the live board logic?",
    answer:
      "No. These additions are homepage and content sections only. The live board remains read-only and keeps the same data pipeline.",
  },
  {
    question: "Can more campaign pages be added later?",
    answer:
      "Yes. The site shell can keep growing with campaign pages, FAQ, Discord links, and reward explainers while the live board stays isolated.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="px-4 py-12 md:px-6 md:py-16">
      <div className="section-wrap section-shell">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="muted-label">FAQ</div>
            <h2 className="display-serif mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] md:text-5xl">
              Questions users will actually ask.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
            Keep the explanations calm and product-level. The live board can stay
            technically isolated while the UI around it becomes more premium.
          </p>
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
              <h3 className="mt-4 text-lg font-medium text-[var(--text-primary)]">
                {faq.question}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
