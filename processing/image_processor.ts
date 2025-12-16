import sharp from "sharp";
import * as namer from "color-namer";
import { FormatConverter } from "./format_converter";

interface ProcessImageOptions {
  resize?: number;
  blur?: number;
  sharpen?: number;
  normalize?: boolean;
  median?: number;
  dilate?: number;
  erode?: number;
  extend?: sharp.ExtendOptions;
  flip?: boolean;
  flop?: boolean;
  rotate?: number;
  threshold?: number;
  negative?: boolean;
  grayscale?: boolean;
  tint?: sharp.Color;
  composite?: boolean;
  format?: string;
  extract?: sharp.Region;
}

interface ProcessImageResult {
  buffer: Buffer;
  info: sharp.OutputInfo;
}

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class ImageProcessor {
  private static filePath: string = "";

  // Delegate to FormatConverter
  static async convertFormat(buffer: Buffer, fromExt: string, toExt: string) {
    return FormatConverter.convert(buffer, fromExt, toExt);
  }

  static updateFileExtension(filepath: string, newExtension: string): string {
    return FormatConverter.updateFileExtension(filepath, newExtension);
  }

  static cleanupAllTempFiles(): void {
    FormatConverter.cleanupTempFiles();
  }

  static async applyWatermark(filePath: string): Promise<void> {
    this.filePath = filePath;
  }

  // Image Processing Operations (kept in ImageProcessor)
  static async processImage(buffer: Buffer, options: ProcessImageOptions = {}): Promise<ProcessImageResult> {
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

      if (options.extend) {
        pipeline = pipeline.extend(options.extend);
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

      if (options.threshold) {
        pipeline = pipeline.threshold(options.threshold);
      }

      if (options.negative) {
        pipeline = pipeline.negate(options.negative);
      }

      if (options.grayscale) {
        pipeline = pipeline.grayscale();
      }

      if (options.tint) {
        pipeline = pipeline.tint(options.tint);
      }

      if (options.composite) {
        const watermarkPath =
          this.filePath !== "" ? this.filePath : "./assets/icon.png";

        const watermark = await sharp(watermarkPath).resize(32, 32).toBuffer();

        pipeline = pipeline.composite([
          {
            input: watermark,
            gravity: "southeast",
          },
        ]);
      }

      // Apply format conversion if specified
      if (options.format) {
        pipeline = pipeline.toFormat(options.format as any);
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
    } catch (error: any) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Apply crop operation to image
   * Extract a rectangular region from the image
   *
   * @param buffer - Image buffer
   * @param imageInfo - Image metadata (width, height)
   * @param cropData - Crop selection area
   * @returns Promise with buffer and info
   */
  static async applyCrop(buffer: Buffer, imageInfo: sharp.Metadata, cropData: CropData): Promise<ProcessImageResult> {
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
      if (cropX + cropW > imageInfo.width!) {
        throw new Error(
          `Crop width (${cropW}) and x (${cropX}) exceed image width (${imageInfo.width})`
        );
      }
      if (cropY + cropH > imageInfo.height!) {
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
    } catch (error: any) {
      throw new Error(`Crop operation failed: ${error.message}`);
    }
  }

  // Color Extraction

  /**
   * Extract color from (x, y) position in image
   * This is used to show color palette in UI
   *
   * @param buffer - Image buffer
   * @param info - Image info from sharp
   * @param x - X coordinate of the pixel
   * @param y - Y coordinate of the pixel
   * @returns Hex color string (e.g., '#ff0000')
   */
  static async extractColorAt(buffer: Buffer, info: sharp.Metadata, x: number, y: number): Promise<string | null> {
    try {
      // Step 1: Validate coordinates
      if (x < 0 || y < 0 || x >= info.width! || y >= info.height!) {
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

  static async getColorName(hex: string): Promise<string> {
    const names = namer(hex);
    return names.ntc[0].name; // Using 'ntc' color names
  }

  /**
   * Extract dominant colors from image
   * This is used to show color palette in UI
   *
   * @param buffer - Image buffer
   * @param info - Image info from sharp
   * @param count - Number of colors to extract (default: 3)
   * @returns Array of hex color strings (e.g., ['#ff0000', '#00ff00', '#0000ff'])
   */
  static async extractColors(buffer: Buffer, info: sharp.Metadata, count: number = 3): Promise<string[]> {
    try {
      // Step 1: Resize image to small size for faster processing
      const resizeWidth = info.width! > 64 ? 64 : info.width!;

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
  private static _countColorFrequency(rawBuffer: Buffer, rawInfo: sharp.OutputInfo): Record<string, number> {
    const colors: Record<string, number> = {};
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

  private static _getTopColors(colorFrequency: Record<string, number>, count: number): [string, number][] {
    return Object.entries(colorFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count);
  }

  private static _convertToHexColors(topColors: [string, number][]): string[] {
    return topColors.map(([rgbString]) => {
      const [r, g, b] = rgbString.split(" ").map(Number);
      return `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    });
  }
}
