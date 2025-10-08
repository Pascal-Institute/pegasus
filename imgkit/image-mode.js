/**
 * ImageModes - Unified mode system for image layer interactions
 * 
 * Replaces individual flags (drawFlag, dragFlag, magnifyFlag) with a single mode state.
 * This makes the code more maintainable and prevents conflicting states.
 */

/**
 * Available interaction modes for image layers
 * @enum {string}
 */
const ImageMode = {
  /** Default mode - no special interaction */
  NORMAL: 'normal',
  
  /** Drawing/painting mode - user is drawing on canvas */
  DRAWING: 'drawing',
  
  /** Cropping mode - user is selecting a crop area (crosshair cursor) */
  CROPPING: 'cropping',
  
  /** Magnifying glass mode - zoomed preview follows mouse (Alt + A) */
  MAGNIFY: 'magnify',
  
  /** Drag mode - user is dragging to select crop area */
  DRAG_CROP: 'drag_crop'
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
   * Check if in drag crop mode
   * @returns {boolean} True if in drag crop mode
   */
  isDraggingCrop() {
    return this.currentMode === ImageMode.DRAG_CROP;
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
      case ImageMode.DRAG_CROP:
        return 'crosshair';
      case ImageMode.MAGNIFY:
        return 'zoom-in';
      case ImageMode.DRAWING:
        return 'crosshair'; // or custom drawing cursor
      default:
        return 'default';
    }
  }
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = {
  ImageMode,
  ModeManager
};
