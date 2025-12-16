import { IpcMain, BrowserWindow, IpcMainEvent } from "electron";

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
export class IPCBridge {
  private ipcMain: IpcMain;
  private targetWindow: BrowserWindow;
  private registeredChannels: Set<string> = new Set();

  /**
   * @param ipcMain - Electron IPC Main instance
   * @param targetWindow - Target window to forward messages to
   */
  constructor(ipcMain: IpcMain, targetWindow: BrowserWindow) {
    this.ipcMain = ipcMain;
    this.targetWindow = targetWindow;
  }

  /**
   * Register a simple forwarder pattern
   * Forwards messages received from fromChannel to toChannel and focuses the window
   *
   * @param fromChannel - IPC channel name to receive from
   * @param toChannel - IPC channel name to send to
   * @param shouldFocus - Whether to focus window after sending message (default: true)
   */
  registerForwarder(fromChannel: string, toChannel: string, shouldFocus: boolean = true): void {
    if (this.registeredChannels.has(fromChannel)) {
      console.warn(
        `[IPCBridge] Channel "${fromChannel}" is already registered. Skipping.`
      );
      return;
    }

    this.ipcMain.on(fromChannel, (event: IpcMainEvent, ...args: any[]) => {
      this.targetWindow.webContents.send(toChannel, ...args);
      if (shouldFocus) {
        this.targetWindow.webContents.focus();
      }
    });

    this.registeredChannels.add(fromChannel);
  }

  /**
   * Register multiple forwarders in bulk
   *
   * @param mappings - Array of channel mappings
   *
   * @example
   * bridge.registerMultiple([
   *   { from: 'resizeValueSEND', to: 'resizeImgCMD' },
   *   { from: 'blurValueSEND', to: 'blurImgCMD' },
   *   { from: 'flipImgREQ', to: 'flipImgCMD' }
   * ]);
   */
  registerMultiple(mappings: Array<{ from: string; to: string; focus?: boolean }>): void {
    mappings.forEach(({ from, to, focus = true }) => {
      this.registerForwarder(from, to, focus);
    });
  }

  /**
   * Register a custom handler (for cases requiring complex logic)
   *
   * @param channel - IPC channel name to receive from
   * @param handler - Custom handler function
   */
  registerCustomHandler(channel: string, handler: (event: IpcMainEvent, ...args: any[]) => void): void {
    if (this.registeredChannels.has(channel)) {
      console.warn(
        `[IPCBridge] Channel "${channel}" is already registered. Skipping.`
      );
      return;
    }

    this.ipcMain.on(channel, handler);
    this.registeredChannels.add(channel);
  }

  /**
   * Return list of all registered channels
   *
   * @returns List of registered channels
   */
  getRegisteredChannels(): string[] {
    return Array.from(this.registeredChannels);
  }

  /**
   * Unregister a specific channel (mainly for testing)
   *
   * @param channel - Channel name to unregister
   */
  unregister(channel: string): void {
    if (this.registeredChannels.has(channel)) {
      this.ipcMain.removeAllListeners(channel);
      this.registeredChannels.delete(channel);
    }
  }

  /**
   * Unregister all registered channels
   */
  unregisterAll(): void {
    this.registeredChannels.forEach((channel) => {
      this.ipcMain.removeAllListeners(channel);
    });
    this.registeredChannels.clear();
  }
}

