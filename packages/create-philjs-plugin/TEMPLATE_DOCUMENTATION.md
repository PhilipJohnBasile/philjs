# Template Documentation

Complete documentation for all plugin templates and their features.

## Template Overview

create-philjs-plugin provides 4 different templates, each optimized for specific use cases:

1. **Basic Plugin** - General-purpose plugins
2. **Vite Plugin** - Build system integration
3. **Transform Plugin** - Code transformation
4. **UI Addon** - Component libraries

## Basic Plugin Template

### Overview

The Basic Plugin template provides a simple foundation for PhilJS plugins with essential lifecycle hooks.

### Features

- **Configuration Schema**: Type-safe config validation
- **Runtime API**: Plugin API for runtime access
- **CLI Commands**: Custom CLI command integration
- **Server Middleware**: Express-compatible middleware

### Generated Files

```
philjs-plugin-basic/
├── src/
│   ├── __tests__/
│   │   └── index.test.ts
│   └── index.ts
├── examples/
│   ├── basic.ts
│   └── advanced.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Example Usage

```typescript
import { Plugin } from 'philjs-core/plugin-system';

export interface BasicConfig {
  enabled?: boolean;
}

export function createBasicPlugin(config: BasicConfig = {}): Plugin {
  return {
    meta: {
      name: 'philjs-plugin-basic',
      version: '1.0.0',
    },
    async setup(config, ctx) {
      ctx.logger.info('Setting up...');
    },
    hooks: {
      async init(ctx) {
        ctx.logger.info('Initialized');
      },
    },
  };
}
```

## Vite Plugin Template

### Overview

The Vite Plugin template integrates with Vite's plugin system for advanced build customization.

### Features

- **Virtual Modules**: Create modules that don't exist on disk
- **Custom HMR**: Hot module replacement logic
- **Asset Handling**: Custom asset processing
- **SSR Support**: Server-side rendering integration

### Generated Files

```
philjs-plugin-vite/
├── src/
│   ├── __tests__/
│   │   └── index.test.ts
│   └── index.ts
├── examples/
│   ├── virtual-modules.ts
│   └── hmr.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Example Usage

```typescript
import type { Plugin as VitePlugin } from 'vite';

export function createVitePlugin(config = {}): Plugin {
  return {
    vitePlugin(pluginConfig) {
      const plugin: VitePlugin = {
        name: 'my-vite-plugin',

        resolveId(id) {
          if (id.startsWith('virtual:')) {
            return id;
          }
        },

        load(id) {
          if (id.startsWith('virtual:')) {
            return `export default ${JSON.stringify(config)};`;
          }
        },

        transform(code, id) {
          // Transform code
          return null;
        },

        handleHotUpdate({ file, server }) {
          // Custom HMR
        },
      };

      return plugin;
    },
  };
}
```

## Transform Plugin Template

### Overview

The Transform Plugin template is designed for code transformation with AST support.

### Features

- **AST Transformation**: Babel-powered AST manipulation
- **Source Maps**: Generate accurate source maps
- **Type Generation**: Automatic TypeScript type generation
- **Code Splitting**: Intelligent code splitting

### Generated Files

```
philjs-plugin-transform/
├── src/
│   ├── __tests__/
│   │   └── index.test.ts
│   ├── utils/
│   │   └── transformer.ts
│   └── index.ts
├── examples/
│   ├── ast-transform.ts
│   └── code-gen.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Example Usage

```typescript
import * as babel from '@babel/core';

export function createTransformPlugin(config = {}): Plugin {
  return {
    hooks: {
      async transform(ctx, code, id) {
        const result = await babel.transformAsync(code, {
          plugins: [
            // Your Babel plugins
          ],
          filename: id,
          sourceMaps: true,
        });

        return {
          code: result.code,
          map: result.map,
        };
      },
    },
  };
}
```

## UI Addon Template

### Overview

The UI Addon template provides scaffolding for component libraries and design systems.

### Features

- **React Components**: Pre-configured React setup
- **CSS Utilities**: Style system and utilities
- **Theme System**: Theming support with context
- **Icons Package**: Icon component setup

### Generated Files

```
philjs-plugin-ui/
├── src/
│   ├── __tests__/
│   │   └── index.test.tsx
│   ├── components/
│   │   └── Button.tsx
│   ├── styles/
│   │   └── index.css
│   └── index.ts
├── examples/
│   ├── components.tsx
│   └── theme.tsx
├── package.json
├── tsconfig.json
└── README.md
```

### Example Usage

```typescript
import * as React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
}) => {
  return (
    <button className={`btn btn-${variant}`}>
      {children}
    </button>
  );
};

// Theme Provider
export const ThemeProvider: React.FC = ({ children }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
```

## Feature Flags

Each template supports optional features that can be selected during scaffolding:

### Basic Plugin Features

- **config**: Configuration schema validation
- **runtime-api**: Plugin runtime API
- **cli**: CLI command integration
- **middleware**: Server middleware support

### Vite Plugin Features

- **virtual-modules**: Virtual module support
- **hmr**: Hot module replacement
- **assets**: Asset handling
- **ssr**: SSR support

### Transform Plugin Features

- **ast**: AST transformation (Babel)
- **sourcemaps**: Source map generation
- **types**: Type generation
- **splitting**: Code splitting

### UI Addon Features

- **react**: React components
- **css**: CSS utilities
- **theme**: Theme system
- **icons**: Icon components

## Customization

### Modifying Templates

Templates are generated dynamically using the template engine. You can customize:

1. **Plugin Structure**: Edit `src/template-engine.ts`
2. **Generated Code**: Modify template functions
3. **File Layout**: Update generator logic in `src/generator.ts`

### Adding New Templates

To add a new template type:

1. Add type to `PluginOptions` in `src/generator.ts`
2. Create template generator function
3. Add features to `FEATURES_BY_TYPE` in `src/cli.ts`
4. Update CLI prompts

## Template Variables

Templates support the following variables:

- `{{PLUGIN_NAME}}` - PascalCase plugin name
- `{{PACKAGE_NAME}}` - Full package name
- `{{DESCRIPTION}}` - Plugin description
- `{{AUTHOR}}` - Author name
- `{{LICENSE}}` - License type
- `{{YEAR}}` - Current year

## Best Practices

### Choosing the Right Template

- **Basic**: For most plugins without complex build needs
- **Vite**: When you need build system integration
- **Transform**: For code generation/transformation
- **UI Addon**: For component libraries

### Feature Selection

- Start with minimal features
- Add features as needed
- Consider maintenance overhead
- Think about bundle size

### Testing

Each template includes test setup:

- Unit tests for plugin logic
- Integration tests for hooks
- Mock context for testing
- Coverage reporting

## Migration

### Upgrading Templates

When upgrading from older versions:

1. Review changelog for breaking changes
2. Update dependencies
3. Run tests
4. Update generated code if needed

### Converting Between Templates

To convert between templates:

1. Create new plugin with desired template
2. Copy your custom logic
3. Update imports and exports
4. Update tests

## Troubleshooting

### Common Issues

**Build Errors**
```bash
npm run build
# Check tsconfig.json
# Verify all imports
```

**Test Failures**
```bash
npm test
# Check test setup
# Verify mock data
```

**Missing Features**
```bash
# Re-scaffold with additional features
npm create philjs-plugin
```

## Additional Resources

- [Usage Guide](./USAGE_GUIDE.md)
- [Plugin Examples](./examples)
- [API Reference](./README.md#api-reference)
