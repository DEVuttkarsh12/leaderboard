const faqs = [
  {
    question: "How do rewards connect to the leaderboard?",
    answer:
      "The leaderboard is still the visibility layer. Campaigns and quests drive participation, while supporting routes frame the broader product loop.",
  },
  {
    question: "Did the redesign change live board logic?",
    answer:
      "No. The new work changes presentation, layout, and interaction patterns while the real data path and ranking engine remain intact.",
  },
  {
    question: "Is the data still read-only?",
    answer:
      "Yes. The browser continues to read through the existing app route and no write methods were introduced for the leaderboard flow.",
  },
  {
    question: "What still needs backend work later?",
    answer:
      "Reward redemption, account linking, deeper event logic, and claims still need dedicated backend support when you choose to add them.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="product-section">
      <div className="product-section-title">
        <div>
          <span className="product-kicker">FAQ</span>
          <h2>ANSWER THE IMPORTANT QUESTIONS FAST.</h2>
        </div>
        <p className="design-section-copy">
          Keep the explanations product-level and direct. The live board stays
          technically isolated while the rest of the site becomes more premium.
        </p>
      </div>

      <div className="design-card-grid design-card-grid--2">
        {faqs.map((faq, index) => (
          <article className="design-card" key={faq.question}>
            <div className="design-card__top">
              <span className="design-card__index">{`0${index + 1}`}</span>
            </div>
            <span className="product-kicker">FAQ</span>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
