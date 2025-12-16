"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
let blurValue = 1.0;
let sharpenValue = 1.0;
let medianValue = 5;
let bitwiseValue = 128;
const blurValueInput = document.getElementById("blurValue");
blurValueInput?.addEventListener("input", (event) => {
    blurValue = parseFloat(event.target.value);
});
const blurBtn = document.getElementById("blurBtn");
blurBtn?.addEventListener("click", () => {
    electron_1.ipcRenderer.send("blurValueSEND", Number(blurValue));
});
const sharpenValueInput = document.getElementById("sharpenValue");
sharpenValueInput?.addEventListener("input", (event) => {
    sharpenValue = parseFloat(event.target.value);
});
const sharpenBtn = document.getElementById("sharpenBtn");
sharpenBtn?.addEventListener("click", () => {
    electron_1.ipcRenderer.send("sharpenValueSEND", Number(sharpenValue));
});
const medianValueInput = document.getElementById("medianValue");
medianValueInput?.addEventListener("input", (event) => {
    medianValue = parseInt(event.target.value);
});
const medianBtn = document.getElementById("medianBtn");
medianBtn?.addEventListener("click", () => {
    electron_1.ipcRenderer.send("medianValueSEND", Number(medianValue));
});
const bitwiseValueInput = document.getElementById("bitwiseValue");
bitwiseValueInput?.addEventListener("input", (event) => {
    bitwiseValue = parseInt(event.target.value);
});
const bitwiseBtn = document.getElementById("bitwiseBtn");
bitwiseBtn?.addEventListener("click", () => {
    electron_1.ipcRenderer.send("bitwiseValueSEND", Number(bitwiseValue));
});
const negativeBtn = document.getElementById("negativeBtn");
negativeBtn?.addEventListener("click", () => {
    electron_1.ipcRenderer.send("negativeImgREQ");
});
const normalizeBtn = document.getElementById("normalizeBtn");
normalizeBtn?.addEventListener("click", () => {
    electron_1.ipcRenderer.send("normalizeImgREQ");
});
const dilateBtn = document.getElementById("dilateBtn");
dilateBtn?.addEventListener("click", () => {
    electron_1.ipcRenderer.send("dilateValueSEND", Number(1));
});
const erodeBtn = document.getElementById("erodeBtn");
erodeBtn?.addEventListener("click", () => {
    electron_1.ipcRenderer.send("erodeValueSEND", Number(1));
});
//# sourceMappingURL=filter_renderer.js.map