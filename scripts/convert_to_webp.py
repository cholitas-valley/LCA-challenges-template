#!/usr/bin/env python3
"""Convert PNG plant images to optimized WebP format."""

from PIL import Image
import os

def convert_to_webp(input_path, output_path, quality=85):
    """Convert PNG to WebP with given quality."""
    img = Image.open(input_path)
    img.save(output_path, 'WEBP', quality=quality)

    input_size = os.path.getsize(input_path)
    output_size = os.path.getsize(output_path)
    reduction = (1 - output_size / input_size) * 100

    print(f"{os.path.basename(input_path)}: {input_size//1024}KB -> {output_size//1024}KB ({reduction:.1f}% reduction)")

def main():
    plants_dir = '/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/assets/plants'

    total_before = 0
    total_after = 0

    for filename in sorted(os.listdir(plants_dir)):
        if filename.endswith('.png'):
            input_path = os.path.join(plants_dir, filename)
            output_path = os.path.join(plants_dir, filename.replace('.png', '.webp'))

            total_before += os.path.getsize(input_path)
            convert_to_webp(input_path, output_path)
            total_after += os.path.getsize(output_path)

            # Remove old PNG
            os.remove(input_path)

    print(f"\nTotal: {total_before//1024//1024}MB -> {total_after//1024//1024}MB")

if __name__ == '__main__':
    main()
