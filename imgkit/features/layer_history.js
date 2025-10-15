// LayerHistory - Manages undo/redo history for image layers
// Handles state management for image buffers, metadata, and extensions
//
// This class provides:
// - History stack with configurable size
// - Undo/redo functionality
// - State snapshot and restoration

/**
 * LayerHistory class - Manages undo/redo history
 */
class LayerHistory {
  constructor(maxSize = 10) {
    // History stacks
    this.buffers = []; // Array of image buffers
    this.infos = []; // Array of image metadata objects
    this.extensions = []; // Array of file extensions
    this.index = -1; // Current position in history (-1 = empty)
    this.maxSize = maxSize; // Maximum number of history states
  }

  /**
   * Add a new state to history
   * @param {Buffer} buffer - Image buffer
   * @param {Object} info - Image metadata (width, height, format, etc.)
   * @param {string} extension - File extension (png, jpg, etc.)
   */
  add(buffer, info, extension) {
    this.index++;

    // Remove future history if we're not at the end
    // (User made changes after undo, so we discard the "redo" states)
    if (this.buffers[this.index]) {
      this.buffers = this.buffers.slice(0, this.index);
      this.infos = this.infos.slice(0, this.index);
      this.extensions = this.extensions.slice(0, this.index);
    }

    // Limit history size (FIFO - remove oldest)
    if (this.index >= this.maxSize) {
      this.buffers.shift();
      this.infos.shift();
      this.extensions.shift();
      this.index = this.maxSize - 1;
    }

    // Add new state
    this.buffers.push(buffer);
    this.infos.push(info);
    this.extensions.push(extension);
  }

  /**
   * Undo - Move back one step in history
   * @returns {Object|null} Previous state {buffer, info, extension} or null if at beginning
   */
  undo() {
    if (!this.canUndo()) {
      return null;
    }

    this.index--;
    return this.getCurrentState();
  }

  /**
   * Redo - Move forward one step in history
   * @returns {Object|null} Next state {buffer, info, extension} or null if at end
   */
  redo() {
    if (!this.canRedo()) {
      return null;
    }

    this.index++;
    return this.getCurrentState();
  }

  /**
   * Get current state from history
   * @returns {Object|null} Current state {buffer, info, extension} or null if empty
   */
  getCurrentState() {
    if (this.index < 0 || this.index >= this.buffers.length) {
      return null;
    }

    return {
      buffer: this.buffers[this.index],
      info: this.infos[this.index],
      extension: this.extensions[this.index],
    };
  }

  /**
   * Check if undo is possible
   * @returns {boolean} True if can undo
   */
  canUndo() {
    return this.index > 0;
  }

  /**
   * Check if redo is possible
   * @returns {boolean} True if can redo
   */
  canRedo() {
    return this.index < this.buffers.length - 1;
  }

  /**
   * Get the number of states in history
   * @returns {number} Number of states
   */
  getSize() {
    return this.buffers.length;
  }

  /**
   * Clear all history
   */
  clear() {
    this.buffers = [];
    this.infos = [];
    this.extensions = [];
    this.index = -1;
  }

  /**
   * Get history statistics
   * @returns {Object} {size, index, canUndo, canRedo}
   */
  getStats() {
    return {
      size: this.getSize(),
      index: this.index,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      maxSize: this.maxSize,
    };
  }
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = { LayerHistory };
