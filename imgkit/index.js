// ImgKit - Optimized Architecture Entry Point
// Separates concerns: Main (backend logic) + Renderer (UI) + Bridge (connects them)

const { ImgKitMain } = require("./main.js");
const { ImgKitRenderer, ImageLayer } = require("./renderer.js");
const sharp = require("sharp");
const path = require("path");

// Initialize Main Process (Backend)
const imgKitMain = new ImgKitMain();

// Initialize Renderer (UI)
const imgKitRenderer = new ImgKitRenderer();

// Bridge Layer - Connect UI actions to Backend operations
ImageLayer.prototype.openImage = async function (filepath) {
  try {
    const result = await imgKitMain.openImage(filepath);

    this.filepath = filepath;
    this.filename = result.filename;
    this.extension = result.extension;
    this.nameSpan.textContent = this.filename;
    this.extensionCombo.value = this.extension;
    this.updatePreview(result.buffer, result.info);

    if (result.colors && result.colors.length > 0) {
      result.colors.forEach((color, idx) => {
        if (this.colorBox.colors[idx]) {
          this.colorBox.colors[idx].style.backgroundColor = color;
          this.colorBox.colors[idx].title = color;
        }
      });
    }

    if (filepath !== "./assets/addImage.png") {
      this.canvas.id = "full";
    }

    return true;
  } catch (error) {
    this.renderer.showMessage("error");
    console.error("Error opening image:", error);
    this.canvas.id = "default";
    return false;
  }
};

ImageLayer.prototype.openImageBuffer = async function (buffer, filename) {
  try {
    const result = await imgKitMain.openImageBuffer(buffer, filename);

    this.buffer = result.buffer;
    this.filename = result.filename;
    this.extension = result.extension;
    this.nameSpan.textContent = this.filename;
    this.extensionCombo.value = this.extension;
    this.updatePreview(result.buffer, result.info);

    if (result.colors && result.colors.length > 0) {
      result.colors.forEach((color, idx) => {
        if (this.colorBox.colors[idx]) {
          this.colorBox.colors[idx].style.backgroundColor = color;
          this.colorBox.colors[idx].title = color;
        }
      });
    }

    this.canvas.id = "full";
    return true;
  } catch (error) {
    this.renderer.showMessage("error");
    console.error("Error opening image buffer:", error);
    this.canvas.id = "default";
    return false;
  }
};

ImageLayer.prototype.convertFormat = async function (newExtension) {
  if (!this.buffer) return;

  try {
    const result = await imgKitMain.convertFormat(
      this.buffer,
      this.extension,
      newExtension
    );

    this.extension = newExtension;

    if (this.filepath) {
      this.filepath = this.filepath.replace(
        path.extname(this.filepath),
        `.${newExtension}`
      );
    }

    this.updatePreview(result.buffer, result.info);
    this.renderer.showMessage("convert");
  } catch (error) {
    this.renderer.showMessage("error");
    console.error("Error converting format:", error);
  }
};

ImageLayer.prototype.saveImage = async function (filepath) {
  if (!this.buffer) return;

  const savePath = filepath || this.filepath;
  if (!savePath) return;

  try {
    const base64Data = this.image.src.replace(
      `data:image/${this.extension};base64,`,
      ""
    );
    const buffer = Buffer.from(base64Data, "base64");

    await imgKitMain.saveImage(buffer, savePath);
    this.filepath = savePath;
    this.renderer.showMessage("save");
  } catch (error) {
    this.renderer.showMessage("error");
    console.error("Error saving image:", error);
  }
};

ImageLayer.prototype.processImage = async function (options) {
  if (!this.buffer) return;

  try {
    const result = await imgKitMain.processImage(this.buffer, options);
    this.updatePreview(result.buffer, result.info);
  } catch (error) {
    this.renderer.showMessage("error");
    console.error("Error processing image:", error);
  }
};

ImageLayer.prototype.applyCrop = async function (cropData) {
  if (!this.buffer || !this.info) return;

  const { x, y, width, height } = cropData;
  const cropX = Math.round(x);
  const cropY = Math.round(y);
  const cropW = Math.round(width);
  const cropH = Math.round(height);

  if (
    cropW > 0 &&
    cropH > 0 &&
    cropX + cropW <= this.info.width &&
    cropY + cropH <= this.info.height
  ) {
    try {
      const result = await sharp(this.buffer)
        .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
        .toBuffer({ resolveWithObject: true });

      this.updatePreview(result.data, result.info);
    } catch (error) {
      console.error("Crop failed:", error);
    }
  }
};

// Initialize Application
imgKitRenderer.createDefaultImage();

const currentLayer = imgKitRenderer.getCurrentLayer();
if (currentLayer && currentLayer.openImage) {
  currentLayer.openImage("./assets/addImage.png");
}

// Backward Compatibility Exports
class Parameter {
  static num = 0;
}

function createDefaultImage() {
  return imgKitRenderer.createDefaultImage();
}

module.exports = {
  imgKitMain,
  imgKitRenderer,
  ImageLayer,
  Parameter,
  createDefaultImage,
  getCurrentLayer: () => imgKitRenderer.getCurrentLayer(),
  getCurrentIndex: () => imgKitRenderer.currentIndex,
  getAllLayers: () => imgKitRenderer.imageLayerQueue,
  imageLayerQueue: imgKitRenderer.imageLayerQueue,
  drawFlag: false,
  dragFlag: false,
};
