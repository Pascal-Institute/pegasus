// ImgKit Main Process - Backend Logic
// Handles all image processing operations using sharp library
//
// This file contains:
// 1. ImgKitMain class - Core image processing functionality
// 2. Helper functions for color extraction, file handling
// 3. Module exports with lazy-loading renderer components

const sharp = require("sharp");
const bmp = require("sharp-bmp");
const ico = require("sharp-ico");
const fs = require("fs");
const path = require("path");
const os = require("os");

// ============================================================================
// MAIN CLASS: ImgKitMain
// ============================================================================
// This class handles all backend image processing operations
// Using sharp library for high-performance image manipulation

class ImgKitMain {
  constructor() {
    this.tempFiles = []; // Track temporary files for cleanup
  }

  // --------------------------------------------------------------------------
  // IMAGE PROCESSING
  // --------------------------------------------------------------------------

  /**
   * Process image with various operations (resize, blur, sharpen, etc.)
   * @param {Buffer} buffer - Image buffer
   * @param {Object} options - Processing options
   * @param {Object} [options.resize] - Resize options {width, height}
   * @param {number} [options.blur] - Blur sigma value
   * @param {boolean} [options.sharpen] - Apply sharpening
   * @param {string} [options.format] - Output format (png, jpg, etc.)
   * @param {Object} [options.extract] - Crop options {left, top, width, height}
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
   * Apply crop operation to image
   * Extract a rectangular region from the image
   * 
   * @param {Buffer} buffer - Image buffer
   * @param {Object} imageInfo - Image metadata (width, height)
   * @param {Object} cropData - Crop selection area
   * @param {number} cropData.x - Left position
   * @param {number} cropData.y - Top position
   * @param {number} cropData.width - Crop width
   * @param {number} cropData.height - Crop height
   * @returns {Promise<{buffer: Buffer, info: Object}>}
   */
  async applyCrop(buffer, imageInfo, cropData) {
    try {
      const { x, y, width, height } = cropData;
      const cropX = Math.round(x);
      const cropY = Math.round(y);
      const cropW = Math.round(width);
      const cropH = Math.round(height);

      // Validate crop dimensions
      if (cropW <= 0) {
        throw new Error(`Invalid crop width: ${cropW}`);
      }
      if (cropH <= 0) {
        throw new Error(`Invalid crop height: ${cropH}`);
      }
      if (cropX < 0) {
        throw new Error(`Invalid crop x (left): ${cropX}`);
      }
      if (cropY < 0) {
        throw new Error(`Invalid crop y (top): ${cropY}`);
      }
      if (cropX + cropW > imageInfo.width) {
        throw new Error(
          `Crop width (${cropW}) and x (${cropX}) exceed image width (${imageInfo.width})`
        );
      }
      if (cropY + cropH > imageInfo.height) {
        throw new Error(
          `Crop height (${cropH}) and y (${cropY}) exceed image height (${imageInfo.height})`
        );
      }

      const result = await sharp(buffer)
        .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
        .toBuffer({ resolveWithObject: true });

      return {
        buffer: result.data,
        info: result.info,
      };
    } catch (error) {
      throw new Error(`Crop operation failed: ${error.message}`);
    }
  }

  // --------------------------------------------------------------------------
  // FORMAT CONVERSION
  // --------------------------------------------------------------------------

  /**
   * Convert image format (handles special formats like bmp, ico)
   * @param {Buffer} buffer - Source image buffer
   * @param {string} fromExt - Source extension (not used, kept for compatibility)
   * @param {string} toExt - Target extension (png, jpg, bmp, ico, etc.)
   * @returns {Promise<{buffer: Buffer, info: Object}>}
   */
  async convertFormat(buffer, fromExt, toExt) {
    try {
      // Special case: BMP format
      if (toExt === "bmp") {
        return await this._convertToBmp(buffer);
      }

      // Special case: ICO format
      if (toExt === "ico") {
        return await this._convertToIco(buffer);
      }

      // Standard formats (png, jpg, webp, etc.)
      return await this._convertToStandardFormat(buffer, toExt);
    } catch (error) {
      throw new Error(`Format conversion failed: ${error.message}`);
    }
  }

  /**
   * Update file path extension
   * Helper method to change extension in a filepath
   * @param {string} filepath - Original file path
   * @param {string} newExtension - New extension (without dot)
   * @returns {string} Updated file path
   */
  updateFileExtension(filepath, newExtension) {
    if (!filepath) return "";
    return filepath.replace(path.extname(filepath), `.${newExtension}`);
  }

  /**
   * Convert image to BMP format (helper method)
   * @private
   */
  async _convertToBmp(buffer) {
    const tempPath = this.createTempFileFromBuffer(buffer, `temp.bmp`);
    await bmp.sharpToBmp(sharp(buffer), tempPath);
    const resultBuffer = await fs.promises.readFile(tempPath);

    // Convert to PNG for preview
    const pngResult = await sharp(resultBuffer)
      .png()
      .toBuffer({ resolveWithObject: true });

    return { buffer: pngResult.data, info: pngResult.info };
  }

  /**
   * Convert image to ICO format (helper method)
   * @private
   */
  async _convertToIco(buffer) {
    const tempPath = this.createTempFileFromBuffer(buffer, `temp.ico`);
    await ico.sharpsToIco([sharp(buffer)], tempPath);
    const resultBuffer = await fs.promises.readFile(tempPath);

    // Convert to PNG for preview
    const sharpList = ico.sharpsFromIco(resultBuffer);
    const pngResult = await sharpList[0]
      .png()
      .toBuffer({ resolveWithObject: true });

    return { buffer: pngResult.data, info: pngResult.info };
  }

  /**
   * Convert image to standard format (helper method)
   * @private
   */
  async _convertToStandardFormat(buffer, format) {
    const result = await sharp(buffer)
      .toFormat(format)
      .toBuffer({ resolveWithObject: true });

    return { buffer: result.data, info: result.info };
  }

  // --------------------------------------------------------------------------
  // FILE I/O OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Open image from file path
   * @param {string} filepath - Path to image file
   * @returns {Promise<{buffer: Buffer, info: Object, filename: string, extension: string, colors: string[]}>}
   */
  async openImage(filepath) {
    try {
      const extension = path.extname(filepath).replace(".", "");
      const filename = path.basename(filepath, path.extname(filepath));

      // Load image (handles special formats)
      const loader = this._getImageLoader(filepath, extension);
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
   * Open image from buffer (for drag & drop, paste)
   * @param {Buffer} buffer - Image buffer
   * @param {string} filename - Filename with extension
   * @returns {Promise<{buffer: Buffer, info: Object, filename: string, extension: string, colors: string[]}>}
   */
  async openImageBuffer(buffer, filename) {
    try {
      const extension = path.extname(filename).replace(".", "");
      const name = path.basename(filename, path.extname(filename));

      // Load image (handles special formats)
      const loader = this._getBufferLoader(buffer, extension);
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
   * Get appropriate image loader based on file format (helper method)
   * @private
   */
  _getImageLoader(filepath, extension) {
    // Special format handlers
    if (["tiff", "tif"].includes(extension)) {
      return sharp(filepath).png();
    }
    if (extension === "ico") {
      return ico.sharpsFromIco(filepath)[0].png();
    }
    if (extension === "bmp") {
      return bmp.sharpFromBmp(filepath).png();
    }

    // Standard formats
    return sharp(filepath);
  }

  /**
   * Get appropriate buffer loader based on format (helper method)
   * @private
   */
  _getBufferLoader(buffer, extension) {
    // Special format handlers
    if (["tiff", "tif"].includes(extension)) {
      return sharp(buffer).png();
    }
    if (extension === "ico") {
      return ico.sharpsFromIco(buffer)[0].png();
    }
    if (extension === "bmp") {
      return bmp.sharpFromBmp(buffer).png();
    }

    // Standard formats
    return sharp(buffer);
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

  // --------------------------------------------------------------------------
  // COLOR EXTRACTION
  // --------------------------------------------------------------------------

  /**
   * Extract dominant colors from image
   * This is used to show color palette in UI
   *
   * @param {Buffer} buffer - Image buffer
   * @param {Object} info - Image info from sharp
   * @param {number} count - Number of colors to extract (default: 3)
   * @returns {Promise<string[]>} Array of hex color strings (e.g., ['#ff0000', '#00ff00', '#0000ff'])
   */
  async extractColors(buffer, info, count = 3) {
    try {
      // Step 1: Resize image to small size for faster processing
      const resizeWidth = info.width > 24 ? 24 : info.width;

      const result = await sharp(buffer)
        .resize({ width: resizeWidth })
        .toColorspace("srgb")
        .raw()
        .toBuffer({ resolveWithObject: true });

      const rawBuffer = result.data;
      const rawInfo = result.info;

      // Step 2: Count frequency of each color
      const colorFrequency = this._countColorFrequency(rawBuffer, rawInfo);

      // Step 3: Sort by frequency and get top N colors
      const topColors = this._getTopColors(colorFrequency, count);

      // Step 4: Convert RGB to hex format
      return this._convertToHexColors(topColors);
    } catch (error) {
      console.error("Color extraction failed:", error);
      return [];
    }
  }

  /**
   * Count frequency of each color in image (helper method)
   * @private
   */
  _countColorFrequency(rawBuffer, rawInfo) {
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

    return colors;
  }

  /**
   * Get top N most frequent colors (helper method)
   * @private
   */
  _getTopColors(colorFrequency, count) {
    return Object.entries(colorFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count);
  }

  /**
   * Convert RGB color strings to hex format (helper method)
   * @private
   */
  _convertToHexColors(topColors) {
    return topColors.map(([rgbString]) => {
      const [r, g, b] = rgbString.split(" ").map(Number);
      return `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    });
  }

  // --------------------------------------------------------------------------
  // TEMP FILE MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Create temporary file from buffer
   * Used for special format conversions (BMP, ICO)
   *
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
   * Should be called on application exit
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

// ============================================================================
// MODULE EXPORTS
// ============================================================================

// Create singleton instance
const imgKitMain = new ImgKitMain();

// Lazy load renderer to avoid circular dependency
let rendererModule;
function getRenderer() {
  if (!rendererModule) {
    rendererModule = require("./renderer.js");
  }
  return rendererModule;
}

// Export with lazy-loaded renderer components
// This Proxy pattern allows importing renderer components through main.js
// without causing circular dependency issues
module.exports = new Proxy(
  {
    // Backend (always available)
    ImgKitMain,
    imgKitMain,
  },
  {
    get(target, prop) {
      // Return backend exports directly
      if (prop in target) {
        return target[prop];
      }
      // Lazy load renderer exports when accessed
      const renderer = getRenderer();
      return renderer[prop];
    },
  }
);
