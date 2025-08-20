document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('fractal-canvas');
  if (!canvas) {
    console.error('[fractal-tree] #fractal-canvas not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // --- Sizing (with DPR) ---
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0, height = 0;
  function resize() {
    width = Math.floor(window.innerWidth);
    height = Math.floor(window.innerHeight);
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', () => {
    resize();
    if (running) drawFrame(performance.now()); // refresh immediately after resize
  }, { passive: true });

  // --- Tree drawing ---
  let angle = 0;
  function drawBranch(length, depth) {
    if (depth <= 0 || length < 2) return;

    ctx.lineWidth = Math.max(1, depth * 0.8);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -length);
    ctx.stroke();

    ctx.save();
    ctx.translate(0, -length);

    ctx.save();
    ctx.rotate(angle);
    drawBranch(length * 0.7, depth - 1);
    ctx.restore();

    ctx.save();
    ctx.rotate(-angle);
    drawBranch(length * 0.7, depth - 1);
    ctx.restore();

    ctx.restore();
  }

  // --- Animation loop (20 FPS cap) ---
  let rafId = null;
  let running = false;
  let then = 0;
  const FPS = 20;
  const INTERVAL = 1000 / FPS;

  function drawFrame(now) {
    if (!running) return;
    rafId = requestAnimationFrame(drawFrame);
    const elapsed = now - then;
    if (elapsed < INTERVAL) return;
    then = now - (elapsed % INTERVAL);

    ctx.clearRect(0, 0, width, height);
    angle = (Math.sin(now / 2000) * 0.4) + 0.5;
    ctx.strokeStyle = '#ffffff';
    ctx.shadowBlur = 3;
    ctx.shadowColor = 'rgba(255,255,255,1)';
    ctx.save();
    ctx.translate(width / 2, height / 2 - 100);
    drawBranch(70, 10);
    ctx.restore();
  }

  function start() {
    if (running) return;
    running = true;
    then = performance.now();
    rafId = requestAnimationFrame(drawFrame);
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  // --- Pause when off-screen or tab hidden ---
  let onScreen = true; // optimistic default so it never "disappears" on load
  const updateRunState = () => {
    const shouldRun = onScreen && !document.hidden;
    if (shouldRun) start(); else stop();
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      updateRunState();
    }, { threshold: 0.05, root: null, rootMargin: '0px 0px -10% 0px' });
    io.observe(canvas); // observe the canvas itself (not .hero)
  } else {
    const check = () => {
      const r = canvas.getBoundingClientRect();
      onScreen = r.bottom > 0 && r.top < window.innerHeight;
      updateRunState();
    };
    ['scroll', 'resize'].forEach(ev => window.addEventListener(ev, check, { passive: true }));
    check();
  }

  document.addEventListener('visibilitychange', updateRunState);

  // Kick off
  start();
});