/**
 * Global Type Definitions for Pegasus Electron App
 * This file contains TypeScript type definitions used throughout the application
 */

import { IpcRenderer } from 'electron';

// ============================================================================
// IPC Channel Names - Type-safe channel definitions
// ============================================================================

/**
 * IPC channel names for type safety
 * Used for communication between main and renderer processes
 */
export const IPCChannels = {
  // Panel operations
  RESIZE_IMG_REQ: 'resizeImgREQ',
  CROP_IMG_REQ: 'cropImgREQ',
  FILTER_IMG_REQ: 'filterImgREQ',
  ROTATE_IMG_REQ: 'rotateImgREQ',
  PAINT_IMG_REQ: 'paintImgREQ',
  IMAGE_ANALYSIS_IMG_REQ: 'image_analysisImgREQ',

  // Resize commands
  RESIZE_IMG_CMD: 'resizeImgCMD',
  RESIZE_PIXEL_IMG_CMD: 'resizePixelImgCMD',
  RESIZE_VALUE_SEND: 'resizeValueSEND',
  RESIZE_PIXEL_VALUE_SEND: 'resizePixelValueSEND',

  // Filter commands
  BLUR_IMG_CMD: 'blurImgCMD',
  BLUR_VALUE_SEND: 'blurValueSEND',
  SHARPEN_IMG_CMD: 'sharpenImgCMD',
  SHARPEN_VALUE_SEND: 'sharpenValueSEND',
  NORMALIZE_IMG_REQ: 'normalizeImgREQ',
  NORMALIZE_IMG_CMD: 'normalizeImgCMD',
  MEDIAN_IMG_CMD: 'medianImgCMD',
  MEDIAN_VALUE_SEND: 'medianValueSEND',
  DILATE_IMG_CMD: 'dilateImgCMD',
  DILATE_VALUE_SEND: 'dilateValueSEND',
  ERODE_IMG_CMD: 'erodeImgCMD',
  ERODE_VALUE_SEND: 'erodeValueSEND',
  BITWISE_IMG_CMD: 'bitwiseImgCMD',
  BITWISE_VALUE_SEND: 'bitwiseValueSEND',
  NEGATIVE_IMG_REQ: 'negativeImgREQ',
  NEGATIVE_IMG_CMD: 'negativeImgCMD',
  GRAYSCALE_IMG_REQ: 'grayScaleImgREQ',
  GRAYSCALE_IMG_CMD: 'grayScaleImgCMD',

  // Rotate commands
  ROTATE_IMG_CMD: 'rotateImgCMD',
  ROTATE_VALUE_SEND: 'rotateValueSEND',
  ROTATE_LEFT_IMG_REQ: 'rotateLeftImgREQ',
  ROTATE_LEFT_IMG_CMD: 'rotateLeftImgCMD',
  ROTATE_RIGHT_IMG_REQ: 'rotateRightImgREQ',
  ROTATE_RIGHT_IMG_CMD: 'rotateRightImgCMD',
  FLIP_IMG_REQ: 'flipImgREQ',
  FLIP_IMG_CMD: 'flipImgCMD',
  FLOP_IMG_REQ: 'flopImgREQ',
  FLOP_IMG_CMD: 'flopImgCMD',

  // Paint commands
  TINT_IMG_CMD: 'tintImgCMD',
  TINT_VALUE_SEND: 'tintValueSEND',
  COLORPICKER_IMG_REQ: 'colorpickerImgREQ',
  COLORPICKER_IMG_CMD: 'colorpickerImgCMD',
  COLORPICKER_VALUE_SEND: 'colorpickerValueSEND',
  COLORPICKER_VALUE_RECV: 'colorpickerValueRECV',
  WATERMARK_UPLOAD_REQ: 'watermarkUploadREQ',
  WATERMARK_UPLOAD_CMD: 'watermarkUploadCMD',
  WATERMARK_IMG_REQ: 'watermarkImgREQ',
  WATERMARK_IMG_CMD: 'watermarkImgCMD',
  DRAW_IMG_REQ: 'drawImgREQ',
  DRAW_IMG_CMD: 'drawImgCMD',
  PAD_IMG_REQ: 'padImgREQ',
  PAD_IMG_CMD: 'padImgCMD',

  // Crop commands
  RECT_CROP_IMG_REQ: 'rectCropImgREQ',
  CROP_IMG_CMD: 'cropImgCMD',

  // File operations
  OPEN_IMG_CMD: 'openImgCMD',
  SAVE_IMG_REQ: 'saveImgREQ',
  SAVE_IMG_CMD: 'saveImgCMD',
  SAVE_AS_IMG_CMD: 'saveAsImgCMD',
  SET_EXTENSION_CMD: 'setExtensionCMD',
  EXTENSION_VALUE_SEND: 'extensionValueSEND',
  DELETE_IMG_REQ: 'deleteImgREQ',
  DELETE_IMG_CMD: 'deleteImgCMD',

  // System commands
  SHOW_MENU_REQ: 'showMenuREQ',
  FULLSCREEN_REQ: 'FullScreenREQ',
  DEFAULT_SCREEN_REQ: 'DefaultScreenREQ',
  SHOW_NOTIFICATION_REQ: 'showNotificationREQ',
  SHOW_NOTIFICATION_CMD: 'showNotificationCMD',

  // Context menu
  SHOW_IMGKIT_CONTEXT_MENU: 'show-imgkit-context-menu',
  IMGKIT_CONTEXT_MENU_ACTION: 'imgkit-context-menu-action',

  // Layer events
  IMGKIT_LAYER_EVENT: 'imgkit-layer-event',

  // Clipboard
  COPY_IMAGE_TO_CLIPBOARD: 'copy-image-to-clipboard',
  PASTE_IMAGE_FROM_CLIPBOARD: 'paste-image-from-clipboard',
} as const;

export type IPCChannelName = typeof IPCChannels[keyof typeof IPCChannels];

// ============================================================================
// Image Type Definitions
// ============================================================================

/**
 * Image metadata information from Sharp
 */
export interface ImageInfo {
  format: string;
  width: number;
  height: number;
  channels: number;
  space?: string;
  depth?: string;
  density?: number;
  hasProfile?: boolean;
  hasAlpha?: boolean;
}

/**
 * Supported image formats
 */
export type ImageFormat = 
  | 'pix'
  | 'png'
  | 'svg'
  | 'jpg'
  | 'jpeg'
  | 'webp'
  | 'bmp'
  | 'gif'
  | 'ico'
  | 'tiff'
  | 'tif'
  | 'avif'
  | 'heif'
  | 'heic';

/**
 * Image processing options for Sharp pipeline
 */
export interface ImageProcessOptions {
  resize?: number;
  blur?: number;
  sharpen?: number;
  normalize?: boolean;
  median?: number;
  dilate?: number;
  erode?: number;
  extend?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    background: string | { r: number; g: number; b: number; alpha?: number };
  };
  flip?: boolean;
  flop?: boolean;
  rotate?: number;
  tint?: string | { r: number; g: number; b: number };
  negate?: boolean;
  grayscale?: boolean;
  bitwise?: string;
  composite?: Array<{
    input: Buffer;
    gravity?: string;
    blend?: string;
  }>;
  extract?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

/**
 * Color representation
 */
export interface Color {
  r: number;
  g: number;
  b: number;
  alpha?: number;
}

/**
 * Crop coordinates
 */
export interface CropCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// Layer and Canvas Types
// ============================================================================

/**
 * Image layer visibility state
 */
export type LayerVisibility = 'visible' | 'hidden';

/**
 * Layer event payload
 */
export interface LayerEventPayload {
  type: string;
  layerId: string;
  data?: any;
}

/**
 * Context menu options
 */
export interface ContextMenuOptions {
  hasUndo: boolean;
  hasRedo: boolean;
}

/**
 * Context menu action
 */
export type ContextMenuAction = 
  | 'copy'
  | 'paste'
  | 'delete'
  | 'undo'
  | 'redo'
  | 'watermark'
  | 'hide';

// ============================================================================
// Mode Types
// ============================================================================

/**
 * Image editing mode
 */
export type ImageMode = 
  | 'default'
  | 'crop'
  | 'draw'
  | 'colorpicker'
  | 'watermark';

/**
 * Draw mode state
 */
export interface DrawModeState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

// ============================================================================
// GIF Animation Types
// ============================================================================

/**
 * GIF frame information
 */
export interface GifFrame {
  buffer: Buffer;
  delay: number;
}

// ============================================================================
// Notification Types
// ============================================================================

/**
 * Notification identifiers
 */
export type NotificationId = 
  | 'imgkit-name-changed'
  | 'imgkit-color-copy'
  | 'imgkit-ico-error'
  | 'imgkit-open-error'
  | 'imgkit-error'
  | 'imgkit-convert'
  | 'imgkit-save'
  | 'imgkit-delete'
  | 'imgkit-img-copy'
  | 'imgkit-img-paste'
  | 'imgkit-copy';

// ============================================================================
// Window Type Extension (for context isolation scenarios)
// ============================================================================

/**
 * Extended window interface for Electron preload context
 * Note: This app uses contextIsolation: false, so this is for future reference
 */
declare global {
  interface Window {
    electron?: {
      ipcRenderer: {
        send: (channel: string, ...args: any[]) => void;
        on: (channel: string, func: (...args: any[]) => void) => void;
        invoke: (channel: string, ...args: any[]) => Promise<any>;
      };
    };
  }
}

// ============================================================================
// IPC Bridge Types
// ============================================================================

/**
 * IPC channel mapping for bulk registration
 */
export interface IPCChannelMapping {
  from: string;
  to: string;
  focus?: boolean;
}

// ============================================================================
// Menu Types
// ============================================================================

/**
 * Menu item configuration
 */
export interface MenuItemConfig {
  label: string;
  accelerator?: string;
  action?: string;
  enabled?: boolean;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
}
