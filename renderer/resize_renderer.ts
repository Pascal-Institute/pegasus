// @ts-nocheck
const { ipcRenderer } = require("electron");

// Resize operations configuration
const resizeOps = [
  {
    valueId: "resizeValue",
    btnId: "resizeExecuteBtn",
    channel: "resizeValueSEND",
    defaultValue: 2,
  },
  {
    valueId: "resizePixelValue",
    btnId: "resizePixelExecuteBtn",
    channel: "resizePixelValueSEND",
    defaultValue: 256,
  },
];

// Setup resize operations
resizeOps.forEach(({ valueId, btnId, channel, defaultValue }) => {
  let value = defaultValue;

  const inputEl = document.getElementById(valueId);
  const btnEl = document.getElementById(btnId);

  if (inputEl) {
    inputEl.addEventListener("input", (event) => {
      value = event.target.value;
    });
  }

  if (btnEl) {
    btnEl.addEventListener("click", () => {
      ipcRenderer.send(channel, value);
    });
  }
});
