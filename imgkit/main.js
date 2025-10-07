// ImgKit Main Process - Backend Logic (DEPRECATED)
// This file is kept for backward compatibility
// All image processing logic has been moved to image-processor.js
//
// New code should use ImageProcessor directly instead of ImgKitMain
// Example: const { ImageProcessor } = require('./image-processor');

const { ImageProcessor } = require('./image-processor');

// ============================================================================
// MAIN CLASS: ImgKitMain (Wrapper around ImageProcessor)
// ============================================================================
// This class now acts as a thin wrapper for backward compatibility
// All methods delegate to ImageProcessor static methods

class ImgKitMain {
  constructor() {
    // No longer needed - ImageProcessor is static
    // Kept for backward compatibility
  }

  // --------------------------------------------------------------------------
  // IMAGE PROCESSING (Delegated to ImageProcessor)
  // --------------------------------------------------------------------------

  async processImage(buffer, options = {}) {
    return await ImageProcessor.processImage(buffer, options);
  }

  async applyCrop(buffer, imageInfo, cropData) {
    return await ImageProcessor.applyCrop(buffer, imageInfo, cropData);
  }

  // --------------------------------------------------------------------------
  // FORMAT CONVERSION (Delegated to ImageProcessor)
  // --------------------------------------------------------------------------

  async convertFormat(buffer, fromExt, toExt) {
    return await ImageProcessor.convertFormat(buffer, fromExt, toExt);
  }

  updateFileExtension(filepath, newExtension) {
    return ImageProcessor.updateFileExtension(filepath, newExtension);
  }

  // --------------------------------------------------------------------------
  // FILE I/O OPERATIONS (Delegated to ImageProcessor)
  // --------------------------------------------------------------------------

  async openImage(filepath) {
    return await ImageProcessor.openImage(filepath);
  }

  async openImageBuffer(buffer, filename) {
    return await ImageProcessor.openImageBuffer(buffer, filename);
  }

  async saveImage(buffer, filepath) {
    return await ImageProcessor.saveImage(buffer, filepath);
  }

  // --------------------------------------------------------------------------
  // COLOR EXTRACTION (Delegated to ImageProcessor)
  // --------------------------------------------------------------------------

  async extractColors(buffer, info, count = 3) {
    return await ImageProcessor.extractColors(buffer, info, count);
  }

  // --------------------------------------------------------------------------
  // TEMP FILE MANAGEMENT (Delegated to ImageProcessor)
  // --------------------------------------------------------------------------

  createTempFileFromBuffer(buffer, filename) {
    return ImageProcessor.createTempFileFromBuffer(buffer, filename);
  }

  cleanupTempFile(filepath) {
    return ImageProcessor.cleanupTempFile(filepath);
  }

  cleanupAllTempFiles() {
    return ImageProcessor.cleanupAllTempFiles();
  }
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

// Create singleton instance for backward compatibility
const imgKitMain = new ImgKitMain();

// Lazy load renderer to avoid circular dependency
let rendererModule;
function getRenderer() {
  if (!rendererModule) {
    rendererModule = require("./renderer.js");
  }
  return rendererModule;
}

// Export with lazy-loaded renderer components
module.exports = new Proxy(
  {
    // Backend (always available)
    ImgKitMain,
    imgKitMain,
    ImageProcessor, // Export ImageProcessor directly
  },
  {
    get(target, prop) {
      // Return backend exports directly
      if (prop in target) {
        return target[prop];
      }
      // Lazy load renderer exports when accessed
      const renderer = getRenderer();
      return renderer[prop];
    },
  }
);
