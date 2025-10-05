// ImgKit Main Process - Backend Logic
// Handles all image processing operations using sharp library

const sharp = require("sharp");
const bmp = require("sharp-bmp");
const ico = require("sharp-ico");
const fs = require("fs");
const path = require("path");
const os = require("os");

class ImgKitMain {
  constructor() {
    this.tempFiles = []; // Track temporary files for cleanup
  }

  /**
   * Process image with various operations (resize, blur, sharpen, etc.)
   * @param {Buffer} buffer - Image buffer
   * @param {Object} options - Processing options
   * @returns {Promise<{buffer: Buffer, info: Object}>}
   */
  async processImage(buffer, options = {}) {
    try {
      let pipeline = sharp(buffer);

      // Apply resize if specified
      if (options.resize) {
        pipeline = pipeline.resize(options.resize);
      }

      // Apply blur if specified
      if (options.blur) {
        pipeline = pipeline.blur(options.blur);
      }

      // Apply sharpen if specified
      if (options.sharpen) {
        pipeline = pipeline.sharpen(options.sharpen);
      }

      // Apply format conversion if specified
      if (options.format) {
        pipeline = pipeline.toFormat(options.format);
      }

      // Apply extract/crop if specified
      if (options.extract) {
        pipeline = pipeline.extract(options.extract);
      }

      const result = await pipeline.toBuffer({ resolveWithObject: true });

      return {
        buffer: result.data,
        info: result.info,
      };
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Convert image format (handles special formats like bmp, ico)
   * @param {Buffer} buffer - Source image buffer
   * @param {string} fromExt - Source extension
   * @param {string} toExt - Target extension
   * @returns {Promise<{buffer: Buffer, info: Object}>}
   */
  async convertFormat(buffer, fromExt, toExt) {
    try {
      let resultBuffer;
      let info;

      // Handle BMP conversion
      if (toExt === "bmp") {
        const tempPath = this.createTempFileFromBuffer(buffer, `temp.${toExt}`);
        await bmp.sharpToBmp(sharp(buffer), tempPath);
        resultBuffer = await fs.promises.readFile(tempPath);

        // Convert to PNG for preview
        const pngResult = await sharp(resultBuffer)
          .png()
          .toBuffer({ resolveWithObject: true });
        return { buffer: pngResult.data, info: pngResult.info };
      }

      // Handle ICO conversion
      else if (toExt === "ico") {
        const tempPath = this.createTempFileFromBuffer(buffer, `temp.${toExt}`);
        await ico.sharpsToIco([sharp(buffer)], tempPath);
        resultBuffer = await fs.promises.readFile(tempPath);

        // Convert to PNG for preview
        const sharpList = ico.sharpsFromIco(resultBuffer);
        const pngResult = await sharpList[0]
          .png()
          .toBuffer({ resolveWithObject: true });
        return { buffer: pngResult.data, info: pngResult.info };
      }

      // Handle standard formats
      else {
        const result = await sharp(buffer)
          .toFormat(toExt)
          .toBuffer({ resolveWithObject: true });

        return { buffer: result.data, info: result.info };
      }
    } catch (error) {
      throw new Error(`Format conversion failed: ${error.message}`);
    }
  }

  /**
   * Open image from file path
   * @param {string} filepath - Path to image file
   * @returns {Promise<{buffer: Buffer, info: Object, filename: string, extension: string}>}
   */
  async openImage(filepath) {
    try {
      const extension = path.extname(filepath).replace(".", "");
      const filename = path.basename(filepath, path.extname(filepath));

      let loader;

      // Handle specigal formats
      if (["tiff", "tif"].includes(extension)) {
        loader = sharp(filepath).png();
      } else if (extension === "ico") {
        loader = ico.sharpsFromIco(filepath)[0].png();
      } else if (extension === "bmp") {
        loader = bmp.sharpFromBmp(filepath).png();
      } else {
        loader = sharp(filepath);
      }

      const result = await loader.toBuffer({ resolveWithObject: true });

      // Extract dominant colors
      const colors = await this.extractColors(result.data, result.info, 3);

      return {
        buffer: result.data,
        info: result.info,
        filename,
        extension,
        colors,
      };
    } catch (error) {
      throw new Error(`Failed to open image: ${error.message}`);
    }
  }

  /**
   * Open image from buffer
   * @param {Buffer} buffer - Image buffer
   * @param {string} filename - Filename with extension
   * @returns {Promise<{buffer: Buffer, info: Object, filename: string, extension: string}>}
   */
  async openImageBuffer(buffer, filename) {
    try {
      const extension = path.extname(filename).replace(".", "");
      const name = path.basename(filename, path.extname(filename));

      let loader;

      // Handle special formats
      if (["tiff", "tif"].includes(extension)) {
        loader = sharp(buffer).png();
      } else if (extension === "ico") {
        loader = ico.sharpsFromIco(buffer)[0].png();
      } else if (extension === "bmp") {
        loader = bmp.sharpFromBmp(buffer).png();
      } else {
        loader = sharp(buffer);
      }

      const result = await loader.toBuffer({ resolveWithObject: true });

      // Extract dominant colors
      const colors = await this.extractColors(result.data, result.info, 3);

      return {
        buffer: result.data,
        info: result.info,
        filename: name,
        extension,
        colors,
      };
    } catch (error) {
      throw new Error(`Failed to open image buffer: ${error.message}`);
    }
  }

  /**
   * Save image buffer to file
   * @param {Buffer} buffer - Image buffer to save
   * @param {string} filepath - Destination file path
   * @returns {Promise<void>}
   */
  async saveImage(buffer, filepath) {
    try {
      // Convert base64 data URL to buffer if needed
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

  /**
   * Extract dominant colors from image
   * @param {Buffer} buffer - Image buffer
   * @param {Object} info - Image info from sharp
   * @param {number} count - Number of colors to extract
   * @returns {Promise<string[]>} Array of hex color strings
   */
  async extractColors(buffer, info, count = 3) {
    try {
      // Resize to small size for faster processing
      const resizeWidth = info.width > 24 ? 24 : info.width;

      const result = await sharp(buffer)
        .resize({ width: resizeWidth })
        .toColorspace("srgb")
        .raw()
        .toBuffer({ resolveWithObject: true });

      const rawBuffer = result.data;
      const rawInfo = result.info;

      // Count color frequency
      const colors = {};
      const channels = rawInfo.channels; // 3 for RGB, 4 for RGBA
      const pixelCount = rawBuffer.length / channels;

      for (let i = 0; i < pixelCount; i++) {
        const r = rawBuffer[channels * i];
        const g = rawBuffer[channels * i + 1];
        const b = rawBuffer[channels * i + 2];
        const key = `${r} ${g} ${b}`;

        colors[key] = (colors[key] || 0) + 1;
      }

      // Sort by frequency and get top N colors
      const sortedColors = Object.entries(colors)
        .sort(([, a], [, b]) => b - a)
        .slice(0, count);

      // Convert to hex format
      return sortedColors.map(([rgbString]) => {
        const [r, g, b] = rgbString.split(" ").map(Number);
        return `#${r.toString(16).padStart(2, "0")}${g
          .toString(16)
          .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
      });
    } catch (error) {
      console.error("Color extraction failed:", error);
      return [];
    }
  }

  /**
   * Create temporary file from buffer
   * @param {Buffer} buffer - File buffer
   * @param {string} filename - Temporary filename
   * @returns {string} Temporary file path
   */
  createTempFileFromBuffer(buffer, filename) {
    const tempPath = path.join(os.tmpdir(), filename);
    fs.writeFileSync(tempPath, buffer);
    this.tempFiles.push(tempPath);
    return tempPath;
  }

  /**
   * Cleanup specific temporary file
   * @param {string} filepath - Path to temporary file
   */
  cleanupTempFile(filepath) {
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        this.tempFiles = this.tempFiles.filter((f) => f !== filepath);
      }
    } catch (error) {
      console.error("Temp file cleanup failed:", error);
    }
  }

  /**
   * Cleanup all temporary files
   */
  cleanupAllTempFiles() {
    this.tempFiles.forEach((filepath) => {
      try {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      } catch (error) {
        console.error("Temp file cleanup failed:", error);
      }
    });
    this.tempFiles = [];
  }
}

module.exports = { ImgKitMain };
