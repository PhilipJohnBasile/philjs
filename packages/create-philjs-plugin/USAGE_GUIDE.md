# Usage Guide

Complete guide for using create-philjs-plugin to build PhilJS plugins.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Plugin Types](#plugin-types)
3. [Features](#features)
4. [Development](#development)
5. [Testing](#testing)
6. [Publishing](#publishing)
7. [Best Practices](#best-practices)

## Getting Started

### Creating Your First Plugin

```bash
npm create philjs-plugin
```

Follow the prompts:

1. **Plugin Name**: `philjs-plugin-awesome`
   - Must start with `philjs-plugin-`
   - Use kebab-case
   - Be descriptive

2. **Plugin Type**: Select the template that fits your needs
   - Basic: General-purpose plugins
   - Vite: Build system integration
   - Transform: Code transformation
   - UI Addon: Component libraries

3. **Description**: Brief description of what your plugin does

4. **Author**: Your name or organization

5. **License**: Choose from MIT, Apache-2.0, BSD-3-Clause, ISC, or GPL-3.0

6. **Features**: Select additional features based on your plugin type

7. **TypeScript**: Recommended for better type safety

8. **Testing**: Include Vitest setup for testing

9. **Git**: Initialize a git repository

## Plugin Types

### Basic Plugin

Best for:
- Custom build steps
- Configuration management
- Runtime modifications
- General utilities

Features available:
- Configuration schema
- Runtime API
- CLI commands
- Server middleware

Example:
```typescript
import { Plugin } from 'philjs-core/plugin-system';

export function createMyPlugin(config = {}): Plugin {
  return {
    meta: {
      name: 'philjs-plugin-my-plugin',
      version: '1.0.0',
    },
    async setup(config, ctx) {
      // Setup logic
    },
    hooks: {
      async init(ctx) {
        // Initialization
      },
    },
  };
}
```

### Vite Plugin

Best for:
- Virtual modules
- Custom transformations
- HMR (Hot Module Replacement)
- Asset handling

Features available:
- Virtual modules
- Custom HMR
- Asset handling
- SSR support

Example:
```typescript
export function createVitePlugin(config = {}): Plugin {
  return {
    vitePlugin(config) {
      return {
        name: 'my-vite-plugin',
        resolveId(id) {
          // Resolve virtual modules
        },
        load(id) {
          // Load virtual modules
        },
        transform(code, id) {
          // Transform code
        },
      };
    },
  };
}
```

### Transform Plugin

Best for:
- Code generation
- Syntax transformations
- Import/export rewrites
- Bundle optimizations

Features available:
- AST transformation
- Source maps
- Type generation
- Code splitting

Example:
```typescript
export function createTransformPlugin(config = {}): Plugin {
  return {
    hooks: {
      async transform(ctx, code, id) {
        // Transform code
        return {
          code: transformedCode,
          map: sourceMap,
        };
      },
    },
  };
}
```

### UI Addon

Best for:
- Component libraries
- Design systems
- Theme providers
- Icon packages

Features available:
- React components
- CSS utilities
- Theme system
- Icons package

Example:
```typescript
import * as React from 'react';

export const Button: React.FC<ButtonProps> = (props) => {
  return <button {...props} />;
};

export function createUIPlugin(config = {}): Plugin {
  return {
    meta: {
      name: 'philjs-plugin-ui',
      version: '1.0.0',
    },
  };
}
```

## Features

### Configuration Schema

Add type-safe configuration:

```typescript
export interface MyPluginConfig {
  enabled?: boolean;
  apiKey?: string;
}

export const plugin: Plugin = {
  configSchema: {
    type: 'object',
    properties: {
      enabled: {
        type: 'boolean',
        default: true,
      },
      apiKey: {
        type: 'string',
        description: 'API key for service',
      },
    },
    required: ['apiKey'],
  },
};
```

### Virtual Modules

Create virtual modules that don't exist on disk:

```typescript
vitePlugin(config) {
  return {
    resolveId(id) {
      if (id.startsWith('virtual:my-plugin/')) {
        return id;
      }
    },
    load(id) {
      if (id === 'virtual:my-plugin/config') {
        return `export default ${JSON.stringify(config)};`;
      }
    },
  };
}
```

### AST Transformation

Transform code using AST:

```typescript
import * as babel from '@babel/core';

hooks: {
  async transform(ctx, code, id) {
    const result = await babel.transformAsync(code, {
      plugins: [myPlugin],
      filename: id,
    });

    return {
      code: result.code,
      map: result.map,
    };
  },
}
```

## Development

### Project Structure

```
philjs-plugin-awesome/
├── src/
│   ├── __tests__/
│   │   └── index.test.ts
│   ├── index.ts
│   └── utils/
├── examples/
│   ├── basic.ts
│   └── advanced.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### Development Workflow

```bash
# Install dependencies
npm install

# Start watch mode
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build
```

### Using the Plugin SDK

#### PluginBuilder

Fluent API for creating plugins:

```typescript
import { createBuilder } from 'create-philjs-plugin';

const plugin = createBuilder()
  .meta({
    name: 'my-plugin',
    version: '1.0.0',
    description: 'My plugin',
  })
  .setup(async (config, ctx) => {
    ctx.logger.info('Setting up...');
  })
  .hook('init', async (ctx) => {
    ctx.logger.info('Initialized');
  })
  .build();
```

#### PluginTester

Test your plugin:

```typescript
import { createTester } from 'create-philjs-plugin';
import { describe, it } from 'vitest';

describe('My Plugin', () => {
  const tester = createTester(myPlugin);

  it('should setup', async () => {
    await tester.testSetup({ enabled: true });
  });

  it('should run hooks', async () => {
    await tester.testHook('init');
  });
});
```

## Testing

### Writing Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTester } from 'create-philjs-plugin';
import plugin from '../index.js';

describe('My Plugin', () => {
  let tester;

  beforeEach(() => {
    tester = createTester(plugin);
  });

  it('has correct metadata', () => {
    expect(plugin.meta.name).toBe('philjs-plugin-my-plugin');
    expect(plugin.meta.version).toBe('1.0.0');
  });

  it('sets up successfully', async () => {
    await tester.testSetup({
      enabled: true,
    });
  });

  it('executes init hook', async () => {
    await tester.testHook('init');
  });

  it('transforms code', async () => {
    const result = await tester.testHook(
      'transform',
      {},
      'const x = 1;',
      'test.ts'
    );

    expect(result).toBeDefined();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Publishing

### Prepare for Publishing

1. **Update version** in package.json
2. **Update CHANGELOG.md**
3. **Run tests**: `npm test`
4. **Build**: `npm run build`
5. **Test locally**: `npm link`

### Publish to npm

```bash
# Login to npm
npm login

# Publish
npm publish

# Tag release
git tag v1.0.0
git push --tags
```

### Registry Options

```bash
# Publish to npm
npm publish

# Publish as scoped package
npm publish --access public

# Publish to private registry
npm publish --registry https://registry.example.com
```

## Best Practices

### Naming

- Always prefix with `philjs-plugin-`
- Use kebab-case
- Be descriptive but concise
- Example: `philjs-plugin-markdown`

### Versioning

- Follow semantic versioning (semver)
- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

### Documentation

- Document all configuration options
- Provide usage examples
- Include migration guides
- Maintain a CHANGELOG

### Performance

- Minimize work in hot code paths
- Cache expensive operations
- Use async/await appropriately
- Lazy load dependencies

### Error Handling

- Provide clear error messages
- Use ctx.logger for output
- Handle edge cases gracefully
- Validate configuration

### Code Quality

- Write tests for all features
- Use TypeScript for type safety
- Follow consistent code style
- Document complex logic

### Examples

Include examples directory:

```
examples/
├── basic.ts           # Basic usage
├── advanced.ts        # Advanced features
└── integration.ts     # Integration example
```

### Security

- Validate all user input
- Sanitize file paths
- Don't expose sensitive data
- Use security best practices

## Additional Resources

- [PhilJS Plugin System](../../PLUGIN_SYSTEM.md)
- [API Documentation](https://philjs.dev/docs/api)
- [Examples](./examples)
- [Contributing Guide](../../CONTRIBUTING.md)
