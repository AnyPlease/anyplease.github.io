/*
  Mandelbrot Calculation Worker
  This script runs in the background and does not have access to the DOM (e.g., canvas).
*/

// When the main script sends a message, this function runs.
self.onmessage = (e) => {
    const { width, height, zoom, centerX, centerY, maxIter } = e.data;

    // Pre-calculate the color palette
    const palette = generatePalette(maxIter);

    const viewWidth = 5 / zoom;
    const viewHeight = viewWidth / (width / height);
    const xmin = centerX - viewWidth / 2;
    const ymin = centerY - viewHeight / 2;

    // Use a standard ImageData object
    const img = new ImageData(width, height);
    const buf = img.data;

    // Loop through each pixel
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
            buf[p_idx + 3] = 255; // Alpha
        }
    }
    
    // Send the completed ImageData object back to the main thread.
    // The second argument [img.data.buffer] is a "Transferable Object",
    // which transfers ownership to the main thread with zero-copy for max speed.
    self.postMessage(img, [img.data.buffer]);
};

// --- Utility Functions (must be self-contained in the worker) ---

function generatePalette(maxIter) {
    const palette = new Array(maxIter + 1);
    for (let i = 0; i <= maxIter; i++) {
        if (i === maxIter) {
            palette[i] = [0, 0, 0]; // Black
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