# ImgKit - Optimized Architecture

## Overview

ImgKit has been restructured to follow Electron-style architecture with clear separation of concerns:

- **main.js**: Backend logic (image processing)
- **renderer.js**: UI logic (DOM manipulation, events)
- **index.js**: Entry point & bridge layer

## File Structure

```
imgkit/
├── main.js         - Backend: Image processing operations
├── renderer.js     - Frontend: UI components and events
├── index.js        - Entry point: Connects main & renderer
└── package.json    - Dependencies
```

## Architecture

### 1. Main Process (main.js)

**Purpose**: Handle all image processing operations using sharp library

**Key Classes**:

- `ImgKitMain`: Main backend class

**Methods**:

- `processImage(buffer, options)` - Apply transformations (resize, blur, sharpen)
- `convertFormat(buffer, fromExt, toExt)` - Convert between formats
- `openImage(filepath)` - Load image from file path
- `openImageBuffer(buffer, filename)` - Load image from buffer
- `saveImage(buffer, filepath)` - Save image to file
- `extractColors(buffer, info, count)` - Extract dominant colors

### 2. Renderer Process (renderer.js)

**Purpose**: Handle all UI interactions and DOM manipulation

**Key Classes**:

- `ImgKitRenderer`: Main UI controller

  - Manages scroll container and navigation buttons
  - Handles notification messages
  - Coordinates image layers

- `ImageLayer`: Individual image panel
  - Canvas for image display
  - Control elements (delete, name, colors, format)
  - Event handlers (click, drag/drop, keyboard)
  - History management (undo/redo)

**Features**:

- Horizontal scroll navigation
- Drag & drop support
- Context menu (right-click)
- Keyboard shortcuts
- Color palette extraction display
- Format conversion UI

### 3. Entry Point (index.js)

**Purpose**: Initialize components and bridge UI to backend

**Responsibilities**:

- Create instances of ImgKitMain and ImgKitRenderer
- Bridge ImageLayer methods to backend operations
- Provide backward compatibility exports
- Initialize default image placeholder

## Usage

### Basic Initialization

```javascript
const imgkit = require("./imgkit");

// Access renderer for UI operations
const renderer = imgkit.imgKitRenderer;

// Create new image layer
renderer.createDefaultImage();

// Get current layer
const layer = renderer.getCurrentLayer();
```

### Opening Images

```javascript
// From file path
await layer.openImage("/path/to/image.png");

// From buffer (drag & drop)
const buffer = Buffer.from(arrayBuffer);
await layer.openImageBuffer(buffer, "image.png");
```

### Processing Images

```javascript
// Resize
await layer.processImage({
  resize: { width: 800, height: 600 },
});

// Apply blur
await layer.processImage({
  blur: 5,
});

// Sharpen
await layer.processImage({
  sharpen: true,
});

// Crop
await layer.applyCrop({
  x: 10,
  y: 10,
  width: 200,
  height: 200,
});
```

### Format Conversion

```javascript
// Convert to different format
await layer.convertFormat("webp");
await layer.convertFormat("png");
await layer.convertFormat("jpg");
```

### Saving Images

```javascript
// Save to file
await layer.saveImage("/path/to/save.png");
```

## Features

### UI Features

- **Horizontal Scroll**: Navigate between multiple images
- **Drag & Drop**: Drop images onto canvas to load
- **Context Menu**: Right-click for copy/paste options
- **Keyboard Shortcuts**:
  - `Ctrl+C`: Copy image
  - `Ctrl+V`: Paste image
  - `Ctrl+D` / `Delete`: Delete image
  - `Arrow Left/Right`: Navigate between images
  - `Ctrl+Arrow`: Jump to first/last image

### Image Features

- **Format Support**: PNG, JPG, JPEG, WebP, GIF, BMP, ICO, TIF, TIFF
- **Color Extraction**: Automatically extract top 3 dominant colors
- **History**: Undo/Redo support (up to 10 steps)
- **Cropping**: Interactive crop with mouse drag
- **Processing**: Resize, blur, sharpen, format conversion

## Benefits of Optimized Architecture

### 1. Separation of Concerns

- **Backend (main.js)**: Pure image processing logic
- **Frontend (renderer.js)**: Pure UI logic
- **Bridge (index.js)**: Minimal glue code

### 2. Testability

- Backend methods can be tested independently
- UI components can be tested in isolation
- Clear interfaces between layers

### 3. Maintainability

- Easy to locate code (backend vs frontend)
- Changes to UI don't affect processing logic
- Changes to processing don't affect UI

### 4. Scalability

- Can add new image operations without touching UI
- Can add new UI features without touching backend
- Easy to add new format support

### 5. Performance

- Backend operations are optimized
- UI updates are separated from processing
- Async/await pattern for non-blocking operations

## Migration from Old Structure

The old `index.js` (1000+ lines) has been split into:

- **main.js**: ~300 lines of backend logic
- **renderer.js**: ~650 lines of UI logic
- **index.js**: ~200 lines of bridge code

Old code that used:

```javascript
const imgkit = require("./imgkit");
imgkit.createDefaultImage();
```

Still works with backward compatibility exports!

## Dependencies

- `sharp`: Image processing
- `sharp-bmp`: BMP format support
- `sharp-ico`: ICO format support
- `path`, `fs`, `os`: Node.js built-ins

## Notes

- All English comments for international collaboration
- JSDoc-style documentation for better IDE support
- Async/await pattern for modern JavaScript
- Error handling with try/catch
- Temp file management for special formats (BMP, ICO)
