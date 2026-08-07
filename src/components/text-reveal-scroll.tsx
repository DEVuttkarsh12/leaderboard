"use client";

import {
  type CSSProperties,
  type ElementType,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
} from "react";

type RevealMode = "chars" | "words";

type TextRevealScrollProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  revealMode?: RevealMode;
  startOffset?: number;
  endOffset?: number;
  dimOpacity?: number;
};

function extractPlainText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractPlainText).join("");
  }

  if (typeof node === "object" && "props" in node) {
    return extractPlainText((node as { props?: { children?: ReactNode } }).props?.children);
  }

  return "";
}

function createSegment(text: string, dimOpacity: number): HTMLSpanElement {
  const span = document.createElement("span");
  span.textContent = text;
  span.style.display = "inline";
  span.style.opacity = String(dimOpacity);
  span.style.color = "inherit";
  span.style.willChange = "opacity";
  return span;
}

function processNodeRecursively(
  element: HTMLElement,
  revealMode: RevealMode,
  dimOpacity: number,
  segments: HTMLElement[]
): void {
  const originalChildren = Array.from(element.childNodes);

  for (const node of originalChildren) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";

      if (!text.length) {
        continue;
      }

      const fragment = document.createDocumentFragment();

      if (revealMode === "chars") {
        for (const char of text) {
          if (char === " ") {
            fragment.appendChild(document.createTextNode(" "));
            continue;
          }

          const span = createSegment(char, dimOpacity);
          fragment.appendChild(span);
          segments.push(span);
        }
      } else {
        const parts = text.split(/(\s+)/);

        for (const part of parts) {
          if (!part) {
            continue;
          }

          if (/^\s+$/.test(part)) {
            fragment.appendChild(document.createTextNode(part));
            continue;
          }

          const span = createSegment(part, dimOpacity);
          fragment.appendChild(span);
          segments.push(span);
        }
      }

      node.parentNode?.replaceChild(fragment, node);
      continue;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }

    const childElement = node as HTMLElement;

    if (childElement.tagName === "BR") {
      childElement.style.display = "inline";
      childElement.style.opacity = String(dimOpacity);
      childElement.style.color = "inherit";
      childElement.style.willChange = "opacity";
      segments.push(childElement);
      continue;
    }

    processNodeRecursively(childElement, revealMode, dimOpacity, segments);
  }
}

export default function TextRevealScroll({
  as: Tag = "div",
  children,
  className,
  style,
  revealMode = "words",
  startOffset = 90,
  endOffset = 30,
  dimOpacity = 0.2,
}: TextRevealScrollProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLElement | null>(null);
  const segmentsRef = useRef<HTMLElement[]>([]);
  const rafRef = useRef<number>(0);
  const visibleRef = useRef(false);
  const styleId = useId().replace(/:/g, "");
  const textFingerprint = useMemo(
    () => extractPlainText(children).replace(/\s+/g, " ").trim(),
    [children]
  );

  useEffect(() => {
    const root = rootRef.current;
    const textRoot = textRef.current;

    if (!root || !textRoot) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      return;
    }

    const segments: HTMLElement[] = [];
    textRoot.style.visibility = "hidden";
    processNodeRecursively(textRoot, revealMode, dimOpacity, segments);

    if (segments.length === 0) {
      textRoot.style.visibility = "visible";
      return;
    }

    segmentsRef.current = segments;
    textRoot.style.visibility = "visible";

    const computeReveal = () => {
      if (!visibleRef.current) {
        return;
      }

      const rect = root.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const startPx = viewportHeight * (startOffset / 100);
      const endPx = viewportHeight * (endOffset / 100);
      const totalRange = rect.height + (startPx - endPx);
      const scrolled = startPx - rect.top;
      const progress = Math.min(Math.max(scrolled / totalRange, 0), 1);
      const totalSegments = segmentsRef.current.length;
      const litCount = Math.floor(progress * totalSegments);

      segmentsRef.current.forEach((segment, index) => {
        if (index < litCount) {
          segment.style.opacity = "1";
        } else if (index === litCount) {
          const fractionalProgress = progress * totalSegments - litCount;
          segment.style.opacity = String(
            dimOpacity + fractionalProgress * (1 - dimOpacity)
          );
        } else {
          segment.style.opacity = String(dimOpacity);
        }
      });
    };

    const scheduleReveal = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = window.requestAnimationFrame(computeReveal);
    };

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        visibleRef.current = entries[0]?.isIntersecting ?? false;

        if (visibleRef.current) {
          scheduleReveal();
        }
      },
      {
        rootMargin: "200px 0px 200px 0px",
        threshold: 0,
      }
    );

    const scrollHandler = () => scheduleReveal();
    const resizeHandler = () => scheduleReveal();

    intersectionObserver.observe(root);
    window.addEventListener("scroll", scrollHandler, { passive: true });
    window.addEventListener("resize", resizeHandler, { passive: true });
    scheduleReveal();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      window.removeEventListener("scroll", scrollHandler);
      window.removeEventListener("resize", resizeHandler);
      intersectionObserver.disconnect();
      segmentsRef.current = [];
    };
  }, [dimOpacity, endOffset, revealMode, startOffset, textFingerprint]);

  return (
    <div ref={rootRef} style={{ width: "100%" }}>
      <Tag
        id={styleId}
        ref={textRef}
        className={className}
        style={{ color: "var(--text-primary)", ...style }}
        key={`${revealMode}-${textFingerprint}`}
      >
        {children}
      </Tag>
    </div>
  );
}
