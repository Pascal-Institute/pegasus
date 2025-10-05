// ImgKit Renderer Process - UI Logic
// Handles all DOM manipulation, events, and user interactions

class ImgKitRenderer {
  constructor() {
    this.imageLayerQueue = [];
    this.currentIndex = 0;
    this.copiedLayer = null;
    this.messages = {};

    // Create UI elements
    this.scrollContainer = this.createScrollContainer();
    this.scrollLeftBtn = this.createScrollButton("left");
    this.scrollRightBtn = this.createScrollButton("right");

    this.initializeMessages();
    this.setupScrollEvents();
  }

  /**
   * Create horizontal scroll container for image panels
   * @returns {HTMLElement} Scroll container element
   */
  createScrollContainer() {
    const container = document.createElement("div");
    container.id = "scroll-container";
    document.body.appendChild(container);
    return container;
  }

  /**
   * Create scroll navigation button
   * @param {string} direction - 'left' or 'right'
   * @returns {HTMLElement} Button element
   */
  createScrollButton(direction) {
    const btn = document.createElement("button");
    btn.innerText = direction === "left" ? "<" : ">";
    btn.style.position = "fixed";
    btn.style[direction] = "16px";
    btn.style.top = "50%";
    btn.style.transform = "translateY(-50%)";
    btn.style.zIndex = "1000";
    btn.style.fontSize = "2em";
    btn.style.background = "#fff";
    btn.style.border = "1px solid #ccc";
    btn.style.borderRadius = "50%";
    btn.style.width = "48px";
    btn.style.height = "48px";
    btn.style.opacity = "0.8";
    btn.style.cursor = "pointer";
    document.body.appendChild(btn);
    return btn;
  }

  /**
   * Initialize notification message elements
   */
  initializeMessages() {
    const messageConfigs = [
      { id: "copy", text: "Color Copied", isError: false },
      { id: "img-copy", text: "Image Copied", isError: false },
      { id: "img-paste", text: "Image Pasted", isError: false },
      { id: "delete", text: "Deleted", isError: true },
      { id: "save", text: "Saved Successfully", isError: false },
      { id: "convert", text: "Converted Successfully", isError: false },
      { id: "error", text: "Sorry. Couldn't open image...", isError: true },
    ];

    messageConfigs.forEach(({ id, text, isError }) => {
      this.createMessageElement(id, text, isError);
    });
  }

  /**
   * Create individual notification message element
   * @param {string} id - Message identifier
   * @param {string} text - Message text
   * @param {boolean} isError - Whether this is an error message
   */
  createMessageElement(id, text, isError = false) {
    const msg = document.createElement("div");
    msg.id = `imgkit-${id}`;
    msg.className = "imgkit-notification";
    msg.textContent = text;
    msg.style.position = "fixed";
    msg.style.bottom = "15px";
    msg.style.left = "50%";
    msg.style.transform = "translateX(-50%)";
    msg.style.width = "400px";
    msg.style.padding = "15px";
    msg.style.opacity = "0";
    msg.style.border = "1px solid transparent";
    msg.style.borderRadius = "4px";
    msg.style.backgroundColor = isError ? "#f29999" : "#dff0d8";
    msg.style.textAlign = "center";
    msg.style.zIndex = "10000";
    msg.style.pointerEvents = "none";
    document.body.appendChild(msg);
    this.messages[id] = msg;
  }

  /**
   * Show notification message with animation
   * @param {string} id - Message identifier
   */
  showMessage(id) {
    if (!this.messages[id]) return;
    this.messages[id].animate([{ opacity: "1" }, { opacity: "0" }], {
      duration: 1800,
      iterations: 1,
    });
  }

  /**
   * Setup scroll button event listeners
   */
  setupScrollEvents() {
    this.scrollLeftBtn.addEventListener("click", () => {
      this.scrollContainer.scrollBy({ left: -400, behavior: "smooth" });
      setTimeout(() => this.updateScrollUI(), 400);
    });

    this.scrollRightBtn.addEventListener("click", () => {
      this.scrollContainer.scrollBy({ left: 400, behavior: "smooth" });
      setTimeout(() => this.updateScrollUI(), 400);
    });

    this.scrollContainer.addEventListener("scroll", () =>
      this.updateScrollUI()
    );
  }

  /**
   * Update scroll UI state and panel ordering
   */
  updateScrollUI() {
    this.imageLayerQueue.forEach((layer, idx) => {
      // Ensure panels are in correct order in scroll container
      if (layer.panel.parentNode !== this.scrollContainer) {
        try {
          document.body.removeChild(layer.panel);
        } catch (e) {}

        if (idx >= this.scrollContainer.children.length) {
          this.scrollContainer.appendChild(layer.panel);
        } else {
          this.scrollContainer.insertBefore(
            layer.panel,
            this.scrollContainer.children[idx]
          );
        }
      } else if (this.scrollContainer.children[idx] !== layer.panel) {
        this.scrollContainer.insertBefore(
          layer.panel,
          this.scrollContainer.children[idx]
        );
      }

      // Apply flex layout settings to prevent overlap
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

    // Update scroll button states
    this.scrollLeftBtn.disabled = this.scrollContainer.scrollLeft <= 0;
    this.scrollRightBtn.disabled =
      this.scrollContainer.scrollLeft + this.scrollContainer.clientWidth >=
      this.scrollContainer.scrollWidth - 2;
  }

  /**
   * Create new image layer
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
   * Create default placeholder image layer
   * @returns {ImageLayer} Created default layer
   */
  createDefaultImage() {
    if (this.imageLayerQueue.length > 0) {
      this.currentIndex++;
    }
    const layer = this.createImageLayer(true);
    this.currentIndex = this.imageLayerQueue.length - 1;
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
   * @param {number} index - Layer index
   */
  setCurrentLayer(index) {
    if (index >= 0 && index < this.imageLayerQueue.length) {
      this.currentIndex = index;
      this.imageLayerQueue.forEach((layer, idx) => {
        layer.setFocus(idx === index);
      });
    }
  }

  /**
   * Copy current image layer
   */
  copyImage() {
    const current = this.getCurrentLayer();
    if (current && current.buffer) {
      this.copiedLayer = {
        buffer: current.buffer,
        filename: current.filename,
        extension: current.extension,
      };
      this.showMessage("img-copy");
    }
  }

  /**
   * Paste copied image to current layer
   */
  pasteImage() {
    if (!this.copiedLayer) return;
    const current = this.getCurrentLayer();
    if (current) {
      const filename = `${this.copiedLayer.filename}_copy.${this.copiedLayer.extension}`;
      current.openImageBuffer(this.copiedLayer.buffer, filename);
      this.showMessage("img-paste");
    }
  }

  /**
   * Delete current image layer
   */
  deleteImage() {
    const current = this.getCurrentLayer();
    if (!current) return;

    const index = this.imageLayerQueue.indexOf(current);
    if (index !== -1) {
      current.destroy();
      this.imageLayerQueue.splice(index, 1);

      // Update current index
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

/**
 * ImageLayer class - Represents a single image panel with canvas and controls
 */
class ImageLayer {
  constructor(renderer, isDefault = false) {
    this.renderer = renderer;
    this.isDefault = isDefault;

    // Image data
    this.buffer = null;
    this.info = null;
    this.filename = "";
    this.extension = "";
    this.filepath = "";

    // History for undo/redo
    this.history = {
      buffers: [],
      infos: [],
      extensions: [],
      index: -1,
      maxSize: 10,
    };

    // UI state
    this.showImageOnly = false;

    // Drawing/cropping state
    this.drawFlag = false;
    this.dragFlag = false;
    this.cropData = { x: 0, y: 0, width: 0, height: 0 };

    // Create DOM elements
    this.createPanel();
    this.setupEvents();
  }

  /**
   * Create panel DOM structure
   */
  createPanel() {
    // Main panel container
    this.panel = document.createElement("div");
    this.panel.className = "imgPanel";
    this.panel.tabIndex = 0;
    this.panel.style.position = "relative";

    // Canvas for image display
    this.canvas = document.createElement("canvas");
    this.canvas.className = "previewImg img-canvas";
    this.canvas.id = this.isDefault ? "default" : "full";
    this.ctx = this.canvas.getContext("2d");
    this.image = new Image();

    // Control elements
    this.deleteBtn = this.createDeleteButton();
    this.nameSpan = this.createNameSpan();
    this.colorBox = this.createColorBox();
    this.infoText = this.createInfoText();
    this.extensionCombo = this.createExtensionCombo();

    // Assemble panel
    [
      this.canvas,
      this.deleteBtn,
      this.nameSpan,
      this.colorBox.container,
      this.infoText,
      this.extensionCombo,
    ].forEach((el) => this.panel.appendChild(el));
  }

  /**
   * Create delete button
   * @returns {HTMLElement} Delete button
   */
  createDeleteButton() {
    const btn = document.createElement("button");
    btn.id = "deleteBtn";
    const img = document.createElement("img");
    img.src = "assets/close.ico";
    img.style.cssText = "width: 100%; height: 100%; object-fit: contain;";
    btn.appendChild(img);
    return btn;
  }

  /**
   * Create filename display span
   * @returns {HTMLElement} Name span
   */
  createNameSpan() {
    const span = document.createElement("span");
    span.id = "nameSpan";
    return span;
  }

  /**
   * Create color palette box
   * @returns {Object} Color box container and color divs
   */
  createColorBox() {
    const container = document.createElement("div");
    container.className = "mainColorBox";

    const colors = [];
    for (let i = 0; i < 3; i++) {
      const colorDiv = document.createElement("div");
      colorDiv.className = `colorBox mainColor${i + 1}`;
      container.appendChild(colorDiv);
      colors.push(colorDiv);
    }

    return { container, colors };
  }

  /**
   * Create info text element
   * @returns {HTMLElement} Info text
   */
  createInfoText() {
    const h2 = document.createElement("h2");
    h2.id = "imgInfoText";
    return h2;
  }

  /**
   * Create format extension combo box
   * @returns {HTMLElement} Extension select element
   */
  createExtensionCombo() {
    const select = document.createElement("select");
    select.id = "extensionComboBox";

    const extensions = [
      "png",
      "jpg",
      "jpeg",
      "webp",
      "gif",
      "bmp",
      "ico",
      "tif",
      "tiff",
    ];
    extensions.forEach((ext) => {
      const option = document.createElement("option");
      option.value = ext;
      option.textContent = ext;
      select.appendChild(option);
    });

    return select;
  }

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

      let isOpened = false;

      if (file.path) {
        // Electron environment with file path
        if (this.openImage) {
          isOpened = await this.openImage(file.path);
        }
      } else {
        // Browser environment - read as buffer
        const reader = new FileReader();
        reader.onload = async (evt) => {
          const buffer = Buffer.from(evt.target.result);
          if (this.openImageBuffer) {
            isOpened = await this.openImageBuffer(buffer, file.name);
          }
        };
        reader.readAsArrayBuffer(file);
        return; // Async operation, don't create default yet
      }

      // Create new default layer if needed
      if (isOpened && (!this.isDefault || this.canvas.id !== "full")) {
        this.renderer.createDefaultImage();
      }
    });
  }

  /**
   * Setup context menu (right-click)
   */
  setupContextMenu() {
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      const menu = document.createElement("div");
      menu.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 10000;
        min-width: 120px;
        padding: 4px 0;
      `;

      const createMenuItem = (text, onClick) => {
        const item = document.createElement("div");
        item.textContent = text;
        item.style.cssText =
          "padding: 8px 16px; cursor: pointer; font-size: 14px;";
        item.addEventListener(
          "mouseover",
          () => (item.style.backgroundColor = "#f0f0f0")
        );
        item.addEventListener(
          "mouseout",
          () => (item.style.backgroundColor = "transparent")
        );
        item.addEventListener("click", () => {
          onClick();
          document.body.removeChild(menu);
        });
        return item;
      };

      menu.appendChild(createMenuItem("Copy", () => this.renderer.copyImage()));
      menu.appendChild(
        createMenuItem("Paste", () => this.renderer.pasteImage())
      );

      document.body.appendChild(menu);

      // Remove menu on outside click
      setTimeout(() => {
        const removeMenu = (evt) => {
          if (!menu.contains(evt.target) && document.body.contains(menu)) {
            document.body.removeChild(menu);
          }
          document.removeEventListener("click", removeMenu);
        };
        document.addEventListener("click", removeMenu);
      }, 10);
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

  /**
   * Update canvas preview with new image data
   * @param {Buffer} buffer - Image buffer
   * @param {Object} info - Image info
   */
  updatePreview(buffer, info) {
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

    // Auto-scroll to show new image
    setTimeout(() => {
      this.renderer.updateScrollUI();
      this.renderer.scrollContainer.scrollLeft =
        this.renderer.scrollContainer.scrollWidth;
    }, 0);
  }

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

  /**
   * Set focus state
   * @param {boolean} focused - Whether panel is focused
   */
  setFocus(focused) {
    this.panel.style.border = focused ? "solid #e0e0e0 1px" : "none";
    this.panel.style.borderRadius = focused ? "5px" : "";
    if (focused) this.panel.focus();
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
}

// Export classes
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ImgKitRenderer, ImageLayer };
}
