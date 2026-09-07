"use client";

import { useEffect, useRef } from "react";

type Ember = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  sway: number;
  phase: number;
  opacity: number;
  tone: "gold" | "pink" | "violet";
};

const TAU = Math.PI * 2;

function createEmbers(width: number, height: number) {
  const count = Math.max(24, Math.min(58, Math.round(width / 30)));

  return Array.from({ length: count }, (_, index): Ember => ({
    x: ((index * 83 + 41) % 997) / 997 * width,
    y: ((index * 137 + 79) % 991) / 991 * height,
    radius: 0.8 + ((index * 17) % 18) / 10,
    speed: 4 + ((index * 31) % 15),
    sway: 5 + ((index * 29) % 18),
    phase: ((index * 47) % 360) * (Math.PI / 180),
    opacity: 0.18 + ((index * 13) % 35) / 100,
    tone: index % 7 === 0 ? "pink" : index % 5 === 0 ? "violet" : "gold",
  }));
}

function drawWave(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  pointerX: number,
  options: {
    baseline: number;
    amplitude: number;
    speed: number;
    frequency: number;
    offset: number;
    top: string;
    bottom: string;
    glow: string;
  }
) {
  const baseline = height * options.baseline;
  const gradient = context.createLinearGradient(0, baseline - options.amplitude, 0, height);
  gradient.addColorStop(0, options.top);
  gradient.addColorStop(1, options.bottom);

  context.save();
  context.beginPath();
  context.moveTo(-80, height + 80);

  for (let x = -80; x <= width + 80; x += 18) {
    const normalizedX = x / Math.max(1, width);
    const y = baseline
      + Math.sin(normalizedX * TAU * options.frequency + time * options.speed + options.offset) * options.amplitude
      + Math.sin(normalizedX * TAU * 1.37 - time * options.speed * 0.58) * options.amplitude * 0.34
      + pointerX * (normalizedX - 0.5) * 18;
    context.lineTo(x, y);
  }

  context.lineTo(width + 80, height + 80);
  context.closePath();
  context.fillStyle = gradient;
  context.shadowColor = options.glow;
  context.shadowBlur = 28;
  context.fill();

  context.shadowBlur = 0;
  context.strokeStyle = options.glow;
  context.globalAlpha = 0.3;
  context.lineWidth = 1.25;
  context.stroke();
  context.restore();
}

export default function ArtzStageBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrame = 0;
    let lastTime = window.performance.now();
    let embers: Ember[] = [];
    const pointer = { x: 0, y: 0 };
    const pointerTarget = { x: 0, y: 0 };

    const resize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 1.65);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      embers = createEmbers(width, height);
    };

    const draw = (now: number) => {
      const delta = Math.min(40, now - lastTime) / 1000;
      const time = now / 1000;
      lastTime = now;
      pointer.x += (pointerTarget.x - pointer.x) * 0.035;
      pointer.y += (pointerTarget.y - pointer.y) * 0.035;

      const sky = context.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#07000f");
      sky.addColorStop(0.48, "#100019");
      sky.addColorStop(1, "#19041f");
      context.fillStyle = sky;
      context.fillRect(0, 0, width, height);

      const centerGlow = context.createRadialGradient(
        width * (0.5 + pointer.x * 0.018),
        height * 0.43,
        0,
        width * 0.5,
        height * 0.48,
        Math.max(width, height) * 0.54
      );
      centerGlow.addColorStop(0, "rgba(102, 30, 141, 0.2)");
      centerGlow.addColorStop(0.48, "rgba(69, 8, 85, 0.08)");
      centerGlow.addColorStop(1, "rgba(4, 0, 10, 0)");
      context.fillStyle = centerGlow;
      context.fillRect(0, 0, width, height);

      for (const ember of embers) {
        if (!reduceMotion) {
          ember.y -= ember.speed * delta;
          ember.x += Math.sin(time * 0.42 + ember.phase) * ember.sway * delta * 0.18;
          if (ember.y < -18) {
            ember.y = height + 18;
          }
        }

        const pulse = 0.72 + Math.sin(time * 1.15 + ember.phase) * 0.28;
        const color = ember.tone === "pink"
          ? `rgba(255, 64, 174, ${ember.opacity * pulse})`
          : ember.tone === "violet"
            ? `rgba(172, 93, 255, ${ember.opacity * pulse})`
            : `rgba(255, 169, 66, ${ember.opacity * pulse})`;
        context.beginPath();
        context.arc(ember.x, ember.y, ember.radius * pulse, 0, TAU);
        context.fillStyle = color;
        context.shadowColor = color;
        context.shadowBlur = ember.radius * 6;
        context.fill();
      }

      context.shadowBlur = 0;
      drawWave(context, width, height, time, pointer.x, {
        baseline: 0.82,
        amplitude: Math.max(16, height * 0.025),
        speed: 0.18,
        frequency: 1.2,
        offset: 0.8,
        top: "rgba(92, 28, 142, 0.44)",
        bottom: "rgba(24, 4, 47, 0.88)",
        glow: "rgba(159, 77, 255, 0.38)",
      });
      drawWave(context, width, height, time, pointer.x, {
        baseline: 0.87,
        amplitude: Math.max(20, height * 0.034),
        speed: -0.14,
        frequency: 1.45,
        offset: 2.2,
        top: "rgba(188, 43, 151, 0.28)",
        bottom: "rgba(15, 1, 29, 0.96)",
        glow: "rgba(255, 71, 177, 0.3)",
      });
      drawWave(context, width, height, time, pointer.x, {
        baseline: 0.92,
        amplitude: Math.max(23, height * 0.044),
        speed: 0.1,
        frequency: 1.1,
        offset: 4.1,
        top: "rgba(75, 27, 120, 0.5)",
        bottom: "rgba(7, 0, 15, 1)",
        glow: "rgba(119, 59, 202, 0.3)",
      });

      if (!reduceMotion) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerTarget.x = event.clientX / Math.max(1, width) - 0.5;
      pointerTarget.y = event.clientY / Math.max(1, height) - 0.5;
    };

    resize();
    draw(lastTime);
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="artz-stage-background" aria-hidden="true" />;
}
