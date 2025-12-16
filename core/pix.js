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
exports.Pix = void 0;
const jsonfile = __importStar(require("jsonfile"));
const sharp_1 = __importDefault(require("sharp"));
class Pix {
    static open(path) {
        try {
            const data = jsonfile.readFileSync(path);
            return data;
        }
        catch (err) {
            console.error("Error reading pixData.json:", err);
            return null;
        }
    }
    static save(pixData, path) {
        try {
            jsonfile.writeFileSync(path, pixData, { spaces: 2 });
        }
        catch (err) {
            console.error("Error writing pixData.json:", err);
        }
    }
    static openFromBuffer(buffer) {
        try {
            const text = Buffer.isBuffer(buffer) ? buffer.toString("utf-8") : buffer;
            return JSON.parse(text);
        }
        catch (err) {
            console.error("Error parsing pix buffer:", err);
            return null;
        }
    }
    static async toSharp(pixData) {
        const payload = pixData?.data ?? pixData;
        const { width, height, channel, depth, hex_data } = payload;
        if (!width || !height || !hex_data)
            return null;
        const channels = channel ?? 4;
        const raw = Buffer.from(hex_data, "hex");
        const bytesPerPixel = Math.ceil(depth / 8) * channels;
        const expectedLength = width * height * bytesPerPixel;
        if (raw.length < expectedLength)
            raw.fill(0, raw.length, expectedLength);
        return (0, sharp_1.default)(raw, {
            raw: { width, height, channels: channels },
        })
            .png()
            .toBuffer({ resolveWithObject: true });
    }
    static async toPix(buffer, info) {
        const { data, info: rawInfo } = await (0, sharp_1.default)(buffer)
            .raw()
            .toBuffer({ resolveWithObject: true });
        return {
            width: info.width,
            height: info.height,
            channel: info.channels,
            depth: info.bitsPerSample || 8,
            compression: {
                method: "none",
            },
            hex_data: data.toString("hex"),
            label: {},
            joint: {},
        };
    }
}
exports.Pix = Pix;
//# sourceMappingURL=pix.js.map