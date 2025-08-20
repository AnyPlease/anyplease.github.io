// fractal-tree.worker.js
let canvas, ctx;
let WIDTH = 0, HEIGHT = 0, DPR = 1;
let running = false;
let ANG = 0;
let DEPTH = 10;     // will adapt down if needed
let FPS = 24;       // slightly higher for smoother feel (worker-side)
let timer = null;

// Simple moving average of draw time to adapt quality
let ema = 0;
const ALPHA = 0.15;
const SOFT_BUDGET_MS = 12; // try to keep draw under 12ms

function setTimer() {
  clearInterval(timer);
  timer = setInterval(step, 1000 / FPS);
}

function drawBranch(len, depth) {
  if (depth <= 0 || len < 2) return;
  ctx.lineWidth = Math.max(1, depth * 0.7);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len); ctx.stroke();
  ctx.save(); ctx.translate(0, -len);
  ctx.save(); ctx.rotate(ANG); drawBranch(len * 0.7, depth - 1); ctx.restore();
  ctx.save(); ctx.rotate(-ANG); drawBranch(len * 0.7, depth - 1); ctx.restore();
  ctx.restore();
}

function step() {
  if (!running || !ctx) return;
  const t0 = performance.now();
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  const now = t0;
  ANG = (Math.sin(now / 2000) * 0.4) + 0.5;

  ctx.strokeStyle = '#ffffff';
  // Avoid per-segment shadows (very expensive). Do a light canvas-wide glow via composite:
  // Trick: draw once, then blur via filter on a separate pass is costly; skip it for performance.
  ctx.save();
  ctx.translate(WIDTH / 2, HEIGHT / 2 - 100);
  drawBranch(70, DEPTH);
  ctx.restore();

  const t1 = performance.now();
  const dt = t1 - t0;
  ema = ema === 0 ? dt : (ALPHA * dt + (1 - ALPHA) * ema);

  // Adaptive quality: if too slow, reduce recursion; if fast, gently increase up to 10
  if (ema > SOFT_BUDGET_MS && DEPTH > 7) {
    DEPTH--;
  } else if (ema < SOFT_BUDGET_MS * 0.6 && DEPTH < 10) {
    DEPTH++;
  }
}

onmessage = (e) => {
  const { type } = e.data;
  if (type === 'init') {
    canvas = e.data.canvas;
    WIDTH = e.data.width; HEIGHT = e.data.height; DPR = e.data.dpr || 1;
    ctx = canvas.getContext('2d');
    canvas.width = Math.floor(WIDTH * DPR);
    canvas.height = Math.floor(HEIGHT * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  } else if (type === 'resize') {
    WIDTH = e.data.width; HEIGHT = e.data.height; DPR = e.data.dpr || DPR;
    canvas.width = Math.floor(WIDTH * DPR);
    canvas.height = Math.floor(HEIGHT * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  } else if (type === 'start') {
    if (!running) {
      running = true;
      setTimer();
    }
  } else if (type === 'stop') {
    running = false;
    clearInterval(timer);
  }
};