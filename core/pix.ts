import * as jsonfile from "jsonfile";
import sharp from "sharp";

/**
 * Pix data structure for custom .pix format
 */
export interface PixData {
  width: number;
  height: number;
  channel: number;
  depth: number;
  compression: {
    method: string;
  };
  hex_data: string;
  label: Record<string, any>;
  joint: Record<string, any>;
}

/**
 * Pix wrapper structure (may contain data property)
 */
export interface PixWrapper {
  data?: PixData;
  width?: number;
  height?: number;
  channel?: number;
  depth?: number;
  hex_data?: string;
}

/**
 * Pix class - Handles reading/writing custom .pix image format
 */
export class Pix {
  /**
   * Open a .pix file from disk
   * @param path - File path to read from
   * @returns Parsed pix data or null on error
   */
  static open(path: string): PixData | null {
    try {
      const data = jsonfile.readFileSync(path);
      return data;
    } catch (err) {
      console.error("Error reading pixData.json:", err);
      return null;
    }
  }

  /**
   * Save pix data to disk
   * @param pixData - Pix data to save
   * @param path - File path to save to
   */
  static save(pixData: PixData, path: string): void {
    try {
      jsonfile.writeFileSync(path, pixData, { spaces: 2 });
    } catch (err) {
      console.error("Error writing pixData.json:", err);
    }
  }

  /**
   * Parse pix data from buffer
   * @param buffer - Buffer or string containing pix JSON data
   * @returns Parsed pix data or null on error
   */
  static openFromBuffer(buffer: Buffer | string): PixData | null {
    try {
      const text = Buffer.isBuffer(buffer) ? buffer.toString("utf-8") : buffer;
      return JSON.parse(text);
    } catch (err) {
      console.error("Error parsing pix buffer:", err);
      return null;
    }
  }

  /**
   * Convert pix data to Sharp buffer
   * @param pixData - Pix data to convert
   * @returns Sharp buffer with metadata or null on error
   */
  static async toSharp(
    pixData: PixWrapper
  ): Promise<{ data: Buffer; info: sharp.OutputInfo } | null> {
    const payload = pixData?.data ?? pixData;
    const { width, height, channel, depth, hex_data } = payload;
    if (!width || !height || !hex_data) return null;

    const channels = (channel ?? 4) as 1 | 2 | 3 | 4;
    const raw = Buffer.from(hex_data, "hex");
    const bytesPerPixel = Math.ceil((depth ?? 8) / 8) * channels;
    const expectedLength = width * height * bytesPerPixel;
    if (raw.length < expectedLength) raw.fill(0, raw.length, expectedLength);

    return sharp(raw, {
      raw: { width, height, channels },
    })
      .png()
      .toBuffer({ resolveWithObject: true });
  }

  /**
   * Convert image buffer to pix format
   * @param buffer - Image buffer to convert
   * @param info - Image metadata
   * @returns Pix data structure
   */
  static async toPix(buffer: Buffer, info: sharp.Metadata): Promise<PixData> {
    const { data, info: rawInfo } = await sharp(buffer)
      .raw()
      .toBuffer({ resolveWithObject: true });

    return {
      width: info.width!,
      height: info.height!,
      channel: info.channels!,
      depth: (info as any).bitsPerSample || 8,
      compression: {
        method: "none",
      },
      hex_data: data.toString("hex"),
      label: {},
      joint: {},
    };
  }
}

