# philjs-plugins

Plugin system for PhilJS - Create and use framework plugins to extend functionality.

<!-- PACKAGE_GUIDE_START -->
## Overview

Plugin system for PhilJS - create and use framework plugins

## Focus Areas

- philjs, plugins, extensions, integrations

## Entry Points

- packages/philjs-plugins/src/index.ts
- packages/philjs-plugins/src/registry.ts

## Quick Start

```ts
import { BuildResult, Middleware, PhilJSApp } from '@philjs/plugins';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- BuildResult
- Middleware
- PhilJSApp
- Plugin
- PluginCategory
- PluginContext
- PluginHooks
- PluginInfo
- PluginRegistry
- RenderContext
- RouteDefinition
- ServerHandler
<!-- PACKAGE_GUIDE_END -->

## Features

- **Plugin Architecture** - Extend PhilJS with custom plugins
- **Lifecycle Hooks** - Hook into framework lifecycle events
- **Plugin Registry** - Discover and manage plugins
- **Type Safety** - Fully typed plugin API
- **Hot Reloading** - Plugins support HMR in development

## Installation

```bash
pnpm add philjs-plugins
```

## Quick Start

### Create a Plugin

```typescript
import { definePlugin } from 'philjs-plugins';

export default definePlugin({
  name: 'my-plugin',
  version: '1.0.0',

  setup({ app, config }) {
    // Plugin initialization
    console.log('Plugin loaded!');

    // Return cleanup function
    return () => {
      console.log('Plugin unloaded');
    };
  }
});
```

### Use a Plugin

```typescript
import { usePlugins } from 'philjs-plugins';
import myPlugin from './my-plugin';

usePlugins([myPlugin]);
```

## Documentation

For more information, see the [PhilJS documentation](../../docs).

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./registry
- Source files: packages/philjs-plugins/src/index.ts, packages/philjs-plugins/src/registry.ts

### Public API
- Direct exports: BuildResult, Middleware, PhilJSApp, Plugin, PluginCategory, PluginContext, PluginHooks, PluginInfo, PluginRegistry, RenderContext, RouteDefinition, ServerHandler, callHook, createPlugin, definePlugin, fetchPluginInfo, getInstalledPlugins, getPluginCategories, getPluginsByCategory, getProvider, installPlugin, isPluginInstalled, searchPlugins, uninstallPlugin
- Re-exported names: PluginRegistry, fetchPluginInfo, searchPlugins
- Re-exported modules: ./registry.js
<!-- API_SNAPSHOT_END -->

## License

MIT
