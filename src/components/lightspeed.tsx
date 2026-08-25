"use client";

import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import "./lightspeed.css";

const vertex = `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform vec2 uPointer;
uniform vec2 uOrigin;
uniform float uTime;
uniform float uClickTime;
uniform float uSpeed;
uniform float uOpacity;
uniform vec3 uPrimary;
uniform vec3 uSecondary;
uniform vec3 uAccent;

out vec4 fragColor;

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 res = uResolution;
  vec2 origin = uOrigin * res;
  vec2 uv = (gl_FragCoord.xy - origin) / min(res.x, res.y);
  vec2 pointer = (uPointer - uOrigin) * vec2(res.x / min(res.x, res.y), res.y / min(res.x, res.y));
  uv -= pointer * 0.18;

  float t = uTime * uSpeed;
  float clickAge = max(0.0, uTime - uClickTime);
  float clickPulse = exp(-clickAge * 2.4);
  float tunnelPulse = sin(clickAge * 18.0) * clickPulse;

  float r = length(uv);
  float a = atan(uv.y, uv.x);
  float vortex = sin(t * 0.45 + r * 4.0) * 0.08;
  vec2 p = rot(vortex + tunnelPulse * 0.08) * uv;
  r = length(p);
  a = atan(p.y, p.x);

  vec3 color = vec3(0.0);
  float alpha = 0.0;

  float centerGlow = exp(-r * 3.8) * 0.32;
  color += mix(uSecondary, uPrimary, 0.55 + 0.45 * sin(t)) * centerGlow;
  alpha += centerGlow * 0.46;

  for (int i = 0; i < 24; i++) {
    float id = float(i);
    float seed = hash(id * 19.91);
    float lane = (id / 24.0) * 6.28318530718;
    float laneWave = sin(t * (0.28 + seed * 0.4) + seed * 8.0) * 0.12;
    float laneAngle = lane + laneWave + tunnelPulse * (0.25 + seed * 0.25);
    float angularDist = abs(atan(sin(a - laneAngle), cos(a - laneAngle)));
    float width = mix(0.0025, 0.011, seed) * (1.0 + clickPulse * 1.4);

    float radialPhase = fract(r * mix(1.8, 4.2, seed) - t * mix(0.45, 1.25, seed));
    float head = smoothstep(0.0, 0.22, radialPhase) * smoothstep(1.0, 0.62, radialPhase);
    float streak = exp(-angularDist * angularDist / max(width * width, 0.000001)) * head;
    streak *= smoothstep(0.03, 0.18, r) * smoothstep(1.24, 0.2, r);

    vec3 laneColor = mix(uPrimary, uSecondary, seed);
    laneColor = mix(laneColor, uAccent, smoothstep(0.72, 1.0, hash(seed * 91.0)));
    color += laneColor * streak * (1.1 + seed * 2.8);
    alpha += streak * (0.42 + seed * 0.4);
  }

  vec2 cell = floor(gl_FragCoord.xy / 3.0);
  float grain = (hash2(cell + floor(uTime * 12.0)) - 0.5) * 0.02;
  color += grain;

  float vignette = smoothstep(1.25, 0.25, r);
  color *= 0.65 + vignette * 0.75 + clickPulse * 0.38;
  alpha = clamp(alpha * vignette + clickPulse * exp(-r * 3.0) * 0.35, 0.0, 1.0);

  fragColor = vec4(color * uOpacity, alpha * uOpacity);
}
`;

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];

  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ];
};

type LightspeedProps = {
  className?: string;
  speed?: number;
  opacity?: number;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  interactive?: boolean;
  maxFps?: number;
  startDelayMs?: number;
};

export default function Lightspeed({
  className = "",
  speed = 0.82,
  opacity = 0.9,
  primaryColor = "#ffe02a",
  secondaryColor = "#46c7ff",
  accentColor = "#ff4f8b",
  interactive = true,
  maxFps = 30,
  startDelayMs = 1100,
}: LightspeedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef({
    speed,
    opacity,
    primaryColor,
    secondaryColor,
    accentColor,
    interactive,
    maxFps,
    startDelayMs,
  });

  useEffect(() => {
    propsRef.current = {
      speed,
      opacity,
      primaryColor,
      secondaryColor,
      accentColor,
      interactive,
      maxFps,
      startDelayMs,
    };
  }, [speed, opacity, primaryColor, secondaryColor, accentColor, interactive, maxFps, startDelayMs]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const initialProps = propsRef.current;

    const renderer = new Renderer({
      webgl: 2,
      alpha: true,
      antialias: false,
      dpr: 1,
      powerPreference: "low-power",
    });

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uResolution: { value: new Float32Array([1, 1]) },
        uPointer: { value: new Float32Array([0.5, 0.5]) },
        uOrigin: { value: new Float32Array([0.5, 0.52]) },
        uTime: { value: 0 },
        uClickTime: { value: -20 },
        uSpeed: { value: initialProps.speed },
        uOpacity: { value: initialProps.opacity },
        uPrimary: { value: new Float32Array(hexToRgb(initialProps.primaryColor)) },
        uSecondary: { value: new Float32Array(hexToRgb(initialProps.secondaryColor)) },
        uAccent: { value: new Float32Array(hexToRgb(initialProps.accentColor)) },
      },
    });

    const mesh = new Mesh(gl, {
      geometry: new Triangle(gl),
      program,
    });

    const setSize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height);
      const resolution = program.uniforms.uResolution.value as Float32Array;
      resolution[0] = gl.drawingBufferWidth;
      resolution[1] = gl.drawingBufferHeight;

      const origin = program.uniforms.uOrigin.value as Float32Array;
      const sidebarWidth = window.innerWidth > 980 ? 236 : 0;
      origin[0] = (sidebarWidth + (window.innerWidth - sidebarWidth) / 2) / window.innerWidth;
      origin[1] = window.innerWidth > 980 ? 0.52 : 0.54;
    };

    const targetPointer = [0.5, 0.5];
    const currentPointer = [0.5, 0.5];

    const handleMove = (event: PointerEvent) => {
      if (!propsRef.current.interactive) return;
      const rect = container.getBoundingClientRect();
      targetPointer[0] = (event.clientX - rect.left) / rect.width;
      targetPointer[1] = 1 - (event.clientY - rect.top) / rect.height;
    };

    const handleLeave = () => {
      targetPointer[0] = 0.5;
      targetPointer[1] = 0.5;
    };

    const handleClick = (event: PointerEvent) => {
      if (!propsRef.current.interactive) return;
      handleMove(event);
      program.uniforms.uClickTime.value = program.uniforms.uTime.value;
    };

    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(container);
    setSize();
    window.addEventListener("resize", setSize);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerleave", handleLeave);
    window.addEventListener("pointerdown", handleClick);

    let raf = 0;
    let visible = true;
    let pageVisible = !document.hidden;
    let released = false;
    const start = performance.now();
    let lastRender = 0;

    const writeColor = (uniform: Float32Array, hex: string) => {
      const rgb = hexToRgb(hex);
      uniform[0] = rgb[0];
      uniform[1] = rgb[1];
      uniform[2] = rgb[2];
    };

    const render = (now: number) => {
      const frameMs = 1000 / Math.max(24, propsRef.current.maxFps);
      if (now - lastRender < frameMs) {
        raf = requestAnimationFrame(render);
        return;
      }
      lastRender = now;

      currentPointer[0] += (targetPointer[0] - currentPointer[0]) * 0.06;
      currentPointer[1] += (targetPointer[1] - currentPointer[1]) * 0.06;

      const pointer = program.uniforms.uPointer.value as Float32Array;
      pointer[0] = currentPointer[0];
      pointer[1] = currentPointer[1];

      program.uniforms.uTime.value = (now - start) / 1000;
      program.uniforms.uSpeed.value = propsRef.current.speed;
      program.uniforms.uOpacity.value = propsRef.current.opacity;
      writeColor(program.uniforms.uPrimary.value as Float32Array, propsRef.current.primaryColor);
      writeColor(program.uniforms.uSecondary.value as Float32Array, propsRef.current.secondaryColor);
      writeColor(program.uniforms.uAccent.value as Float32Array, propsRef.current.accentColor);

      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(render);
    };

    const startLoop = () => {
      if (released && visible && pageVisible && raf === 0) raf = requestAnimationFrame(render);
    };

    const stopLoop = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) startLoop();
      else stopLoop();
    });
    intersectionObserver.observe(container);

    const handleVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) startLoop();
      else stopLoop();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    const releaseTimer = window.setTimeout(() => {
      released = true;
      startLoop();
    }, initialProps.startDelayMs);

    return () => {
      stopLoop();
      window.clearTimeout(releaseTimer);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("resize", setSize);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
      window.removeEventListener("pointerdown", handleClick);
      container.removeChild(canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <div ref={containerRef} className={`lightspeed-container ${className}`.trim()} />;
}
