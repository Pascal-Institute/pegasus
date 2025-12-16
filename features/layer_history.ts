import sharp from "sharp";

interface HistoryState {
  buffer: Buffer;
  info: sharp.Metadata;
  extension: string;
  colors: string[];
}

/**
 * LayerHistory class - Manages undo/redo history
 */
export class LayerHistory {
  private buffers: Buffer[];
  private infos: sharp.Metadata[];
  private extensions: string[];
  private colors: string[][];
  private index: number;
  private maxSize: number;

  constructor(maxSize: number = 10) {
    // History stacks
    this.buffers = []; // Array of image buffers
    this.infos = []; // Array of image metadata objects
    this.extensions = []; // Array of file extensions
    this.colors = []; // Array of color arrays
    this.index = -1; // Current position in history (-1 = empty)
    this.maxSize = maxSize; // Maximum number of history states
  }

  /**
   * Add a new state to history
   * @param buffer - Image buffer
   * @param info - Image metadata (width, height, format, etc.)
   * @param extension - File extension (png, jpg, etc.)
   * @param colors - Optional array of color strings
   */
  add(buffer: Buffer, info: sharp.Metadata, extension: string, colors: string[] = []): void {
    this.index++;

    // Remove future history if we're not at the end
    // (User made changes after undo, so we discard the "redo" states)
    if (this.buffers[this.index]) {
      this.buffers = this.buffers.slice(0, this.index);
      this.infos = this.infos.slice(0, this.index);
      this.extensions = this.extensions.slice(0, this.index);
      this.colors = this.colors.slice(0, this.index);
    }

    // Limit history size (FIFO - remove oldest)
    if (this.index >= this.maxSize) {
      this.buffers.shift();
      this.infos.shift();
      this.extensions.shift();
      this.colors.shift();
      this.index = this.maxSize - 1;
    }

    // Add new state
    this.buffers.push(buffer);
    this.infos.push(info);
    this.extensions.push(extension);
    this.colors.push(colors);
  }

  /**
   * Undo - Move back one step in history
   * @returns Previous state or null if at beginning
   */
  undo(): HistoryState | null {
    if (!this.canUndo()) {
      return null;
    }

    this.index--;
    return this.getCurrentState();
  }

  /**
   * Redo - Move forward one step in history
   * @returns Next state or null if at end
   */
  redo(): HistoryState | null {
    if (!this.canRedo()) {
      return null;
    }

    this.index++;
    return this.getCurrentState();
  }

  /**
   * Get current state from history
   * @returns Current state or null if empty
   */
  getCurrentState(): HistoryState | null {
    if (this.index < 0 || this.index >= this.buffers.length) {
      return null;
    }

    return {
      buffer: this.buffers[this.index],
      info: this.infos[this.index],
      extension: this.extensions[this.index],
      colors: this.colors[this.index],
    };
  }

  /**
   * Check if undo is possible
   * @returns True if can undo
   */
  canUndo(): boolean {
    return this.index > 1;
  }

  /**
   * Check if redo is possible
   * @returns True if can redo
   */
  canRedo(): boolean {
    return this.index < this.buffers.length - 1;
  }

  /**
   * Get the number of states in history
   * @returns Number of states
   */
  getSize(): number {
    return this.buffers.length;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.buffers = [];
    this.infos = [];
    this.extensions = [];
    this.colors = [];
    this.index = -1;
  }

  /**
   * Get history statistics
   * @returns History statistics
   */
  getStats(): { size: number; index: number; canUndo: boolean; canRedo: boolean; maxSize: number } {
    return {
      size: this.getSize(),
      index: this.index,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      maxSize: this.maxSize,
    };
  }
}
