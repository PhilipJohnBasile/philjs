# create-philjs-plugin

Scaffold new PhilJS plugins with comprehensive templates and interactive CLI.

## Features

- Interactive CLI with prompts
- Multiple plugin templates (Basic, Vite, Transform, UI Addon)
- TypeScript support
- Automatic testing setup with Vitest
- Feature-based scaffolding
- Auto-generated documentation
- Example files included
- Git initialization
- Plugin SDK with testing utilities

## Quick Start

```bash
# Using npm
npm create philjs-plugin

# Using yarn
yarn create philjs-plugin

# Using pnpm
pnpm create philjs-plugin

# Using bun
bun create philjs-plugin
```

## Usage

### Interactive Mode

Simply run the command and follow the prompts:

```bash
npm create philjs-plugin
```

You'll be asked about:

1. **Plugin name** - Must start with `philjs-plugin-`
2. **Plugin type** - Choose from:
   - Basic Plugin - Simple plugin with lifecycle hooks
   - Vite Plugin - Vite integration with transform hooks
   - Transform Plugin - Code transformation plugin
   - UI Addon - UI components and styles
3. **Description** - Brief description of your plugin
4. **Author** - Your name or organization
5. **License** - MIT, Apache-2.0, BSD-3-Clause, ISC, or GPL-3.0
6. **Features** - Select from type-specific features
7. **TypeScript** - Use TypeScript (recommended)
8. **Testing** - Include Vitest testing setup
9. **Git** - Initialize git repository

## Plugin Templates

### Basic Plugin

Simple plugin with lifecycle hooks perfect for adding custom build logic or runtime behavior.

**Use cases:** Custom build steps, File processing, Environment configuration

### Vite Plugin

Integration with Vite build tool for advanced bundling and transformation.

**Use cases:** Virtual modules, Custom transformations, Build optimizations

### Transform Plugin

Code transformation plugin with AST support and source maps.

**Use cases:** Code generation, Syntax transformations, Import rewrites

### UI Addon

Component library and UI utilities plugin.

**Use cases:** Design systems, Component libraries, Theme providers

## Plugin SDK

### PluginBuilder

Fluent API for building plugins:

```typescript
import { createBuilder } from 'create-philjs-plugin';

const plugin = createBuilder()
  .meta({ name: 'my-plugin', version: '0.1.0' })
  .setup(async (config, ctx) => {
    ctx.logger.info('Setting up...');
  })
  .hook('init', async (ctx) => {
    ctx.logger.info('Initialized!');
  })
  .build();
```

### PluginTester

Testing utilities:

```typescript
import { createTester } from 'create-philjs-plugin';
import myPlugin from './index.js';

const tester = createTester(myPlugin);
await tester.testSetup({ enabled: true });
await tester.testHook('init');
```

## Examples

See the [examples](./examples) directory for complete plugin examples:

- [basic-plugin.ts](./examples/basic-plugin.ts) - Hello world plugin
- [vite-plugin.ts](./examples/vite-plugin.ts) - Virtual modules
- [transform-plugin.ts](./examples/transform-plugin.ts) - Code transformation
- [ui-addon-plugin.tsx](./examples/ui-addon-plugin.tsx) - UI components

## Development Workflow

```bash
cd philjs-plugin-awesome
npm install
npm run dev      # Watch mode
npm test         # Run tests
npm run build    # Build for production
```

## License

MIT
