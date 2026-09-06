"use client";

import { Coins, Crown, Sparkles, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

type SiteEntryLoaderProps = {
  embedded?: boolean;
};

const EXIT_MS = 320;
const VISIBLE_MS = 1120;
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
      <div className="site-loader__stage" aria-label="Loading ARTZ Rewards">
        <div className="site-loader__reward-lock" aria-hidden="true">
          <div className="site-loader__card-stack">
            <span className="site-loader__shuffle-card site-loader__shuffle-card--left">
              <Sparkles size={22} strokeWidth={2.5} />
              <em>XP</em>
            </span>
            <span className="site-loader__shuffle-card site-loader__shuffle-card--right">
              <Coins size={23} strokeWidth={2.5} />
              <em>PTS</em>
            </span>
            <span className="site-loader__shuffle-card site-loader__shuffle-card--center">
              <Crown size={21} strokeWidth={2.6} />
              <b>A</b>
              <em>ARTZ</em>
            </span>

            <span className="site-loader__coin-stack">
              <i /><i /><i />
              <b><Trophy size={17} strokeWidth={2.7} /></b>
            </span>
          </div>
        </div>

        <div className="site-loader__lock-copy">
          <strong>ARTZ <span>REWARDS</span></strong>
          <small><Sparkles size={13} /> Shuffling rewards</small>
        </div>

        <div className="site-loader__lock-track" aria-hidden="true">
          <i /><i /><i /><i /><i /><i /><i />
        </div>
      </div>
    </div>
  );
}
