"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

type AnimationStyle = "default" | "vortex" | "explosive" | "wave";

type VolcanoBackgroundProps = {
  skyColorTop?: string;
  skyColorBottom?: string;
  lavaColor?: string;
  glowColor?: string;
  meteorColor?: string;
  meteorCount?: number;
  eruptionIntensity?: number;
  starCount?: number;
  maxLavaParticles?: number;
  enableMeteors?: boolean;
  enableEmbers?: boolean;
  simulationSpeed?: number;
  animationStyle?: AnimationStyle;
};

type Star = {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleDir: number;
};

type Meteor = {
  x: number;
  y: number;
  speed: number;
  angle: number;
  size: number;
  tailLength: number;
  depth: number;
};

type LavaParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  decay: number;
  gravity: number;
};

type Ember = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  decay: number;
  depth: number;
};

function parseColor(value: string) {
  const normalized = value.trim();

  if (normalized.startsWith("#")) {
    let hex = normalized.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }

    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
    };
  }

  const match = normalized.match(/rgba?\(([^)]+)\)/);
  if (match) {
    const [r, g, b] = match[1].split(",").map((part) => Number.parseFloat(part));
    return { r, g, b };
  }

  return { r: 255, g: 69, b: 0 };
}

export default function VolcanoBackground({
  skyColorTop = "#0f0c29",
  skyColorBottom = "#302b63",
  lavaColor = "#ff4500",
  glowColor = "#ff4500",
  meteorColor = "#ffa500",
  meteorCount = 5,
  eruptionIntensity = 1,
  starCount = 50,
  maxLavaParticles = 300,
  enableMeteors = true,
  enableEmbers = true,
  simulationSpeed = 1,
  animationStyle = "default",
}: VolcanoBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    const context = canvas.getContext("2d");
    if (!context) return undefined;

    let animationFrameId: number | undefined;
    let intersectionObserver: IntersectionObserver | null = null;
    let isVisible = true;
    let lastTime = performance.now();
    let dpr = window.devicePixelRatio || 1;
    let lavaAccumulator = 0;
    let emberAccumulator = 0;

    const meteors: Meteor[] = [];
    const lavaParticles: LavaParticle[] = [];
    const stars: Star[] = [];
    const embers: Ember[] = [];

    const logicalWidth = () => (canvas.width || 1) / dpr;
    const logicalHeight = () => (canvas.height || 1) / dpr;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width > 0 ? rect.width : 800;
      const height = rect.height > 0 ? rect.height : 450;

      dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const createMeteor = (width: number): Meteor => {
      const depth = Math.random() * 0.7 + 0.3;
      const angle = Math.PI / 2 + (Math.random() - 0.5) * 1.5;

      return {
        x: Math.random() * (width + 800) - 400,
        y: -150,
        speed: (Math.random() * 15 + 10) * depth,
        angle,
        size: (Math.random() * 2 + 1.5) * depth,
        tailLength: (Math.random() * 200 + 120) * depth,
        depth,
      };
    };

    const createLavaParticle = (width: number, y?: number): LavaParticle => ({
      x: Math.random() * width,
      y: y ?? -20,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 2 + 2 + eruptionIntensity * 1.5,
      size: Math.random() * 2 + 1,
      life: 1,
      decay: Math.random() * 0.005 + 0.002,
      gravity: 0.15,
    });

    const createEmber = (width: number, height: number, y?: number): Ember => {
      const depth = Math.random() * 0.5 + 0.5;

      return {
        x: Math.random() * width,
        y: y ?? height * (0.6 + Math.random() * 0.4),
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.8 - 0.2,
        size: (Math.random() * 2 + 1) * depth,
        life: 1,
        decay: Math.random() * 0.01 + 0.004,
        depth,
      };
    };

    const spawnLava = (width: number) => {
      if (lavaParticles.length >= maxLavaParticles) return;
      lavaParticles.push(createLavaParticle(width));
      if (lavaParticles.length < maxLavaParticles) {
        lavaParticles.push(createLavaParticle(width));
      }
    };

    const render = () => {
      const now = performance.now();
      let delta = ((now - lastTime) / 16.67) * simulationSpeed;
      if (delta > 5) delta = 5;
      lastTime = now;

      const width = logicalWidth();
      const height = logicalHeight();

      if (width === 0 || height === 0) {
        if (isVisible) animationFrameId = requestAnimationFrame(render);
        return;
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.globalAlpha = 1;
      context.clearRect(0, 0, width, height);

      const driftStrength = eruptionIntensity * 0.5;
      const time = now * 0.002;
      const offsetX = Math.sin(time * 0.7) * driftStrength;
      const offsetY = Math.cos(time * 0.9) * driftStrength * 0.6;
      const glowBase = parseColor(glowColor);
      const lavaBase = parseColor(lavaColor);

      context.save();
      context.translate(offsetX, offsetY);

      const gradient = context.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, skyColorTop);
      gradient.addColorStop(0.35, "#050414");
      gradient.addColorStop(0.7, "#1a0b20");
      gradient.addColorStop(1, skyColorBottom);
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      const haze = context.createLinearGradient(0, height * 0.45, 0, height);
      haze.addColorStop(0, "rgba(255, 140, 80, 0)");
      haze.addColorStop(0.6, `rgba(${glowBase.r}, ${glowBase.g}, ${glowBase.b}, 0.2)`);
      haze.addColorStop(1, `rgba(${glowBase.r}, ${glowBase.g}, ${glowBase.b}, 0.4)`);
      context.fillStyle = haze;
      context.fillRect(0, height * 0.45, width, height * 0.55);

      const fog = context.createLinearGradient(0, height * 0.75, 0, height);
      fog.addColorStop(0, "rgba(255, 255, 255, 0)");
      fog.addColorStop(1, "rgba(255, 200, 160, 0.18)");
      context.fillStyle = fog;
      context.fillRect(0, height * 0.75, width, height * 0.25);

      context.fillStyle = "#FFFFFF";
      for (const star of stars) {
        star.opacity += star.twinkleSpeed * star.twinkleDir * delta;
        if (star.opacity > 1 || star.opacity < 0.2) star.twinkleDir *= -1;
        context.globalAlpha = Math.max(0, Math.min(1, star.opacity));
        context.beginPath();
        context.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;

      lavaAccumulator += delta * 0.9 * eruptionIntensity;
      while (lavaAccumulator > 1) {
        spawnLava(width);
        lavaAccumulator -= 1;
      }

      for (let index = lavaParticles.length - 1; index >= 0; index -= 1) {
        const particle = lavaParticles[index];
        let vx = particle.vx;
        let vy = particle.vy;

        if (animationStyle === "vortex") {
          const dx = particle.x - width * 0.5;
          const dy = particle.y - height * 0.6;
          const swirl = 0.002 * eruptionIntensity;
          vx += -dy * swirl;
          vy += dx * swirl;
        } else if (animationStyle === "explosive") {
          const dx = particle.x - width * 0.5;
          const dy = particle.y - height;
          const accel = 0.0008 * eruptionIntensity;
          vx += dx * accel * delta * 60;
          vy += dy * accel * delta * 60;
        } else if (animationStyle === "wave") {
          vy += Math.sin((particle.x / width) * Math.PI * 4 + time * 2) * 0.25;
        }

        particle.x += vx * delta;
        particle.y += vy * delta;
        vy += particle.gravity * delta;
        particle.vx = vx;
        particle.vy = vy;
        particle.life -= particle.decay * delta;

        if (particle.life <= 0 || particle.y > height + 50) {
          lavaParticles.splice(index, 1);
          continue;
        }

        const lifeRatio = Math.max(0, particle.life);
        const stretch = 1 + Math.min(particle.vy * 0.15, 2);
        const centerR = Math.min(255, lavaBase.r + 80);
        const centerG = Math.min(255, lavaBase.g + 80);
        const centerB = Math.min(255, lavaBase.b + 80);

        context.save();
        context.translate(particle.x, particle.y);
        context.scale(1 / Math.sqrt(stretch), stretch);

        const particleGlow = context.createRadialGradient(0, 0, 0, 0, 0, particle.size * 2.5);
        particleGlow.addColorStop(0, `rgba(${centerR}, ${centerG}, ${centerB}, ${lifeRatio})`);
        particleGlow.addColorStop(0.3, `rgba(${lavaBase.r}, ${lavaBase.g}, ${lavaBase.b}, ${lifeRatio * 0.9})`);
        particleGlow.addColorStop(1, `rgba(${lavaBase.r}, ${lavaBase.g}, ${lavaBase.b}, 0)`);
        context.fillStyle = particleGlow;
        context.beginPath();
        context.arc(0, 0, particle.size * 2.5, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }

      if (enableEmbers) {
        emberAccumulator += delta * 0.4 * eruptionIntensity;
        while (emberAccumulator > 1) {
          embers.push(createEmber(width, height));
          emberAccumulator -= 1;
        }
      }

      for (let index = embers.length - 1; index >= 0; index -= 1) {
        const ember = embers[index];
        let vx = ember.vx;
        let vy = ember.vy;

        if (animationStyle === "vortex") {
          const dx = ember.x - width * 0.5;
          const dy = ember.y - height * 0.7;
          const swirl = 0.002 * eruptionIntensity;
          vx += -dy * swirl;
          vy += dx * swirl;
        } else if (animationStyle === "explosive") {
          const dx = ember.x - width * 0.5;
          const dy = ember.y - height;
          const accel = 0.0006 * eruptionIntensity;
          vx += dx * accel * delta * 60;
          vy += dy * accel * delta * 60;
        } else if (animationStyle === "wave") {
          vx += Math.sin((ember.y / height) * Math.PI * 3 + time * 1.5) * 0.2;
        }

        ember.x += vx * delta;
        ember.y += vy * delta;
        ember.vx = vx;
        ember.vy = vy;
        ember.life -= ember.decay * delta;

        if (ember.life <= 0 || ember.y < height * 0.3) {
          embers.splice(index, 1);
          continue;
        }

        context.fillStyle = `rgba(255, ${150 + ember.depth * 80}, 80, ${Math.max(0, ember.life) * 0.9})`;
        context.beginPath();
        context.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
        context.fill();
      }

      if (!enableMeteors) {
        meteors.length = 0;
      } else {
        while (meteors.length < meteorCount) {
          meteors.push(createMeteor(width));
        }

        for (let index = meteors.length - 1; index >= 0; index -= 1) {
          const meteor = meteors[index];
          let dx = Math.cos(meteor.angle) * meteor.speed;
          let dy = Math.sin(meteor.angle) * meteor.speed;

          if (animationStyle === "vortex") {
            const mx = meteor.x - width * 0.5;
            const my = meteor.y - height * 0.4;
            const swirl = 0.003 * meteor.depth;
            dx += -my * swirl;
            dy += mx * swirl;
          } else if (animationStyle === "explosive") {
            const mx = meteor.x - width * 0.5;
            const my = meteor.y - height;
            const accel = 0.0007 * eruptionIntensity;
            dx += mx * accel * delta * 60;
            dy += my * accel * delta * 60;
          } else if (animationStyle === "wave") {
            dy += Math.sin((meteor.x / width) * Math.PI * 2 + time * 3) * 8;
          }

          meteor.x += dx * delta;
          meteor.y += dy * delta;

          if (meteor.y > height + 200 || meteor.x < -200 || meteor.x > width + 200) {
            meteors.splice(index, 1);
            continue;
          }

          const tailGradient = context.createLinearGradient(
            meteor.x,
            meteor.y,
            meteor.x - Math.cos(meteor.angle) * meteor.tailLength,
            meteor.y - Math.sin(meteor.angle) * meteor.tailLength
          );
          tailGradient.addColorStop(0, meteorColor);
          tailGradient.addColorStop(0.3, "rgba(255,255,255,0.85)");
          tailGradient.addColorStop(1, "rgba(0,0,0,0)");
          context.strokeStyle = tailGradient;
          context.lineWidth = meteor.size;
          context.lineCap = "round";
          context.beginPath();
          context.moveTo(meteor.x, meteor.y);
          context.lineTo(
            meteor.x - Math.cos(meteor.angle) * meteor.tailLength,
            meteor.y - Math.sin(meteor.angle) * meteor.tailLength
          );
          context.stroke();
          context.fillStyle = "#FFFFFF";
          context.shadowBlur = 18;
          context.shadowColor = meteorColor;
          context.beginPath();
          context.arc(meteor.x, meteor.y, meteor.size * 1.4, 0, Math.PI * 2);
          context.fill();
          context.shadowBlur = 0;
        }
      }

      context.restore();

      if (isVisible) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        animationFrameId = undefined;
      }
    };

    resize();

    for (let index = 0; index < starCount; index += 1) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.7,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random(),
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleDir: 1,
      });
    }

    const initWidth = logicalWidth();
    const initHeight = logicalHeight();

    for (let index = 0; index < meteorCount; index += 1) {
      meteors.push({ ...createMeteor(initWidth), y: Math.random() * initHeight });
    }

    const initialLavaCount = Math.min(maxLavaParticles, 150 * eruptionIntensity);
    for (let index = 0; index < initialLavaCount; index += 1) {
      lavaParticles.push(createLavaParticle(initWidth, Math.random() * initHeight));
    }

    if (enableEmbers) {
      const initialEmberCount = 50 * eruptionIntensity;
      for (let index = 0; index < initialEmberCount; index += 1) {
        embers.push(createEmber(initWidth, initHeight, initHeight * (0.6 + Math.random() * 0.4)));
      }
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = Boolean(entry?.isIntersecting);

        if (!isVisible && animationFrameId !== undefined) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = undefined;
          return;
        }

        if (isVisible && animationFrameId === undefined) {
          lastTime = performance.now();
          animationFrameId = requestAnimationFrame(render);
        }
      },
      { threshold: 0.01 }
    );
    intersectionObserver.observe(container);

    render();

    return () => {
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    animationStyle,
    enableEmbers,
    enableMeteors,
    eruptionIntensity,
    glowColor,
    lavaColor,
    maxLavaParticles,
    meteorColor,
    meteorCount,
    simulationSpeed,
    skyColorBottom,
    skyColorTop,
    starCount,
  ]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="volcano-background"
      style={{ backgroundColor: skyColorBottom }}
    >
      <canvas ref={canvasRef} />
    </motion.div>
  );
}
