import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import TextRevealScroll from "./text-reveal-scroll";

export type FeatureCard = {
  title: string;
  description: string;
  eyebrow?: string;
  meta?: string;
  href?: string;
  cta?: string;
  icon?: LucideIcon;
};

type FeatureGridSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: FeatureCard[];
  columns?: 2 | 3 | 4;
};

export default function FeatureGridSection({
  eyebrow,
  title,
  description,
  items,
  columns = 3,
}: FeatureGridSectionProps) {
  const gridClassName =
    columns === 2
      ? "md:grid-cols-2"
      : columns === 4
        ? "md:grid-cols-2 xl:grid-cols-4"
        : "md:grid-cols-2 xl:grid-cols-3";

  return (
    <section className="px-4 py-12 md:px-6 md:py-16">
      <div className="section-wrap section-shell">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="muted-label">{eyebrow}</div>
            <TextRevealScroll
              as="h2"
              revealMode="chars"
              className="display-serif mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] md:text-5xl"
            >
              {title}
            </TextRevealScroll>
          </div>
          <TextRevealScroll
            as="p"
            revealMode="words"
            className="max-w-sm text-sm leading-6 text-[var(--text-secondary)]"
          >
            {description}
          </TextRevealScroll>
        </div>

        <div className={`grid gap-4 ${gridClassName}`}>
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="feature-grid-card"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                      {item.eyebrow ?? eyebrow}
                    </div>
                    <TextRevealScroll
                      as="h3"
                      revealMode="chars"
                      className="mt-4 text-xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]"
                    >
                      {item.title}
                    </TextRevealScroll>
                  </div>

                  {Icon ? (
                    <div className="feature-grid-card__icon flex h-11 w-11 items-center justify-center rounded-full">
                      <Icon className="h-5 w-5" />
                    </div>
                  ) : null}
                </div>

                <TextRevealScroll
                  as="p"
                  revealMode="words"
                  className="mt-3 text-sm leading-6 text-[var(--text-secondary)]"
                >
                  {item.description}
                </TextRevealScroll>

                {item.meta ? (
                  <div className="mt-5 text-[0.72rem] uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                    {item.meta}
                  </div>
                ) : null}

                {item.href ? (
                  <Link
                    href={item.href}
                    className="mt-5 inline-flex text-sm font-semibold text-[var(--accent-strong)] transition-colors hover:text-[var(--text-primary)]"
                  >
                    {item.cta ?? "Open page"}
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
