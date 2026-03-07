// @ts-nocheck
const electron = require("electron");
const path = require("path");
const pkg = require(path.join(__dirname, "..", "package.json"));
const {
  app,
  ipcMain,
  dialog,
  BrowserWindow,
  BrowserView,
  Menu,
  MenuItem,
  clipboard,
  nativeImage,
} = electron;
const { ImageProcessor } = require("./processing/image_processor");
const { IPCBridge } = require("./utils/ipc_bridge");

//electron refresh (only develop)
if (process.env.NODE_ENV === "development") {
  try {
    require("electron-reload")(__dirname, {
      electron: require("electron"),
    });
  } catch (e) {
    console.log("electron-reload not found (this is okay in production)");
  }
}

// Configuration for browser window creation
const WINDOW_CONFIG = {
  width: 1280,
  height: 1024,
  center: true,
  icon: `${__dirname}/assets/icon.ico`,
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false,
  },
};

function createMainWindow() {
  const mainWindow = new BrowserWindow(WINDOW_CONFIG);
  mainWindow.webContents.on("console-message", (_event, level, message) => {
    console.log(`[renderer:${level}] ${message}`);
  });
  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error(
        `[renderer:load-fail] ${errorCode} ${errorDescription} ${validatedURL}`
      );
    }
  );
  mainWindow.webContents.on("did-finish-load", () => {
    void mainWindow.webContents.executeJavaScript(`
      JSON.stringify({
        href: location.href,
        hasTemplate: Boolean(document.getElementById("image-panel-template")),
        hasScrollContainer: Boolean(document.getElementById("scroll-container")),
        panelCount: document.querySelectorAll(".imgPanel").length,
        containerChildren: document.getElementById("scroll-container")?.children.length ?? -1
      })
    `).then((state) => {
      console.log(`[renderer:dom] ${state}`);
    }).catch((error) => {
      console.error(`[renderer:dom-error] ${error.message}`);
    });
  });
  mainWindow.loadFile(path.join(__dirname, "index.html"));
  return mainWindow;
}

function createPanelView(mainWindow) {
  const view = new BrowserView({
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  view.webContents.on("console-message", (_event, level, message) => {
    console.log(`[panel:${level}] ${message}`);
  });
  view.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error(
        `[panel:load-fail] ${errorCode} ${errorDescription} ${validatedURL}`
      );
    }
  );

  view.setBounds({ x: 0, y: 33, width: 1280, height: 90 });
  view.setAutoResize({ width: true, height: false });
  view.webContents.loadFile(path.join(__dirname, "pages", "_panel.html"));
  mainWindow.addBrowserView(view);
}

// Context menu helper
function createContextMenu(event, { hasUndo, hasRedo }) {
  const contextMenuItems = [
    { label: "Copy", accelerator: "Ctrl+C", action: "copy" },
    { label: "Paste", accelerator: "Ctrl+V", action: "paste" },
    { type: "separator" },
    { label: "Delete", accelerator: "Delete", action: "delete" },
    { type: "separator" },
    { label: "Undo", accelerator: "Ctrl+Z", action: "undo", enabled: hasUndo },
    { label: "Redo", accelerator: "Ctrl+Y", action: "redo", enabled: hasRedo },
    {
      label: "Watermark",
      accelerator: "Ctrl+W",
      action: "watermark",
      enabled: true,
    },
    { type: "separator" },
    { label: "Hide", accelerator: "Alt + H", action: "hide" },
  ];

  const menu = new Menu();
  contextMenuItems.forEach((item) => {
    if (item.type === "separator") {
      menu.append(new MenuItem({ type: "separator" }));
    } else {
      menu.append(
        new MenuItem({
          label: item.label,
          accelerator: item.accelerator,
          enabled: item.enabled !== false,
          click: () => {
            event.sender.send("imgkit-context-menu-action", item.action);
          },
        })
      );
    }
  });

  return menu;
}

// Application menu helper
function buildApplicationMenu(event, mainWindow) {
  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  const IMAGE_EXTENSIONS = [
    "pix",
    "png",
    "svg",
    "jpg",
    "jpeg",
    "webp",
    "bmp",
    "gif",
    "ico",
    "tiff",
    "tif",
    "avif",
    "heif",
    "heic",
  ];

  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Open...",
          accelerator: "Ctrl+O",
          click: () => {
            dialog
              .showOpenDialog({
                properties: ["openFile", "multiSelections"],
                filters: [{ name: "Image file", extensions: IMAGE_EXTENSIONS }],
              })
              .then((result) => {
                event.sender.send("openImgCMD", result.filePaths);
              });
          },
        },
        {
          label: "Save",
          accelerator: "Ctrl+S",
          click: () => event.sender.send("saveImgCMD"),
        },
        {
          label: "Save As...",
          accelerator: "Ctrl+Shift+S",
          click: () => event.sender.send("setExtensionCMD"),
        },
      ],
    },
    ...(isDev
      ? [
          {
            label: "Debug",
            submenu: [
              {
                label: "Toggle Developer Tools",
                accelerator: "F12",
                click: () => {
                  if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.openDevTools();
                  }
                },
              },
              {
                label: "Toggle BrowserView Developer Tools",
                accelerator: "Ctrl+Shift+I",
                click: () => {
                  if (mainWindow && !mainWindow.isDestroyed()) {
                    const views = mainWindow.getBrowserViews();
                    if (views.length > 0) {
                      views[0].webContents.openDevTools();
                    }
                  }
                },
              },
            ],
          },
        ]
      : []),
    {
      label: "Help",
      submenu: [
        {
          label: "About",
          click: () => {
            dialog.showMessageBox({
              title: "About",
              buttons: ["Ok"],
              message: `Author : ${pkg.author.name}\nEmail : ${pkg.author.email}\nVersion : v${pkg.version}\nLicense : ${pkg.license}\n`,
            });
          },
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);

  const mainWindow = createMainWindow();

  // Initialize IPCBridge instance
  const ipcBridge = new IPCBridge(ipcMain, mainWindow);

  // Panel loading handlers - load panel for various image operations
  const PANEL_OPERATIONS = [
    "resizeImgREQ",
    "cropImgREQ",
    "filterImgREQ",
    "rotateImgREQ",
    "paintImgREQ",
    "image_analysisImgREQ",
  ];

  PANEL_OPERATIONS.forEach((operation) => {
    ipcMain.on(operation, () => {
      const panelName = operation.replace("ImgREQ", "");
      mainWindow
        .getBrowserViews()[0]
        .webContents.loadFile(
          path.join(__dirname, "pages", `${panelName}_panel.html`)
        );
    });
  });

  // IPC Forwarders - Register simple forwarding patterns in bulk
  ipcBridge.registerMultiple([
    // Resize commands
    { from: "resizeValueSEND", to: "resizeImgCMD" },
    { from: "resizePixelValueSEND", to: "resizePixelImgCMD" },

    // Filter commands
    { from: "blurValueSEND", to: "blurImgCMD" },
    { from: "sharpenValueSEND", to: "sharpenImgCMD" },
    { from: "normalizeImgREQ", to: "normalizeImgCMD" },
    { from: "medianValueSEND", to: "medianImgCMD" },
    { from: "dilateValueSEND", to: "dilateImgCMD" },
    { from: "erodeValueSEND", to: "erodeImgCMD" },
    { from: "bitwiseValueSEND", to: "bitwiseImgCMD" },
    { from: "negativeImgREQ", to: "negativeImgCMD" },
    { from: "grayScaleImgREQ", to: "grayScaleImgCMD" },

    // Rotate commands
    { from: "rotateValueSEND", to: "rotateImgCMD" },
    { from: "rotateLeftImgREQ", to: "rotateLeftImgCMD" },
    { from: "rotateRightImgREQ", to: "rotateRightImgCMD" },
    { from: "flipImgREQ", to: "flipImgCMD" },
    { from: "flopImgREQ", to: "flopImgCMD" },

    // Paint commands
    { from: "tintValueSEND", to: "tintImgCMD" },
    { from: "colorpickerImgREQ", to: "colorpickerImgCMD" },
    { from: "watermarkUploadREQ", to: "watermarkUploadCMD" },
    { from: "watermarkImgREQ", to: "watermarkImgCMD" },
    { from: "drawImgREQ", to: "drawImgCMD" },
    { from: "padImgREQ", to: "padImgCMD" },

    // Crop commands
    { from: "rectCropImgREQ", to: "cropImgCMD" },
  ]);

  // Custom handler - colorpicker requires broadcast to BrowserViews
  ipcMain.on("colorpickerValueSEND", async (event, color) => {
    const views = mainWindow.getBrowserViews();
    const color_name = await ImageProcessor.getColorName(color);
    views.forEach((view) => {
      view.webContents.send("colorpickerValueRECV", color, color_name);
    });
  });

  // Notification Handler - Forward to main window
  ipcMain.on("showNotificationREQ", (event, notificationId) => {
    mainWindow.webContents.send("showNotificationCMD", notificationId);
  });

  // ImgKit Context Menu Handler
  ipcMain.on("show-imgkit-context-menu", (event, options) => {
    const menu = createContextMenu(event, options);
    menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
  });

  // Native Clipboard Handlers
  ipcMain.on("copy-image-to-clipboard", (event, imageBuffer) => {
    try {
      const image = nativeImage.createFromBuffer(Buffer.from(imageBuffer));
      clipboard.writeImage(image);
    } catch (error) {
      console.error("Failed to copy image to clipboard:", error);
    }
  });

  ipcMain.on("imgkit-layer-event", (event, payload) => {
    event.sender.send("imgkit-layer-event", payload);
  });

  ipcMain.handle("paste-image-from-clipboard", () => {
    try {
      const image = clipboard.readImage();
      if (!image.isEmpty()) {
        return image.toPNG();
      }
      return null;
    } catch (error) {
      console.error("Failed to paste image from clipboard:", error);
      return null;
    }
  });

  ipcMain.on("FullScreenREQ", (event) => {
    mainWindow.setSimpleFullScreen(true);
    mainWindow.show();
  });

  ipcMain.on("DefaultScreenREQ", (event) => {
    mainWindow.setSimpleFullScreen(false);
    mainWindow.show();
  });

  ipcMain.on("extensionValueSEND", (event, res) => {
    dialog
      .showSaveDialog({
        title: "Save Image",
        defaultPath: "~/image",
        filters: [
          {
            name: "Image file",
            extensions: [res],
          },
        ],
      })
      .then((result) => {
        event.sender.send("saveAsImgCMD", result.filePath);
      });
  });

  ipcMain.on("saveImgREQ", (event) => {
    event.sender.send("saveImgCMD");
  });

  ipcMain.on("deleteImgREQ", (event) => {
    event.sender.send("deleteImgCMD");
  });

  // Show application menu
  ipcMain.on("showMenuREQ", (event) => {
    const menu = buildApplicationMenu(event, mainWindow);
    Menu.setApplicationMenu(menu);
    createPanelView(mainWindow);
  });

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
