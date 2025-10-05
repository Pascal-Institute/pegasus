const { ipcRenderer } = require("electron");
const { imgKitRenderer, createDefaultImage } = require("imgkit");
const sharp = require("sharp");

// Get imageLayerQueue from renderer
const imageLayerQueue = imgKitRenderer.imageLayerQueue;
var fullScreenFlag = false;
var lineWidth = 1;

const buttons = ["resizeBtn", "cropBtn", "filterBtn", "rotateBtn", "paintBtn"];

buttons.forEach((btnId) => {
  const btn = document.getElementById(btnId);
  btn.addEventListener("click", (event) => {
    document.body.style.cursor = "default";
    buttons.forEach((id) => {
      document.getElementById(id).style.borderBottom = "2px solid #333";
    });

    event.currentTarget.style.borderBottom = "none";

    ipcRenderer.send(`${btnId.replace("Btn", "")}ImgREQ`);
    // Reset draw flag for all layers
    imageLayerQueue.forEach((layer) => {
      layer.drawFlag = false;
    });
  });
});

ipcRenderer.send("showMenuREQ", "ping");

ipcRenderer.on("resizeImgCMD", async (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;

  const newWidth = Math.floor(currentLayer.canvas.width * res);

  try {
    const result = await sharp(currentLayer.buffer)
      .resize({ width: newWidth })
      .toBuffer({ resolveWithObject: true });

    currentLayer.updatePreview(result.data, result.info);
  } catch (error) {
    console.error("Resize failed:", error);
  }
});

ipcRenderer.on("blurImgCMD", async (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;

  try {
    const result = await sharp(currentLayer.buffer)
      .blur(res)
      .toBuffer({ resolveWithObject: true });

    currentLayer.updatePreview(result.data, result.info);
  } catch (error) {
    console.error("Blur failed:", error);
  }
});

ipcRenderer.on("sharpenImgCMD", async (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;

  try {
    const result = await sharp(currentLayer.buffer)
      .sharpen(res, 1.0, 2.0)
      .toBuffer({ resolveWithObject: true });

    currentLayer.updatePreview(result.data, result.info);
  } catch (error) {
    console.error("Sharpen failed:", error);
  }
});

ipcRenderer.on("normalizeImgCMD", async (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;

  try {
    const result = await sharp(currentLayer.buffer)
      .normalize(true)
      .toBuffer({ resolveWithObject: true });

    currentLayer.updatePreview(result.data, result.info);
  } catch (error) {
    console.error("Normalize failed:", error);
  }
});

ipcRenderer.on("medianImgCMD", async (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;

  try {
    const result = await sharp(currentLayer.buffer)
      .median(res)
      .toBuffer({ resolveWithObject: true });

    currentLayer.updatePreview(result.data, result.info);
  } catch (error) {
    console.error("Median failed:", error);
  }
});

ipcRenderer.on("rotateImgCMD", async (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;

  try {
    const result = await sharp(currentLayer.buffer)
      .rotate(res)
      .toBuffer({ resolveWithObject: true });

    currentLayer.updatePreview(result.data, result.info);
  } catch (error) {
    console.error("Rotate failed:", error);
  }
});

ipcRenderer.on("rotateRightImgCMD", async (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;

  try {
    const result = await sharp(currentLayer.buffer)
      .rotate(90)
      .toBuffer({ resolveWithObject: true });

    currentLayer.updatePreview(result.data, result.info);
  } catch (error) {
    console.error("Rotate right failed:", error);
  }
});

ipcRenderer.on("rotateLeftImgCMD", async (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;

  try {
    const result = await sharp(currentLayer.buffer)
      .rotate(-90)
      .toBuffer({ resolveWithObject: true });

    currentLayer.updatePreview(result.data, result.info);
  } catch (error) {
    console.error("Rotate left failed:", error);
  }
});

ipcRenderer.on("flipImgCMD", async (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;

  try {
    const result = await sharp(currentLayer.buffer)
      .flip()
      .toBuffer({ resolveWithObject: true });

    currentLayer.updatePreview(result.data, result.info);
  } catch (error) {
    console.error("Flip failed:", error);
  }
});

ipcRenderer.on("flopImgCMD", async (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;

  try {
    const result = await sharp(currentLayer.buffer)
      .flop()
      .toBuffer({ resolveWithObject: true });

    currentLayer.updatePreview(result.data, result.info);
  } catch (error) {
    console.error("Flop failed:", error);
  }
});

ipcRenderer.on("bitwiseImgCMD", async (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;

  try {
    const result = await sharp(currentLayer.buffer)
      .threshold()
      .toBuffer({ resolveWithObject: true });

    currentLayer.updatePreview(result.data, result.info);
  } catch (error) {
    console.error("Bitwise failed:", error);
  }
});

ipcRenderer.on("negativeImgCMD", async (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;

  try {
    const result = await sharp(currentLayer.buffer)
      .negate(true)
      .toBuffer({ resolveWithObject: true });

    currentLayer.updatePreview(result.data, result.info);
  } catch (error) {
    console.error("Negative failed:", error);
  }
});

ipcRenderer.on("grayScaleImgCMD", async (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;

  try {
    const result = await sharp(currentLayer.buffer)
      .grayscale(true)
      .toBuffer({ resolveWithObject: true });

    currentLayer.updatePreview(result.data, result.info);
  } catch (error) {
    console.error("Grayscale failed:", error);
  }
});

ipcRenderer.on("tintImgCMD", async (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;

  try {
    const result = await sharp(currentLayer.buffer)
      .tint(res)
      .toBuffer({ resolveWithObject: true });

    currentLayer.updatePreview(result.data, result.info);
  } catch (error) {
    console.error("Tint failed:", error);
  }
});

ipcRenderer.on("watermarkImgCMD", async (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer || !currentLayer.buffer) return;

  try {
    const watermark = await sharp("./assets/icon.png")
      .resize(32, 32)
      .toBuffer();
    const result = await sharp(currentLayer.buffer)
      .composite([
        {
          input: watermark,
          gravity: "southeast",
        },
      ])
      .toBuffer({ resolveWithObject: true });

    currentLayer.updatePreview(result.data, result.info);
  } catch (error) {
    console.error("Watermark failed:", error);
  }
});

ipcRenderer.on("cropImgCMD", (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer) return;

  currentLayer.canvas.setAttribute("draggable", false);
  document.body.style.cursor = "crosshair";
});

ipcRenderer.on("drawImgCMD", (event, res) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer) return;

  currentLayer.drawFlag = res;
  currentLayer.dragFlag = false;

  if (currentLayer.drawFlag) {
    currentLayer.canvas.setAttribute("draggable", false);
    document.body.style.cursor = "url('./assets/drawCursor.ico'), default";
  } else {
    currentLayer.canvas.setAttribute("draggable", true);
    document.body.style.cursor = "default";
  }
});

var sioCheckBox = document.getElementById("showImageOnlyCheckBox");

sioCheckBox.addEventListener("click", (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (!currentLayer) return;

  const isChecked = sioCheckBox.checked;
  currentLayer.toggleShowImageOnly(isChecked);
});

ipcRenderer.on("openImgCMD", async (event, res) => {
  // Get the last layer (should be the default placeholder)
  const lastLayer = imageLayerQueue[imageLayerQueue.length - 1];

  if (res && lastLayer && lastLayer.openImage) {
    await lastLayer.openImage(res);
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

document.getElementById("undoBtn").addEventListener("click", (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (currentLayer && currentLayer.undo) {
    currentLayer.undo();
  }
});

document.getElementById("redoBtn").addEventListener("click", (event) => {
  const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
  if (currentLayer && currentLayer.redo) {
    currentLayer.redo();
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

document.addEventListener("wheel", function (event) {
  if (event.ctrlKey) {
    const currentLayer = imageLayerQueue[imgKitRenderer.currentIndex];
    if (currentLayer && currentLayer.drawFlag) {
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
