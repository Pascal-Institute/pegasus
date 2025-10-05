const { ipcRenderer } = require("electron");

var rgb = { r: "123", g: "123", b: "123" };
var drawFlagState = false;

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
