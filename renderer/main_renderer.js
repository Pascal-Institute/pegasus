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
const electron_1 = require("electron");
const path = __importStar(require("path"));
const { imgKitRenderer, createDefaultImage, ImageMode } = require(path.join(process.cwd(), "image_kit.js"));
// Get imageLayerQueue from renderer
const imageLayerQueue = imgKitRenderer.imageLayerQueue;
let fullScreenFlag = false;
let lineWidth = 1;
const buttons = [
    "resizeBtn",
    "cropBtn",
    "filterBtn",
    "rotateBtn",
    "paintBtn",
    "image_analysisBtn",
];
buttons.forEach((btnId) => {
    const btn = document.getElementById(btnId);
    btn?.addEventListener("click", (event) => {
        document.body.style.cursor = "default";
        buttons.forEach((id) => {
            const element = document.getElementById(id);
            if (element)
                element.style.borderBottom = "2px solid #333";
        });
        event.currentTarget.style.borderBottom = "none";
        electron_1.ipcRenderer.send(`${btnId.replace("Btn", "")}ImgREQ`);
        // Reset mode for all layers
        imageLayerQueue.forEach((layer) => {
            layer.modeManager.reset();
        });
    });
});
electron_1.ipcRenderer.send("showMenuREQ", "ping");
electron_1.ipcRenderer.on("resizeImgCMD", async (event, res) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    const newWidth = Math.floor(currentLayer.canvas.width * res);
    currentLayer.processImage({ resize: newWidth });
});
electron_1.ipcRenderer.on("resizePixelImgCMD", async (event, res) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    const newWidth = res;
    currentLayer.processImage({ resize: newWidth });
});
electron_1.ipcRenderer.on("blurImgCMD", async (event, res) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    currentLayer.processImage({ blur: res });
});
electron_1.ipcRenderer.on("sharpenImgCMD", async (event, res) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    // Pass only the expected value for sharpen if imgkit does not support Sharp's tuple signature
    currentLayer.processImage({ sharpen: res });
});
electron_1.ipcRenderer.on("normalizeImgCMD", async (event) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    currentLayer.processImage({ normalize: true });
});
electron_1.ipcRenderer.on("medianImgCMD", async (event, res) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    currentLayer.processImage({ median: res });
});
electron_1.ipcRenderer.on("dilateImgCMD", async (event, res) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    currentLayer.processImage({ dilate: res });
});
electron_1.ipcRenderer.on("erodeImgCMD", async (event, res) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    currentLayer.processImage({ erode: res });
});
electron_1.ipcRenderer.on("rotateImgCMD", async (event, res) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    currentLayer.processImage({ rotate: res });
});
electron_1.ipcRenderer.on("rotateRightImgCMD", async (event) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    currentLayer.processImage({ rotate: 90 });
});
electron_1.ipcRenderer.on("rotateLeftImgCMD", async (event) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    currentLayer.processImage({ rotate: -90 });
});
electron_1.ipcRenderer.on("flipImgCMD", async (event) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    currentLayer.processImage({ flip: true });
});
electron_1.ipcRenderer.on("flopImgCMD", async (event) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    currentLayer.processImage({ flop: true });
});
electron_1.ipcRenderer.on("bitwiseImgCMD", async (event, res) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    currentLayer.processImage({ threshold: res });
});
electron_1.ipcRenderer.on("negativeImgCMD", async (event) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    currentLayer.processImage({ negative: true });
});
electron_1.ipcRenderer.on("grayScaleImgCMD", async (event) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    currentLayer.processImage({ grayscale: true });
});
electron_1.ipcRenderer.on("tintImgCMD", async (event, res) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    currentLayer.processImage({ tint: res });
});
electron_1.ipcRenderer.on("watermarkUploadCMD", async (event, filePath) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    currentLayer.applyWatermark({ filePath: filePath });
});
electron_1.ipcRenderer.on("watermarkImgCMD", async (event) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer || !currentLayer.buffer)
        return;
    currentLayer.processImage({ composite: true });
});
electron_1.ipcRenderer.on("colorpickerImgCMD", async (event, res) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer)
        return;
    if (res) {
        currentLayer.modeManager.setMode(ImageMode.COLORPICKER);
        currentLayer.canvas.setAttribute("draggable", "false");
    }
    else {
        currentLayer.modeManager.reset();
        currentLayer.canvas.setAttribute("draggable", "true");
    }
});
electron_1.ipcRenderer.on("padImgCMD", async (event, padSize, color) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer)
        return;
    currentLayer.processImage({
        extend: {
            top: padSize,
            bottom: padSize,
            left: padSize,
            right: padSize,
            background: color,
        },
    });
});
electron_1.ipcRenderer.on("cropImgCMD", (event, res) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer)
        return;
    currentLayer.canvas.setAttribute("draggable", "false");
    currentLayer.modeManager.setMode(ImageMode.CROPPING);
});
electron_1.ipcRenderer.on("drawImgCMD", (event, res) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (!currentLayer)
        return;
    if (res) {
        currentLayer.modeManager.setMode(ImageMode.DRAWING);
        currentLayer.canvas.setAttribute("draggable", "false");
    }
    else {
        currentLayer.modeManager.reset();
        currentLayer.canvas.setAttribute("draggable", "true");
    }
});
electron_1.ipcRenderer.on("openImgCMD", async (event, res) => {
    // Handle both single file path (string) and multiple file paths (array)
    const filePaths = Array.isArray(res) ? res : [res];
    // Filter out any invalid paths
    const validPaths = filePaths.filter((path) => path && typeof path === "string");
    if (validPaths.length === 0)
        return;
    // Open each file in sequence
    for (let i = 0; i < validPaths.length; i++) {
        const filepath = validPaths[i];
        // Get the last layer (should be the default placeholder)
        const lastLayer = imageLayerQueue[imageLayerQueue.length - 1];
        if (lastLayer && lastLayer.openImage) {
            await lastLayer.openImage(filepath);
            // Only create a new default image if this is not the last file
            // or if we're opening a single file
            if (i < validPaths.length - 1 || validPaths.length === 1) {
                createDefaultImage();
            }
        }
    }
    // Always create a default image at the end for the next operation
    if (validPaths.length > 1) {
        createDefaultImage();
    }
});
electron_1.ipcRenderer.on("setExtensionCMD", (event) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (currentLayer && currentLayer.extension) {
        electron_1.ipcRenderer.send("extensionValueSEND", currentLayer.extension);
    }
});
electron_1.ipcRenderer.on("saveImgCMD", async (event) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (currentLayer &&
        currentLayer.filepath &&
        currentLayer.filepath !== "./assets/addImage.png") {
        await currentLayer.saveImage(currentLayer.filepath);
    }
});
electron_1.ipcRenderer.on("saveAsImgCMD", async (event, res) => {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (currentLayer && res) {
        await currentLayer.saveImage(res);
    }
});
document.addEventListener("keydown", function (event) {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (event.ctrlKey && event.key === "a") {
        event.preventDefault(); // Prevent default browser select all action
        imgKitRenderer.selectAll();
    }
    else if (event.ctrlKey && event.key === "z") {
        if (currentLayer && currentLayer.undo) {
            currentLayer.undo();
        }
    }
    else if (event.ctrlKey && event.key === "y") {
        if (currentLayer && currentLayer.redo) {
            currentLayer.redo();
        }
    }
    else if (event.altKey && (event.key === "m" || event.key === "M")) {
        // Alt+M: Toggle magnifying glass mode (handled globally in renderer.js now)
        // This local handler is kept for backwards compatibility but does nothing
        // since setupGlobalMagnifyShortcut in renderer.js handles Alt+M globally
    }
    else if (event.altKey && (event.key === "h" || event.key === "H")) {
        currentLayer.hide();
    }
    else if (event.which === 122) {
        if (!fullScreenFlag) {
            electron_1.ipcRenderer.send("FullScreenREQ");
            fullScreenFlag = true;
        }
        else {
            electron_1.ipcRenderer.send("DefaultScreenREQ");
            fullScreenFlag = false;
        }
    }
});
// Handle notification requests from other renderers (e.g., paint_renderer)
electron_1.ipcRenderer.on("showNotificationCMD", (event, notificationId) => {
    const element = document.getElementById(notificationId);
    if (element) {
        element.animate([{ opacity: "1" }, { opacity: "0" }], {
            duration: 1800,
            iterations: 1,
        });
    }
});
document.addEventListener("wheel", function (event) {
    if (event.ctrlKey) {
        const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
        if (currentLayer && currentLayer.modeManager.isDrawing()) {
            if (event.deltaY > 0 || event.detail < 0) {
                // scroll up
                lineWidth++;
            }
            else {
                // scroll down
                if (lineWidth > 1) {
                    lineWidth--;
                }
            }
            currentLayer.ctx.lineWidth = lineWidth;
        }
    }
});
//# sourceMappingURL=main_renderer.js.map