const { ipcRenderer } = require("electron");
const { ImageLayer, Parameter, imageLayerQueue} = require("imgkit");
var { num } = require("imgkit");
const sharp = require("sharp");
var path = require("path");
var fullScreenFlag = false;
var lineWidth = 1;

const buttons = ["resizeBtn", "cropBtn", "filterBtn", "rotateBtn", "paintBtn"];

buttons.forEach((btnId) => {
  const btn = document.getElementById(btnId);
  btn.addEventListener("click", (event) => {
    document.body.style.cursor = "default";
    buttons.forEach((id) => {
      document.getElementById(id).style.borderBottom = "2px solid #333";
    });

    event.currentTarget.style.borderBottom = "none";

    ipcRenderer.send(`${btnId.replace("Btn", "")}ImgREQ`);
    ImageLayer.cropFlag = false;
    ImageLayer.drawFlag = false;
  });
});

ipcRenderer.send("showMenuREQ", "ping");

ipcRenderer.on("resizeImgCMD", (event, res) => {
  const newWidth = Math.floor(imageLayerQueue[Parameter.num].canvas.width * res);
  sharp(imageLayerQueue[Parameter.num].buffer)
    .resize({ width: newWidth })
    .toBuffer((err, buf, info) => {
      imageLayerQueue[Parameter.num].updatePreviewImg(buf, info);
    });
});

ipcRenderer.on("blurImgCMD", (event, res) => {
  console.log(num);
  sharp(imageLayerQueue[Parameter.num].buffer)
    .blur(res)
    .toBuffer((err, buf, info) => {
      imageLayerQueue[Parameter.num].updatePreviewImg(buf, info);
    });
});

ipcRenderer.on("sharpenImgCMD", (event, res) => {
  sharp(imageLayerQueue[Parameter.num].buffer)
    .sharpen(res, 1.0, 2.0)
    .toBuffer((err, buf, info) => {
      imageLayerQueue[Parameter.num].updatePreviewImg(buf, info);
    });
});

ipcRenderer.on("normalizeImgCMD", (event) => {
  sharp(imageLayerQueue[Parameter.num].buffer)
    .normalize(true)
    .toBuffer((err, buf, info) => {
      imageLayerQueue[Parameter.num].updatePreviewImg(buf, info);
    });
});

ipcRenderer.on("medianImgCMD", (event, res) => {
  sharp(imageLayerQueue[Parameter.num].buffer)
    .median(res)
    .toBuffer((err, buf, info) => {
      imageLayerQueue[Parameter.num].updatePreviewImg(buf, info);
    });
});

ipcRenderer.on("rotateImgCMD", (event, res) => {
  sharp(imageLayerQueue[Parameter.num].buffer)
    .rotate(res)
    .toBuffer((err, buf, info) => {
      imageLayerQueue[Parameter.num].updatePreviewImg(buf, info);
    });
});

ipcRenderer.on("rotateRightImgCMD", (event) => {
  sharp(imageLayerQueue[Parameter.num].buffer)
    .rotate(90)
    .toBuffer((err, buf, info) => {
      imageLayerQueue[Parameter.num].updatePreviewImg(buf, info);
    });
});

ipcRenderer.on("rotateLeftImgCMD", (event) => {
  sharp(imageLayerQueue[Parameter.num].buffer)
    .rotate(-90)
    .toBuffer((err, buf, info) => {
      imageLayerQueue[Parameter.num].updatePreviewImg(buf, info);
    });
});

ipcRenderer.on("flipImgCMD", (event) => {
  sharp(imageLayerQueue[Parameter.num].buffer)
    .flip()
    .toBuffer((err, buf, info) => {
      imageLayerQueue[Parameter.num].updatePreviewImg(buf, info);
    });
});

ipcRenderer.on("flopImgCMD", (event) => {
  sharp(imageLayerQueue[Parameter.num].buffer)
    .flop()
    .toBuffer((err, buf, info) => {
      imageLayerQueue[Parameter.num].updatePreviewImg(buf, info);
    });
});

ipcRenderer.on("bitwiseImgCMD", (event) => {
  sharp(imageLayerQueue[Parameter.num].buffer)
    .threshold()
    .toBuffer((err, buf, info) => {
      imageLayerQueue[Parameter.num].updatePreviewImg(buf, info);
    });
});

ipcRenderer.on("negativeImgCMD", (event) => {
  sharp(imageLayerQueue[Parameter.num].buffer)
    .negate(true)
    .toBuffer((err, buf, info) => {
      imageLayerQueue[Parameter.num].updatePreviewImg(buf, info);
    });
});

ipcRenderer.on("grayScaleImgCMD", (event) => {
  sharp(imageLayerQueue[Parameter.num].buffer)
    .grayscale(true)
    .toBuffer((err, buf, info) => {
      imageLayerQueue[Parameter.num].updatePreviewImg(buf, info);
    });
});

ipcRenderer.on("tintImgCMD", (event, res) => {
  sharp(imageLayerQueue[Parameter.num].buffer)
    .tint(res)
    .toBuffer((err, buf, info) => {
      imageLayerQueue[Parameter.num].updatePreviewImg(buf, info);
    });
});

ipcRenderer.on("cropImgCMD", (event, res) => {
    imageLayerQueue[Parameter.num].canvas.setAttribute("draggable", false);
    document.body.style.cursor = "crosshair";
});

ipcRenderer.on("drawImgCMD", (event, res) => {
  ImageLayer.drawFlag = res;
  ImageLayer.dragFlag = false;
  if (ImageLayer.drawFlag) {
    imageLayerQueue[Parameter.num].canvas.setAttribute("draggable", false);
    document.body.style.cursor = "url('./assets/drawCursor.ico'), default";
  } else {
    imageLayerQueue[Parameter.num].canvas.setAttribute("draggable", true);
    document.body.style.cursor = "default";
  }
});

imageLayerQueue.push(new ImageLayer());

document.body.appendChild(imageLayerQueue[Parameter.num].imgPanel);

var sioCheckBox = document.getElementById("showImageOnlyCheckBox");

sioCheckBox.addEventListener("click", (event) => {
  if (sioCheckBox.checked) {
    imageLayerQueue[Parameter.num].deleteBtn.style.visibility = "hidden";
    imageLayerQueue[Parameter.num].nameSpan.style.visibility = "hidden";
    imageLayerQueue[Parameter.num].mainColorBox.style.visibility = "hidden";
    imageLayerQueue[Parameter.num].imgInfoText.style.visibility = "hidden";
    imageLayerQueue[Parameter.num].extensionComboBox.style.visibility =
      "hidden";
    imageLayerQueue[Parameter.num].sio = true;
  } else {
    imageLayerQueue[Parameter.num].deleteBtn.style.visibility = "visible";
    imageLayerQueue[Parameter.num].nameSpan.style.visibility = "visible";
    imageLayerQueue[Parameter.num].mainColorBox.style.visibility = "visible";
    imageLayerQueue[Parameter.num].imgInfoText.style.visibility = "visible";
    imageLayerQueue[Parameter.num].extensionComboBox.style.visibility =
      "visible";
    imageLayerQueue[Parameter.num].sio = false;
  }
});

document.body.addEventListener("mouseup", (event) => {
  ImageLayer.dragFlag = false;
  if (
    ImageLayer.cropFlag &&
    event.x - imageLayerQueue[Parameter.num].realPosX <
      imageLayerQueue[Parameter.num].canvas.clientWidth &&
    event.y - imageLayerQueue[Parameter.num].realPosY <
      imageLayerQueue[Parameter.num].canvas.clientHeight
  ) {
    if (
      imageLayerQueue[Parameter.num].cropWidth < 0 ||
      imageLayerQueue[Parameter.num].cropHeight < 0 ||
      imageLayerQueue[Parameter.num].cropWidth >
        imageLayerQueue[Parameter.num].canvas.clientWidth ||
      imageLayerQueue[Parameter.num].cropHeight >
        imageLayerQueue[Parameter.num].canvas.clientHeight
    ) {
      this.ctx.clearRect(
        0,
        0,
        imageLayerQueue[Parameter.num].canvas.clientWidth,
        imageLayerQueue[Parameter.num].canvas.clientHeight
      );
      this.ctx.drawImage(imageLayerQueue[Parameter.num].image, 0, 0);
    } else {
      sharp(imageLayerQueue[Parameter.num].buffer)
        .extract({
          left: parseInt(imageLayerQueue[Parameter.num].initialX),
          top: parseInt(imageLayerQueue[Parameter.num].initialY),
          width: parseInt(imageLayerQueue[Parameter.num].cropWidth),
          height: parseInt(imageLayerQueue[Parameter.num].cropHeight),
        })
        .toBuffer((err, buf, info) => {
          imageLayerQueue[Parameter.num].updatePreviewImg(buf, info);
        });
    }
  }
});

imageLayerQueue[Parameter.num].openImg("./assets/addImage.png");
console.log(imageLayerQueue[Parameter.num].filepath);
ipcRenderer.on("openImgCMD", (event, res) => {
  imageLayerQueue[Parameter.num].filepath = res;
  if (
    imageLayerQueue[Parameter.num].filepath === undefined ||
    imageLayerQueue[Parameter.num].filepath === null
  ) {
    imageLayerQueue[Parameter.num].openImg("./assets/addImage.png");
  } else {
    imageLayerQueue[Parameter.num].openImg(
      imageLayerQueue[Parameter.num].filepath
    );
    Parameter.num++;
    imageLayerQueue.push(new ImageLayer());
    document.body.appendChild(imageLayerQueue[Parameter.num].imgPanel);
    imageLayerQueue[Parameter.num].openImg("./assets/addImage.png");
  }
});

ipcRenderer.on("setExtensionCMD", (event) => {
  ipcRenderer.send(
    "extensionValueSEND",
    imageLayerQueue[Parameter.num].extension
  );
});

ipcRenderer.on("saveImgCMD", (event) => {
  if (imageLayerQueue[Parameter.num].filepath !== "./assets/addImage.png") {
    imageLayerQueue[Parameter.num].saveImg(
      imageLayerQueue[Parameter.num].filepath
    );
  }
});

ipcRenderer.on("saveAsImgCMD", (event, res) => {
  imageLayerQueue[Parameter.num].saveImg(res);
});

document.getElementById("undoBtn").addEventListener("click", (event) => {
  imageLayerQueue[Parameter.num].undoPreviewImg();
});

document.getElementById("redoBtn").addEventListener("click", (event) => {
  imageLayerQueue[Parameter.num].redoPreviewImg();
});

document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "z") {
    imageLayerQueue[Parameter.num].undoPreviewImg();
  } else if (event.ctrlKey && event.key === "y") {
    imageLayerQueue[Parameter.num].redoPreviewImg();
  } else if (event.ctrlKey && event.key === "s") {
    ipcRenderer.send("saveImgREQ");
  } else if (event.which === 122) {
    if (!fullScreenFlag) {
      ipcRenderer.send("FullScreenREQ");
      fullScreenFlag = true;
    } else {
      ipcRenderer.send("DefaultScreenREQ");
      fullScreenFlag = false;
    }
  }
});

document.addEventListener("wheel", function (event) {
  if (event.ctrlKey) {
    if (ImageLayer.drawFlag) {
      if (event.deltaY > 0 || event.detail < 0) {
        // scroll up
        lineWidth++;
      } else {
        // scroll down
        if (lineWidth > 1) {
          lineWidth--;
        }
      }
      imageLayerQueue[Parameter.num].ctx.lineWidth = lineWidth;
    }
  }
});
