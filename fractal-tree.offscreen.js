// fractal-tree.offscreen.js (clean, anchored, HTTPS)
// - Sizes to the hero/container (canvas parent)
// - Anchors to a target element (e.g., your H1) with flexible modes
// - OffscreenCanvas + Worker; pauses when hidden/off-screen

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('fractal-canvas');
  if (!canvas) return;
  const parent = canvas.parentElement || document.body;

  // Config from data-* on the canvas
  const cfg = {
    target:      canvas.dataset.target || '#hero-title',
    targetAlign: canvas.dataset.targetAlign || 'center-top', // left|center|right - top|center|bottom
    offsetX:     parseFloat(canvas.dataset.offsetX || '0'),
    offsetY:     parseFloat(canvas.dataset.offsetY || '-40'),
    scale:       parseFloat(canvas.dataset.scale   || '1.05'),
    baseLen:     parseFloat(canvas.dataset.baseLen || '70'),
    maxDepth:    parseInt(canvas.dataset.maxDepth  || '10', 10),
    dprCap:      parseFloat(canvas.dataset.dprCap  || '1.5'),
    // Positioning modes:
    //  - xMode: 'container-center' (center of hero) or 'target' (align with target)
    //  - yMode: 'target-top' | 'target-center' | 'container-center'
    xMode:       canvas.dataset.xMode || 'container-center',
    yMode:       canvas.dataset.yMode || 'target-top',
  };

  const dpr = () => Math.min(window.devicePixelRatio || 1, cfg.dprCap);

  function parentSize() {
    const r = parent.getBoundingClientRect();
    return { w: Math.max(1, Math.floor(r.width)), h: Math.max(1, Math.floor(r.height)) };
  }

  // Compute anchor (pixels relative to parent top-left)
  function computeAnchor() {
    const parentRect = parent.getBoundingClientRect();
    let ax = parentRect.width / 2;
    let ay = parentRect.height / 2;
    const t = document.querySelector(cfg.target);

    // Horizontal (X)
    if (cfg.xMode === 'target' && t) {
      const tr = t.getBoundingClientRect();
      const horiz = (cfg.targetAlign.split('-')[0] || 'center'); // left|center|right
      if (horiz === 'left')   ax = tr.left - parentRect.left;
      if (horiz === 'center') ax = tr.left - parentRect.left + tr.width / 2;
      if (horiz === 'right')  ax = tr.right - parentRect.left;
    } else {
      // Center in the container
      ax = parentRect.width / 2;
    }

    // Vertical (Y)
    if (cfg.yMode === 'container-center') {
      ay = parentRect.height / 2;
    } else if (cfg.yMode === 'target-center' && t) {
      const tr = t.getBoundingClientRect();
      ay = tr.top - parentRect.top + tr.height / 2;
    } else if (cfg.yMode === 'target-top' && t) {
      const tr = t.getBoundingClientRect();
      ay = tr.top - parentRect.top;
    }

    ax += cfg.offsetX;
    ay += cfg.offsetY;
    return { ax, ay };
  }

  // ---- Worker path
  if (canvas.transferControlToOffscreen) {
    const offscreen = canvas.transferControlToOffscreen();
    const worker = new Worker('fractal-tree.worker.js'); // classic worker (no modules)
    const { w, h } = parentSize();
    worker.postMessage({
      type: 'init',
      canvas: offscreen,
      width: w,
      height: h,
      dpr: dpr(),
      opts: { scale: cfg.scale, baseLen: cfg.baseLen, maxDepth: cfg.maxDepth }
    }, [offscreen]);

    // Keep canvas sized to its parent (hero)
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        worker.postMessage({ type: 'resize', width: Math.floor(cr.width), height: Math.floor(cr.height), dpr: dpr() });
        const { ax, ay } = computeAnchor();
        worker.postMessage({ type: 'updateAnchorPx', ax, ay });
      }
    });
    ro.observe(parent);

    // Track target layout changes (font load, wrapping, etc.)
    const targetEl = document.querySelector(cfg.target);
    if (targetEl) {
      const roT = new ResizeObserver(() => {
        const { ax, ay } = computeAnchor();
        worker.postMessage({ type: 'updateAnchorPx', ax, ay });
      });
      roT.observe(targetEl);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        const { ax, ay } = computeAnchor();
        worker.postMessage({ type: 'updateAnchorPx', ax, ay });
      }).catch(() => {});
    }

    // Cheap scroll hook (only computes and posts two numbers)
    window.addEventListener('scroll', () => {
      const { ax, ay } = computeAnchor();
      worker.postMessage({ type: 'updateAnchorPx', ax, ay });
    }, { passive: true });

    // Pause when hidden/off-screen
    let visible = true;
    const updateRun = () => worker.postMessage({ type: (visible && !document.hidden) ? 'start' : 'stop' });
    document.addEventListener('visibilitychange', updateRun);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; updateRun(); }, { threshold: 0.05 });
      io.observe(canvas);
    }
    updateRun();

    // Initial anchor
    const { ax, ay } = computeAnchor();
    worker.postMessage({ type: 'updateAnchorPx', ax, ay });

    // Console helper for tuning
    window.__fractalSet = (opts={}) => {
      Object.assign(cfg, opts);
      worker.postMessage({ type: 'updateOptions', opts: { scale: cfg.scale, baseLen: cfg.baseLen, maxDepth: cfg.maxDepth } });
      const p = computeAnchor();
      worker.postMessage({ type: 'updateAnchorPx', ax: p.ax, ay: p.ay });
    };
  } else {
    // ---- Main-thread fallback (reduced settings), still honors anchor
    const ctx = canvas.getContext('2d');
    const FPS = 20, INTERVAL = 1000 / FPS;
    let W=0, H=0, ANG=0, running=false, then=0, rafId=null;

    function resize() {
      const { w, h } = parentSize();
      const D = dpr();
      canvas.width = Math.floor(w * D);
      canvas.height = Math.floor(h * D);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(D, 0, 0, D, 0, 0);
      W = w; H = h;
    }
    function branch(len, depth) {
      if (depth <= 0 || len < 2) return;
      ctx.lineWidth = Math.max(1, depth * 0.7);
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-len); ctx.stroke();
      ctx.save(); ctx.translate(0,-len);
      ctx.save(); ctx.rotate(ANG); branch(len*0.7, depth-1); ctx.restore();
      ctx.save(); ctx.rotate(-ANG); branch(len*0.7, depth-1); ctx.restore();
      ctx.restore();
    }
    function tick(now) {
      if (!running) return;
      rafId = requestAnimationFrame(tick);
      if (now - then < INTERVAL) return;
      then = now;
      const { ax, ay } = computeAnchor();
      ctx.clearRect(0,0,W,H);
      ANG = (Math.sin(now/2000)*0.4)+0.5;
      ctx.strokeStyle = '#e6e6e6';
      ctx.save(); ctx.translate(ax, ay); ctx.scale(cfg.scale, cfg.scale);
      branch(cfg.baseLen, Math.max(7, cfg.maxDepth - 1));
      ctx.restore();
    }
    function start(){ if(running) return; running=true; then=performance.now(); rafId=requestAnimationFrame(tick); }
    function stop(){ running=false; if(rafId) cancelAnimationFrame(rafId); rafId=null; }

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(parent);
    document.addEventListener('visibilitychange', ()=> document.hidden?stop():start());
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => e.isIntersecting?start():stop(), { threshold:0.05 });
      io.observe(canvas);
    }
    start();
  }
});