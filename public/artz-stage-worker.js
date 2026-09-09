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
  const glintCount = Math.max(10, Math.min(20, Math.round(width / 88)));

  embers = Array.from({ length: emberCount }, (_, index) => ({
    x: seeded(index, 83, 997) * width,
    y: seeded(index, 137, 991) * height,
    radius: 0.8 + ((index * 17) % 17) / 11,
    speed: 4 + ((index * 31) % 13),
    sway: 5 + ((index * 29) % 16),
    phase: ((index * 47) % 360) * Math.PI / 180,
    alpha: 0.16 + ((index * 13) % 28) / 100,
    tone: index % 7 === 0 ? "pink" : index % 5 === 0 ? "violet" : "gold",
  }));

  glints = Array.from({ length: glintCount }, (_, index) => ({
    x: seeded(index, 149, 983) * width,
    y: seeded(index, 211, 977) * height,
    size: 1.7 + ((index * 19) % 26) / 10,
    speed: 1.2 + ((index * 23) % 26) / 10,
    phase: ((index * 71) % 360) * Math.PI / 180,
    tone: index % 6 === 0 ? "gold" : index % 3 === 0 ? "pink" : "violet",
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
  sky.addColorStop(0, "#07000f");
  sky.addColorStop(0.48, "#100019");
  sky.addColorStop(1, "#19041f");
  rebuildScene();
}

function drawBloom(x, y, radius, core, edge) {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, core);
  gradient.addColorStop(0.48, edge);
  gradient.addColorStop(1, "rgba(5, 0, 12, 0)");
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function traceRibbon(time, lane, amplitude, phase, speed, reverse) {
  const direction = reverse ? -1 : 1;
  const baseline = height * lane + Math.sin(time * speed * 0.46 + phase) * height * 0.022;
  const gradient = context.createLinearGradient(-80, baseline, width + 80, baseline);
  gradient.addColorStop(0, "rgba(255, 178, 67, 0)");
  gradient.addColorStop(0.18, "rgba(255, 171, 61, 0.22)");
  gradient.addColorStop(0.5, "rgba(255, 226, 145, 0.62)");
  gradient.addColorStop(0.82, "rgba(255, 91, 177, 0.2)");
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
  context.lineWidth = 1.7;
  context.globalAlpha = 0.5;
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
  context.fillStyle = sky || "#100019";
  context.fillRect(0, 0, width, height);

  const radius = Math.max(width, height) * 0.54;
  drawBloom(width * (0.5 + pointer.x * 0.018), height * (0.43 + pointer.y * 0.012), radius, "rgba(150, 38, 181, 0.28)", "rgba(87, 12, 111, 0.1)");

  context.globalCompositeOperation = "screen";
  const minSide = Math.min(width, height);
  drawBloom(width * (0.18 + Math.sin(time * 0.13) * 0.045), height * 0.28, Math.max(220, minSide * 0.38), "rgba(255, 52, 169, 0.17)", "rgba(133, 40, 197, 0.035)");
  drawBloom(width * (0.82 + Math.sin(time * 0.1 + 2.1) * 0.04), height * 0.42, Math.max(230, minSide * 0.42), "rgba(141, 67, 255, 0.16)", "rgba(255, 71, 177, 0.03)");
  drawBloom(width * 0.54, height * (0.78 + Math.cos(time * 0.08) * 0.026), Math.max(250, minSide * 0.48), "rgba(255, 136, 57, 0.1)", "rgba(166, 59, 222, 0.025)");

  traceRibbon(time, 0.19, Math.max(24, height * 0.042), 0.6, 0.11, false);
  traceRibbon(time, 0.5, Math.max(28, height * 0.052), 2.7, 0.085, true);
  traceRibbon(time, 0.72, Math.max(20, height * 0.034), 4.4, 0.07, false);

  for (const glint of glints) {
    glint.y -= glint.speed * delta;
    if (glint.y < -12) glint.y = height + 12;
    const pulse = Math.pow(Math.max(0, Math.sin(time * 0.72 + glint.phase)), 5);
    const size = glint.size * (0.9 + pulse * 0.45);
    const color = glint.tone === "gold" ? "#ffc763" : glint.tone === "pink" ? "#ff5cbe" : "#c584ff";
    context.globalAlpha = 0.22 + pulse * 0.48;
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
    context.fillStyle = ember.tone === "pink" ? "#ff40ae" : ember.tone === "violet" ? "#ac5dff" : "#ffa942";
    context.beginPath();
    context.arc(ember.x, ember.y, ember.radius * pulse, 0, TAU);
    context.fill();
  }

  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
  drawWave(time, 0.82, Math.max(16, height * 0.025), 0.18, 1.2, 0.8, "rgba(92, 28, 142, 0.42)", "rgba(24, 4, 47, 0.88)");
  drawWave(time, 0.87, Math.max(20, height * 0.034), -0.14, 1.45, 2.2, "rgba(188, 43, 151, 0.26)", "rgba(15, 1, 29, 0.96)");
  drawWave(time, 0.92, Math.max(23, height * 0.044), 0.1, 1.1, 4.1, "rgba(75, 27, 120, 0.48)", "rgba(7, 0, 15, 1)");
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
