// ImageProcessor - Pure Image Processing Functions
// Handles image processing operations (resize, crop, color extraction)
// No longer handles file I/O - use ImageLoader directly for that

const sharp = require("sharp");
const namer = require("color-namer");
const { FormatConverter } = require("./format_converter");

class ImageProcessor {
  // Delegate to FormatConverter
  static async convertFormat(buffer, fromExt, toExt) {
    return FormatConverter.convert(buffer, fromExt, toExt);
  }

  static updateFileExtension(filepath, newExtension) {
    return FormatConverter.updateFileExtension(filepath, newExtension);
  }

  static cleanupAllTempFiles() {
    FormatConverter.cleanupTempFiles();
  }

  // Image Processing Operations (kept in ImageProcessor)
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

      if (options.rotate) {
        pipeline = pipeline.rotate(options.rotate);
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

  // Color Extraction

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

  // Private Helper Methods for Color Extraction
  static _countColorFrequency(rawBuffer, rawInfo) {
    const colors = {};
    const channels = rawInfo.channels;
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

  static _getTopColors(colorFrequency, count) {
    return Object.entries(colorFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count);
  }

  static _convertToHexColors(topColors) {
    return topColors.map(([rgbString]) => {
      const [r, g, b] = rgbString.split(" ").map(Number);
      return `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    });
  }
}

module.exports = { ImageProcessor };
