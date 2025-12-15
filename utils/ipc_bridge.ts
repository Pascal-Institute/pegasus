import { IpcMain, BrowserWindow } from 'electron';

/**
 * IPCBridge - Utility class to simplify IPC communication
 *
 * Eliminates repetitive IPC forwarder patterns and allows declarative channel registration.
 *
 * @example
 * const bridge = new IPCBridge(ipcMain, mainWindow);
 * bridge.registerForwarder('resizeValueSEND', 'resizeImgCMD');
 * bridge.registerForwarder('blurValueSEND', 'blurImgCMD');
 */
class IPCBridge {
  private ipcMain: IpcMain;
  private targetWindow: BrowserWindow;
  private registeredChannels: Set<string>;

  constructor(ipcMain: IpcMain, targetWindow: BrowserWindow) {
    this.ipcMain = ipcMain;
    this.targetWindow = targetWindow;
    this.registeredChannels = new Set();
  }

  registerForwarder(fromChannel: string, toChannel: string, shouldFocus: boolean = true): void {
    if (this.registeredChannels.has(fromChannel)) {
      console.warn(
        `[IPCBridge] Channel "${fromChannel}" is already registered. Skipping.`
      );
      return;
    }

    this.ipcMain.on(fromChannel, (event, ...args) => {
      this.targetWindow.webContents.send(toChannel, ...args);
      if (shouldFocus) {
        this.targetWindow.webContents.focus();
      }
    });

    this.registeredChannels.add(fromChannel);
  }

  registerMultiple(mappings: Array<{from: string, to: string, focus?: boolean}>): void {
    mappings.forEach(({ from, to, focus = true }) => {
      this.registerForwarder(from, to, focus);
    });
  }

  registerCustomHandler(channel: string, handler: (...args: any[]) => void): void {
    if (this.registeredChannels.has(channel)) {
      console.warn(
        `[IPCBridge] Channel "${channel}" is already registered. Skipping.`
      );
      return;
    }

    this.ipcMain.on(channel, handler);
    this.registeredChannels.add(channel);
  }

  getRegisteredChannels(): string[] {
    return Array.from(this.registeredChannels);
  }

  unregister(channel: string): void {
    if (this.registeredChannels.has(channel)) {
      this.ipcMain.removeAllListeners(channel);
      this.registeredChannels.delete(channel);
    }
  }

  unregisterAll(): void {
    this.registeredChannels.forEach((channel) => {
      this.ipcMain.removeAllListeners(channel);
    });
    this.registeredChannels.clear();
  }
}

export { IPCBridge };
