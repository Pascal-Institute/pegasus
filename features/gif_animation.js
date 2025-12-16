"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GifAnimation = void 0;
const image_loader_1 = require("../processing/image_loader");
/**
 * GIF Animation Module
 * Handles all GIF animation playback functionality independently
 *
 * Features:
 * - Play/Pause/Stop controls
 * - Frame-by-frame playback
 * - Frame counter display
 * - Auto-play support
 */
class GifAnimation {
    /**
     * @param layer - Reference to parent ImageLayer instance
     */
    constructor(layer) {
        this.layer = layer; // Parent layer reference
        // Animation state
        this.metadata = null; // GIF metadata (pages, delay, loop)
        this.originalBuffer = null; // Original GIF buffer for frame extraction
        this.currentFrame = 0; // Current frame index
        this.isPlaying = false; // Is animation playing?
        this.animationId = null; // Animation timer ID
        // UI elements (created lazily)
        this.controlsContainer = null;
        this.playPauseBtn = null;
        this.stopBtn = null;
        this.frameCounter = null;
    }
    /**
     * Initialize GIF controls UI (lazy initialization)
     */
    initControls() {
        if (this.controlsContainer)
            return; // Already initialized
        // Create container for GIF controls
        this.controlsContainer = document.createElement("div");
        this.controlsContainer.className = "gif-controls";
        this.controlsContainer.style.display = "none"; // Hidden by default
        this.controlsContainer.style.marginTop = "5px";
        this.controlsContainer.style.textAlign = "center";
        // Play/Pause button
        this.playPauseBtn = document.createElement("button");
        this.playPauseBtn.textContent = "▶";
        this.playPauseBtn.title = "Play/Pause";
        this.playPauseBtn.style.margin = "0 2px";
        this.playPauseBtn.style.padding = "5px 10px";
        this.playPauseBtn.style.cursor = "pointer";
        this.playPauseBtn.addEventListener("click", () => this.toggle());
        // Stop button
        this.stopBtn = document.createElement("button");
        this.stopBtn.textContent = "■";
        this.stopBtn.title = "Stop";
        this.stopBtn.style.margin = "0 2px";
        this.stopBtn.style.padding = "5px 10px";
        this.stopBtn.style.cursor = "pointer";
        this.stopBtn.addEventListener("click", () => this.stop());
        // Frame counter
        this.frameCounter = document.createElement("span");
        this.frameCounter.style.margin = "0 5px";
        this.frameCounter.style.fontSize = "12px";
        this.frameCounter.textContent = "0/0";
        // Add buttons to container
        this.controlsContainer.appendChild(this.playPauseBtn);
        this.controlsContainer.appendChild(this.stopBtn);
        this.controlsContainer.appendChild(this.frameCounter);
        // Add controls to panel (after extension combo)
        if (this.layer.extensionCombo && this.layer.extensionCombo.parentNode) {
            this.layer.extensionCombo.parentNode.insertBefore(this.controlsContainer, this.layer.extensionCombo.nextSibling);
        }
    }
    /**
     * Load GIF animation data
     * @param buffer - Original GIF buffer
     * @param metadata - GIF metadata (pages, delay, loop)
     */
    load(buffer, metadata) {
        this.originalBuffer = buffer;
        this.metadata = metadata;
        this.currentFrame = 0;
        this.isPlaying = false;
        // Initialize controls if not already done
        this.initControls();
        // Show controls and update UI
        if (this.isAnimated()) {
            this.controlsContainer.style.display = "block";
            this.updateFrameCounter();
            // Auto-play animated GIFs
            this.play();
        }
    }
    /**
     * Check if current GIF is animated
     * @returns true if animated
     */
    isAnimated() {
        return this.metadata !== null && this.metadata.pages > 1;
    }
    /**
     * Clear GIF animation data
     */
    clear() {
        this.stop();
        this.metadata = null;
        this.originalBuffer = null;
        this.currentFrame = 0;
        if (this.controlsContainer) {
            this.controlsContainer.style.display = "none";
        }
    }
    /**
     * Toggle play/pause
     */
    toggle() {
        if (this.isPlaying) {
            this.pause();
        }
        else {
            this.play();
        }
    }
    /**
     * Play GIF animation
     */
    play() {
        if (!this.isAnimated() || this.isPlaying)
            return;
        this.isPlaying = true;
        if (this.playPauseBtn) {
            this.playPauseBtn.textContent = "⏸";
            this.playPauseBtn.title = "Pause";
        }
        this.scheduleNextFrame();
    }
    /**
     * Pause GIF animation
     */
    pause() {
        if (!this.isPlaying)
            return;
        this.isPlaying = false;
        if (this.playPauseBtn) {
            this.playPauseBtn.textContent = "▶";
            this.playPauseBtn.title = "Play";
        }
        if (this.animationId !== null) {
            clearTimeout(this.animationId);
            this.animationId = null;
        }
    }
    /**
     * Stop GIF animation and reset to first frame
     */
    stop() {
        this.pause();
        this.currentFrame = 0;
        this.updateFrameCounter();
        if (this.isAnimated()) {
            this.displayFrame(0);
        }
    }
    /**
     * Schedule the next frame to be displayed
     */
    scheduleNextFrame() {
        if (!this.isPlaying || !this.isAnimated())
            return;
        const delay = this.metadata.delay[this.currentFrame] || 100;
        this.animationId = setTimeout(async () => {
            // Move to next frame
            this.currentFrame = (this.currentFrame + 1) % this.metadata.pages;
            this.updateFrameCounter();
            // Display the frame
            await this.displayFrame(this.currentFrame);
            // Schedule next frame
            this.scheduleNextFrame();
        }, delay);
    }
    /**
     * Display a specific GIF frame
     * @param frameIndex - Frame index to display
     */
    async displayFrame(frameIndex) {
        if (!this.isAnimated() || !this.originalBuffer)
            return;
        try {
            const frameResult = await image_loader_1.ImageLoader.extractGifFrame(this.originalBuffer, frameIndex);
            // Draw the frame to canvas
            const image = new Image();
            image.src = `data:image/png;base64,${frameResult.buffer.toString("base64")}`;
            image.onload = () => {
                if (this.layer.ctx && this.layer.canvas) {
                    this.layer.ctx.clearRect(0, 0, this.layer.canvas.width, this.layer.canvas.height);
                    this.layer.ctx.drawImage(image, 0, 0);
                }
            };
        }
        catch (error) {
            console.error(`Error displaying GIF frame ${frameIndex}:`, error);
        }
    }
    /**
     * Update frame counter display
     */
    updateFrameCounter() {
        if (this.isAnimated() && this.frameCounter) {
            this.frameCounter.textContent = `${this.currentFrame + 1}/${this.metadata.pages}`;
        }
    }
    /**
     * Destroy and cleanup
     */
    destroy() {
        this.stop();
        if (this.controlsContainer && this.controlsContainer.parentNode) {
            this.controlsContainer.parentNode.removeChild(this.controlsContainer);
        }
        this.controlsContainer = null;
        this.playPauseBtn = null;
        this.stopBtn = null;
        this.frameCounter = null;
        this.metadata = null;
        this.originalBuffer = null;
    }
}
exports.GifAnimation = GifAnimation;
//# sourceMappingURL=gif_animation.js.map