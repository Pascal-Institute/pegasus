/**
 * IPC Channel Type Definitions
 * 
 * Centralized type definitions for IPC communication between main and renderer processes.
 * This provides type safety for IPC channels and their payloads.
 */

// ============================================================================
// IPC CHANNEL NAMES
// ============================================================================

/**
 * IPC channels for panel loading requests
 */
export const PANEL_CHANNELS = {
  RESIZE: 'resizeImgREQ',
  CROP: 'cropImgREQ',
  FILTER: 'filterImgREQ',
  ROTATE: 'rotateImgREQ',
  PAINT: 'paintImgREQ',
  IMAGE_ANALYSIS: 'image_analysisImgREQ',
} as const;

/**
 * IPC channels for resize operations
 */
export const RESIZE_CHANNELS = {
  VALUE_SEND: 'resizeValueSEND',
  VALUE_CMD: 'resizeImgCMD',
  PIXEL_VALUE_SEND: 'resizePixelValueSEND',
  PIXEL_VALUE_CMD: 'resizePixelImgCMD',
} as const;

/**
 * IPC channels for filter operations
 */
export const FILTER_CHANNELS = {
  BLUR_SEND: 'blurValueSEND',
  BLUR_CMD: 'blurImgCMD',
  SHARPEN_SEND: 'sharpenValueSEND',
  SHARPEN_CMD: 'sharpenImgCMD',
  NORMALIZE_REQ: 'normalizeImgREQ',
  NORMALIZE_CMD: 'normalizeImgCMD',
  MEDIAN_SEND: 'medianValueSEND',
  MEDIAN_CMD: 'medianImgCMD',
  DILATE_SEND: 'dilateValueSEND',
  DILATE_CMD: 'dilateImgCMD',
  ERODE_SEND: 'erodeValueSEND',
  ERODE_CMD: 'erodeImgCMD',
  BITWISE_SEND: 'bitwiseValueSEND',
  BITWISE_CMD: 'bitwiseImgCMD',
  NEGATIVE_REQ: 'negativeImgREQ',
  NEGATIVE_CMD: 'negativeImgCMD',
  GRAYSCALE_REQ: 'grayScaleImgREQ',
  GRAYSCALE_CMD: 'grayScaleImgCMD',
} as const;

/**
 * IPC channels for rotate operations
 */
export const ROTATE_CHANNELS = {
  VALUE_SEND: 'rotateValueSEND',
  VALUE_CMD: 'rotateImgCMD',
  LEFT_REQ: 'rotateLeftImgREQ',
  LEFT_CMD: 'rotateLeftImgCMD',
  RIGHT_REQ: 'rotateRightImgREQ',
  RIGHT_CMD: 'rotateRightImgCMD',
  FLIP_REQ: 'flipImgREQ',
  FLIP_CMD: 'flipImgCMD',
  FLOP_REQ: 'flopImgREQ',
  FLOP_CMD: 'flopImgCMD',
} as const;

/**
 * IPC channels for paint operations
 */
export const PAINT_CHANNELS = {
  TINT_SEND: 'tintValueSEND',
  TINT_CMD: 'tintImgCMD',
  COLORPICKER_REQ: 'colorpickerImgREQ',
  COLORPICKER_CMD: 'colorpickerImgCMD',
  COLORPICKER_VALUE_SEND: 'colorpickerValueSEND',
  COLORPICKER_VALUE_RECV: 'colorpickerValueRECV',
  WATERMARK_UPLOAD_REQ: 'watermarkUploadREQ',
  WATERMARK_UPLOAD_CMD: 'watermarkUploadCMD',
  WATERMARK_REQ: 'watermarkImgREQ',
  WATERMARK_CMD: 'watermarkImgCMD',
  DRAW_REQ: 'drawImgREQ',
  DRAW_CMD: 'drawImgCMD',
  PAD_REQ: 'padImgREQ',
  PAD_CMD: 'padImgCMD',
} as const;

/**
 * IPC channels for crop operations
 */
export const CROP_CHANNELS = {
  RECT_CROP_REQ: 'rectCropImgREQ',
  CROP_CMD: 'cropImgCMD',
} as const;

/**
 * IPC channels for file operations
 */
export const FILE_CHANNELS = {
  OPEN_CMD: 'openImgCMD',
  SAVE_CMD: 'saveImgCMD',
  SAVE_AS_CMD: 'saveAsImgCMD',
  SAVE_REQ: 'saveImgREQ',
  DELETE_REQ: 'deleteImgREQ',
  DELETE_CMD: 'deleteImgCMD',
  SET_EXTENSION_CMD: 'setExtensionCMD',
  EXTENSION_VALUE_SEND: 'extensionValueSEND',
} as const;

/**
 * IPC channels for UI operations
 */
export const UI_CHANNELS = {
  SHOW_MENU_REQ: 'showMenuREQ',
  SHOW_NOTIFICATION_REQ: 'showNotificationREQ',
  SHOW_NOTIFICATION_CMD: 'showNotificationCMD',
  FULLSCREEN_REQ: 'FullScreenREQ',
  DEFAULT_SCREEN_REQ: 'DefaultScreenREQ',
  SHOW_IMGKIT_CONTEXT_MENU: 'show-imgkit-context-menu',
  IMGKIT_CONTEXT_MENU_ACTION: 'imgkit-context-menu-action',
} as const;

/**
 * IPC channels for clipboard operations
 */
export const CLIPBOARD_CHANNELS = {
  COPY_IMAGE: 'copy-image-to-clipboard',
  PASTE_IMAGE: 'paste-image-from-clipboard',
} as const;

/**
 * IPC channels for layer events
 */
export const LAYER_CHANNELS = {
  LAYER_EVENT: 'imgkit-layer-event',
} as const;

// ============================================================================
// TYPE DEFINITIONS FOR PAYLOADS
// ============================================================================

/**
 * Context menu options
 */
export interface ContextMenuOptions {
  hasUndo: boolean;
  hasRedo: boolean;
}

/**
 * Context menu action types
 */
export type ContextMenuAction = 'copy' | 'paste' | 'delete' | 'undo' | 'redo' | 'watermark' | 'hide';

/**
 * Layer event payload
 */
export interface LayerEventPayload {
  type: string;
  layerId?: string;
  data?: any;
}

/**
 * Resize options
 */
export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * Color value (hex string)
 */
export type ColorValue = string;

/**
 * Color name result
 */
export interface ColorNameResult {
  name: string;
  hex: string;
}

/**
 * File path result from dialog
 */
export interface FilePathResult {
  filePaths: string[];
  canceled: boolean;
}

/**
 * Save path result from dialog
 */
export interface SavePathResult {
  filePath?: string;
  canceled: boolean;
}

/**
 * All IPC channel names grouped
 */
export const IPC_CHANNELS = {
  ...PANEL_CHANNELS,
  ...RESIZE_CHANNELS,
  ...FILTER_CHANNELS,
  ...ROTATE_CHANNELS,
  ...PAINT_CHANNELS,
  ...CROP_CHANNELS,
  ...FILE_CHANNELS,
  ...UI_CHANNELS,
  ...CLIPBOARD_CHANNELS,
  ...LAYER_CHANNELS,
} as const;

/**
 * Type helper to get all channel names
 */
export type IPCChannelName = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
