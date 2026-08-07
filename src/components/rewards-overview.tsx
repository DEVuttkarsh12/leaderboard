const items = [
  {
    title: "Campaign framing",
    description:
      "Lead with why the round matters before sending people into raw rows and numbers.",
  },
  {
    title: "Quest-driven participation",
    description:
      "Give the platform space for daily missions, streaks, and event quests without crowding the live board.",
  },
  {
    title: "Reward architecture",
    description:
      "Store, claims, and unlock surfaces can plug into these routes later without touching the leaderboard provider.",
  },
  {
    title: "Community loop",
    description:
      "Keep stream status, campaign updates, and support surfaces visible so the experience feels alive beyond the rankings.",
  },
];

export default function RewardsOverview() {
  return (
    <section id="rewards" className="product-section">
      <div className="product-section-title">
        <div>
          <span className="product-kicker">REWARDS OVERVIEW</span>
          <h2>BUILT FOR RETURN VISITS.</h2>
        </div>
        <p className="design-section-copy">
          The site now reads like a rewards floor with a live competitive core,
          not a generic dashboard wrapped around a table.
        </p>
      </div>

      <div className="design-card-grid design-card-grid--4">
        {items.map((item, index) => (
          <article className="design-card" key={item.title}>
            <div className="design-card__top">
              <span className="design-card__index">{`0${index + 1}`}</span>
            </div>
            <span className="product-kicker">REWARD SYSTEM</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
