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
    eyebrow: "♠ Live Board",
    title: "Leaderboard",
    href: "/leaderboard",
    description: "Chase top 3.",
  },
  {
    eyebrow: "♦ Rewards",
    title: "Challenges",
    href: "/challenges",
    description: "Hit missions.",
  },
  {
    eyebrow: "♣ Stream",
    title: "Bonus Hunts",
    href: "/bonus-hunts",
    description: "Watch heat.",
  },
  {
    eyebrow: "777 Utility",
    title: "Help Center",
    href: "/help",
    description: "Fast exits.",
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
      "Live heat.",
    href: "/bonus-hunts",
    cta: "Play zone",
    meta: "Hot table",
    icon: Radio,
  },
  {
    title: "Tournaments",
    description:
      "Bracket rush.",
    href: "/tournaments",
    cta: "Enter",
    meta: "Prize table",
    icon: Trophy,
  },
  {
    title: "Wager Raffles",
    description:
      "Ticket drops.",
    href: "/wager-raffles",
    cta: "Grab tickets",
    meta: "Lucky draw",
    icon: Tickets,
  },
];

export const platformCards: SiteFeatureCard[] = [
  {
    title: "Store",
    description:
      "Boosts, drops, and flex rewards.",
    href: "/store",
    cta: "Open store",
    meta: "Commerce route",
    icon: Store,
  },
  {
    title: "Help",
    description:
      "Fast answers without the bloat.",
    href: "/help",
    cta: "Open help",
    meta: "Support route",
    icon: CircleHelp,
  },
  {
    title: "Support",
    description:
      "Fixes, claims, and clean escalations.",
    href: "/support",
    cta: "Open support",
    meta: "Contact route",
    icon: Headphones,
  },
  {
    title: "Login",
    description:
      "One door for account moves.",
    href: "/login",
    cta: "Open login",
    meta: "Auth route",
    icon: Gift,
  },
];
