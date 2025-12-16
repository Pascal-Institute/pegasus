import { ipcRenderer } from "electron";

let scale: number = 2;
let pixelSize: number = 256;

const resizeValue = document.getElementById("resizeValue") as HTMLInputElement;
resizeValue?.addEventListener("input", (event) => {
  scale = parseFloat((event.target as HTMLInputElement).value);
});

const resizeExecuteBtn = document.getElementById("resizeExecuteBtn");
resizeExecuteBtn?.addEventListener("click", () => {
  ipcRenderer.send("resizeValueSEND", scale);
});

const resizePixelValue = document.getElementById("resizePixelValue") as HTMLInputElement;
resizePixelValue?.addEventListener("input", (event) => {
  pixelSize = parseInt((event.target as HTMLInputElement).value);
});

const resizePixelExecuteBtn = document.getElementById("resizePixelExecuteBtn");
resizePixelExecuteBtn?.addEventListener("click", () => {
  ipcRenderer.send("resizePixelValueSEND", pixelSize);
});
