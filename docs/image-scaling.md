# Image Scaling Feature

## Overview
Pegasus now supports real-time image scaling using keyboard and mouse controls.

## How to Use

### Scaling Images
- **Hold Ctrl + Scroll Mouse Wheel Up**: Scale image up (zoom in)
- **Hold Ctrl + Scroll Mouse Wheel Down**: Scale image down (zoom out)

### Scale Range
- **Minimum Scale**: 10% (0.1x) of original size
- **Maximum Scale**: 500% (5.0x) of original size
- **Scale Step**: 10% (0.1x) increment per scroll

### Visual Feedback
- The image info text shows current dimensions and scale percentage
- Example: "1200 x 900 (150%)" means the image is scaled to 150% of its original size

### Mode Behavior
- **Normal Mode**: Ctrl+scroll scales the image
- **Draw Mode**: Ctrl+scroll adjusts line width (existing behavior)

## Technical Notes
- Scaling maintains image quality by using the original image buffer
- Each image layer tracks its own scale factor independently
- Scale resets to 100% when a new image is loaded
- Browser zoom is prevented when using Ctrl+scroll on images