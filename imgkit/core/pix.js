const jsonfile = require("jsonfile");
const sharp = require("sharp");

class PIX {
  static open(path) {
    try {
      const data = jsonfile.readFileSync(path);
      return data;
    } catch (err) {
      console.error("Error reading pixData.json:", err);
      return null;
    }
  }

  static save(pixData, path) {
    try {
      jsonfile.writeFileSync(path, pixData, { spaces: 2 });
    } catch (err) {
      console.error("Error writing pixData.json:", err);
    }
  }

  static openFromBuffer(buffer) {
    try {
      const text = Buffer.isBuffer(buffer) ? buffer.toString("utf-8") : buffer;
      return JSON.parse(text);
    } catch (err) {
      console.error("Error parsing pix buffer:", err);
      return null;
    }
  }

  static async toSharpBuffer(pixData) {
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

  static async toPIX(buffer, info) {
    const { data, info: rawInfo } = await sharp(buffer)
      .raw()
      .toBuffer({ resolveWithObject: true });

    return {
      width: info.width,
      height: info.height,
      channel: info.channels,
      depth: info.bitsPerSample || 8,
      hex_data: data.toString("hex"),
    };
  }
}

module.exports = {
  PIX,
};
