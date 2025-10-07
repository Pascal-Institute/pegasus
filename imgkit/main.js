// ImgKit Module Entry Point
// Exports all public APIs for the image editing toolkit
//
// Main exports:
// - ImageProcessor: Pure image processing functions (no UI dependencies)
// - ImgKitRenderer: UI manager for image panels
// - ImageLayer: Individual image panel component
// - createDefaultImage: Helper function
// - getCurrentLayer: Helper function

const { ImageProcessor } = require('./image-processor');
const { 
  imgKitRenderer,
  createDefaultImage,
  drawFlag,
} = require('./renderer');

// Export only what's actually used in the project
module.exports = {
  // Core (used by image-layer.js internally)
  ImageProcessor,
  
  // UI components (used by main_renderer.js)
  imgKitRenderer,
  createDefaultImage,
  
  // State flags (used by crop_renderer.js)
  drawFlag,
};
