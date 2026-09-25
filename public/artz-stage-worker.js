/* ARTZ ambient renderer. Runs away from the UI thread when OffscreenCanvas is available. */
let canvas;
let context;
let width = 1;
let height = 1;
let ratio = 1;
let fps = 24;
let timer = 0;
let running = true;
let lastTime = 0;
let sky = null;
let embers = [];
let glints = [];

const pointer = { x: 0, y: 0 };
const pointerTarget = { x: 0, y: 0 };
const TAU = Math.PI * 2;

function seeded(index, multiplier, modulus) {
  return ((index * multiplier + 41) % modulus) / modulus;
}

function rebuildScene() {
  const emberCount = Math.max(22, Math.min(42, Math.round(width / 42)));
  const glintCount = Math.max(14, Math.min(24, Math.round(width / 74)));

  embers = Array.from({ length: emberCount }, (_, index) => ({
    x: seeded(index, 83, 997) * width,
    y: seeded(index, 137, 991) * height,
    radius: 0.8 + ((index * 17) % 17) / 11,
    speed: 4 + ((index * 31) % 13),
    sway: 5 + ((index * 29) % 16),
    phase: ((index * 47) % 360) * Math.PI / 180,
    alpha: 0.16 + ((index * 13) % 28) / 100,
    tone: index % 7 === 0 ? "coral" : index % 5 === 0 ? "mint" : "gold",
  }));

  glints = Array.from({ length: glintCount }, (_, index) => ({
    x: seeded(index, 149, 983) * width,
    y: seeded(index, 211, 977) * height,
    size: 1.7 + ((index * 19) % 26) / 10,
    speed: 1.2 + ((index * 23) % 26) / 10,
    phase: ((index * 71) % 360) * Math.PI / 180,
    tone: index % 6 === 0 ? "gold" : index % 3 === 0 ? "coral" : "mint",
  }));
}

function resize(nextWidth, nextHeight, nextRatio, nextFps) {
  width = Math.max(1, nextWidth);
  height = Math.max(1, nextHeight);
  ratio = Math.max(0.45, nextRatio);
  fps = Math.max(12, nextFps);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#04100d");
  sky.addColorStop(0.48, "#082018");
  sky.addColorStop(1, "#0d2a20");
  rebuildScene();
}

function drawBloom(x, y, radius, core, edge) {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, core);
  gradient.addColorStop(0.48, edge);
  gradient.addColorStop(1, "rgba(4, 12, 10, 0)");
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function traceRibbon(time, lane, amplitude, phase, speed, reverse) {
  const direction = reverse ? -1 : 1;
  const baseline = height * lane + Math.sin(time * speed * 0.46 + phase) * height * 0.022;
  const gradient = context.createLinearGradient(-80, baseline, width + 80, baseline);
  gradient.addColorStop(0, "rgba(255, 178, 67, 0)");
  gradient.addColorStop(0.18, "rgba(255, 171, 61, 0.3)");
  gradient.addColorStop(0.5, "rgba(255, 226, 145, 0.78)");
  gradient.addColorStop(0.82, "rgba(255, 77, 109, 0.28)");
  gradient.addColorStop(1, "rgba(255, 178, 67, 0)");

  context.beginPath();
  for (let x = -90; x <= width + 90; x += 34) {
    const progress = x / Math.max(1, width);
    const y = baseline
      + Math.sin(progress * TAU * 1.12 + time * speed * direction + phase) * amplitude
      + Math.sin(progress * TAU * 2.36 - time * speed * 0.44 + phase) * amplitude * 0.24
      + pointer.x * (progress - 0.5) * 22
      + pointer.y * 8;
    if (x === -90) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.strokeStyle = gradient;
  context.lineWidth = 5;
  context.globalAlpha = 0.1;
  context.stroke();
  context.lineWidth = 1.35;
  context.globalAlpha = 0.68;
  context.stroke();
  context.globalAlpha = 1;
}

function drawWave(time, baselineRatio, amplitude, speed, frequency, phase, top, bottom) {
  const baseline = height * baselineRatio + Math.sin(time * 0.22 + phase) * height * 0.006;
  const gradient = context.createLinearGradient(0, baseline - amplitude, 0, height);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  context.beginPath();
  context.moveTo(-60, height + 60);
  for (let x = -60; x <= width + 60; x += 34) {
    const progress = x / Math.max(1, width);
    const y = baseline
      + Math.sin(progress * TAU * frequency + time * speed + phase) * amplitude
      + Math.sin(progress * TAU * 1.37 - time * speed * 0.58) * amplitude * 0.34
      + pointer.x * (progress - 0.5) * 16;
    context.lineTo(x, y);
  }
  context.lineTo(width + 60, height + 60);
  context.closePath();
  context.fillStyle = gradient;
  context.fill();
}

function draw(now) {
  const delta = Math.min(80, now - (lastTime || now)) / 1000;
  const time = now / 1000;
  lastTime = now;
  pointer.x += (pointerTarget.x - pointer.x) * 0.1;
  pointer.y += (pointerTarget.y - pointer.y) * 0.1;

  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
  context.fillStyle = sky || "#0a1f18";
  context.fillRect(0, 0, width, height);

  const radius = Math.max(width, height) * 0.54;
  drawBloom(width * (0.5 + pointer.x * 0.018), height * (0.43 + pointer.y * 0.012), radius, "rgba(255, 122, 26, 0.24)", "rgba(45, 225, 167, 0.08)");

  context.globalCompositeOperation = "screen";
  const minSide = Math.min(width, height);
  drawBloom(width * (0.18 + Math.sin(time * 0.13) * 0.045), height * 0.28, Math.max(220, minSide * 0.38), "rgba(255, 170, 60, 0.15)", "rgba(255, 122, 26, 0.03)");
  drawBloom(width * (0.82 + Math.sin(time * 0.1 + 2.1) * 0.04), height * 0.42, Math.max(230, minSide * 0.42), "rgba(45, 225, 167, 0.14)", "rgba(20, 120, 85, 0.03)");
  drawBloom(width * 0.54, height * (0.78 + Math.cos(time * 0.08) * 0.026), Math.max(250, minSide * 0.48), "rgba(255, 136, 57, 0.1)", "rgba(120, 50, 10, 0.025)");

  traceRibbon(time, 0.19, Math.max(24, height * 0.042), 0.6, 0.11, false);
  traceRibbon(time, 0.5, Math.max(28, height * 0.052), 2.7, 0.085, true);
  traceRibbon(time, 0.72, Math.max(20, height * 0.034), 4.4, 0.07, false);

  for (const glint of glints) {
    glint.y -= glint.speed * delta;
    glint.x += Math.sin(time * 0.18 + glint.phase) * delta * 0.22;
    if (glint.y < -12) glint.y = height + 12;
    const pulse = Math.pow(Math.max(0, Math.sin(time * 0.72 + glint.phase)), 5);
    const size = glint.size * (0.9 + pulse * 0.45);
    const color = glint.tone === "gold" ? "#ffc763" : glint.tone === "coral" ? "#ff6e78" : "#50ffbe";
    context.globalAlpha = 0.28 + pulse * 0.58;
    context.strokeStyle = color;
    context.lineWidth = 0.8;
    context.beginPath();
    context.moveTo(glint.x - size * 1.5, glint.y);
    context.lineTo(glint.x + size * 1.5, glint.y);
    context.moveTo(glint.x, glint.y - size * 2.2);
    context.lineTo(glint.x, glint.y + size * 2.2);
    context.stroke();
  }

  for (const ember of embers) {
    ember.y -= ember.speed * delta;
    ember.x += Math.sin(time * 0.42 + ember.phase) * ember.sway * delta * 0.14;
    if (ember.y < -12) ember.y = height + 12;
    const pulse = 0.72 + Math.sin(time * 1.15 + ember.phase) * 0.28;
    context.globalAlpha = ember.alpha * pulse;
    context.fillStyle = ember.tone === "coral" ? "#ff646e" : ember.tone === "mint" ? "#5affbe" : "#ffa942";
    context.beginPath();
    context.arc(ember.x, ember.y, ember.radius * pulse, 0, TAU);
    context.fill();
  }

  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
  drawWave(time, 0.82, Math.max(16, height * 0.025), 0.18, 1.2, 0.8, "rgba(20, 80, 60, 0.42)", "rgba(6, 20, 16, 0.88)");
  drawWave(time, 0.87, Math.max(20, height * 0.034), -0.14, 1.45, 2.2, "rgba(150, 70, 25, 0.26)", "rgba(20, 10, 4, 0.96)");
  drawWave(time, 0.92, Math.max(23, height * 0.044), 0.1, 1.1, 4.1, "rgba(14, 60, 45, 0.48)", "rgba(3, 10, 8, 1)");
}

function schedule() {
  clearTimeout(timer);
  if (!running || !context) return;
  timer = setTimeout(() => {
    draw(performance.now());
    schedule();
  }, 1000 / fps);
}

self.onmessage = (event) => {
  const message = event.data;
  if (message.type === "init") {
    canvas = message.canvas;
    context = canvas.getContext("2d", { alpha: false, desynchronized: true });
    resize(message.width, message.height, message.ratio, message.fps);
    draw(performance.now());
    schedule();
  } else if (message.type === "resize") {
    resize(message.width, message.height, message.ratio, message.fps);
  } else if (message.type === "pointer") {
    pointerTarget.x = message.x;
    pointerTarget.y = message.y;
  } else if (message.type === "visibility") {
    running = message.visible;
    lastTime = performance.now();
    if (running) schedule();
    else clearTimeout(timer);
  }
};
