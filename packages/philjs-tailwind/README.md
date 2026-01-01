# philjs-tailwind

Tailwind CSS integration for PhilJS with IntelliSense and optimizations.

## Features

- **Zero Configuration** - Works out of the box with PhilJS
- **IntelliSense Support** - Full autocomplete in VS Code
- **JIT Mode** - Just-in-Time compilation for faster builds
- **Custom Preset** - PhilJS-optimized Tailwind preset
- **SSR Compatible** - Works with server-side rendering
- **Vite Plugin** - Optimized for Vite builds
- **Dark Mode** - Class-based dark mode utilities

## Installation

```bash
pnpm add -D philjs-tailwind tailwindcss autoprefixer postcss
```

## Quick Start

### 1. Create Tailwind Config

Create `tailwind.config.js`:

```javascript
import philJSPreset from 'philjs-tailwind/preset';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [philJSPreset],
  darkMode: 'class'
};
```

### 2. Add Vite Plugin

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import philjs from 'philjs-cli/vite';
import tailwind from 'philjs-tailwind/vite';

export default defineConfig({
  plugins: [
    philjs(),
    tailwind()
  ]
});
```

### 3. Import Styles

In your `src/entry-client.ts`:

```typescript
import 'tailwindcss/tailwind.css';
```

### 4. Use Tailwind Classes

```typescript
export default function Button({ children }) {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
      {children}
    </button>
  );
}
```

## PhilJS Preset

The PhilJS preset includes:

- **Custom Colors** - PhilJS brand colors
- **Extended Spacing** - Additional spacing utilities
- **Typography** - Optimized font scales
- **Animations** - Smooth transitions and animations
- **Container Queries** - Container query utilities

## Dark Mode

```typescript
import { signal } from 'philjs-core';

export default function App() {
  const isDark = signal(false);

  return (
    <div className={isDark() ? 'dark' : ''}>
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <button onClick={() => isDark.set(!isDark())}>
          Toggle Dark Mode
        </button>
      </div>
    </div>
  );
}
```

## Custom Plugin

Create custom Tailwind utilities:

```javascript
import plugin from 'tailwindcss/plugin';

export default {
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)'
        }
      });
    })
  ]
};
```

## Documentation

For more information, see the [PhilJS documentation](../../docs).

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./preset, ./plugin, ./vite
- Source files: packages/philjs-tailwind/src/index.ts, packages/philjs-tailwind/src/preset.ts, packages/philjs-tailwind/src/plugin.ts

### Public API
- Direct exports: PhilJSPluginOptions, PhilJSPresetOptions, createPhilJSPlugin, createPhilJSPreset, createTailwindConfig, philjsPreset, philjsTailwindPlugin
- Re-exported names: ClassValue, PhilJSPluginOptions, PhilJSPresetOptions, PhilJSTailwindViteOptions, VariantProps, clsx, cn, createPhilJSPlugin, createPhilJSPreset, cva, philjsPreset, philjsTailwindPlugin, philjsTailwindVite, tw, twJoin, twMerge
- Re-exported modules: ./plugin.js, ./preset.js, ./types.js, ./utils.js, ./vite-plugin.js
<!-- API_SNAPSHOT_END -->

## License

MIT
