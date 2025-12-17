# Installation

PhilJS can be installed in several ways depending on your needs. This guide covers all the options.

## Quick Start with Create PhilJS

The fastest way to start a new PhilJS project:

```bash
# Using npm
npm create philjs@latest my-app

# Using pnpm (recommended)
pnpm create philjs@latest my-app

# Using yarn
yarn create philjs@latest my-app

# Using bun
bun create philjs@latest my-app
```

Then follow the prompts to configure your project:

```
? Project name: my-app
? Select a template:
  > Minimal (signals + JSX only)
    Full (with routing, data, SSR)
    E-commerce Starter
    Blog/Documentation
? TypeScript? Yes
? Add ESLint? Yes
```

## Manual Installation

### Step 1: Install Core Package

```bash
npm install philjs-core
```

### Step 2: Install Additional Packages (Optional)

```bash
# Router for client-side navigation
npm install philjs-router

# Islands architecture for partial hydration
npm install philjs-islands

# Compiler for build-time optimizations
npm install philjs-compiler --save-dev
```

### Step 3: Configure Vite

Create or update your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';

export default defineConfig({
  plugins: [
    philjs({
      // Enable auto-optimizations
      autoMemo: true,
      autoBatch: true,

      // Development options
      verbose: process.env.NODE_ENV === 'development',
    })
  ],
  esbuild: {
    jsx: 'preserve',  // Let PhilJS handle JSX
    jsxFactory: 'jsx',
    jsxFragment: 'Fragment',
  },
});
```

### Step 4: Configure TypeScript

Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "philjs-core",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "isolatedModules": true
  },
  "include": ["src"]
}
```

## Package Overview

| Package | Purpose | Size |
|---------|---------|------|
| `philjs-core` | Signals, JSX, rendering | ~15KB |
| `philjs-core/core` | Minimal signals + JSX | ~3KB |
| `philjs-router` | File-based routing | ~8KB |
| `philjs-islands` | Partial hydration | ~5KB |
| `philjs-compiler` | Build optimizations | Dev only |

## Minimal Bundle

For the smallest possible bundle, import only what you need:

```typescript
// ~3KB - Core reactivity + JSX
import { signal, memo, effect } from 'philjs-core/core';

// ~2KB - Just signals
import { signal } from 'philjs-core/signals';

// Individual feature imports
import { useForm } from 'philjs-core/forms';
import { PPRBoundary } from 'philjs-core/ppr';
import { Activity } from 'philjs-core/activity';
import { ABTestEngine } from 'philjs-core/ab-testing';
import { enhanceWithAria } from 'philjs-core/accessibility';
```

## CDN Usage

For quick prototypes, you can use PhilJS from a CDN:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="importmap">
    {
      "imports": {
        "philjs-core": "https://esm.sh/philjs-core@latest"
      }
    }
  </script>
</head>
<body>
  <div id="app"></div>
  <script type="module">
    import { signal, render, jsx } from 'philjs-core';

    function App() {
      const count = signal(0);
      return jsx('button', {
        onClick: () => count.set(c => c + 1),
        children: ['Count: ', count]
      });
    }

    render(jsx(App, {}), document.getElementById('app'));
  </script>
</body>
</html>
```

## Project Structure

A typical PhilJS project looks like:

```
my-app/
├── src/
│   ├── components/      # Reusable components
│   │   ├── Button.tsx
│   │   └── Header.tsx
│   ├── pages/           # Route pages
│   │   ├── Home.tsx
│   │   └── About.tsx
│   ├── lib/             # Utilities and helpers
│   ├── styles/          # CSS files
│   ├── App.tsx          # Root component
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Environment Requirements

- **Node.js**: 18.0 or higher
- **npm/pnpm/yarn**: Latest version
- **Browser Support**: All modern browsers (Chrome, Firefox, Safari, Edge)

## Editor Setup

### VS Code

Install the recommended extensions:

1. **TypeScript** - Built-in support
2. **ESLint** - Code linting
3. **Prettier** - Code formatting

Add to `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

## Next Steps

Now that you have PhilJS installed, let's build something:

- [Quick Start Guide](/docs/getting-started/quick-start) - Build your first app
- [Your First Component](/docs/getting-started/your-first-component) - Learn component basics
- [Thinking in PhilJS](/docs/getting-started/thinking-in-philjs) - Understand the mental model
