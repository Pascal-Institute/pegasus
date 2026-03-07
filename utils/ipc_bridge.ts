// @ts-nocheck
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
  /**
   * @param {Electron.IpcMain} ipcMain - Electron IPC Main instance
   * @param {Electron.BrowserWindow} targetWindow - Target window to forward messages to
   */
  constructor(ipcMain, targetWindow) {
    this.ipcMain = ipcMain;
    this.targetWindow = targetWindow;
    this.registeredChannels = new Set();
  }

  /**
   * Register a simple forwarder pattern
   * Forwards messages received from fromChannel to toChannel and focuses the window
   *
   * @param {string} fromChannel - IPC channel name to receive from
   * @param {string} toChannel - IPC channel name to send to
   * @param {boolean} shouldFocus - Whether to focus window after sending message (default: true)
   */
  registerForwarder(fromChannel, toChannel, shouldFocus = true) {
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

  /**
   * Register multiple forwarders in bulk
   *
   * @param {Array<{from: string, to: string, focus?: boolean}>} mappings - Array of channel mappings
   *
   * @example
   * bridge.registerMultiple([
   *   { from: 'resizeValueSEND', to: 'resizeImgCMD' },
   *   { from: 'blurValueSEND', to: 'blurImgCMD' },
   *   { from: 'flipImgREQ', to: 'flipImgCMD' }
   * ]);
   */
  registerMultiple(mappings) {
    mappings.forEach(({ from, to, focus = true }) => {
      this.registerForwarder(from, to, focus);
    });
  }

  /**
   * Register a custom handler (for cases requiring complex logic)
   *
   * @param {string} channel - IPC channel name to receive from
   * @param {Function} handler - Custom handler function
   */
  registerCustomHandler(channel, handler) {
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
   * @returns {Array<string>} List of registered channels
   */
  getRegisteredChannels() {
    return Array.from(this.registeredChannels);
  }

  /**
   * Unregister a specific channel (mainly for testing)
   *
   * @param {string} channel - Channel name to unregister
   */
  unregister(channel) {
    if (this.registeredChannels.has(channel)) {
      this.ipcMain.removeAllListeners(channel);
      this.registeredChannels.delete(channel);
    }
  }

  /**
   * Unregister all registered channels
   */
  unregisterAll() {
    this.registeredChannels.forEach((channel) => {
      this.ipcMain.removeAllListeners(channel);
    });
    this.registeredChannels.clear();
  }
}

module.exports = { IPCBridge };
