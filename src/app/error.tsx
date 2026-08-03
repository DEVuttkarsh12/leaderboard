"use client";

import { AlertCircle } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-24">
      <div
        className="leaderboard-shell premium-outline flex w-full max-w-xl flex-col items-center rounded-[2rem] px-8 py-14 text-center"
        role="alert"
        aria-live="assertive"
      >
        <div className="score-pill mb-5 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertCircle className="h-7 w-7 text-[var(--primary-deep)]" />
        </div>
        <h1 className="display-serif text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
          Something went wrong
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
          The page hit an unexpected error. Try loading the board again.
        </p>
        <button
          onClick={reset}
          className="primary-button mt-7 rounded-full px-6 py-3 text-sm font-semibold text-white"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
