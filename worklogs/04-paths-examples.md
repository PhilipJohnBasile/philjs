# Worklog 04: Remove Hardcoded macOS Paths in Example Vite Configs

**Agent**: Agent 04
**Date**: 2025-12-16
**Status**: Complete

## Objective

Remove hardcoded macOS user-specific paths from Vite configuration files in example apps to ensure cross-platform compatibility (Windows/Linux/macOS).

## Scope

- `examples/todo-app/vite.config.ts`
- `examples/kitchen-sink/vite.config.ts`

## Issues Found

Both configuration files contained hardcoded macOS paths that would break on Windows and Linux:

```typescript
// Line 10 in both files
"philjs-core/jsx-runtime": "/Users/pjb/Git/philjs/packages/philjs-core/dist/jsx-runtime.js",
```

## Solution Implemented

Replaced absolute paths with portable path resolution using ES modules pattern:

```typescript
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In resolve.alias
"philjs-core/jsx-runtime": path.resolve(__dirname, "../../packages/philjs-core/dist/jsx-runtime.js"),
```

### Changes Made

1. **examples/todo-app/vite.config.ts**
   - Added `fileURLToPath` and `path` imports
   - Created `__dirname` using ES module pattern
   - Replaced hardcoded path with `path.resolve(__dirname, "../../packages/philjs-core/dist/jsx-runtime.js")`

2. **examples/kitchen-sink/vite.config.ts**
   - Same changes as todo-app
   - Preserved existing server configuration (port: 3002)

## Testing

Both examples were tested and confirmed working:

### todo-app
```
npm run build
✓ built in 195ms
dist/index.html                 0.57 kB │ gzip: 0.38 kB
dist/assets/index-Bo_RixkJ.js  11.28 kB │ gzip: 4.01 kB
```

### kitchen-sink
```
npm run build
✓ built in 194ms
dist/index.html                 2.47 kB │ gzip: 0.99 kB
dist/assets/index-_RUTzsjn.js  43.31 kB │ gzip: 9.85 kB
```

## Verification

### No Remaining Hardcoded Paths
- Searched for `/Users/pjb` patterns - only found in documentation files
- Searched for `C:\Users\` patterns - none found
- Searched for `/home/` patterns - none found

### Cross-Platform Compatibility
The new configuration uses:
- `path.resolve()` for proper path joining across platforms
- `fileURLToPath(import.meta.url)` for ES module compatibility
- Relative path navigation (`../../`) from example directory to package directory

## Benefits

1. **Cross-platform compatibility**: Works on Windows, Linux, and macOS
2. **Portable**: No user-specific or machine-specific paths
3. **Maintainable**: Uses standard Node.js path resolution
4. **Consistent**: Same pattern can be applied to other configs if needed

## Acceptance Criteria

- [x] No absolute user-specific paths remain in Vite configs
- [x] Configs use portable path resolution (path.resolve with __dirname)
- [x] Examples build successfully on Windows
- [x] worklogs/04-paths-examples.md created

## Notes

This fix uses the ES module pattern for `__dirname` since Vite configs are typically ES modules. The pattern `path.dirname(fileURLToPath(import.meta.url))` is the standard way to get `__dirname` functionality in ES modules.

The relative path `../../packages/philjs-core/dist/jsx-runtime.js` correctly navigates from:
- `examples/{app-name}/vite.config.ts`
- Up two levels to project root
- Into `packages/philjs-core/dist/jsx-runtime.js`

This ensures the configuration works regardless of the absolute path to the project on any developer's machine or CI environment.
