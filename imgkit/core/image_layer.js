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

const { ipcRenderer } = require("electron");
const { ImageLayerEvents } = require("../features/image_layer_events");
const { ImageProcessor } = require("../processing/image_processor");
const { ImageLoader } = require("../processing/image_loader");
const { ModeManager } = require("../features/image_mode");
const { LayerHistory } = require("../features/layer_history");
const { GifAnimation } = require("../features/gif_animation");
const { Pix } = require("./pix");

const LAYER_EVENT_CHANNEL = "imgkit-layer-event";
let nextLayerId = 1;

/**
 * ImageLayer class - Represents a single image panel with canvas and controls
 */
class ImageLayer {
  constructor(isDefault = false) {
    this.id = `image-layer-${nextLayerId++}`;
    this.isDefault = isDefault; // Is this a placeholder "+ Add Image" layer?
    // --------------------------------------------------------------------------
    // IMAGE DATA
    // --------------------------------------------------------------------------
    this.buffer = null; // Image binary data (Buffer object)
    this.info = null; // Image metadata (width, height, format, etc.)
    this.filename = ""; // Name without extension
    this.extension = ""; // File extension (png, jpg, etc.)
    this.filepath = ""; // Full path on disk (if saved)
    this.svgData = null; // SVG string data (for SVG format only)
    this.visibility = "visible"; // Layer visibility state
    // --------------------------------------------------------------------------
    // GIF ANIMATION MODULE
    // --------------------------------------------------------------------------
    this.gifAnimation = new GifAnimation(this); // Handles all GIF animation logic

    // --------------------------------------------------------------------------
    // UNDO/REDO HISTORY
    // --------------------------------------------------------------------------
    // History manager handles all undo/redo functionality
    this.history = new LayerHistory(10); // Max 10 undo steps

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
    const template = document.getElementById("image-panel-template");
    if (!template) {
      console.error("Image panel template not found!");
      return;
    }

    // Clone template content (defined in index.html)
    const clone = template.content.cloneNode(true);
    this.panel = clone.querySelector(".imgPanel");
    if (this.panel) {
      this.panel.dataset.layerId = this.id;
    }

    // Get canvas and drawing context
    this.canvas = this.panel.querySelector(".img-canvas");
    this.canvas.id = this.isDefault ? "default" : "full";
    this.ctx = this.canvas.getContext("2d"); // 2D drawing context
    this.image = new Image(); // For loading image data

    // Create overlay canvas for magnifying glass (on top of main canvas)
    this.overlayCanvas = document.createElement("canvas");
    this.overlayCanvas.style.position = "absolute";
    this.overlayCanvas.style.pointerEvents = "none"; // Pass through mouse events
    this.overlayCanvas.style.left = "0";
    this.overlayCanvas.style.top = "0";
    this.overlayCanvas.style.width = "100%";
    this.overlayCanvas.style.height = "100%";
    this.overlayCtx = this.overlayCanvas.getContext("2d");

    // Wrap canvas in a container for proper overlay positioning
    const canvasWrapper = document.createElement("div");
    canvasWrapper.style.position = "relative";
    canvasWrapper.style.display = "inline-block";
    canvasWrapper.style.lineHeight = "0"; // Remove extra spacing

    // Move canvas into wrapper
    this.canvas.parentElement.insertBefore(canvasWrapper, this.canvas);
    canvasWrapper.appendChild(this.canvas);
    canvasWrapper.appendChild(this.overlayCanvas);

    // Get UI control elements
    this.deleteBtn = this.panel.querySelector(".delete-btn");
    this.nameInput = this.panel.querySelector(".name-input");
    this.coordText = this.panel.querySelector(".coord-text");
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
    this.overlayCanvas.style.width = info.width + "px";
    this.overlayCanvas.style.height = info.height + "px";
    this.overlayCanvas.style.left = "0";
    this.overlayCanvas.style.top = "0";

    this.image.src = `data:image/${this.extension};base64,${buffer.toString(
      "base64"
    )}`;
    this.image.onload = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.image, 0, 0);

      // Clear overlay canvas when image changes
      this.overlayCtx.clearRect(
        0,
        0,
        this.overlayCanvas.width,
        this.overlayCanvas.height
      );
    };

    this.infoText.textContent = `${info.width} x ${info.height}`;
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

    this.history.add(buffer, info, this.extension, extractedColors);

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
      ipcRenderer.send(LAYER_EVENT_CHANNEL, {
        type: "preview-updated",
        layerId: this.id,
      });
    }, 0);
  }

  /**
   * Undo last change
   */
  undo() {
    // Pause GIF animation when undoing
    if (this.gifAnimation.isPlaying) {
      this.gifAnimation.pause();
    }

    const state = this.history.undo();
    if (state) {
      this.restoreFromHistory(state);
    }
  }

  /**
   * Redo last undone change
   */
  redo() {
    // Pause GIF animation when redoing
    if (this.gifAnimation.isPlaying) {
      this.gifAnimation.pause();
    }

    const state = this.history.redo();
    if (state) {
      this.restoreFromHistory(state);
    }
  }

  /**
   * Restore state from history
   * @param {Object} state - State object with buffer, info, extension, colors
   */
  restoreFromHistory(state) {
    this.buffer = state.buffer;
    this.info = state.info;
    this.extension = state.extension;

    this.canvas.width = state.info.width;
    this.canvas.height = state.info.height;

    this.image.src = `data:image/${
      state.extension
    };base64,${state.buffer.toString("base64")}`;
    this.image.onload = () => this.ctx.drawImage(this.image, 0, 0);

    this.infoText.textContent = `${state.info.width} x ${state.info.height}`;
    this.extensionCombo.value = state.extension;

    // Restore color boxes
    const colors = state.colors || [];
    if (Array.isArray(colors) && colors.length > 0) {
      colors.forEach((color, idx) => {
        if (this.colorBox.colors[idx]) {
          this.colorBox.colors[idx].style.backgroundColor = color;
          this.colorBox.colors[idx].title = color;
        }
      });

      // Clear unused color boxes
      for (let i = colors.length; i < this.colorBox.colors.length; i++) {
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
  }

  // --------------------------------------------------------------------------
  // UI STATE
  // --------------------------------------------------------------------------

  /**
   * Set selection state (for multi-select)
   * @param {boolean} selected - Whether panel is selected
   */
  setSelected(selected) {
    if (selected) {
      this.panel.classList.add("selected");
    } else {
      this.panel.classList.remove("selected");
    }
  }

  /**
   * hide or show layer UI elements
   */
  hide() {
    const visibility = this.visibility === "visible" ? "hidden" : "visible";
    [
      this.deleteBtn,
      this.nameInput,
      this.colorBox.container,
      this.infoText,
      this.coordText,
      this.extensionCombo,
    ].forEach((el) => (el.style.visibility = visibility));
    this.visibility = visibility;
  }

  /**
   * Destroy layer and cleanup
   */
  destroy() {
    // Destroy GIF animation module
    this.gifAnimation.destroy();

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
      const result = await ImageLoader.openImage(filepath);

      this.filepath = filepath;
      this.filename = result.filename;
      this.extension = result.extension;
      this.nameInput.value = this.filename;
      this.extensionCombo.value = this.extension;

      // Handle GIF animation data
      if (result.gifMetadata && result.gifMetadata.pages > 1) {
        // Read the original GIF file for frame extraction
        const fs = require("fs");
        const gifBuffer = await fs.promises.readFile(filepath);
        this.gifAnimation.load(gifBuffer, result.gifMetadata);
      } else {
        this.gifAnimation.clear();
      }

      this.updatePreview(result.buffer, result.info);

      if (filepath !== "./assets/addImage.png") {
        this.canvas.id = "full";
        this.isDefault = false;
        this.panel.draggable = true;
      }

      return true;
    } catch (error) {
      ipcRenderer.send("showNotificationREQ", "imgkit-open-error");
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
      const result = await ImageLoader.openImageBuffer(buffer, filename);

      this.buffer = result.buffer;
      this.filename = result.filename;
      this.filepath = filepath || ""; // Store the file path from drag & drop

      this.extension = result.extension;
      this.nameInput.value = this.filename;
      this.extensionCombo.value = this.extension;

      // Handle GIF animation data
      if (result.gifMetadata && result.gifMetadata.pages > 1) {
        this.gifAnimation.load(buffer, result.gifMetadata);
      } else {
        this.gifAnimation.clear();
      }

      this.updatePreview(result.buffer, result.info);

      this.canvas.id = "full";
      this.isDefault = false;
      this.panel.draggable = true;
      return true;
    } catch (error) {
      ipcRenderer.send("showNotificationREQ", "imgkit-error");
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
      // Stop GIF animation if playing
      if (this.gifAnimation.isPlaying) {
        this.gifAnimation.stop();
      }

      const result = await ImageProcessor.convertFormat(
        this.buffer,
        this.extension,
        newExtension
      );

      this.extension = newExtension;

      // Store SVG data if converting to SVG
      if (newExtension === "svg" && result.svgData) {
        this.svgData = result.svgData;
      } else {
        this.svgData = null;
      }

      // Clear GIF animation data when converting from GIF
      this.gifAnimation.clear();

      // Update filepath extension using backend helper
      if (this.filepath) {
        this.filepath = ImageProcessor.updateFileExtension(
          this.filepath,
          newExtension
        );
      }

      this.updatePreview(result.buffer, result.info);
      ipcRenderer.send("showNotificationREQ", "imgkit-convert");
    } catch (error) {
      ipcRenderer.send("showNotificationREQ", "imgkit-error");
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
      let buffer;

      // If saving as SVG and we have SVG data, save the actual SVG
      if (this.extension === "svg" && this.svgData) {
        buffer = Buffer.from(this.svgData, "utf-8");
      } else if (this.extension === "pix") {
        // For PIX format, convert back to PIX buffer
        const pixData = await Pix.toPix(this.buffer, this.info);
        await Pix.save(pixData, savePath);
        this.filepath = savePath;
        ipcRenderer.send("showNotificationREQ", "imgkit-save");
      } else {
        // For other formats, extract from canvas
        const base64Data = this.image.src.replace(
          `data:image/${this.extension};base64,`,
          ""
        );
        buffer = Buffer.from(base64Data, "base64");
      }

      await ImageLoader.saveImage(buffer, savePath);
      this.filepath = savePath;
      ipcRenderer.send("showNotificationREQ", "imgkit-save");
    } catch (error) {
      ipcRenderer.send("showNotificationREQ", "imgkit-error");
      console.error("Error saving image:", error);
    }
  }

  async applyWatermark({ filePath }) {
    await ImageProcessor.applyWatermark(filePath);
  }

  /**
   * Process image with various operations
   * Bridges UI to backend operations
   */
  async processImage(options) {
    if (!this.buffer) return;

    try {
      // Stop GIF animation if playing
      if (this.gifAnimation.isPlaying) {
        this.gifAnimation.pause();
      }

      const result = await ImageProcessor.processImage(this.buffer, options);
      this.updatePreview(result.buffer, result.info);
    } catch (error) {
      ipcRenderer.send("showNotificationREQ", "imgkit-error");
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
      // Stop GIF animation if playing
      if (this.gifAnimation.isPlaying) {
        this.gifAnimation.pause();
      }

      const result = await ImageProcessor.applyCrop(
        this.buffer,
        this.info,
        cropData
      );

      this.updatePreview(result.buffer, result.info);
    } catch (error) {
      ipcRenderer.send("showNotificationREQ", "imgkit-error");
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
