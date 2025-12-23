# TypeScript Migration Guide for Pegasus

This document provides guidance for continuing the TypeScript migration of the Pegasus Electron application.

## Current Status

### ✅ Completed
1. **TypeScript Environment Setup**
   - TypeScript 5.9.3 installed
   - tsconfig.json configured for gradual migration
   - Compilation system set up with selective build script
   - Source maps enabled for debugging

2. **Type Definitions**
   - Comprehensive `types.d.ts` with IPC channels, image types, and UI types
   - Full Electron type support (built-in with Electron 37)
   - Type-safe IPC communication definitions

3. **Core Process Migration**
   - `main.ts` - Main Electron process (fully typed)
   - `utils/ipc_bridge.ts` - IPC communication bridge (fully typed)

### 🔄 Remaining Files to Migrate

#### Priority 1: Processing Layer (Independent utilities)
- `processing/image_processor.js` - Image processing operations using Sharp
- `processing/image_loader.js` - File I/O for images  
- `processing/format_converter.js` - Format conversion (PNG, SVG, BMP, ICO, PIX, HEIF)

#### Priority 2: Core Classes
- `core/pix.js` - PIX format handling
- `core/image_layer.js` - Image layer management (~600 lines)
- `core/image_renderer.js` - Canvas rendering and UI

#### Priority 3: Feature Modules
- `features/image_layer_events.js` - Event handlers for layers
- `features/layer_history.js` - Undo/redo functionality
- `features/image_mode.js` - Mode management (crop, draw, etc.)
- `features/gif_animation.js` - GIF animation support

#### Priority 4: Renderer Processes
- `renderer/main_renderer.js` - Main UI renderer
- `renderer/paint_renderer.js` - Paint tool UI
- `renderer/filter_renderer.js` - Filter UI
- `renderer/resize_renderer.js` - Resize UI
- `renderer/rotate_renderer.js` - Rotate UI
- `renderer/crop_renderer.js` - Crop UI
- `renderer/image_analysis_renderer.js` - Analysis UI

#### Priority 5: Main Application
- `image_kit.js` - Main application controller
- `utils/ui_loader.js` - UI loading utilities

## Migration Workflow

### Step 1: Convert a File to TypeScript

```bash
# Copy the JavaScript file to TypeScript
cp path/to/file.js path/to/file.ts

# Edit the file and add types
# - Add import statements (replace require with import)
# - Add type annotations to function parameters
# - Add return type annotations
# - Add interface/type definitions for complex objects
```

### Step 2: Update Types

When converting a file, add any new types to `types.d.ts` if they'll be reused across files.

### Step 3: Compile and Test

```bash
# Compile TypeScript
npm run compile

# Run the application
npm start

# Build for production
npm run build
```

### Step 4: Remove Old JavaScript File

Once the TypeScript version is working:
```bash
rm path/to/file.js
```

## TypeScript Best Practices for This Project

### 1. Gradual Migration
- Convert files leaf-first (files with fewer dependencies first)
- Keep both .js and .ts files during transition
- Test after each conversion

### 2. Type Annotations
```typescript
// ✅ Good - Explicit types
function processImage(buffer: Buffer, options: ImageProcessOptions): Promise<ProcessedImage> {
  // ...
}

// ❌ Avoid - Implicit any
function processImage(buffer, options) {
  // ...
}
```

### 3. Use Existing Types
```typescript
import { ImageInfo, ImageProcessOptions } from '../types';

// Use defined types from types.d.ts
```

### 4. IPC Communication
```typescript
// Use typed IPC handlers
ipcMain.on('channel-name', (event: IpcMainEvent, arg: string) => {
  // Handler logic
});
```

### 5. Async/Await
```typescript
// ✅ Prefer async/await
async function loadImage(path: string): Promise<Buffer> {
  const buffer = await fs.promises.readFile(path);
  return buffer;
}

// ❌ Avoid callback-style when possible
fs.readFile(path, (err, buffer) => {
  // ...
});
```

## Troubleshooting

### Issue: TypeScript compilation errors
**Solution:** Check that:
1. All imports are correctly typed
2. Required type definitions are in `types.d.ts`
3. No circular dependencies exist

### Issue: Module not found errors at runtime
**Solution:** Ensure:
1. Compiled .js files exist alongside .ts files
2. Module paths are correct (use `.js` extension in imports for compiled output)

### Issue: Type conflicts with Electron
**Solution:** 
- Electron 37+ provides built-in types
- Do not install `@types/electron`
- Use `skipLibCheck: true` in tsconfig.json if needed

## Strictness Roadmap

### Phase 1 (Current): Lenient Mode
```json
{
  "strict": false,
  "noImplicitAny": false
}
```

### Phase 2: Enable Implicit Any Checking
After most files are migrated:
```json
{
  "strict": false,
  "noImplicitAny": true
}
```

### Phase 3: Full Strict Mode
When all files are typed:
```json
{
  "strict": true
}
```

## Testing Strategy

### Before Migration
1. Document current behavior
2. Take screenshots of UI
3. Test all major features

### After Each File
1. Compile successfully
2. Run the app and test affected features
3. Check for console errors
4. Verify IPC communication still works

### Before Enabling Strict Mode
1. Run full regression testing
2. Test all image operations
3. Test file save/load
4. Test clipboard operations
5. Test all UI panels

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Electron TypeScript Guide](https://www.electronjs.org/docs/latest/tutorial/typescript)
- [Sharp TypeScript Types](https://sharp.pixelplumbing.com/api-constructor)

## Questions?

For questions about this migration:
1. Check existing TypeScript files (main.ts, ipc_bridge.ts) for patterns
2. Review types.d.ts for available type definitions
3. Consult TypeScript documentation for specific type issues
