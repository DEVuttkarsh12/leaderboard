"use client";

import { useEffect, useRef, useState } from "react";

type CursorMode = "idle" | "active" | "text";

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, summary, [data-cursor="interactive"]';
const TEXT_SELECTOR = 'input, textarea, [contenteditable="true"]';

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const ringPositionRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<CursorMode>("idle");

  useEffect(() => {
    const supportsFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!supportsFinePointer || prefersReducedMotion) {
      return;
    }

    document.documentElement.classList.add("custom-cursor-ready");
    window.requestAnimationFrame(() => setEnabled(true));

    function render() {
      const dot = dotRef.current;
      const ring = ringRef.current;

      if (dot && ring) {
        const { x, y } = positionRef.current;
        const ringPosition = ringPositionRef.current;

        ringPosition.x += (x - ringPosition.x) * 0.2;
        ringPosition.y += (y - ringPosition.y) * 0.2;

        dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        ring.style.transform = `translate3d(${ringPosition.x}px, ${ringPosition.y}px, 0) translate(-50%, -50%)`;
      }

      frameRef.current = window.requestAnimationFrame(render);
    }

    function handlePointerMove(event: PointerEvent) {
      positionRef.current = { x: event.clientX, y: event.clientY };
      setVisible(true);

      const target = event.target;
      if (!(target instanceof Element)) {
        setMode("idle");
        return;
      }

      if (target.closest(TEXT_SELECTOR)) {
        setMode("text");
        return;
      }

      setMode(target.closest(INTERACTIVE_SELECTOR) ? "active" : "idle");
    }

    function handlePointerDown() {
      document.documentElement.classList.add("custom-cursor-pressed");
    }

    function handlePointerUp() {
      document.documentElement.classList.remove("custom-cursor-pressed");
    }

    function handlePointerLeave() {
      setVisible(false);
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", handlePointerLeave);
    frameRef.current = window.requestAnimationFrame(render);

    return () => {
      document.documentElement.classList.remove(
        "custom-cursor-ready",
        "custom-cursor-pressed"
      );
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      document.documentElement.removeEventListener("mouseleave", handlePointerLeave);

      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      className={`custom-cursor custom-cursor--${mode}${
        visible ? " custom-cursor--visible" : ""
      }`}
      aria-hidden="true"
    >
      <div ref={ringRef} className="custom-cursor__ring">
        <span />
      </div>
      <div ref={dotRef} className="custom-cursor__dot" />
    </div>
  );
}
