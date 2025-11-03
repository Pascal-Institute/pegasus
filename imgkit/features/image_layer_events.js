const { ipcRenderer, webUtils } = require("electron");
const { ImageMode } = require("./image_mode");
const { ImageProcessor } = require("../processing/image_processor");

/**
 * ImageLayerEvents - Handles all event listeners for ImageLayer
 * Extracted from ImageLayer class to improve code organization
 */
class ImageLayerEvents {
  /**
   * @param {ImageLayer} imageLayer - Reference to parent ImageLayer instance
   */
  constructor(imageLayer) {
    this.layer = imageLayer;

    // Setup all event listeners
    this.setupEvents();
  }

  /**
   * Setup all event listeners
   */
  setupEvents() {
    // Panel focus on click (with Ctrl+click multi-select support)
    this.layer.panel.addEventListener("click", (e) => {
      const index = this.layer.renderer.imageLayerQueue.indexOf(this.layer);
      // Support both Ctrl (Windows/Linux) and Cmd (Mac) for multi-select toggle
      const isMultiSelectKey = e.ctrlKey || e.metaKey;
      this.layer.renderer.setCurrentLayer(index, isMultiSelectKey);
    });

    this.layer.canvas.addEventListener("click", async (e) => {
      if (this.layer.modeManager.isColorPicker()) {
        const rect = this.layer.canvas.getBoundingClientRect();
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);

        // Extract color at clicked position
        const color = await ImageProcessor.extractColorAt(
          this.layer.buffer,
          this.layer.info,
          x,
          y
        );

        const color_name = await ImageProcessor.getColorName(color);

        // Send color to main renderer
        ipcRenderer.send("colorpickerValueSEND", color, color_name);
      }
    });

    // Mouse hover effects
    this.layer.panel.addEventListener("mouseover", () => {
      this.layer.canvas.style.cursor = this.layer.modeManager.getCursor();
    });

    this.layer.panel.addEventListener("mouseout", () => {
      this.layer.canvas.style.cursor = "default";
    });

    // Delete button
    this.layer.deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.layer.renderer.deleteImage();
    });

    // Name input - prevent panel click event from interfering
    this.layer.nameInput.addEventListener("click", (e) => {
      e.stopPropagation(); // Don't trigger panel click
    });

    this.layer.nameInput.addEventListener("change", (e) => {
      ipcRenderer.send("showNotificationREQ", "imgkit-name-changed");
    });
    // Name input - update filename on change
    this.layer.nameInput.addEventListener("change", (e) => {
      const newFilename = e.target.value.trim();
      if (newFilename) {
        this.layer.filename = newFilename;
        // If we have a filepath, update it with the new filename
        if (this.layer.filepath) {
          const dir = require("path").dirname(this.layer.filepath);
          const ext = this.layer.extension;
          this.layer.filepath = require("path").join(
            dir,
            `${newFilename}.${ext}`
          );
        }
      }
    });

    // Color copy on click
    this.layer.colorBox.colors.forEach((colorDiv) => {
      colorDiv.addEventListener("click", () => {
        const color = colorDiv.title;
        if (color && color !== "empty") {
          navigator.clipboard.writeText(color).then(() => {
            this.layer.renderer.showMessage("copy");
          });
        }
      });
    });

    // Extension change
    this.layer.extensionCombo.addEventListener("change", (e) => {
      if (this.layer.convertFormat) {
        this.layer.convertFormat(e.target.value);
      }
    });

    // Setup drag and drop
    this.setupDragDrop();

    // Setup context menu
    this.setupContextMenu();

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Setup individual interaction modes
    this.setupCropping();
    this.setupDrawing();
    this.setupMagnifying();

    this.setupPanelDragging();
  }

  /**
   * Setup drag and drop for reordering panels
   */
  setupPanelDragging() {
    // Make panel draggable initially false, set to true when image is loaded
    this.layer.panel.draggable = false;

    // Drag start - store the dragged layer index
    this.layer.panel.addEventListener("dragstart", (e) => {
      // Only allow drag if this is not the default layer
      if (this.layer.isDefault) {
        e.preventDefault();
        return;
      }

      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", "panel-swap"); // Mark as panel swap

      // Store the index of dragged layer
      const index = this.layer.renderer.imageLayerQueue.indexOf(this.layer);
      e.dataTransfer.setData("layerIndex", index.toString());

      // Add visual feedback
      this.layer.panel.style.opacity = "0.5";
    });

    // Drag end - restore opacity
    this.layer.panel.addEventListener("dragend", (e) => {
      this.layer.panel.style.opacity = "1";
    });

    // Drag over - allow drop
    this.layer.panel.addEventListener("dragover", (e) => {
      // Check if this is a panel swap (not a file drop)
      const types = e.dataTransfer.types;
      if (types.includes("layerindex") || types.includes("text/plain")) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";

        // Add visual feedback
        this.layer.panel.style.borderTop = "3px solid #4CAF50";
      }
      return false;
    });

    // Drag leave - remove visual feedback
    this.layer.panel.addEventListener("dragleave", (e) => {
      this.layer.panel.style.borderTop = "";
    });

    // Drop - swap positions
    this.layer.panel.addEventListener("drop", (e) => {
      // Check if this is a panel swap
      const layerIndexStr = e.dataTransfer.getData("layerIndex");

      if (layerIndexStr) {
        // This is a panel swap
        e.preventDefault();
        e.stopPropagation();

        // Remove visual feedback
        this.layer.panel.style.borderTop = "";

        // Get dragged layer index
        const fromIndex = parseInt(layerIndexStr);
        const toIndex = this.layer.renderer.imageLayerQueue.indexOf(this.layer);

        if (fromIndex !== toIndex && fromIndex >= 0 && toIndex >= 0) {
          console.log(`🔄 Swapping panels: ${fromIndex} ↔ ${toIndex}`);
          this.layer.renderer.swapLayers(fromIndex, toIndex);
        }

        return false;
      }
      // Otherwise, let the file drop handler in setupDragDrop() handle it
    });
  }

  /**
   * Setup drag and drop handlers
   */
  setupDragDrop() {
    // Prevent default browser behavior
    this.layer.canvas.addEventListener("dragover", (e) => e.preventDefault());

    this.layer.canvas.addEventListener("dragenter", (e) => {
      e.preventDefault();
      this.focusCurrentLayer();
    });

    this.layer.canvas.addEventListener("drop", async (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;

      if (!files || files.length === 0) return;

      await this.processDroppedFiles(Array.from(files));
    });
  }

  /**
   * Focus this layer when drag enters
   * @private
   */
  focusCurrentLayer() {
    const index = this.layer.renderer.imageLayerQueue.indexOf(this.layer);
    this.layer.renderer.setCurrentLayer(index);
  }

  /**
   * Process multiple dropped files
   * @private
   * @param {File[]} files - Array of dropped files
   */
  async processDroppedFiles(files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      const targetLayer = this.getTargetLayer(i);
      await this.loadFileToLayer(file, targetLayer);
    }

    // Add one more empty layer for next image
    if (this.layer.renderer.currentIndex === this.layer.renderer.imageLayerQueue.length - 1) {
      this.layer.renderer.createDefaultImage();
    }
  }

  /**
   * Get target layer for file at index
   * First file goes to current layer, rest to new layers
   * @private
   * @param {number} fileIndex - Index of file in dropped files array
   * @returns {ImageLayer} Target layer
   */
  getTargetLayer(fileIndex) {
    if (fileIndex === 0) {
      return this.layer;
    }

    // Create new layer for additional files
    const newLayer = this.layer.renderer.createDefaultImage();
    const newIndex = this.layer.renderer.imageLayerQueue.length - 1;
    this.layer.renderer.setCurrentLayer(newIndex);
    return newLayer;
  }

  /**
   * Load file into target layer
   * @private
   * @param {File} file - File to load
   * @param {ImageLayer} targetLayer - Target layer
   */
  async loadFileToLayer(file, targetLayer) {
    let isOpened = false;

    if (file.path) {
      // Desktop file with path
      isOpened = await targetLayer.openImage(file.path);
    } else {
      // Web file or clipboard - read as buffer
      isOpened = await this.loadFileAsBuffer(file, targetLayer);
    }

    if (isOpened) {
      // Enable panel dragging after successful load
      targetLayer.panel.draggable = true;
    }
  }

  /**
   * Load file as buffer using FileReader
   * @private
   * @param {File} file - File to load
   * @param {ImageLayer} targetLayer - Target layer
   * @returns {Promise<boolean>} Success status
   */
  async loadFileAsBuffer(file, targetLayer) {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async (evt) => {
        const arrayBuffer = evt.target.result;
        const buffer = Buffer.from(arrayBuffer);

        // Try to get file path (may not be available)
        let filePath;
        try {
          filePath = webUtils.getPathForFile(file);
        } catch (err) {
          console.log("Could not get file path:", err);
        }

        const isOpened = await targetLayer.openImageBuffer(
          buffer,
          file.name,
          filePath
        );

        resolve(isOpened);
      };

      reader.onerror = () => {
        console.error("FileReader error:", reader.error);
        resolve(false);
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Setup context menu (right-click)
   * Uses IPC to communicate with Main Process for native menu
   */
  setupContextMenu() {
    // Listen for menu action responses from Main Process
    ipcRenderer.on("imgkit-context-menu-action", (event, action) => {
      switch (action) {
        case "copy":
          this.layer.renderer.copyImage();
          break;
        case "paste":
          this.layer.renderer.pasteImage();
          break;
        case "delete":
          this.layer.renderer.deleteImage();
          break;
        case "undo":
          this.layer.undo();
          break;
        case "redo":
          this.layer.redo();
          break;
        case "hide":
          this.layer.hide();
          break;

      }
    });

    this.layer.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      // Send request to Main Process to show context menu
      ipcRenderer.send("show-imgkit-context-menu", {
        hasUndo: this.layer.history.canUndo(),
        hasRedo: this.layer.history.canRedo(),
      });
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    // Note: Alt + M for magnifying glass is handled globally in main_renderer.js

    document.addEventListener("keydown", (e) => {
      // Only handle if this panel is focused
      if (document.activeElement !== this.layer.panel) return;

      const current = this.layer.renderer.getCurrentLayer();
      if (current !== this.layer) return;

      // Delete: Ctrl+D (Cmd+D on Mac) or Delete key
      if (((e.ctrlKey || e.metaKey) && e.key === "d") || e.key === "Delete") {
        e.preventDefault();
        this.layer.renderer.deleteImage();
      }
      // Copy: Ctrl+C (Cmd+C on Mac)
      else if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        this.layer.renderer.copyImage();
      }
      // Paste: Ctrl+V (Cmd+V on Mac)
      else if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        this.layer.renderer.pasteImage();
      }
      // Navigate: Arrow keys
      else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const currentIdx = this.layer.renderer.currentIndex;
        let newIdx = currentIdx;

        if ((e.ctrlKey || e.metaKey) && e.key === "ArrowLeft") {
          newIdx = 0;
        } else if ((e.ctrlKey || e.metaKey) && e.key === "ArrowRight") {
          newIdx = this.layer.renderer.imageLayerQueue.length - 1;
        } else if (e.key === "ArrowLeft" && currentIdx > 0) {
          newIdx = currentIdx - 1;
        } else if (
          e.key === "ArrowRight" &&
          currentIdx < this.layer.renderer.imageLayerQueue.length - 1
        ) {
          newIdx = currentIdx + 1;
        }

        if (newIdx !== currentIdx) {
          this.layer.renderer.setCurrentLayer(newIdx);
          this.layer.renderer.imageLayerQueue[newIdx].panel.focus();
        }
      }
    });
  }

  /**
   * Setup cropping functionality
   */
  setupCropping() {
    this.layer.canvas.addEventListener("mousedown", (e) => {
      // Only handle if in cropping mode
      if (!this.layer.modeManager.isCropping()) return;
      this.layer.panel.setAttribute("draggable", false);

      const rect = this.layer.canvas.getBoundingClientRect();
      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;
      this.layer.cropData.x = startX;
      this.layer.cropData.y = startY;

      this.layer.ctx.setLineDash([2]);

      const mouseMoveHandler = (evt) => {
        this.layer.ctx.clearRect(
          0,
          0,
          this.layer.canvas.width,
          this.layer.canvas.height
        );
        this.layer.ctx.drawImage(this.layer.image, 0, 0);

        const currX = evt.clientX - rect.left;
        const currY = evt.clientY - rect.top;

        // Calculate crop rectangle
        const x = Math.min(startX, currX);
        const y = Math.min(startY, currY);
        const w = Math.abs(currX - startX);
        const h = Math.abs(currY - startY);

        this.layer.cropData = { x, y, width: w, height: h };
        this.layer.ctx.strokeRect(x, y, w, h);
      };

      const mouseUpHandler = () => {
        this.layer.canvas.removeEventListener("mousemove", mouseMoveHandler);
        document.removeEventListener("mouseup", mouseUpHandler);

        // Apply crop if valid
        if (this.layer.applyCrop) {
          this.layer.applyCrop(this.layer.cropData);
        }
      };

      this.layer.canvas.addEventListener("mousemove", mouseMoveHandler);
      document.addEventListener("mouseup", mouseUpHandler);
    });
  }

  /**
   * Setup drawing/painting functionality
   */
  setupDrawing() {
    // Drawing mode will be implemented here
    // Currently handled by main_renderer.js with drawImgCMD
    // TODO: Add canvas drawing logic when in DRAWING mode
    // this.layer.canvas.addEventListener("mousedown", (e) => {
    //   if (!this.layer.modeManager.isDrawing()) return;
    //   // Start drawing...
    // });
  }

  /**
   * Setup magnifying glass functionality
   */
  setupMagnifying() {
    // Magnifying glass mode
    this.layer.canvas.addEventListener("mousemove", (e) => {
      if (!this.layer.modeManager.isMagnifying()) return;

      // Cancel previous animation
      if (this.layer.magnifyAnimationId) {
        cancelAnimationFrame(this.layer.magnifyAnimationId);
      }

      // Schedule next frame
      this.layer.magnifyAnimationId = requestAnimationFrame(() => {
        const rect = this.layer.canvas.getBoundingClientRect();
        let mouseX = e.clientX - rect.left;
        let mouseY = e.clientY - rect.top;

        const magnifySize = 128;
        const magnifyScale = 2;
        const radius = magnifySize / 2;

        // Clamp coordinates to canvas bounds (allow full edge coverage)
        mouseX = Math.max(0, Math.min(mouseX, this.layer.canvas.width));
        mouseY = Math.max(0, Math.min(mouseY, this.layer.canvas.height));

        // Clear overlay canvas (main canvas stays untouched = no flicker!)
        this.layer.overlayCtx.clearRect(
          0,
          0,
          this.layer.overlayCanvas.width,
          this.layer.overlayCanvas.height
        );

        // Draw magnifying glass on overlay
        this.layer.overlayCtx.save();
        this.layer.overlayCtx.beginPath();
        this.layer.overlayCtx.arc(mouseX, mouseY, radius, 0, Math.PI * 2);
        this.layer.overlayCtx.clip();

        const sourceSize = magnifySize / magnifyScale;
        // Clamp source coordinates to prevent reading outside image bounds
        const sourceX = Math.max(
          0,
          Math.min(mouseX - sourceSize / 2, this.layer.image.width - sourceSize)
        );
        const sourceY = Math.max(
          0,
          Math.min(
            mouseY - sourceSize / 2,
            this.layer.image.height - sourceSize
          )
        );

        this.layer.overlayCtx.drawImage(
          this.layer.image,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          mouseX - radius,
          mouseY - radius,
          magnifySize,
          magnifySize
        );

        this.layer.overlayCtx.restore();

        // Draw border on overlay
        this.layer.overlayCtx.beginPath();
        this.layer.overlayCtx.arc(mouseX, mouseY, radius, 0, Math.PI * 2);
        this.layer.overlayCtx.strokeStyle = "#000";
        this.layer.overlayCtx.lineWidth = 2;
        this.layer.overlayCtx.stroke();
      });
    });

    this.layer.canvas.addEventListener("mouseleave", () => {
      if (this.layer.modeManager.isMagnifying()) {
        // Cancel animation
        if (this.layer.magnifyAnimationId) {
          cancelAnimationFrame(this.layer.magnifyAnimationId);
          this.layer.magnifyAnimationId = null;
        }

        // Clear overlay (main canvas untouched!)
        this.layer.overlayCtx.clearRect(
          0,
          0,
          this.layer.overlayCanvas.width,
          this.layer.overlayCanvas.height
        );
      }
    });
  }
}

module.exports = { ImageLayerEvents };
