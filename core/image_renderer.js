// @ts-nocheck
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
const { ImageMode } = require("../features/image_mode.js");
const LAYER_EVENT_CHANNEL = "imgkit-layer-event";
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
        this.selectedLayers = new Set(); // Set of selected layer indices for multi-select
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
            this.setupScrollEvents();
            this.setupGlobalDragPrevention();
            this.setupGlobalMagnifyShortcut(); // Setup Alt + M globally
            this.setupLayerEventBridge();
        }
    }
    // --------------------------------------------------------------------------
    // SCROLL MANAGEMENT
    // --------------------------------------------------------------------------
    /**
     * Setup scroll button event listeners
     * Left/Right buttons scroll the container horizontally
     */
    setupScrollEvents() {
        // Scroll left button - scroll to the very beginning
        this.scrollLeftBtn.addEventListener("click", () => {
            this.scrollContainer.scrollTo({ left: 0, behavior: "smooth" });
        });
        // Scroll right button - scroll to the very end
        this.scrollRightBtn.addEventListener("click", () => {
            this.scrollContainer.scrollTo({
                left: this.scrollContainer.scrollWidth,
                behavior: "smooth",
            });
        });
        // Update UI when user scrolls manually
        this.scrollContainer.addEventListener("scroll", () => this.updateScrollUI());
    }
    /**
     * Prevent browser's default drag behavior globally
     * But allow panel swapping
     */
    setupGlobalDragPrevention() {
        // Prevent default drag behavior on entire document, except for drop
        ["dragover", "dragenter", "dragleave"].forEach((eventName) => {
            document.addEventListener(eventName, (e) => {
                // Allow drag events on panels for swapping
                if (e.target.closest && e.target.closest(".imgPanel")) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });
        // Handle drop separately to distinguish file drops from panel swaps
        document.addEventListener("drop", (e) => {
            // Only prevent if it's a file drop (not a panel swap)
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, false);
        document.addEventListener("dragover", (e) => {
            // Set drop effect for file drops
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                e.dataTransfer.dropEffect = "copy";
            }
        }, false);
    }
    /**
     * Setup global magnifying glass shortcut (Alt + M)
     * This works regardless of which layer is focused
     */
    setupGlobalMagnifyShortcut() {
        let isAltPressed = false;
        let isMPressed = false;
        // Track Alt key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Alt") {
                isAltPressed = true;
            }
            if (e.key.toLowerCase() === "m") {
                isMPressed = true;
            }
            // Activate magnifying glass when both Alt and M are pressed
            if (isAltPressed && isMPressed && this.globalMode !== ImageMode.MAGNIFY) {
                e.preventDefault();
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
            if (e.key.toLowerCase() === "m") {
                isMPressed = false;
            }
            // Deactivate magnifying glass when either Alt or M is released
            if ((!isAltPressed || !isMPressed) &&
                this.globalMode === ImageMode.MAGNIFY) {
                this.globalMode = ImageMode.NORMAL;
                // Disable magnify on all layers and clear overlays
                this.imageLayerQueue.forEach((layer) => {
                    layer.modeManager.reset();
                    if (layer.overlayCanvas) {
                        layer.overlayCtx.clearRect(0, 0, layer.overlayCanvas.width, layer.overlayCanvas.height);
                    }
                    if (layer.magnifyAnimationId) {
                        cancelAnimationFrame(layer.magnifyAnimationId);
                        layer.magnifyAnimationId = null;
                    }
                });
            }
        });
    }
    setupLayerEventBridge() {
        ipcRenderer.on(LAYER_EVENT_CHANNEL, async (event, payload) => {
            await this.handleLayerEvent(payload);
        });
    }
    async handleLayerEvent(payload) {
        if (!payload || !payload.type)
            return;
        switch (payload.type) {
            case "select":
                this.selectLayerById(payload.layerId, payload.ctrlKey);
                break;
            case "delete":
                this.selectLayerById(payload.layerId);
                this.deleteImage();
                break;
            case "copy":
                this.selectLayerById(payload.layerId);
                await this.copyImage();
                break;
            case "paste":
                this.selectLayerById(payload.layerId);
                await this.pasteImage();
                break;
            case "swap":
                this.swapLayersByIds(payload.fromLayerId, payload.toLayerId);
                break;
            case "drop":
                await this.handleDropFiles(payload.layerId, payload.files || []);
                break;
            case "preview-updated":
                this.updateScrollUI();
                this.scrollToEnd();
                break;
            case "navigate":
                this.navigateKeyboard(payload.direction, payload.ctrlKey);
                break;
        }
    }
    selectLayerById(layerId, ctrlKey = false) {
        const index = this.getLayerIndexById(layerId);
        if (index !== -1) {
            this.setCurrentLayer(index, ctrlKey);
        }
    }
    getLayerIndexById(layerId) {
        return this.imageLayerQueue.findIndex((layer) => layer.id === layerId);
    }
    getLayerById(layerId) {
        const index = this.getLayerIndexById(layerId);
        return index === -1 ? null : this.imageLayerQueue[index];
    }
    swapLayersByIds(fromLayerId, toLayerId) {
        const fromIndex = this.getLayerIndexById(fromLayerId);
        const toIndex = this.getLayerIndexById(toLayerId);
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex)
            return;
        this.swapLayers(fromIndex, toIndex);
    }
    async handleDropFiles(targetLayerId, files) {
        if (!files || files.length === 0)
            return;
        let dropHandled = false;
        for (let i = 0; i < files.length; i++) {
            const entry = files[i];
            if (!entry)
                continue;
            const targetLayer = i === 0
                ? this.getLayerById(targetLayerId)
                : this.createImageLayer(false);
            if (!targetLayer)
                continue;
            let success = false;
            if (entry.path) {
                success = await targetLayer.openImage(entry.path);
            }
            else if (entry.buffer) {
                const buffer = Buffer.isBuffer(entry.buffer)
                    ? entry.buffer
                    : Buffer.from(entry.buffer);
                success = await targetLayer.openImageBuffer(buffer, entry.name);
            }
            if (success) {
                targetLayer.panel.draggable = true;
                this.currentIndex = this.imageLayerQueue.indexOf(targetLayer);
                dropHandled = true;
            }
        }
        if (dropHandled && this.currentIndex === this.imageLayerQueue.length - 1) {
            this.createDefaultImage();
        }
    }
    scrollToEnd() {
        if (this.scrollContainer) {
            this.scrollContainer.scrollLeft = this.scrollContainer.scrollWidth;
        }
    }
    navigateKeyboard(direction, ctrlKey) {
        if (!direction)
            return;
        let newIndex = this.currentIndex;
        if (direction === "left") {
            if (ctrlKey) {
                newIndex = 0;
            }
            else if (newIndex > 0) {
                newIndex -= 1;
            }
        }
        else if (direction === "right") {
            if (ctrlKey) {
                newIndex = this.imageLayerQueue.length - 1;
            }
            else if (newIndex < this.imageLayerQueue.length - 1) {
                newIndex += 1;
            }
        }
        if (newIndex !== this.currentIndex) {
            this.setCurrentLayer(newIndex);
            const layer = this.imageLayerQueue[newIndex];
            if (layer && layer.panel) {
                layer.panel.focus();
            }
        }
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
                }
                catch (e) {
                    // Panel not in body, which is expected in most cases
                    console.error("Failed to remove panel from body:", e.message);
                }
                // Add to scroll container at correct position
                if (idx >= this.scrollContainer.children.length) {
                    this.scrollContainer.appendChild(layer.panel);
                }
                else {
                    this.scrollContainer.insertBefore(layer.panel, this.scrollContainer.children[idx]);
                }
            }
            // If panel is in container but wrong position, move it
            else if (this.scrollContainer.children[idx] !== layer.panel) {
                this.scrollContainer.insertBefore(layer.panel, this.scrollContainer.children[idx]);
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
        const layer = new ImageLayer(isDefault);
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
        if (fromIndex < 0 ||
            fromIndex >= this.imageLayerQueue.length - 1 ||
            toIndex < 0 ||
            toIndex >= this.imageLayerQueue.length - 1) {
            return;
        }
        // Swap in array
        const temp = this.imageLayerQueue[fromIndex];
        this.imageLayerQueue[fromIndex] = this.imageLayerQueue[toIndex];
        this.imageLayerQueue[toIndex] = temp;
        // Update current index if needed
        if (this.currentIndex === fromIndex) {
            this.currentIndex = toIndex;
        }
        else if (this.currentIndex === toIndex) {
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
        const layer = this.createImageLayer(true);
        layer.openImage("./assets/addImage.png");
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
     * @param {boolean} ctrlKey - Whether Ctrl key is pressed for multi-select
     */
    setCurrentLayer(index, ctrlKey = false) {
        if (index >= 0 && index < this.imageLayerQueue.length) {
            if (ctrlKey) {
                // Multi-select mode: toggle selection
                if (this.selectedLayers.has(index)) {
                    this.selectedLayers.delete(index);
                }
                else {
                    this.selectedLayers.add(index);
                }
                // Update current index to the last clicked
                this.currentIndex = index;
            }
            else {
                // Single select mode: clear other selections
                this.selectedLayers.clear();
                this.selectedLayers.add(index);
                this.currentIndex = index;
            }
            // Update visual focus/selection for all layers
            this.imageLayerQueue.forEach((layer, idx) => {
                const isSelected = this.selectedLayers.has(idx);
                layer.setSelected(isSelected);
            });
        }
    }
    /**
     * Get all selected layer indices
     * @returns {number[]} Array of selected indices
     */
    getSelectedIndices() {
        return Array.from(this.selectedLayers);
    }
    selectAll() {
        this.selectedLayers.clear();
        for (let i = 0; i < this.imageLayerQueue.length; i++) {
            this.selectedLayers.add(i);
        }
        // Update visual focus/selection for all layers
        this.imageLayerQueue.forEach((layer, idx) => {
            layer.setSelected(true);
        });
    }
    /**
     * Get all selected layers
     * @returns {ImageLayer[]} Array of selected layers (filters out invalid indices)
     */
    getSelectedLayers() {
        return Array.from(this.selectedLayers)
            .filter((idx) => idx >= 0 && idx < this.imageLayerQueue.length)
            .map((idx) => this.imageLayerQueue[idx]);
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
                ipcRenderer.send("showNotificationREQ", "imgkit-img-copy");
            }
            catch (error) {
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
        if (!current)
            return;
        try {
            // Try to get image from native clipboard first
            const imageBuffer = await ipcRenderer.invoke("paste-image-from-clipboard");
            if (imageBuffer) {
                // Got image from clipboard
                const filename = "pasted_image.png";
                await current.openImageBuffer(Buffer.from(imageBuffer), filename);
                ipcRenderer.send("showNotificationREQ", "imgkit-img-paste");
                if (this.currentIndex === this.imageLayerQueue.length - 1) {
                    this.createDefaultImage();
                }
                return;
            }
        }
        catch (error) {
            console.error("Failed to paste from clipboard:", error);
        }
        // Fallback: paste from internally copied layer
        if (this.copiedLayer) {
            const filename = `${this.copiedLayer.filename}_copy.${this.copiedLayer.extension}`;
            await current.openImageBuffer(this.copiedLayer.buffer, filename);
            ipcRenderer.send("showNotificationREQ", "imgkit-img-paste");
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
        if (!current || current.isDefault)
            return;
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
            ipcRenderer.send("showNotificationREQ", "imgkit-delete");
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
}
Parameter.num = 0;
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
//# sourceMappingURL=image_renderer.js.map