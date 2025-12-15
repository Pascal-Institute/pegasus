// @ts-nocheck
import { ipcRenderer } from "electron";

var degree = 45;

document.getElementById("flipBtn").addEventListener("click", () => {
  ipcRenderer.send("flipImgREQ");
});

document.getElementById("flopBtn").addEventListener("click", () => {
  ipcRenderer.send("flopImgREQ");
});

document.getElementById("rotateLeftBtn").addEventListener("click", () => {
  ipcRenderer.send("rotateLeftImgREQ");
});

document.getElementById("rotateRightBtn").addEventListener("click", () => {
  ipcRenderer.send("rotateRightImgREQ");
});

document.getElementById("rotateValue").addEventListener("input", (event) => {
  degree = event.target.value;
});

document.getElementById("rotateExecuteBtn").addEventListener("click", () => {
  ipcRenderer.send("rotateValueSEND", degree);
});
