/*
  Mandelbrot Background: Scroll-to-Zoom (Optimized with an Embedded Web Worker)
*/

// --- Core Elements ---
const canvas = document.getElementById("mandelbrot-canvas");
const ctx = canvas.getContext("2d");

// --- Performance & Drawing Parameters ---
const RESOLUTION_SCALE = 0.5; // Render at a lower resolution for performance
const MAX_ITER = 50;          // Iteration count for detail

// --- Zoom & Pan Parameters ---
// CHANGED: Start zoomed out with a smaller initial zoom value.
let zoom = 2.0;
const ZOOM_SENSITIVITY = 1.1; // Slightly increased sensitivity for a better feel
const CENTER_X = -0.745;
const CENTER_Y = 0.186;

// --- STEP 1: EMBED THE WORKER CODE ---
const workerCode = `
self.onmessage = (e) => {
    const { width, height, zoom, centerX, centerY, maxIter } = e.data;
    const palette = generatePalette(maxIter);
    const viewWidth = 5 / zoom;
    const viewHeight = viewWidth / (width / height);
    const xmin = centerX - viewWidth / 2;
    const ymin = centerY - viewHeight / 2;
    const img = new ImageData(width, height);
    const buf = img.data;

    for (let py = 0; py < height; py++) {
        const y0 = ymin + (py / height) * viewHeight;
        for (let px = 0; px < width; px++) {
            const x0 = xmin + (px / width) * viewWidth;
            let x = 0, y = 0, iter = 0;
            while (x * x + y * y <= 4 && iter < maxIter) {
                const xt = x * x - y * y + x0;
                y = 2 * x * y + y0;
                x = xt;
                iter++;
            }
            const p_idx = (py * width + px) * 4;
            const [r, g, b] = palette[iter];
            buf[p_idx] = r;
            buf[p_idx + 1] = g;
            buf[p_idx + 2] = b;
            buf[p_idx + 3] = 255;
        }
    }
    self.postMessage(img, [img.data.buffer]);
};

function generatePalette(maxIter) {
    const palette = new Array(maxIter + 1);
    for (let i = 0; i <= maxIter; i++) {
        if (i === maxIter) {
            palette[i] = [0, 0, 0];
        } else {
            const hue = (i / maxIter) ** 0.5;
            palette[i] = hslToRgb(hue * 360, 1, 0.5);
        }
    }
    return palette;
}

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s == 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h / 360 + 1 / 3);
        g = hue2rgb(p, q, h / 360);
        b = hue2rgb(p, q, h / 360 - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
`;

// --- STEP 2: CREATE THE WORKER FROM THE EMBEDDED CODE ---
const blob = new Blob([workerCode], { type: 'application/javascript' });
const workerURL = URL.createObjectURL(blob);
const worker = new Worker(workerURL);

let isWorkerBusy = false;

worker.onmessage = (e) => {
    const imageData = e.data;
    ctx.putImageData(imageData, 0, 0);
    isWorkerBusy = false; 
};

// --- Core Functions ---

function requestDraw() {
    if (isWorkerBusy) return;
    isWorkerBusy = true;
    
    worker.postMessage({
        width: canvas.width,
        height: canvas.height,
        zoom: zoom,
        centerX: CENTER_X,
        centerY: CENTER_Y,
        maxIter: MAX_ITER
    });
}

function setupCanvas() {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    canvas.width = displayWidth * RESOLUTION_SCALE;
    canvas.height = displayHeight * RESOLUTION_SCALE;
    requestDraw();
}

let debounceTimer;

window.addEventListener('wheel', (event) => {
    // CHANGED: Invert the logic to zoom IN on scroll down...
    if (event.deltaY > 0) {
        zoom *= ZOOM_SENSITIVITY;
    } else {
        // ...and zoom OUT on scroll up.
        zoom /= ZOOM_SENSITIVITY;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(requestDraw, 100);
});

window.addEventListener('resize', setupCanvas, { passive: true });

setupCanvas();