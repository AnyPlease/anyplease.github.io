// fractal-tree.canvas.js
// Simple, fast, main-thread version (20 FPS) anchored to your title’s position.

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('fractal-canvas');
  const ctx = canvas.getContext('2d', { alpha: true });

  const hero = canvas.parentElement || document.body;
  const title = document.getElementById('hero-title');

  // knobs (from data-attributes)
  const cfg = {
    offsetX: parseFloat(canvas.dataset.offsetX || '0'),
    offsetY: parseFloat(canvas.dataset.offsetY || '-40'),
    scale:   parseFloat(canvas.dataset.scale   || '1.05'),
    baseLen: parseFloat(canvas.dataset.baseLen || '70'),
    maxDepth: parseInt(canvas.dataset.maxDepth || '10', 10),
    dprCap:  1.5,
  };

  // Crisp but not wasteful
  const DPR = Math.min(window.devicePixelRatio || 1, cfg.dprCap);

  function sizeToHero() {
    const r = hero.getBoundingClientRect();
    const w = Math.max(1, Math.floor(r.width));
    const h = Math.max(1, Math.floor(r.height));
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { w, h };
  }

  // Anchor rules:
  //  - X: always center of hero (puts it in the middle of any screen)
  //  - Y: top edge of the title (so the tree sits "on top of my name")
  function computeAnchor() {
    const heroRect = hero.getBoundingClientRect();
    const titleRect = title ? title.getBoundingClientRect() : heroRect;
    const ax = heroRect.width / 2 + cfg.offsetX;
    const ay = (titleRect.top - heroRect.top) + cfg.offsetY;
    return { ax, ay };
  }

  // --------- draw the tree ----------
  function drawBranch(len, depth, angle) {
    if (depth <= 0 || len < 2) return;
    ctx.lineWidth = Math.max(1, depth * 0.7);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len); ctx.stroke();

    ctx.save(); ctx.translate(0, -len);
    ctx.save(); ctx.rotate(angle);     drawBranch(len * 0.7, depth - 1, angle); ctx.restore();
    ctx.save(); ctx.rotate(-angle);    drawBranch(len * 0.7, depth - 1, angle); ctx.restore();
    ctx.restore();
  }

  // --------- animation loop (20 FPS) ----------
  const FPS = 20; const INTERVAL = 1000 / FPS;
  let running = false, then = 0, rafId = null;

  function frame(now) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    if (now - then < INTERVAL) return;
    then = now;

    const { w, h } = size;                 // from last resize
    const { ax, ay } = computeAnchor();
    const angle = (Math.sin(now / 2000) * 0.4) + 0.5;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#e6e6e6';

    ctx.save();
    ctx.translate(ax, ay);
    ctx.scale(cfg.scale, cfg.scale);
    drawBranch(cfg.baseLen, cfg.maxDepth, angle);
    ctx.restore();
  }

  function start() { if (running) return; running = true; then = performance.now(); rafId = requestAnimationFrame(frame); }
  function stop()  { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; }

  // keep canvas sized to hero
  let size = sizeToHero();
  const roHero = new ResizeObserver(() => { size = sizeToHero(); });
  roHero.observe(hero);

  // title can change size after fonts load / responsive wrap
  if (title) {
    const roTitle = new ResizeObserver(() => { /* anchor recomputed each frame */ });
    roTitle.observe(title);
  }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(() => { size = sizeToHero(); }); }

  // pause when hidden or off-screen
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => e.isIntersecting ? start() : stop(), { threshold: 0.05 });
    io.observe(canvas);
  }

  // kick off
  start();
});
