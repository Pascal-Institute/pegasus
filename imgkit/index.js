const sharp = require("sharp");
const bmp = require("sharp-bmp");
const ico = require("sharp-ico");
var path = require("path");

const imageLayerQueue = [];

class Parameter {
  static num = 0;
}

class ImageLayer {
  static drawFlag = false;
  static cropFlag = false;
  static dragFlag = false;

  constructor() {
    this.filepath = null;
    this.buffer;
    this.information;
    this.extension;
    this.bufferQueue = [];
    this.infoQueue = [];
    this.extensionQueue = [];
    this.i = -1;
    this.showImageOnly = false;
    this.totalImageWidth = 0;
    //initialize
    this.imgPanel = document.createElement("div");
    this.imgPanel.className = "imgPanel";
    this.imgPanel.id = Parameter.num;
    this.imgPanel.tabIndex = 0; //enable focus

    this.canvas = document.createElement("canvas");
    this.canvas.setAttribute("class", "img-canvas");
    this.canvas.className = "previewImg";
    this.canvas.id = "default";

    this.deleteBtn = document.createElement("button");
    this.deleteBtn.id = "deleteBtn";
    const img = document.createElement("img");
    img.src = "assets/close.ico";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    this.deleteBtn.appendChild(img);
    const deleteImagePanel = () => {
      const index = parseInt(this.imgPanel.id, 10);
      if (index >= 0 && index < imageLayerQueue.length) {
        if (this.imgPanel.parentNode) {
          this.imgPanel.parentNode.removeChild(this.imgPanel);
        }
        imageLayerQueue.splice(index, 1);
        Parameter.num = Math.max(0, imageLayerQueue.length - 1);
        if (imageLayerQueue.length > 0) {
          imageLayerQueue[Parameter.num].updateFocus();
          imageLayerQueue[Parameter.num].updateSio();
        } else {
          Parameter.num = 0;
        }
      }

      document
        .getElementById("delete_msg")
        .animate([{ opacity: "1" }, { opacity: "0" }], {
          duration: 1800,
          iterations: 1,
        });
    };

    this.deleteBtn.addEventListener("click", deleteImagePanel);

    this.nameSpan = document.createElement("span");
    this.nameSpan.id = "nameSpan";

    document.addEventListener("keydown", (event) => {
      if (
        (event.ctrlKey && event.key === "d") ||
        (event.key === "Delete" && document.activeElement === this.imgPanel)
      ) {
        deleteImagePanel();
      }
    });

    this.mainColorBox = document.createElement("div");
    this.mainColorBox.className = "mainColorBox";

    this.mainColor1 = document.createElement("div");
    this.mainColor1.className = "mainColor1";
    this.mainColor1.className = "colorBox";

    this.mainColor2 = document.createElement("div");
    this.mainColor2.className = "mainColor2";
    this.mainColor2.className = "colorBox";

    this.mainColor3 = document.createElement("div");
    this.mainColor3.className = "mainColor3";
    this.mainColor3.className = "colorBox";

    [this.mainColor1, this.mainColor2, this.mainColor3].forEach((mainColor) => {
      mainColor.addEventListener("click", (event) => {
        const text = document.createElement("textarea");
        this.imgPanel.appendChild(text);
        text.value = this.mainColor1.title;
        text.select();
        document.execCommand("Copy");
        this.imgPanel.removeChild(text);

        document
          .getElementById("copy_msg")
          .animate([{ opacity: "1" }, { opacity: "0" }], {
            duration: 1800,
            iterations: 1,
          });
      });
    });

    //
    this.imgInfoText = document.createElement("h2");
    this.imgInfoText.id = "imgInfoText";
    //
    this.extensionComboBox = document.createElement("select");
    this.extensionComboBox.id = "extensionComboBox";

    this.pngOption = document.createElement("option");
    this.pngOption.value = "png";
    this.pngOption.innerText = "png";
    this.jpgOption = document.createElement("option");
    this.jpgOption.value = "jpg";
    this.jpgOption.innerText = "jpg";
    this.jpegOption = document.createElement("option");
    this.jpegOption.value = "jpeg";
    this.jpegOption.innerText = "jpeg";
    this.webpOption = document.createElement("option");
    this.webpOption.value = "webp";
    this.webpOption.innerText = "webp";
    this.gifOption = document.createElement("option");
    this.gifOption.value = "gif";
    this.gifOption.innerText = "gif";
    this.bmpOption = document.createElement("option");
    this.bmpOption.value = "bmp";
    this.bmpOption.innerText = "bmp";
    this.icoOption = document.createElement("option");
    this.icoOption.value = "ico";
    this.icoOption.innerText = "ico";
    this.tifOption = document.createElement("option");
    this.tifOption.value = "tif";
    this.tifOption.innerText = "tif";
    this.tiffOption = document.createElement("option");
    this.tiffOption.value = "tiff";
    this.tiffOption.innerText = "tiff";

    this.ctx = this.canvas.getContext("2d");

    this.initialX;
    this.initialY;
    this.cropWidth;
    this.cropHeight;

    this.realPosX;
    this.realPosY;

    this.image = new Image();
    this.filepath;

    this.build();
  }

  build() {
    this.imgPanel.addEventListener("click", (event) => {
      Parameter.num = this.imgPanel.id;
      this.updateFocus();
      this.updateSio();
    });
    // this.ctx.lineWidth = 1;
    this.canvas.addEventListener("drag", function (event) {}, false);

    this.canvas.addEventListener(
      "dragover",
      function (event) {
        event.preventDefault();
      },
      false
    );

    this.canvas.addEventListener("drop", (event) => {
      event.preventDefault();
      if (this.canvas.id !== "full") {
        // Try to open the image first, only add if successful
        const file = event.dataTransfer.files[0];
        if (!file) return;

        const tryOpenImg = (filepathOrBuffer) => {
          // Try to load image using sharp to check validity
          sharp(filepathOrBuffer).metadata((err, info) => {
            if (err) {
              // Invalid image, do not add
              document
                .getElementById("error_msg")
                ?.animate([{ opacity: "1" }, { opacity: "0" }], {
                  duration: 1800,
                  iterations: 1,
                });
              return;
            }
            // Valid image, add new layer
            imageLayerQueue[Parameter.num].openImg(
              typeof filepathOrBuffer === "string"
                ? filepathOrBuffer
                : file.path || ""
            );
            Parameter.num++;
            imageLayerQueue.push(new ImageLayer());
            document.body.appendChild(imageLayerQueue[Parameter.num].imgPanel);
            imageLayerQueue[Parameter.num].openImg("./assets/addImage.png");
          });
        };

        if (!file.path) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const arrayBuffer = e.target.result;
            const buffer = Buffer.from(arrayBuffer);
            tryOpenImg(buffer);
          };
          reader.readAsArrayBuffer(file);
        } else {
          tryOpenImg(file.path);
        }
        return;
      }
    });

    this.canvas.addEventListener("mousedown", (event) => {
      ImageLayer.dragFlag = true;
      if (ImageLayer.drawFlag) {
        this.ctx.beginPath();
        this.ctx.moveTo(
          event.clientX - this.canvas.getBoundingClientRect().left,
          event.clientY - this.canvas.getBoundingClientRect().top
        );
        this.canvas.addEventListener("mousemove", (evt) => {
          if (ImageLayer.dragFlag && ImageLayer.drawFlag) {
            this.ctx.lineTo(
              evt.x - this.canvas.getBoundingClientRect().left,
              evt.y - this.canvas.getBoundingClientRect().top
            );
            this.ctx.stroke();
          }
        });
        this.ctx.closePath();
      }

      if (ImageLayer.cropFlag) {
        var ctxs = this.canvas.getContext("2d");
        this.realPosX = event.clientX;
        this.realPosY = event.clientY;
        this.initialX =
          event.clientX - this.canvas.getBoundingClientRect().left;
        this.initialY = event.clientY - this.canvas.getBoundingClientRect().top;
        ctxs.setLineDash([2]);

        this.canvas.addEventListener("mousemove", (evt) => {
          if (ImageLayer.dragFlag && ImageLayer.cropFlag) {
            ctxs.clearRect(
              0,
              0,
              this.canvas.clientWidth,
              this.canvas.clientHeight
            );
            this.cropWidth = evt.clientX - event.clientX;
            this.cropHeight = evt.clientY - event.clientY;
            ctxs.drawImage(this.image, 0, 0);
            ctxs.strokeRect(
              this.initialX,
              this.initialY,
              this.cropWidth,
              this.cropHeight
            );
          }
        });
      }
    });

    this.canvas.addEventListener("mouseup", (event) => {
      if (ImageLayer.drawFlag) {
        //paste
      }
    });

    this.imgPanel.appendChild(this.canvas);
    this.imgPanel.appendChild(this.deleteBtn);
    this.imgPanel.appendChild(this.nameSpan);
    this.imgPanel.appendChild(this.mainColorBox);
    this.imgPanel.appendChild(this.imgInfoText);
    this.imgPanel.appendChild(this.extensionComboBox);

    this.mainColorBox.appendChild(this.mainColor1);
    this.mainColorBox.appendChild(this.mainColor2);
    this.mainColorBox.appendChild(this.mainColor3);

    this.extensionComboBox.appendChild(this.pngOption);
    this.extensionComboBox.appendChild(this.jpgOption);
    this.extensionComboBox.appendChild(this.jpegOption);
    this.extensionComboBox.appendChild(this.webpOption);
    this.extensionComboBox.appendChild(this.gifOption);
    this.extensionComboBox.appendChild(this.bmpOption);
    this.extensionComboBox.appendChild(this.icoOption);
    this.extensionComboBox.appendChild(this.tifOption);
    this.extensionComboBox.appendChild(this.tiffOption);
    this.extensionComboBox.addEventListener("change", (event) => {
      this.extension = event.target.value;
      this.filepath = this.filepath.replace(
        path.extname(this.filepath),
        `.${this.extension}`
      );

      if (this.extension === "bmp") {
        bmp.sharpToBmp(sharp(this.buffer), this.filepath).then(async (info) => {
          const fs = require("fs").promises;
          const buf = await fs.readFile(this.filepath);
          const pngBuffer = await sharpList[0]
            .png()
            .toBuffer((err, buf, info) => {
              this.updatePreviewImg(buf, info);
            });
        });

        document
          .getElementById("convert_msg")
          .animate([{ opacity: "1" }, { opacity: "0" }], {
            duration: 1800,
            iterations: 1,
          });
      } else if (this.extension === "ico") {
        ico
          .sharpsToIco([sharp(this.buffer)], this.filepath)
          .then(async (info) => {
            const fs = require("fs").promises;
            const buf = await fs.readFile(this.filepath);
            const sharpList = ico.sharpsFromIco(buf);
            const pngBuffer = await sharpList[0]
              .png()
              .toBuffer((err, buf, info) => {
                this.updatePreviewImg(buf, info);
              });
          });

        document
          .getElementById("convert_msg")
          .animate([{ opacity: "1" }, { opacity: "0" }], {
            duration: 1800,
            iterations: 1,
          });
      } else {
        sharp(this.buffer)
          .toFormat(this.extension)
          .png()
          .toBuffer((err, buf, info) => {
            this.updatePreviewImg(buf, info);
            document
              .getElementById("convert_msg")
              .animate([{ opacity: "1" }, { opacity: "0" }], {
                duration: 1800,
                iterations: 1,
              });
          });
      }
    });
  }

  updateFocus() {
    for (var j = 0; j < imageLayerQueue.length; j++) {
      // console.log(imageLayerQueue.length);
      // console.log(Parameter.num);
      // console.log(j);
      if (j == Parameter.num) {
        imageLayerQueue[j].imgPanel.style.border = "solid #e0e0e0 1px";
        imageLayerQueue[j].imgPanel.style.borderRadius = "5px";
      } else {
        imageLayerQueue[j].imgPanel.style.border = "none";
      }
    }
    this.imgPanel.focus();
  }

  updateSio() {
    if (this.showImageOnly) {
      this.deleteBtn.style.visibility = "hidden";
      this.nameSpan.style.visibility = "hidden";
      this.mainColorBox.style.visibility = "hidden";
      this.imgInfoText.style.visibility = "hidden";
      this.extensionComboBox.style.visibility = "hidden";
    } else {
      this.deleteBtn.style.visibility = "visible";
      this.nameSpan.style.visibility = "visible";
      this.mainColorBox.style.visibility = "visible";
      this.imgInfoText.style.visibility = "visible";
      this.extensionComboBox.style.visibility = "visible";
    }
  }

  updatePreviewImg(buf, info) {
    this.buffer = buf;
    this.information = info;
    this.canvas.width = info.width;
    this.canvas.height = info.height;

    this.image.src =
      `data:image/${this.extension};base64, ` + buf.toString("base64");
    this.image.onload = () => {
      this.ctx.drawImage(this.image, 0, 0, info.width, info.height);
    };

    this.updateImgInfoText(info);
    this.extractMainColors(buf, info);
    this.updateExtension();

    this.buffer = buf;
    this.i++;

    if (this.i > 10) {
      this.bufferQueue.shift();
      this.infoQueue.shift();
      this.extensionQueue.shift();
      this.i--;
    } else {
      if (this.bufferQueue[this.i + 1] !== null) {
        this.bufferQueue = this.bufferQueue.slice(0, this.i);
        this.infoQueue = this.infoQueue.slice(0, this.i);
        this.extensionQueue = this.extensionQueue.slice(0, this.i);
      }
    }
    this.bufferQueue.push(buf);
    this.infoQueue.push(info);
    this.extensionQueue.push(this.extension);

    setTimeout(() => {
      const panels = document.querySelectorAll(".imgPanel"); // imgPanel 클래스 이름 확인 필요
      let maxRight = 0;
      let maxBottom = 0;

      panels.forEach((panel) => {
        const rect = panel.getBoundingClientRect();
        const right = rect.left + rect.width + window.scrollX;
        const bottom = rect.top + rect.height + window.scrollY;

        if (right > maxRight) maxRight = right;
        if (bottom > maxBottom) maxBottom = bottom;
      });

      if (maxRight > document.body.scrollWidth) {
        document.body.style.width = maxRight + 50 + "px"; // 여유 공간 포함
      }
      if (maxBottom > document.body.scrollHeight) {
        document.body.style.height = maxBottom + 50 + "px";
      }
    }, 100); // 100ms 후에 실행
  }

  updateImgInfoText(info) {
    this.imgInfoText.innerText = `${info.width} x ${info.height}`;
  }

  extractMainColors(buffer, info) {
    //initialize
    this.mainColor1.style.background = null;
    this.mainColor1.title = "empty";
    this.mainColor2.style.background = null;
    this.mainColor2.title = "empty";
    this.mainColor3.style.background = null;
    this.mainColor3.title = "empty";

    sharp(buffer)
      .resize({ width: info.width > 24 ? 24 : info.width })
      .toColorspace("srgb")
      .raw()
      .toBuffer((err, result, info) => {
        var colors = {};
        var step;
        var coef = info.width * info.height * 4 === result.length ? 4 : 3;
        var size = result.length / coef;

        for (step = 0; step < size; step++) {
          if (
            colors[
              `${result[coef * step]} ${result[coef * step + 1]} ${
                result[coef * step + 2]
              }`
            ] !== undefined
          ) {
            colors[
              `${result[coef * step]} ${result[coef * step + 1]} ${
                result[coef * step + 2]
              }`
            ] += 1;
          } else {
            colors[
              `${result[coef * step]} ${result[coef * step + 1]} ${
                result[coef * step + 2]
              }`
            ] = 1;
          }
        }
        const sortColors = Object.entries(colors)
          .sort(([, a], [, b]) => b - a)
          .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});

        var rgb = Object.keys(sortColors)[0].split(" ");
        var hexColor = `#${
          parseInt(rgb[0], 10).toString(16).padStart(2, "0") +
          parseInt(rgb[1], 10).toString(16).padStart(2, "0") +
          parseInt(rgb[2], 10).toString(16).padStart(2, "0")
        }`;
        this.mainColor1.style.background = hexColor;
        this.mainColor1.title = hexColor;

        if (Object.keys(sortColors).length >= 2) {
          rgb = Object.keys(sortColors)[1].split(" ");
          hexColor = `#${
            parseInt(rgb[0], 10).toString(16).padStart(2, "0") +
            parseInt(rgb[1], 10).toString(16).padStart(2, "0") +
            parseInt(rgb[2], 10).toString(16).padStart(2, "0")
          }`;
          this.mainColor2.style.background = hexColor;
          this.mainColor2.title = hexColor;
        }

        if (Object.keys(sortColors).length >= 3) {
          rgb = Object.keys(sortColors)[2].split(" ");
          hexColor = `#${
            parseInt(rgb[0], 10).toString(16).padStart(2, "0") +
            parseInt(rgb[1], 10).toString(16).padStart(2, "0") +
            parseInt(rgb[2], 10).toString(16).padStart(2, "0")
          }`;
          this.mainColor3.style.background = hexColor;
          this.mainColor3.title = hexColor;
        }
      });
  }

  updateExtension() {
    this.extensionComboBox.value = this.extension;
  }

  openImg(filepath) {
    if (filepath !== "./assets/addImage.png") {
      this.canvas.id = "full";
    }
    this.filepath = filepath;
    this.extension = path.extname(this.filepath).replace(".", "");
    this.nameSpan.textContent = path
      .basename(this.filepath)
      .replace("." + this.extension, "");

    const afterLoad = (buf, info) => {
      this.updatePreviewImg(buf, info);
    };

    if (this.extension === "tiff" || this.extension === "tif") {
      sharp(filepath)
        .toFormat("png")
        .toBuffer((err, buf, info) => afterLoad(buf, info));
    } else if (this.extension === "ico") {
      ico
        .sharpsFromIco(this.filepath)
        .png()
        .toBuffer((err, buf, info) => afterLoad(buf, info));
    } else if (this.extension === "bmp") {
      bmp
        .sharpFromBmp(this.filepath)
        .png()
        .toBuffer((err, buf, info) => afterLoad(buf, info));
    } else {
      sharp(filepath).toBuffer((err, buf, info) => afterLoad(buf, info));
    }
  }

  saveImg(filepath) {
    this.filepath = filepath;
    var base64Data = this.image.src.replace(
      `data:image/${this.extension};base64,`,
      ""
    );

    require("fs").writeFile(filepath, base64Data, "base64", (err) => {
      if (err) {
        // console.log("failed to save");
      } else {
        // console.log("saved successfully");
        document
          .getElementById("save_msg")
          .animate([{ opacity: "1" }, { opacity: "0" }], {
            duration: 1800,
            iterations: 1,
          });
      }
    });
  }

  undoPreviewImg() {
    if (this.i === 0) return;
    this.i--;
    // console.log(this.i);
    try {
      this.buffer = this.bufferQueue[this.i];
      this.information = this.infoQueue[this.i];
      this.extension = this.extensionQueue[this.i];

      this.canvas.width = this.infoQueue[this.i].width;
      this.canvas.height = this.infoQueue[this.i].height;

      this.image.src =
        `data:image/${this.extension};base64, ` +
        this.buffer.toString("base64");
      this.image.onload = () => {
        this.ctx.drawImage(this.image, 0, 0);
      };

      this.updateImgInfoText(this.information);
      this.extractMainColors(this.buffer, this.information);
      this.updateExtension();
    } catch (err) {
      console.log(err);
      this.i++;
    }
  }

  redoPreviewImg() {
    this.i++;
    try {
      this.buffer = this.bufferQueue[this.i];
      this.information = this.infoQueue[this.i];
      this.extension = this.extensionQueue[this.i];

      this.canvas.width = this.infoQueue[this.i].width;
      this.canvas.height = this.infoQueue[this.i].height;

      this.image.src =
        `data:image/${this.extension};base64, ` +
        this.buffer.toString("base64");
      this.image.onload = () => {
        this.ctx.drawImage(this.image, 0, 0);
      };

      this.updateImgInfoText(this.information);
      this.extractMainColors(this.buffer, this.information);
      this.updateExtension();
    } catch (err) {
      this.i--;
    }
  }
}

module.exports = {
  ImageLayer: ImageLayer,
  Parameter: Parameter,
  drawFlag: ImageLayer.drawFlag,
  cropFlag: ImageLayer.cropFlag,
  dragFlag: ImageLayer.dragFlag,
  imageLayerQueue: imageLayerQueue,
};
