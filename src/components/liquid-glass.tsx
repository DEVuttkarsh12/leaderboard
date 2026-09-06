"use client";

import {
  createElement,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

type LiquidGlassTag = "article" | "aside" | "div" | "nav" | "section" | "span";
type LiquidGlassTone = "neutral" | "ember" | "cyan" | "violet" | "success";
type LiquidGlassDepth = "regular" | "clear";

type LiquidGlassProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  as?: LiquidGlassTag;
  children: ReactNode;
  depth?: LiquidGlassDepth;
  interactive?: boolean;
  tone?: LiquidGlassTone;
};

export default function LiquidGlass({
  as = "div",
  children,
  className = "",
  depth = "regular",
  interactive = true,
  onPointerLeave,
  onPointerMove,
  style,
  tone = "neutral",
  ...props
}: LiquidGlassProps) {
  function moveHighlight(event: ReactPointerEvent<HTMLElement>) {
    if (interactive) {
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 100;
      const y = ((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 100;
      event.currentTarget.style.setProperty("--liquid-x", `${Math.max(0, Math.min(100, x))}%`);
      event.currentTarget.style.setProperty("--liquid-y", `${Math.max(0, Math.min(100, y))}%`);
      if (event.pointerType !== "touch") {
        event.currentTarget.style.setProperty("--liquid-tilt-x", `${(50 - y) * 0.045}deg`);
        event.currentTarget.style.setProperty("--liquid-tilt-y", `${(x - 50) * 0.055}deg`);
      }
    }
    onPointerMove?.(event);
  }

  function resetHighlight(event: ReactPointerEvent<HTMLElement>) {
    if (interactive) {
      event.currentTarget.style.setProperty("--liquid-x", "50%");
      event.currentTarget.style.setProperty("--liquid-y", "0%");
      event.currentTarget.style.setProperty("--liquid-tilt-x", "0deg");
      event.currentTarget.style.setProperty("--liquid-tilt-y", "0deg");
    }
    onPointerLeave?.(event);
  }

  const liquidStyle = {
    "--liquid-x": "50%",
    "--liquid-y": "0%",
    "--liquid-tilt-x": "0deg",
    "--liquid-tilt-y": "0deg",
    ...style,
  } as CSSProperties;

  return createElement(
    as,
    {
      ...props,
      className: `liquid-glass ${className}`.trim(),
      "data-liquid-depth": depth,
      "data-liquid-interactive": interactive,
      "data-liquid-tone": tone,
      onPointerLeave: resetHighlight,
      onPointerMove: moveHighlight,
      style: liquidStyle,
    },
    children
  );
}
