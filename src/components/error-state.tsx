"use client";

import { AlertCircle } from "lucide-react";

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export default function ErrorState({
  message = "The leaderboard service is temporarily unavailable. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="leaderboard-shell premium-outline flex flex-col items-center justify-center rounded-[2rem] px-6 py-20 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="score-pill mb-5 flex h-16 w-16 items-center justify-center rounded-full">
        <AlertCircle className="h-7 w-7 text-[var(--primary-deep)]" />
      </div>
      <h3 className="display-serif text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
        Unable to load the leaderboard
      </h3>
      <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="primary-button mt-7 rounded-full px-6 py-3 text-sm font-semibold text-white"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
