"use client";

import { useEffect, useMemo, useState } from "react";
import { formatRelativeTime, formatShortDate } from "@/lib/formatters";

type CountdownStripProps = {
  targetIso: string;
  label?: string;
};

type CountdownParts = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

function getCountdownParts(targetMs: number, nowMs: number): CountdownParts {
  const remainingSeconds = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  const days = Math.floor(remainingSeconds / 86_400);
  const hours = Math.floor((remainingSeconds % 86_400) / 3_600);
  const minutes = Math.floor((remainingSeconds % 3_600) / 60);
  const seconds = remainingSeconds % 60;

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

export default function CountdownStrip({
  targetIso,
  label = "Round closes",
}: CountdownStripProps) {
  const targetDate = useMemo(() => new Date(targetIso), [targetIso]);
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    const targetMs = targetDate.getTime();
    if (Number.isNaN(targetMs)) {
      return;
    }

    const update = () => {
      setNowMs(Date.now());
    };

    update();

    if (targetMs <= Date.now()) {
      return;
    }

    const timerId = window.setInterval(() => {
      update();
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [targetDate]);

  if (Number.isNaN(targetDate.getTime())) {
    return null;
  }

  const hasStarted = nowMs !== null;
  const parts = hasStarted
    ? getCountdownParts(targetDate.getTime(), nowMs)
    : {
        days: "--",
        hours: "--",
        minutes: "--",
        seconds: "--",
      };
  const isComplete = hasStarted && targetDate.getTime() <= nowMs;

  return (
    <div className="countdown-strip" aria-live="polite">
      <div className="countdown-strip__copy">
        <span className="countdown-strip__label">{label}</span>
        <span className="countdown-strip__date">
          {formatShortDate(targetDate)}
          {hasStarted
            ? ` · ${formatRelativeTime(targetDate, new Date(nowMs))}`
            : " · Live countdown"}
        </span>
      </div>

      <div className="countdown-strip__grid" aria-hidden={isComplete}>
        {[
          { label: "Days", value: parts.days },
          { label: "Hours", value: parts.hours },
          { label: "Min", value: parts.minutes },
          { label: "Sec", value: parts.seconds },
        ].map((item) => (
          <div key={item.label} className="countdown-segment">
            <span className="countdown-segment__value">{item.value}</span>
            <span className="countdown-segment__label">{item.label}</span>
          </div>
        ))}
      </div>

      {isComplete ? (
        <div className="countdown-strip__complete">
          Window closed on {formatShortDate(targetDate)}
        </div>
      ) : null}
    </div>
  );
}
