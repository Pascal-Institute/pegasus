# ImgKit - Image Processing Module

**ImgKit** is a modular image processing library integrated into the Pegasus application. It provides a clean 3-tier architecture for handling image operations with a focus on separation of concerns and maintainability.

---

## 🏗️ Architecture Overview

ImgKit follows a **3-tier architecture** pattern to separate business logic, UI components, and rendering logic:

```
┌─────────────────────────────────────────────────────┐
│                   Presentation Layer                │
│                    (renderer.js)                    │
│  - Manages UI container and scroll behavior        │
│  - Handles layer creation and deletion              │
│  - Coordinates copy/paste operations                │
│  - Displays notification messages                   │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│                  Component Layer                    │
│                  (image-layer.js)                   │
│  - Individual image panel component                 │
│  - Event handling (drag/drop, keyboard, context)    │
│  - Undo/redo history management                     │
│  - Bridges UI events to backend operations          │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│                   Business Layer                    │
│                     (main.js)                       │
│  - Core image processing (Sharp library)            │
│  - Format conversion (PNG, JPG, BMP, ICO)           │
│  - Color extraction algorithms                      │
│  - File I/O operations                              │
│  - Temporary file management                        │
└─────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
imgkit/
├── main.js              # Backend - Image processing operations
├── renderer.js          # Frontend - UI manager and coordinator
├── image-layer.js       # Component - Individual image panel
└── package.json         # Module configuration
```

---

## 🔧 Tier Breakdown

### 1. Business Layer (`main.js`)

**Responsibility**: Core image processing logic using the Sharp library

**Key Features**:
- Image processing operations (resize, blur, sharpen, crop)
- Format conversion (supports PNG, JPG, BMP, ICO, TIFF)
- Color extraction from images
- File I/O operations
- Temporary file management

**Main Class**: `ImgKitMain`

**Key Methods**:
```javascript
// Process image with various operations
await imgKitMain.processImage(buffer, {
  resize: { width: 800, height: 600 },
  blur: 2,
  sharpen: true
});

// Convert image format
await imgKitMain.convertFormat(buffer, 'png', 'jpg');

// Apply crop operation
await imgKitMain.applyCrop(buffer, imageInfo, {
  x: 100, y: 100, width: 500, height: 500
});

// Extract dominant colors
const colors = await imgKitMain.extractColors(buffer, info, 3);
```

**Design Pattern**: Singleton pattern with lazy-loaded renderer components using Proxy

---

### 2. Component Layer (`image-layer.js`)

**Responsibility**: Manages individual image panel components

**Key Features**:
- Canvas rendering and display
- Event handling (drag & drop, keyboard shortcuts, context menu)
- Undo/redo history management (max 10 steps)
- UI state management (focus, visibility)
- Bridges UI events to backend operations

**Main Class**: `ImageLayer`

**Key Responsibilities**:
```javascript
// Create image panel from template
createPanelFromTemplate()

// Handle user interactions
setupDragDrop()
setupKeyboardShortcuts()
setupContextMenu()

// Image operations (bridges to backend)
await layer.openImage(filepath)
await layer.openImageBuffer(buffer, filename)
await layer.convertFormat('png')
await layer.applyCrop(cropData)

// History management
layer.undo()
layer.redo()
```

**Event Handlers**:
- Drag & Drop: File upload to canvas
- Keyboard: Arrow keys for navigation, Ctrl+C/V for copy/paste
- Context Menu: Right-click menu with Copy/Paste options
- Mouse: Click for focus, hover effects, crop selection

---

### 3. Presentation Layer (`renderer.js`)

**Responsibility**: Manages the UI container and coordinates multiple image layers

**Key Features**:
- Horizontal scroll container management
- Layer creation and deletion
- Copy/paste operations between layers
- Notification message system
- Focus management across layers

**Main Class**: `ImgKitRenderer`

**Key Methods**:
```javascript
// Layer management
const layer = renderer.createImageLayer()
renderer.createDefaultImage()
renderer.deleteImage()

// Navigation
renderer.setCurrentLayer(index)
const current = renderer.getCurrentLayer()

// Copy/Paste
renderer.copyImage()
renderer.pasteImage()

// UI updates
renderer.updateScrollUI()
renderer.showMessage('save')
```

**UI Components**:
- Scroll container with left/right navigation buttons
- Dynamic layer queue (array of ImageLayer instances)
- Message notifications (copy, save, delete, error)

---

## 🔄 Data Flow

### Opening an Image

```
User Action (Drag & Drop)
        ↓
ImageLayer.setupDragDrop() [Component Layer]
        ↓
ImageLayer.openImage(filepath) [Component Layer]
        ↓
ImgKitMain.openImage(filepath) [Business Layer]
        ↓
Sharp library processes image
        ↓
Returns { buffer, info, colors }
        ↓
ImageLayer.updatePreview() [Component Layer]
        ↓
Canvas renders image
```

### Cropping an Image

```
User Action (Mouse drag on canvas)
        ↓
ImageLayer.setupDrawingAndCropping() [Component Layer]
        ↓
ImageLayer.applyCrop(cropData) [Component Layer]
        ↓
ImgKitMain.applyCrop(buffer, info, cropData) [Business Layer]
        ↓
Sharp.extract() operation
        ↓
Returns { buffer, info }
        ↓
ImageLayer.updatePreview() [Component Layer]
        ↓
Canvas renders cropped image
```

---

## 🎯 Design Principles

### 1. Separation of Concerns
- **Business logic** (Sharp operations) isolated in `main.js`
- **UI logic** (DOM manipulation) isolated in `renderer.js` and `image-layer.js`
- **No UI code in business layer**, no business logic in presentation layer

### 2. Single Responsibility
- Each class has one clear purpose
- `ImgKitMain`: Image processing
- `ImageLayer`: Individual panel management
- `ImgKitRenderer`: Container coordination

### 3. Lazy Loading
- Circular dependency prevention using lazy-loaded imports
- `getImgKitMain()` function delays initialization until needed
- Proxy pattern for backward compatibility

### 4. Error Handling
- All async operations wrapped in try-catch
- Meaningful error messages for debugging
- User-friendly error notifications

### 5. Modularity
- Each layer can be modified independently
- Easy to add new image processing operations
- Simple to extend UI components

---

## 🚀 Usage Example

### Basic Usage

```javascript
const { imgKitRenderer, imgKitMain } = require('./imgkit/main.js');

// Renderer automatically initializes with default image
// User can drag & drop images onto canvas

// Programmatically add image
const layer = imgKitRenderer.createImageLayer();
await layer.openImage('/path/to/image.png');

// Process image
await layer.processImage({
  resize: { width: 800 },
  sharpen: true
});

// Save image
await layer.saveImage('/path/to/output.png');
```

### Advanced Usage

```javascript
// Access business layer directly
const result = await imgKitMain.processImage(buffer, {
  resize: { width: 1920, height: 1080 },
  blur: 5,
  format: 'jpg'
});

// Extract colors for analysis
const colors = await imgKitMain.extractColors(buffer, info, 5);
console.log('Dominant colors:', colors);
// Output: ['#ff5733', '#33ff57', '#3357ff', ...]

// Convert format
const converted = await imgKitMain.convertFormat(buffer, 'png', 'ico');
```

---

## 📦 Dependencies

- **sharp**: High-performance image processing library
- **sharp-bmp**: BMP format support
- **sharp-ico**: ICO format support
- **electron**: Desktop application framework

---

## 🔧 Configuration

### Package.json

```json
{
  "name": "imgkit",
  "version": "1.0.0",
  "main": "main.js",
  "dependencies": {
    "sharp": "^0.34.3",
    "sharp-bmp": "^0.1.5",
    "sharp-ico": "^0.1.5"
  }
}
```

---

## 🎨 UI Features

### Image Panel Template
- Canvas for image display
- Delete button (X)
- Filename label
- Size info (width × height)
- Color palette (3 dominant colors)
- Format selector dropdown

### Keyboard Shortcuts
- **Arrow Left/Right**: Navigate between images
- **Ctrl + Arrow Left/Right**: Jump to first/last image
- **Ctrl + C**: Copy current image
- **Ctrl + V**: Paste image
- **Ctrl + D** or **Delete**: Delete current image

### Context Menu
- Copy
- Paste

### Notifications
- Image copied
- Image pasted
- Image deleted
- Image saved
- Format converted
- Error messages

---

## 🔍 Technical Details

### History Management
- Each image layer maintains its own undo/redo history
- Maximum 10 history entries per layer
- Stores: buffer, info, and extension for each state

### Temporary Files
- Special formats (BMP, ICO) require temporary files
- Automatically cleaned up after use
- `cleanupAllTempFiles()` called on app exit

### Color Extraction
- Resizes image to 24px width for performance
- Converts to sRGB color space
- Counts pixel frequency
- Returns top N most dominant colors in hex format

### File Format Support
- **Standard**: PNG, JPG, WEBP, GIF, TIFF
- **Special**: BMP, ICO (with helper libraries)
- Auto-detection based on file extension

---

## 🐛 Error Handling

All operations include comprehensive error handling:

```javascript
try {
  const result = await imgKitMain.openImage(filepath);
  // Success
} catch (error) {
  console.error('Error opening image:', error);
  renderer.showMessage('error');
  // User sees error notification
}
```

Common error scenarios:
- Invalid file path
- Unsupported format
- Corrupted image file
- Invalid crop dimensions
- File system permission issues

---

## 🔮 Future Enhancements

Potential improvements using Electron framework:

1. **Native Context Menu** - Replace HTML menu with Electron's Menu API
2. **File Dialogs** - Add native save/open dialogs
3. **Native Clipboard** - Use Electron's clipboard for better compatibility
4. **IPC Communication** - Offload heavy processing to main process
5. **System Notifications** - Use Electron's Notification API
6. **Drag & Drop Enhancement** - Better file path handling in Electron

---

## 📄 License

Part of the Pegasus image editor application.

---

## 👥 Contributing

When contributing to ImgKit:

1. **Maintain the 3-tier architecture** - Don't mix concerns
2. **Add JSDoc comments** - Document all public methods
3. **Include error handling** - All async operations need try-catch
4. **Write modular code** - Keep functions small and focused
5. **Test edge cases** - Especially file format conversions

---

## 📚 Additional Resources

- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [HTML Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

**Last Updated**: October 5, 2025
**Version**: 1.0.0
**Author**: Pascal Institute
