"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const image_processor_1 = require("./processing/image_processor");
const ipc_bridge_1 = require("./utils/ipc_bridge");
// Import package.json for app metadata
const pkg = require('./package.json');
// Electron refresh (only in development)
if (process.env.NODE_ENV === 'development') {
    try {
        require('electron-reload')(__dirname, {
            electron: require(`${__dirname}/node_modules/electron`),
        });
    }
    catch (e) {
        console.log('electron-reload not found (this is okay in production)');
    }
}
// Configuration for browser window creation
const WINDOW_CONFIG = {
    width: 1280,
    height: 1024,
    center: true,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
    },
};
function createMainWindow() {
    const mainWindow = new electron_1.BrowserWindow(WINDOW_CONFIG);
    mainWindow.loadFile('index.html');
    return mainWindow;
}
function createPanelView(mainWindow) {
    const view = new electron_1.BrowserView({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    view.setBounds({ x: 0, y: 33, width: 1280, height: 90 });
    view.setAutoResize({ width: true, height: false });
    view.webContents.loadFile('./pages/_panel.html');
    mainWindow.addBrowserView(view);
}
// Context menu helper
function createContextMenu(event, { hasUndo, hasRedo }) {
    const contextMenuItems = [
        { label: 'Copy', accelerator: 'Ctrl+C', action: 'copy' },
        { label: 'Paste', accelerator: 'Ctrl+V', action: 'paste' },
        { type: 'separator' },
        { label: 'Delete', accelerator: 'Delete', action: 'delete' },
        { type: 'separator' },
        { label: 'Undo', accelerator: 'Ctrl+Z', action: 'undo', enabled: hasUndo },
        { label: 'Redo', accelerator: 'Ctrl+Y', action: 'redo', enabled: hasRedo },
        {
            label: 'Watermark',
            accelerator: 'Ctrl+W',
            action: 'watermark',
            enabled: true,
        },
        { type: 'separator' },
        { label: 'Hide', accelerator: 'Alt + H', action: 'hide' },
    ];
    const menu = new electron_1.Menu();
    contextMenuItems.forEach((item) => {
        if (item.type === 'separator') {
            menu.append(new electron_1.MenuItem({ type: 'separator' }));
        }
        else {
            menu.append(new electron_1.MenuItem({
                label: item.label,
                accelerator: item.accelerator,
                enabled: item.enabled !== false,
                click: () => {
                    event.sender.send('imgkit-context-menu-action', item.action);
                },
            }));
        }
    });
    return menu;
}
// Application menu helper
function buildApplicationMenu(event, mainWindow) {
    const isDev = process.env.NODE_ENV === 'development' || !electron_1.app.isPackaged;
    const IMAGE_EXTENSIONS = [
        'pix',
        'png',
        'svg',
        'jpg',
        'jpeg',
        'webp',
        'bmp',
        'gif',
        'ico',
        'tiff',
        'tif',
        'avif',
        'heif',
        'heic',
    ];
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Open...',
                    accelerator: 'Ctrl+O',
                    click: async () => {
                        const result = await electron_1.dialog.showOpenDialog(mainWindow, {
                            properties: ['openFile', 'multiSelections'],
                            filters: [{ name: 'Image file', extensions: IMAGE_EXTENSIONS }],
                        });
                        event.sender.send('openImgCMD', result.filePaths);
                    },
                },
                {
                    label: 'Save',
                    accelerator: 'Ctrl+S',
                    click: () => event.sender.send('saveImgCMD'),
                },
                {
                    label: 'Save As...',
                    accelerator: 'Ctrl+Shift+S',
                    click: () => event.sender.send('setExtensionCMD'),
                },
            ],
        },
        ...(isDev
            ? [
                {
                    label: 'Debug',
                    submenu: [
                        {
                            label: 'Toggle Developer Tools',
                            accelerator: 'F12',
                            click: () => {
                                if (mainWindow && !mainWindow.isDestroyed()) {
                                    mainWindow.webContents.openDevTools();
                                }
                            },
                        },
                        {
                            label: 'Toggle BrowserView Developer Tools',
                            accelerator: 'Ctrl+Shift+I',
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
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        electron_1.dialog.showMessageBox({
                            title: 'About',
                            buttons: ['Ok'],
                            message: `Author : ${pkg.author.name}\nEmail : ${pkg.author.email}\nVersion : v${pkg.version}\nLicense : ${pkg.license}\n`,
                        });
                    },
                },
            ],
        },
    ];
    return electron_1.Menu.buildFromTemplate(template);
}
// This method will be called when Electron has finished initialization
electron_1.app.whenReady().then(() => {
    electron_1.Menu.setApplicationMenu(null);
    const mainWindow = createMainWindow();
    // Initialize IPCBridge instance
    const ipcBridge = new ipc_bridge_1.IPCBridge(electron_1.ipcMain, mainWindow);
    // Panel loading handlers - load panel for various image operations
    const PANEL_OPERATIONS = [
        'resizeImgREQ',
        'cropImgREQ',
        'filterImgREQ',
        'rotateImgREQ',
        'paintImgREQ',
        'image_analysisImgREQ',
    ];
    PANEL_OPERATIONS.forEach((operation) => {
        electron_1.ipcMain.on(operation, () => {
            const panelName = operation.replace('ImgREQ', '');
            mainWindow
                .getBrowserViews()[0]
                .webContents.loadFile(`./pages/${panelName}_panel.html`);
        });
    });
    // IPC Forwarders - Register simple forwarding patterns in bulk
    ipcBridge.registerMultiple([
        // Resize commands
        { from: 'resizeValueSEND', to: 'resizeImgCMD' },
        { from: 'resizePixelValueSEND', to: 'resizePixelImgCMD' },
        // Filter commands
        { from: 'blurValueSEND', to: 'blurImgCMD' },
        { from: 'sharpenValueSEND', to: 'sharpenImgCMD' },
        { from: 'normalizeImgREQ', to: 'normalizeImgCMD' },
        { from: 'medianValueSEND', to: 'medianImgCMD' },
        { from: 'dilateValueSEND', to: 'dilateImgCMD' },
        { from: 'erodeValueSEND', to: 'erodeImgCMD' },
        { from: 'bitwiseValueSEND', to: 'bitwiseImgCMD' },
        { from: 'negativeImgREQ', to: 'negativeImgCMD' },
        { from: 'grayScaleImgREQ', to: 'grayScaleImgCMD' },
        // Rotate commands
        { from: 'rotateValueSEND', to: 'rotateImgCMD' },
        { from: 'rotateLeftImgREQ', to: 'rotateLeftImgCMD' },
        { from: 'rotateRightImgREQ', to: 'rotateRightImgCMD' },
        { from: 'flipImgREQ', to: 'flipImgCMD' },
        { from: 'flopImgREQ', to: 'flopImgCMD' },
        // Paint commands
        { from: 'tintValueSEND', to: 'tintImgCMD' },
        { from: 'colorpickerImgREQ', to: 'colorpickerImgCMD' },
        { from: 'watermarkUploadREQ', to: 'watermarkUploadCMD' },
        { from: 'watermarkImgREQ', to: 'watermarkImgCMD' },
        { from: 'drawImgREQ', to: 'drawImgCMD' },
        { from: 'padImgREQ', to: 'padImgCMD' },
        // Crop commands
        { from: 'rectCropImgREQ', to: 'cropImgCMD' },
    ]);
    // Custom handler - colorpicker requires broadcast to BrowserViews
    electron_1.ipcMain.on('colorpickerValueSEND', async (event, color) => {
        const views = mainWindow.getBrowserViews();
        const color_name = await image_processor_1.ImageProcessor.getColorName(color);
        views.forEach((view) => {
            view.webContents.send('colorpickerValueRECV', color, color_name);
        });
    });
    // Notification Handler - Forward to main window
    electron_1.ipcMain.on('showNotificationREQ', (event, notificationId) => {
        mainWindow.webContents.send('showNotificationCMD', notificationId);
    });
    // ImgKit Context Menu Handler
    electron_1.ipcMain.on('show-imgkit-context-menu', (event, options) => {
        const menu = createContextMenu(event, options);
        menu.popup({ window: electron_1.BrowserWindow.fromWebContents(event.sender) });
    });
    // Native Clipboard Handlers
    electron_1.ipcMain.on('copy-image-to-clipboard', (event, imageBuffer) => {
        try {
            const image = electron_1.nativeImage.createFromBuffer(Buffer.from(imageBuffer));
            electron_1.clipboard.writeImage(image);
        }
        catch (error) {
            console.error('Failed to copy image to clipboard:', error);
        }
    });
    electron_1.ipcMain.on('imgkit-layer-event', (event, payload) => {
        event.sender.send('imgkit-layer-event', payload);
    });
    electron_1.ipcMain.handle('paste-image-from-clipboard', () => {
        try {
            const image = electron_1.clipboard.readImage();
            if (!image.isEmpty()) {
                return image.toPNG();
            }
            return null;
        }
        catch (error) {
            console.error('Failed to paste image from clipboard:', error);
            return null;
        }
    });
    electron_1.ipcMain.on('FullScreenREQ', (event) => {
        mainWindow.setSimpleFullScreen(true);
        mainWindow.show();
    });
    electron_1.ipcMain.on('DefaultScreenREQ', (event) => {
        mainWindow.setSimpleFullScreen(false);
        mainWindow.show();
    });
    electron_1.ipcMain.on('extensionValueSEND', async (event, res) => {
        const result = await electron_1.dialog.showSaveDialog(mainWindow, {
            title: 'Save Image',
            defaultPath: '~/image',
            filters: [
                {
                    name: 'Image file',
                    extensions: [res],
                },
            ],
        });
        event.sender.send('saveAsImgCMD', result.filePath);
    });
    electron_1.ipcMain.on('saveImgREQ', (event) => {
        event.sender.send('saveImgCMD');
    });
    electron_1.ipcMain.on('deleteImgREQ', (event) => {
        event.sender.send('deleteImgCMD');
    });
    // Show application menu
    electron_1.ipcMain.on('showMenuREQ', (event) => {
        const menu = buildApplicationMenu(event, mainWindow);
        electron_1.Menu.setApplicationMenu(menu);
        createPanelView(mainWindow);
    });
    electron_1.app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createMainWindow();
    });
});
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
//# sourceMappingURL=main.js.map