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
    <div className="product-error-state" role="alert" aria-live="assertive">
      <div className="broken-signal" aria-hidden="true">
        <i />
        <i />
      </div>
      <strong>Leaderboard unavailable</strong>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry}>
          <AlertCircle className="h-4 w-4" />
          Reconnect board
        </button>
      ) : null}
    </div>
  );
}
