"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatNumber, formatNumberCompact, formatScore, formatWholeNumber } from "@/lib/formatters";

type CountUpValueProps = {
  value: number;
  mode?: "compact" | "number" | "score" | "whole";
  durationMs?: number;
};

function formatValue(value: number, mode: CountUpValueProps["mode"]): string {
  switch (mode) {
    case "compact":
      return formatNumberCompact(value);
    case "score":
      return formatScore(value);
    case "whole":
      return formatWholeNumber(value);
    case "number":
    default:
      return formatNumber(value);
  }
}

export default function CountUpValue({
  value,
  mode = "number",
  durationMs = 900,
}: CountUpValueProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    let frameId = 0;

    if (prefersReducedMotion) {
      frameId = window.requestAnimationFrame(() => {
        previousValueRef.current = value;
        setDisplayValue(value);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    if (previousValueRef.current === value) {
      return;
    }

    const startValue = previousValueRef.current;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + (value - startValue) * eased;
      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      } else {
        previousValueRef.current = value;
      }
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [durationMs, value]);

  const text = useMemo(
    () => formatValue(displayValue, mode),
    [displayValue, mode]
  );

  return <>{text}</>;
}
