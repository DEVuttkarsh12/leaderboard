"use client";

import { CircleDollarSign, Coins, Crown, Sparkles, Trophy, Zap } from "lucide-react";
import { useEffect, useState } from "react";

type SiteEntryLoaderProps = {
  embedded?: boolean;
};

const EXIT_MS = 240;
const VISIBLE_MS = 650;
const REDUCED_MOTION_VISIBLE_MS = 120;

export default function SiteEntryLoader({
  embedded = false,
}: SiteEntryLoaderProps) {
  const [phase, setPhase] = useState<"visible" | "exiting" | "hidden">(
    "visible"
  );

  useEffect(() => {
    if (embedded) return undefined;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const visibleMs = prefersReducedMotion
      ? REDUCED_MOTION_VISIBLE_MS
      : VISIBLE_MS;
    const exitMs = prefersReducedMotion ? 0 : EXIT_MS;

    const exitTimer = window.setTimeout(() => setPhase("exiting"), visibleMs);
    const hideTimer = window.setTimeout(
      () => setPhase("hidden"),
      visibleMs + exitMs
    );

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
    };
  }, [embedded]);

  if (phase === "hidden") return null;

  return (
    <div
      className={`site-loader ${phase === "exiting" ? "site-loader--exit" : ""} ${
        embedded ? "site-loader--embedded" : "site-loader--fixed"
      }`}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="site-loader__stage" aria-label="Loading RankBoard">
        <div className="site-loader__rank-deck" aria-hidden="true">
          <span className="site-loader__prize-chip site-loader__prize-chip--coins"><Coins size={20} strokeWidth={2.5} /></span>
          <span className="site-loader__prize-chip site-loader__prize-chip--cash"><CircleDollarSign size={21} strokeWidth={2.5} /></span>
          <span className="site-loader__prize-chip site-loader__prize-chip--spark"><Zap size={19} strokeWidth={2.7} /></span>

          <div className="site-loader__rank-card site-loader__rank-card--cyan">
            <Trophy size={34} strokeWidth={2.2} />
          </div>
          <div className="site-loader__rank-card site-loader__rank-card--pink">
            <Sparkles size={34} strokeWidth={2.2} />
          </div>
          <div className="site-loader__rank-card site-loader__rank-card--front">
            <span className="site-loader__rank-number"><Crown size={19} fill="currentColor" />01</span>
            <span className="site-loader__brand-mark">R</span>
            <strong>RANK<span>BOARD</span></strong>
            <span className="site-loader__card-pulse"><i /><i /><i /></span>
          </div>
        </div>
        <div className="site-loader__meter" aria-hidden="true">
          <i /><i /><i /><i /><i />
        </div>
      </div>
    </div>
  );
}
