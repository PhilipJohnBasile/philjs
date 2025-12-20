# PhilJS Plugin System

Comprehensive plugin architecture for extending PhilJS with powerful, composable functionality.

## Overview

The PhilJS plugin system provides a robust, type-safe way to extend the framework's capabilities. Plugins can hook into the build process, development server, and runtime behavior.

## Table of Contents

- [Quick Start](#quick-start)
- [Plugin Architecture](#plugin-architecture)
- [Creating Plugins](#creating-plugins)
- [Plugin Lifecycle](#plugin-lifecycle)
- [Official Plugins](#official-plugins)
- [Publishing Plugins](#publishing-plugins)
- [Best Practices](#best-practices)

## Quick Start

### Using Plugins

```bash
# Install a plugin
philjs plugin add philjs-plugin-tailwind

# List installed plugins
philjs plugin list

# Search for plugins
philjs plugin search analytics

# Get plugin info
philjs plugin info philjs-plugin-seo
```

### Configure Plugins

```typescript
// philjs.config.ts
import { defineConfig } from 'philjs-core';
import tailwind from 'philjs-plugin-tailwind';
import analytics from 'philjs-plugin-analytics';

export default defineConfig({
  plugins: [
    tailwind({
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            primary: '#3b82f6',
          },
        },
      },
    }),
    analytics({
      provider: 'ga4',
      trackingId: 'G-XXXXXXXXXX',
    }),
  ],
});
```

## Plugin Architecture

### Plugin Interface

```typescript
interface Plugin {
  // Metadata
  meta: {
    name: string;              // Unique plugin name
    version: string;           // Semver version
    description?: string;      // Plugin description
    author?: string;           // Plugin author
    homepage?: string;         // Documentation URL
    license?: string;          // License type
    philjs?: string;           // Compatible PhilJS version
    dependencies?: Record<string, string>;  // Plugin dependencies
  };

  // Configuration schema
  configSchema?: PluginConfigSchema;

  // Setup function
  setup?(config: any, ctx: PluginContext): Promise<void> | void;

  // Lifecycle hooks
  hooks?: {
    init?(): Promise<void>;
    buildStart?(ctx: PluginContext, config: BuildConfig): Promise<void>;
    transform?(ctx: PluginContext, code: string, id: string): Promise<TransformResult | null>;
    buildEnd?(ctx: PluginContext, result: BuildResult): Promise<void>;
    devServerStart?(ctx: PluginContext, server: ViteDevServer): Promise<void>;
    // ... more hooks
  };

  // Build tool integration
  vitePlugin?(config: any): VitePlugin | VitePlugin[];
  rollupPlugin?(config: any): RollupPlugin;
}
```

### Plugin Context

The plugin context provides access to framework internals:

```typescript
interface PluginContext {
  version: string;           // PhilJS version
  root: string;              // Project root directory
  mode: 'development' | 'production' | 'test';
  config: Record<string, any>;  // User configuration
  logger: PluginLogger;      // Logging utilities
  fs: PluginFileSystem;      // File system operations
  utils: PluginUtils;        // Utility functions
}
```

## Creating Plugins

### Using the Plugin SDK

```bash
# Create a new plugin
npx create-philjs-plugin my-awesome-plugin

# Choose from templates:
# - Basic Plugin
# - Vite Plugin
# - Build Plugin
# - Dev Tool
# - Full Featured
```

### Manual Plugin Creation

```typescript
import { definePlugin } from 'philjs-core/plugin-system';

export default definePlugin((options = {}) => ({
  meta: {
    name: 'philjs-plugin-awesome',
    version: '1.0.0',
    description: 'An awesome plugin',
    philjs: '^2.0.0',
  },

  async setup(config, ctx) {
    ctx.logger.info('Setting up awesome plugin...');

    // Install dependencies
    await ctx.utils.installPackages(['awesome-lib'], true);

    // Create config file
    await ctx.fs.writeFile(
      'awesome.config.js',
      `export default ${JSON.stringify(config, null, 2)};`
    );

    ctx.logger.success('Setup complete!');
  },

  hooks: {
    async init(ctx) {
      ctx.logger.info('Plugin initialized');
    },

    async buildStart(ctx, buildConfig) {
      ctx.logger.debug('Build starting...');
    },

    async transform(ctx, code, id) {
      if (id.endsWith('.awesome')) {
        // Transform .awesome files
        return {
          code: transformAwesome(code),
          map: null,
        };
      }
      return null;
    },

    async buildEnd(ctx, result) {
      if (result.success) {
        ctx.logger.success('Build completed');
      }
    },
  },
}));
```

### Using Plugin Builder

```typescript
import { createBuilder } from 'create-philjs-plugin';

export default createBuilder()
  .meta({
    name: 'philjs-plugin-awesome',
    version: '1.0.0',
    description: 'An awesome plugin',
  })
  .configSchema({
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      theme: { type: 'string', enum: ['light', 'dark'] },
    },
  })
  .setup(async (config, ctx) => {
    ctx.logger.info('Setting up...');
  })
  .hook('init', async (ctx) => {
    ctx.logger.info('Initialized');
  })
  .hook('buildStart', async (ctx, buildConfig) => {
    ctx.logger.debug('Building...');
  })
  .build();
```

## Plugin Lifecycle

### Initialization Phase

1. **Plugin Registration** - Plugin is loaded and validated
2. **Dependency Resolution** - Dependencies are checked and ordered
3. **Setup** - `setup()` function is called
4. **Init Hook** - `init()` hook is triggered

### Build Phase

1. **Build Start** - `buildStart()` hook
2. **Transform** - `transform()` hook for each file
3. **Build End** - `buildEnd()` hook with results

### Development Phase

1. **Dev Server Start** - `devServerStart()` hook
2. **File Change** - `fileChange()` hook on updates
3. **Hot Module Replacement** - HMR updates

### Cleanup Phase

1. **Cleanup** - `cleanup()` hook is called
2. **Unload** - Plugin is removed from registry

## Official Plugins

### Tailwind CSS Plugin

```typescript
import tailwind from 'philjs-plugin-tailwind';

export default {
  plugins: [
    tailwind({
      jit: true,
      darkMode: 'class',
      content: ['./src/**/*.{ts,tsx}'],
      theme: {
        extend: {
          colors: {
            brand: '#ff6b6b',
          },
        },
      },
    }),
  ],
};
```

**Features:**
- Automatic Tailwind setup
- JIT mode support
- PostCSS integration
- Base styles generation
- Production optimization

### Analytics Plugin

```typescript
import analytics from 'philjs-plugin-analytics';

export default {
  plugins: [
    analytics({
      provider: 'ga4', // or 'plausible', 'mixpanel', 'posthog'
      trackingId: 'G-XXXXXXXXXX',
      privacy: {
        anonymizeIp: true,
        respectDnt: true,
      },
      customEvents: {
        pageViews: true,
        errors: true,
      },
    }),
  ],
};
```

**Supported Providers:**
- Google Analytics 4
- Plausible
- Mixpanel
- Amplitude
- PostHog
- Umami
- Fathom

### SEO Plugin

```typescript
import seo from 'philjs-plugin-seo';

export default {
  plugins: [
    seo({
      sitemap: true,
      robots: true,
      meta: {
        title: 'My Site',
        description: 'Welcome to my site',
        ogImage: '/og-image.png',
      },
    }),
  ],
};
```

**Features:**
- Meta tag generation
- Sitemap generation
- Robots.txt
- Open Graph tags
- Twitter Cards
- Structured data

### PWA Plugin

```typescript
import pwa from 'philjs-plugin-pwa';

export default {
  plugins: [
    pwa({
      manifest: {
        name: 'My App',
        short_name: 'App',
        theme_color: '#ffffff',
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
          },
        ],
      },
    }),
  ],
};
```

**Features:**
- Service worker generation
- Web app manifest
- Offline support
- Push notifications
- Install prompts

### i18n Plugin

```typescript
import i18n from 'philjs-plugin-i18n';

export default {
  plugins: [
    i18n({
      locales: ['en', 'es', 'fr'],
      defaultLocale: 'en',
      loadPath: './locales/{{lng}}/{{ns}}.json',
    }),
  ],
};
```

**Features:**
- Multi-language support
- Route-based locales
- Translation loading
- Type-safe translations
- RTL support

## Publishing Plugins

### 1. Prepare Package

```bash
npm run build
npm test
```

### 2. Update Package.json

```json
{
  "name": "philjs-plugin-awesome",
  "version": "1.0.0",
  "keywords": ["philjs", "plugin", "awesome"],
  "peerDependencies": {
    "philjs-core": "^2.0.0"
  }
}
```

### 3. Publish to npm

```bash
npm publish
```

### 4. Submit to Plugin Registry

```bash
philjs plugin submit philjs-plugin-awesome
```

## Best Practices

### 1. Naming Convention

- Use `philjs-plugin-*` prefix
- Keep names descriptive and concise
- Use kebab-case

### 2. Configuration

```typescript
// ✅ Good - Type-safe config with defaults
export interface MyPluginConfig {
  enabled?: boolean;
  theme?: 'light' | 'dark';
}

export default (config: MyPluginConfig = {}) => {
  const { enabled = true, theme = 'light' } = config;
  // ...
};

// ❌ Bad - No types or defaults
export default (config: any) => {
  // ...
};
```

### 3. Error Handling

```typescript
// ✅ Good - Graceful error handling
hooks: {
  async buildStart(ctx, config) {
    try {
      await doSomething();
    } catch (error) {
      ctx.logger.error('Failed to do something:', error);
      throw error; // Re-throw to fail build
    }
  }
}

// ❌ Bad - Silent failures
hooks: {
  async buildStart(ctx, config) {
    try {
      await doSomething();
    } catch (error) {
      // Silently ignored
    }
  }
}
```

### 4. Performance

```typescript
// ✅ Good - Only transform relevant files
async transform(ctx, code, id) {
  if (!id.endsWith('.special')) return null;
  return { code: transform(code) };
}

// ❌ Bad - Transform all files
async transform(ctx, code, id) {
  return { code: transform(code) };
}
```

### 5. Documentation

- Include clear README
- Provide examples
- Document all options
- Add TypeScript types

### 6. Testing

```typescript
import { createTester } from 'create-philjs-plugin';
import myPlugin from './index';

test('plugin setup', async () => {
  const tester = createTester(myPlugin);
  await tester.testSetup({ enabled: true });

  const file = await tester.getFile('config.json');
  expect(file).toBeDefined();
});

test('transform hook', async () => {
  const tester = createTester(myPlugin);
  const result = await tester.testHook(
    'transform',
    {},
    'input code',
    'file.js'
  );
  expect(result).toBeDefined();
});
```

## Advanced Topics

### Plugin Composition

```typescript
import { composePlugins } from 'philjs-core/plugin-system';
import pluginA from './plugin-a';
import pluginB from './plugin-b';

export default composePlugins([pluginA, pluginB]);
```

### Plugin Presets

```typescript
import { definePreset } from 'philjs-core/plugin-system';
import tailwind from 'philjs-plugin-tailwind';
import analytics from 'philjs-plugin-analytics';
import seo from 'philjs-plugin-seo';

export default definePreset('production-ready', [
  tailwind(),
  analytics({ provider: 'plausible' }),
  seo({ sitemap: true }),
]);
```

### Vite Integration

```typescript
import type { Plugin as VitePlugin } from 'vite';

export default {
  vitePlugin(config) {
    const plugin: VitePlugin = {
      name: 'my-plugin',

      config() {
        return {
          optimizeDeps: {
            include: ['my-dep'],
          },
        };
      },

      transform(code, id) {
        if (id.includes('special')) {
          return transform(code);
        }
      },

      handleHotUpdate(ctx) {
        // Handle HMR
      },
    };

    return plugin;
  },
};
```

## API Reference

### Plugin Manager

```typescript
import { PluginManager } from 'philjs-core/plugin-system';

const manager = new PluginManager();

// Register plugins
manager.register(myPlugin);

// Initialize
await manager.initialize(context);

// Call hooks
await manager.callHook('buildStart', context, buildConfig);

// Transform code
const result = await manager.transform(code, id);
```

### Plugin Helpers

```typescript
import { pluginHelpers } from 'create-philjs-plugin';

// Logger
const logger = pluginHelpers.createLogger('my-plugin');
logger.info('Hello');

// Retry logic
const result = await pluginHelpers.retry(
  async () => await fetchData(),
  { retries: 3, delay: 1000 }
);

// Debounce
const debounced = pluginHelpers.debounce(
  (msg) => console.log(msg),
  300
);
```

### Validation

```typescript
import { pluginValidator } from 'create-philjs-plugin';

// Validate plugin structure
const { valid, errors } = pluginValidator.validate(myPlugin);

// Validate config
const result = pluginValidator.validateConfig(
  { enabled: true },
  myPlugin.configSchema
);
```

## Examples

See the `examples/` directory for complete plugin examples:

- `examples/basic-plugin/` - Simple lifecycle hooks
- `examples/vite-plugin/` - Vite integration
- `examples/transform-plugin/` - Code transformation
- `examples/devtool-plugin/` - Development tools
- `examples/full-plugin/` - All features

## Contributing

We welcome plugin contributions! To submit a plugin:

1. Follow the [plugin guidelines](GUIDELINES.md)
2. Publish to npm
3. Submit to the [plugin registry](https://plugins.philjs.dev)
4. Share with the community

## Resources

- [Plugin API Reference](https://philjs.dev/api/plugins)
- [Plugin Examples](https://github.com/philjs/plugins)
- [Plugin Marketplace](https://plugins.philjs.dev)
- [Community Discord](https://discord.gg/philjs)

## License

MIT
