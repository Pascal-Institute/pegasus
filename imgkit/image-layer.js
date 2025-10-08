// ImageLayer - Individual Image Panel Component
// Handles all operations for a single image panel
//
// This class represents one "card" in the horizontal scroll that contains:
// - Canvas for displaying the image
// - Delete button (X)
// - Filename label
// - Size info (width x height)
// - Color palette boxes
// - Extension selector dropdown
//
// Key responsibilities:
// - Display image on canvas
// - Handle user interactions (drag & drop, keyboard shortcuts, context menu)
// - Manage undo/redo history
// - Bridge UI events to backend operations (via ImageProcessor)

const path = require('path');

const { ImageLayerEvents } = require('./image-layer-events');
const { ImageProcessor } = require('./image-processor');
const { ImageMode, ModeManager } = require('./image-mode');

/**
 * ImageLayer class - Represents a single image panel with canvas and controls
 */
class ImageLayer {
  constructor(renderer, isDefault = false) {
    this.renderer = renderer; // Reference to parent ImgKitRenderer
    this.isDefault = isDefault; // Is this a placeholder "+ Add Image" layer?

    // --------------------------------------------------------------------------
    // IMAGE DATA
    // --------------------------------------------------------------------------
    this.buffer = null; // Image binary data (Buffer object)
    this.info = null; // Image metadata (width, height, format, etc.)
    this.filename = ""; // Name without extension
    this.extension = ""; // File extension (png, jpg, etc.)
    this.filepath = ""; // Full path on disk (if saved)

    // --------------------------------------------------------------------------
    // UNDO/REDO HISTORY
    // --------------------------------------------------------------------------
    // Stores previous states so user can undo/redo changes
    this.history = {
      buffers: [], // Array of previous image buffers
      infos: [], // Array of previous image infos
      extensions: [], // Array of previous extensions
      index: -1, // Current position in history
      maxSize: 10, // Maximum number of undo steps
    };

    // --------------------------------------------------------------------------
    // UI STATE
    // --------------------------------------------------------------------------
    this.showImageOnly = false; // Hide all UI elements except canvas?

    // --------------------------------------------------------------------------
    // INTERACTION MODE MANAGEMENT
    // --------------------------------------------------------------------------
    // Unified mode system replaces individual flags (drawFlag, dragFlag, magnifyFlag)
    this.modeManager = new ModeManager();
    this.cropData = { x: 0, y: 0, width: 0, height: 0 }; // Crop selection area
    
    // Magnifying glass state (for partial redraw)
    this.lastMagnifyPos = null; // { x, y, radius } - previous magnifying glass position
    this.magnifyAnimationId = null; // requestAnimationFrame ID

    // Create DOM elements and setup event listeners
    this.createPanelFromTemplate();
    
    // Setup event handlers using ImageLayerEvents class
    this.eventHandler = new ImageLayerEvents(this);
  }

  // --------------------------------------------------------------------------
  // UI CREATION
  // --------------------------------------------------------------------------

  /**
   * Create panel from HTML template
   * This clones the template and gets references to all UI elements
   */
  createPanelFromTemplate() {
    if (!this.renderer.panelTemplate) {
      console.error("Image panel template not found!");
      return;
    }

    // Clone template content (defined in index.html)
    const clone = this.renderer.panelTemplate.content.cloneNode(true);
    this.panel = clone.querySelector(".imgPanel");

    // Get canvas and drawing context
    this.canvas = this.panel.querySelector(".img-canvas");
    this.canvas.id = this.isDefault ? "default" : "full";
    this.ctx = this.canvas.getContext("2d"); // 2D drawing context
    this.image = new Image(); // For loading image data
    
    // Create overlay canvas for magnifying glass (on top of main canvas)
    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.style.position = 'absolute';
    this.overlayCanvas.style.pointerEvents = 'none'; // Pass through mouse events
    this.overlayCanvas.style.left = '0';
    this.overlayCanvas.style.top = '0';
    this.overlayCanvas.style.width = '100%';
    this.overlayCanvas.style.height = '100%';
    this.overlayCtx = this.overlayCanvas.getContext("2d");
    
    // Wrap canvas in a container for proper overlay positioning
    const canvasWrapper = document.createElement('div');
    canvasWrapper.style.position = 'relative';
    canvasWrapper.style.display = 'inline-block';
    canvasWrapper.style.lineHeight = '0'; // Remove extra spacing
    
    // Move canvas into wrapper
    this.canvas.parentElement.insertBefore(canvasWrapper, this.canvas);
    canvasWrapper.appendChild(this.canvas);
    canvasWrapper.appendChild(this.overlayCanvas);

    // Get UI control elements
    this.deleteBtn = this.panel.querySelector(".delete-btn");
    this.nameSpan = this.panel.querySelector(".name-span");
    this.infoText = this.panel.querySelector(".info-text");
    this.extensionCombo = this.panel.querySelector(".extension-combo");

    // Get color palette elements
    this.colorBox = {
      container: this.panel.querySelector(".color-box-container"),
      colors: Array.from(this.panel.querySelectorAll(".color-box")),
    };
  }

  // --------------------------------------------------------------------------
  // CANVAS & PREVIEW
  // --------------------------------------------------------------------------

  /**
   * Update canvas preview with new image data
   * @param {Buffer} buffer - Image buffer
   * @param {Object} info - Image info
   * @param {Array<string>} [colors] - Optional array of color strings
   */
  async updatePreview(buffer, info, colors) {
    this.buffer = buffer;
    this.info = info;

    // Update main canvas size
    this.canvas.width = info.width;
    this.canvas.height = info.height;
    
    // Update overlay canvas size and position to match exactly
    this.overlayCanvas.width = info.width;
    this.overlayCanvas.height = info.height;
    // Ensure overlay stays perfectly aligned
    this.overlayCanvas.style.width = info.width + 'px';
    this.overlayCanvas.style.height = info.height + 'px';
    this.overlayCanvas.style.left = '0';
    this.overlayCanvas.style.top = '0';

    this.image.src = `data:image/${this.extension};base64,${buffer.toString(
      "base64"
    )}`;
    this.image.onload = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.image, 0, 0);
      
      // Clear overlay canvas when image changes
      this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    };

    this.infoText.textContent = `${info.width} x ${info.height}`;
    this.addToHistory(buffer, info, this.extension);

    // Extract colors and update color boxes
    let extractedColors = colors;
    if (!extractedColors) {
      try {
        extractedColors = await ImageProcessor.extractColors(buffer, info, 3);
      } catch (error) {
        console.error("Error extracting colors:", error);
        extractedColors = [];
      }
    }

    // Update color box UI
    if (Array.isArray(extractedColors) && extractedColors.length > 0) {
      extractedColors.forEach((color, idx) => {
        if (this.colorBox.colors[idx]) {
          this.colorBox.colors[idx].style.backgroundColor = color;
          this.colorBox.colors[idx].title = color;
        }
      });

      // Clear unused color boxes
      for (
        let i = extractedColors.length;
        i < this.colorBox.colors.length;
        i++
      ) {
        this.colorBox.colors[i].style.backgroundColor = "transparent";
        this.colorBox.colors[i].title = "empty";
      }
    } else {
      // No colors - clear all boxes
      this.colorBox.colors.forEach((colorDiv) => {
        colorDiv.style.backgroundColor = "transparent";
        colorDiv.title = "empty";
      });
    }

    // Auto-scroll to show new image
    setTimeout(() => {
      this.renderer.updateScrollUI();
      this.renderer.scrollContainer.scrollLeft =
        this.renderer.scrollContainer.scrollWidth;
    }, 0);
  }

  // --------------------------------------------------------------------------
  // HISTORY MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Add current state to history
   * @param {Buffer} buffer - Image buffer
   * @param {Object} info - Image info
   * @param {string} extension - File extension
   */
  addToHistory(buffer, info, extension) {
    this.history.index++;

    // Remove future history if we're not at the end
    if (this.history.buffers[this.history.index]) {
      this.history.buffers = this.history.buffers.slice(0, this.history.index);
      this.history.infos = this.history.infos.slice(0, this.history.index);
      this.history.extensions = this.history.extensions.slice(
        0,
        this.history.index
      );
    }

    // Limit history size
    if (this.history.index >= this.history.maxSize) {
      this.history.buffers.shift();
      this.history.infos.shift();
      this.history.extensions.shift();
      this.history.index = this.history.maxSize - 1;
    }

    this.history.buffers.push(buffer);
    this.history.infos.push(info);
    this.history.extensions.push(extension);
  }

  /**
   * Undo last change
   */
  undo() {
    if (this.history.index <= 0) return;
    this.history.index--;
    this.restoreFromHistory();
  }

  /**
   * Redo last undone change
   */
  redo() {
    if (this.history.index >= this.history.buffers.length - 1) return;
    this.history.index++;
    this.restoreFromHistory();
  }

  /**
   * Restore state from history
   */
  restoreFromHistory() {
    const buffer = this.history.buffers[this.history.index];
    const info = this.history.infos[this.history.index];
    const extension = this.history.extensions[this.history.index];

    this.buffer = buffer;
    this.info = info;
    this.extension = extension;

    this.canvas.width = info.width;
    this.canvas.height = info.height;

    this.image.src = `data:image/${extension};base64,${buffer.toString(
      "base64"
    )}`;
    this.image.onload = () => this.ctx.drawImage(this.image, 0, 0);

    this.infoText.textContent = `${info.width} x ${info.height}`;
    this.extensionCombo.value = extension;
  }

  // --------------------------------------------------------------------------
  // UI STATE
  // --------------------------------------------------------------------------

  /**
   * Set focus state
   * @param {boolean} focused - Whether panel is focused
   */
  setFocus(focused) {
    if (focused) {
      this.panel.focus();
    }
  }

  /**
   * Toggle show image only mode
   * @param {boolean} show - Whether to show image only
   */
  toggleShowImageOnly(show) {
    this.showImageOnly = show;
    const visibility = show ? "hidden" : "visible";
    [
      this.deleteBtn,
      this.nameSpan,
      this.colorBox.container,
      this.infoText,
      this.extensionCombo,
    ].forEach((el) => (el.style.visibility = visibility));
  }

  /**
   * Destroy layer and cleanup
   */
  destroy() {
    if (this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
  }

  // --------------------------------------------------------------------------
  // IMAGE OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Open image from file path
   * Bridges UI to backend operations
   */
  async openImage(filepath) {
    try {
      const result = await ImageProcessor.openImage(filepath);

      this.filepath = filepath;
      this.filename = result.filename;
      this.extension = result.extension;
      this.nameSpan.textContent = this.filename;
      this.extensionCombo.value = this.extension;
      this.updatePreview(result.buffer, result.info);

      if (filepath !== "./assets/addImage.png") {
        this.canvas.id = "full";
        this.isDefault = false;
        this.panel.draggable = true; 
      }

      return true;
    } catch (error) {
      this.renderer.showMessage("error");
      console.error("Error opening image:", error);
      this.canvas.id = "default";
      return false;
    }
  }

  /**
   * Open image from buffer (drag & drop, paste)
   * Bridges UI to backend operations
   * @param {Buffer} buffer - Image buffer
   * @param {string} filename - File name
   * @param {string|null} filepath - Optional file path
   */
  async openImageBuffer(buffer, filename, filepath = null) {
    try {
      const result = await ImageProcessor.openImageBuffer(buffer, filename);

      this.buffer = result.buffer;
      this.filename = result.filename;
      this.filepath = filepath || ""; // Store the file path from drag & drop

      this.extension = result.extension;
      this.nameSpan.textContent = this.filename;
      this.extensionCombo.value = this.extension;
      this.updatePreview(result.buffer, result.info);

      this.canvas.id = "full";
      this.isDefault = false;
      this.panel.draggable = true;
      return true;
    } catch (error) {
      this.renderer.showMessage("error");
      console.error("Error opening image buffer:", error);
      this.canvas.id = "default";
      return false;
    }
  }

  /**
   * Convert image format
   * Bridges UI to backend operations
   */
  async convertFormat(newExtension) {
    if (!this.buffer) return;

    try {
      const result = await ImageProcessor.convertFormat(
        this.buffer,
        this.extension,
        newExtension
      );

      this.extension = newExtension;

      // Update filepath extension using backend helper
      if (this.filepath) {
        this.filepath = ImageProcessor.updateFileExtension(
          this.filepath,
          newExtension
        );
      }

      this.updatePreview(result.buffer, result.info);
      this.renderer.showMessage("convert");
    } catch (error) {
      this.renderer.showMessage("error");
      console.error("Error converting format:", error);
    }
  }

  /**
   * Save image to file
   * Bridges UI to backend operations
   */
  async saveImage(filepath) {
    if (!this.buffer) return;

    const savePath = filepath || this.filepath;
    if (!savePath) return;

    try {
      const base64Data = this.image.src.replace(
        `data:image/${this.extension};base64,`,
        ""
      );
      const buffer = Buffer.from(base64Data, "base64");

      await ImageProcessor.saveImage(buffer, savePath);
      this.filepath = savePath;
      this.renderer.showMessage("save");
    } catch (error) {
      this.renderer.showMessage("error");
      console.error("Error saving image:", error);
    }
  }

  /**
   * Process image with various operations
   * Bridges UI to backend operations
   */
  async processImage(options) {
    if (!this.buffer) return;

    try {
      const result = await ImageProcessor.processImage(this.buffer, options);
      this.updatePreview(result.buffer, result.info);
    } catch (error) {
      this.renderer.showMessage("error");
      console.error("Error processing image:", error);
    }
  }

  /**
   * Apply crop operation
   * Bridges UI to backend crop operation
   */
  async applyCrop(cropData) {
    if (!this.buffer || !this.info) return;

    try {
      const result = await ImageProcessor.applyCrop(
        this.buffer,
        this.info,
        cropData
      );

      this.updatePreview(result.buffer, result.info);
    } catch (error) {
      this.renderer.showMessage("error");
      console.error("Crop failed:", error);
    }
  }
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = {
  ImageLayer,
};
