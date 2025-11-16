/**
 * ImageModes - Unified mode system for image layer interactions
 *
 * Replaces individual flags (drawFlag, dragFlag, magnifyFlag) with a single mode state.
 * This makes the code more maintainable and prevents conflicting states.
 */

const path = require("path");

/**
 * Available interaction modes for image layers
 * @enum {string}
 */
const ImageMode = {
  /** Default mode - no special interaction */
  NORMAL: "normal",

  /** Drawing/painting mode - user is drawing on canvas */
  DRAWING: "drawing",

  /** Cropping mode - user is selecting a crop area (crosshair cursor) */
  CROPPING: "cropping",

  /** Magnifying glass mode - zoomed preview follows mouse (Alt + M) */
  MAGNIFY: "magnify",

  /** Color picker mode - user is picking a color from the image */
  COLORPICKER: "colorpicker",
};

/**
 * Mode manager utility class
 * Provides helper methods for mode management
 */
class ModeManager {
  constructor() {
    this.currentMode = ImageMode.NORMAL;
    this.previousMode = ImageMode.NORMAL;
  }

  /**
   * Set the current mode
   * @param {ImageMode} mode - The mode to set
   */
  setMode(mode) {
    if (!Object.values(ImageMode).includes(mode)) {
      console.warn(`Invalid mode: ${mode}. Using NORMAL mode.`);
      mode = ImageMode.NORMAL;
    }
    this.previousMode = this.currentMode;
    this.currentMode = mode;
  }

  /**
   * Get the current mode
   * @returns {ImageMode} Current mode
   */
  getMode() {
    return this.currentMode;
  }

  /**
   * Check if in a specific mode
   * @param {ImageMode} mode - Mode to check
   * @returns {boolean} True if in the specified mode
   */
  isMode(mode) {
    return this.currentMode === mode;
  }

  /**
   * Check if in normal mode
   * @returns {boolean} True if in normal mode
   */
  isNormal() {
    return this.currentMode === ImageMode.NORMAL;
  }

  /**
   * Check if in drawing mode
   * @returns {boolean} True if in drawing mode
   */
  isDrawing() {
    return this.currentMode === ImageMode.DRAWING;
  }

  /**
   * Check if in cropping mode
   * @returns {boolean} True if in cropping mode
   */
  isCropping() {
    return this.currentMode === ImageMode.CROPPING;
  }

  /**
   * Check if in magnify mode
   * @returns {boolean} True if in magnify mode
   */
  isMagnifying() {
    return this.currentMode === ImageMode.MAGNIFY;
  }

  /**
   * Check if in color picker mode
   * @returns {boolean} True if in color picker mode
   */
  isColorPicker() {
    return this.currentMode === ImageMode.COLORPICKER;
  }

  /**
   * Reset to normal mode
   */
  reset() {
    this.setMode(ImageMode.NORMAL);
  }

  /**
   * Restore previous mode
   */
  restorePrevious() {
    this.setMode(this.previousMode);
  }

  /**
   * Get cursor style for current mode
   * @returns {string} CSS cursor value
   */
  getCursor() {
    switch (this.currentMode) {
      case ImageMode.CROPPING:
        return "crosshair";
      case ImageMode.MAGNIFY:
        return "zoom-in";
      case ImageMode.DRAWING:
        var cursorPath = path
          .join(__dirname, "../assets/pencil.png")
          .replace(/\\/g, "/");
        return `url('file://${cursorPath}') 0 32, crosshair`;
      case ImageMode.COLORPICKER:
        var cursorPath = path
          .join(__dirname, "../assets/spoid.png")
          .replace(/\\/g, "/");
        return `url('file://${cursorPath}') 0 24, crosshair`;
      default:
        return "default";
    }
  }
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = {
  ImageMode,
  ModeManager,
};
