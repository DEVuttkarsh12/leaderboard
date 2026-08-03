import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type HeroAction = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

type HeroStat = {
  label: string;
  value: string;
};

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  actions?: HeroAction[];
  stats?: HeroStat[];
};

export default function PageHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions = [],
  stats = [],
}: PageHeroProps) {
  return (
    <section className="px-4 pb-6 pt-8 md:px-6 md:pb-8 md:pt-10">
      <div className="section-wrap">
        <div className="surface-panel premium-outline overflow-hidden rounded-[2rem] px-6 py-8 md:px-8 md:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="hero-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.26em]">
                <span className="live-dot" aria-hidden="true" />
                {eyebrow}
              </div>

              <div className="mt-5 flex items-start gap-4">
                {Icon ? (
                  <div className="hidden h-14 w-14 items-center justify-center rounded-[1.2rem] border border-[rgba(255,189,92,0.18)] bg-[rgba(15,35,44,0.56)] text-[var(--shib-fur-bright)] md:flex">
                    <Icon className="h-6 w-6" />
                  </div>
                ) : null}

                <div>
                  <h1 className="display-serif text-4xl font-semibold tracking-[-0.06em] text-[var(--shib-cream)] md:text-5xl">
                    {title}
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--shib-muted-soft)] md:text-base">
                    {description}
                  </p>
                </div>
              </div>

              {actions.length > 0 ? (
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  {actions.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className={
                        action.variant === "secondary"
                          ? "secondary-button inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-[var(--shib-cream)]"
                          : "primary-button inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-[#2d1600]"
                      }
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {stats.map((stat) => (
                <div key={stat.label} className="tinted-panel rounded-[1.35rem] px-4 py-4">
                  <div className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--shib-muted)]">
                    {stat.label}
                  </div>
                  <div className="mt-2 text-lg font-semibold tracking-[-0.04em] text-[var(--shib-cream)]">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
