const faqs = [
  {
    question: "How do rewards connect to the leaderboard?",
    answer:
      "The board brings the heat. Rewards keep people chasing.",
  },
  {
    question: "Did the redesign change live board logic?",
    answer:
      "No. The board still behaves like the board.",
  },
  {
    question: "Does the board still update normally?",
    answer:
      "Yes. The ranks keep moving.",
  },
  {
    question: "What still needs backend work later?",
    answer:
      "Claims, accounts, and deeper reward loops.",
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
          Fast answers. No essay energy.
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
