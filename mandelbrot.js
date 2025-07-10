/*
  Real-Time Mandelbrot Animation (Optimized for Performance)
*/

// --- Core Elements ---
const canvas = document.getElementById("mandelbrot-canvas");
const ctx = canvas.getContext("2d");

// --- Performance & Animation Parameters ---

// **OPTIMIZATION 1: Lower Iteration Count**
// This is the biggest factor for performance. Lower values are much faster.
// 50 provides a good balance between detail and speed for a background.
const MAX_ITER = 50;

// **OPTIMIZATION 2: Render at a Lower Resolution**
// We'll set the canvas's internal resolution to be a fraction of its
// display size. The browser will scale it up, which is very fast.
// A value of 0.5 means we calculate 1/4 of the pixels.
const RESOLUTION_SCALE = 0.5;

// Animation parameters
let zoom = 1.0;
const ZOOM_SPEED = 8000; // Time in ms for a full zoom cycle
const START_ZOOM = 1.0;
const END_ZOOM = 250.0; // Increased zoom for more effect

// --- CORRECTED COORDINATES ---
// Target the visually interesting "Seahorse Valley" region
const CENTER_X = -0.745;
const CENTER_Y = 0.186;

// --- Color Palette ---
// Pre-calculating the color palette is more efficient than doing it each frame.
const palette = new Array(MAX_ITER + 1);
for (let i = 0; i <= MAX_ITER; i++) {
    if (i === MAX_ITER) {
        palette[i] = [0, 0, 0]; // Black for points inside the set
    } else {
        // Create a smooth color gradient
        const hue = (i / MAX_ITER) ** 0.5; // Use sqrt for a nicer color distribution
        palette[i] = hslToRgb(hue * 360, 1, 0.5);
    }
}

// --- Main Drawing & Animation Loop ---

let startTime = null;

function animate(timestamp) {
    if (!startTime) {
        startTime = timestamp;
    }
    const elapsedTime = timestamp - startTime;

    // Use a sine wave for a smooth, looping zoom effect
    const zoomProgress = 0.5 + 0.5 * Math.sin(elapsedTime / ZOOM_SPEED);
    zoom = START_ZOOM + (END_ZOOM - START_ZOOM) * zoomProgress;
    
    draw();
    requestAnimationFrame(animate);
}

function draw() {
    const w = canvas.width;
    const h = canvas.height;
    const aspect = w / h;

    const viewWidth = 5 / zoom;
    const viewHeight = viewWidth / aspect;

    const xmin = CENTER_X - viewWidth / 2;
    const ymin = CENTER_Y - viewHeight / 2;

    const img = ctx.createImageData(w, h);
    const buf = img.data;

    // Loop through each pixel of the scaled-down canvas
    for (let py = 0; py < h; py++) {
        const y0 = ymin + (py / h) * viewHeight;
        for (let px = 0; px < w; px++) {
            const x0 = xmin + (px / w) * viewWidth;

            let x = 0, y = 0, iter = 0;
            while (x * x + y * y <= 4 && iter < MAX_ITER) {
                const xt = x * x - y * y + x0;
                y = 2 * x * y + y0;
                x = xt;
                iter++;
            }
            
            const p_idx = (py * w + px) * 4;
            const [r, g, b] = palette[iter];
            buf[p_idx] = r;
            buf[p_idx + 1] = g;
            buf[p_idx + 2] = b;
            buf[p_idx + 3] = 255; // Alpha
        }
    }
    ctx.putImageData(img, 0, 0);
}

// --- Setup ---

function setupCanvas() {
    // Get the display size of the canvas
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    // Set the internal (drawing) resolution based on the scale factor
    canvas.width = displayWidth * RESOLUTION_SCALE;
    canvas.height = displayHeight * RESOLUTION_SCALE;
    
    // The CSS will automatically scale this smaller canvas up to 100% width/height
}

// HSL to RGB color conversion utility
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

// --- Kick-off ---
window.addEventListener('resize', setupCanvas);
setupCanvas();
requestAnimationFrame(animate);
