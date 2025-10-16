// ImageLoader - Image Loading Operations
// Handles loading images from files or buffers
// Supports special formats (BMP, ICO, TIFF)

const sharp = require("sharp");
const bmp = require("sharp-bmp");
const ico = require("sharp-ico");
const fs = require("fs");
const path = require("path");

class ImageLoader {
  static async openImage(filepath) {
    try {
      const extension = path.extname(filepath).replace(".", "");
      const filename = path.basename(filepath, path.extname(filepath));
      const loader = ImageLoader.getImageLoader(filepath, extension);
      const result = await loader.toBuffer({ resolveWithObject: true });
      return {
        buffer: result.data,
        info: result.info,
        filename,
        extension,
      };
    } catch (error) {
      throw new Error(`Failed to open image: ${error.message}`);
    }
  }

  static async openImageBuffer(buffer, filename) {
    try {
      const extension = path.extname(filename).replace(".", "");
      const name = path.basename(filename, path.extname(filename));
      const loader = ImageLoader.getBufferLoader(buffer, extension);
      const result = await loader.toBuffer({ resolveWithObject: true });
      return {
        buffer: result.data,
        info: result.info,
        filename: name,
        extension,
      };
    } catch (error) {
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
    } catch (error) {
      throw new Error(`Failed to save image: ${error.message}`);
    }
  }

  static getImageLoader(filepath, extension) {
    if (["tiff", "tif"].includes(extension)) {
      return sharp(filepath).png();
    }
    if (extension === "ico") {
      return ico.sharpsFromIco(filepath)[0].png();
    }
    if (extension === "bmp") {
      return bmp.sharpFromBmp(filepath).png();
    }
    return sharp(filepath);
  }

  static getBufferLoader(buffer, extension) {
    if (["tiff", "tif"].includes(extension)) {
      return sharp(buffer).png();
    }
    if (extension === "ico") {
      return ico.sharpsFromIco(buffer)[0].png();
    }
    if (extension === "bmp") {
      return bmp.sharpFromBmp(buffer).png();
    }
    return sharp(buffer);
  }
}

module.exports = { ImageLoader };
