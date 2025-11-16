const { ipcRenderer } = require("electron");
// drawFlag is no longer used - mode management is handled through ImageMode system
document.getElementById("rectCropBtn").addEventListener("click", () => {
  ipcRenderer.send("rectCropImgREQ");
});
