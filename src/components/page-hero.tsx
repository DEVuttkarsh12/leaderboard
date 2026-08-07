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
    <section className="product-section">
      <div className="product-intro design-page-intro">
        <div className="intro-index">
          02
          <span>/05</span>
        </div>
        <div>
          <span className="product-kicker">{eyebrow}</span>
          <h1>{title}</h1>
          <div className="design-page-intro__actions">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={action.variant === "secondary" ? "text-button" : "primary-button"}
              >
                <span>{action.label}</span>
                {action.variant === "secondary" ? "↓" : "↗"}
              </Link>
            ))}
          </div>
        </div>
        <div className="intro-aside">
          {Icon ? (
            <div className="design-page-intro__icon">
              <Icon className="h-6 w-6" />
            </div>
          ) : null}
          <p>{description}</p>
          {stats.length ? (
            <div className="design-page-intro__stats">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
