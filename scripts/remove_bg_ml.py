#!/usr/bin/env python3
"""
Remove background from plant PNG images using ML-based segmentation (rembg).
This properly detects and preserves the plant and pot while removing only the background.
"""

from rembg import remove
from PIL import Image
import os
import sys

def process_image(input_path, output_path):
    """Remove background using ML segmentation."""
    with open(input_path, 'rb') as f:
        input_data = f.read()

    output_data = remove(input_data)

    with open(output_path, 'wb') as f:
        f.write(output_data)

    print(f"Processed: {os.path.basename(input_path)}")

def main():
    source_dir = '/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/plants-png'
    output_dir = '/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/frontend/src/assets/plants'

    # Exclude room.png as it's a background image
    exclude_files = {'room.png'}

    if not os.path.exists(source_dir):
        print(f"Source directory not found: {source_dir}")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    processed = 0
    for filename in sorted(os.listdir(source_dir)):
        if filename.endswith('.png') and filename not in exclude_files:
            input_path = os.path.join(source_dir, filename)
            output_path = os.path.join(output_dir, filename)
            process_image(input_path, output_path)
            processed += 1

    print(f"\nProcessed {processed} images")

if __name__ == '__main__':
    main()
