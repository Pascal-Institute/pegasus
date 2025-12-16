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
exports.FormatConverter = void 0;
const sharp_1 = __importDefault(require("sharp"));
const bmp = __importStar(require("sharp-bmp"));
const ico = __importStar(require("sharp-ico"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const pix_1 = require("../core/pix");
class FormatConverter {
    static async convert(buffer, fromExt, toExt) {
        try {
            if (toExt === "svg") {
                return await FormatConverter.convertToSvg(buffer);
            }
            if (toExt === "bmp") {
                return await FormatConverter.convertToBmp(buffer);
            }
            if (toExt === "ico") {
                return await FormatConverter.convertToIco(buffer);
            }
            if (toExt === "pix") {
                return await FormatConverter.convertToPix(buffer);
            }
            if (toExt === "heif" || toExt === "heic") {
                return await FormatConverter.convertToHeif(buffer);
            }
            return await FormatConverter.convertToStandard(buffer, toExt);
        }
        catch (error) {
            throw new Error(`Format conversion failed: ${error.message}`);
        }
    }
    static async convertToBmp(buffer) {
        const tempPath = FormatConverter.createTempFile(buffer, "temp.bmp");
        await bmp.sharpToBmp((0, sharp_1.default)(buffer), tempPath);
        const resultBuffer = await fs.promises.readFile(tempPath);
        const pngResult = await (0, sharp_1.default)(resultBuffer)
            .png()
            .toBuffer({ resolveWithObject: true });
        return { buffer: pngResult.data, info: pngResult.info };
    }
    static async convertToSvg(buffer) {
        const metadata = await (0, sharp_1.default)(buffer).metadata();
        const pngBuffer = await (0, sharp_1.default)(buffer).png().toBuffer();
        const base64Data = pngBuffer.toString("base64");
        const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${metadata.width}" height="${metadata.height}" 
     xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     version="1.1">
  <title>Converted Image</title>
  <image width="${metadata.width}" height="${metadata.height}" 
         xlink:href="data:image/png;base64,${base64Data}"/>
</svg>`;
        return { buffer: pngBuffer, info: metadata, svgData: svgContent };
    }
    static async convertToIco(buffer) {
        const tempPath = FormatConverter.createTempFile(buffer, "temp.ico");
        await ico.sharpsToIco([(0, sharp_1.default)(buffer)], tempPath);
        const resultBuffer = await fs.promises.readFile(tempPath);
        const sharpList = ico.sharpsFromIco(resultBuffer);
        const pngResult = await sharpList[0]
            .png()
            .toBuffer({ resolveWithObject: true });
        return { buffer: pngResult.data, info: pngResult.info };
    }
    static async convertToPix(buffer) {
        const image = (0, sharp_1.default)(buffer);
        const metadata = await image.metadata();
        const { data, info } = await image
            .raw()
            .toBuffer({ resolveWithObject: true });
        const hexData = data.toString("hex");
        const pixData = {
            width: info.width,
            height: info.height,
            channel: info.channels,
            depth: info.bitsPerSample || 8,
            hex_data: hexData,
        };
        const pngResult = await pix_1.Pix.toSharp(pixData);
        return { buffer: pngResult.data, info: metadata };
    }
    static async convertToHeif(buffer) {
        const result = await (0, sharp_1.default)(buffer)
            .heif({ quality: 80, compression: "av1" })
            .toBuffer({ resolveWithObject: true });
        return { buffer: result.data, info: result.info };
    }
    static async convertToStandard(buffer, format) {
        const result = await (0, sharp_1.default)(buffer)
            .toFormat(format)
            .toBuffer({ resolveWithObject: true });
        return { buffer: result.data, info: result.info };
    }
    static createTempFile(buffer, filename) {
        const tempPath = path.join(os.tmpdir(), filename);
        fs.writeFileSync(tempPath, buffer);
        FormatConverter.tempFiles.push(tempPath);
        return tempPath;
    }
    static cleanupTempFiles() {
        FormatConverter.tempFiles.forEach((file) => {
            try {
                if (fs.existsSync(file))
                    fs.unlinkSync(file);
            }
            catch (error) {
                console.error("Temp file cleanup failed:", error);
            }
        });
        FormatConverter.tempFiles = [];
    }
    static updateFileExtension(filepath, newExtension) {
        if (!filepath)
            return "";
        return filepath.replace(path.extname(filepath), `.${newExtension}`);
    }
}
exports.FormatConverter = FormatConverter;
FormatConverter.tempFiles = [];
//# sourceMappingURL=format_converter.js.map