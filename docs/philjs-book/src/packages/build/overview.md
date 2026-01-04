# @philjs/build

Rspack/Rslib build toolchain for PhilJS with Module Federation support, optimized bundling, and Vite compatibility.

## Installation

```bash
npm install @philjs/build
```

## Overview

`@philjs/build` provides a modern build system for PhilJS applications:

- **Rspack Integration**: Fast Rust-based bundler with webpack compatibility
- **Rslib Support**: Library building with multiple output formats
- **Module Federation**: Micro-frontend architecture support
- **PhilJS Optimizations**: Signal transformations and tree-shaking
- **Vite Compatibility**: Use Vite plugins with Rspack
- **Presets**: Development, production, library, and microfrontend presets

## Quick Start

```typescript
import { createRspackConfig, presets } from '@philjs/build';

// Development configuration
const devConfig = createRspackConfig(presets.development('./src/index.tsx'));

// Production configuration
const prodConfig = createRspackConfig(presets.production('./src/index.tsx'));
```

## Presets

### Development Preset

```typescript
import { presets } from '@philjs/build';

const config = presets.development('./src/index.tsx');
// Includes:
// - Hot module replacement
// - Development mode optimizations
// - Dev server on port 3000
// - Standard tree-shaking
```

### Production Preset

```typescript
import { presets } from '@philjs/build';

const config = presets.production('./src/index.tsx');
// Includes:
// - Production optimizations
// - Auto-memoization
// - Aggressive tree-shaking
// - Source maps
```

### Library Preset

```typescript
import { presets } from '@philjs/build';

const config = presets.library('./src/index.ts', ['@philjs/core']);
// Includes:
// - External dependencies handling
// - Optimized library output
// - Clean module exports
```

### Microfrontend Preset

```typescript
import { presets } from '@philjs/build';

const config = presets.microfrontend('my-app', './src/index.tsx', {
  exposes: {
    './Button': './src/components/Button.tsx',
  },
  remotes: {
    shared: 'shared@http://localhost:3001/remoteEntry.js',
  },
});
```

## Rspack Configuration

### Create Custom Configuration

```typescript
import { createRspackConfig, type PhilJSRspackOptions } from '@philjs/build';

const options: PhilJSRspackOptions = {
  mode: 'production',
  entry: './src/index.tsx',
  output: {
    path: './dist',
    filename: '[name].[contenthash].js',
  },
  philjs: {
    signals: true,
    jsx: 'transform',
    autoMemo: true,
    treeshake: 'aggressive',
  },
  devServer: {
    port: 3000,
    hot: true,
    open: true,
  },
};

const config = createRspackConfig(options);
```

### PhilJS-Specific Options

```typescript
interface PhilJSRspackOptions {
  philjs?: {
    // Enable signal transformations
    signals?: boolean;

    // JSX transformation mode
    jsx?: 'transform' | 'preserve' | 'automatic';

    // Automatically wrap expensive computations with memo
    autoMemo?: boolean;

    // Tree-shaking aggressiveness
    treeshake?: 'standard' | 'aggressive' | 'none';
  };
}
```

### Module Federation

```typescript
import { createModuleFederationPlugin } from '@philjs/build';

const federationPlugin = createModuleFederationPlugin({
  name: 'my-app',
  filename: 'remoteEntry.js',
  exposes: {
    './Button': './src/components/Button',
    './Header': './src/components/Header',
  },
  remotes: {
    shared: 'shared@http://localhost:3001/remoteEntry.js',
  },
  shared: {
    '@philjs/core': { singleton: true },
    '@philjs/router': { singleton: true },
  },
});
```

## Rslib Configuration

Build libraries with multiple output formats:

```typescript
import { createRslibConfig, rslibPresets } from '@philjs/build';

const config = createRslibConfig({
  lib: [
    // ESM output
    rslibPresets.esm({
      entry: './src/index.ts',
      output: './dist/esm',
    }),

    // CommonJS output
    rslibPresets.cjs({
      entry: './src/index.ts',
      output: './dist/cjs',
    }),

    // UMD output
    rslibPresets.umd({
      entry: './src/index.ts',
      name: 'MyLibrary',
      output: './dist/umd',
    }),
  ],
});
```

### Generate Package Exports

```typescript
import { generateExportsField, entriesFromGlob } from '@philjs/build';

// Auto-discover entry points
const entries = await entriesFromGlob('./src/**/*.ts');

// Generate package.json exports field
const exports = generateExportsField(entries, {
  types: true,
  esm: true,
  cjs: true,
});
```

## Vite Compatibility

Use Vite plugins with Rspack:

```typescript
import { philJSVite, adaptVitePlugin } from '@philjs/build';
import react from '@vitejs/plugin-react';

// Adapt Vite plugin for Rspack
const adaptedReact = adaptVitePlugin(react());

// PhilJS Vite plugin
const philJS = philJSVite({
  signals: true,
  autoMemo: true,
});
```

### Dev Server Configuration

```typescript
import { createDevServerConfig, toRspackDevServerConfig } from '@philjs/build';

const devServer = createDevServerConfig({
  port: 3000,
  hot: true,
  proxy: {
    '/api': 'http://localhost:8080',
  },
});

// Convert to Rspack format
const rspackDevServer = toRspackDevServerConfig(devServer);
```

## API Reference

### Rspack Exports

```typescript
// Configuration creators
export function createRspackConfig(options: PhilJSRspackOptions): RspackConfiguration;
export function createModuleFederationPlugin(options: ModuleFederationOptions): RspackPlugin;
export function createPhilJSPlugin(options?: RspackPluginOptions): RspackPlugin;
export function mergeRspackConfig(...configs: RspackConfiguration[]): RspackConfiguration;

// Default configuration
export const defaultRspackConfig: RspackConfiguration;
export const philJSRspackPlugin: RspackPlugin;
```

### Rslib Exports

```typescript
// Configuration creators
export function createRslibConfig(options: PhilJSRslibOptions): RslibConfig;
export function defineConfig(config: RslibConfig): RslibConfig;
export function mergeConfigs(...configs: RslibConfig[]): RslibConfig;

// Utilities
export function entriesFromGlob(pattern: string): Promise<Record<string, string>>;
export function generateExportsField(entries: Record<string, string>, options?: ExportOptions): PackageExports;
```

### Vite Compatibility

```typescript
export function philJSVite(options?: PhilJSViteOptions): VitePlugin;
export function rspackViteCompat(vitePlugin: VitePlugin): RspackPlugin;
export function adaptVitePlugin(plugin: VitePlugin): RspackPlugin;
```

## See Also

- [@philjs/compiler](../compiler/overview.md) - PhilJS compiler
- [@philjs/cli](../cli/overview.md) - Command-line interface
- [@philjs/optimizer](../optimizer/overview.md) - Build optimizations
