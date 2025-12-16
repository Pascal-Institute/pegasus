[![DeepWiki](https://img.shields.io/badge/DeepWiki-Pascal--Institute%2Fpegasus-blue.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==)](https://deepwiki.com/Pascal-Institute/pegasus)

# Pegasus

> **Give wings to pixels** 🪽

A powerful image processing and analysis tool built with Electron and Sharp, featuring an intuitive multi-panel interface for batch image operations.

<img width="1257" height="1011" alt="image" src="https://github.com/user-attachments/assets/03b939c2-9f7b-40e2-8b40-d4b9ae100f31" />

---

## 📋 Table of Contents

- [Features](#-features)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Development](#-development)
- [Project Structure](#-project-structure)
- [Usage](#-usage)
- [Supported Formats](#-supported-formats)
- [Architecture](#-architecture)
- [License](#-license)

---

## ✨ Features

### 🖼️ Multi-Panel Interface

- **Horizontal scrollable image panels** for easy navigation
- **Multi-select support**: Select multiple images using `Ctrl + Click`
- **Batch operations**: Apply transformations to multiple images at once
- **Drag & drop**: Load images directly into panels
- **Live preview**: See changes in real-time

### 🎨 Image Processing

- **Resize**: Scale images by percentage or pixel width
- **Crop**: Interactive cropping with visual feedback
- **Rotate**: Arbitrary angles or quick 90° rotations
- **Flip/Flop**: Mirror images horizontally or vertically
- **Filters**: Blur, sharpen, median, dilate, erode, normalize
- **Color**: Grayscale, negative, tint, threshold
- **Watermark**: Composite images with transparency
- **Paint**: Draw directly on images with adjustable brush

### 🎬 Advanced Features

- **Animated GIF support** with playback controls
- **Color picker**: Extract colors from images
- **Undo/Redo**: Full history for each image layer
- **Format conversion**: Convert between 13+ image formats
- **Keyboard shortcuts**: Fast workflow with hotkeys

---

## 📦 Requirements

### For Development

- **Node.js**: v22.18.0 or higher
- **IDE**: Visual Studio Code (recommended)
- **Platform**: Windows, macOS, or Linux

### For End Users

- Download and install `Pegasus Setup.exe` from releases
- No additional dependencies required

---

## 🚀 Installation

### Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/Pascal-Institute/pegasus.git
cd pegasus
```

2. **Install dependencies**

```bash
npm install
```

3. **Rebuild native modules**

```bash
npm run rebuild
```

### User Installation

Simply download and run the installer for your platform from the [Releases](https://github.com/Pascal-Institute/pegasus/releases) page.

---

## 💻 Development

### Run in Development Mode

**Windows:**

```bash
npm start
```

**Linux:**

```bash
electron . --ozone-platform=x11
```

### Build for Production

```bash
npm run build
```

This creates installers in the `output/` directory.

### Build for Windows Store

```bash
npm run build:win-store
```

---

## 📁 Project Structure

```
pegasus/
├── core/                   # Core image rendering engine
│   ├── image_renderer.js   # Main UI renderer and panel manager
│   ├── image_layer.js      # Individual image panel component
│   └── pix.js              # Custom .pix format handler
│
├── features/               # Feature modules
│   ├── image_mode.js       # Interaction mode system (crop, draw, etc.)
│   ├── image_layer_events.js  # Event handlers for panels
│   ├── layer_history.js    # Undo/redo implementation
│   └── gif_animation.js    # Animated GIF playback
│
├── processing/             # Image processing logic
│   ├── image_processor.js  # Main processing operations
│   ├── image_loader.js     # File loading and validation
│   └── format_converter.js # Format conversion utilities
│
├── renderer/               # UI renderers for each panel
│   ├── main_renderer.js    # Main application renderer
│   ├── resize_renderer.js
│   ├── crop_renderer.js
│   ├── filter_renderer.js
│   ├── rotate_renderer.js
│   ├── paint_renderer.js
│   └── image_analysis_renderer.js
│
├── pages/                  # HTML panel templates
├── css/                    # Stylesheets
├── components/             # Reusable UI components
├── utils/                  # Utility functions
│   ├── ipc_bridge.js       # IPC communication bridge
│   └── ui_loader.js        # Dynamic UI component loader
│
├── main.js                 # Electron main process
├── image_kit.js            # Public API exports
└── index.html              # Main application window
```

### Key Modules

#### **Core Module**

- `ImgKitRenderer`: Manages the scrollable container and image panels
- `ImageLayer`: Represents each individual image with canvas and controls

#### **Features Module**

- `ImageMode`: Defines interaction modes (NORMAL, CROPPING, DRAWING, etc.)
- `ModeManager`: Handles mode transitions for each layer
- `LayerHistory`: Implements undo/redo stack
- `GifAnimation`: Controls animated GIF playback

#### **Processing Module**

- `ImageProcessor`: Pure image processing functions using Sharp
- `ImageLoader`: Handles file I/O and format validation
- `FormatConverter`: Converts between different image formats

---

## 🎮 Usage

### Basic Workflow

1. **Load Images**: Drag & drop or use `File > Open`
2. **Select Tool**: Click tool buttons (Resize, Crop, Filter, etc.)
3. **Apply Operation**: Adjust parameters in the panel
4. **Save**: `File > Save` or `Save As`

### Keyboard Shortcuts

| Shortcut   | Action                  |
| ---------- | ----------------------- |
| `Ctrl + A` | Select all images       |
| `Ctrl + Z` | Undo                    |
| `Ctrl + Y` | Redo                    |
| `Alt + M`  | Toggle magnifying glass |
| `Alt + H`  | Hide current layer      |
| `F11`      | Toggle fullscreen       |

### Multi-Select

- **Select**: Click on an image panel
- **Add to selection**: `Ctrl + Click`
- **Deselect**: `Ctrl + Click` on selected panel
- **Visual Feedback**: Selected panels show green border

---

## 🖼️ Supported Formats

### Input/Output Formats

```
png, jpg, jpeg, webp, gif, bmp, ico, tiff, tif, svg, avif, heif, heic, pix
```

### Special Features

- ✅ **Animated GIF**: Full playback controls (play, pause, frame navigation)
- ✅ **PIX format**: Custom format for lossless editing
- ✅ **ICC profiles**: Preserved during conversion
- ✅ **EXIF data**: Metadata preservation

See [GIF Animation Documentation](docs/GIF_ANIMATION.md) for animated GIF details.

---

## 🏗️ Architecture

### Electron Process Model

```
Main Process (main.js)
    ├── Creates BrowserWindow
    ├── Handles file dialogs
    ├── Manages IPC communication
    └── Coordinates processing operations

Renderer Process (index.html)
    ├── UI Components (components/)
    ├── Image Panels (core/image_layer.js)
    ├── Event Handlers (features/image_layer_events.js)
    └── Tool Panels (renderer/*.js)

Processing Worker
    └── Sharp-based image operations (processing/)
```

### Data Flow

```
User Action → Renderer → IPC → Main Process → ImageProcessor → Sharp → Result
                ↑                                                        ↓
                └──────────────── IPC Response ─────────────────────────┘
```

### Module Dependencies

```
image_kit.js (Entry Point)
    ├── core/image_renderer.js
    │   ├── core/image_layer.js
    │   │   ├── features/image_layer_events.js
    │   │   ├── features/layer_history.js
    │   │   ├── features/gif_animation.js
    │   │   ├── processing/image_processor.js
    │   │   └── processing/image_loader.js
    │   └── features/image_mode.js
    ├── processing/image_processor.js
    │   └── processing/format_converter.js
    └── features/image_mode.js
```

---

## 🛠️ Coding Conventions

- **File naming**: Use underscores (`resize_panel.js`)
- **Classes**: PascalCase (`ImageProcessor`)
- **Functions**: camelCase (`processImage`)
- **Constants**: UPPER_SNAKE_CASE (`LAYER_EVENT_CHANNEL`)

---

## 📚 Documentation

- [GIF Animation Guide](docs/GIF_ANIMATION.md)
- [Image Kit API Reference](docs/IMGKIT.md)

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Follow the coding conventions
4. Submit a pull request

---

## 📄 License

See [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with:

- [Electron](https://www.electronjs.org/) - Desktop application framework
- [Sharp](https://sharp.pixelplumbing.com/) - High-performance image processing
- [Color Namer](https://www.npmjs.com/package/color-namer) - Color identification

---

**Made with ❤️ by Pascal Institute**
