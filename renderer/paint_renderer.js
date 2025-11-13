const { ipcRenderer } = require("electron");

var rgb = { r: "123", g: "123", b: "123" };
var drawFlagState = false;
var colorpickerActive = false;
var watermarkPreviewImg = document.getElementById("watermarkPreviewImg");
// Receive color from color picker
ipcRenderer.on("colorpickerValueRECV", (event, color, color_name) => {
  if (!color) return;
  document.getElementById("colorpickerBox").style.backgroundColor = color;
  document.getElementById("colorpickerValue").textContent = color;
  document.getElementById("colorpickerName").textContent = color_name;
});

// Color copy on click
document.getElementById("colorpickerBox").addEventListener("click", () => {
  const color = document.getElementById("colorpickerBox").style.backgroundColor;
  if (color && color !== "empty") {
    navigator.clipboard.writeText(color).then(() => {
      // Send notification request to main window via IPC
      ipcRenderer.send("showNotificationREQ", "imgkit-copy");
    });
  }
});

document.getElementById("drawBtn").addEventListener("click", () => {
  drawFlagState = !drawFlagState;

  if (drawFlagState) {
    document.getElementById("drawBtn").style.backgroundColor = "gray";
  } else {
    document.getElementById("drawBtn").style.backgroundColor = "#efefef";
  }

  ipcRenderer.send("drawImgREQ", drawFlagState);
});

document.getElementById("grayScaleBtn").addEventListener("click", () => {
  ipcRenderer.send("grayScaleImgREQ");
});

document.getElementById("tintExecuteBtn").addEventListener("click", () => {
  ipcRenderer.send("tintValueSEND", rgb);
});

document.getElementById("watermarkBtn").addEventListener("click", () => {
  ipcRenderer.send("watermarkImgREQ");
});

// Watermark upload button - trigger file input
document.getElementById("watermarkUploadBtn").addEventListener("click", () => {
  document.getElementById("watermarkFileInput").click();
});

// Handle watermark file selection
document
  .getElementById("watermarkFileInput")
  .addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      ipcRenderer.send("watermarkUploadREQ", file.path);
      watermarkPreviewImg.src = file.path;
      // Reset input so same file can be selected again
      event.target.value = "";
    }
  });

document.getElementById("colorpickerBtn").addEventListener("click", () => {
  colorpickerActive = !colorpickerActive;
  if (colorpickerActive) {
    document.getElementById("colorpickerBtn").style.backgroundColor = "gray";
  } else {
    document.getElementById("colorpickerBtn").style.backgroundColor = "#efefef";
  }
  ipcRenderer.send("colorpickerImgREQ", colorpickerActive);
});

document.getElementById("redValue").addEventListener("input", (event) => {
  rgb.r = event.target.value; //parseInt(event.target.value, 10).toString(16).padStart(2, "0");
  updateTintBtnBackground(rgb);
});

document.getElementById("greenValue").addEventListener("input", (event) => {
  rgb.g = event.target.value; //parseInt(event.target.value, 10).toString(16).padStart(2, "0");
  updateTintBtnBackground(rgb);
});

document.getElementById("blueValue").addEventListener("input", (event) => {
  rgb.b = event.target.value; //parseInt(event.target.value, 10).toString(16).padStart(2, "0");
  updateTintBtnBackground(rgb);
});

document.getElementById("padBtn").addEventListener("click", () => {
  ipcRenderer.send("padImgREQ");
});

function updateTintBtnBackground(rgb) {
  console.log(rgb);
  var colorString = `#${parseInt(rgb.r, 10)
    .toString(16)
    .padStart(2, "0")}${parseInt(rgb.g, 10)
    .toString(16)
    .padStart(2, "0")}${parseInt(rgb.b, 10).toString(16).padStart(2, "0")}`;
  console.log(colorString);
  document.getElementById("tintExecuteBtn").style.backgroundColor = colorString;
}
