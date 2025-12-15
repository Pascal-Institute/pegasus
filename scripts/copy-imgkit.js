#!/usr/bin/env node
/**
 * Copy compiled files from dist to their respective folders
 * This ensures the HTML can load the compiled JavaScript files
 */

const fs = require('fs');
const path = require('path');

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

/**
 * Copy a specific directory with error checking
 */
function safeCopy(name, srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    console.error(`Error: Source directory ${srcDir} not found.`);
    console.error('Please run TypeScript compilation first: npm run compile');
    process.exit(1);
  }

  console.log(`Copying compiled ${name} files...`);
  copyDir(srcDir, destDir);
  console.log(`✓ ${name} files copied successfully`);
}

try {
  // Copy imgkit files (for local package dependency)
  safeCopy('imgkit', 
    path.join(__dirname, '../dist/imgkit'),
    path.join(__dirname, '../imgkit')
  );

  // Copy renderer files (for HTML script tags)
  safeCopy('renderer',
    path.join(__dirname, '../dist/renderer'),
    path.join(__dirname, '../renderer')
  );

} catch (error) {
  console.error('Error copying files:', error.message);
  process.exit(1);
}
