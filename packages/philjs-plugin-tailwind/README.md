# philjs-plugin-tailwind

Automatic Tailwind CSS setup and optimization for PhilJS applications.

## Features

- **Zero Config** - Automatic Tailwind CSS setup with sensible defaults
- **JIT Mode** - Just-in-time compilation for faster builds
- **Dark Mode** - Built-in dark mode support
- **Optimization** - Automatic purging and minification in production
- **Custom Utilities** - Pre-configured utility classes
- **Type Safety** - Full TypeScript support

## Installation

```bash
# Using PhilJS CLI (recommended)
philjs plugin add philjs-plugin-tailwind

# Or with package manager
npm install philjs-plugin-tailwind tailwindcss autoprefixer postcss
```

## Usage

### Basic Setup

```typescript
// philjs.config.ts
import { defineConfig } from 'philjs-core';
import tailwind from 'philjs-plugin-tailwind';

export default defineConfig({
  plugins: [
    tailwind(),
  ],
});
```

### Custom Configuration

```typescript
tailwind({
  jit: true,
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    // Tailwind plugins
  ],
})
```

## Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `jit` | `boolean` | Enable JIT mode | `true` |
| `darkMode` | `'media' \| 'class' \| false` | Dark mode strategy | `'class'` |
| `content` | `string[]` | Content paths to scan | `['./src/**/*.{js,jsx,ts,tsx}', './index.html']` |
| `theme` | `object` | Theme customization | `{}` |
| `plugins` | `array` | Tailwind plugins | `[]` |
| `optimization` | `object` | Optimization settings | See below |

### Optimization Options

```typescript
optimization: {
  purge: true,        // Purge unused styles in production
  minify: true,       // Minify CSS output
  removeComments: true // Remove comments
}
```

## Generated Files

The plugin automatically creates:

- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration
- `src/styles/tailwind.css` - Base styles with custom utilities

## Custom Utilities

Pre-configured utility classes:

```css
/* Buttons */
.btn - Base button styles
.btn-primary - Primary button
.btn-secondary - Secondary button

/* Components */
.card - Card component
.input - Input field

/* Utilities */
.text-balance - Balanced text wrap
```

## Usage in Components

```tsx
import './styles/tailwind.css';

export function App() {
  return (
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold text-primary">
        Hello PhilJS + Tailwind!
      </h1>

      <button class="btn btn-primary mt-4">
        Click me
      </button>

      <div class="card mt-6">
        <p>This is a card component</p>
      </div>
    </div>
  );
}
```

## Dark Mode

```tsx
// Toggle dark mode
document.documentElement.classList.toggle('dark');

// Component with dark mode styles
export function Card() {
  return (
    <div class="bg-white dark:bg-gray-800 text-black dark:text-white">
      Content adapts to dark mode
    </div>
  );
}
```

## Utilities

### Class Merging

```typescript
import { tailwindUtils } from 'philjs-plugin-tailwind';

const classes = tailwindUtils.mergeClasses(
  'px-4 py-2',
  'px-6', // Overwrites px-4
  'bg-blue-500'
);
// Result: 'px-6 py-2 bg-blue-500'
```

### CSS Variables to Theme

```typescript
const theme = tailwindUtils.cssVarsToTheme({
  '--primary-color': '#3b82f6',
  '--secondary-color': '#8b5cf6',
});
// Converts to Tailwind theme format
```

## TypeScript

Full TypeScript support with type definitions:

```typescript
import type { TailwindPluginConfig } from 'philjs-plugin-tailwind';

const config: TailwindPluginConfig = {
  darkMode: 'class',
  theme: {
    extend: {
      // Type-safe theme configuration
    },
  },
};
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./utils, ./content-detector, ./theme-generator
- Source files: packages/philjs-plugin-tailwind/src/index.ts, packages/philjs-plugin-tailwind/src/utils.ts, packages/philjs-plugin-tailwind/src/content-detector.ts, packages/philjs-plugin-tailwind/src/theme-generator.ts

### Public API
- Direct exports: ClassName, ColorPalette, ContentDetector, ContentDetectorOptions, DetectedContent, TailwindPluginConfig, ThemeConfig, arbitrary, clsx, cn, container, createTailwindPlugin, createVariants, cssVarToClass, cssVarsToTheme, dark, detectContentPaths, expandContentPatterns, extractClasses, generateBorderRadiusScale, generateBrandTheme, generateBreakpoints, generateColorPalette, generateCompleteTheme, generateFontFamilies, generateShadowScale, generateSpacingScale, generateTypographyScale, isValidClass, mergeThemes, optimizeContentPatterns, presetThemes, responsive, sortClasses, tailwindUtils, validateContentPatterns, withStates
- Re-exported names: ColorPalette, ThemeConfig, cssVarsToTheme, generateBorderRadiusScale, generateBrandTheme, generateBreakpoints, generateColorPalette, generateCompleteTheme, generateFontFamilies, generateShadowScale, generateSpacingScale, generateTypographyScale, presetThemes
- Re-exported modules: ./content-detector.js, ./optimizer.js, ./theme-generator.js, ./utils.js
<!-- API_SNAPSHOT_END -->

## License

MIT
