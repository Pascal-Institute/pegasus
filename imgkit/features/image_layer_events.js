const { ipcRenderer } = require("electron");
const { ImageProcessor } = require("../processing/image_processor");
const LAYER_EVENT_CHANNEL = "imgkit-layer-event";

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

    this.sendLayerEvent = (type, payload = {}) => {
      ipcRenderer.send(LAYER_EVENT_CHANNEL, {
        type,
        layerId: this.layer.id,
        ...payload,
      });
    };

    // Setup all event listeners
    this.setupEvents();
  }

  /**
   * Setup all event listeners
   */
  setupEvents() {
    // Panel focus on click (with Ctrl+click multi-select support)
    this.layer.panel.addEventListener("click", (e) => {
      this.sendLayerEvent("select", { ctrlKey: e.ctrlKey });
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

        navigator.clipboard.writeText(color);
        // Send color to main renderer
        ipcRenderer.send("colorpickerValueSEND", color);
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
      this.sendLayerEvent("delete");
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
            ipcRenderer.send("colorpickerValueSEND", color);
            ipcRenderer.send("showNotificationREQ", "imgkit-color-copy");
          });
        }
      });
    });

    // Extension change
    this.layer.extensionCombo.addEventListener("change", (e) => {
      if (this.layer.convertFormat) {
        if (e.target.value === "ico") {
          if (
            this.layer.info.width > 256 ||
            this.layer.info.height > 256 ||
            this.layer.info.width !== this.layer.info.height
          )
            ipcRenderer.send("showNotificationREQ", "imgkit-ico-error");
          this.layer.extensionCombo.value = this.layer.extension;
          return;
        }

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
    this.setupCoordinateDisplay();

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
      e.dataTransfer.setData("layerId", this.layer.id);

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
      const layerId = e.dataTransfer.getData("layerId");

      if (layerId) {
        // This is a panel swap
        e.preventDefault();
        e.stopPropagation();

        // Remove visual feedback
        this.layer.panel.style.borderTop = "";

        // Get dragged layer id
        const fromLayerId = layerId;
        const toLayerId = this.layer.id;

        if (fromLayerId && fromLayerId !== toLayerId) {
          this.sendLayerEvent("swap", { fromLayerId, toLayerId });
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
    // Prevent default browser behavior and add rotating border effect
    this.layer.canvas.addEventListener("dragover", (e) => {
      e.preventDefault();
      // Add rotating border animation class
      this.layer.panel.classList.add("drag-border-active");
    });

    this.layer.canvas.addEventListener("dragenter", (e) => {
      e.preventDefault();
      this.sendLayerEvent("select");
      // Add rotating border animation class
      this.layer.panel.classList.add("drag-border-active");
    });

    this.layer.canvas.addEventListener("dragleave", (e) => {
      // Only remove class if drag actually left the canvas (not moving to child element)
      // Also handle case where relatedTarget is null (e.g., drag left browser window)
      if (!e.relatedTarget || !this.layer.canvas.contains(e.relatedTarget)) {
        this.layer.panel.classList.remove("drag-border-active");
      }
    });

    this.layer.canvas.addEventListener("drop", async (e) => {
      e.preventDefault();
      // Remove rotating border animation class
      this.layer.panel.classList.remove("drag-border-active");

      const files = e.dataTransfer.files;

      if (!files || files.length === 0) return;

      const payload = await this.collectDroppedFiles(Array.from(files));
      if (payload.length > 0) {
        this.sendLayerEvent("drop", { files: payload });
      }
    });
  }

  async collectDroppedFiles(files) {
    const payload = [];
    for (const file of files) {
      if (!file) continue;
      const entry = await this.fileToPayload(file);
      if (entry) {
        payload.push(entry);
      }
    }
    return payload;
  }

  async fileToPayload(file) {
    if (file.path) {
      return { name: file.name, path: file.path };
    }

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (evt) => {
        const arrayBuffer = evt.target.result;
        resolve({
          name: file.name,
          buffer: Buffer.from(arrayBuffer),
        });
      };

      reader.onerror = () => {
        console.error("FileReader error:", reader.error);
        resolve(null);
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
          this.sendLayerEvent("copy");
          break;
        case "paste":
          this.sendLayerEvent("paste");
          break;
        case "delete":
          this.sendLayerEvent("delete");
          break;
        case "undo":
          this.layer.undo();
          break;
        case "redo":
          this.layer.redo();
          break;
        case "watermark":
          this.layer.processImage({ composite: true });
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
      if (document.activeElement !== this.layer.panel) return;

      if ((e.ctrlKey && e.key === "d") || e.key === "Delete") {
        e.preventDefault();
        this.sendLayerEvent("delete");
      } else if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        this.sendLayerEvent("copy");
      } else if (e.ctrlKey && e.key === "v") {
        e.preventDefault();
        this.sendLayerEvent("paste");
      } else if (e.ctrlKey && e.key === "w") {
        e.preventDefault();
        this.layer.processImage({ composite: true });
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const direction = e.key === "ArrowLeft" ? "left" : "right";
        this.sendLayerEvent("navigate", {
          direction,
          ctrlKey: e.ctrlKey,
        });
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

  /**
   * Setup coordinate display functionality
   */
  setupCoordinateDisplay() {
    // Track mouse position on canvas and display coordinates
    this.layer.canvas.addEventListener("mousemove", (e) => {
      const rect = this.layer.canvas.getBoundingClientRect();
      const x = Math.floor(e.clientX - rect.left);
      const y = Math.floor(e.clientY - rect.top);

      // Update coordinate text
      this.layer.coordText.textContent = `( ${x} , ${y} )`;
    });

    // Reset coordinate display when mouse leaves canvas
    this.layer.canvas.addEventListener("mouseleave", () => {
      this.layer.coordText.textContent = "( - , - )";
    });
  }
}

module.exports = { ImageLayerEvents };
