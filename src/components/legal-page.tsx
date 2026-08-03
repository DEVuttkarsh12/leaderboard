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
    <section className="px-4 py-10 md:px-6 md:py-14">
      <div className="section-wrap">
        <div className="surface-panel rounded-[2rem] px-6 py-8 md:px-8 md:py-10">
          <div className="max-w-3xl">
            <div className="muted-label">{eyebrow}</div>
            <h1 className="display-serif mt-4 text-4xl font-semibold tracking-[-0.06em] text-[var(--shib-cream)] md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-sm leading-7 text-[var(--shib-muted-soft)] md:text-base">
              {intro}
            </p>
          </div>

          <div className="mt-10 grid gap-6">
            {sections.map((section) => (
              <div
                key={section.heading}
                className="border-l-2 border-[var(--shib-haze)] pl-5"
              >
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--shib-cream)]">
                  {section.heading}
                </h2>

                <div className="mt-4 space-y-3">
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-sm leading-7 text-[var(--shib-muted-soft)]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                {section.bullets?.length ? (
                  <ul className="mt-4 space-y-3">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="relative pl-5 text-sm leading-7 text-[var(--shib-muted-soft)]"
                      >
                        <span className="absolute left-0 top-[0.8em] h-1.5 w-1.5 rounded-full bg-[var(--shib-violet)]" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
