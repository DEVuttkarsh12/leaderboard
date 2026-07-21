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
      className="flex flex-col items-center justify-center rounded-2xl border border-[#e8e4f0] bg-white px-6 py-16 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f2effc]">
        <AlertCircle className="h-7 w-7 text-[#7257d5]" />
      </div>
      <h3 className="text-lg font-semibold text-[#17151f]">
        Unable to load the leaderboard
      </h3>
      <p className="mt-2 max-w-sm text-sm text-[#6f6b7a]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 rounded-lg bg-[#7257d5] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#4f3aa8]"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
