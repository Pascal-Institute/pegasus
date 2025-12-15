#!/usr/bin/env node
/**
 * Copy compiled imgkit files from dist/imgkit to imgkit folder
 * This ensures the local package dependency works correctly
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../dist/imgkit');
const targetDir = path.join(__dirname, '../imgkit');

/**
 * Recursively copy directory contents
 */
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDir(srcPath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('Copying compiled imgkit files...');
  copyDir(sourceDir, targetDir);
  console.log('✓ imgkit files copied successfully');
} catch (error) {
  console.error('Error copying imgkit files:', error);
  process.exit(1);
}
