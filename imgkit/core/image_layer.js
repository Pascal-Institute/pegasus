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
const { ImageMode, ModeManager } = require("../features/image_mode");
const { LayerHistory } = require("../features/layer_history");

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
    this.svgData = null; // SVG string data (for SVG format only)
    
    // --------------------------------------------------------------------------
    // GIF ANIMATION DATA
    // --------------------------------------------------------------------------
    this.gifMetadata = null; // GIF animation metadata (pages, delay, loop)
    this.gifOriginalBuffer = null; // Original GIF buffer (for frame extraction)
    this.gifAnimationId = null; // Animation timer ID
    this.gifCurrentFrame = 0; // Current frame index
    this.gifIsPlaying = false; // Is animation playing?

    // --------------------------------------------------------------------------
    // UNDO/REDO HISTORY
    // --------------------------------------------------------------------------
    // History manager handles all undo/redo functionality
    this.history = new LayerHistory(10); // Max 10 undo steps

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
    this.infoText = this.panel.querySelector(".info-text");
    this.extensionCombo = this.panel.querySelector(".extension-combo");

    // Get color palette elements
    this.colorBox = {
      container: this.panel.querySelector(".color-box-container"),
      colors: Array.from(this.panel.querySelectorAll(".color-box")),
    };
    
    // Create GIF animation controls (initially hidden)
    this.createGifControls();
  }

  /**
   * Create GIF animation control buttons
   */
  createGifControls() {
    // Create container for GIF controls
    this.gifControlsContainer = document.createElement("div");
    this.gifControlsContainer.className = "gif-controls";
    this.gifControlsContainer.style.display = "none"; // Hidden by default
    this.gifControlsContainer.style.marginTop = "5px";
    this.gifControlsContainer.style.textAlign = "center";

    // Play/Pause button
    this.gifPlayPauseBtn = document.createElement("button");
    this.gifPlayPauseBtn.textContent = "▶";
    this.gifPlayPauseBtn.title = "Play/Pause";
    this.gifPlayPauseBtn.style.margin = "0 2px";
    this.gifPlayPauseBtn.style.padding = "5px 10px";
    this.gifPlayPauseBtn.style.cursor = "pointer";
    this.gifPlayPauseBtn.addEventListener("click", () => this.toggleGifPlayback());

    // Stop button
    this.gifStopBtn = document.createElement("button");
    this.gifStopBtn.textContent = "■";
    this.gifStopBtn.title = "Stop";
    this.gifStopBtn.style.margin = "0 2px";
    this.gifStopBtn.style.padding = "5px 10px";
    this.gifStopBtn.style.cursor = "pointer";
    this.gifStopBtn.addEventListener("click", () => this.stopGifPlayback());

    // Frame counter
    this.gifFrameCounter = document.createElement("span");
    this.gifFrameCounter.style.margin = "0 5px";
    this.gifFrameCounter.style.fontSize = "12px";
    this.gifFrameCounter.textContent = "0/0";

    // Add buttons to container
    this.gifControlsContainer.appendChild(this.gifPlayPauseBtn);
    this.gifControlsContainer.appendChild(this.gifStopBtn);
    this.gifControlsContainer.appendChild(this.gifFrameCounter);

    // Add controls to panel (after extension combo)
    this.extensionCombo.parentNode.insertBefore(
      this.gifControlsContainer,
      this.extensionCombo.nextSibling
    );
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
    this.history.add(buffer, info, this.extension);
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

  /**
   * Undo last change
   */
  undo() {
    // Pause GIF animation when undoing
    if (this.gifIsPlaying) {
      this.pauseGifAnimation();
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
    if (this.gifIsPlaying) {
      this.pauseGifAnimation();
    }
    
    const state = this.history.redo();
    if (state) {
      this.restoreFromHistory(state);
    }
  }

  /**
   * Restore state from history
   * @param {Object} state - State object with buffer, info, extension
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
      this.nameInput,
      this.colorBox.container,
      this.infoText,
      this.extensionCombo,
    ].forEach((el) => (el.style.visibility = visibility));
  }

  /**
   * Destroy layer and cleanup
   */
  destroy() {
    // Stop GIF animation if playing
    this.stopGifPlayback();
    
    if (this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
  }

  // --------------------------------------------------------------------------
  // GIF ANIMATION METHODS
  // --------------------------------------------------------------------------

  /**
   * Check if current image is an animated GIF
   * @returns {boolean}
   */
  isAnimatedGif() {
    return (
      this.extension === "gif" &&
      this.gifMetadata &&
      this.gifMetadata.pages > 1
    );
  }

  /**
   * Show GIF controls if the image is an animated GIF
   */
  showGifControlsIfAnimated() {
    if (this.isAnimatedGif()) {
      this.gifControlsContainer.style.display = "block";
      this.updateGifFrameCounter();
      // Auto-play animated GIFs
      this.playGifAnimation();
    } else {
      this.gifControlsContainer.style.display = "none";
    }
  }

  /**
   * Update frame counter display
   */
  updateGifFrameCounter() {
    if (this.isAnimatedGif()) {
      this.gifFrameCounter.textContent = `${this.gifCurrentFrame + 1}/${
        this.gifMetadata.pages
      }`;
    }
  }

  /**
   * Toggle GIF playback (play/pause)
   */
  toggleGifPlayback() {
    if (this.gifIsPlaying) {
      this.pauseGifAnimation();
    } else {
      this.playGifAnimation();
    }
  }

  /**
   * Play GIF animation
   */
  playGifAnimation() {
    if (!this.isAnimatedGif() || this.gifIsPlaying) return;

    this.gifIsPlaying = true;
    this.gifPlayPauseBtn.textContent = "⏸";
    this.gifPlayPauseBtn.title = "Pause";

    this.scheduleNextFrame();
  }

  /**
   * Pause GIF animation
   */
  pauseGifAnimation() {
    if (!this.gifIsPlaying) return;

    this.gifIsPlaying = false;
    this.gifPlayPauseBtn.textContent = "▶";
    this.gifPlayPauseBtn.title = "Play";

    if (this.gifAnimationId !== null) {
      clearTimeout(this.gifAnimationId);
      this.gifAnimationId = null;
    }
  }

  /**
   * Stop GIF animation and reset to first frame
   */
  stopGifPlayback() {
    this.pauseGifAnimation();
    this.gifCurrentFrame = 0;
    this.updateGifFrameCounter();
    
    if (this.isAnimatedGif()) {
      this.displayGifFrame(0);
    }
  }

  /**
   * Schedule the next frame to be displayed
   */
  scheduleNextFrame() {
    if (!this.gifIsPlaying || !this.isAnimatedGif()) return;

    const delay = this.gifMetadata.delay[this.gifCurrentFrame] || 100;

    this.gifAnimationId = setTimeout(async () => {
      // Move to next frame
      this.gifCurrentFrame = (this.gifCurrentFrame + 1) % this.gifMetadata.pages;
      this.updateGifFrameCounter();

      // Display the frame
      await this.displayGifFrame(this.gifCurrentFrame);

      // Schedule next frame
      this.scheduleNextFrame();
    }, delay);
  }

  /**
   * Display a specific GIF frame
   * @param {number} frameIndex - Frame index to display
   */
  async displayGifFrame(frameIndex) {
    if (!this.isAnimatedGif() || !this.gifOriginalBuffer) return;

    try {
      const frameResult = await ImageLoader.extractGifFrame(
        this.gifOriginalBuffer,
        frameIndex
      );

      // Draw the frame to canvas
      this.image.src = `data:image/png;base64,${frameResult.buffer.toString(
        "base64"
      )}`;
      this.image.onload = () => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.image, 0, 0);
      };
    } catch (error) {
      console.error(`Error displaying frame ${frameIndex}:`, error);
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
      
      // Store GIF animation data if available
      if (result.gifMetadata && result.gifMetadata.pages > 1) {
        this.gifMetadata = result.gifMetadata;
        // Store original GIF buffer by reading the file again
        const fs = require("fs");
        this.gifOriginalBuffer = await fs.promises.readFile(filepath);
        this.gifCurrentFrame = 0;
      } else {
        this.gifMetadata = null;
        this.gifOriginalBuffer = null;
      }
      
      this.updatePreview(result.buffer, result.info);
      
      // Show GIF controls if animated
      this.showGifControlsIfAnimated();

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
      
      // Store GIF animation data if available
      if (result.gifMetadata && result.gifMetadata.pages > 1) {
        this.gifMetadata = result.gifMetadata;
        // Store the original buffer for frame extraction
        this.gifOriginalBuffer = buffer;
        this.gifCurrentFrame = 0;
      } else {
        this.gifMetadata = null;
        this.gifOriginalBuffer = null;
      }
      
      this.updatePreview(result.buffer, result.info);
      
      // Show GIF controls if animated
      this.showGifControlsIfAnimated();

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
      if (this.gifIsPlaying) {
        this.stopGifPlayback();
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
      if (this.gifMetadata) {
        this.gifMetadata = null;
        this.gifOriginalBuffer = null;
        this.gifCurrentFrame = 0;
        this.gifIsPlaying = false;
        this.gifControlsContainer.style.display = "none";
      }

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

  /**
   * Process image with various operations
   * Bridges UI to backend operations
   */
  async processImage(options) {
    if (!this.buffer) return;

    try {
      // Stop GIF animation if playing
      if (this.gifIsPlaying) {
        this.pauseGifAnimation();
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
      if (this.gifIsPlaying) {
        this.pauseGifAnimation();
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
