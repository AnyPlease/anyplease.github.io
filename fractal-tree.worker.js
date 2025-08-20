// fractal-tree.worker.js (anchored + adaptive, production)
// Pins the fractal to a pixel anchor sent from the main thread.
let canvas, ctx;
let WIDTH = 0, HEIGHT = 0, DPR = 1;
let running = false;
let ANG = 0;

// Visual options (can be updated)
let OPTS = { scale: 1.05, baseLen: 70, maxDepth: 10 };

// Anchor in *pixels* relative to canvas top-left
let AX = 0, AY = 0;

// Adaptive quality
let DEPTH = OPTS.maxDepth;
let FPS = 24;
let timer = null;
let ema = 0;
const ALPHA = 0.15;
const SOFT_BUDGET_MS = 12;

function setTimer() { clearInterval(timer); timer = setInterval(step, 1000 / FPS); }

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
  ctx.strokeStyle = '#e6e6e6';

  ctx.save();
  ctx.translate(AX, AY);              // <-- use target anchor
  ctx.scale(OPTS.scale, OPTS.scale);
  drawBranch(OPTS.baseLen, DEPTH);
  ctx.restore();

  const dt = performance.now() - t0;
  ema = ema === 0 ? dt : (ALPHA * dt + (1 - ALPHA) * ema);
  if (ema > SOFT_BUDGET_MS && DEPTH > Math.max(7, OPTS.maxDepth - 3)) DEPTH--;
  else if (ema < SOFT_BUDGET_MS * 0.6 && DEPTH < OPTS.maxDepth) DEPTH++;
}

onmessage = (e) => {
  const { type } = e.data;
  if (type === 'init') {
    canvas = e.data.canvas;
    WIDTH = e.data.width; HEIGHT = e.data.height; DPR = e.data.dpr || 1;
    OPTS = Object.assign(OPTS, e.data.opts || {});
    DEPTH = OPTS.maxDepth;

    ctx = canvas.getContext('2d');
    canvas.width = Math.floor(WIDTH * DPR);
    canvas.height = Math.floor(HEIGHT * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  } else if (type === 'resize') {
    WIDTH = e.data.width; HEIGHT = e.data.height; DPR = e.data.dpr || DPR;
    canvas.width = Math.floor(WIDTH * DPR);
    canvas.height = Math.floor(HEIGHT * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  } else if (type === 'updateOptions') {
    OPTS = Object.assign(OPTS, e.data.opts || {});
  } else if (type === 'updateAnchorPx') {
    AX = e.data.ax; AY = e.data.ay;
  } else if (type === 'start') {
    if (!running) { running = true; setTimer(); }
  } else if (type === 'stop') {
    running = false; clearInterval(timer);
  }
};