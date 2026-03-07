// @ts-nocheck
// FormatConverter - Image Format Conversion
const sharp = require("sharp");
const bmp = require("sharp-bmp");
const ico = require("sharp-ico");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { Pix } = require("../core/pix");

class FormatConverter {
  static tempFiles = [];

  static async convert(buffer, fromExt, toExt) {
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
    } catch (error) {
      throw new Error(`Format conversion failed: ${error.message}`);
    }
  }

  static async convertToBmp(buffer) {
    const tempPath = FormatConverter.createTempFile(buffer, "temp.bmp");
    await bmp.sharpToBmp(sharp(buffer), tempPath);
    const resultBuffer = await fs.promises.readFile(tempPath);
    const pngResult = await sharp(resultBuffer)
      .png()
      .toBuffer({ resolveWithObject: true });
    return { buffer: pngResult.data, info: pngResult.info };
  }

  static async convertToSvg(buffer) {
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
    return { buffer: pngBuffer, info: metadata, svgData: svgContent };
  }

  static async convertToIco(buffer) {
    const tempPath = FormatConverter.createTempFile(buffer, "temp.ico");
    await ico.sharpsToIco([sharp(buffer)], tempPath);
    const resultBuffer = await fs.promises.readFile(tempPath);
    const sharpList = ico.sharpsFromIco(resultBuffer);
    const pngResult = await sharpList[0]
      .png()
      .toBuffer({ resolveWithObject: true });
    return { buffer: pngResult.data, info: pngResult.info };
  }

  static async convertToPix(buffer) {
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
      depth: info.bitsPerSample || 8,
      hex_data: hexData,
    };

    const pngResult = await Pix.toSharp(pixData);

    return { buffer: pngResult.data, info: metadata };
  }

  static async convertToHeif(buffer) {
    const result = await sharp(buffer)
      .heif({ quality: 80, compression: "av1" })
      .toBuffer({ resolveWithObject: true });
    return { buffer: result.data, info: result.info };
  }

  static async convertToStandard(buffer, format) {
    const result = await sharp(buffer)
      .toFormat(format)
      .toBuffer({ resolveWithObject: true });
    return { buffer: result.data, info: result.info };
  }

  static createTempFile(buffer, filename) {
    const tempPath = path.join(os.tmpdir(), filename);
    fs.writeFileSync(tempPath, buffer);
    FormatConverter.tempFiles.push(tempPath);
    return tempPath;
  }

  static cleanupTempFiles() {
    FormatConverter.tempFiles.forEach((file) => {
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch (error) {
        console.error("Temp file cleanup failed:", error);
      }
    });
    FormatConverter.tempFiles = [];
  }

  static updateFileExtension(filepath, newExtension) {
    if (!filepath) return "";
    return filepath.replace(path.extname(filepath), `.${newExtension}`);
  }
}

module.exports = { FormatConverter };
