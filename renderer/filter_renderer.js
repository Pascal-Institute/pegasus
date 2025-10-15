const { ipcRenderer } = require("electron");

var blurValue = 1.0;
var sharpenValue = 1.0;
var medianValue = 5;

document.getElementById("blurValue").addEventListener("input", (event) => {
  blurValue = event.target.value;
});

document.getElementById("blurBtn").addEventListener("click", () => {
  ipcRenderer.send("blurValueSEND", Number(blurValue));
});

document.getElementById("sharpenValue").addEventListener("input", (event) => {
  sharpenValue = event.target.value;
});

document.getElementById("sharpenBtn").addEventListener("click", () => {
  ipcRenderer.send("sharpenValueSEND", Number(sharpenValue));
});

document.getElementById("medianValue").addEventListener("input", (event) => {
  medianValue = event.target.value;
});

document.getElementById("medianBtn").addEventListener("click", () => {
  ipcRenderer.send("medianValueSEND", Number(medianValue));
});

document.getElementById("bitwiseBtn").addEventListener("click", () => {
  ipcRenderer.send("bitwiseImgREQ");
});

document.getElementById("negativeBtn").addEventListener("click", () => {
  ipcRenderer.send("negativeImgREQ");
});

document.getElementById("normalizeBtn").addEventListener("click", () => {
  ipcRenderer.send("normalizeImgREQ");
});

document.getElementById("dilateBtn").addEventListener("click", () => {
  ipcRenderer.send("dilateValueSEND", Number(1));
});
