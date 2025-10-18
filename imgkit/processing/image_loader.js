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

      // For GIF files, first check if they're animated
      let gifMetadata = null;
      if (extension === "gif") {
        gifMetadata = await sharp(filepath).metadata();
      }

      const loader = ImageLoader.getImageLoader(filepath, extension);
      const result = await loader.toBuffer({ resolveWithObject: true });
      return {
        buffer: result.data,
        info: result.info,
        filename,
        extension,
        gifMetadata, // Include GIF animation metadata if available
      };
    } catch (error) {
      throw new Error(`Failed to open image: ${error.message}`);
    }
  }

  static async openImageBuffer(buffer, filename) {
    try {
      const extension = path.extname(filename).replace(".", "");
      const name = path.basename(filename, path.extname(filename));

      // For GIF files, first check if they're animated
      let gifMetadata = null;
      if (extension === "gif") {
        gifMetadata = await sharp(buffer).metadata();
      }

      const loader = ImageLoader.getBufferLoader(buffer, extension);
      const result = await loader.toBuffer({ resolveWithObject: true });
      return {
        buffer: result.data,
        info: result.info,
        filename: name,
        extension,
        gifMetadata, // Include GIF animation metadata if available
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

  /**
   * Extract a specific frame from an animated GIF
   * @param {Buffer|string} input - GIF buffer or file path
   * @param {number} frameIndex - Frame index to extract (0-based)
   * @returns {Promise<{buffer: Buffer, info: Object}>}
   */
  static async extractGifFrame(input, frameIndex) {
    try {
      const result = await sharp(input, { page: frameIndex })
        .png()
        .toBuffer({ resolveWithObject: true });
      return {
        buffer: result.data,
        info: result.info,
      };
    } catch (error) {
      throw new Error(
        `Failed to extract GIF frame ${frameIndex}: ${error.message}`
      );
    }
  }
}

module.exports = { ImageLoader };
