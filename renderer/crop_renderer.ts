import { ipcRenderer } from "electron";
// drawFlag is no longer used - mode management is handled through ImageMode system
const rectCropBtn = document.getElementById("rectCropBtn");
rectCropBtn?.addEventListener("click", () => {
  ipcRenderer.send("rectCropImgREQ");
});
