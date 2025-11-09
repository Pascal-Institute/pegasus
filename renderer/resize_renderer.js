const { ipcRenderer } = require("electron");

var scale = 2;
var pixelSize = 256;

document.getElementById("resizeValue").addEventListener("input", (event) => {
  scale = event.target.value;
});

document.getElementById("resizeExecuteBtn").addEventListener("click", () => {
  ipcRenderer.send("resizeValueSEND", scale);
});

document
  .getElementById("resizePixelValue")
  .addEventListener("input", (event) => {
    pixelSize = event.target.value;
  });

document
  .getElementById("resizePixelExecuteBtn")
  .addEventListener("click", () => {
    ipcRenderer.send("resizePixelValueSEND", pixelSize);
  });
