// ImgKit Renderer Process - UI Logic
// Handles all DOM manipulation, events, and user interactions
//
// This file contains:
// 1. ImgKitRenderer class - Manages the scrollable image panel container
// 2. ImageLayer class - Represents a single image with canvas and controls
// 3. Helper functions and backward compatibility exports
//
// Key concepts for junior developers:
// - ImgKitRenderer: Think of this as the "manager" that controls the horizontal scroll of images
// - ImageLayer: Each individual image panel with its own canvas, buttons, and data
// - History: Each layer keeps track of changes for undo/redo functionality

const { ipcRenderer } = require("electron");
const { ImageLayer } = require("./image_layer.js");
const { ImageMode } = require("./image_mode.js");

// ============================================================================
// MAIN CLASS: ImgKitRenderer
// ============================================================================
// This is the "manager" class that controls:
// - The horizontal scrolling container
// - Creating/deleting image layers
// - Copy/paste between layers
// - Notification messages

class ImgKitRenderer {
  constructor() {
    // State
    this.imageLayerQueue = []; // Array of all ImageLayer objects
    this.currentIndex = 0; // Which layer is currently selected
    this.copiedLayer = null; // Copied image data for paste operation
    this.messages = {}; // Notification message elements
    this.globalMode = ImageMode.NORMAL; // Global interaction mode (e.g., magnify with Alt + A)

    // Get UI elements from DOM (must exist in index.html)
    this.scrollContainer = document.getElementById("scroll-container");
    this.scrollLeftBtn = document.getElementById("scroll-left-btn");
    this.scrollRightBtn = document.getElementById("scroll-right-btn");
    this.panelTemplate = document.getElementById("image-panel-template");

    // Initialize if DOM elements exist
    if (this.scrollContainer && this.scrollLeftBtn && this.scrollRightBtn) {
      this.initializeMessages();
      this.setupScrollEvents();
      this.setupGlobalMagnifyShortcut(); // Setup Alt + A globally
    }
  }

  // --------------------------------------------------------------------------
  // NOTIFICATION SYSTEM
  // --------------------------------------------------------------------------

  /**
   * Initialize notification message elements (from existing HTML)
   * These are the small popup messages that appear when you copy, save, etc.
   */
  initializeMessages() {
    const messageIds = [
      "copy",
      "img-copy",
      "img-paste",
      "delete",
      "save",
      "convert",
      "error",
    ];

    messageIds.forEach((id) => {
      const msg = document.getElementById(`imgkit-${id}`);
      if (msg) {
        this.messages[id] = msg;
      }
    });
  }

  /**
   * Show notification message with fade animation
   * @param {string} id - Message identifier (e.g., 'copy', 'save')
   */
  showMessage(id) {
    if (!this.messages[id]) return;
    this.messages[id].animate([{ opacity: "1" }, { opacity: "0" }], {
      duration: 1800,
      iterations: 1,
    });
  }

  // --------------------------------------------------------------------------
  // SCROLL MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Setup scroll button event listeners
   * Left/Right buttons scroll the container horizontally
   */
  setupScrollEvents() {
    // Scroll left button
    this.scrollLeftBtn.addEventListener("click", () => {
      this.scrollContainer.scrollBy({ left: -400, behavior: "smooth" });
      setTimeout(() => this.updateScrollUI(), 400);
    });

    // Scroll right button
    this.scrollRightBtn.addEventListener("click", () => {
      this.scrollContainer.scrollBy({ left: 400, behavior: "smooth" });
      setTimeout(() => this.updateScrollUI(), 400);
    });

    // Update UI when user scrolls manually
    this.scrollContainer.addEventListener("scroll", () =>
      this.updateScrollUI()
    );
  }

  /**
   * Setup global magnifying glass shortcut (Alt + A)
   * This works regardless of which layer is focused
   */
  setupGlobalMagnifyShortcut() {
    let isAltPressed = false;
    let isAPressed = false;

    // Track Alt key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Alt") {
        isAltPressed = true;
      }
      if (e.key.toLowerCase() === "a") {
        isAPressed = true;
      }

      // Activate magnifying glass when both Alt and A are pressed
      if (isAltPressed && isAPressed && this.globalMode !== ImageMode.MAGNIFY) {
        e.preventDefault();
        console.log("🔍 Magnifying glass ACTIVATED (Alt + A)");
        this.globalMode = ImageMode.MAGNIFY;

        // Enable magnify mode on all layers
        this.imageLayerQueue.forEach((layer) => {
          layer.modeManager.setMode(ImageMode.MAGNIFY);
        });
      }
    });

    document.addEventListener("keyup", (e) => {
      if (e.key === "Alt") {
        isAltPressed = false;
      }
      if (e.key.toLowerCase() === "a") {
        isAPressed = false;
      }

      // Deactivate magnifying glass when either Alt or A is released
      if (
        (!isAltPressed || !isAPressed) &&
        this.globalMode === ImageMode.MAGNIFY
      ) {
        console.log("🔍 Magnifying glass DEACTIVATED");
        this.globalMode = ImageMode.NORMAL;

        // Disable magnify on all layers and clear overlays
        this.imageLayerQueue.forEach((layer) => {
          layer.modeManager.reset();
          if (layer.overlayCanvas) {
            layer.overlayCtx.clearRect(
              0,
              0,
              layer.overlayCanvas.width,
              layer.overlayCanvas.height
            );
          }
          if (layer.magnifyAnimationId) {
            cancelAnimationFrame(layer.magnifyAnimationId);
            layer.magnifyAnimationId = null;
          }
        });
      }
    });
  }

  /**
   * Update scroll UI state and panel ordering
   * - Disables scroll buttons at edges
   * - Ensures panels are in correct order
   * - Applies flexbox layout to prevent overlap
   */
  updateScrollUI() {
    // Step 1: Ensure all panels are in correct order in the container
    this.imageLayerQueue.forEach((layer, idx) => {
      // If panel is not in scroll container, add it
      if (layer.panel.parentNode !== this.scrollContainer) {
        // Remove from body if it was added there by mistake
        try {
          document.body.removeChild(layer.panel);
        } catch (e) {}

        // Add to scroll container at correct position
        if (idx >= this.scrollContainer.children.length) {
          this.scrollContainer.appendChild(layer.panel);
        } else {
          this.scrollContainer.insertBefore(
            layer.panel,
            this.scrollContainer.children[idx]
          );
        }
      }
      // If panel is in container but wrong position, move it
      else if (this.scrollContainer.children[idx] !== layer.panel) {
        this.scrollContainer.insertBefore(
          layer.panel,
          this.scrollContainer.children[idx]
        );
      }

      // Step 2: Apply flexbox layout to prevent overlap
      Object.assign(layer.panel.style, {
        display: "flex",
        flexDirection: "column",
        flexShrink: "0",
        flexGrow: "0",
        flexBasis: "auto",
        alignItems: "center",
        justifyContent: "center",
        margin: "0",
        boxSizing: "border-box",
      });
    });

    // Step 3: Enable/disable scroll buttons based on scroll position
    this.scrollLeftBtn.disabled = this.scrollContainer.scrollLeft <= 0;
    this.scrollRightBtn.disabled =
      this.scrollContainer.scrollLeft + this.scrollContainer.clientWidth >=
      this.scrollContainer.scrollWidth - 2;
  }

  // --------------------------------------------------------------------------
  // LAYER MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Create new image layer
   * This is like adding a new "tab" in the horizontal scroll
   *
   * @param {boolean} isDefault - Whether this is a default placeholder layer
   * @returns {ImageLayer} Created image layer
   */
  createImageLayer(isDefault = false) {
    const layer = new ImageLayer(this, isDefault);
    this.imageLayerQueue.push(layer);
    this.scrollContainer.appendChild(layer.panel);
    this.updateScrollUI();
    return layer;
  }

  /**
   * Swap two layers by index
   * Used for drag & drop reordering
   *
   * @param {number} fromIndex - Source layer index
   * @param {number} toIndex - Target layer index
   */
  swapLayers(fromIndex, toIndex) {
    if (
      fromIndex < 0 ||
      fromIndex >= this.imageLayerQueue.length - 1 ||
      toIndex < 0 ||
      toIndex >= this.imageLayerQueue.length - 1
    ) {
      return;
    }

    // Swap in array
    const temp = this.imageLayerQueue[fromIndex];
    this.imageLayerQueue[fromIndex] = this.imageLayerQueue[toIndex];
    this.imageLayerQueue[toIndex] = temp;

    // Update current index if needed
    if (this.currentIndex === fromIndex) {
      this.currentIndex = toIndex;
    } else if (this.currentIndex === toIndex) {
      this.currentIndex = fromIndex;
    }

    // Update DOM and scroll UI
    this.updateScrollUI();
  }

  /**
   * Create default placeholder image layer
   * This shows the "+ Add Image" icon when app starts
   *
   * @returns {ImageLayer} Created default layer
   */
  createDefaultImage() {
    if (this.imageLayerQueue.length > 0) {
      this.currentIndex++;
    }
    const layer = this.createImageLayer(true);
    this.currentIndex = this.imageLayerQueue.length - 1;
    layer.openImage("./assets/addImage.png");
    layer.panel.focus();
    return layer;
  }

  /**
   * Get currently selected layer
   * @returns {ImageLayer|null} Current layer or null
   */
  getCurrentLayer() {
    return this.imageLayerQueue[this.currentIndex] || null;
  }

  /**
   * Set current layer by index
   * Updates focus states to highlight the selected layer
   *
   * @param {number} index - Layer index to select
   */
  setCurrentLayer(index) {
    if (index >= 0 && index < this.imageLayerQueue.length) {
      this.currentIndex = index;
      // Update visual focus for all layers
      this.imageLayerQueue.forEach((layer, idx) => {
        layer.setFocus(idx === index);
      });
    }
  }

  // --------------------------------------------------------------------------
  // COPY/PASTE OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Copy current image layer to native clipboard
   * Uses Electron's clipboard API for better app interoperability
   */
  async copyImage() {
    const current = this.getCurrentLayer();
    if (current && current.buffer) {
      try {
        // Send image to native clipboard via IPC
        ipcRenderer.send("copy-image-to-clipboard", current.buffer);

        // Also keep internal copy for fallback
        this.copiedLayer = {
          buffer: current.buffer,
          filename: current.filename,
          extension: current.extension,
        };

        this.showMessage("img-copy");
      } catch (error) {
        console.error("Failed to copy image:", error);
      }
    }
  }

  /**
   * Paste image to current layer
   * Can paste from:
   * 1. Native clipboard (via Electron API)
   * 2. Previously copied layer (fallback)
   */
  async pasteImage() {
    const current = this.getCurrentLayer();
    if (!current) return;

    try {
      // Try to get image from native clipboard first
      const imageBuffer = await ipcRenderer.invoke(
        "paste-image-from-clipboard"
      );

      if (imageBuffer) {
        // Got image from clipboard
        const filename = "pasted_image.png";
        await current.openImageBuffer(Buffer.from(imageBuffer), filename);
        this.showMessage("img-paste");
        if (this.currentIndex === this.imageLayerQueue.length - 1) {
          this.createDefaultImage();
        }
        return;
      }
    } catch (error) {
      console.error("Failed to paste from clipboard:", error);
    }

    // Fallback: paste from internally copied layer
    if (this.copiedLayer) {
      const filename = `${this.copiedLayer.filename}_copy.${this.copiedLayer.extension}`;
      await current.openImageBuffer(this.copiedLayer.buffer, filename);
      this.showMessage("img-paste");
    }
  }

  // --------------------------------------------------------------------------
  // DELETE OPERATION
  // --------------------------------------------------------------------------

  /**
   * Delete current image layer
   * - Removes the layer from the queue
   * - Updates current index
   * - Creates default layer if no layers remain
   */
  deleteImage() {
    const current = this.getCurrentLayer();
    if (!current || current.isDefault) return;

    const index = this.imageLayerQueue.indexOf(current);
    if (index !== -1) {
      // Destroy layer and remove from queue
      current.destroy();
      this.imageLayerQueue.splice(index, 1);

      // Update current index to last layer
      this.currentIndex = Math.max(0, this.imageLayerQueue.length - 1);

      // Create default layer if none exist
      if (this.imageLayerQueue.length === 0) {
        this.createDefaultImage();
      }

      this.showMessage("delete");
      this.updateScrollUI();
    }
  }
}

// Create singleton renderer instance (only in browser environment)
let imgKitRenderer;
if (typeof document !== "undefined") {
  imgKitRenderer = new ImgKitRenderer();
  // Initialize with default image
  imgKitRenderer.createDefaultImage();
}

// Backward compatibility helpers
class Parameter {
  static num = 0;
}

function createDefaultImage() {
  return imgKitRenderer ? imgKitRenderer.createDefaultImage() : null;
}

function getCurrentLayer() {
  return imgKitRenderer ? imgKitRenderer.getCurrentLayer() : null;
}

// Export everything
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    // Main exports
    ImgKitRenderer,
    ImageLayer,
    imgKitRenderer,

    // Helper functions
    createDefaultImage,
    getCurrentLayer,

    // Backward compatibility
    Parameter,
    imageLayerQueue: imgKitRenderer ? imgKitRenderer.imageLayerQueue : [],
  };
}
