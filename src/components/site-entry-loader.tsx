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
    // Timers always run — even in embedded mode (route loading UI). The
    // embedded loader previously never dismissed itself and relied solely on
    // the parent unmounting it, which bricked the site whenever a segment
    // stayed suspended. Self-dismiss is the backstop; the parent unmounting
    // first is still the normal path.
    let exitTimer = 0;
    let hideTimer = 0;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const baseVisibleMs = prefersReducedMotion
      ? REDUCED_MOTION_VISIBLE_MS
      : VISIBLE_MS;
    const visibleMs = embedded
      ? Math.max(baseVisibleMs, 2400)
      : baseVisibleMs;
    const exitMs = prefersReducedMotion ? 0 : EXIT_MS;

    exitTimer = window.setTimeout(() => setPhase("exiting"), visibleMs);
    hideTimer = window.setTimeout(() => setPhase("hidden"), visibleMs + exitMs);

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
              <em>PTS</em>
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
