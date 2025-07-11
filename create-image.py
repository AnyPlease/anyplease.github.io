import numpy as np
import matplotlib.pyplot as plt
from numba import jit

## 1. Image and Mandelbrot Parameters
WIDTH = 1920
HEIGHT = 1080
FILENAME = "mandelbrot-background.jpg"
MAX_ITER = 400  # Increase for more detail, decrease for faster generation

# This function calculates the iterations for a single point.
# The @jit decorator from Numba compiles this to highly optimized machine code.
@jit(nopython=True)
def mandelbrot(c, max_iter):
    z = 0
    n = 0
    while abs(z) <= 2 and n < max_iter:
        z = z*z + c
        n += 1
    return n

## 2. Main Generation Logic
def create_fractal(min_x, max_x, min_y, max_y, width, height, max_iter):
    # Create an empty array to store the iteration counts for each pixel
    img_array = np.zeros((height, width))

    # Loop over each pixel
    for py in range(height):
        for px in range(width):
            # Map pixel coordinates to the complex plane
            real = min_x + px / (width - 1) * (max_x - min_x)
            imag = min_y + py / (height - 1) * (max_y - min_y)
            c = complex(real, imag)
            
            # Get the iteration count and store it
            img_array[py, px] = mandelbrot(c, max_iter)
            
    return img_array

## 3. Generate and Save the Image
if __name__ == '__main__':
    print("Generating Mandelbrot set... (This may take a minute)")
    
    # Create the fractal data
    # Coordinates are chosen to center on the "Seahorse Valley"
    fractal_data = create_fractal(-2.0, 1.0, -1.5, 1.5, WIDTH, HEIGHT, MAX_ITER)
    
    print("Saving image...")
    
    # Use Matplotlib to save the array as a high-quality image
    fig = plt.figure(frameon=False)
    fig.set_size_inches(WIDTH / 100, HEIGHT / 100) # Set size in inches
    ax = plt.Axes(fig, [0., 0., 1., 1.])
    ax.set_axis_off()
    fig.add_axes(ax)
    
    # Use the 'twilight_shifted' colormap for a dark, beautiful look
    ax.imshow(fractal_data, cmap='twilight_shifted', aspect='auto')
    
    # Save the final image without any border or padding
    plt.savefig(FILENAME, dpi=100, bbox_inches='tight', pad_inches=0)
    
    print(f"Successfully saved '{FILENAME}'")