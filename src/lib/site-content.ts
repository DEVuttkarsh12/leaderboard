import type { LucideIcon } from "lucide-react";
import {
  CircleHelp,
  Gift,
  Headphones,
  Radio,
  Store,
  Tickets,
  Trophy,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href?: string;
  description?: string;
  children?: Array<{
    label: string;
    href: string;
    description?: string;
  }>;
};

export const siteNavigation: NavigationItem[] = [
  { label: "Home", href: "/" },
  { label: "Leaderboard", href: "/leaderboard" },
  {
    label: "Rewards",
    children: [
      {
        label: "Challenges",
        href: "/challenges",
        description: "Daily, weekly, and campaign challenge layouts.",
      },
      {
        label: "Wager Raffles",
        href: "/wager-raffles",
        description: "Prize-draw surfaces and ticket-based reward pages.",
      },
    ],
  },
  {
    label: "Stream",
    children: [
      {
        label: "Bonus Hunts",
        href: "/bonus-hunts",
        description: "Live-session pages and feature blocks for stream events.",
      },
      {
        label: "Tournaments",
        href: "/tournaments",
        description: "Scheduled brackets, lobbies, and event summaries.",
      },
    ],
  },
  { label: "Store", href: "/store" },
  { label: "Help", href: "/help" },
];

export const footerMenus = [
  {
    title: "Platform",
    links: [
      { label: "Home", href: "/" },
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "Challenges", href: "/challenges" },
      { label: "Store", href: "/store" },
    ],
  },
  {
    title: "Events",
    links: [
      { label: "Bonus Hunts", href: "/bonus-hunts" },
      { label: "Tournaments", href: "/tournaments" },
      { label: "Wager Raffles", href: "/wager-raffles" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Help", href: "/help" },
      { label: "Login", href: "/login" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export const routeHubCards = [
  {
    eyebrow: "Live Board",
    title: "Leaderboard",
    href: "/leaderboard",
    description: "The same read-only live standings, moved into their own page.",
  },
  {
    eyebrow: "Rewards",
    title: "Challenges",
    href: "/challenges",
    description: "Campaign and quest surfaces now live outside the board page.",
  },
  {
    eyebrow: "Stream",
    title: "Bonus Hunts",
    href: "/bonus-hunts",
    description: "A dedicated surface for stream events, recaps, and spotlights.",
  },
  {
    eyebrow: "Utility",
    title: "Help Center",
    href: "/help",
    description: "Support, FAQ, and policy pages now have proper destinations.",
  },
];

export type SiteFeatureCard = {
  title: string;
  description: string;
  href: string;
  cta: string;
  meta: string;
  icon: LucideIcon;
};

export const streamCards: SiteFeatureCard[] = [
  {
    title: "Bonus Hunts",
    description:
      "Separate stream-event pages keep hunt recaps and featured moments out of the leaderboard screen.",
    href: "/bonus-hunts",
    cta: "Open bonus hunts",
    meta: "Stream route",
    icon: Radio,
  },
  {
    title: "Tournaments",
    description:
      "Scheduled event cards, prize summaries, and bracket-style content give competition pages their own space.",
    href: "/tournaments",
    cta: "Open tournaments",
    meta: "Event route",
    icon: Trophy,
  },
  {
    title: "Wager Raffles",
    description:
      "Ticket and raffle UI can live in a dedicated page without changing how the live board fetches data.",
    href: "/wager-raffles",
    cta: "Open raffles",
    meta: "Rewards route",
    icon: Tickets,
  },
];

export const platformCards: SiteFeatureCard[] = [
  {
    title: "Store",
    description:
      "Reward catalog and redemption cards are now separated from the competition surface.",
    href: "/store",
    cta: "Open store",
    meta: "Commerce route",
    icon: Store,
  },
  {
    title: "Help",
    description:
      "FAQ, category cards, and support navigation mirror the public help layer from the reference app.",
    href: "/help",
    cta: "Open help",
    meta: "Support route",
    icon: CircleHelp,
  },
  {
    title: "Support",
    description:
      "Account, connection, and claim-assistance UI now live on a proper support page instead of inside the homepage copy.",
    href: "/support",
    cta: "Open support",
    meta: "Contact route",
    icon: Headphones,
  },
  {
    title: "Login",
    description:
      "Authentication entry can sit on its own route while the rest of the site stays browseable.",
    href: "/login",
    cta: "Open login",
    meta: "Auth route",
    icon: Gift,
  },
];
