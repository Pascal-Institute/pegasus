const { ipcRenderer, webUtils } = require("electron");
const { ImageMode } = require('./image-mode');

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
    // Panel focus on click
    this.layer.panel.addEventListener("click", () => {
      const index = this.layer.renderer.imageLayerQueue.indexOf(this.layer);
      this.layer.renderer.setCurrentLayer(index);
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

    // Setup drawing/cropping
    this.setupDrawingAndCropping();

    this.setupPanelDragging();
  }

  /**
   * Setup drag and drop for reordering panels
   */
  setupPanelDragging() {
    // Make panel draggable
    this.layer.panel.draggable = false; // Initially false, set to true when image is loaded

    // Drag start - store the dragged layer index
    this.layer.panel.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.layer.panel.innerHTML);
      
      // Store the index of dragged layer
      const index = this.layer.renderer.imageLayerQueue.indexOf(this.layer);
      e.dataTransfer.setData('layerIndex', index.toString());
      
      // Add visual feedback
      this.layer.panel.style.opacity = '0.5';
    });

    // Drag end - restore opacity
    this.layer.panel.addEventListener('dragend', (e) => {
      this.layer.panel.style.opacity = '1';
    });

    // Drag over - allow drop
    this.layer.panel.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      // Add visual feedback
      this.layer.panel.style.borderTop = '3px solid #4CAF50';
      return false;
    });

    // Drag leave - remove visual feedback
    this.layer.panel.addEventListener('dragleave', (e) => {
      this.layer.panel.style.borderTop = '';
    });

    // Drop - swap positions
    this.layer.panel.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Remove visual feedback
      this.layer.panel.style.borderTop = '';
      
      // Get dragged layer index
      const fromIndex = parseInt(e.dataTransfer.getData('layerIndex'));
      const toIndex = this.layer.renderer.imageLayerQueue.indexOf(this.layer);
      
      if (fromIndex !== toIndex && fromIndex >= 0 && toIndex >= 0) {
        this.layer.renderer.swapLayers(fromIndex, toIndex);
      }
      
      return false;
    });
  }

  /**
   * Setup drag and drop handlers
   */
  setupDragDrop() {
    this.layer.canvas.addEventListener("dragover", (e) => e.preventDefault());
    this.layer.canvas.addEventListener("dragenter", (e) => {
      e.preventDefault();
      const index = this.layer.renderer.imageLayerQueue.indexOf(this.layer);
      this.layer.renderer.setCurrentLayer(index);
    });

    this.layer.canvas.addEventListener("drop", async (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;

      const tryOpenImg = async (filepathOrBuffer) => {
        let isOpened;
        if (typeof filepathOrBuffer === "string") {
          isOpened = await this.layer.openImage(filepathOrBuffer);
        } else {
          const filePath = webUtils.getPathForFile(file);
          isOpened = await this.layer.openImageBuffer(
            filepathOrBuffer,
            file.name,
            filePath
          );
        }
        if (!isOpened) return;

        // Only create a new default layer if dropping on an empty canvas
        if (!this.layer.isDefault && 
          this.layer.renderer.currentIndex === this.layer.renderer.imageLayerQueue.length - 1) {
          // Make panel draggable
          this.layer.panel.draggable = true;
          this.layer.renderer.createDefaultImage();
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
          this.layer.renderer.copyImage();
          break;
        case 'paste':
          this.layer.renderer.pasteImage();
          break;
        case 'delete':
          this.layer.renderer.deleteImage();
          break;
        case 'undo':
          this.layer.undo();
          break;
        case 'redo':
          this.layer.redo();
          break;
      }
    });

    this.layer.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      // Send request to Main Process to show context menu
      ipcRenderer.send('show-imgkit-context-menu', {
        hasUndo: this.layer.history.index > 0,
        hasRedo: this.layer.history.index < this.layer.history.buffers.length - 1
      });
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    // Note: Alt + A for magnifying glass is handled globally in renderer.js
    
    document.addEventListener("keydown", (e) => {
      // Only handle if this panel is focused
      if (document.activeElement !== this.layer.panel) return;

      const current = this.layer.renderer.getCurrentLayer();
      if (current !== this.layer) return;

      // Delete: Ctrl+D or Delete key
      if ((e.ctrlKey && e.key === "d") || e.key === "Delete") {
        e.preventDefault();
        this.layer.renderer.deleteImage();
      }
      // Copy: Ctrl+C
      else if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        this.layer.renderer.copyImage();
      }
      // Paste: Ctrl+V
      else if (e.ctrlKey && e.key === "v") {
        e.preventDefault();
        this.layer.renderer.pasteImage();
      }
      // Navigate: Arrow keys
      else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const currentIdx = this.layer.renderer.currentIndex;
        let newIdx = currentIdx;

        if (e.ctrlKey && e.key === "ArrowLeft") {
          newIdx = 0;
        } else if (e.ctrlKey && e.key === "ArrowRight") {
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
   * Setup drawing and cropping functionality
   */
  setupDrawingAndCropping() {
    this.layer.canvas.addEventListener("mousedown", (e) => {
      // Cropping mode (crosshair cursor)
      if (this.layer.canvas.style.cursor === "crosshair") {
        // Start drag crop mode
        this.layer.modeManager.setMode(ImageMode.DRAG_CROP);
        
        const rect = this.layer.canvas.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        this.layer.cropData.x = startX;
        this.layer.cropData.y = startY;

        this.layer.ctx.setLineDash([2]);

        const mouseMoveHandler = (evt) => {
          this.layer.ctx.clearRect(0, 0, this.layer.canvas.width, this.layer.canvas.height);
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
          
          // Reset to cropping mode (not drag crop)
          this.layer.modeManager.setMode(ImageMode.CROPPING);

          // Apply crop if valid
          if (this.layer.applyCrop) {
            this.layer.applyCrop(this.layer.cropData);
          }
        };

        this.layer.canvas.addEventListener("mousemove", mouseMoveHandler);
        document.addEventListener("mouseup", mouseUpHandler);
      }
    });

    this.layer.canvas.addEventListener("mouseup", () => {
      // Only reset if in drag crop mode
      if (this.layer.modeManager.isDraggingCrop()) {
        this.layer.modeManager.setMode(ImageMode.CROPPING);
      }
    });

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
        this.layer.overlayCtx.clearRect(0, 0, this.layer.overlayCanvas.width, this.layer.overlayCanvas.height);

        // Draw magnifying glass on overlay
        this.layer.overlayCtx.save();
        this.layer.overlayCtx.beginPath();
        this.layer.overlayCtx.arc(mouseX, mouseY, radius, 0, Math.PI * 2);
        this.layer.overlayCtx.clip();

        const sourceSize = magnifySize / magnifyScale;
        // Clamp source coordinates to prevent reading outside image bounds
        const sourceX = Math.max(0, Math.min(mouseX - sourceSize / 2, this.layer.image.width - sourceSize));
        const sourceY = Math.max(0, Math.min(mouseY - sourceSize / 2, this.layer.image.height - sourceSize));
        
        this.layer.overlayCtx.drawImage(
          this.layer.image,
          sourceX, sourceY, sourceSize, sourceSize,
          mouseX - radius, mouseY - radius, magnifySize, magnifySize
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
        this.layer.overlayCtx.clearRect(0, 0, this.layer.overlayCanvas.width, this.layer.overlayCanvas.height);
      }
    });
  }
}

module.exports = { ImageLayerEvents };
