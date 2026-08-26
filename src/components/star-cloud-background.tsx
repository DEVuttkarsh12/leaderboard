"use client";

import { useEffect, useRef } from "react";

type Shard = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  spin: number;
  size: number;
  hue: number;
  alpha: number;
  arms: number;
};

type Ember = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
};

type StarCloudBackgroundProps = {
  shardCount?: number;
};

function seededUnit(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function makeShard(index: number, width: number, height: number, resetFromTop = false): Shard {
  const depth = seededUnit(index + 71);
  const speed = 0.35 + seededUnit(index + 17) * 1.4;

  return {
    x: seededUnit(index + 1) * width,
    y: resetFromTop ? -30 - seededUnit(index + 9) * height * 0.18 : seededUnit(index + 5) * height,
    z: depth,
    vx: (seededUnit(index + 23) - 0.5) * 0.6,
    vy: speed + depth * 1.6,
    spin: seededUnit(index + 31) * Math.PI * 2,
    size: 5 + seededUnit(index + 43) * 18,
    hue: seededUnit(index + 53),
    alpha: 0.26 + seededUnit(index + 61) * 0.5,
    arms: 3 + Math.floor(seededUnit(index + 83) * 4),
  };
}

function makeEmber(index: number, width: number, height: number, resetFromBottom = false): Ember {
  const hue = seededUnit(index + 303);

  return {
    x: seededUnit(index + 211) * width,
    y: resetFromBottom ? height + 20 : seededUnit(index + 223) * height,
    vx: (seededUnit(index + 227) - 0.5) * 0.35,
    vy: -(0.15 + seededUnit(index + 229) * 0.75),
    size: 0.8 + seededUnit(index + 233) * 2.4,
    alpha: 0.16 + seededUnit(index + 239) * 0.46,
    color: hue > 0.66 ? "255, 79, 139" : hue > 0.38 ? "84, 197, 255" : "217, 255, 58",
  };
}

export default function StarCloudBackground({ shardCount = 130 }: StarCloudBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const shardsRef = useRef<Shard[]>([]);
  const embersRef = useRef<Ember[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return undefined;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let lastTime = performance.now();

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      shardsRef.current = Array.from({ length: shardCount }, (_, index) =>
        makeShard(index, width, height)
      );
      embersRef.current = Array.from({ length: 80 }, (_, index) =>
        makeEmber(index, width, height)
      );
    };

    const drawShard = (shard: Shard) => {
      const depthScale = 0.45 + shard.z * 1.25;
      const size = shard.size * depthScale;
      const color = shard.hue > 0.72 ? "255, 92, 162" : shard.hue > 0.42 ? "84, 197, 255" : "255, 233, 64";

      context.save();
      context.translate(shard.x, shard.y);
      context.rotate(shard.spin);
      context.globalAlpha = shard.alpha * depthScale;
      context.strokeStyle = `rgba(${color}, 0.9)`;
      context.fillStyle = `rgba(${color}, 0.22)`;
      context.lineWidth = Math.max(0.8, depthScale * 1.4);
      context.shadowColor = `rgba(${color}, 0.72)`;
      context.shadowBlur = 12 * depthScale;

      context.beginPath();
      for (let i = 0; i < shard.arms; i += 1) {
        const angle = (Math.PI * 2 * i) / shard.arms;
        const inner = size * (0.16 + (i % 2) * 0.06);
        const outer = size * (0.48 + (i % 3) * 0.12);
        context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
        context.lineTo(Math.cos(angle + 0.1) * outer, Math.sin(angle + 0.1) * outer);
      }
      context.stroke();

      context.beginPath();
      context.arc(0, 0, Math.max(1.1, size * 0.08), 0, Math.PI * 2);
      context.fill();
      context.restore();
    };

    const drawBackfield = (time: number) => {
      context.save();
      for (let index = 0; index < 70; index += 1) {
        const x = seededUnit(index + 401) * width;
        const y = seededUnit(index + 409) * height * 0.82;
        const twinkle = 0.12 + (Math.sin(time * 0.001 + index) * 0.5 + 0.5) * 0.36;
        context.globalAlpha = twinkle;
        context.fillStyle = index % 5 === 0 ? "#D9FF3A" : index % 7 === 0 ? "#46C7FF" : "#FFFFFF";
        context.beginPath();
        context.arc(x, y, 0.55 + seededUnit(index + 419) * 1.1, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    };

    const drawEmbers = (delta: number) => {
      for (let index = 0; index < embersRef.current.length; index += 1) {
        const ember = embersRef.current[index];
        ember.x += ember.vx * delta;
        ember.y += ember.vy * delta;
        ember.alpha -= 0.0016 * delta;

        if (ember.y < height * 0.18 || ember.alpha <= 0 || ember.x < -20 || ember.x > width + 20) {
          embersRef.current[index] = makeEmber(index + Math.floor(performance.now()), width, height, true);
          continue;
        }

        context.save();
        context.globalAlpha = ember.alpha;
        context.fillStyle = `rgba(${ember.color}, 0.92)`;
        context.shadowColor = `rgba(${ember.color}, 0.8)`;
        context.shadowBlur = 10;
        context.beginPath();
        context.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
    };

    const render = (time: number) => {
      const delta = Math.min(32, time - lastTime) / 16.67;
      lastTime = time;

      context.clearRect(0, 0, width, height);
      context.fillStyle = "#000";
      context.fillRect(0, 0, width, height);
      drawBackfield(time);

      const pointer = pointerRef.current;
      const driftX = pointer.active ? (pointer.x / Math.max(width, 1) - 0.5) * 0.45 : 0;

      for (let index = 0; index < shardsRef.current.length; index += 1) {
        const shard = shardsRef.current[index];
        shard.x += (shard.vx + driftX * (0.4 + shard.z)) * delta;
        shard.y += shard.vy * delta;
        shard.spin += (0.006 + shard.z * 0.018) * delta;

        if (shard.y > height + 60 || shard.x < -80 || shard.x > width + 80) {
          shardsRef.current[index] = makeShard(index + Math.floor(time), width, height, true);
        } else {
          context.save();
          context.globalAlpha = 0.1 + shard.z * 0.18;
          context.strokeStyle = shard.hue > 0.72 ? "rgba(255, 79, 139, 0.58)" : shard.hue > 0.42 ? "rgba(84, 197, 255, 0.5)" : "rgba(217, 255, 58, 0.5)";
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(shard.x - shard.vx * 18, shard.y - shard.vy * 9);
          context.lineTo(shard.x, shard.y);
          context.stroke();
          context.restore();
          drawShard(shard);
        }
      }

      drawEmbers(delta);

      animationRef.current = requestAnimationFrame(render);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY, active: true };
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [shardCount]);

  return <canvas ref={canvasRef} className="star-cloud-background" />;
}
