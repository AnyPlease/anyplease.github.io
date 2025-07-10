// mandelbrot.js

const canvas = document.getElementById('mandelbrot-canvas');
const ctx = canvas.getContext('2d');

// --- Configuration ---
const MAX_ITERATIONS = 80; // Lower for performance, higher for detail
let zoom = 150;
const offsetX = -0.7;
const offsetY = 0;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Maps a value from one range to another
function map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

// Determines the color of a pixel based on iterations
function getColor(n) {
    if (n === MAX_ITERATIONS) return '#000'; // Black for points in the set
    
    // Smooth coloring using a sine wave for a nice psychedelic effect
    const hue = map(Math.sqrt(n), 0, Math.sqrt(MAX_ITERATIONS), 0, 360);
    return `hsl(${hue}, 100%, 50%)`;
}

function drawMandelbrot() {
    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            
            // Map pixel coordinates to the complex plane
            let a = map(x, 0, canvas.width, -2.5 / zoom + offsetX, 2.5 / zoom + offsetX);
            let b = map(y, 0, canvas.height, -1.5 / zoom + offsetY, 1.5 / zoom + offsetY);

            const ca = a;
            const cb = b;
            let n = 0;

            // The Mandelbrot set iteration
            while (n < MAX_ITERATIONS) {
                const aa = a * a - b * b;
                const bb = 2 * a * b;
                a = aa + ca;
                b = bb + cb;

                if (Math.abs(a + b) > 16) {
                    break; // Point has escaped
                }
                n++;
            }

            // Draw the pixel
            ctx.fillStyle = getColor(n);
            ctx.fillRect(x, y, 1, 1);
        }
    }
}

// --- Animation Loop ---
let time = 0;
function animate(timestamp) {
    time = timestamp / 1000; // Time in seconds

    // Create a smooth looping zoom effect using a sine wave
    const zoomFactor = Math.sin(time * 0.2) * 0.5 + 0.5; // Oscillates between 0 and 1
    zoom = map(zoomFactor, 0, 1, 150, 500); // Map oscillation to a zoom range

    drawMandelbrot();
    requestAnimationFrame(animate);
}

// Initial setup
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
requestAnimationFrame(animate);