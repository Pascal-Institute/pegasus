// ImgKit Module Entry Point
// Exports all public APIs for the image editing toolkit
//
// Main exports:
// - ImageProcessor: Pure image processing functions (no UI dependencies)
// - ImgKitRenderer: UI manager for image panels
// - ImageLayer: Individual image panel component
// - ImageMode: Unified mode system for interaction states
// - createDefaultImage: Helper function
// - getCurrentLayer: Helper function

const { ImageProcessor } = require("./processing/image_processor");
const { imgKitRenderer, createDefaultImage } = require("./core/image_renderer");
const { ImageMode, ModeManager } = require("./features/image_mode");

// Export only what's actually used in the project
module.exports = {
  // Core (used by image-layer.js internally)
  ImageProcessor,

  // UI components (used by main_renderer.js)
  imgKitRenderer,
  createDefaultImage,

  // Mode system (replaces old flag-based system)
  ImageMode,
  ModeManager,
};
