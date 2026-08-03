"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

const floatingTiles = [
  {
    title: "VS",
    label: "Head to head",
    detail: "Live ladder",
    className: "left-[2%] top-[12%] hidden xl:flex",
  },
  {
    title: "Wild",
    label: "Reward stage",
    detail: "Prize pool",
    className: "right-[3%] top-[14%] hidden xl:flex",
  },
  {
    title: "x10",
    label: "Boosted XP",
    detail: "High stakes",
    className: "left-[4%] bottom-[16%] hidden xl:flex",
  },
  {
    title: "Top 100",
    label: "Ranked now",
    detail: "Read-only",
    className: "right-[4%] bottom-[14%] hidden lg:flex",
  },
];

export default function HeroSection() {
  return (
    <section
      className="hero-stage relative px-4 pb-24 pt-8 md:px-6 md:pb-28 md:pt-10"
    >
      <div className="hero-ambient hero-ambient--violet" aria-hidden="true" />
      <div className="hero-ambient hero-ambient--gold" aria-hidden="true" />

      {floatingTiles.map((tile, index) => (
        <div
          key={tile.title}
          className={`hero-float-card ${tile.className}`}
          style={{ animationDelay: `${index * 180}ms` }}
          aria-hidden="true"
        >
          <span className="hero-float-card__title">{tile.title}</span>
          <span className="hero-float-card__label">{tile.label}</span>
          <span className="hero-float-card__detail">{tile.detail}</span>
        </div>
      ))}

      <div className="section-wrap relative">
        <div className="mx-auto flex min-h-[74vh] max-w-5xl flex-col items-center justify-center text-center">
          <div className="hero-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.26em]">
            <span className="live-dot" aria-hidden="true" />
            Multi-page rewards hub
          </div>

          <div className="mt-8 flex h-[7.5rem] w-[7.5rem] items-center justify-center rounded-full border border-[rgba(255,189,92,0.24)] bg-[linear-gradient(180deg,#ff5b3b,#f0a43b)] text-[2.6rem] font-black text-[#2d1600] shadow-[0_26px_70px_rgba(240,164,59,0.24)] ring-4 ring-[rgba(47,143,131,0.22)]">
            RB
          </div>

          <div className="mt-8">
            <div className="display-logo text-[4.8rem] leading-none text-[var(--shib-cream)] drop-shadow-[0_8px_0_rgba(29,107,99,0.68)] sm:text-[6rem] lg:text-[8rem]">
              RankBoard
            </div>
            <div className="display-serif mt-4 text-[2.1rem] font-semibold tracking-[-0.06em] text-[var(--shib-heading)] sm:text-[2.6rem] lg:text-[3.1rem]">
              Rewards-first, leaderboard-backed
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/leaderboard"
              className="primary-button inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-[#2d1600]"
            >
              View leaderboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/challenges"
              className="secondary-button inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-[var(--shib-cream)]"
            >
              Explore challenges
            </Link>
          </div>

          <div className="mt-12">
            <div className="text-[0.68rem] font-semibold uppercase tracking-[0.38em] text-[var(--shib-muted)]">
              Given away to the community
            </div>
            <div className="mt-2 text-5xl font-black tracking-[-0.06em] text-[var(--shib-fur)] md:text-6xl">
              $25,200.00
            </div>
          </div>

          <div className="mt-14 grid w-full max-w-4xl gap-8 text-left sm:grid-cols-3">
            <div className="border-l border-[rgba(255,216,166,0.2)] pl-4">
              <div className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--shib-muted)]">
                Format
              </div>
              <div className="mt-2 text-lg font-semibold text-[var(--shib-cream)]">
                Rewards first
              </div>
            </div>
            <div className="border-l border-[rgba(255,216,166,0.2)] pl-4">
              <div className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--shib-muted)]">
                Data path
              </div>
              <div className="mt-2 text-lg font-semibold text-[var(--shib-cream)]">
                Live read-only board
              </div>
            </div>
            <div className="border-l border-[rgba(255,216,166,0.2)] pl-4">
              <div className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--shib-muted)]">
                Product feel
              </div>
              <div className="mt-2 text-lg font-semibold text-[var(--shib-cream)]">
                Open campaign shell
              </div>
            </div>
          </div>

          <Link
            href="/store"
            className="mt-10 flex flex-col items-center text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-[var(--shib-muted)]"
          >
            Open the rewards store
            <span className="mt-4 flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-lg text-[var(--shib-cream)]">
              ↓
            </span>
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <svg
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
          className="h-20 w-full md:h-28"
          aria-hidden="true"
        >
          <path
            d="M0,72 C150,128 270,28 430,76 C585,124 730,42 898,74 C1082,110 1210,46 1440,82 L1440,160 L0,160 Z"
            fill="rgba(12,46,54,0.92)"
          />
          <path
            d="M0,92 C188,136 304,62 472,98 C636,134 796,58 964,92 C1140,126 1260,72 1440,104 L1440,160 L0,160 Z"
            fill="rgba(28,8,49,0.98)"
          />
        </svg>
      </div>
    </section>
  );
}
