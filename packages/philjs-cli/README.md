# philjs-cli

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

CLI tools for PhilJS - The framework that thinks ahead. Build, develop, and generate code for your PhilJS applications.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Features

- **Dev Server** - Fast development server with HMR (Hot Module Replacement)
- **Production Build** - Optimized builds with SSR and SSG support
- **Code Generation** - Scaffolding for components, routes, pages, hooks, and stores
- **Bundle Analysis** - Analyze bundle size and performance
- **Type Generation** - Auto-generate TypeScript types for routes
- **Testing Integration** - Run tests with Vitest
- **Preview Server** - Preview production builds locally

## Installation

```bash
pnpm add -D philjs-cli
```

Or install globally:

```bash
pnpm add -g philjs-cli
```

## Commands

### Development

#### `philjs dev`

Start the development server with Hot Module Replacement.

```bash
philjs dev
philjs dev --port 3000
philjs dev --host 0.0.0.0
philjs dev --open  # Open browser automatically
```

**Options:**
- `-p, --port <port>` - Port to run dev server on (default: 3000)
- `--host <host>` - Host to bind to (default: localhost)
- `--open` - Open browser automatically

### Build

#### `philjs build`

Build your application for production.

```bash
philjs build
philjs build --ssg  # Static Site Generation
philjs build --analyze  # Analyze bundle size
philjs build --outDir dist
```

**Options:**
- `--ssg` - Generate static site (SSG mode)
- `--analyze` - Analyze bundle size
- `--outDir <dir>` - Output directory (default: dist)

#### `philjs preview`

Preview production build locally.

```bash
philjs preview
philjs preview --port 4173
```

**Options:**
- `-p, --port <port>` - Port to run preview server on (default: 4173)

### Code Generation

#### `philjs generate component <name>`

Generate a new component.

```bash
philjs generate component Button
philjs g c Button  # Short alias

# Options
philjs g c Button --directory src/ui
philjs g c Button --no-test  # Skip test file
philjs g c Button --with-styles  # Include CSS module
philjs g c Button --js  # Use JavaScript instead of TypeScript
```

**Creates:**
- `src/components/Button.tsx` - Component file
- `src/components/Button.test.tsx` - Test file (optional)
- `src/components/Button.module.css` - CSS module (optional)

**Options:**
- `-d, --directory <dir>` - Target directory (default: src/components)
- `--no-test` - Skip test file generation
- `--with-styles` - Generate CSS module file
- `--js` - Use JavaScript instead of TypeScript

#### `philjs generate route <name>`

Generate a new route with loader.

```bash
philjs generate route users
philjs g r users

# Options
philjs g r users --directory src/routes
philjs g r users --no-test
```

**Creates:**
- `src/routes/users.tsx` - Route component with loader
- `src/routes/users.test.tsx` - Test file (optional)

**Options:**
- `-d, --directory <dir>` - Target directory (default: src/routes)
- `--no-test` - Skip test file generation
- `--js` - Use JavaScript instead of TypeScript

#### `philjs generate page <name>`

Generate a new page component with SEO metadata.

```bash
philjs generate page About
philjs g p About

# Options
philjs g p About --directory src/pages
```

**Creates:**
- `src/pages/About.tsx` - Page component with Meta tags
- `src/pages/About.test.tsx` - Test file (optional)

**Options:**
- `-d, --directory <dir>` - Target directory (default: src/pages)
- `--no-test` - Skip test file generation
- `--js` - Use JavaScript instead of TypeScript

#### `philjs generate hook <name>`

Generate a custom hook.

```bash
philjs generate hook useCounter
philjs g h useCounter

# Options
philjs g h useCounter --directory src/hooks
```

**Creates:**
- `src/hooks/useCounter.ts` - Hook implementation
- `src/hooks/useCounter.test.ts` - Test file (optional)

**Options:**
- `-d, --directory <dir>` - Target directory (default: src/hooks)
- `--no-test` - Skip test file generation
- `--js` - Use JavaScript instead of TypeScript

#### `philjs generate store <name>`

Generate a state store.

```bash
philjs generate store userStore
philjs g s userStore

# Options
philjs g s userStore --directory src/stores
```

**Creates:**
- `src/stores/userStore.ts` - Store with signals
- `src/stores/userStore.test.ts` - Test file (optional)

**Options:**
- `-d, --directory <dir>` - Target directory (default: src/stores)
- `--no-test` - Skip test file generation
- `--js` - Use JavaScript instead of TypeScript

### Analysis & Types

#### `philjs analyze`

Analyze bundle size and performance.

```bash
philjs analyze
```

Shows:
- Bundle size breakdown
- Code splitting analysis
- Performance metrics
- Optimization suggestions

#### `philjs generate-types`

Generate TypeScript types for routes.

```bash
philjs generate-types
```

Generates type-safe route definitions based on your file-based routing structure.

### Testing

#### `philjs test`

Run tests with Vitest.

```bash
philjs test
philjs test --watch  # Watch mode
philjs test --coverage  # Generate coverage report
```

**Options:**
- `--watch` - Watch mode for continuous testing
- `--coverage` - Generate coverage report

## Configuration

Create a `philjs.config.ts` file in your project root:

```typescript
import { defineConfig } from 'philjs-cli';

export default defineConfig({
  // Development server
  dev: {
    port: 3000,
    host: 'localhost',
    open: true
  },

  // Build options
  build: {
    outDir: 'dist',
    ssg: false,
    sourcemap: true
  },

  // Code generation
  generate: {
    typescript: true,
    componentsDir: 'src/components',
    routesDir: 'src/routes',
    pagesDir: 'src/pages'
  }
});
```

### Advanced Configuration with ES2024 Features

```typescript
import { defineConfig, type PluginConfig } from 'philjs-cli';

// Using Object.groupBy() to organize plugins by type
const plugins: PluginConfig[] = [
  { name: 'tailwind', type: 'style' },
  { name: 'i18n', type: 'feature' },
  { name: 'pwa', type: 'feature' },
];

const groupedPlugins = Object.groupBy(plugins, p => p.type);

export default defineConfig({
  plugins: groupedPlugins.feature ?? [],
  styles: groupedPlugins.style ?? [],
});
```

## Vite Plugin

Use the PhilJS Vite plugin in your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import philjs from 'philjs-cli/vite';

export default defineConfig({
  plugins: [
    philjs({
      ssr: true,
      islands: true,
      router: 'file-based' // or 'config'
    })
  ]
});
```

**Plugin Options:**
- `ssr` - Enable server-side rendering (default: true)
- `islands` - Enable islands architecture (default: true)
- `router` - Router mode: 'file-based' or 'config' (default: 'file-based')

## Project Structure

Recommended project structure when using philjs-cli:

```
my-app/
 src/
    components/     # Shared components
    routes/         # Route components with loaders
    pages/          # Page components
    hooks/          # Custom hooks
    stores/         # State stores
    styles/         # Global styles
    entry-client.ts # Client entry point
    entry-server.ts # Server entry point
 public/             # Static assets
 philjs.config.ts    # PhilJS configuration
 vite.config.ts      # Vite configuration
 package.json
```

## Examples

### Generate a complete feature

```bash
# Create a store
philjs g store todoStore

# Create a component
philjs g component TodoList --with-styles

# Create a route
philjs g route todos

# Create a page with the route
philjs g page Todos
```

### Start development

```bash
# Install dependencies
pnpm install

# Start dev server
philjs dev

# Run tests in watch mode
philjs test --watch
```

### Build for production

```bash
# Build the app
philjs build

# Preview the build
philjs preview

# Analyze bundle
philjs analyze
```

## Scripts Integration

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "philjs dev",
    "build": "philjs build",
    "preview": "philjs preview",
    "test": "philjs test",
    "test:watch": "philjs test --watch",
    "analyze": "philjs analyze",
    "generate": "philjs generate"
  }
}
```

## Documentation

For more information, see the [PhilJS documentation](../../docs).

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-cli/src/index.ts

### Public API
- Direct exports: (none detected)
- Re-exported names: ApiOptions, BuildOptions, ComponentOptions, ContextOptions, DevServerOptions, GeneratorConfig, HookOptions, ModelOptions, PageOptions, PhilJSConfig, RouteOptions, ScaffoldOptions, StoreOptions, TemplateContext, analyze, buildProduction, defineConfig, generateApi, generateComponent, generateContext, generateHook, generateModel, generatePage, generateRoute, generateScaffold, generateStore, generateTypes, getGeneratorConfig, loadConfig, philJSPlugin, philJSSSRPlugin, startDevServer
- Re-exported modules: ./analyze.js, ./build.js, ./config.js, ./dev-server.js, ./generate-types.js, ./generators/index.js, ./vite-plugin.js
<!-- API_SNAPSHOT_END -->

## License

MIT
