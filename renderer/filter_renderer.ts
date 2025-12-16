import { ipcRenderer } from "electron";

let blurValue: number = 1.0;
let sharpenValue: number = 1.0;
let medianValue: number = 5;
let bitwiseValue: number = 128;

const blurValueInput = document.getElementById("blurValue") as HTMLInputElement;
blurValueInput?.addEventListener("input", (event) => {
  blurValue = parseFloat((event.target as HTMLInputElement).value);
});

const blurBtn = document.getElementById("blurBtn");
blurBtn?.addEventListener("click", () => {
  ipcRenderer.send("blurValueSEND", Number(blurValue));
});

const sharpenValueInput = document.getElementById("sharpenValue") as HTMLInputElement;
sharpenValueInput?.addEventListener("input", (event) => {
  sharpenValue = parseFloat((event.target as HTMLInputElement).value);
});

const sharpenBtn = document.getElementById("sharpenBtn");
sharpenBtn?.addEventListener("click", () => {
  ipcRenderer.send("sharpenValueSEND", Number(sharpenValue));
});

const medianValueInput = document.getElementById("medianValue") as HTMLInputElement;
medianValueInput?.addEventListener("input", (event) => {
  medianValue = parseInt((event.target as HTMLInputElement).value);
});

const medianBtn = document.getElementById("medianBtn");
medianBtn?.addEventListener("click", () => {
  ipcRenderer.send("medianValueSEND", Number(medianValue));
});

const bitwiseValueInput = document.getElementById("bitwiseValue") as HTMLInputElement;
bitwiseValueInput?.addEventListener("input", (event) => {
  bitwiseValue = parseInt((event.target as HTMLInputElement).value);
});

const bitwiseBtn = document.getElementById("bitwiseBtn");
bitwiseBtn?.addEventListener("click", () => {
  ipcRenderer.send("bitwiseValueSEND", Number(bitwiseValue));
});

const negativeBtn = document.getElementById("negativeBtn");
negativeBtn?.addEventListener("click", () => {
  ipcRenderer.send("negativeImgREQ");
});

const normalizeBtn = document.getElementById("normalizeBtn");
normalizeBtn?.addEventListener("click", () => {
  ipcRenderer.send("normalizeImgREQ");
});

const dilateBtn = document.getElementById("dilateBtn");
dilateBtn?.addEventListener("click", () => {
  ipcRenderer.send("dilateValueSEND", Number(1));
});

const erodeBtn = document.getElementById("erodeBtn");
erodeBtn?.addEventListener("click", () => {
  ipcRenderer.send("erodeValueSEND", Number(1));
});
