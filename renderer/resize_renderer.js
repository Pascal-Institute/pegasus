"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
let scale = 2;
let pixelSize = 256;
const resizeValue = document.getElementById("resizeValue");
resizeValue?.addEventListener("input", (event) => {
    scale = parseFloat(event.target.value);
});
const resizeExecuteBtn = document.getElementById("resizeExecuteBtn");
resizeExecuteBtn?.addEventListener("click", () => {
    electron_1.ipcRenderer.send("resizeValueSEND", scale);
});
const resizePixelValue = document.getElementById("resizePixelValue");
resizePixelValue?.addEventListener("input", (event) => {
    pixelSize = parseInt(event.target.value);
});
const resizePixelExecuteBtn = document.getElementById("resizePixelExecuteBtn");
resizePixelExecuteBtn?.addEventListener("click", () => {
    electron_1.ipcRenderer.send("resizePixelValueSEND", pixelSize);
});
//# sourceMappingURL=resize_renderer.js.map