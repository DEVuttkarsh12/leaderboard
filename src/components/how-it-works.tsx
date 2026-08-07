const steps = [
  {
    title: "Enter the round",
    description:
      "Start from the active campaign or event route and move into the supported participation flow.",
  },
  {
    title: "Climb the board",
    description:
      "Progress through real score accumulation while the public board reflects the live order in real time.",
  },
  {
    title: "Return for rewards",
    description:
      "Supporting routes now carry the tension, progression, and prize framing around the read-only live board.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="product-section">
      <div className="product-section-title">
        <div>
          <span className="product-kicker">HOW IT WORKS</span>
          <h2>A TIGHTER COMPETITION LOOP.</h2>
        </div>
        <p className="design-section-copy">
          The experience should make progression obvious: enter, compete, and
          return without burying the live board beneath generic product chrome.
        </p>
      </div>

      <div className="design-card-grid design-card-grid--3">
        {steps.map((step, index) => (
          <article className="design-card" key={step.title}>
            <div className="design-card__top">
              <span className="design-card__index">{`0${index + 1}`}</span>
            </div>
            <span className="product-kicker">COMPETITION LOOP</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
