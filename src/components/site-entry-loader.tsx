"use client";

import { CircleDollarSign, Coins, Crown, Sparkles, Trophy, Zap } from "lucide-react";
import { useEffect, useState } from "react";

type SiteEntryLoaderProps = {
  embedded?: boolean;
};

const EXIT_MS = 260;
const VISIBLE_MS = 860;
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
        <div className="site-loader__podium-scene" aria-hidden="true">
          <span className="site-loader__scene-chip site-loader__scene-chip--spark"><Sparkles size={19} strokeWidth={2.5} /></span>
          <span className="site-loader__scene-chip site-loader__scene-chip--cash"><CircleDollarSign size={20} strokeWidth={2.5} /></span>
          <span className="site-loader__scene-chip site-loader__scene-chip--trophy"><Trophy size={19} strokeWidth={2.6} /></span>

          <span className="site-loader__monogram">R</span>
          <div className="site-loader__mini-podium">
            <div className="site-loader__podium-step site-loader__podium-step--2">
              <span>02</span>
              <Coins size={22} strokeWidth={2.5} />
            </div>
            <div className="site-loader__podium-step site-loader__podium-step--1">
              <Crown size={25} strokeWidth={2.5} fill="currentColor" />
              <span>01</span>
            </div>
            <div className="site-loader__podium-step site-loader__podium-step--3">
              <span>03</span>
              <Zap size={21} strokeWidth={2.7} />
            </div>
          </div>
          <strong>RANK<span>BOARD</span></strong>
          <span className="site-loader__scene-pulse"><i /><i /><i /></span>
        </div>
        <div className="site-loader__meter" aria-hidden="true">
          <i /><i /><i /><i /><i />
        </div>
      </div>
    </div>
  );
}
