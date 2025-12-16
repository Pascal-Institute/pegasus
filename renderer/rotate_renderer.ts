import { ipcRenderer } from "electron";

let degree: number = 45;

const flipBtn = document.getElementById("flipBtn");
flipBtn?.addEventListener("click", () => {
  ipcRenderer.send("flipImgREQ");
});

const flopBtn = document.getElementById("flopBtn");
flopBtn?.addEventListener("click", () => {
  ipcRenderer.send("flopImgREQ");
});

const rotateLeftBtn = document.getElementById("rotateLeftBtn");
rotateLeftBtn?.addEventListener("click", () => {
  ipcRenderer.send("rotateLeftImgREQ");
});

const rotateRightBtn = document.getElementById("rotateRightBtn");
rotateRightBtn?.addEventListener("click", () => {
  ipcRenderer.send("rotateRightImgREQ");
});

const rotateValue = document.getElementById("rotateValue") as HTMLInputElement;
rotateValue?.addEventListener("input", (event) => {
  degree = parseFloat((event.target as HTMLInputElement).value);
});

const rotateExecuteBtn = document.getElementById("rotateExecuteBtn");
rotateExecuteBtn?.addEventListener("click", () => {
  ipcRenderer.send("rotateValueSEND", degree);
});
