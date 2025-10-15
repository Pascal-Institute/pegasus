# ImgKit - Image Processing Module

A modular image processing library for Electron applications with unified mode system and clean separation of concerns.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [File Structure](#file-structure)
- [Core Components](#core-components)
- [Mode System](#mode-system)
- [API Reference](#api-reference)
- [Data Flow](#data-flow)
- [Usage Examples](#usage-examples)
- [Design Principles](#design-principles)

---

## Architecture Overview

ImgKit follows a layered architecture pattern with unified mode management:

```
┌──────────────────────────────────────────────┐
│         Presentation Layer                   │
│         (renderer.js)                        │
│  • Manages scrollable container              │
│  • Coordinates multiple image panels         │
│  • Global mode coordination (e.g., magnify)  │
└─────────────────┬────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────┐
│         Component Layer                      │
│         (image-layer.js)                     │
│  • Individual image panel logic              │
│  • Undo/redo history management              │
│  • Mode-based interaction handling           │
└─────────────────┬────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────┐
│         Mode Management Layer                │
│         (image-mode.js)                      │
│  • Unified mode system (replaces flags)      │
│  • Mode validation and transitions           │
│  • Cursor management per mode                │
└─────────────────┬────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────┐
│         Event Handling Layer                 │
│         (image-layer-events.js)              │
│  • Mode-specific event handlers              │
│  • Cropping, Drawing, Magnifying             │
│  • Keyboard shortcuts & context menu         │
└─────────────────┬────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────┐
│         Processing Layer                     │
│         (image-processor.js)                 │
│  • Pure image processing functions           │
│  • Format conversion                         │
│  • Color extraction                          │
└──────────────────────────────────────────────┘
```

---

## File Structure

```
imgkit/
├── main.js                  # Module entry point and exports
├── image-processor.js       # Pure image processing logic
├── image-mode.js            # ✨ Unified mode system
├── renderer.js              # UI container manager
├── image-layer.js           # Individual image panel component
├── image-layer-events.js    # Mode-specific event handlers
├── package.json             # Module configuration
└── README.md                # This file
```

**Key Improvements:**

- ✅ Unified mode system (no more flag-based state)
- ✅ Clear separation between UI and business logic
- ✅ Mode-based event handling
- ✅ No circular dependencies

---

## Core Components

### 1. ImageMode & ModeManager (image-mode.js) ✨ NEW

**Purpose:** Unified mode system replacing individual flags

**Available Modes:**

```javascript
const ImageMode = {
  NORMAL: "normal", // Default mode
  DRAWING: "drawing", // Drawing/painting on canvas
  CROPPING: "cropping", // Selecting crop area
  MAGNIFY: "magnify", // Magnifying glass (Alt + A)
  COLORPICKER: "colorpicker", // Color extraction from pixel
};
```

**ModeManager API:**

```javascript
// Create mode manager (one per ImageLayer)
const manager = new ModeManager();

// Set mode
manager.setMode(ImageMode.CROPPING);

// Check current mode
manager.isNormal(); // → false
manager.isCropping(); // → true
manager.isDrawing(); // → false
manager.isMagnifying(); // → false
manager.isColorPicker(); // → false

// Get mode
manager.getMode(); // → 'cropping'

// Get cursor for current mode
manager.getCursor(); // → 'crosshair'

// Mode history
manager.reset(); // → Back to NORMAL
manager.restorePrevious(); // → Restore previous mode
```

**Benefits over Flag System:**

- ✅ Mutually exclusive states (can't be in DRAWING and MAGNIFYING simultaneously)
- ✅ Type-safe enum prevents typos
- ✅ Centralized cursor management
- ✅ Easy to extend with new modes
- ✅ Clear state transitions with history

**Comparison:**

```javascript
// ❌ Before: Multiple flags (error-prone)
this.drawFlag = false;
this.magnifyFlag = false;
this.cropFlag = true;
if (drawFlag && !magnifyFlag && !cropFlag) { ... }

// ✅ After: Single mode (clear)
this.modeManager.setMode(ImageMode.CROPPING);
if (this.modeManager.isCropping()) { ... }
```

---

### 2. ImageProcessor (image-processor.js)

**Purpose:** Pure image processing functions with no UI dependencies

**Key Features:**

- Image file I/O (open, save)
- Format conversion (PNG, JPG, BMP, ICO, TIFF, WEBP)
- Image operations (resize, crop, blur, sharpen)
- Color extraction algorithm
- Temporary file management

**API:**

```javascript
static async openImage(filepath)
static async openImageBuffer(buffer, filename)
static async saveImage(buffer, filepath)
static async processImage(buffer, options)
static async applyCrop(buffer, imageInfo, cropData)
static async convertFormat(buffer, fromExt, toExt)
static async extractColors(buffer, info, count)
```

**Dependencies:** Sharp, sharp-bmp, sharp-ico

---

### 2. ImageProcessor (image-processor.js)

**Purpose:** Pure image processing functions with no UI dependencies

**Key Features:**

- Image file I/O (open, save)
- Format conversion (PNG, JPG, BMP, ICO, TIFF, WEBP)
- Image operations (resize, crop, blur, sharpen)
- Color extraction algorithm (including single pixel)
- Temporary file management

**API:**

```javascript
static async openImage(filepath)
static async openImageBuffer(buffer, filename)
static async saveImage(buffer, filepath)
static async processImage(buffer, options)
static async applyCrop(buffer, imageInfo, cropData)
static async convertFormat(buffer, fromExt, toExt)
static async extractColors(buffer, info, count)
static async extractColorAt(buffer, info, x, y)  // ✨ NEW
```

**Dependencies:** Sharp, sharp-bmp, sharp-ico

---

### 3. ImageLayer (image-layer.js)

**Purpose:** Manages individual image panel state and operations

**State Management:**

- Image data (buffer, metadata, filename)
- Undo/redo history (max 10 entries)
- **Mode manager** (replaces individual flags) ✨
- UI state (focus, visibility)
- Crop selection coordinates

**Operations:**

```javascript
async openImage(filepath)
async openImageBuffer(buffer, filename)
async saveImage(filepath)
async convertFormat(newExtension)
async processImage(options)
async applyCrop(cropData)
undo()
redo()
destroy()
```

**Mode Integration:**

```javascript
// Each ImageLayer has its own mode manager
constructor(renderer) {
  this.modeManager = new ModeManager();  // ✨ Per-layer modes
  // ...
}
```

---

### 4. ImageLayerEvents (image-layer-events.js)

**Purpose:** Mode-specific event handling for image panels

**Organized by Mode:**

```javascript
setupCropping(); // CROPPING mode events
setupDrawing(); // DRAWING mode events
setupMagnifying(); // MAGNIFY mode events
setupDragDrop(); // File upload events
setupKeyboardShortcuts();
setupContextMenu();
setupPanelDragging();
```

**Mode-Based Event Handling:**

```javascript
// Cropping only works in CROPPING mode
setupCropping() {
  canvas.addEventListener("mousedown", (e) => {
    if (!this.layer.modeManager.isCropping()) return;  // ✅ Mode check
    // Handle crop selection...
  });
}

// Magnifying only works in MAGNIFY mode
setupMagnifying() {
  canvas.addEventListener("mousemove", (e) => {
    if (!this.layer.modeManager.isMagnifying()) return;  // ✅ Mode check
    // Draw magnifying glass...
  });
}
```

**Color Picker Integration:**

```javascript
canvas.addEventListener("click", async (e) => {
  if (this.layer.modeManager.isColorPicker()) {
    // ✨ NEW
    const color = await ImageProcessor.extractColorAt(buffer, info, x, y);
    ipcRenderer.send("colorpickerValueSEND", color);
  }
});
```

---

### 5. ImgKitRenderer (renderer.js)

**Purpose:** Manages the scrollable container and coordinates image panels

**Responsibilities:**

- Create and delete image layers
- Manage layer navigation and focus
- Handle copy/paste between layers
- Display notification messages
- **Global mode coordination** (e.g., Alt + A magnify) ✨
- Control horizontal scroll behavior

**API:**

```javascript
createImageLayer(isDefault);
createDefaultImage();
getCurrentLayer();
setCurrentLayer(index);
swapLayers(fromIndex, toIndex);
copyImage();
pasteImage();
deleteImage();
showMessage(type);
updateScrollUI();
```

**Global Mode Management:**

```javascript
{
  imageLayerQueue: [],    // Array of ImageLayer instances
  currentIndex: 0,        // Active layer index
  copiedLayer: null,      // Clipboard data
  messages: {},           // Notification elements
  globalMode: ImageMode.NORMAL  // ✨ Global mode state
}

// Alt + A shortcut affects all layers
setupGlobalMagnifyShortcut() {
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key === "a") {
      this.globalMode = ImageMode.MAGNIFY;
      this.imageLayerQueue.forEach(layer => {
        layer.modeManager.setMode(ImageMode.MAGNIFY);
      });
    }
  });
}
```

---

## Mode System

### Mode Architecture

Each `ImageLayer` has its own `ModeManager` instance, allowing different layers to be in different modes simultaneously (though typically only the active layer's mode matters for user interaction).

**Mode Flow Example (Cropping):**

```
1. User clicks Crop button
   ↓
2. main_renderer.js sends 'cropImgCMD'
   ↓
3. currentLayer.modeManager.setMode(ImageMode.CROPPING)
   ↓
4. setupCropping() mousedown handler activates
   ↓
5. User drags to select area
   ↓
6. On mouseup → applyCrop() executes
   ↓
7. Mode can stay CROPPING or reset to NORMAL
```

### Mode Transitions

```javascript
// From main_renderer.js
ipcRenderer.on("cropImgCMD", (event) => {
  currentLayer.modeManager.setMode(ImageMode.CROPPING);
  currentLayer.canvas.style.cursor = "crosshair";
});

ipcRenderer.on("drawImgCMD", (event, res) => {
  if (res) {
    currentLayer.modeManager.setMode(ImageMode.DRAWING);
  } else {
    currentLayer.modeManager.reset(); // Back to NORMAL
  }
});

ipcRenderer.on("colorpickerImgCMD", (event, res) => {
  if (res) {
    currentLayer.modeManager.setMode(ImageMode.COLORPICKER);
  } else {
    currentLayer.modeManager.reset();
  }
});
```

### Mode-Specific Behavior

**NORMAL Mode:**

- Default cursor (pointer on panel)
- No special canvas interactions
- Panel draggable for reordering

**CROPPING Mode:**

- Crosshair cursor
- Mouse drag selects crop rectangle
- Dashed rectangle preview
- mouseup applies crop

**MAGNIFY Mode:**

- Zoom-in cursor
- Mouse move shows magnified preview
- Uses overlay canvas (no flicker)
- Alt + A toggle (global)

**DRAWING Mode:**

- Custom drawing cursor
- Canvas stroke on mouse drag
- Line width control with Ctrl + Scroll
- Color selection

**COLORPICKER Mode:**

- Crosshair cursor
- Click extracts pixel color
- Sends color via IPC to paint panel
- Auto-reset after selection

---

## API Reference

### Module Exports (main.js)

```javascript
const imgkit = require("imgkit");

// Available exports:
imgkit.ImageProcessor; // Pure processing functions
imgkit.imgKitRenderer; // Singleton UI manager
imgkit.createDefaultImage; // Helper function
imgkit.ImageMode; // ✨ Mode enum
imgkit.ModeManager; // ✨ Mode manager class
```

### ImageMode Enum

```javascript
const { ImageMode } = require("imgkit");

ImageMode.NORMAL; // 'normal'
ImageMode.DRAWING; // 'drawing'
ImageMode.CROPPING; // 'cropping'
ImageMode.MAGNIFY; // 'magnify'
ImageMode.COLORPICKER; // 'colorpicker'
```

### ModeManager Class

```javascript
const { ModeManager, ImageMode } = require("imgkit");

const manager = new ModeManager();

// Set mode
manager.setMode(ImageMode.CROPPING);

// Check mode
manager.isNormal(); // → boolean
manager.isDrawing(); // → boolean
manager.isCropping(); // → boolean
manager.isMagnifying(); // → boolean
manager.isColorPicker(); // → boolean

// Get mode
manager.getMode(); // → 'cropping'

// Utilities
manager.getCursor(); // → 'crosshair' (based on current mode)
manager.reset(); // → Set to NORMAL
manager.restorePrevious(); // → Restore previous mode
```

### ImageProcessor Methods

**openImage(filepath)**

```javascript
const result = await ImageProcessor.openImage("/path/to/image.png");
// Returns: { buffer, info, filename, extension, colors }
```

**extractColorAt(buffer, info, x, y)** ✨ NEW

```javascript
const color = await ImageProcessor.extractColorAt(buffer, info, 150, 200);
// Returns: '#ff5733' (hex color at pixel x=150, y=200)
```

**processImage(buffer, options)**

```javascript
const result = await ImageProcessor.processImage(buffer, {
  resize: { width: 800, height: 600 },
  blur: 2,
  sharpen: true,
  format: "jpg",
});
// Returns: { buffer, info }
```

**applyCrop(buffer, imageInfo, cropData)**

```javascript
const result = await ImageProcessor.applyCrop(buffer, imageInfo, {
  x: 100,
  y: 100,
  width: 500,
  height: 500,
});
// Returns: { buffer, info }
```

**convertFormat(buffer, fromExt, toExt)**

```javascript
const result = await ImageProcessor.convertFormat(buffer, "png", "jpg");
// Returns: { buffer, info }
```

**extractColors(buffer, info, count)**

```javascript
const colors = await ImageProcessor.extractColors(buffer, info, 3);
// Returns: ['#ff5733', '#33ff57', '#3357ff']
```

---

## Data Flow

### Opening an Image

```
User drops file
     ↓
ImageLayerEvents.setupDragDrop()
     ↓
ImageLayer.openImage(filepath)
     ↓
ImageProcessor.openImage(filepath)
     ↓
Sharp processes file
     ↓
Extract dominant colors
     ↓
Return {buffer, info, colors}
     ↓
ImageLayer.updatePreview()
     ↓
Canvas renders image
```

### Crop Operation

```
User drags selection on canvas
     ↓
ImageLayerEvents captures coordinates
     ↓
ImageLayer.applyCrop(cropData)
     ↓
ImageProcessor.applyCrop(buffer, info, cropData)
     ↓
Sharp.extract() operation
     ↓
Return {buffer, info}
     ↓
ImageLayer.addToHistory()
     ↓
ImageLayer.updatePreview()
     ↓
Canvas shows cropped image
```

### Format Conversion

```
User selects new format from dropdown
     ↓
ImageLayer.convertFormat(newExtension)
     ↓
ImageProcessor.convertFormat(buffer, oldExt, newExt)
     ↓
Sharp.toFormat() or special converter (BMP/ICO)
     ↓
Return {buffer, info}
     ↓
Update extension and filepath
     ↓
ImageLayer.updatePreview()
     ↓
Show success message
```

---

## Usage Examples

### Basic Image Loading

```javascript
const { imgKitRenderer } = require("imgkit");

// Renderer initializes automatically with default placeholder
// User can drag and drop images onto canvas

// Programmatic image loading
const layer = imgKitRenderer.createImageLayer();
await layer.openImage("/path/to/photo.jpg");
```

### Using Mode System

```javascript
const { imgKitRenderer, ImageMode } = require("imgkit");

const currentLayer = imgKitRenderer.getCurrentLayer();

// Enter cropping mode
currentLayer.modeManager.setMode(ImageMode.CROPPING);
// User can now drag to select crop area

// Enter magnify mode
currentLayer.modeManager.setMode(ImageMode.MAGNIFY);
// User can move mouse to see magnified preview

// Check current mode
if (currentLayer.modeManager.isCropping()) {
  console.log("In cropping mode");
}

// Reset to normal
currentLayer.modeManager.reset();
```

### Color Picker Workflow

```javascript
const { ImageMode } = require("imgkit");

// 1. Activate color picker mode
currentLayer.modeManager.setMode(ImageMode.COLORPICKER);

// 2. User clicks on canvas
// 3. Image-layer-events.js handles the click:
canvas.addEventListener("click", async (e) => {
  if (this.layer.modeManager.isColorPicker()) {
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const color = await ImageProcessor.extractColorAt(buffer, info, x, y);

    // Send color to paint panel
    ipcRenderer.send("colorpickerValueSEND", color);
  }
});

// 4. Paint panel receives color
ipcRenderer.on("colorpickerValueRECV", (event, color) => {
  document.getElementById("colorValue").textContent = color;
});
```

### Image Processing

```javascript
const { imgKitRenderer, ImageProcessor } = require("imgkit");

const currentLayer = imgKitRenderer.getCurrentLayer();

// Using layer methods (recommended)
await currentLayer.processImage({
  resize: { width: 1920, height: 1080 },
  sharpen: true,
});

// Using ImageProcessor directly
const result = await ImageProcessor.processImage(currentLayer.buffer, {
  blur: 5,
  format: "png",
});
currentLayer.updatePreview(result.buffer, result.info);
```

### History Management

```javascript
const layer = imgKitRenderer.getCurrentLayer();

// Make changes
await layer.processImage({ blur: 2 });
await layer.processImage({ sharpen: true });

// Undo last operation
layer.undo();

// Redo operation
layer.redo();
```

### Color Extraction

```javascript
const { ImageProcessor } = require("imgkit");

const layer = imgKitRenderer.getCurrentLayer();

// Extract dominant colors
const colors = await ImageProcessor.extractColors(
  layer.buffer,
  layer.info,
  5 // Extract 5 dominant colors
);
console.log("Dominant colors:", colors);
// Output: ['#2c3e50', '#ecf0f1', '#e74c3c', '#3498db', '#f39c12']

// Extract color at specific pixel
const pixelColor = await ImageProcessor.extractColorAt(
  layer.buffer,
  layer.info,
  150, // x coordinate
  200 // y coordinate
);
console.log("Pixel color:", pixelColor);
// Output: '#3498db'
```

---

## Design Principles

### 1. Unified Mode System

**Problem (Before):**

```javascript
// Multiple flags - prone to conflicting states
this.drawFlag = true;
this.magnifyFlag = true;  // ❌ Can't draw and magnify!
this.cropFlag = false;

// Complex conditions everywhere
if (drawFlag && !magnifyFlag && !cropFlag) { ... }
```

**Solution (After):**

```javascript
// Single mode - mutually exclusive states
this.modeManager.setMode(ImageMode.DRAWING);

// Clear, simple checks
if (this.modeManager.isDrawing()) { ... }
```

**Benefits:**

- ✅ **State Consistency:** Can't be in DRAWING and MAGNIFY simultaneously
- ✅ **Type Safety:** Enum prevents typos (IDE autocomplete)
- ✅ **Maintainability:** Add new mode = add one enum value
- ✅ **Clarity:** Mode name clearly indicates behavior
- ✅ **History:** Built-in previous mode tracking

### 2. Separation of Concerns

**Processing Layer (image-processor.js)**

- Pure functions only
- No UI dependencies
- No state management
- Testable in isolation

**Mode Layer (image-mode.js)**

- Mode enum definition
- Mode validation
- Mode transition logic
- Cursor management

**Component Layer (image-layer.js)**

- Manages component state
- Bridges UI events to processing
- Owns ModeManager instance

**Event Layer (image-layer-events.js)**

- Mode-specific event handlers
- Separated by functionality (cropping, drawing, magnifying)
- No business logic

**Presentation Layer (renderer.js)**

- Manages UI container
- Global mode coordination
- No business logic

### 3. Single Responsibility

Each module has one clear purpose:

- **ImageProcessor:** Image manipulation (pure functions)
- **ImageMode:** Mode definition and validation
- **ModeManager:** Mode state management
- **ImageLayer:** Panel state and operations
- **ImageLayerEvents:** Event handling
- **ImgKitRenderer:** Container coordination

### 4. No Circular Dependencies

**Dependency Flow:**

```
renderer.js ──────┐
                  ↓
image-layer.js ───┼──→ image-processor.js
                  ↓
image-mode.js ────┘

(No circular references)
```

### 5. Event-Driven Architecture

**Mode Changes:**

```javascript
// Mode change can trigger callbacks
modeManager.onModeChange = (newMode, oldMode) => {
  console.log(`${oldMode} → ${newMode}`);
  updateCursor();
};
```

**IPC Communication:**

```javascript
// Renderer → Main Process → BrowserView
ipcRenderer.send("colorpickerValueSEND", color);
// Main process broadcasts to all BrowserViews
views.forEach((view) => {
  view.webContents.send("colorpickerValueRECV", color);
});
```

### 6. Error Handling

All async operations include try-catch blocks:

```javascript
try {
  const result = await ImageProcessor.openImage(filepath);
  this.updatePreview(result.buffer, result.info);
} catch (error) {
  this.renderer.showMessage("error");
  console.error("Error opening image:", error);
}
```

### 7. Immutability for History

History entries store complete states:

```javascript
addToHistory(buffer, info) {
  this.history.buffers.push(buffer);
  this.history.infos.push(info);
  this.history.index++;
}
```

---

## Technical Details

### Supported Image Formats

**Standard (via Sharp):**

- PNG
- JPEG
- WebP
- GIF
- TIFF

**Special (via helper libraries):**

- BMP (sharp-bmp)
- ICO (sharp-ico)

### Color Extraction Algorithm

```javascript
1. Resize image to 24px width for performance
2. Convert to sRGB color space
3. Extract raw pixel data
4. Count frequency of each RGB combination
5. Sort by frequency
6. Return top N colors in hex format
```

### Temporary File Management

Special formats (BMP, ICO) require temporary files:

```javascript
createTempFileFromBuffer(buffer, filename)
  ↓
Generate temp path in system temp directory
  ↓
Write buffer to file
  ↓
Track in tempFiles array
  ↓
Auto cleanup on app exit
```

### Keyboard Shortcuts

| Shortcut                | Action                   |
| ----------------------- | ------------------------ |
| Arrow Left/Right        | Navigate between images  |
| Ctrl + Arrow Left/Right | Jump to first/last image |
| Ctrl + C                | Copy current image       |
| Ctrl + V                | Paste image              |
| Ctrl + D                | Delete current image     |
| Delete                  | Delete current image     |
| Ctrl + Z                | Undo                     |
| Ctrl + Y                | Redo                     |
| Alt + A                 | Magnify                  |

---

## Dependencies

```json
{
  "sharp": "^0.34.3",
  "sharp-bmp": "^0.1.5",
  "sharp-ico": "^0.1.5"
}
```

**Sharp** is the core image processing library providing:

- High-performance image manipulation
- Multiple format support
- Streaming operations
- Hardware acceleration

---

## Performance Considerations

**Color Extraction:**

- Images resized to 24px width before processing
- Reduces computation time from O(n²) to O(24 × height)

**History Management:**

- Limited to 10 entries per layer
- Prevents excessive memory usage
- Old entries automatically removed

**Lazy Loading:**

- Renderer components loaded only when needed
- Reduces initial bundle size
- Faster startup time

---

## Error Scenarios

**Common Errors:**

- Invalid file path
- Unsupported format
- Corrupted image data
- Invalid crop dimensions (negative, out of bounds)
- File system permissions
- Insufficient memory for large images

**Error Handling Pattern:**

```javascript
try {
  // Operation
} catch (error) {
  this.renderer.showMessage("error");
  console.error("Operation failed:", error);
  // Continue execution, don't crash
}
```

---

## Testing Recommendations

**Unit Tests (ImageProcessor):**

```javascript
describe("ImageProcessor", () => {
  it("should open PNG image", async () => {
    const result = await ImageProcessor.openImage("test.png");
    expect(result.buffer).toBeDefined();
    expect(result.info.format).toBe("png");
  });

  it("should extract colors", async () => {
    const colors = await ImageProcessor.extractColors(buffer, info, 3);
    expect(colors).toHaveLength(3);
    expect(colors[0]).toMatch(/^#[0-9a-f]{6}$/);
  });
});
```

**Integration Tests (ImageLayer):**

```javascript
describe("ImageLayer", () => {
  it("should maintain history", async () => {
    const layer = new ImageLayer(renderer);
    await layer.openImage("test.png");
    await layer.processImage({ blur: 2 });

    layer.undo();
    expect(layer.history.index).toBe(0);
  });
});
```

---

## Contributing Guidelines

**Code Style:**

- Use JSDoc comments for all public methods
- Include parameter types and return values
- Add error handling to all async operations
- Keep functions under 50 lines when possible

**Architecture Rules:**

- No UI code in ImageProcessor
- No business logic in ImageLayerEvents
- Use ImageLayer as bridge between UI and processing
- Maintain single responsibility per class

**Adding New Features:**

1. **New Processing Operation:**

   - Add to ImageProcessor as static method
   - Add wrapper in ImageLayer
   - Update history management if needed

2. **New UI Feature:**

   - Add event handler in ImageLayerEvents
   - Update ImageLayer state as needed
   - Coordinate through ImgKitRenderer if multi-layer

3. **New Format Support:**
   - Add format detection in ImageProcessor
   - Add conversion logic
   - Update file filter in drag & drop

---

## License

Part of the Pegasus image editor application.

---

## Version History

### v2.0.0 (Current)

**Architecture:**

- Removed circular dependencies
- Separated ImageProcessor from main logic
- Simplified module exports
- Improved error handling
- Created `ImageLayer` class for individual panels
- Implemented `ImgKitRenderer` for multi-panel container
- Added `ImageLayerEvents` for event delegation
- Introduced undo/redo history system

**Mode System:**

- Unified `ImageMode` enum system (NORMAL, DRAWING, CROPPING, MAGNIFY, COLORPICKER)
- `ModeManager` class for state management with validation
- Mode-specific event handlers: `setupCropping()`, `setupDrawing()`, `setupMagnifying()`
- Mode history tracking with `previousMode` and `restorePrevious()`
- Mode-aware cursor management via `getCursor()` method
- Global mode coordination for magnify (Alt+A affects all layers)

**Features:**

- **Color Picker Mode:** Click on image to extract pixel color and send to paint panel
- IPC communication for color picker: `colorpickerValueSEND` → Main → `colorpickerValueRECV`
- Enhanced `ImageProcessor.extractColorAt(buffer, info, x, y)` for single-pixel extraction

**API:**

```javascript
// Mode management
const { ImageMode, ModeManager } = require('imgkit');
imageLayer.modeManager.setMode(ImageMode.DRAWING);
if (imageLayer.modeManager.isMagnifying()) { ... }
```

---

### v1.0.0 - Initial Release

- Basic Sharp image processing integration
- Single image panel support (just 1 index.js file)
- Direct DOM manipulation
- Monolithic renderer architecture

---

Last Updated: January 2025
