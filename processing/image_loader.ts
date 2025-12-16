import sharp from "sharp";
import * as bmp from "sharp-bmp";
import * as ico from "sharp-ico";
import * as fs from "fs";
import * as path from "path";
import { Pix } from "../core/pix";

interface ImageData {
  buffer: Buffer;
  info: sharp.Metadata;
  filename: string;
  extension: string;
  gifMetadata: sharp.Metadata | null;
}

export class ImageLoader {
  static async openImage(filepath: string): Promise<ImageData> {
    try {
      const extension = path.extname(filepath).replace(".", "");
      const filename = path.basename(filepath, path.extname(filepath));

      if (extension === "pix") {
        const pixData = Pix.open(filepath);
        if (!pixData) throw new Error("Invalid PIX data");
        const result = await Pix.toSharp(pixData);
        if (!result) throw new Error("Failed to convert PIX data");
        return { buffer: result.data, info: result.info, filename, extension, gifMetadata: null };
      }

      let gifMetadata: sharp.Metadata | null = null;
      if (extension === "gif") {
        try {
          gifMetadata = await sharp(filepath, { animated: true }).metadata();
        } catch (error) {
          console.warn("Failed to read GIF metadata:", error);
        }
      }

      const loader = ImageLoader.getImageLoader(filepath, extension);
      const result = await loader.toBuffer({ resolveWithObject: true });
      return {
        buffer: result.data,
        info: result.info,
        filename,
        extension,
        gifMetadata,
      };
    } catch (error: any) {
      throw new Error(`Failed to open image: ${error.message}`);
    }
  }

  static async openImageBuffer(buffer: Buffer, filename: string): Promise<ImageData> {
    try {
      const extension = path.extname(filename).replace(".", "");
      const name = path.basename(filename, path.extname(filename));

      if (extension === "pix") {
        const pixData = Pix.openFromBuffer(buffer);
        if (!pixData) throw new Error("Invalid PIX buffer");
        const result = await Pix.toSharp(pixData);
        if (!result) throw new Error("Failed to convert PIX buffer");
        return {
          buffer: result.data,
          info: result.info,
          filename: name,
          extension,
          gifMetadata: null,
        };
      }

      let gifMetadata: sharp.Metadata | null = null;
      if (extension === "gif") {
        try {
          gifMetadata = await sharp(buffer, { animated: true }).metadata();
        } catch (error) {
          console.warn("Failed to read GIF metadata from buffer:", error);
        }
      }

      const loader = ImageLoader.getBufferLoader(buffer, extension);
      const result = await loader.toBuffer({ resolveWithObject: true });
      return {
        buffer: result.data,
        info: result.info,
        filename: name,
        extension,
        gifMetadata,
      };
    } catch (error: any) {
      throw new Error(`Failed to open image buffer: ${error.message}`);
    }
  }

  static async saveImage(buffer: Buffer | string, filepath: string): Promise<void> {
    try {
      let saveBuffer: Buffer = buffer as Buffer;
      if (buffer.toString().startsWith("data:image")) {
        const base64Data = buffer
          .toString()
          .replace(/^data:image\/\w+;base64,/, "");
        saveBuffer = Buffer.from(base64Data, "base64");
      }
      await fs.promises.writeFile(filepath, saveBuffer);
    } catch (error: any) {
      throw new Error(`Failed to save image: ${error.message}`);
    }
  }

  static getImageLoader(filepath: string, extension: string): sharp.Sharp {
    if (extension === "pix") {
      const pixData = Pix.open(filepath);
      return Pix.toSharp(pixData!) as any;
    }
    if (["tiff", "tif"].includes(extension)) {
      return sharp(filepath).png();
    }
    if (extension === "ico") {
      return ico.sharpsFromIco(filepath)[0].png();
    }
    if (extension === "bmp") {
      return bmp.sharpFromBmp(filepath).png();
    }
    if (extension === "gif") {
      // For GIF, extract first frame as PNG
      return sharp(filepath, { page: 0 }).png();
    }
    return sharp(filepath);
  }

  static getBufferLoader(buffer: Buffer, extension: string): sharp.Sharp {
    if (extension === "pix") {
      const pixData = Pix.openFromBuffer(buffer);
      return Pix.toSharp(pixData!) as any;
    }
    if (["tiff", "tif"].includes(extension)) {
      return sharp(buffer).png();
    }
    if (extension === "ico") {
      return ico.sharpsFromIco(buffer)[0].png();
    }
    if (extension === "bmp") {
      return bmp.sharpFromBmp(buffer).png();
    }
    if (extension === "gif") {
      // For GIF, extract first frame as PNG
      return sharp(buffer, { page: 0 }).png();
    }
    return sharp(buffer);
  }

  /**
   * Extract a specific frame from an animated GIF
   * @param input - GIF buffer or file path
   * @param frameIndex - Frame index to extract (0-based)
   * @returns Promise with buffer and info
   */
  static async extractGifFrame(
    input: Buffer | string,
    frameIndex: number
  ): Promise<{ buffer: Buffer; info: sharp.OutputInfo }> {
    try {
      const result = await sharp(input as any, { page: frameIndex })
        .png()
        .toBuffer({ resolveWithObject: true });
      return {
        buffer: result.data,
        info: result.info,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to extract GIF frame ${frameIndex}: ${error.message}`
      );
    }
  }
}
