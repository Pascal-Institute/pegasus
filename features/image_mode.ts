/**
 * ImageModes - Unified mode system for image layer interactions
 *
 * Replaces individual flags (drawFlag, dragFlag, magnifyFlag) with a single mode state.
 * This makes the code more maintainable and prevents conflicting states.
 */

import * as path from "path";

/**
 * Available interaction modes for image layers
 */
export enum ImageMode {
  /** Default mode - no special interaction */
  NORMAL = "normal",

  /** Drawing/painting mode - user is drawing on canvas */
  DRAWING = "drawing",

  /** Cropping mode - user is selecting a crop area (crosshair cursor) */
  CROPPING = "cropping",

  /** Magnifying glass mode - zoomed preview follows mouse (Alt + M) */
  MAGNIFY = "magnify",

  /** Color picker mode - user is picking a color from the image */
  COLORPICKER = "colorpicker",
}

/**
 * Mode manager utility class
 * Provides helper methods for mode management
 */
export class ModeManager {
  private currentMode: ImageMode = ImageMode.NORMAL;
  private previousMode: ImageMode = ImageMode.NORMAL;

  /**
   * Set the current mode
   * @param mode - The mode to set
   */
  setMode(mode: ImageMode): void {
    if (!Object.values(ImageMode).includes(mode)) {
      console.warn(`Invalid mode: ${mode}. Using NORMAL mode.`);
      mode = ImageMode.NORMAL;
    }
    this.previousMode = this.currentMode;
    this.currentMode = mode;
  }

  /**
   * Get the current mode
   * @returns Current mode
   */
  getMode(): ImageMode {
    return this.currentMode;
  }

  /**
   * Check if in a specific mode
   * @param mode - Mode to check
   * @returns True if in the specified mode
   */
  isMode(mode: ImageMode): boolean {
    return this.currentMode === mode;
  }

  /**
   * Check if in normal mode
   * @returns True if in normal mode
   */
  isNormal(): boolean {
    return this.currentMode === ImageMode.NORMAL;
  }

  /**
   * Check if in drawing mode
   * @returns True if in drawing mode
   */
  isDrawing(): boolean {
    return this.currentMode === ImageMode.DRAWING;
  }

  /**
   * Check if in cropping mode
   * @returns True if in cropping mode
   */
  isCropping(): boolean {
    return this.currentMode === ImageMode.CROPPING;
  }

  /**
   * Check if in magnify mode
   * @returns True if in magnify mode
   */
  isMagnifying(): boolean {
    return this.currentMode === ImageMode.MAGNIFY;
  }

  /**
   * Check if in color picker mode
   * @returns True if in color picker mode
   */
  isColorPicker(): boolean {
    return this.currentMode === ImageMode.COLORPICKER;
  }

  /**
   * Reset to normal mode
   */
  reset(): void {
    this.setMode(ImageMode.NORMAL);
  }

  /**
   * Restore previous mode
   */
  restorePrevious(): void {
    this.setMode(this.previousMode);
  }

  /**
   * Get cursor style for current mode
   * @returns CSS cursor value
   */
  getCursor(): string {
    switch (this.currentMode) {
      case ImageMode.CROPPING:
        return "crosshair";
      case ImageMode.MAGNIFY:
        return "zoom-in";
      case ImageMode.DRAWING:
        const cursorPathDraw = path
          .join(__dirname, "../../assets/pencil.png")
          .replace(/\\/g, "/");
        return `url('file://${cursorPathDraw}') 0 32, crosshair`;
      case ImageMode.COLORPICKER:
        const cursorPathPicker = path
          .join(__dirname, "../../assets/spoid.png")
          .replace(/\\/g, "/");
        return `url('file://${cursorPathPicker}') 0 24, crosshair`;
      default:
        return "default";
    }
  }
}

