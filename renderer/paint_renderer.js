"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
let rgb = { r: "123", g: "123", b: "123" };
let drawFlagState = false;
let colorpickerActive = false;
const watermarkPreviewImg = document.getElementById("watermarkPreviewImg");
let padSize = 1;
let padColor = "#000000";
// Receive color from color picker
electron_1.ipcRenderer.on("colorpickerValueRECV", (event, color, color_name) => {
    if (!color)
        return;
    const colorpickerBox = document.getElementById("colorpickerBox");
    const colorpickerValue = document.getElementById("colorpickerValue");
    const colorpickerName = document.getElementById("colorpickerName");
    if (colorpickerBox)
        colorpickerBox.style.backgroundColor = color;
    if (colorpickerValue)
        colorpickerValue.textContent = color;
    if (colorpickerName)
        colorpickerName.textContent = color_name;
});
// Color copy on click
const colorpickerBox = document.getElementById("colorpickerBox");
colorpickerBox?.addEventListener("click", () => {
    const color = colorpickerBox.style.backgroundColor;
    if (color && color !== "empty") {
        navigator.clipboard.writeText(color).then(() => {
            // Send notification request to main window via IPC
            electron_1.ipcRenderer.send("showNotificationREQ", "imgkit-copy");
        });
    }
});
const drawBtn = document.getElementById("drawBtn");
drawBtn?.addEventListener("click", () => {
    drawFlagState = !drawFlagState;
    if (drawFlagState) {
        drawBtn.style.backgroundColor = "gray";
    }
    else {
        drawBtn.style.backgroundColor = "#efefef";
    }
    electron_1.ipcRenderer.send("drawImgREQ", drawFlagState);
});
const grayScaleBtn = document.getElementById("grayScaleBtn");
grayScaleBtn?.addEventListener("click", () => {
    electron_1.ipcRenderer.send("grayScaleImgREQ");
});
const tintExecuteBtn = document.getElementById("tintExecuteBtn");
tintExecuteBtn?.addEventListener("click", () => {
    electron_1.ipcRenderer.send("tintValueSEND", rgb);
});
const watermarkBtn = document.getElementById("watermarkBtn");
watermarkBtn?.addEventListener("click", () => {
    electron_1.ipcRenderer.send("watermarkImgREQ");
});
// Watermark upload button - trigger file input
const watermarkUploadBtn = document.getElementById("watermarkUploadBtn");
watermarkUploadBtn?.addEventListener("click", () => {
    const fileInput = document.getElementById("watermarkFileInput");
    fileInput?.click();
});
// Handle watermark file selection
const watermarkFileInput = document.getElementById("watermarkFileInput");
watermarkFileInput?.addEventListener("change", (event) => {
    const files = event.target.files;
    const file = files?.[0];
    if (file) {
        electron_1.ipcRenderer.send("watermarkUploadREQ", file.path);
        if (watermarkPreviewImg)
            watermarkPreviewImg.src = file.path;
        // Reset input so same file can be selected again
        event.target.value = "";
    }
});
const colorpickerBtn = document.getElementById("colorpickerBtn");
colorpickerBtn?.addEventListener("click", () => {
    colorpickerActive = !colorpickerActive;
    if (colorpickerActive) {
        colorpickerBtn.style.backgroundColor = "gray";
    }
    else {
        colorpickerBtn.style.backgroundColor = "#efefef";
    }
    electron_1.ipcRenderer.send("colorpickerImgREQ", colorpickerActive);
});
const redValue = document.getElementById("redValue");
redValue?.addEventListener("input", (event) => {
    rgb.r = event.target.value;
    updateTintBtnBackground(rgb);
});
const greenValue = document.getElementById("greenValue");
greenValue?.addEventListener("input", (event) => {
    rgb.g = event.target.value;
    updateTintBtnBackground(rgb);
});
const blueValue = document.getElementById("blueValue");
blueValue?.addEventListener("input", (event) => {
    rgb.b = event.target.value;
    updateTintBtnBackground(rgb);
});
const padValue = document.getElementById("padValue");
padValue?.addEventListener("input", (event) => {
    const parsed = Number(event.target.value);
    padSize = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
});
const padColorValue = document.getElementById("padColorValue");
padColorValue?.addEventListener("input", (event) => {
    padColor = event.target.value;
    const padColorBox = document.getElementById("padColorBox");
    if (padColorBox)
        padColorBox.style.backgroundColor = padColor;
});
const padBtn = document.getElementById("padBtn");
padBtn?.addEventListener("click", () => {
    electron_1.ipcRenderer.send("padImgREQ", padSize, padColor);
});
function updateTintBtnBackground(rgb) {
    const colorString = `#${parseInt(rgb.r, 10)
        .toString(16)
        .padStart(2, "0")}${parseInt(rgb.g, 10)
        .toString(16)
        .padStart(2, "0")}${parseInt(rgb.b, 10).toString(16).padStart(2, "0")}`;
    const tintBtn = document.getElementById("tintExecuteBtn");
    if (tintBtn)
        tintBtn.style.backgroundColor = colorString;
}
//# sourceMappingURL=paint_renderer.js.map