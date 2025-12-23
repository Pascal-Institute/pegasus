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
export declare const IPCChannels: {
  readonly RESIZE_IMG_REQ: 'resizeImgREQ';
  readonly CROP_IMG_REQ: 'cropImgREQ';
  readonly FILTER_IMG_REQ: 'filterImgREQ';
  readonly ROTATE_IMG_REQ: 'rotateImgREQ';
  readonly PAINT_IMG_REQ: 'paintImgREQ';
  readonly IMAGE_ANALYSIS_IMG_REQ: 'image_analysisImgREQ';
  readonly RESIZE_IMG_CMD: 'resizeImgCMD';
  readonly RESIZE_PIXEL_IMG_CMD: 'resizePixelImgCMD';
  readonly RESIZE_VALUE_SEND: 'resizeValueSEND';
  readonly RESIZE_PIXEL_VALUE_SEND: 'resizePixelValueSEND';
  readonly BLUR_IMG_CMD: 'blurImgCMD';
  readonly BLUR_VALUE_SEND: 'blurValueSEND';
  readonly SHARPEN_IMG_CMD: 'sharpenImgCMD';
  readonly SHARPEN_VALUE_SEND: 'sharpenValueSEND';
  readonly NORMALIZE_IMG_REQ: 'normalizeImgREQ';
  readonly NORMALIZE_IMG_CMD: 'normalizeImgCMD';
  readonly MEDIAN_IMG_CMD: 'medianImgCMD';
  readonly MEDIAN_VALUE_SEND: 'medianValueSEND';
  readonly DILATE_IMG_CMD: 'dilateImgCMD';
  readonly DILATE_VALUE_SEND: 'dilateValueSEND';
  readonly ERODE_IMG_CMD: 'erodeImgCMD';
  readonly ERODE_VALUE_SEND: 'erodeValueSEND';
  readonly BITWISE_IMG_CMD: 'bitwiseImgCMD';
  readonly BITWISE_VALUE_SEND: 'bitwiseValueSEND';
  readonly NEGATIVE_IMG_REQ: 'negativeImgREQ';
  readonly NEGATIVE_IMG_CMD: 'negativeImgCMD';
  readonly GRAYSCALE_IMG_REQ: 'grayScaleImgREQ';
  readonly GRAYSCALE_IMG_CMD: 'grayScaleImgCMD';
  readonly ROTATE_IMG_CMD: 'rotateImgCMD';
  readonly ROTATE_VALUE_SEND: 'rotateValueSEND';
  readonly ROTATE_LEFT_IMG_REQ: 'rotateLeftImgREQ';
  readonly ROTATE_LEFT_IMG_CMD: 'rotateLeftImgCMD';
  readonly ROTATE_RIGHT_IMG_REQ: 'rotateRightImgREQ';
  readonly ROTATE_RIGHT_IMG_CMD: 'rotateRightImgCMD';
  readonly FLIP_IMG_REQ: 'flipImgREQ';
  readonly FLIP_IMG_CMD: 'flipImgCMD';
  readonly FLOP_IMG_REQ: 'flopImgREQ';
  readonly FLOP_IMG_CMD: 'flopImgCMD';
  readonly TINT_IMG_CMD: 'tintImgCMD';
  readonly TINT_VALUE_SEND: 'tintValueSEND';
  readonly COLORPICKER_IMG_REQ: 'colorpickerImgREQ';
  readonly COLORPICKER_IMG_CMD: 'colorpickerImgCMD';
  readonly COLORPICKER_VALUE_SEND: 'colorpickerValueSEND';
  readonly COLORPICKER_VALUE_RECV: 'colorpickerValueRECV';
  readonly WATERMARK_UPLOAD_REQ: 'watermarkUploadREQ';
  readonly WATERMARK_UPLOAD_CMD: 'watermarkUploadCMD';
  readonly WATERMARK_IMG_REQ: 'watermarkImgREQ';
  readonly WATERMARK_IMG_CMD: 'watermarkImgCMD';
  readonly DRAW_IMG_REQ: 'drawImgREQ';
  readonly DRAW_IMG_CMD: 'drawImgCMD';
  readonly PAD_IMG_REQ: 'padImgREQ';
  readonly PAD_IMG_CMD: 'padImgCMD';
  readonly RECT_CROP_IMG_REQ: 'rectCropImgREQ';
  readonly CROP_IMG_CMD: 'cropImgCMD';
  readonly OPEN_IMG_CMD: 'openImgCMD';
  readonly SAVE_IMG_REQ: 'saveImgREQ';
  readonly SAVE_IMG_CMD: 'saveImgCMD';
  readonly SAVE_AS_IMG_CMD: 'saveAsImgCMD';
  readonly SET_EXTENSION_CMD: 'setExtensionCMD';
  readonly EXTENSION_VALUE_SEND: 'extensionValueSEND';
  readonly DELETE_IMG_REQ: 'deleteImgREQ';
  readonly DELETE_IMG_CMD: 'deleteImgCMD';
  readonly SHOW_MENU_REQ: 'showMenuREQ';
  readonly FULLSCREEN_REQ: 'FullScreenREQ';
  readonly DEFAULT_SCREEN_REQ: 'DefaultScreenREQ';
  readonly SHOW_NOTIFICATION_REQ: 'showNotificationREQ';
  readonly SHOW_NOTIFICATION_CMD: 'showNotificationCMD';
  readonly SHOW_IMGKIT_CONTEXT_MENU: 'show-imgkit-context-menu';
  readonly IMGKIT_CONTEXT_MENU_ACTION: 'imgkit-context-menu-action';
  readonly IMGKIT_LAYER_EVENT: 'imgkit-layer-event';
  readonly COPY_IMAGE_TO_CLIPBOARD: 'copy-image-to-clipboard';
  readonly PASTE_IMAGE_FROM_CLIPBOARD: 'paste-image-from-clipboard';
};

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
  label?: string;
  accelerator?: string;
  action?: string;
  enabled?: boolean;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
}
