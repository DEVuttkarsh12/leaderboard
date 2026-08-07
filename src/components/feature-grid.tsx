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
  return (
    <section className="product-section">
      <div className="product-section-title">
        <div>
          <span className="product-kicker">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <p className="design-section-copy">{description}</p>
      </div>

      <div className={`design-card-grid design-card-grid--${columns}`}>
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <article className="design-card" key={item.title}>
              <div className="design-card__top">
                <span className="design-card__index">{`0${index + 1}`}</span>
                {Icon ? (
                  <span className="design-card__icon">
                    <Icon className="h-5 w-5" />
                  </span>
                ) : null}
              </div>
              <span className="product-kicker">{item.eyebrow ?? eyebrow}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className="design-card__footer">
                <small>{item.meta ?? "LIVE ROUTE"}</small>
                {item.href ? (
                  <Link href={item.href}>
                    {item.cta ?? "OPEN"}
                    <span>↗</span>
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
