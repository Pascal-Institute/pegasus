"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// drawFlag is no longer used - mode management is handled through ImageMode system
const rectCropBtn = document.getElementById("rectCropBtn");
rectCropBtn?.addEventListener("click", () => {
    electron_1.ipcRenderer.send("rectCropImgREQ");
});
//# sourceMappingURL=crop_renderer.js.map