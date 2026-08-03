import Link from "next/link";
import type { LucideIcon } from "lucide-react";

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
            <h2 className="display-serif mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] md:text-5xl">
              {title}
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
            {description}
          </p>
        </div>

        <div className={`grid gap-4 ${gridClassName}`}>
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="border-t border-[rgba(255,216,166,0.12)] pt-6"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--shib-muted)]">
                      {item.eyebrow ?? eyebrow}
                    </div>
                    <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                      {item.title}
                    </h3>
                  </div>

                  {Icon ? (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(255,216,166,0.18)] text-[var(--shib-fur-bright)]">
                      <Icon className="h-5 w-5" />
                    </div>
                  ) : null}
                </div>

                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                  {item.description}
                </p>

                {item.meta ? (
                  <div className="mt-5 text-[0.72rem] uppercase tracking-[0.2em] text-[var(--shib-fur-bright)]">
                    {item.meta}
                  </div>
                ) : null}

                {item.href ? (
                  <Link
                    href={item.href}
                    className="mt-5 inline-flex text-sm font-semibold text-[var(--shib-fur-bright)] transition-colors hover:text-[var(--shib-cream)]"
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
