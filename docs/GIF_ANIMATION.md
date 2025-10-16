# GIF Animation Support

## Overview

Pegasus now supports displaying and playing animated GIF files. When you load an animated GIF, the application automatically detects the animation and displays playback controls.

## Features

### Automatic Detection
- When a GIF file is loaded, the application automatically detects if it contains multiple frames (animated)
- Static GIFs (single frame) are displayed normally without playback controls
- Animated GIFs show playback controls below the image

### Playback Controls

The GIF playback controls appear automatically for animated GIFs and include:

1. **Play/Pause Button (▶/⏸)**
   - Click to play or pause the animation
   - Animation plays automatically when first loaded
   - Shows ▶ when paused, ⏸ when playing

2. **Stop Button (■)**
   - Stops playback and returns to the first frame
   - Useful for resetting the animation

3. **Frame Counter**
   - Displays current frame / total frames (e.g., "1/316")
   - Updates in real-time as animation plays

### Animation Behavior

- **Auto-play**: Animated GIFs start playing automatically when loaded
- **Frame timing**: Each frame respects its original delay timing from the GIF metadata
- **Looping**: Supports infinite looping (most GIFs) and limited loops
- **Pause on operations**: Animation automatically pauses when you perform operations like:
  - Undo/Redo (Ctrl+Z / Ctrl+Y)
  - Crop, resize, filter, rotate
  - Format conversion

### Technical Details

- Uses Sharp library's native GIF animation support
- Extracts individual frames on-demand for smooth playback
- Respects original frame delays (in milliseconds)
- Memory efficient - doesn't pre-load all frames

## Usage

### Opening Animated GIFs

1. **Via File Menu**:
   - Click File → Open
   - Select a GIF file
   - If animated, controls appear automatically

2. **Via Drag & Drop**:
   - Drag a GIF file into the application
   - Drop it on the canvas area
   - Controls appear if the GIF is animated

3. **Via Paste**:
   - Copy a GIF file to clipboard
   - Press Ctrl+V in the application
   - Controls appear if the GIF is animated

### Controlling Playback

- **Play**: Click the ▶ button or it plays automatically
- **Pause**: Click the ⏸ button to pause
- **Stop**: Click the ■ button to stop and reset to first frame
- **Frame info**: Watch the frame counter to see current position

### Working with Animated GIFs

1. **Editing**: You can apply filters, resize, crop, etc. to the current displayed frame
2. **Converting**: When you convert to another format, animation is removed (uses current frame)
3. **Saving**: Saves the original animated GIF if extension stays as .gif
4. **Format Change**: Changing extension to non-GIF formats will save the current frame only

## Examples

### Loading an Animated GIF
```javascript
// The application automatically detects animation
// You just open the file normally
await layer.openImage('path/to/animated.gif');
// Controls appear automatically if animated
```

### Checking if GIF is Animated
```javascript
if (layer.isAnimatedGif()) {
  console.log('This is an animated GIF with', layer.gifMetadata.pages, 'frames');
}
```

### Manual Playback Control
```javascript
// Play
layer.playGifAnimation();

// Pause
layer.pauseGifAnimation();

// Stop (reset to frame 0)
layer.stopGifPlayback();
```

## Supported GIF Features

✅ **Supported**:
- Multiple frames (animated GIFs)
- Per-frame delay timing
- Infinite looping (loop = 0)
- Limited looping (loop = N)
- Variable frame delays
- Transparent backgrounds
- Palette-based GIFs

❌ **Not Supported**:
- Editing individual frames
- Creating new animated GIFs from scratch
- Adding/removing frames
- Modifying frame delays

## Performance Notes

- Frame extraction is on-demand (not pre-loaded)
- Smooth playback for most GIFs
- Large GIFs (many frames or high resolution) may have slight delays during frame extraction
- Memory usage is efficient as frames are not kept in memory

## Troubleshooting

### GIF doesn't animate
- Check if it's a static GIF (only 1 frame)
- Verify the file is not corrupted
- Try re-opening the file

### Playback is choppy
- This is normal for GIFs with very short frame delays (<50ms)
- Try a different GIF to verify
- Check system resources (CPU usage)

### Controls don't appear
- Ensure the GIF has multiple frames
- Check the extension is `.gif`
- Try reloading the file

## Implementation Details

The GIF animation support is implemented in:

1. **ImageLoader** (`imgkit/processing/image_loader.js`)
   - Detects animated GIFs via metadata (pages > 1)
   - Extracts individual frames using Sharp's page option
   - Returns GIF metadata (pages, delay, loop)

2. **ImageLayer** (`imgkit/core/image_layer.js`)
   - Manages animation state and playback
   - Creates and controls UI elements (buttons, counter)
   - Schedules frame display based on delays
   - Handles pause/play/stop logic

3. **Sharp Library**
   - Provides native GIF reading with animation support
   - Extracts frames via `sharp(buffer, { page: N })`
   - Returns metadata with pages, delay, loop info
