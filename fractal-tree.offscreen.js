// fractal-tree.offscreen.js
// Uses OffscreenCanvas in a Worker for silky main-thread performance, with a safe fallback.

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('fractal-canvas');
  if (!canvas) return;

  const DPR_CAP = 1.5; // cap for perf
  function dpr() { return Math.min(window.devicePixelRatio || 1, DPR_CAP); }

  function sizeCanvas() {
    const w = Math.floor(window.innerWidth);
    const h = Math.floor(window.innerHeight);
    return { w, h };
  }

  // Pause/Resume helpers
  let visible = true;
  const onVis = () => {
    if (document.hidden) worker?.postMessage({type:'stop'});
    else if (visible) worker?.postMessage({type:'start'});
  };

  // Offscreen path
  let worker = null;
  if (canvas.transferControlToOffscreen) {
    const offscreen = canvas.transferControlToOffscreen();
    worker = new Worker('fractal-tree.worker.js', { type: 'module' });
    const { w, h } = sizeCanvas();
    worker.postMessage({ type: 'init', canvas: offscreen, width: w, height: h, dpr: dpr() }, [offscreen]);

    // Resize (passive) + DPR changes
    const resize = () => {
      const { w, h } = sizeCanvas();
      worker.postMessage({ type: 'resize', width: w, height: h, dpr: dpr() });
    };
    window.addEventListener('resize', resize, { passive: true });

    // Visibility + intersection
    document.addEventListener('visibilitychange', onVis);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        worker.postMessage({ type: visible && !document.hidden ? 'start' : 'stop' });
      }, { threshold: 0.05 });
      io.observe(canvas);
    }

    // Start right away
    worker.postMessage({ type: 'start' });
  } else {
    // Fallback: inline animation (reduced settings)
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, ANG = 0, running = false, then = 0, rafId = null;
    let DEPTH = 9;
    function resize() {
      const { w, h } = sizeCanvas();
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
    const FPS = 20; const INTERVAL = 1000/FPS;
    function tick(now){
      if(!running) return;
      rafId = requestAnimationFrame(tick);
      if(now-then < INTERVAL) return;
      then = now;
      ctx.clearRect(0,0,W,H);
      ANG = (Math.sin(now/2000)*0.4)+0.5;
      ctx.strokeStyle = '#fff';
      // no shadow in fallback
      ctx.save(); ctx.translate(W/2, H/2 - 100);
      branch(70, DEPTH);
      ctx.restore();
    }
    function start(){ if(running) return; running=true; then=performance.now(); rafId=requestAnimationFrame(tick); }
    function stop(){ running=false; if(rafId) cancelAnimationFrame(rafId); rafId=null; }
    resize(); window.addEventListener('resize', resize, { passive:true });
    document.addEventListener('visibilitychange', ()=> document.hidden?stop():start());
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => e.isIntersecting?start():stop(), { threshold:0.05 });
      io.observe(canvas);
    }
    start();
  }
})function computeAnchor() {
  const parentRect = parent.getBoundingClientRect();
  let ax = parentRect.width / 2;
  let ay = parentRect.height / 2;

  const t = document.querySelector(cfg.target);

  // Horizontal X mode
  if (cfg.xMode === 'target') {
    if (t) {
      const tr = t.getBoundingClientRect();
      const horiz = (cfg.targetAlign.split('-')[0] || 'center');  // left|center|right
      if (horiz === 'left')   ax = tr.left - parentRect.left;
      if (horiz === 'center') ax = tr.left - parentRect.left + tr.width / 2;
      if (horiz === 'right')  ax = tr.right - parentRect.left;
    }
  } else {
    // container-center default
    ax = parentRect.width / 2;
  }

  // Vertical Y mode
  if (cfg.yMode === 'container-center') {
    ay = parentRect.height / 2;
  } else if (cfg.yMode === 'target-center') {
    if (t) {
      const tr = t.getBoundingClientRect();
      ay = tr.top - parentRect.top + tr.height / 2;
    }
  } else { // 'target-top' default
    if (t) {
      const tr = t.getBoundingClientRect();
      ay = tr.top - parentRect.top;
    } else {
      ay = parentRect.height / 2;
    }
  }

  ax += cfg.offsetX;
  ay += cfg.offsetY;
  return { ax, ay };
}fractal-tree.offscreen.js
// Uses OffscreenCanvas in a Worker for silky main-thread performance, with a safe fallback.

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('fractal-canvas');
  if (!canvas) return;

  const DPR_CAP = 1.5; // cap for perf
  function dpr() { return Math.min(window.devicePixelRatio || 1, DPR_CAP); }

  function sizeCanvas() {
    const w = Math.floor(window.innerWidth);
    const h = Math.floor(window.innerHeight);
    return { w, h };
  }

  // Pause/Resume helpers
  let visible = true;
  const onVis = () => {
    if (document.hidden) worker?.postMessage({type:'stop'});
    else if (visible) worker?.postMessage({type:'start'});
  };

  // Offscreen path
  let worker = null;
  if (canvas.transferControlToOffscreen) {
    const offscreen = canvas.transferControlToOffscreen();
    worker = new Worker('fractal-tree.worker.js', { type: 'module' });
    const { w, h } = sizeCanvas();
    worker.postMessage({ type: 'init', canvas: offscreen, width: w, height: h, dpr: dpr() }, [offscreen]);

    // Resize (passive) + DPR changes
    const resize = () => {
      const { w, h } = sizeCanvas();
      worker.postMessage({ type: 'resize', width: w, height: h, dpr: dpr() });
    };
    window.addEventListener('resize', resize, { passive: true });

    // Visibility + intersection
    document.addEventListener('visibilitychange', onVis);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        worker.postMessage({ type: visible && !document.hidden ? 'start' : 'stop' });
      }, { threshold: 0.05 });
      io.observe(canvas);
    }

    // Start right away
    worker.postMessage({ type: 'start' });
  } else {
    // Fallback: inline animation (reduced settings)
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, ANG = 0, running = false, then = 0, rafId = null;
    let DEPTH = 9;
    function resize() {
      const { w, h } = sizeCanvas();
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
    const FPS = 20; const INTERVAL = 1000/FPS;
    function tick(now){
      if(!running) return;
      rafId = requestAnimationFrame(tick);
      if(now-then < INTERVAL) return;
      then = now;
      ctx.clearRect(0,0,W,H);
      ANG = (Math.sin(now/2000)*0.4)+0.5;
      ctx.strokeStyle = '#fff';
      // no shadow in fallback
      ctx.save(); ctx.translate(W/2, H/2 - 100);
      branch(70, DEPTH);
      ctx.restore();
    }
    function start(){ if(running) return; running=true; then=performance.now(); rafId=requestAnimationFrame(tick); }
    function stop(){ running=false; if(rafId) cancelAnimationFrame(rafId); rafId=null; }
    resize(); window.addEventListener('resize', resize, { passive:true });
    document.addEventListener('visibilitychange', ()=> document.hidden?stop():start());
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => e.isIntersecting?start():stop(), { threshold:0.05 });
      io.observe(canvas);
    }
    start();
  }
});