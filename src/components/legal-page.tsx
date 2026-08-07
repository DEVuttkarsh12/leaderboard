type LegalSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
};

export default function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
}: LegalPageProps) {
  return (
    <section className="product-section">
      <div className="product-intro design-page-intro">
        <div className="intro-index">
          05
          <span>/05</span>
        </div>
        <div>
          <span className="product-kicker">{eyebrow}</span>
          <h1>{title}</h1>
        </div>
        <div className="intro-aside">
          <p>{intro}</p>
        </div>
      </div>

      <div className="legal-shell">
        {sections.map((section, index) => (
          <article className="legal-card" key={section.heading}>
            <span className="legal-card__index">{`0${index + 1}`}</span>
            <h2>{section.heading}</h2>
            <div className="legal-card__copy">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {section.bullets?.length ? (
              <ul className="legal-card__list">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
