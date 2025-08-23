const electron = require("electron");
const pkg = require("./package.json");
const { app, ipcMain, dialog, BrowserWindow, BrowserView, Menu } = electron;

//electron refresh (only develop)
if (process.env.NODE_ENV === "development") {
  try {
    require("electron-reload")(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`),
    });
  } catch (e) {
    console.log("electron-reload not found (this is okay in production)");
  }
}

function createMainWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 1024,
    center: true,
    icon: `${__dirname}/assets/icon.ico`,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      // devTools: true,
      //   preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");
  // Open the DevTools.(only develop)
  // mainWindow.webContents.openDevTools();
  return mainWindow;
}

function createView(type, mainWindow) {
  const view = new BrowserView({
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      // devTools: true,
      //   preload: path.join(__dirname, "preload.js"),
    },
  });

  view.setBounds({ x: 0, y: 33, width: 1280, height: 90 });
  view.setAutoResize({ width: true, height: false });
  view.webContents.loadFile(`./pages/_panel.html`);
  mainWindow.addBrowserView(view);
  // view.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 1024,
    center: true,
    icon: `${__dirname}/assets/icon.ico`,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      // devTools: true,
      //   preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile("index.html");
  // Open the DevTools.(only develop)
  // mainWindow.webContents.openDevTools();

  ["resizeImgREQ", "filterImgREQ", "rotateImgREQ", "paintImgREQ"].forEach(
    (item, index, arr) => {
      ipcMain.on(item, (event) => {
        mainWindow
          .getBrowserViews()[0]
          .webContents.loadFile(
            `./pages/${item.replace("ImgREQ", "")}_panel.html`
          );
      });
    }
  );

  ipcMain.on("resizeValueSEND", (event, res) => {
    mainWindow.webContents.send("resizeImgCMD", res);
    mainWindow.webContents.focus();
  });

  ipcMain.on("blurValueSEND", (event, res) => {
    mainWindow.webContents.send("blurImgCMD", res);
    mainWindow.webContents.focus();
  });

  ipcMain.on("sharpenValueSEND", (event, res) => {
    mainWindow.webContents.send("sharpenImgCMD", res);
    mainWindow.webContents.focus();
  });

  ipcMain.on("normalizeImgREQ", (event) => {
    mainWindow.webContents.send("normalizeImgCMD");
    mainWindow.webContents.focus();
  });

  ipcMain.on("medianValueSEND", (event, res) => {
    mainWindow.webContents.send("medianImgCMD", res);
    mainWindow.webContents.focus();
  });

  ipcMain.on("rotateValueSEND", (event, res) => {
    mainWindow.webContents.send("rotateImgCMD", res);
    mainWindow.webContents.focus();
  });

  ipcMain.on("tintValueSEND", (event, res) => {
    mainWindow.webContents.send("tintImgCMD", res);
    mainWindow.webContents.focus();
  });

  ipcMain.on("rotateLeftImgREQ", (event) => {
    mainWindow.webContents.send("rotateLeftImgCMD");
    mainWindow.webContents.focus();
  });

  ipcMain.on("rotateRightImgREQ", (event) => {
    mainWindow.webContents.send("rotateRightImgCMD");
    mainWindow.webContents.focus();
  });

  ipcMain.on("flipImgREQ", (event) => {
    mainWindow.webContents.send("flipImgCMD");
    mainWindow.webContents.focus();
  });

  ipcMain.on("flopImgREQ", (event) => {
    mainWindow.webContents.send("flopImgCMD");
    mainWindow.webContents.focus();
  });

  ipcMain.on("bitwiseImgREQ", (event) => {
    mainWindow.webContents.send("bitwiseImgCMD");
    mainWindow.webContents.focus();
  });

  ipcMain.on("negativeImgREQ", (event) => {
    mainWindow.webContents.send("negativeImgCMD");
    mainWindow.webContents.focus();
  });

  ipcMain.on("grayScaleImgREQ", (event) => {
    mainWindow.webContents.send("grayScaleImgCMD");
    mainWindow.webContents.focus();
  });

  ipcMain.on("cropImgREQ", (event, res) => {
    mainWindow.webContents.send("cropImgCMD", res);
    mainWindow.webContents.focus();
  });

  ipcMain.on("drawImgREQ", (event, res) => {
    mainWindow.webContents.send("drawImgCMD", res);
    mainWindow.webContents.focus();
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

  // main
  ipcMain.on("showMenuREQ", (event) => {
    const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
    const template = [
      {
        label: "File",
        submenu: [
          {
            label: "Open",
            click: () => {
              dialog
                .showOpenDialog({
                  properties: ["openFile"],
                  filters: [
                    {
                      name: "Image file",
                      extensions: ["png", "jpg", "jpeg", "webp"],
                    },
                  ],
                })
                .then((result) => {
                  event.sender.send("openImgCMD", result.filePaths[0]);
                });
            },
          },
          {
            label: "Save",
            click: () => {
              event.sender.send("saveImgCMD");
            },
          },
          {
            label: "Save As...",
            click: () => {
              event.sender.send("setExtensionCMD");
            },
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
                    } else {
                      console.error(
                        "Main window is not available or has been destroyed."
                      );
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
                      } else {
                        console.error("No BrowserView available.");
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
                message: `Author : ${pkg.author}\nVersion : v${pkg.version}\nLicense : ${pkg.license}\n`,
              });
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    createView("", mainWindow);
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
