# PhilJS Plugin System - Quick Reference

Fast reference guide for working with PhilJS plugins.

## CLI Commands

```bash
# Install plugin
philjs plugin add <plugin-name>
philjs plugin add @philjs/plugin-tailwind
philjs plugin add @philjs/plugin-analytics --version 0.1.0

# Remove plugin
philjs plugin remove <plugin-name>
philjs plugin rm @philjs/plugin-tailwind

# List plugins
philjs plugin list
philjs plugin ls

# Search plugins
philjs plugin search <query>
philjs plugin search tailwind
philjs plugin search analytics --tags seo,marketing

# Plugin info
philjs plugin info <plugin-name>

# Enable/Disable
philjs plugin enable <plugin-name>
philjs plugin disable <plugin-name>

# Configure
philjs plugin config <plugin-name>

# Update all
philjs plugin update

# Verify
philjs plugin verify <plugin-name>

# Interactive setup
philjs plugin setup
```

## Using Plugins

### Basic Usage

```typescript
// philjs.config.ts
import { defineConfig } from 'philjs-cli';
import myPlugin from 'philjs-plugin-name';

export default defineConfig({
  plugins: [
    myPlugin(),
  ],
});
```

### With Configuration

```typescript
import tailwind from '@philjs/plugin-tailwind';
import analytics from '@philjs/plugin-analytics';

export default defineConfig({
  plugins: [
    tailwind({
      darkMode: 'class',
      theme: { extend: { colors: { primary: '#3b82f6' } } },
    }),
    analytics({
      provider: 'ga4',
      trackingId: 'G-XXXXXXXXXX',
    }),
  ],
});
```

## Creating Plugins

### Quick Start

```bash
# Create new plugin
npx create-philjs-plugin my-plugin

# Navigate and build
cd my-plugin
npm install
npm run build
npm test
```

### Using Builder API

```typescript
import { createBuilder } from 'create-philjs-plugin';

export default createBuilder()
  .meta({
    name: 'philjs-plugin-awesome',
    version: '0.1.0',
    description: 'An awesome plugin',
    philjs: '^0.1.0',
  })
  .configSchema({
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
    },
  })
  .setup(async (config, ctx) => {
    ctx.logger.info('Setting up...');
    await ctx.fs.writeFile('config.json', JSON.stringify(config));
  })
  .hook('init', async (ctx) => {
    ctx.logger.info('Initialized!');
  })
  .hook('buildStart', async (ctx, buildConfig) => {
    ctx.logger.debug('Build starting...');
  })
  .hook('transform', async (ctx, code, id) => {
    if (id.endsWith('.custom')) {
      return { code: transformCode(code) };
    }
    return null;
  })
  .vitePlugin((config) => ({
    name: 'my-vite-plugin',
    transform(code, id) {
      return code;
    },
  }))
  .build();
```

### Manual Plugin

```typescript
import type { Plugin } from '@philjs/core/plugin-system';

export default function myPlugin(options = {}): Plugin {
  return {
    meta: {
      name: 'philjs-plugin-awesome',
      version: '0.1.0',
      philjs: '^0.1.0',
    },

    async setup(config, ctx) {
      // Setup logic
    },

    hooks: {
      async init(ctx) {
        // Initialize
      },

      async buildStart(ctx, buildConfig) {
        // Before build
      },

      async transform(ctx, code, id) {
        // Transform code
        return null;
      },

      async buildEnd(ctx, result) {
        // After build
      },
    },
  };
}
```

## Plugin Context API

### Logger

```typescript
ctx.logger.info('Information');
ctx.logger.warn('Warning');
ctx.logger.error('Error');
ctx.logger.debug('Debug');
ctx.logger.success('Success');
```

### File System

```typescript
// Read file
const content = await ctx.fs.readFile('path/to/file');

// Write file
await ctx.fs.writeFile('path/to/file', 'content');

// Check exists
const exists = await ctx.fs.exists('path/to/file');

// Create directory
await ctx.fs.mkdir('path/to/dir', { recursive: true });

// Read directory
const files = await ctx.fs.readdir('path/to/dir');

// Copy file
await ctx.fs.copy('src', 'dest');

// Remove file/dir
await ctx.fs.remove('path/to/file');
```

### Utilities

```typescript
// Resolve path
const fullPath = ctx.utils.resolve('relative', 'path');

// Execute command
const { stdout, stderr } = await ctx.utils.exec('ls -la');

// Get package manager
const pm = await ctx.utils.getPackageManager(); // npm | pnpm | yarn | bun

// Install packages
await ctx.utils.installPackages(['package1', 'package2'], true); // dev deps

// Read package.json
const pkg = await ctx.utils.readPackageJson();

// Write package.json
await ctx.utils.writePackageJson(pkg);
```

## Testing Plugins

```typescript
import { createTester } from 'create-philjs-plugin';
import { describe, it, expect } from 'vitest';
import myPlugin from './index';

describe('My Plugin', () => {
  it('should setup correctly', async () => {
    const tester = createTester(myPlugin);

    // Test setup
    await tester.testSetup({ enabled: true });

    // Check files
    const file = await tester.getFile('config.json');
    expect(file).toBeDefined();
  });

  it('should transform code', async () => {
    const tester = createTester(myPlugin);

    const result = await tester.testHook(
      'transform',
      {},
      'const x = 1;',
      'file.ts'
    );

    expect(result).not.toBeNull();
  });
});
```

## Validation

```typescript
import { pluginValidator } from 'create-philjs-plugin';

// Validate plugin
const { valid, errors } = pluginValidator.validate(myPlugin);

// Validate config
const result = pluginValidator.validateConfig(
  { enabled: true },
  myPlugin.configSchema
);
```

## Lifecycle Hooks

```typescript
hooks: {
  // Initialization
  async init(ctx) {
    // Called when plugin is loaded
  },

  // Build lifecycle
  async buildStart(ctx, buildConfig) {
    // Before build starts
  },

  async transform(ctx, code, id) {
    // Transform files during build
    return { code: newCode };
  },

  async buildEnd(ctx, result) {
    // After build completes
  },

  // Dev server lifecycle
  async devServerStart(ctx, server) {
    // When dev server starts
  },

  async fileChange(ctx, file) {
    // When file changes in dev
  },

  // Other hooks
  async serveStart(ctx) {
    // Before serving production build
  },

  async testStart(ctx) {
    // Before running tests
  },

  async deployStart(ctx, target) {
    // Before deployment
  },

  async cleanup(ctx) {
    // When plugin is unloaded
  },
}
```

## Official Plugins

### Tailwind CSS

```typescript
import tailwind from '@philjs/plugin-tailwind';

tailwind({
  jit: true,
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
  optimization: {
    purge: true,
    minify: true,
  },
})
```

### Analytics

```typescript
import analytics from '@philjs/plugin-analytics';

analytics({
  provider: 'ga4', // or 'plausible', 'mixpanel', etc.
  trackingId: 'G-XXXXXXXXXX',
  debug: false,
  disableInDev: true,
  privacy: {
    anonymizeIp: true,
    respectDnt: true,
  },
  customEvents: {
    pageViews: true,
    errors: true,
  },
})
```

## Plugin Composition

```typescript
import { composePlugins, definePreset } from '@philjs/core/plugin-system';

// Compose multiple plugins
const combined = composePlugins([plugin1, plugin2, plugin3]);

// Create preset
const productionPreset = definePreset('production', [
  tailwind(),
  analytics({ provider: 'ga4' }),
  seo({ sitemap: true }),
]);

export default defineConfig({
  plugins: productionPreset.plugins,
});
```

## Publishing

```bash
# Build
npm run build

# Test
npm test

# Publish to npm
npm publish

# Submit to registry (if available)
philjs plugin submit philjs-plugin-awesome
```

## Common Patterns

### Transform Specific Files

```typescript
async transform(ctx, code, id) {
  if (!id.endsWith('.special')) return null;

  return {
    code: transformCode(code),
    map: null,
  };
}
```

### Modify Vite Config

```typescript
vitePlugin(config) {
  return {
    name: 'my-plugin',
    config() {
      return {
        optimizeDeps: {
          include: ['my-dep'],
        },
      };
    },
  };
}
```

### Create Config Files

```typescript
async setup(config, ctx) {
  await ctx.fs.writeFile(
    'my-config.ts',
    `export default ${JSON.stringify(config, null, 2)};`
  );
}
```

### Install Dependencies

```typescript
async setup(config, ctx) {
  const pkg = await ctx.utils.readPackageJson();

  pkg.devDependencies = {
    ...pkg.devDependencies,
    'my-dep': '^0.1.0',
  };

  await ctx.utils.writePackageJson(pkg);
  await ctx.utils.installPackages(['my-dep'], true);
}
```

## Debugging

### Enable Debug Logging

```typescript
// In plugin
ctx.logger.debug('Debug message');

// Enable in config
export default defineConfig({
  plugins: [
    myPlugin({ debug: true }),
  ],
});
```

### Check Plugin Info

```bash
philjs plugin info philjs-plugin-awesome
```

### Verify Plugin

```bash
philjs plugin verify philjs-plugin-awesome
```

## Best Practices

1. **Naming:** Use `philjs-plugin-*` prefix
2. **Types:** Export TypeScript types
3. **Config:** Provide sensible defaults
4. **Errors:** Handle gracefully with good messages
5. **Docs:** Include README with examples
6. **Tests:** Test all hooks and edge cases
7. **Performance:** Only transform relevant files
8. **Logging:** Use appropriate log levels

## Resources

- [Full Documentation](PLUGIN_SYSTEM.md)
- [API Reference](https://philjs.dev/api/plugins)
- [Examples](https://github.com/philjs/plugins)
- [Marketplace](https://plugins.philjs.dev)
