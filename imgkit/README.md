# ImgKit - Image Processing Module

A modular image processing library for Electron applications with a clean separation of concerns and intuitive API.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [File Structure](#file-structure)
- [Core Components](#core-components)
- [API Reference](#api-reference)
- [Data Flow](#data-flow)
- [Usage Examples](#usage-examples)
- [Design Principles](#design-principles)

---

## Architecture Overview

ImgKit follows a layered architecture pattern separating image processing logic, UI components, and event handling:

```
┌──────────────────────────────────────────────┐
│         Presentation Layer                   │
│         (renderer.js)                        │
│  • Manages scrollable container              │
│  • Coordinates multiple image panels         │
│  • Handles copy/paste operations             │
└─────────────────┬────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────┐
│         Component Layer                      │
│         (image-layer.js)                     │
│  • Individual image panel logic              │
│  • Undo/redo history management              │
│  • Bridges UI events to processing           │
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
├── renderer.js              # UI container manager
├── image-layer.js           # Individual image panel component
├── image-layer-events.js    # Event handlers for image panels
├── package.json             # Module configuration
└── README.md                # This file
```

**Key Characteristics:**
- No circular dependencies
- Clear separation between UI and business logic
- Each file has a single, well-defined responsibility

---

## Core Components

### 1. ImageProcessor (image-processor.js)

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

### 2. ImageLayer (image-layer.js)

**Purpose:** Manages individual image panel state and operations

**State Management:**
- Image data (buffer, metadata, filename)
- Undo/redo history (max 10 entries)
- UI state (focus, visibility, crop mode)
- Drawing/cropping coordinates

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

**History Structure:**
```javascript
{
  buffers: [],      // Previous image states
  infos: [],        // Image metadata for each state
  extensions: [],   // File extensions for each state
  index: -1,        // Current position in history
  maxSize: 10       // Maximum history entries
}
```

---

### 3. ImageLayerEvents (image-layer-events.js)

**Purpose:** Event handling logic for image panels

**Event Types:**
- Drag & Drop (file upload)
- Keyboard shortcuts (navigation, undo/redo)
- Context menu (copy/paste)
- Mouse interactions (focus, crop selection)
- Panel dragging (reorder)

**Key Methods:**
```javascript
setupEvents()
setupDragDrop()
setupKeyboardShortcuts()
setupContextMenu()
setupDrawingAndCropping()
setupPanelDragging()
```

---

### 4. ImgKitRenderer (renderer.js)

**Purpose:** Manages the scrollable container and coordinates image panels

**Responsibilities:**
- Create and delete image layers
- Manage layer navigation and focus
- Handle copy/paste between layers
- Display notification messages
- Control horizontal scroll behavior

**API:**
```javascript
createImageLayer(isDefault)
createDefaultImage()
getCurrentLayer()
setCurrentLayer(index)
swapLayers(fromIndex, toIndex)
copyImage()
pasteImage()
deleteImage()
showMessage(type)
updateScrollUI()
```

**State:**
```javascript
{
  imageLayerQueue: [],  // Array of ImageLayer instances
  currentIndex: 0,      // Active layer index
  copiedLayer: null,    // Clipboard data
  messages: {},         // Notification elements
  globalMagnifyFlag: false  // Magnifying glass state
}
```

---

## API Reference

### Module Exports (main.js)

```javascript
const imgkit = require('imgkit');

// Available exports:
imgkit.ImageProcessor     // Pure processing functions
imgkit.imgKitRenderer     // Singleton UI manager
imgkit.createDefaultImage // Helper function
imgkit.drawFlag           // Crop mode state
```

### ImageProcessor Methods

**openImage(filepath)**
```javascript
const result = await ImageProcessor.openImage('/path/to/image.png');
// Returns: { buffer, info, filename, extension, colors }
```

**processImage(buffer, options)**
```javascript
const result = await ImageProcessor.processImage(buffer, {
  resize: { width: 800, height: 600 },
  blur: 2,
  sharpen: true,
  format: 'jpg'
});
// Returns: { buffer, info }
```

**applyCrop(buffer, imageInfo, cropData)**
```javascript
const result = await ImageProcessor.applyCrop(buffer, imageInfo, {
  x: 100,
  y: 100,
  width: 500,
  height: 500
});
// Returns: { buffer, info }
```

**convertFormat(buffer, fromExt, toExt)**
```javascript
const result = await ImageProcessor.convertFormat(buffer, 'png', 'jpg');
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
const { imgKitRenderer } = require('imgkit');

// Renderer initializes automatically with default placeholder
// User can drag and drop images onto canvas

// Programmatic image loading
const layer = imgKitRenderer.createImageLayer();
await layer.openImage('/path/to/photo.jpg');
```

### Image Processing

```javascript
const { imgKitRenderer, ImageProcessor } = require('imgkit');

const currentLayer = imgKitRenderer.getCurrentLayer();

// Using layer methods (recommended)
await currentLayer.processImage({
  resize: { width: 1920, height: 1080 },
  sharpen: true
});

// Using ImageProcessor directly
const result = await ImageProcessor.processImage(currentLayer.buffer, {
  blur: 5,
  format: 'png'
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
const { ImageProcessor } = require('imgkit');

const layer = imgKitRenderer.getCurrentLayer();
const colors = await ImageProcessor.extractColors(
  layer.buffer,
  layer.info,
  5  // Extract 5 dominant colors
);

console.log('Dominant colors:', colors);
// Output: ['#2c3e50', '#ecf0f1', '#e74c3c', '#3498db', '#f39c12']
```

---

## Design Principles

### 1. Separation of Concerns

**Processing Layer (image-processor.js)**
- Pure functions only
- No UI dependencies
- No state management
- Testable in isolation

**Component Layer (image-layer.js)**
- Manages component state
- Bridges UI events to processing
- No direct DOM manipulation of container

**Presentation Layer (renderer.js)**
- Manages UI container
- Coordinates multiple components
- No business logic

### 2. Single Responsibility

Each class has one clear purpose:
- **ImageProcessor:** Image manipulation
- **ImageLayer:** Panel state and operations
- **ImageLayerEvents:** Event handling
- **ImgKitRenderer:** Container coordination

### 3. No Circular Dependencies

**Before (problematic):**
```
renderer.js ← main.js
     ↓           ↑
     └───────────┘
```

**After (resolved):**
```
renderer.js → ImageProcessor
image-layer.js → ImageProcessor
(No circular references)
```

### 4. Error Handling

All async operations include try-catch blocks:

```javascript
try {
  const result = await ImageProcessor.openImage(filepath);
  this.updatePreview(result.buffer, result.info);
} catch (error) {
  this.renderer.showMessage('error');
  console.error('Error opening image:', error);
}
```

### 5. Immutability for History

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

| Shortcut | Action |
|----------|--------|
| Arrow Left/Right | Navigate between images |
| Ctrl + Arrow Left/Right | Jump to first/last image |
| Ctrl + C | Copy current image |
| Ctrl + V | Paste image |
| Ctrl + D | Delete current image |
| Delete | Delete current image |
| Ctrl + Z | Undo |
| Ctrl + Y | Redo |

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
  this.renderer.showMessage('error');
  console.error('Operation failed:', error);
  // Continue execution, don't crash
}
```

---

## Testing Recommendations

**Unit Tests (ImageProcessor):**
```javascript
describe('ImageProcessor', () => {
  it('should open PNG image', async () => {
    const result = await ImageProcessor.openImage('test.png');
    expect(result.buffer).toBeDefined();
    expect(result.info.format).toBe('png');
  });
  
  it('should extract colors', async () => {
    const colors = await ImageProcessor.extractColors(buffer, info, 3);
    expect(colors).toHaveLength(3);
    expect(colors[0]).toMatch(/^#[0-9a-f]{6}$/);
  });
});
```

**Integration Tests (ImageLayer):**
```javascript
describe('ImageLayer', () => {
  it('should maintain history', async () => {
    const layer = new ImageLayer(renderer);
    await layer.openImage('test.png');
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

**2.0.0** (Current)
- Removed circular dependencies
- Separated ImageProcessor from main logic
- Simplified module exports
- Improved error handling

**1.0.0**
- Initial release with 3-tier architecture

---

Last Updated: October 7, 2025
