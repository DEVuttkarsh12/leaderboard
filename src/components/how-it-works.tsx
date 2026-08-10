const steps = [
  {
    title: "Tap In",
    description:
      "Join.",
  },
  {
    title: "Climb",
    description:
      "Push.",
  },
  {
    title: "Cash Heat",
    description:
      "Collect.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="product-section">
      <div className="product-section-title">
        <div>
          <span className="product-kicker">HOW IT WORKS</span>
          <h2>Three moves.</h2>
        </div>
        <p className="design-section-copy">
          Play. Rise. Claim.
        </p>
      </div>

      <div className="design-card-grid design-card-grid--3">
        {steps.map((step, index) => (
          <article className="design-card" key={step.title}>
            <div className="design-card__top">
              <span className="design-card__index">{`0${index + 1}`}</span>
            </div>
            <span className="product-kicker">PLAY LOOP</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
