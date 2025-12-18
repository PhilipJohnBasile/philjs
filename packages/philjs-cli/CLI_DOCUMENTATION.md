# PhilJS CLI Documentation

Complete guide to PhilJS CLI tools for project scaffolding, development, and migration.

## Table of Contents

- [Installation](#installation)
- [Commands](#commands)
  - [Create Project](#create-project)
  - [Add Features](#add-features)
  - [Migrate](#migrate)
  - [Development](#development)
  - [Build](#build)
  - [Generate](#generate)
- [Project Templates](#project-templates)
- [Features](#features)
- [Migration Guides](#migration-guides)

## Installation

```bash
# Global installation
npm install -g philjs-cli

# Or use directly with npx
npx philjs <command>

# Or with pnpm
pnpm dlx philjs <command>
```

## Commands

### Create Project

Create a new PhilJS project with interactive setup.

```bash
philjs create [project-name]
```

#### Interactive Prompts

The create command will ask you:

1. **Project Name** - If not provided as argument
2. **Template** - Choose from:
   - `basic` - Simple starter with signals and routing
   - `ssr` - Server-side rendering with islands architecture
   - `spa` - Single page application with client-side routing
   - `fullstack` - Full-stack SSR with API routes and database setup
   - `library` - For creating PhilJS component libraries
3. **TypeScript or JavaScript** - Default: TypeScript
4. **CSS Framework**:
   - None (plain CSS)
   - Tailwind CSS
   - CSS Modules
   - Styled Components
5. **Testing Framework**:
   - Vitest (recommended)
   - Jest
6. **Linting** - ESLint & Prettier
7. **Git** - Initialize git repository
8. **Package Manager** - npm, pnpm, or yarn

#### Example

```bash
# Interactive mode
philjs create my-app

# With project name
philjs create awesome-project
```

#### What Gets Created

```
my-app/
├── src/
│   ├── components/      # Reusable components
│   ├── routes/          # Application routes
│   ├── main.tsx         # Entry point
│   └── App.tsx          # Root component
├── public/              # Static assets
├── tests/               # Test files (if testing enabled)
├── index.html          # HTML template
├── package.json
├── tsconfig.json        # TypeScript config
├── vite.config.ts       # Vite configuration
├── .gitignore
└── README.md
```

---

### Add Features

Add features to an existing PhilJS project.

```bash
philjs add [feature]
```

#### Available Features

| Feature | Description |
|---------|-------------|
| `ssr` | Server-Side Rendering with islands architecture |
| `islands` | Islands architecture for selective hydration |
| `graphql` | GraphQL client and server setup |
| `tailwind` | Tailwind CSS framework |
| `testing` | Vitest testing framework |
| `linting` | ESLint and Prettier |
| `pwa` | Progressive Web App support |
| `i18n` | Internationalization (i18n) |
| `analytics` | Analytics and performance monitoring |
| `auth` | Authentication setup |

#### Examples

```bash
# Interactive feature selection
philjs add

# Add specific feature
philjs add ssr
philjs add tailwind
philjs add testing
```

#### What Gets Added

**SSR:**
- `src/entry-server.ts` - Server entry point
- `src/entry-client.ts` - Client entry point
- `server.ts` - Express server
- Updates `package.json` with SSR dependencies

**Islands:**
- `src/islands/` directory
- Example island component
- `philjs-islands` package

**GraphQL:**
- `src/graphql/schema.ts` - GraphQL schema
- `src/graphql/client.ts` - GraphQL client
- `philjs-graphql` package

**Tailwind:**
- `tailwind.config.js`
- `postcss.config.js`
- `src/index.css` with Tailwind directives

**Testing:**
- `vitest.config.ts`
- `tests/` directory
- Example test file

**Linting:**
- `.eslintrc.json`
- `.prettierrc.json`
- ESLint and Prettier packages

**PWA:**
- `public/manifest.json`
- Vite PWA plugin configuration
- Service worker setup

**i18n:**
- `src/i18n/config.ts`
- Translation message examples

**Analytics:**
- `src/lib/analytics.ts`
- Helper functions for tracking

**Auth:**
- `src/lib/auth.ts`
- Authentication store and utilities

---

### Migrate

Migrate from React, Vue, or Svelte to PhilJS.

```bash
philjs migrate [framework]
```

#### Supported Frameworks

- `react` - Migrate from React
- `vue` - Migrate from Vue
- `svelte` - Migrate from Svelte

#### What It Does

1. Analyzes your current project structure
2. Detects components, hooks, routes, and state management
3. Identifies CSS frameworks
4. Generates `MIGRATION_REPORT.md` with:
   - Framework comparison table
   - Component conversion examples
   - State management migration guide
   - Routing migration guide
   - Step-by-step migration plan

#### Example

```bash
philjs migrate react
```

#### Migration Report

The generated report includes:

- **Project Analysis**: Component count, hooks, routes
- **Migration Strategy**: Framework-specific conversion patterns
- **Code Examples**: Before/after comparisons
- **State Management**: Redux/Zustand/Pinia → PhilJS signals
- **Routing**: React Router/Vue Router → PhilJS Router
- **Next Steps**: Detailed migration checklist

---

### Development

Start the development server with Hot Module Replacement (HMR).

```bash
philjs dev [options]
```

#### Options

- `-p, --port <port>` - Port number (default: 3000)
- `--host <host>` - Host to bind to (default: localhost)
- `--open` - Open browser automatically

#### Examples

```bash
# Start on default port
philjs dev

# Custom port
philjs dev -p 8080

# Bind to all interfaces and open browser
philjs dev --host 0.0.0.0 --open
```

---

### Build

Build for production.

```bash
philjs build [options]
```

#### Options

- `--ssg` - Generate static site (SSG)
- `--analyze` - Analyze bundle size
- `--outDir <dir>` - Output directory (default: dist)

#### Examples

```bash
# Standard build
philjs build

# Static site generation
philjs build --ssg

# Build with bundle analysis
philjs build --analyze

# Custom output directory
philjs build --outDir public
```

---

### Generate

Generate components, routes, pages, hooks, and stores.

```bash
philjs generate <type> <name> [options]
# or
philjs g <type> <name> [options]
```

#### Types

| Command | Alias | Description |
|---------|-------|-------------|
| `component` | `c` | Generate a component |
| `route` | `r` | Generate a route with loader |
| `page` | `p` | Generate a page with SEO |
| `hook` | `h` | Generate a custom hook |
| `store` | `s` | Generate a state store |

#### Options

- `-d, --directory <dir>` - Target directory
- `--no-test` - Skip test file generation
- `--js` - Use JavaScript instead of TypeScript
- `--with-styles` - Generate CSS module (components only)

#### Examples

```bash
# Generate component
philjs g component Button
philjs g c Button --with-styles

# Generate route
philjs g route products
philjs g r user-profile --directory src/routes/users

# Generate page
philjs g page About
philjs g p Contact --js

# Generate hook
philjs g hook useWindowSize
philjs g h useFetch --no-test

# Generate store
philjs g store cart
philjs g s user --directory src/stores/auth
```

#### What Gets Generated

**Component:**
```
src/components/Button/
├── Button.tsx          # Component file
├── Button.test.tsx     # Test file
├── Button.module.css   # CSS module (if --with-styles)
└── index.ts            # Export file
```

**Route:**
```
src/routes/products/
├── index.tsx          # Route component
├── loader.ts          # Data loader
└── index.test.tsx     # Test file
```

**Page:**
```
src/pages/
├── about.tsx          # Page component with SEO
└── about.test.tsx     # Test file
```

**Hook:**
```
src/hooks/
├── useWindowSize.ts   # Hook implementation
└── useWindowSize.test.ts  # Test file
```

**Store:**
```
src/stores/
├── cart.ts            # Store with signals
└── cart.test.ts       # Test file
```

---

## Project Templates

### Basic Template

Simple starter with:
- Signals for state management
- Router for navigation
- Counter example component
- Home route

**Use when:** Building a simple interactive app

### SSR Template

Server-side rendering with:
- Express server
- Islands architecture
- Client and server entry points
- SSR-compatible components

**Use when:** Need SEO, fast initial load, or server-side data fetching

### SPA Template

Single page application with:
- Client-side routing
- Multiple routes
- Layout component
- Navigation

**Use when:** Building a dynamic app without SSR requirements

### Fullstack Template

Complete full-stack setup with:
- SSR with islands
- API routes
- Database schema
- Environment variables
- GraphQL support

**Use when:** Building a complete web application

### Library Template

Component library starter with:
- Rollup bundler
- TypeScript declarations
- Example usage
- NPM-ready configuration

**Use when:** Creating reusable PhilJS components

---

## Features

### TypeScript Support

All templates support TypeScript by default with:
- Strict mode enabled
- JSX configuration for PhilJS
- Path aliases
- Type checking

### CSS Solutions

#### Tailwind CSS
```bash
philjs add tailwind
```
- Utility-first CSS framework
- JIT compilation
- PostCSS integration

#### CSS Modules
- Scoped styles per component
- Type-safe class names (with TypeScript)
- No configuration needed

#### Styled Components
```bash
# Added during project creation
```
- CSS-in-JS solution
- Dynamic styling
- Theme support

### Testing

#### Vitest (Recommended)
- Fast, Vite-native testing
- Compatible with Jest API
- ESM support
- UI mode available

#### Jest
- Traditional testing framework
- Large ecosystem
- Extensive documentation

### Linting & Formatting

- **ESLint**: Code quality and error detection
- **Prettier**: Code formatting
- **TypeScript ESLint**: TypeScript-specific rules

### Progressive Web App (PWA)

```bash
philjs add pwa
```

Features:
- Service worker
- Web manifest
- Offline support
- Install prompts

### Internationalization (i18n)

```bash
philjs add i18n
```

Features:
- Multiple language support
- Message formatting
- Locale detection
- Translation helpers

---

## Migration Guides

### From React

**Key Differences:**

| React | PhilJS |
|-------|--------|
| `useState` | `signal()` |
| `useEffect` | `effect()` |
| `useMemo` | `computed()` |
| `useCallback` | Not needed |
| `useRef` | `signal()` |

**Example Migration:**

```tsx
// React
import { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('Count:', count);
  }, [count]);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}

// PhilJS
import { signal, effect } from 'philjs-core';

function Counter() {
  const count = signal(0);

  effect(() => {
    console.log('Count:', count());
  });

  return (
    <button onClick={() => count.set(c => c + 1)}>
      {count()}
    </button>
  );
}
```

### From Vue

**Key Differences:**

| Vue 3 | PhilJS |
|-------|--------|
| `ref()` | `signal()` |
| `computed()` | `computed()` |
| `watch()` | `effect()` |
| `reactive()` | Object with signals |

### From Svelte

**Key Differences:**

| Svelte | PhilJS |
|--------|--------|
| `let count = 0` | `signal(0)` |
| `$: doubled = count * 2` | `computed(() => count() * 2)` |
| `$: { ... }` | `effect(() => { ... })` |

---

## Advanced Usage

### Custom Templates

You can create your own project templates by placing them in:
```
packages/philjs-cli/templates/<template-name>/
```

### Configuration Files

#### vite.config.ts
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'philjs-core',
  },
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
});
```

#### tsconfig.json
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "philjs-core",
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true
  }
}
```

---

## Troubleshooting

### Common Issues

**Problem:** Command not found
```bash
# Solution: Install globally or use npx
npm install -g philjs-cli
# or
npx philjs <command>
```

**Problem:** Port already in use
```bash
# Solution: Use a different port
philjs dev -p 8080
```

**Problem:** Build fails with memory error
```bash
# Solution: Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 philjs build
```

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT

---

## Learn More

- [PhilJS Documentation](https://philjs.dev)
- [API Reference](https://philjs.dev/docs/api)
- [Examples](https://philjs.dev/examples)
- [GitHub](https://github.com/yourusername/philjs)
