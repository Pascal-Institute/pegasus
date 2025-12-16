import sharp from "sharp";
import * as bmp from "sharp-bmp";
import * as ico from "sharp-ico";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Pix } from "../core/pix";

interface ConversionResult {
  buffer: Buffer;
  info: sharp.Metadata;
  svgData?: string;
}

export class FormatConverter {
  private static tempFiles: string[] = [];

  static async convert(buffer: Buffer, fromExt: string, toExt: string): Promise<ConversionResult> {
    try {
      if (toExt === "svg") {
        return await FormatConverter.convertToSvg(buffer);
      }
      if (toExt === "bmp") {
        return await FormatConverter.convertToBmp(buffer);
      }
      if (toExt === "ico") {
        return await FormatConverter.convertToIco(buffer);
      }
      if (toExt === "pix") {
        return await FormatConverter.convertToPix(buffer);
      }
      if (toExt === "heif" || toExt === "heic") {
        return await FormatConverter.convertToHeif(buffer);
      }
      return await FormatConverter.convertToStandard(buffer, toExt);
    } catch (error: any) {
      throw new Error(`Format conversion failed: ${error.message}`);
    }
  }

  static async convertToBmp(buffer: Buffer): Promise<ConversionResult> {
    const tempPath = FormatConverter.createTempFile(buffer, "temp.bmp");
    await bmp.sharpToBmp(sharp(buffer), tempPath);
    const resultBuffer = await fs.promises.readFile(tempPath);
    const pngResult = await sharp(resultBuffer)
      .png()
      .toBuffer({ resolveWithObject: true });
    return { buffer: pngResult.data, info: pngResult.info as any };
  }

  static async convertToSvg(buffer: Buffer): Promise<ConversionResult> {
    const metadata = await sharp(buffer).metadata();
    const pngBuffer = await sharp(buffer).png().toBuffer();
    const base64Data = pngBuffer.toString("base64");
    const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${metadata.width}" height="${metadata.height}" 
     xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     version="1.1">
  <title>Converted Image</title>
  <image width="${metadata.width}" height="${metadata.height}" 
         xlink:href="data:image/png;base64,${base64Data}"/>
</svg>`;
    return { buffer: pngBuffer, info: metadata as any, svgData: svgContent };
  }

  static async convertToIco(buffer: Buffer): Promise<ConversionResult> {
    const tempPath = FormatConverter.createTempFile(buffer, "temp.ico");
    await ico.sharpsToIco([sharp(buffer)], tempPath);
    const resultBuffer = await fs.promises.readFile(tempPath);
    const sharpList = ico.sharpsFromIco(resultBuffer);
    const pngResult = await (sharpList[0] as any)
      .png()
      .toBuffer({ resolveWithObject: true });
    return { buffer: pngResult.data, info: pngResult.info as any };
  }

  static async convertToPix(buffer: Buffer): Promise<ConversionResult> {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });
    const hexData = data.toString("hex");
    const pixData = {
      width: info.width,
      height: info.height,
      channel: info.channels,
      depth: (info as any).bitsPerSample || 8,
      hex_data: hexData,
    };

    const pngResult = await Pix.toSharp(pixData);

    return { buffer: pngResult!.data, info: metadata as any };
  }

  static async convertToHeif(buffer: Buffer): Promise<ConversionResult> {
    const result = await sharp(buffer)
      .heif({ quality: 80, compression: "av1" })
      .toBuffer({ resolveWithObject: true });
    return { buffer: result.data, info: result.info as any };
  }

  static async convertToStandard(buffer: Buffer, format: string): Promise<ConversionResult> {
    const result = await sharp(buffer)
      .toFormat(format as any)
      .toBuffer({ resolveWithObject: true });
    return { buffer: result.data, info: result.info as any };
  }

  static createTempFile(buffer: Buffer, filename: string): string {
    const tempPath = path.join(os.tmpdir(), filename);
    fs.writeFileSync(tempPath, buffer);
    FormatConverter.tempFiles.push(tempPath);
    return tempPath;
  }

  static cleanupTempFiles(): void {
    FormatConverter.tempFiles.forEach((file) => {
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch (error) {
        console.error("Temp file cleanup failed:", error);
      }
    });
    FormatConverter.tempFiles = [];
  }

  static updateFileExtension(filepath: string, newExtension: string): string {
    if (!filepath) return "";
    return filepath.replace(path.extname(filepath), `.${newExtension}`);
  }
}
