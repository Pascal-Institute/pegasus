import { ipcRenderer } from "electron";

interface RGB {
  r: string;
  g: string;
  b: string;
}

let rgb: RGB = { r: "123", g: "123", b: "123" };
let drawFlagState: boolean = false;
let colorpickerActive: boolean = false;
const watermarkPreviewImg = document.getElementById("watermarkPreviewImg") as HTMLImageElement;
let padSize: number = 1;
let padColor: string = "#000000";

// Receive color from color picker
ipcRenderer.on("colorpickerValueRECV", (event, color: string, color_name: string) => {
  if (!color) return;
  const colorpickerBox = document.getElementById("colorpickerBox");
  const colorpickerValue = document.getElementById("colorpickerValue");
  const colorpickerName = document.getElementById("colorpickerName");
  
  if (colorpickerBox) (colorpickerBox as HTMLElement).style.backgroundColor = color;
  if (colorpickerValue) colorpickerValue.textContent = color;
  if (colorpickerName) colorpickerName.textContent = color_name;
});

// Color copy on click
const colorpickerBox = document.getElementById("colorpickerBox");
colorpickerBox?.addEventListener("click", () => {
  const color = (colorpickerBox as HTMLElement).style.backgroundColor;
  if (color && color !== "empty") {
    navigator.clipboard.writeText(color).then(() => {
      // Send notification request to main window via IPC
      ipcRenderer.send("showNotificationREQ", "imgkit-copy");
    });
  }
});

const drawBtn = document.getElementById("drawBtn");
drawBtn?.addEventListener("click", () => {
  drawFlagState = !drawFlagState;

  if (drawFlagState) {
    (drawBtn as HTMLElement).style.backgroundColor = "gray";
  } else {
    (drawBtn as HTMLElement).style.backgroundColor = "#efefef";
  }

  ipcRenderer.send("drawImgREQ", drawFlagState);
});

const grayScaleBtn = document.getElementById("grayScaleBtn");
grayScaleBtn?.addEventListener("click", () => {
  ipcRenderer.send("grayScaleImgREQ");
});

const tintExecuteBtn = document.getElementById("tintExecuteBtn");
tintExecuteBtn?.addEventListener("click", () => {
  ipcRenderer.send("tintValueSEND", rgb);
});

const watermarkBtn = document.getElementById("watermarkBtn");
watermarkBtn?.addEventListener("click", () => {
  ipcRenderer.send("watermarkImgREQ");
});

// Watermark upload button - trigger file input
const watermarkUploadBtn = document.getElementById("watermarkUploadBtn");
watermarkUploadBtn?.addEventListener("click", () => {
  const fileInput = document.getElementById("watermarkFileInput") as HTMLInputElement;
  fileInput?.click();
});

// Handle watermark file selection
const watermarkFileInput = document.getElementById("watermarkFileInput") as HTMLInputElement;
watermarkFileInput?.addEventListener("change", (event) => {
  const files = (event.target as HTMLInputElement).files;
  const file = files?.[0];
  if (file) {
    ipcRenderer.send("watermarkUploadREQ", (file as any).path);
    if (watermarkPreviewImg) watermarkPreviewImg.src = (file as any).path;
    // Reset input so same file can be selected again
    (event.target as HTMLInputElement).value = "";
  }
});

const colorpickerBtn = document.getElementById("colorpickerBtn");
colorpickerBtn?.addEventListener("click", () => {
  colorpickerActive = !colorpickerActive;
  if (colorpickerActive) {
    (colorpickerBtn as HTMLElement).style.backgroundColor = "gray";
  } else {
    (colorpickerBtn as HTMLElement).style.backgroundColor = "#efefef";
  }
  ipcRenderer.send("colorpickerImgREQ", colorpickerActive);
});

const redValue = document.getElementById("redValue") as HTMLInputElement;
redValue?.addEventListener("input", (event) => {
  rgb.r = (event.target as HTMLInputElement).value;
  updateTintBtnBackground(rgb);
});

const greenValue = document.getElementById("greenValue") as HTMLInputElement;
greenValue?.addEventListener("input", (event) => {
  rgb.g = (event.target as HTMLInputElement).value;
  updateTintBtnBackground(rgb);
});

const blueValue = document.getElementById("blueValue") as HTMLInputElement;
blueValue?.addEventListener("input", (event) => {
  rgb.b = (event.target as HTMLInputElement).value;
  updateTintBtnBackground(rgb);
});

const padValue = document.getElementById("padValue") as HTMLInputElement;
padValue?.addEventListener("input", (event) => {
  const parsed = Number((event.target as HTMLInputElement).value);
  padSize = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
});

const padColorValue = document.getElementById("padColorValue") as HTMLInputElement;
padColorValue?.addEventListener("input", (event) => {
  padColor = (event.target as HTMLInputElement).value;
  const padColorBox = document.getElementById("padColorBox");
  if (padColorBox) (padColorBox as HTMLElement).style.backgroundColor = padColor;
});

const padBtn = document.getElementById("padBtn");
padBtn?.addEventListener("click", () => {
  ipcRenderer.send("padImgREQ", padSize, padColor);
});

function updateTintBtnBackground(rgb: RGB): void {
  const colorString = `#${parseInt(rgb.r, 10)
    .toString(16)
    .padStart(2, "0")}${parseInt(rgb.g, 10)
    .toString(16)
    .padStart(2, "0")}${parseInt(rgb.b, 10).toString(16).padStart(2, "0")}`;
  const tintBtn = document.getElementById("tintExecuteBtn");
  if (tintBtn) (tintBtn as HTMLElement).style.backgroundColor = colorString;
}
