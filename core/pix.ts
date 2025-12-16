import * as jsonfile from "jsonfile";
import sharp from "sharp";

interface PixData {
  width: number;
  height: number;
  channel: number;
  depth: number;
  hex_data: string;
  compression?: {
    method: string;
  };
  label?: any;
  joint?: any;
  data?: PixData;
}

export class Pix {
  static open(path: string): PixData | null {
    try {
      const data = jsonfile.readFileSync(path);
      return data;
    } catch (err) {
      console.error("Error reading pixData.json:", err);
      return null;
    }
  }

  static save(pixData: PixData, path: string): void {
    try {
      jsonfile.writeFileSync(path, pixData, { spaces: 2 });
    } catch (err) {
      console.error("Error writing pixData.json:", err);
    }
  }

  static openFromBuffer(buffer: Buffer | string): PixData | null {
    try {
      const text = Buffer.isBuffer(buffer) ? buffer.toString("utf-8") : buffer;
      return JSON.parse(text);
    } catch (err) {
      console.error("Error parsing pix buffer:", err);
      return null;
    }
  }

  static async toSharp(pixData: PixData): Promise<{ data: Buffer; info: sharp.OutputInfo } | null> {
    const payload = pixData?.data ?? pixData;
    const { width, height, channel, depth, hex_data } = payload;
    if (!width || !height || !hex_data) return null;

    const channels = channel ?? 4;
    const raw = Buffer.from(hex_data, "hex");
    const bytesPerPixel = Math.ceil(depth / 8) * channels;
    const expectedLength = width * height * bytesPerPixel;
    if (raw.length < expectedLength) raw.fill(0, raw.length, expectedLength);

    return sharp(raw, {
      raw: { width, height, channels, depth: depth ?? 8 },
    })
      .png()
      .toBuffer({ resolveWithObject: true });
  }

  static async toPix(buffer: Buffer, info: sharp.Metadata): Promise<PixData> {
    const { data, info: rawInfo } = await sharp(buffer)
      .raw()
      .toBuffer({ resolveWithObject: true });

    return {
      width: info.width!,
      height: info.height!,
      channel: info.channels!,
      depth: info.bitsPerSample || 8,
      compression: {
        method: "none",
      },
      hex_data: data.toString("hex"),
      label: {},
      joint: {},
    };
  }
}
