const { ipcRenderer } = require("electron");

// UI state management
const state = {
  rgb: { r: "123", g: "123", b: "123" },
  drawMode: false,
  colorpickerMode: false,
  padSize: 1,
  padColor: "#000000",
};

// Helper function to update button background color
function updateButtonBackground(btnId, isActive) {
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.style.backgroundColor = isActive ? "gray" : "#efefef";
  }
}

// Helper function to convert RGB to hex color
function rgbToHex(rgb) {
  return `#${parseInt(rgb.r, 10).toString(16).padStart(2, "0")}${parseInt(
    rgb.g,
    10
  )
    .toString(16)
    .padStart(2, "0")}${parseInt(rgb.b, 10).toString(16).padStart(2, "0")}`;
}

// Toggle button handler (buttons that change state and send on/off)
function setupToggleButton(btnId, channelName, stateKey) {
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.addEventListener("click", () => {
      state[stateKey] = !state[stateKey];
      updateButtonBackground(btnId, state[stateKey]);
      ipcRenderer.send(channelName, state[stateKey]);
    });
  }
}

// Setup toggle buttons
setupToggleButton("drawBtn", "drawImgREQ", "drawMode");
setupToggleButton("colorpickerBtn", "colorpickerImgREQ", "colorpickerMode");

// Simple action buttons
const actionButtons = [
  { id: "grayScaleBtn", channel: "grayScaleImgREQ" },
  { id: "watermarkBtn", channel: "watermarkImgREQ" },
  { id: "tintExecuteBtn", channel: "tintValueSEND", getValue: () => state.rgb },
];

actionButtons.forEach(({ id, channel, getValue }) => {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener("click", () => {
      ipcRenderer.send(channel, getValue ? getValue() : undefined);
    });
  }
});

// Color picker value receiver
ipcRenderer.on("colorpickerValueRECV", (event, color, color_name) => {
  if (!color) return;
  document.getElementById("colorpickerBox").style.backgroundColor = color;
  document.getElementById("colorpickerValue").textContent = color;
  document.getElementById("colorpickerName").textContent = color_name;
});

// Color copy on click
const colorpickerBox = document.getElementById("colorpickerBox");
if (colorpickerBox) {
  colorpickerBox.addEventListener("click", () => {
    const color = colorpickerBox.style.backgroundColor;
    if (color && color !== "empty") {
      navigator.clipboard.writeText(color).then(() => {
        ipcRenderer.send("showNotificationREQ", "imgkit-copy");
      });
    }
  });
}

// RGB color input handling
const rgbInputs = [
  { id: "redValue", key: "r" },
  { id: "greenValue", key: "g" },
  { id: "blueValue", key: "b" },
];

rgbInputs.forEach(({ id, key }) => {
  const input = document.getElementById(id);
  if (input) {
    input.addEventListener("input", (event) => {
      state.rgb[key] = event.target.value;
      const tintBtn = document.getElementById("tintExecuteBtn");
      if (tintBtn) {
        tintBtn.style.backgroundColor = rgbToHex(state.rgb);
      }
    });
  }
});

// Watermark file upload
const watermarkFileInput = document.getElementById("watermarkFileInput");
const watermarkUploadBtn = document.getElementById("watermarkUploadBtn");
const watermarkPreviewImg = document.getElementById("watermarkPreviewImg");

if (watermarkUploadBtn) {
  watermarkUploadBtn.addEventListener("click", () => {
    watermarkFileInput?.click();
  });
}

if (watermarkFileInput) {
  watermarkFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      ipcRenderer.send("watermarkUploadREQ", file.path);
      if (watermarkPreviewImg) {
        watermarkPreviewImg.src = file.path;
      }
      event.target.value = "";
    }
  });
}

// Pad operation handling
const padValueInput = document.getElementById("padValue");
const padColorInput = document.getElementById("padColorValue");
const padColorBox = document.getElementById("padColorBox");
const padBtn = document.getElementById("padBtn");

if (padValueInput) {
  padValueInput.addEventListener("input", (event) => {
    const parsed = Number(event.target.value);
    state.padSize = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
  });
}

if (padColorInput) {
  padColorInput.addEventListener("input", (event) => {
    state.padColor = event.target.value;
    if (padColorBox) {
      padColorBox.style.backgroundColor = state.padColor;
    }
  });
}

if (padBtn) {
  padBtn.addEventListener("click", () => {
    ipcRenderer.send("padImgREQ", state.padSize, state.padColor);
  });
}
