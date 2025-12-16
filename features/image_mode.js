"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeManager = exports.ImageMode = void 0;
const path = __importStar(require("path"));
/**
 * Available interaction modes for image layers
 */
var ImageMode;
(function (ImageMode) {
    /** Default mode - no special interaction */
    ImageMode["NORMAL"] = "normal";
    /** Drawing/painting mode - user is drawing on canvas */
    ImageMode["DRAWING"] = "drawing";
    /** Cropping mode - user is selecting a crop area (crosshair cursor) */
    ImageMode["CROPPING"] = "cropping";
    /** Magnifying glass mode - zoomed preview follows mouse (Alt + M) */
    ImageMode["MAGNIFY"] = "magnify";
    /** Color picker mode - user is picking a color from the image */
    ImageMode["COLORPICKER"] = "colorpicker";
})(ImageMode || (exports.ImageMode = ImageMode = {}));
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
     * @param mode - The mode to set
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
     * @returns Current mode
     */
    getMode() {
        return this.currentMode;
    }
    /**
     * Check if in a specific mode
     * @param mode - Mode to check
     * @returns True if in the specified mode
     */
    isMode(mode) {
        return this.currentMode === mode;
    }
    /**
     * Check if in normal mode
     * @returns True if in normal mode
     */
    isNormal() {
        return this.currentMode === ImageMode.NORMAL;
    }
    /**
     * Check if in drawing mode
     * @returns True if in drawing mode
     */
    isDrawing() {
        return this.currentMode === ImageMode.DRAWING;
    }
    /**
     * Check if in cropping mode
     * @returns True if in cropping mode
     */
    isCropping() {
        return this.currentMode === ImageMode.CROPPING;
    }
    /**
     * Check if in magnify mode
     * @returns True if in magnify mode
     */
    isMagnifying() {
        return this.currentMode === ImageMode.MAGNIFY;
    }
    /**
     * Check if in color picker mode
     * @returns True if in color picker mode
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
     * @returns CSS cursor value
     */
    getCursor() {
        switch (this.currentMode) {
            case ImageMode.CROPPING:
                return "crosshair";
            case ImageMode.MAGNIFY:
                return "zoom-in";
            case ImageMode.DRAWING:
                var cursorPath = path
                    .join(__dirname, "../../assets/pencil.png")
                    .replace(/\\/g, "/");
                return `url('file://${cursorPath}') 0 32, crosshair`;
            case ImageMode.COLORPICKER:
                var cursorPath = path
                    .join(__dirname, "../../assets/spoid.png")
                    .replace(/\\/g, "/");
                return `url('file://${cursorPath}') 0 24, crosshair`;
            default:
                return "default";
        }
    }
}
exports.ModeManager = ModeManager;
//# sourceMappingURL=image_mode.js.map