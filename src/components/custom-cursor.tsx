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
  const modeRef = useRef<CursorMode>("idle");
  const visibleRef = useRef(false);
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
      let shouldContinue = false;

      if (dot && ring) {
        const { x, y } = positionRef.current;
        const ringPosition = ringPositionRef.current;
        const distanceX = x - ringPosition.x;
        const distanceY = y - ringPosition.y;

        ringPosition.x += distanceX * 0.2;
        ringPosition.y += distanceY * 0.2;
        shouldContinue = Math.abs(distanceX) + Math.abs(distanceY) > 0.35;

        dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        ring.style.transform = `translate3d(${ringPosition.x}px, ${ringPosition.y}px, 0) translate(-50%, -50%)`;
      }

      frameRef.current = shouldContinue ? window.requestAnimationFrame(render) : null;
    }

    function scheduleRender() {
      if (frameRef.current === null && !document.hidden) {
        frameRef.current = window.requestAnimationFrame(render);
      }
    }

    function updateMode(nextMode: CursorMode) {
      if (modeRef.current === nextMode) return;
      modeRef.current = nextMode;
      setMode(nextMode);
    }

    function handlePointerMove(event: PointerEvent) {
      positionRef.current = { x: event.clientX, y: event.clientY };
      if (!visibleRef.current) {
        visibleRef.current = true;
        ringPositionRef.current = { x: event.clientX, y: event.clientY };
        setVisible(true);
      }
      scheduleRender();

      const target = event.target;
      if (!(target instanceof Element)) {
        updateMode("idle");
        return;
      }

      if (target.closest(TEXT_SELECTOR)) {
        updateMode("text");
        return;
      }

      updateMode(target.closest(INTERACTIVE_SELECTOR) ? "active" : "idle");
    }

    function handlePointerDown() {
      document.documentElement.classList.add("custom-cursor-pressed");
    }

    function handlePointerUp() {
      document.documentElement.classList.remove("custom-cursor-pressed");
    }

    function handlePointerLeave() {
      visibleRef.current = false;
      setVisible(false);
    }

    function handleVisibilityChange() {
      if (document.hidden && frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", handlePointerLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.documentElement.classList.remove(
        "custom-cursor-ready",
        "custom-cursor-pressed"
      );
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      document.documentElement.removeEventListener("mouseleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (frameRef.current !== null) {
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
