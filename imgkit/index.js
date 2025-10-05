const sharp = require("sharp");
const bmp = require("sharp-bmp");
const ico = require("sharp-ico");
var path = require("path");

/** @type {ImageLayer | undefined} */
let copy;
const imageLayerQueue = [];

const messages = {};
function createMessageElement(id, text, isError = false) {
  const msg = document.createElement("div");
  msg.id = `imgkit-${id}`;
  msg.className = "imgkit-notification";
  msg.textContent = text;
  msg.style.position = "fixed";
  msg.style.bottom = "15px";
  msg.style.left = "50%";
  msg.style.transform = "translateX(-50%)";
  msg.style.width = "400px";
  msg.style.padding = "15px";
  msg.style.opacity = "0";
  msg.style.border = "1px solid transparent";
  msg.style.borderRadius = "4px";
  msg.style.backgroundColor = isError ? "#f29999" : "#dff0d8";
  msg.style.textAlign = "center";
  msg.style.zIndex = "10000";
  msg.style.pointerEvents = "none";
  document.body.appendChild(msg);
  messages[id] = msg;
  return msg;
}

function showMessage(id) {
  if (!messages[id]) return;
  messages[id].animate([{ opacity: "1" }, { opacity: "0" }], {
    duration: 1800,
    iterations: 1,
  });
}

createMessageElement("copy", "Color Copied");
createMessageElement("img-copy", "Image Copied");
createMessageElement("img-paste", "Image Pasted");
createMessageElement("delete", "Deleted", true);
createMessageElement("save", "Saved Successfully");
createMessageElement("convert", "Converted Successfully");
createMessageElement("error", "Sorry. Couldn't open image...", true);

const scrollContainer = document.createElement("div");
scrollContainer.id = "scroll-container";
document.body.appendChild(scrollContainer);

const scrollLeftBtn = document.createElement("button");
scrollLeftBtn.innerText = "<";
scrollLeftBtn.style.position = "fixed";
scrollLeftBtn.style.left = "16px";
scrollLeftBtn.style.top = "50%";
scrollLeftBtn.style.transform = "translateY(-50%)";
scrollLeftBtn.style.zIndex = "1000";
scrollLeftBtn.style.fontSize = "2em";
scrollLeftBtn.style.background = "#fff";
scrollLeftBtn.style.border = "1px solid #ccc";
scrollLeftBtn.style.borderRadius = "50%";
scrollLeftBtn.style.width = "48px";
scrollLeftBtn.style.height = "48px";
scrollLeftBtn.style.opacity = "0.8";
scrollLeftBtn.style.cursor = "pointer";
document.body.appendChild(scrollLeftBtn);

const scrollRightBtn = document.createElement("button");
scrollRightBtn.innerText = ">";
scrollRightBtn.style.position = "fixed";
scrollRightBtn.style.right = "16px";
scrollRightBtn.style.top = "50%";
scrollRightBtn.style.transform = "translateY(-50%)";
scrollRightBtn.style.zIndex = "1000";
scrollRightBtn.style.fontSize = "2em";
scrollRightBtn.style.background = "#fff";
scrollRightBtn.style.border = "1px solid #ccc";
scrollRightBtn.style.borderRadius = "50%";
scrollRightBtn.style.width = "48px";
scrollRightBtn.style.height = "48px";
scrollRightBtn.style.opacity = "0.8";
scrollRightBtn.style.cursor = "pointer";
document.body.appendChild(scrollRightBtn);

function updateScrollUI() {
  imageLayerQueue.forEach((layer, idx) => {
    // Always insert in order for horizontal layout
    if (layer.imgPanel.parentNode !== scrollContainer) {
      try {
        document.body.removeChild(layer.imgPanel);
      } catch (e) {}
      if (idx >= scrollContainer.children.length) {
        scrollContainer.appendChild(layer.imgPanel);
      } else {
        scrollContainer.insertBefore(
          layer.imgPanel,
          scrollContainer.children[idx]
        );
      }
    } else if (scrollContainer.children[idx] !== layer.imgPanel) {
      scrollContainer.insertBefore(
        layer.imgPanel,
        scrollContainer.children[idx]
      );
    }
    // Flex item settings to prevent overlap
    layer.imgPanel.style.display = "flex";
    layer.imgPanel.style.flexDirection = "column";
    layer.imgPanel.style.flexShrink = "0";
    layer.imgPanel.style.flexGrow = "0";
    layer.imgPanel.style.flexBasis = "auto";
    layer.imgPanel.style.alignItems = "center";
    layer.imgPanel.style.justifyContent = "center";
    layer.imgPanel.style.margin = "0"; // gap handles spacing
    layer.imgPanel.style.maxWidth = "";
    layer.imgPanel.style.minWidth = "";
    layer.imgPanel.style.boxSizing = "border-box";
  });
  scrollLeftBtn.disabled = scrollContainer.scrollLeft <= 0;
  scrollRightBtn.disabled =
    scrollContainer.scrollLeft + scrollContainer.clientWidth >=
    scrollContainer.scrollWidth - 2;
}

scrollLeftBtn.addEventListener("click", () => {
  scrollContainer.scrollBy({ left: -400, behavior: "smooth" });
  setTimeout(updateScrollUI, 400);
});
scrollRightBtn.addEventListener("click", () => {
  scrollContainer.scrollBy({ left: 400, behavior: "smooth" });
  setTimeout(updateScrollUI, 400);
});

scrollContainer.addEventListener("scroll", updateScrollUI);

class Parameter {
  static num = 0;
}
function createDefaultImage() {
  if (imageLayerQueue.length === 0) {
  } else {
    Parameter.num++;
  }
  imageLayerQueue.push(new ImageLayer());
  document.body.appendChild(imageLayerQueue[Parameter.num].imgPanel);
  imageLayerQueue[Parameter.num].openImg("./assets/addImage.png");
  imageLayerQueue[Parameter.num].imgPanel.focus();
  imageLayerQueue[Parameter.num].updateSio();
}

class ImageLayer {
  static drawFlag = false;
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
    // ...existing code...

    this.canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault();

      // Create context menu
      const contextMenu = document.createElement("div");
      contextMenu.style.position = "fixed";
      contextMenu.style.left = event.clientX + "px";
      contextMenu.style.top = event.clientY + "px";
      contextMenu.style.backgroundColor = "#fff";
      contextMenu.style.border = "1px solid #ccc";
      contextMenu.style.borderRadius = "4px";
      contextMenu.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
      contextMenu.style.zIndex = "10000";
      contextMenu.style.minWidth = "120px";
      contextMenu.style.padding = "4px 0";
      contextMenu.id = "canvas-context-menu";

      // Copy menu item
      const copyItem = document.createElement("div");
      copyItem.innerText = "Copy";
      copyItem.style.padding = "8px 16px";
      copyItem.style.cursor = "pointer";
      copyItem.style.fontSize = "14px";
      copyItem.addEventListener("mouseover", () => {
        copyItem.style.backgroundColor = "#f0f0f0";
      });
      copyItem.addEventListener("mouseout", () => {
        copyItem.style.backgroundColor = "transparent";
      });
      copyItem.addEventListener("click", () => {
        copyImage();
        document.body.removeChild(contextMenu);
      });

      // Paste menu item
      const pasteItem = document.createElement("div");
      pasteItem.innerText = "Paste";
      pasteItem.style.padding = "8px 16px";
      pasteItem.style.cursor = "pointer";
      pasteItem.style.fontSize = "14px";
      pasteItem.addEventListener("mouseover", () => {
        pasteItem.style.backgroundColor = "#f0f0f0";
      });
      pasteItem.addEventListener("mouseout", () => {
        pasteItem.style.backgroundColor = "transparent";
      });
      pasteItem.addEventListener("click", () => {
        pasteImage();
        document.body.removeChild(contextMenu);
      });

      contextMenu.appendChild(copyItem);
      contextMenu.appendChild(pasteItem);
      document.body.appendChild(contextMenu);

      // Remove context menu when clicking elsewhere
      const removeContextMenu = (e) => {
        if (!contextMenu.contains(e.target)) {
          if (document.body.contains(contextMenu)) {
            document.body.removeChild(contextMenu);
          }
          document.removeEventListener("click", removeContextMenu);
        }
      };

      setTimeout(() => {
        document.addEventListener("click", removeContextMenu);
      }, 10);
    });

    // ...existing code in build() method...

    this.deleteBtn = document.createElement("button");
    this.deleteBtn.id = "deleteBtn";
    const img = document.createElement("img");
    img.src = "assets/close.ico";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    this.deleteBtn.appendChild(img);

    const copyImage = () => {
      copy = imageLayerQueue[Parameter.num];
      copy.filepath = imageLayerQueue[Parameter.num].filepath;
      showMessage("img-copy");
    };

    const pasteImage = () => {
      imageLayerQueue[Parameter.num].openImgBuffer(
        copy.buffer,
        copy.nameSpan.textContent + "_copy." + copy.extension
      );
      showMessage("img-paste");
    };

    const deleteImage = () => {
      this.imgPanel.parentNode.removeChild(this.imgPanel);
      var deletedIndex = 0;
      for (let i = 0; i < imageLayerQueue.length; i++) {
        if (imageLayerQueue[i].imgPanel.id == this.imgPanel.id) {
          imageLayerQueue.splice(i, 1);
          deletedIndex = i;
          break;
        }
      }
      Parameter.num = Math.max(0, imageLayerQueue.length - 1);
      if (imageLayerQueue.length === 0) {
        createDefaultImage();
      } else if (
        imageLayerQueue.length > 0 &&
        deletedIndex === imageLayerQueue.length
      ) {
        createDefaultImage();
      }
      showMessage("delete");
    };

    this.deleteBtn.addEventListener("click", deleteImage);

    this.nameSpan = document.createElement("span");
    this.nameSpan.id = "nameSpan";

    document.addEventListener("keydown", (event) => {
      if (
        (event.ctrlKey && event.key === "d") ||
        (event.key === "Delete" && document.activeElement === this.imgPanel)
      ) {
        deleteImage();
      } else if (event.ctrlKey && event.key === "c") {
        copyImage();
      } else if (event.ctrlKey && event.key === "v") {
        pasteImage();
      } else if (
        document.activeElement === this.imgPanel &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight")
      ) {
        if (event.ctrlKey && event.key === "ArrowLeft") {
          Parameter.num = 0;
          imageLayerQueue[Parameter.num].imgPanel.focus();
          imageLayerQueue[Parameter.num].updateFocus();
          imageLayerQueue[Parameter.num].updateSio();
        } else if (event.ctrlKey && event.key === "ArrowRight") {
          Parameter.num = imageLayerQueue.length - 1;
          imageLayerQueue[Parameter.num].imgPanel.focus();
          imageLayerQueue[Parameter.num].updateFocus();
          imageLayerQueue[Parameter.num].updateSio();
        } else if (event.key === "ArrowLeft" && Parameter.num > 0) {
          Parameter.num--;
          imageLayerQueue[Parameter.num].imgPanel.focus();
          imageLayerQueue[Parameter.num].updateFocus();
          imageLayerQueue[Parameter.num].updateSio();
        } else if (
          event.key === "ArrowRight" &&
          Parameter.num < imageLayerQueue.length - 1
        ) {
          Parameter.num++;
          imageLayerQueue[Parameter.num].imgPanel.focus();
          imageLayerQueue[Parameter.num].updateFocus();
          imageLayerQueue[Parameter.num].updateSio();
        }
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
        showMessage("copy");
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
    setTimeout(() => {
      updateScrollUI();
      // Automatically scroll to the right when a new image is added
      scrollContainer.scrollLeft = scrollContainer.scrollWidth;
    }, 0);
  }

  build() {
    this.imgPanel.addEventListener("click", (event) => {
      Parameter.num = imageLayerQueue.findIndex(
        (layer) => layer.imgPanel.id == this.imgPanel.id
      );
      this.updateFocus();
      this.updateSio();
    });

    this.imgPanel.addEventListener(
      "mouseover",
      function (event) {
        document.body.style.cursor = "pointer";
      },
      false
    );

    this.imgPanel.addEventListener(
      "mouseout",
      function (event) {
        document.body.style.cursor = "default";
      },
      false
    );

    this.canvas.addEventListener(
      "dragover",
      function (event) {
        event.preventDefault();
      },
      false
    );

    this.canvas.addEventListener("dragenter", (event) => {
      event.preventDefault();
      Parameter.num = imageLayerQueue.findIndex(
        (layer) => layer.imgPanel.id == this.imgPanel.id
      );
      this.updateFocus();
      this.updateSio();
    });

    this.canvas.addEventListener("drop", (event) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (!file) return;

      const tryOpenImg = async (filepathOrBuffer) => {
        let isOpened;
        if (typeof filepathOrBuffer === "string") {
          isOpened = await imageLayerQueue[Parameter.num].openImg(
            filepathOrBuffer
          );
        } else {
          isOpened = await imageLayerQueue[Parameter.num].openImgBuffer(
            filepathOrBuffer,
            file.name
          );
        }
        if (!isOpened) return;
        // Only create a new default layer if dropping on an empty canvas
        if (
          Parameter.num === imageLayerQueue.length - 1 ||
          this.canvas.id !== "full"
        ) {
          createDefaultImage();
        }
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
          if (ImageLayer.dragFlag) {
            this.ctx.lineTo(
              evt.x - this.canvas.getBoundingClientRect().left,
              evt.y - this.canvas.getBoundingClientRect().top
            );
            this.ctx.stroke();
          }
        });
        this.ctx.closePath();
      }

      if (document.body.style.cursor === "crosshair") {
        var ctxs = this.canvas.getContext("2d");
        const rect = this.canvas.getBoundingClientRect();
        const startX = event.clientX - rect.left;
        const startY = event.clientY - rect.top;
        this.initialX = startX;
        this.initialY = startY;
        ctxs.setLineDash([2]);

        const mouseMoveHandler = (evt) => {
          ctxs.clearRect(
            0,
            0,
            this.canvas.clientWidth,
            this.canvas.clientHeight
          );
          ctxs.drawImage(this.image, 0, 0);
          const currX = evt.clientX - rect.left;
          const currY = evt.clientY - rect.top;
          // Calculate top-left and width/height regardless of drag direction
          const x = Math.min(startX, currX);
          const y = Math.min(startY, currY);
          const w = Math.abs(currX - startX);
          const h = Math.abs(currY - startY);
          this.initialX = x;
          this.initialY = y;
          this.cropWidth = w;
          this.cropHeight = h;
          ctxs.strokeRect(x, y, w, h);
        };
        const mouseUpHandler = (evt) => {
          this.canvas.removeEventListener("mousemove", mouseMoveHandler);
          document.removeEventListener("mouseup", mouseUpHandler);
          ImageLayer.dragFlag = false;
        };
        this.canvas.addEventListener("mousemove", mouseMoveHandler);
        document.addEventListener("mouseup", mouseUpHandler);
      }
    });

    this.canvas.addEventListener("mouseup", (event) => {
      ImageLayer.dragFlag = false;
      if (document.body.style.cursor === "crosshair") {
        // cropWidth/cropHeight는 항상 양수, initialX/initialY는 항상 좌상단
        const cropX = Math.round(this.initialX);
        const cropY = Math.round(this.initialY);
        const cropW = Math.round(this.cropWidth);
        const cropH = Math.round(this.cropHeight);

        if (
          cropW > 0 &&
          cropH > 0 &&
          this.buffer &&
          this.information &&
          cropX + cropW <= this.information.width &&
          cropY + cropH <= this.information.height
        ) {
          sharp(this.buffer)
            .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
            .toBuffer((err, buf, info) => {
              if (!err && buf && info) {
                this.updatePreviewImg(buf, info);
              }
            });
        }
      }
    });

    this.imgPanel.style.position = "relative";
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
        showMessage("convert");
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
        showMessage("convert");
      } else {
        sharp(this.buffer)
          .toFormat(this.extension)
          .png()
          .toBuffer((err, buf, info) => {
            this.updatePreviewImg(buf, info);
            showMessage("convert");
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
      // Display only at original size (no resize)
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.image, 0, 0);
    };

    this.updateImgInfoText(info);
    this.extractMainColors(buf, info);
    this.updateExtension(this.extension);

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
      const panels = document.querySelectorAll(".imgPanel");
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
        document.body.style.width = maxRight + 50 + "px";
      }
      if (maxBottom > document.body.scrollHeight) {
        document.body.style.height = maxBottom + 50 + "px";
      }
    }, 100);
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

  updateExtension(extension) {
    this.extensionComboBox.value = extension;
  }

  async openImg(filepath) {
    this.extension = path.extname(filepath).replace(".", "");
    if (filepath !== "./assets/addImage.png") {
      this.canvas.id = "full";
    }

    const afterLoad = (buf, info) => {
      this.updatePreviewImg(buf, info);
      updateScrollUI();
      scrollContainer.scrollLeft = scrollContainer.scrollWidth;
    };

    let loader;
    if (["tiff", "tif"].includes(this.extension)) {
      loader = sharp(filepath).png();
    } else if (this.extension === "ico") {
      loader = ico.sharpsFromIco(filepath)[0].png();
    } else if (this.extension === "bmp") {
      loader = bmp.sharpFromBmp(filepath).png();
    } else {
      loader = sharp(filepath);
    }

    return new Promise((resolve) => {
      loader.toBuffer((err, buf, info) => {
        if (err) {
          showMessage("error");
          this.canvas.id = "default";
          resolve(false);
          return;
        }
        this.filepath = filepath;
        this.nameSpan.textContent = path.basename(
          filepath,
          path.extname(filepath)
        );
        afterLoad(buf, info);
        resolve(true);
      });
    });
  }

  async openImgBuffer(buffer, name) {
    this.extension = path.extname(name).replace(".", "");
    this.canvas.id = "full";

    const afterLoad = (buf, info) => {
      this.updatePreviewImg(buf, info);
      updateScrollUI();
      scrollContainer.scrollLeft = scrollContainer.scrollWidth;
    };

    let loader;
    if (["tiff", "tif"].includes(this.extension)) {
      loader = sharp(buffer).png();
    } else if (this.extension === "ico") {
      loader = ico.sharpsFromIco(buffer)[0].png();
    } else if (this.extension === "bmp") {
      loader = bmp.sharpFromBmp(buffer).png();
    } else {
      loader = sharp(buffer);
    }

    return new Promise((resolve) => {
      loader.toBuffer((err, buf, info) => {
        if (err) {
          showMessage("error");
          this.canvas.id = "default";
          resolve(false);
          return;
        }
        this.nameSpan.textContent = path
          .basename(name)
          .replace("." + this.extension, "");
        afterLoad(buf, info);
        resolve(true);
      });
    });
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
        showMessage("save");
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
      this.updateExtension(this.extension);
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
      this.updateExtension(this.extension);
    } catch (err) {
      this.i--;
    }
  }
}

module.exports = {
  ImageLayer: ImageLayer,
  Parameter: Parameter,
  drawFlag: ImageLayer.drawFlag,
  dragFlag: ImageLayer.dragFlag,
  imageLayerQueue: imageLayerQueue,
  createDefaultImage: createDefaultImage,
};
