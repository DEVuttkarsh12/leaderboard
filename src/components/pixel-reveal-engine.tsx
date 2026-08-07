"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AnimationPattern =
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight"
  | "center"
  | "leftToRight"
  | "rightToLeft"
  | "topToBottom"
  | "bottomToTop"
  | "random";

type PixelRevealEngineProps = {
  pixelColor?: string;
  cols?: number;
  rows?: number;
  animationSpeed?: number;
  animationPattern?: AnimationPattern;
  className?: string;
  opacity?: number;
};

function getDelay(
  row: number,
  column: number,
  rows: number,
  cols: number,
  pattern: AnimationPattern,
  speed: number
) {
  const maxDistance = Math.sqrt((rows - 1) ** 2 + (cols - 1) ** 2) || 1;
  let distance = 0;

  switch (pattern) {
    case "topRight":
      distance = Math.sqrt(row ** 2 + (cols - 1 - column) ** 2);
      break;
    case "bottomLeft":
      distance = Math.sqrt((rows - 1 - row) ** 2 + column ** 2);
      break;
    case "bottomRight":
      distance = Math.sqrt((rows - 1 - row) ** 2 + (cols - 1 - column) ** 2);
      break;
    case "center":
      distance = Math.sqrt((row - rows / 2) ** 2 + (column - cols / 2) ** 2);
      break;
    case "random":
      distance = Math.random() * maxDistance;
      break;
    case "leftToRight":
      distance = column;
      break;
    case "rightToLeft":
      distance = cols - 1 - column;
      break;
    case "topToBottom":
      distance = row;
      break;
    case "bottomToTop":
      distance = rows - 1 - row;
      break;
    default:
      distance = Math.sqrt(row ** 2 + column ** 2);
      break;
  }

  return (distance / maxDistance) * speed;
}

export default function PixelRevealEngine({
  pixelColor = "#FF5C00",
  cols = 28,
  rows = 20,
  animationSpeed = 0.8,
  animationPattern = "topLeft",
  className,
  opacity = 0.18,
}: PixelRevealEngineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      const frameId = window.requestAnimationFrame(() => setIsActive(true));
      return () => window.cancelAnimationFrame(frameId);
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsActive(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const cells = useMemo(() => {
    const cellList: Array<{ key: string; delay: number; row: number; col: number }> = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        cellList.push({
          key: `${row}-${col}`,
          delay: getDelay(row, col, rows, cols, animationPattern, animationSpeed),
          row,
          col,
        });
      }
    }

    return cellList;
  }, [animationPattern, animationSpeed, cols, rows]);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {cells.map((cell) => (
        <span
          key={cell.key}
          style={{
            position: "absolute",
            left: `${(cell.col / cols) * 100}%`,
            top: `${(cell.row / rows) * 100}%`,
            width: `calc(${100 / cols}% + 1px)`,
            height: `calc(${100 / rows}% + 1px)`,
            backgroundColor: pixelColor,
            opacity: isActive ? opacity : 0,
            transitionProperty: "opacity",
            transitionDuration: "30ms",
            transitionTimingFunction: "linear",
            transitionDelay: `${cell.delay}s`,
            mixBlendMode: "screen",
          }}
        />
      ))}
    </div>
  );
}
