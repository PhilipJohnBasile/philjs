# philjs-plugins

Plugin system for PhilJS - Create and use framework plugins to extend functionality.

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

## License

MIT
