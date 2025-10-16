// ImageProcessor - Pure Image Processing Functions
// No dependencies on renderer, layer, or any UI components
// Only handles image manipulation using Sharp library
//
// This module provides pure functions for:
// - Opening images from files or buffers
// - Format conversion (PNG, JPG, BMP, ICO, etc.)
// - Resize, crop, blur, sharpen operations
// - Color extraction
// - File I/O operations

const sharp = require("sharp");
const bmp = require("sharp-bmp");
const ico = require("sharp-ico");
const fs = require("fs");
const path = require("path");
const os = require("os");
const namer = require("color-namer");

// ============================================================================
// IMAGE PROCESSOR CLASS
// ============================================================================
// Static class with pure image processing functions
// No state, no dependencies on UI components

class ImageProcessor {
  // Temporary file tracking (for cleanup)
  static tempFiles = [];

  // --------------------------------------------------------------------------
  // FILE I/O OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Open image from file path
   * @param {string} filepath - Path to image file
   * @returns {Promise<{buffer: Buffer, info: Object, filename: string, extension: string, colors: string[]}>}
   */
  static async openImage(filepath) {
    try {
      const extension = path.extname(filepath).replace(".", "");
      const filename = path.basename(filepath, path.extname(filepath));

      // Load image (handles special formats)
      const loader = ImageProcessor._getImageLoader(filepath, extension);
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

  /**
   * Open image from buffer (for drag & drop, paste)
   * @param {Buffer} buffer - Image buffer
   * @param {string} filename - Filename with extension
   * @returns {Promise<{buffer: Buffer, info: Object, filename: string, extension: string, colors: string[]}>}
   */
  static async openImageBuffer(buffer, filename) {
    try {
      const extension = path.extname(filename).replace(".", "");
      const name = path.basename(filename, path.extname(filename));

      // Load image (handles special formats)
      const loader = ImageProcessor._getBufferLoader(buffer, extension);
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

  /**
   * Save image buffer to file
   * @param {Buffer} buffer - Image buffer to save
   * @param {string} filepath - Destination file path
   * @returns {Promise<void>}
   */
  static async saveImage(buffer, filepath) {
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
  // IMAGE PROCESSING OPERATIONS
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
  static async processImage(buffer, options = {}) {
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

      // Apply normalize if specified
      if (options.normalize) {
        pipeline = pipeline.normalize(options.normalize);
      }

      // Apply median if specified
      if (options.median) {
        pipeline = pipeline.median(options.median);
      }

      // Apply dilate if specified
      if (options.dilate) {
        pipeline = pipeline.dilate(options.dilate);
      }

      // Apply erode if specified
      if (options.erode) {
        pipeline = pipeline.erode(options.erode);
      }

      // Apply flip if specified
      if (options.flip) {
        pipeline = pipeline.flip(options.flip);
      }

      // Apply flop if specified
      if (options.flop) {
        pipeline = pipeline.flop(options.flop);
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
  static async applyCrop(buffer, imageInfo, cropData) {
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
  static async convertFormat(buffer, fromExt, toExt) {
    try {
      // Special case: BMP format
      if (toExt === "bmp") {
        return await ImageProcessor._convertToBmp(buffer);
      }

      // Special case: ICO format
      if (toExt === "ico") {
        return await ImageProcessor._convertToIco(buffer);
      }

      // Standard formats (png, jpg, webp, etc.)
      return await ImageProcessor._convertToStandardFormat(buffer, toExt);
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
  static updateFileExtension(filepath, newExtension) {
    if (!filepath) return "";
    return filepath.replace(path.extname(filepath), `.${newExtension}`);
  }

  // --------------------------------------------------------------------------
  // COLOR EXTRACTION
  // --------------------------------------------------------------------------

  /**
   * Extract color from (x, y) position in image
   * This is used to show color palette in UI
   *
   * @param {Buffer} buffer - Image buffer
   * @param {Object} info - Image info from sharp
   * @param {number} x - X coordinate of the pixel
   * @param {number} y - Y coordinate of the pixel
   * @returns {Promise<string>} Hex color string (e.g., '#ff0000')
   */
  static async extractColorAt(buffer, info, x, y) {
    try {
      // Step 1: Validate coordinates
      if (x < 0 || y < 0 || x >= info.width || y >= info.height) {
        throw new Error(`Invalid coordinates: (${x}, ${y})`);
      }

      const result = await sharp(buffer)
        .toColorspace("srgb")
        .raw()
        .toBuffer({ resolveWithObject: true });

      const rawBuffer = result.data;
      const rawInfo = result.info;
      const channels = rawInfo.channels; // 3 for RGB, 4 for RGBA

      // Step 2: Get color value at (x, y) position
      const pixelIndex = (y * rawInfo.width + x) * channels;
      const r = rawBuffer[pixelIndex];
      const g = rawBuffer[pixelIndex + 1];
      const b = rawBuffer[pixelIndex + 2];
      const a = channels === 4 ? rawBuffer[pixelIndex + 3] : 255;

      // Step 3: Convert to hex format
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    } catch (error) {
      console.error("Color extraction failed:", error);
      return null;
    }
  }

  static async getColorName(hex) {
    const names = namer(hex);
    return names.ntc[0].name; // Using 'ntc' color names
  }

  /**
   * Extract dominant colors from image
   * This is used to show color palette in UI
   *
   * @param {Buffer} buffer - Image buffer
   * @param {Object} info - Image info from sharp
   * @param {number} count - Number of colors to extract (default: 3)
   * @returns {Promise<string[]>} Array of hex color strings (e.g., ['#ff0000', '#00ff00', '#0000ff'])
   */
  static async extractColors(buffer, info, count = 3) {
    try {
      // Step 1: Resize image to small size for faster processing
      const resizeWidth = info.width > 64 ? 64 : info.width;

      const result = await sharp(buffer)
        .resize({ width: resizeWidth })
        .toColorspace("srgb")
        .raw()
        .toBuffer({ resolveWithObject: true });

      const rawBuffer = result.data;
      const rawInfo = result.info;

      // Step 2: Count frequency of each color
      const colorFrequency = ImageProcessor._countColorFrequency(
        rawBuffer,
        rawInfo
      );

      // Step 3: Sort by frequency and get top N colors
      const topColors = ImageProcessor._getTopColors(colorFrequency, count);

      // Step 4: Convert RGB to hex format
      return ImageProcessor._convertToHexColors(topColors);
    } catch (error) {
      console.error("Color extraction failed:", error);
      return [];
    }
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
  static createTempFileFromBuffer(buffer, filename) {
    const tempPath = path.join(os.tmpdir(), filename);
    fs.writeFileSync(tempPath, buffer);
    ImageProcessor.tempFiles.push(tempPath);
    return tempPath;
  }

  /**
   * Cleanup specific temporary file
   * @param {string} filepath - Path to temporary file
   */
  static cleanupTempFile(filepath) {
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        ImageProcessor.tempFiles = ImageProcessor.tempFiles.filter(
          (f) => f !== filepath
        );
      }
    } catch (error) {
      console.error("Temp file cleanup failed:", error);
    }
  }

  /**
   * Cleanup all temporary files
   * Should be called on application exit
   */
  static cleanupAllTempFiles() {
    ImageProcessor.tempFiles.forEach((filepath) => {
      try {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      } catch (error) {
        console.error("Temp file cleanup failed:", error);
      }
    });
    ImageProcessor.tempFiles = [];
  }

  // --------------------------------------------------------------------------
  // PRIVATE HELPER METHODS
  // --------------------------------------------------------------------------

  /**
   * Get appropriate image loader based on file format
   * @private
   */
  static _getImageLoader(filepath, extension) {
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
   * Get appropriate buffer loader based on format
   * @private
   */
  static _getBufferLoader(buffer, extension) {
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
   * Convert image to BMP format
   * @private
   */
  static async _convertToBmp(buffer) {
    const tempPath = ImageProcessor.createTempFileFromBuffer(
      buffer,
      `temp.bmp`
    );
    await bmp.sharpToBmp(sharp(buffer), tempPath);
    const resultBuffer = await fs.promises.readFile(tempPath);

    // Convert to PNG for preview
    const pngResult = await sharp(resultBuffer)
      .png()
      .toBuffer({ resolveWithObject: true });

    return { buffer: pngResult.data, info: pngResult.info };
  }

  /**
   * Convert image to ICO format
   * @private
   */
  static async _convertToIco(buffer) {
    const tempPath = ImageProcessor.createTempFileFromBuffer(
      buffer,
      `temp.ico`
    );
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
   * Convert image to standard format
   * @private
   */
  static async _convertToStandardFormat(buffer, format) {
    const result = await sharp(buffer)
      .toFormat(format)
      .toBuffer({ resolveWithObject: true });

    return { buffer: result.data, info: result.info };
  }

  /**
   * Count frequency of each color in image
   * @private
   */
  static _countColorFrequency(rawBuffer, rawInfo) {
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
   * Get top N most frequent colors
   * @private
   */
  static _getTopColors(colorFrequency, count) {
    return Object.entries(colorFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count);
  }

  /**
   * Convert RGB color strings to hex format
   * @private
   */
  static _convertToHexColors(topColors) {
    return topColors.map(([rgbString]) => {
      const [r, g, b] = rgbString.split(" ").map(Number);
      return `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    });
  }
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = { ImageProcessor };
