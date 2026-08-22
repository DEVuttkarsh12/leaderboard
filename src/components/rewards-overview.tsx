const items = [
  {
    title: "Daily Drop",
    description: "Open",
  },
  {
    title: "Streak Heat",
    description: "Burn",
  },
  {
    title: "Prize Store",
    description: "Unlock",
  },
  {
    title: "Lucky Spin",
    description: "Spin",
  },
];

export default function RewardsOverview() {
  return (
    <section id="rewards" className="product-section casino-rewards-section">
      <div className="product-section-title casino-section-title">
        <div>
          <span className="product-kicker">Reward Cage</span>
          <h2>Grab heat.</h2>
        </div>
        <p className="casino-section-copy">
          Reward lanes stack daily drops, streak boosts, store prizes, and lucky spins.
        </p>
        <div className="casino-section-pulse" aria-hidden="true">
          <span>777</span>
          <span>♢</span>
        </div>
      </div>

      <div className="casino-reward-cage">
        <div className="casino-vault-card">
          <span>STORE</span>
          <strong>4X</strong>
          <small>Drops active</small>
          <div className="casino-vault-meter" aria-hidden="true">
            <b />
          </div>
          <div className="casino-vault-tags" aria-hidden="true">
            <span>HOT</span>
            <span>READY</span>
          </div>
          <i aria-hidden="true">♣</i>
        </div>

        <div className="casino-reward-rail">
          {items.map((item, index) => (
            <article className="casino-reward-chip" key={item.title}>
              <span>{`0${index + 1}`}</span>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
              <div className="casino-reward-meter" aria-hidden="true">
                <b style={{ width: `${72 + index * 7}%` }} />
              </div>
            </article>
          ))}
        </div>

        <div className="casino-ticket-strip" aria-label="Reward rhythm">
          <span>DROP</span>
          <i />
          <span>STREAK</span>
          <i />
          <span>SPIN</span>
        </div>
      </div>
    </section>
  );
}
