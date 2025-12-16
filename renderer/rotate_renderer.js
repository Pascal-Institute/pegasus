const { ipcRenderer } = require("electron");

// Simple action buttons
const actionButtons = [
  { id: "flipBtn", channel: "flipImgREQ" },
  { id: "flopBtn", channel: "flopImgREQ" },
  { id: "rotateLeftBtn", channel: "rotateLeftImgREQ" },
  { id: "rotateRightBtn", channel: "rotateRightImgREQ" },
];

actionButtons.forEach(({ id, channel }) => {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener("click", () => {
      ipcRenderer.send(channel);
    });
  }
});

// Value-based rotation
let degree = 45;

const rotateValueEl = document.getElementById("rotateValue");
const rotateExecuteBtn = document.getElementById("rotateExecuteBtn");

if (rotateValueEl) {
  rotateValueEl.addEventListener("input", (event) => {
    degree = event.target.value;
  });
}

if (rotateExecuteBtn) {
  rotateExecuteBtn.addEventListener("click", () => {
    ipcRenderer.send("rotateValueSEND", degree);
  });
}
