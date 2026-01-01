# @philjs/build

High-performance build tooling for PhilJS applications, powered by Rspack and Rslib. Provides Rust-based bundling with up to 10x faster builds compared to webpack, while maintaining compatibility with existing Vite configurations.

## Features

- **Rspack Plugin**: Zero-config plugin for PhilJS applications
- **Rslib Presets**: Pre-configured library building presets
- **Vite Compatibility**: Seamless migration from Vite to Rspack
- **Tree Shaking**: Automatic dead code elimination
- **Code Splitting**: Intelligent chunk splitting
- **TypeScript**: First-class TypeScript support
- **CSS Handling**: Built-in CSS modules and PostCSS support

## Installation

```bash
npm install @philjs/build
# or
pnpm add @philjs/build
# or
bun add @philjs/build
```

## Quick Start

### Rspack Plugin

```typescript
// rspack.config.ts
import { philJSRspackPlugin, createRspackConfig } from '@philjs/build';

export default createRspackConfig({
  mode: 'production',
  entry: './src/index.ts',
  plugins: [
    philJSRspackPlugin({
      // Enable JSX transform
      jsx: true,
      // Enable HMR in development
      hmr: true,
    }),
  ],
});
```

### Basic Configuration

```typescript
import { createRspackConfig } from '@philjs/build';

export default createRspackConfig({
  entry: './src/index.ts',
  output: {
    path: './dist',
    filename: '[name].[contenthash].js',
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
});
```

## Rspack Configuration

### Development Mode

```typescript
import { createRspackConfig, philJSRspackPlugin } from '@philjs/build';

export default createRspackConfig({
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
  },
  plugins: [
    philJSRspackPlugin({
      mode: 'development',
    }),
  ],
});
```

### Production Mode

```typescript
import { createRspackConfig, philJSRspackPlugin } from '@philjs/build';

export default createRspackConfig({
  mode: 'production',
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  plugins: [
    philJSRspackPlugin({
      mode: 'production',
      minify: true,
      sourcemap: 'hidden',
    }),
  ],
});
```

### TypeScript Configuration

```typescript
import { createRspackConfig } from '@philjs/build';

export default createRspackConfig({
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                },
              },
            },
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
});
```

## Rslib Presets

### Library Preset

Build reusable libraries with ESM and CJS output:

```typescript
import { createRslibConfig } from '@philjs/build';

export default createRslibConfig({
  preset: 'library',
  source: {
    entry: './src/index.ts',
  },
  output: {
    formats: ['esm', 'cjs'],
    dts: true,
  },
  external: ['react', 'react-dom'],
});
```

### Application Preset

Build optimized applications:

```typescript
import { createRslibConfig } from '@philjs/build';

export default createRslibConfig({
  preset: 'application',
  source: {
    entry: {
      main: './src/main.ts',
      worker: './src/worker.ts',
    },
  },
  output: {
    minify: true,
    splitting: true,
  },
});
```

### Component Preset

Build component libraries with CSS extraction:

```typescript
import { createRslibConfig } from '@philjs/build';

export default createRslibConfig({
  preset: 'component',
  source: {
    entry: './src/index.ts',
  },
  output: {
    preserveModules: true,
    extractCSS: true,
    dts: true,
  },
});
```

### Node.js Preset

Build Node.js applications and libraries:

```typescript
import { createRslibConfig } from '@philjs/build';

export default createRslibConfig({
  preset: 'node',
  source: {
    entry: './src/server.ts',
  },
  output: {
    format: 'cjs',
    target: 'node',
  },
  autoExternalNode: true,
});
```

## Vite Compatibility

### Migration from Vite

```typescript
import { viteAdapter, convertRspackToVite } from '@philjs/build';

// Option 1: Use the Vite adapter directly
export default viteAdapter({
  mode: 'production',
  build: {
    outDir: 'dist',
    minify: 'esbuild',
  },
});

// Option 2: Convert existing Rspack config to Vite
import rspackConfig from './rspack.config';

export default convertRspackToVite(rspackConfig);
```

### Hybrid Configuration

Use the same config for both Rspack and Vite:

```typescript
import { createRspackConfig, createViteCompatibleConfig } from '@philjs/build';

const sharedConfig = {
  entry: './src/index.ts',
  resolve: {
    alias: {
      '@': './src',
    },
  },
};

// For Rspack
export const rspackConfig = createRspackConfig(sharedConfig);

// For Vite
export const viteConfig = createViteCompatibleConfig(sharedConfig);
```

## Plugin Options

### RspackPluginOptions

```typescript
interface RspackPluginOptions {
  // Build mode
  mode?: 'development' | 'production';

  // Enable minification
  minify?: boolean;

  // Sourcemap configuration
  sourcemap?: boolean | 'inline' | 'hidden' | 'nosources';

  // ES target version
  target?: 'es2020' | 'es2021' | 'es2022' | 'es2023' | 'es2024' | 'esnext';

  // Enable JSX transform
  jsx?: boolean;

  // JSX runtime
  jsxRuntime?: 'automatic' | 'classic';

  // Enable HMR
  hmr?: boolean;
}
```

### RslibConfigOptions

```typescript
interface RslibConfigOptions {
  // Preset to use
  preset?: 'library' | 'application' | 'component' | 'node';

  // Source configuration
  source?: {
    entry?: string | Record<string, string>;
    alias?: Record<string, string>;
  };

  // Output configuration
  output?: {
    dir?: string;
    format?: 'esm' | 'cjs' | 'umd' | 'iife';
    formats?: Array<'esm' | 'cjs' | 'umd' | 'iife'>;
    dts?: boolean;
    minify?: boolean;
    sourceMap?: boolean;
    clean?: boolean;
    splitting?: boolean;
    preserveModules?: boolean;
    extractCSS?: boolean;
  };

  // External dependencies
  external?: string[];

  // Auto-external configuration
  autoExternal?: {
    peerDependencies?: boolean;
    dependencies?: boolean;
  };
  autoExternalPeers?: boolean;
  autoExternalNode?: boolean;

  // Plugins
  plugins?: RspackPlugin[];
}
```

## Advanced Usage

### Custom Loaders

```typescript
import { createRspackConfig } from '@philjs/build';

export default createRspackConfig({
  module: {
    rules: [
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.(png|jpg|gif)$/,
        type: 'asset/resource',
      },
      {
        test: /\.yaml$/,
        use: 'yaml-loader',
      },
    ],
  },
});
```

### Environment Variables

```typescript
import { createRspackConfig } from '@philjs/build';
import { DefinePlugin } from '@rspack/core';

export default createRspackConfig({
  plugins: [
    new DefinePlugin({
      'process.env.API_URL': JSON.stringify(process.env.API_URL),
      '__DEV__': JSON.stringify(process.env.NODE_ENV === 'development'),
    }),
  ],
});
```

### Code Splitting

```typescript
import { createRspackConfig } from '@philjs/build';

export default createRspackConfig({
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      cacheGroups: {
        default: false,
        vendors: false,
        framework: {
          name: 'framework',
          chunks: 'all',
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
          priority: 40,
        },
        lib: {
          test: /[\\/]node_modules[\\/]/,
          name: 'lib',
          priority: 30,
          minChunks: 1,
          reuseExistingChunk: true,
        },
        commons: {
          name: 'commons',
          minChunks: 2,
          priority: 20,
        },
        shared: {
          name: 'shared',
          priority: 10,
          minChunks: 2,
          reuseExistingChunk: true,
        },
      },
    },
  },
});
```

## Performance

Rspack provides significant performance improvements over webpack:

| Metric | Webpack | Rspack | Improvement |
|--------|---------|--------|-------------|
| Cold Start | 3.5s | 0.4s | 8.75x |
| HMR | 1.2s | 0.1s | 12x |
| Production Build | 45s | 5s | 9x |

## API Reference

### Functions

- `philJSRspackPlugin(options?)` - Create Rspack plugin for PhilJS
- `createRspackConfig(options)` - Create Rspack configuration
- `mergeRspackConfig(base, override)` - Merge configurations
- `createRslibConfig(options)` - Create Rslib configuration
- `viteAdapter(options?)` - Create Vite-compatible configuration
- `convertRspackToVite(rspackConfig)` - Convert Rspack config to Vite

### Presets

- `rslibPresets.library` - Library building preset
- `rslibPresets.application` - Application building preset
- `rslibPresets.component` - Component library preset
- `rslibPresets.node` - Node.js preset

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./rspack, ./rslib, ./vite, ./cli
- Source files: packages/philjs-build/src/index.ts, packages/philjs-build/src/rspack/index.ts, packages/philjs-build/src/rslib/index.ts, packages/philjs-build/src/vite/index.ts, packages/philjs-build/src/cli/index.ts

### Public API
- Direct exports: program
- Re-exported names: DevServerConfig, ModuleFederationOptions, OutputFormat, PhilJSRslibOptions, PhilJSRspackOptions, PhilJSViteOptions, RslibConfig, RslibLibConfig, RspackConfiguration, RspackRule, SharedModuleConfig, VitePlugin, adaptVitePlugin, createDevServerConfig, createModuleFederationPlugin, createPhilJSPlugin, createRslibConfig, createRspackConfig, defineConfig, entriesFromGlob, generateExportsField, mergeConfigs, philJSVite, rslibPresets, rspackPresets, rspackViteCompat, toRspackDevServerConfig, toViteServerConfig
- Re-exported modules: ./compatibility.js, ./config.js, ./rslib/config.js, ./rspack/config.js, ./vite/compatibility.js
<!-- API_SNAPSHOT_END -->

## License

MIT
