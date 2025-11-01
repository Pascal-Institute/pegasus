const { ipcRenderer } = require("electron");
const { imgKitRenderer, createDefaultImage, ImageMode } = require("imgkit");
const sharp = require("sharp");

// Get imageLayerQueue from renderer
const imageLayerQueue = imgKitRenderer.imageLayerQueue;
var fullScreenFlag = false;
var lineWidth = 1;

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
  btn.addEventListener("click", (event) => {
    document.body.style.cursor = "default";
    buttons.forEach((id) => {
      document.getElementById(id).style.borderBottom = "2px solid #333";
    });

    event.currentTarget.style.borderBottom = "none";

    ipcRenderer.send(`${btnId.replace("Btn", "")}ImgREQ`);
    // Reset mode for all layers
    imageLayerQueue.forEach((layer) => {
      layer.modeManager.reset();
    });
  });
});

ipcRenderer.send("showMenuREQ", "ping");

ipcRenderer.on("resizeImgCMD", async (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;
  const newWidth = Math.floor(currentLayer.canvas.width * res);
  currentLayer.processImage({ resize: newWidth });
});

ipcRenderer.on("blurImgCMD", async (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;
  currentLayer.processImage({ blur: res });
});

ipcRenderer.on("sharpenImgCMD", async (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;
  currentLayer.processImage({ sharpen: (res, 1.0, 2.0) });
});

ipcRenderer.on("normalizeImgCMD", async (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;
  currentLayer.processImage({ normalize: true });
});

ipcRenderer.on("medianImgCMD", async (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;
  currentLayer.processImage({ median: res });
});

ipcRenderer.on("dilateImgCMD", async (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;
  currentLayer.processImage({ dilate: res });
});

ipcRenderer.on("erodeImgCMD", async (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;
  currentLayer.processImage({ erode: res });
});

ipcRenderer.on("rotateImgCMD", async (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;
  currentLayer.processImage({ rotate: res });
});

ipcRenderer.on("rotateRightImgCMD", async (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;
  currentLayer.processImage({ rotate: 90 });
});

ipcRenderer.on("rotateLeftImgCMD", async (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;
  currentLayer.processImage({ rotate: -90 });
});

ipcRenderer.on("flipImgCMD", async (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;
  currentLayer.processImage({ flip: true });
});

ipcRenderer.on("flopImgCMD", async (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;
  currentLayer.processImage({ flop: true });
});

ipcRenderer.on("bitwiseImgCMD", async (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;
  currentLayer.processImage({ threshold: res });
});

ipcRenderer.on("negativeImgCMD", async (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;
  currentLayer.processImage({ negative: true });
});

ipcRenderer.on("grayScaleImgCMD", async (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;
  currentLayer.processImage({ grayscale: true });
});

ipcRenderer.on("tintImgCMD", async (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;
  currentLayer.processImage({ tint: res });
});

ipcRenderer.on("watermarkImgCMD", async (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;
  currentLayer.processImage({ composite: true });
});

ipcRenderer.on("colorpickerImgCMD", async (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer) return;
  if (res) {
    currentLayer.modeManager.setMode(ImageMode.COLORPICKER);
    currentLayer.canvas.setAttribute("draggable", false);
  } else {
    currentLayer.modeManager.reset();
    currentLayer.canvas.setAttribute("draggable", true);
  }
});

ipcRenderer.on("padImgCMD", async (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer) return;
  currentLayer.processImage({
    extend: { top: 1, bottom: 1, left: 1, right: 1 },
  });
});

ipcRenderer.on("cropImgCMD", (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer) return;

  currentLayer.canvas.setAttribute("draggable", false);
  currentLayer.modeManager.setMode(ImageMode.CROPPING);
});

ipcRenderer.on("drawImgCMD", (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer) return;

  if (res) {
    currentLayer.modeManager.setMode(ImageMode.DRAWING);
    currentLayer.canvas.setAttribute("draggable", false);
  } else {
    currentLayer.modeManager.reset();
    currentLayer.canvas.setAttribute("draggable", true);
  }
});

ipcRenderer.on("openImgCMD", async (event, res) => {
  // Handle both single file path (string) and multiple file paths (array)
  const filePaths = Array.isArray(res) ? res : [res];

  // Filter out any invalid paths
  const validPaths = filePaths.filter(
    (path) => path && typeof path === "string"
  );

  if (validPaths.length === 0) return;

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

ipcRenderer.on("setExtensionCMD", (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (currentLayer && currentLayer.extension) {
    ipcRenderer.send("extensionValueSEND", currentLayer.extension);
  }
});

ipcRenderer.on("saveImgCMD", async (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];

  if (
    currentLayer &&
    currentLayer.filepath &&
    currentLayer.filepath !== "./assets/addImage.png"
  ) {
    await currentLayer.saveImage(currentLayer.filepath);
  }
});

ipcRenderer.on("saveAsImgCMD", async (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];

  if (currentLayer && res) {
    await currentLayer.saveImage(res);
  }
});

document.addEventListener("keydown", function (event) {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];

  if (event.ctrlKey && event.key === "z") {
    if (currentLayer && currentLayer.undo) {
      currentLayer.undo();
    }
  } else if (event.ctrlKey && event.key === "y") {
    if (currentLayer && currentLayer.redo) {
      currentLayer.redo();
    }
  } else if (event.altKey && (event.key === "m" || event.key === "M")) {
    // Alt+M: Toggle magnifying glass mode (handled globally in renderer.js now)
    // This local handler is kept for backwards compatibility but does nothing
    // since setupGlobalMagnifyShortcut in renderer.js handles Alt+M globally
  } else if (event.altKey && (event.key === "h" || event.key === "H")) {
    currentLayer.hide();
  } else if (event.which === 122) {
    if (!fullScreenFlag) {
      ipcRenderer.send("FullScreenREQ");
      fullScreenFlag = true;
    } else {
      ipcRenderer.send("DefaultScreenREQ");
      fullScreenFlag = false;
    }
  }
});

// Handle notification requests from other renderers (e.g., paint_renderer)
ipcRenderer.on("showNotificationCMD", (event, notificationId) => {
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
      } else {
        // scroll down
        if (lineWidth > 1) {
          lineWidth--;
        }
      }
      currentLayer.ctx.lineWidth = lineWidth;
    }
  }
});
