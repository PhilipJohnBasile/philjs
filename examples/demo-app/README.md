# PhilJS Demo App

A comprehensive demonstration of PhilJS framework features including the new auto-compiler, linkedSignal (writable computed), auto-accessibility, and built-in A/B testing.

## Features Showcased

- **linkedSignal** - Writable computed values (matches Angular 19's linkedSignal API)
- **Auto-Accessibility** - Industry-first automatic WCAG compliance
- **Built-in A/B Testing** - Zero dependencies, full experimentation framework
- **Signals & Reactivity** - Fine-grained reactivity without virtual DOM
- **Data Fetching** - Unified caching with SWR-style revalidation
- **Spring Animations** - Physics-based animations with FLIP support

## Prerequisites

- Node.js 18+ or higher
- pnpm (workspace package manager)

## Setup

From the repository root:

```bash
# Install all dependencies
pnpm install

# Build core packages
pnpm build
```

## Development

```bash
# From the demo-app directory
cd examples/demo-app
pnpm dev
```

This will start the development server at `http://localhost:3000`.

## Building for Production

```bash
pnpm build
```

The production build will be output to the `dist/` directory.

## Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
demo-app/
├── src/
│   ├── components/
│   │   ├── Counter.tsx              # Signals demo
│   │   ├── DataFetcher.tsx          # Data fetching demo
│   │   ├── AnimationDemo.tsx        # Spring animations
│   │   ├── LinkedSignalDemo.tsx     # Writable computed values
│   │   ├── AccessibilityDemo.tsx    # Auto-accessibility
│   │   └── ABTestingDemo.tsx        # A/B testing framework
│   ├── App.tsx                      # Main application
│   └── main.tsx                     # Entry point
├── package.json
├── vite.config.ts                   # Vite config with PhilJS compiler plugin
└── tsconfig.json
```

## Auto-Compiler Features

The demo app uses the PhilJS auto-compiler with the following optimizations enabled:

- **autoMemo**: Automatically wraps expensive computations in `memo()`
- **autoBatch**: Batches multiple signal updates
- **deadCodeElimination**: Removes unused reactive code
- **optimizeEffects**: Optimizes effect dependencies
- **optimizeComponents**: Component-level optimizations

You can see these in action in `vite.config.ts`.

## Dependencies

This example uses:

- `@philjs/core` - Core reactivity system
- `@philjs/router` - Client-side routing
- `@philjs/ssr` - Server-side rendering utilities
- `@philjs/islands` - Islands architecture support
- `@philjs/compiler` - Auto-compiler with Vite plugin

## Learn More

- [PhilJS Documentation](../docs-site)
- [Kitchen Sink Examples](../kitchen-sink)
- [Todo App Example](../todo-app)
