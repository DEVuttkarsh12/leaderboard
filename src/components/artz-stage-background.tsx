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

type AmbientBloom = {
  x: number;
  y: number;
  radius: number;
  phase: number;
  speed: number;
  drift: number;
  core: string;
  edge: string;
};

type Glint = {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
  opacity: number;
  tone: "gold" | "pink" | "violet";
};

const TAU = Math.PI * 2;

const AMBIENT_BLOOMS: AmbientBloom[] = [
  {
    x: 0.18,
    y: 0.28,
    radius: 0.38,
    phase: 0.4,
    speed: 0.13,
    drift: 0.052,
    core: "rgba(255, 52, 169, 0.19)",
    edge: "rgba(133, 40, 197, 0.045)",
  },
  {
    x: 0.82,
    y: 0.42,
    radius: 0.42,
    phase: 2.1,
    speed: 0.1,
    drift: 0.045,
    core: "rgba(141, 67, 255, 0.18)",
    edge: "rgba(255, 71, 177, 0.04)",
  },
  {
    x: 0.54,
    y: 0.78,
    radius: 0.48,
    phase: 4.3,
    speed: 0.08,
    drift: 0.035,
    core: "rgba(255, 136, 57, 0.12)",
    edge: "rgba(166, 59, 222, 0.035)",
  },
];

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

function createGlints(width: number, height: number) {
  const count = Math.max(13, Math.min(28, Math.round(width / 58)));

  return Array.from({ length: count }, (_, index): Glint => ({
    x: ((index * 149 + 67) % 983) / 983 * width,
    y: ((index * 211 + 101) % 977) / 977 * height,
    size: 1.8 + ((index * 19) % 34) / 10,
    speed: 1.2 + ((index * 23) % 30) / 10,
    phase: ((index * 71) % 360) * (Math.PI / 180),
    opacity: 0.18 + ((index * 11) % 28) / 100,
    tone: index % 6 === 0 ? "gold" : index % 3 === 0 ? "pink" : "violet",
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
  const baseline = height * options.baseline
    + Math.sin(time * 0.22 + options.offset) * Math.max(3, height * 0.007);
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

function drawAmbientBloom(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  pointerX: number,
  pointerY: number,
  bloom: AmbientBloom
) {
  const minDimension = Math.min(width, height);
  const breath = 0.94 + Math.sin(time * bloom.speed * 2.2 + bloom.phase) * 0.08;
  const radius = Math.max(minDimension * bloom.radius, 220) * breath;
  const x = width * (
    bloom.x
    + Math.sin(time * bloom.speed + bloom.phase) * bloom.drift
    + pointerX * 0.025
  );
  const y = height * (
    bloom.y
    + Math.cos(time * bloom.speed * 0.82 + bloom.phase) * bloom.drift * 0.72
    + pointerY * 0.016
  );
  const glow = context.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, bloom.core);
  glow.addColorStop(0.46, bloom.edge);
  glow.addColorStop(1, "rgba(5, 0, 12, 0)");

  context.save();
  context.globalCompositeOperation = "screen";
  context.fillStyle = glow;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  context.restore();
}

function drawAuroraVeil(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  pointerX: number,
  options: {
    y: number;
    phase: number;
    speed: number;
    color: string;
    highlight: string;
    reverse?: boolean;
  }
) {
  const direction = options.reverse ? -1 : 1;
  const drift = Math.sin(time * options.speed + options.phase) * height * 0.035;
  const y = height * options.y + drift;
  const gradient = context.createLinearGradient(0, y, width, y + height * 0.08);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.28, options.color);
  gradient.addColorStop(0.58, options.highlight);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  context.save();
  context.globalCompositeOperation = "screen";
  context.strokeStyle = gradient;
  context.lineCap = "round";
  context.lineWidth = Math.max(28, Math.min(width, height) * 0.055);
  context.globalAlpha = 0.2;
  context.shadowColor = options.highlight;
  context.shadowBlur = 52;
  context.beginPath();
  context.moveTo(-width * 0.12, y + direction * height * 0.08);
  context.bezierCurveTo(
    width * 0.2,
    y - direction * height * 0.12 + pointerX * 22,
    width * 0.66,
    y + direction * height * 0.11 - pointerX * 18,
    width * 1.12,
    y - direction * height * 0.04
  );
  context.stroke();

  context.globalAlpha = 0.3;
  context.shadowBlur = 24;
  context.lineWidth = 1.15;
  context.stroke();
  context.restore();
}

function drawGlint(
  context: CanvasRenderingContext2D,
  glint: Glint,
  time: number
) {
  const twinkle = Math.pow(Math.max(0, Math.sin(time * 0.72 + glint.phase)), 5);
  const alpha = glint.opacity * (0.42 + twinkle * 1.08);
  const size = glint.size * (0.88 + twinkle * 0.52);
  const color = glint.tone === "gold"
    ? "rgba(255, 199, 99, 0.96)"
    : glint.tone === "pink"
      ? "rgba(255, 92, 190, 0.95)"
      : "rgba(197, 132, 255, 0.9)";

  context.save();
  context.translate(glint.x, glint.y);
  context.globalCompositeOperation = "screen";
  context.globalAlpha = alpha;
  context.strokeStyle = color;
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = 16 + size * 3.1;
  context.lineCap = "round";
  context.lineWidth = 0.72;
  context.beginPath();
  context.moveTo(-size * 1.55, 0);
  context.lineTo(size * 1.55, 0);
  context.moveTo(0, -size * 2.35);
  context.lineTo(0, size * 2.35);
  context.stroke();
  context.globalAlpha = alpha * 0.42;
  context.rotate(Math.PI / 4);
  context.beginPath();
  context.moveTo(-size * 0.9, 0);
  context.lineTo(size * 0.9, 0);
  context.moveTo(0, -size * 0.9);
  context.lineTo(0, size * 0.9);
  context.stroke();
  context.fillRect(-size * 0.43, -size * 0.43, size * 0.86, size * 0.86);
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
    let glints: Glint[] = [];
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
      glints = createGlints(width, height);
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

      const centerGlowPulse = 0.96 + Math.sin(time * 0.28) * 0.055;
      const centerGlow = context.createRadialGradient(
        width * (0.5 + pointer.x * 0.018),
        height * (0.43 + pointer.y * 0.012),
        0,
        width * 0.5,
        height * 0.48,
        Math.max(width, height) * 0.54 * centerGlowPulse
      );
      centerGlow.addColorStop(0, "rgba(150, 38, 181, 0.29)");
      centerGlow.addColorStop(0.48, "rgba(87, 12, 111, 0.13)");
      centerGlow.addColorStop(1, "rgba(4, 0, 10, 0)");
      context.fillStyle = centerGlow;
      context.fillRect(0, 0, width, height);

      for (const bloom of AMBIENT_BLOOMS) {
        drawAmbientBloom(context, width, height, time, pointer.x, pointer.y, bloom);
      }

      drawAuroraVeil(context, width, height, time, pointer.x, {
        y: 0.26,
        phase: 0.7,
        speed: 0.09,
        color: "rgba(149, 61, 231, 0.11)",
        highlight: "rgba(255, 63, 172, 0.13)",
      });
      drawAuroraVeil(context, width, height, time, pointer.x, {
        y: 0.62,
        phase: 3.2,
        speed: 0.075,
        color: "rgba(255, 119, 48, 0.075)",
        highlight: "rgba(177, 61, 224, 0.11)",
        reverse: true,
      });

      for (const glint of glints) {
        if (!reduceMotion) {
          glint.y -= glint.speed * delta;
          glint.x += Math.sin(time * 0.16 + glint.phase) * delta * 0.4;
          if (glint.y < -16) {
            glint.y = height + 16;
          }
        }
        drawGlint(context, glint, time);
      }

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
        context.shadowBlur = ember.radius * 8;
        context.fill();

        if (ember.radius > 1.55) {
          context.save();
          context.globalAlpha = 0.24 * pulse;
          context.strokeStyle = color;
          context.lineWidth = Math.max(0.7, ember.radius * 0.48);
          context.lineCap = "round";
          context.beginPath();
          context.moveTo(ember.x, ember.y + ember.radius * 2);
          context.lineTo(ember.x, ember.y + ember.radius * 7);
          context.stroke();
          context.restore();
        }
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
