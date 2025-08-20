// fractal-tree.js
let fpsInterval, then, running = false, rafId = null;

function tick(timestamp) {
    if (!running) return;
    rafId = requestAnimationFrame(tick);
    const elapsed = timestamp - then;
    if (elapsed > fpsInterval) {
        then = timestamp - (elapsed % fpsInterval);
        ctx.clearRect(0, 0, width, height);
        angle = (Math.sin(timestamp / 2000) * 0.4) + 0.5;
        ctx.strokeStyle = 'rgba(255,255,255,1)';
        ctx.shadowBlur = 3; // shave a bit more perf
        ctx.shadowColor = 'rgba(255,255,255,1)';
        ctx.save();
        ctx.translate(width / 2, height / 2 - 100);
        drawBranch(70, 10);
        ctx.restore();
    }
}

function startAnimating(fps=20) {
    if (running) return;
    running = true;
    fpsInterval = 1000 / fps;
    then = performance.now();
    tick(then);
}
function stopAnimating() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
}

// Pause when hero not visible
const hero = document.querySelector('.hero');
const obs = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) startAnimating(20);
    else stopAnimating();
},  { threshold: 0.3 });
obs.observe(hero);

// Pause when tab hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAnimating();
    else if (hero && hero.getBoundingClientRect().top < innerHeight) startAnimating(20);
});

// initial state
startAnimating(20);
