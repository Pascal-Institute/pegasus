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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageLoader = void 0;
const sharp_1 = __importDefault(require("sharp"));
const bmp = __importStar(require("sharp-bmp"));
const ico = __importStar(require("sharp-ico"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pix_1 = require("../core/pix");
class ImageLoader {
    static async openImage(filepath) {
        try {
            const extension = path.extname(filepath).replace(".", "");
            const filename = path.basename(filepath, path.extname(filepath));
            if (extension === "pix") {
                const pixData = pix_1.Pix.open(filepath);
                if (!pixData)
                    throw new Error("Invalid PIX data");
                const result = await pix_1.Pix.toSharp(pixData);
                if (!result)
                    throw new Error("Failed to convert PIX data");
                return { buffer: result.data, info: result.info, filename, extension, gifMetadata: null };
            }
            let gifMetadata = null;
            if (extension === "gif") {
                try {
                    gifMetadata = await (0, sharp_1.default)(filepath, { animated: true }).metadata();
                }
                catch (error) {
                    console.warn("Failed to read GIF metadata:", error);
                }
            }
            const loader = ImageLoader.getImageLoader(filepath, extension);
            const result = await loader.toBuffer({ resolveWithObject: true });
            return {
                buffer: result.data,
                info: result.info,
                filename,
                extension,
                gifMetadata,
            };
        }
        catch (error) {
            throw new Error(`Failed to open image: ${error.message}`);
        }
    }
    static async openImageBuffer(buffer, filename) {
        try {
            const extension = path.extname(filename).replace(".", "");
            const name = path.basename(filename, path.extname(filename));
            if (extension === "pix") {
                const pixData = pix_1.Pix.openFromBuffer(buffer);
                if (!pixData)
                    throw new Error("Invalid PIX buffer");
                const result = await pix_1.Pix.toSharp(pixData);
                if (!result)
                    throw new Error("Failed to convert PIX buffer");
                return {
                    buffer: result.data,
                    info: result.info,
                    filename: name,
                    extension,
                    gifMetadata: null,
                };
            }
            let gifMetadata = null;
            if (extension === "gif") {
                try {
                    gifMetadata = await (0, sharp_1.default)(buffer, { animated: true }).metadata();
                }
                catch (error) {
                    console.warn("Failed to read GIF metadata from buffer:", error);
                }
            }
            const loader = ImageLoader.getBufferLoader(buffer, extension);
            const result = await loader.toBuffer({ resolveWithObject: true });
            return {
                buffer: result.data,
                info: result.info,
                filename: name,
                extension,
                gifMetadata,
            };
        }
        catch (error) {
            throw new Error(`Failed to open image buffer: ${error.message}`);
        }
    }
    static async saveImage(buffer, filepath) {
        try {
            let saveBuffer = buffer;
            if (buffer.toString().startsWith("data:image")) {
                const base64Data = buffer
                    .toString()
                    .replace(/^data:image\/\w+;base64,/, "");
                saveBuffer = Buffer.from(base64Data, "base64");
            }
            await fs.promises.writeFile(filepath, saveBuffer);
        }
        catch (error) {
            throw new Error(`Failed to save image: ${error.message}`);
        }
    }
    static getImageLoader(filepath, extension) {
        if (extension === "pix") {
            const pixData = pix_1.Pix.open(filepath);
            return pix_1.Pix.toSharp(pixData);
        }
        if (["tiff", "tif"].includes(extension)) {
            return (0, sharp_1.default)(filepath).png();
        }
        if (extension === "ico") {
            return ico.sharpsFromIco(filepath)[0].png();
        }
        if (extension === "bmp") {
            return bmp.sharpFromBmp(filepath).png();
        }
        if (extension === "gif") {
            // For GIF, extract first frame as PNG
            return (0, sharp_1.default)(filepath, { page: 0 }).png();
        }
        return (0, sharp_1.default)(filepath);
    }
    static getBufferLoader(buffer, extension) {
        if (extension === "pix") {
            const pixData = pix_1.Pix.openFromBuffer(buffer);
            return pix_1.Pix.toSharp(pixData);
        }
        if (["tiff", "tif"].includes(extension)) {
            return (0, sharp_1.default)(buffer).png();
        }
        if (extension === "ico") {
            return ico.sharpsFromIco(buffer)[0].png();
        }
        if (extension === "bmp") {
            return bmp.sharpFromBmp(buffer).png();
        }
        if (extension === "gif") {
            // For GIF, extract first frame as PNG
            return (0, sharp_1.default)(buffer, { page: 0 }).png();
        }
        return (0, sharp_1.default)(buffer);
    }
    /**
     * Extract a specific frame from an animated GIF
     * @param input - GIF buffer or file path
     * @param frameIndex - Frame index to extract (0-based)
     * @returns Promise with buffer and info
     */
    static async extractGifFrame(input, frameIndex) {
        try {
            const result = await (0, sharp_1.default)(input, { page: frameIndex })
                .png()
                .toBuffer({ resolveWithObject: true });
            return {
                buffer: result.data,
                info: result.info,
            };
        }
        catch (error) {
            throw new Error(`Failed to extract GIF frame ${frameIndex}: ${error.message}`);
        }
    }
}
exports.ImageLoader = ImageLoader;
//# sourceMappingURL=image_loader.js.map