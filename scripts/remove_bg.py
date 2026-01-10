#!/usr/bin/env python3
"""
Remove light grey/blue background from plant PNG images.
Makes the background transparent.
"""

from PIL import Image
import os
import sys

def remove_background(input_path, output_path, threshold=30):
    """
    Remove near-white/light-grey background from image.

    The plant images have a light grey-blue background (~#E8EAF0 or similar).
    We'll make pixels close to this color transparent.
    """
    img = Image.open(input_path)
    img = img.convert('RGBA')

    data = img.getdata()
    new_data = []

    # Background color is approximately (232, 234, 240) - light greyish blue
    # We'll remove pixels that are very light (high R, G, B values with low variance)
    for item in data:
        r, g, b, a = item

        # Check if pixel is close to the light grey background
        # Background is typically R,G,B all > 220 and similar to each other
        is_light = r > 210 and g > 210 and b > 210
        variance = max(r, g, b) - min(r, g, b)
        is_uniform = variance < threshold

        if is_light and is_uniform:
            # Make transparent
            new_data.append((r, g, b, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, 'PNG')
    print(f"Processed: {os.path.basename(input_path)}")

def main():
    # Process all plant images
    plants_dir = '/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/assets/plants'

    if not os.path.exists(plants_dir):
        print(f"Directory not found: {plants_dir}")
        sys.exit(1)

    processed = 0
    for filename in os.listdir(plants_dir):
        if filename.endswith('.png'):
            input_path = os.path.join(plants_dir, filename)
            # Process in place (overwrite)
            remove_background(input_path, input_path)
            processed += 1

    print(f"\nProcessed {processed} images")

if __name__ == '__main__':
    main()
