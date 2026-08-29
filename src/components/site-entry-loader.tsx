"use client";

import { useEffect, useState } from "react";

type SiteEntryLoaderProps = {
  embedded?: boolean;
};

const EXIT_MS = 420;
const VISIBLE_MS = 1350;
const REDUCED_MOTION_VISIBLE_MS = 260;

export default function SiteEntryLoader({
  embedded = false,
}: SiteEntryLoaderProps) {
  const [phase, setPhase] = useState<"visible" | "exiting" | "hidden">(
    "visible"
  );

  useEffect(() => {
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
      <div className="site-loader__stage">
        <div className="site-loader__deck" aria-hidden="true">
          <div className="site-loader__shadow" />

          <div className="site-loader__card site-loader__card--one">
            <span className="site-loader__card-label">TOP</span>
            <span className="site-loader__card-value">#01</span>
          </div>
          <div className="site-loader__card site-loader__card--two">
            <span className="site-loader__card-label">POOL</span>
            <span className="site-loader__card-value">$</span>
          </div>
          <div className="site-loader__card site-loader__card--three">
            <span className="site-loader__card-label">XP</span>
            <span className="site-loader__card-value">7</span>
          </div>
          <div className="site-loader__card site-loader__card--four">
            <span className="site-loader__card-label">LIVE</span>
            <span className="site-loader__card-value">GO</span>
          </div>
        </div>

        <div className="site-loader__copy">
          <div className="site-loader__eyebrow">RankBoard</div>
          <div className="site-loader__label">Dealing ranks</div>
        </div>
      </div>
    </div>
  );
}
