// @ts-nocheck
const { ipcRenderer } = require("electron");

// Value-based filter configurations
const valueFilters = {
  blurValue: { defaultValue: 1.0, channel: "blurValueSEND" },
  sharpenValue: { defaultValue: 1.0, channel: "sharpenValueSEND" },
  medianValue: { defaultValue: 5, channel: "medianValueSEND" },
  bitwiseValue: { defaultValue: 128, channel: "bitwiseValueSEND" },
};

// Store current values
const state = Object.fromEntries(
  Object.entries(valueFilters).map(([key, { defaultValue }]) => [
    key,
    defaultValue,
  ])
);

// Setup value filters with input listeners
Object.entries(valueFilters).forEach(([key, { channel }]) => {
  const inputEl = document.getElementById(key);
  const btnEl = document.getElementById(key.replace("Value", "Btn"));

  if (inputEl) {
    inputEl.addEventListener("input", (event) => {
      state[key] = event.target.value;
    });
  }

  if (btnEl) {
    btnEl.addEventListener("click", () => {
      ipcRenderer.send(channel, Number(state[key]));
    });
  }
});

// Simple action buttons (no values)
const actionButtons = [
  { id: "negativeBtn", channel: "negativeImgREQ" },
  { id: "normalizeBtn", channel: "normalizeImgREQ" },
  { id: "dilateBtn", channel: "dilateValueSEND", value: 1 },
  { id: "erodeBtn", channel: "erodeValueSEND", value: 1 },
];

actionButtons.forEach(({ id, channel, value }) => {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener("click", () => {
      ipcRenderer.send(channel, value);
    });
  }
});
