import Link from "next/link";
import {
  BadgeHelp,
  CircleDollarSign,
  KeyRound,
  Radio,
  ShoppingBag,
  Swords,
  Target,
  Trophy,
} from "lucide-react";

const features = [
  {
    title: "Live Board",
    label: "Ranks",
    href: "/leaderboard",
    icon: Trophy,
  },
  {
    title: "Missions",
    label: "Daily push",
    href: "/challenges",
    icon: Target,
  },
  {
    title: "Bonus Hunts",
    label: "Stream heat",
    href: "/bonus-hunts",
    icon: Radio,
  },
  {
    title: "Tournaments",
    label: "Bracket run",
    href: "/tournaments",
    icon: Swords,
  },
  {
    title: "Raffles",
    label: "Ticket drops",
    href: "/wager-raffles",
    icon: CircleDollarSign,
  },
  {
    title: "Store",
    label: "Reward cage",
    href: "/store",
    icon: ShoppingBag,
  },
  {
    title: "Support",
    label: "Fix fast",
    href: "/support",
    icon: BadgeHelp,
  },
  {
    title: "Account",
    label: "Entry lane",
    href: "/login",
    icon: KeyRound,
  },
];

export default function FeatureLaunchpad() {
  return (
    <section className="product-section feature-launchpad-section">
      <div className="product-section-title casino-section-title">
        <div>
          <span className="product-kicker">Feature Deck</span>
          <h2>Every lane is live.</h2>
        </div>
        <p className="casino-section-copy">
          Jump from rank chase to rewards, events, store, and support without leaving the floor.
        </p>
        <div className="casino-section-pulse" aria-hidden="true">
          <span>8X</span>
          <span>↗</span>
        </div>
      </div>

      <div className="feature-launchpad" aria-label="RankBoard feature routes">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <Link className="feature-launchpad-card" href={feature.href} key={feature.href}>
              <span className="feature-launchpad-card__index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="feature-launchpad-card__icon">
                <Icon className="h-5 w-5" />
              </span>
              <strong>{feature.title}</strong>
              <small>{feature.label}</small>
              <i aria-hidden="true">↗</i>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
