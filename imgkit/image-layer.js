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
// - Bridge UI events to backend operations (via imgKitMain)

const { ipcRenderer } = require('electron');
const { getCurrentLayer } = require('./renderer');

// Lazy load to avoid circular dependency
let getImgKitMain = () => {
  throw new Error(
    "getImgKitMain is not set. Please call setGetImgKitMain(fn) before using ImageLayer."
  );
};

/**
 * Set the getImgKitMain function (called from renderer.js)
 * @param {Function} fn - Function to get imgKitMain instance
 */
function setGetImgKitMain(fn) {
  getImgKitMain = fn;
}

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
    // DRAWING/CROPPING STATE
    // --------------------------------------------------------------------------

    // Used for drawing/painting and crop operations
    this.drawFlag = false; // Is user currently drawing?
    this.dragFlag = false; // Is user currently dragging to crop?
    this.cropData = { x: 0, y: 0, width: 0, height: 0 }; // Crop selection area

    // Create DOM elements and setup event listeners
    this.createPanelFromTemplate();
    this.setupEvents();
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
  // EVENT SETUP
  // --------------------------------------------------------------------------

  /**
   * Setup all event listeners
   */
  setupEvents() {
    // Panel focus on click
    this.panel.addEventListener("click", () => {
      const index = this.renderer.imageLayerQueue.indexOf(this);
      this.renderer.setCurrentLayer(index);
    });

    // Mouse hover effects
    this.panel.addEventListener("mouseover", () => {
      document.body.style.cursor = "pointer";
    });
    this.panel.addEventListener("mouseout", () => {
      document.body.style.cursor = "default";
    });

    // Delete button
    this.deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.renderer.deleteImage();
    });

    // Color copy on click
    this.colorBox.colors.forEach((colorDiv) => {
      colorDiv.addEventListener("click", () => {
        const color = colorDiv.title;
        if (color && color !== "empty") {
          navigator.clipboard.writeText(color).then(() => {
            this.renderer.showMessage("copy");
          });
        }
      });
    });

    // Extension change
    this.extensionCombo.addEventListener("change", (e) => {
      if (this.convertFormat) {
        this.convertFormat(e.target.value);
      }
    });

    // Setup drag and drop
    this.setupDragDrop();

    // Setup context menu
    this.setupContextMenu();

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Setup drawing/cropping
    this.setupDrawingAndCropping();

    this.setupPanelDragging();
  }

  /**
   * Setup drag and drop for reordering panels
   */
  setupPanelDragging() {

    // Make panel draggable
    this.panel.draggable = false; // Initially false, set to true when image is loaded

    // Drag start - store the dragged layer index
    this.panel.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.panel.innerHTML);
      
      // Store the index of dragged layer
      const index = this.renderer.imageLayerQueue.indexOf(this);
      e.dataTransfer.setData('layerIndex', index.toString());
      
      // Add visual feedback
      this.panel.style.opacity = '0.5';
    });

    // Drag end - restore opacity
    this.panel.addEventListener('dragend', (e) => {
      this.panel.style.opacity = '1';
    });

    // Drag over - allow drop
    this.panel.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      // Add visual feedback
      this.panel.style.borderTop = '3px solid #4CAF50';
      return false;
    });

    // Drag leave - remove visual feedback
    this.panel.addEventListener('dragleave', (e) => {
      this.panel.style.borderTop = '';
    });

    // Drop - swap positions
    this.panel.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Remove visual feedback
      this.panel.style.borderTop = '';
      
      // Get dragged layer index
      const fromIndex = parseInt(e.dataTransfer.getData('layerIndex'));
      const toIndex = this.renderer.imageLayerQueue.indexOf(this);
      
      if (fromIndex !== toIndex && fromIndex >= 0 && toIndex >= 0) {
        this.renderer.swapLayers(fromIndex, toIndex);
      }
      
      return false;
    });
  }

  /**
   * Setup drag and drop handlers
   */
  setupDragDrop() {
    this.canvas.addEventListener("dragover", (e) => e.preventDefault());
    this.canvas.addEventListener("dragenter", (e) => {
      e.preventDefault();
      const index = this.renderer.imageLayerQueue.indexOf(this);
      this.renderer.setCurrentLayer(index);
    });

    this.canvas.addEventListener("drop", async (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;

      const tryOpenImg = async (filepathOrBuffer) => {
        let isOpened;
        if (typeof filepathOrBuffer === "string") {
          isOpened = await this.openImage(filepathOrBuffer);
        } else {
          // Pass file.path if available, otherwise use file.name
          isOpened = await this.openImageBuffer(
            filepathOrBuffer,
            file.name,
            file.path || null
          );
        }
        if (!isOpened) return;

        // Only create a new default layer if dropping on an empty canvas
        if (!this.isDefault) {
          // Make panel draggable
          this.panel.draggable = true;
          this.renderer.createDefaultImage();
        }
      };

      if (!file.path) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const arrayBuffer = e.target.result;
          const buffer = Buffer.from(arrayBuffer);
          tryOpenImg(buffer);
        };
        reader.readAsArrayBuffer(file);
      } else {
        tryOpenImg(file.path);
      }
    });
  }

  /**
   * Setup context menu (right-click)
   * Uses IPC to communicate with Main Process for native menu
   */
  setupContextMenu() {
    // Listen for menu action responses from Main Process
    ipcRenderer.on('imgkit-context-menu-action', (event, action) => {
      switch (action) {
        case 'copy':
          this.renderer.copyImage();
          break;
        case 'paste':
          this.renderer.pasteImage();
          break;
        case 'delete':
          this.renderer.deleteImage();
          break;
        case 'undo':
          this.undo();
          break;
        case 'redo':
          this.redo();
          break;
      }
    });

    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      // Send request to Main Process to show context menu
      ipcRenderer.send('show-imgkit-context-menu', {
        hasUndo: this.history.index > 0,
        hasRedo: this.history.index < this.history.buffers.length - 1
      });
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Only handle if this panel is focused
      if (document.activeElement !== this.panel) return;

      const current = this.renderer.getCurrentLayer();
      if (current !== this) return;

      // Delete: Ctrl+D or Delete key
      if ((e.ctrlKey && e.key === "d") || e.key === "Delete") {
        e.preventDefault();
        this.renderer.deleteImage();
      }
      // Copy: Ctrl+C
      else if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        this.renderer.copyImage();
      }
      // Paste: Ctrl+V
      else if (e.ctrlKey && e.key === "v") {
        e.preventDefault();
        this.renderer.pasteImage();
      }
      // Navigate: Arrow keys
      else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const currentIdx = this.renderer.currentIndex;
        let newIdx = currentIdx;

        if (e.ctrlKey && e.key === "ArrowLeft") {
          newIdx = 0;
        } else if (e.ctrlKey && e.key === "ArrowRight") {
          newIdx = this.renderer.imageLayerQueue.length - 1;
        } else if (e.key === "ArrowLeft" && currentIdx > 0) {
          newIdx = currentIdx - 1;
        } else if (
          e.key === "ArrowRight" &&
          currentIdx < this.renderer.imageLayerQueue.length - 1
        ) {
          newIdx = currentIdx + 1;
        }

        if (newIdx !== currentIdx) {
          this.renderer.setCurrentLayer(newIdx);
          this.renderer.imageLayerQueue[newIdx].panel.focus();
        }
      }
    });
  }

  /**
   * Setup drawing and cropping functionality
   */
  setupDrawingAndCropping() {
    this.canvas.addEventListener("mousedown", (e) => {
      this.dragFlag = true;

      // Cropping mode (crosshair cursor)
      if (document.body.style.cursor === "crosshair") {
        const rect = this.canvas.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        this.cropData.x = startX;
        this.cropData.y = startY;

        this.ctx.setLineDash([2]);

        const mouseMoveHandler = (evt) => {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.drawImage(this.image, 0, 0);

          const currX = evt.clientX - rect.left;
          const currY = evt.clientY - rect.top;

          // Calculate crop rectangle
          const x = Math.min(startX, currX);
          const y = Math.min(startY, currY);
          const w = Math.abs(currX - startX);
          const h = Math.abs(currY - startY);

          this.cropData = { x, y, width: w, height: h };
          this.ctx.strokeRect(x, y, w, h);
        };

        const mouseUpHandler = () => {
          this.canvas.removeEventListener("mousemove", mouseMoveHandler);
          document.removeEventListener("mouseup", mouseUpHandler);
          this.dragFlag = false;

          // Apply crop if valid
          if (this.applyCrop) {
            this.applyCrop(this.cropData);
          }
        };

        this.canvas.addEventListener("mousemove", mouseMoveHandler);
        document.addEventListener("mouseup", mouseUpHandler);
      }
    });

    this.canvas.addEventListener("mouseup", () => {
      this.dragFlag = false;
    });
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

    this.canvas.width = info.width;
    this.canvas.height = info.height;

    this.image.src = `data:image/${this.extension};base64,${buffer.toString(
      "base64"
    )}`;
    this.image.onload = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.image, 0, 0);
    };

    this.infoText.textContent = `${info.width} x ${info.height}`;
    this.addToHistory(buffer, info, this.extension);

    // Extract colors and update color boxes
    let extractedColors = colors;
    if (!extractedColors) {
      try {
        if (typeof getImgKitMain !== "function") {
          throw new Error(
            "getImgKitMain is not set. Please call setGetImgKitMain(fn) before using ImageLayer."
          );
        }
        const imgKitMain = getImgKitMain();
        extractedColors = await imgKitMain.extractColors(buffer, info, 3);
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
      if (typeof getImgKitMain !== "function") {
        throw new Error(
          "getImgKitMain is not set. Please call setGetImgKitMain(fn) before using ImageLayer."
        );
      }
      const result = await getImgKitMain().openImage(filepath);

      this.filepath = filepath;
      this.filename = result.filename;
      this.extension = result.extension;
      this.nameSpan.textContent = this.filename;
      this.extensionCombo.value = this.extension;
      this.updatePreview(result.buffer, result.info);

      if (result.colors && result.colors.length > 0) {
        result.colors.forEach((color, idx) => {
          if (this.colorBox.colors[idx]) {
            this.colorBox.colors[idx].style.backgroundColor = color;
            this.colorBox.colors[idx].title = color;
          }
        });
      }

      if (filepath !== "./assets/addImage.png") {
        this.canvas.id = "full";
        this.isDefault = false;
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
      if (typeof getImgKitMain !== "function") {
        throw new Error(
          "getImgKitMain is not set. Please call setGetImgKitMain(fn) before using ImageLayer."
        );
      }
      const result = await getImgKitMain().openImageBuffer(buffer, filename);

      this.buffer = result.buffer;
      this.filename = result.filename;
      this.filepath = filepath || result.filename; // Use provided filepath or fallback to filename
      this.extension = result.extension;
      this.nameSpan.textContent = this.filename;
      this.extensionCombo.value = this.extension;
      this.updatePreview(result.buffer, result.info);

      if (result.colors && result.colors.length > 0) {
        result.colors.forEach((color, idx) => {
          if (this.colorBox.colors[idx]) {
            this.colorBox.colors[idx].style.backgroundColor = color;
            this.colorBox.colors[idx].title = color;
          }
        });
      }

      this.canvas.id = "full";
      this.isDefault = false;
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
      if (typeof getImgKitMain !== "function") {
        throw new Error(
          "getImgKitMain is not set. Please call setGetImgKitMain(fn) before using ImageLayer."
        );
      }
      const imgKitMain = getImgKitMain();
      const result = await imgKitMain.convertFormat(
        this.buffer,
        this.extension,
        newExtension
      );

      this.extension = newExtension;

      // Update filepath extension using backend helper
      if (this.filepath) {
        this.filepath = imgKitMain.updateFileExtension(
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

      if (typeof getImgKitMain !== "function") {
        throw new Error(
          "getImgKitMain is not set. Please call setGetImgKitMain(fn) before using ImageLayer."
        );
      }
      await getImgKitMain().saveImage(buffer, savePath);
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
      if (typeof getImgKitMain !== "function") {
        throw new Error(
          "getImgKitMain is not set. Please call setGetImgKitMain(fn) before using ImageLayer."
        );
      }
      const result = await getImgKitMain().processImage(this.buffer, options);
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
      if (typeof getImgKitMain !== "function") {
        throw new Error(
          "getImgKitMain is not set. Please call setGetImgKitMain(fn) before using ImageLayer."
        );
      }
      const result = await getImgKitMain().applyCrop(
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
  setGetImgKitMain,
};
