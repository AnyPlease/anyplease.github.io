document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('fractal-canvas');
    if (!canvas) {
        console.error("Fractal canvas not found!");
        return;
    }
    const ctx = canvas.getContext('2d');

    let width, height;
    let angle = 0;

    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function drawBranch(len, branchWidth) {
        if (len < 4) {
            return;
        }
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -len);
        ctx.lineWidth = branchWidth;
        ctx.stroke();
        ctx.translate(0, -len);
        len *= 0.7;
        branchWidth *= 0.7;
        ctx.save();
        ctx.rotate(-angle);
        drawBranch(len, branchWidth);
        ctx.restore();
        ctx.save();
        ctx.rotate(angle);
        drawBranch(len, branchWidth);
        ctx.restore();
    }
    
    // --- Frame Rate Throttling ---
    let fpsInterval, startTime, now, then, elapsed;

    function startAnimating(fps) {
        fpsInterval = 1000 / fps;
        then = window.performance.now();
        startTime = then;
        animate(then);
    }

    function animate(timestamp) {
        requestAnimationFrame(animate);

        now = timestamp;
        elapsed = now - then;

        if (elapsed > fpsInterval) {
            then = now - (elapsed % fpsInterval);
            
            // The original animation logic
            ctx.clearRect(0, 0, width, height);
            angle = (Math.sin(now / 2000) * 0.4) + 0.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
            ctx.shadowBlur = 5; // Reduced shadow for performance
            ctx.shadowColor = 'rgba(255, 255, 255, 1)';
            ctx.save();
            ctx.translate(width / 2, height / 2 - 100);
            drawBranch(70, 10);
            ctx.restore();
        }
    }

    startAnimating(20); // Start animation at 20 FPS
});