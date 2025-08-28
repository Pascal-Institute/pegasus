const { ipcRenderer } = require("electron");

var scale = 2;

document.getElementById("resizeValue").addEventListener("input", (event) => {
  scale = event.target.value;
});

document.getElementById("resizeExecuteBtn").addEventListener("click", () => {
  ipcRenderer.send("resizeValueSEND", scale);
});