# @philjs/plugin-tailwind

Automatic Tailwind CSS setup and optimization for PhilJS projects. This plugin provides seamless integration with Tailwind CSS, including automatic configuration generation, content path detection, theme generation, and production CSS optimization.

## Installation

```bash
npm install @philjs/plugin-tailwind
# or
pnpm add @philjs/plugin-tailwind
```

## Features

- **Automatic Setup**: Generates `tailwind.config.js`, `postcss.config.js`, and base CSS files
- **JIT Mode**: Enabled by default for optimal development experience
- **Content Detection**: Automatically detects content paths based on your project structure
- **Theme Generation**: Generate complete Tailwind themes from brand colors
- **CSS Optimization**: Production-ready CSS minification and purging
- **Vite Integration**: First-class Vite plugin support
- **Dark Mode**: Built-in support for class-based or media-query dark mode
- **Utility Functions**: Helper functions for class merging, variants, and responsive utilities

## Quick Start

### Basic Usage

```typescript
import { createTailwindPlugin } from '@philjs/plugin-tailwind';

// Create plugin with default options
const tailwindPlugin = createTailwindPlugin();

// Or with custom configuration
const tailwindPlugin = createTailwindPlugin({
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
  jit: true,
  optimization: {
    purge: true,
    minify: true,
    removeComments: true,
  },
});
```

### Using with PhilJS Plugin System

```typescript
import { createApp } from '@philjs/core';
import { createTailwindPlugin } from '@philjs/plugin-tailwind';

const app = createApp({
  plugins: [
    createTailwindPlugin({
      darkMode: 'class',
      theme: {
        colors: {
          brand: '#3b82f6',
        },
      },
    }),
  ],
});
```

## Configuration

### TailwindPluginConfig Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `configPath` | `string` | `undefined` | Path to existing Tailwind config file |
| `jit` | `boolean` | `true` | Enable JIT (Just-In-Time) mode |
| `content` | `string[]` | `['./src/**/*.{js,jsx,ts,tsx}', './index.html']` | Content paths for Tailwind to scan |
| `theme` | `Record<string, any>` | `{}` | Tailwind theme customization |
| `plugins` | `any[]` | `[]` | Tailwind plugins to include |
| `darkMode` | `'media' \| 'class' \| false` | `'class'` | Dark mode strategy |
| `optimization` | `object` | See below | Production optimization settings |

### Optimization Options

```typescript
interface OptimizationOptions {
  purge?: boolean;        // Purge unused styles in production (default: true)
  minify?: boolean;       // Minify CSS (default: true)
  removeComments?: boolean; // Remove comments (default: true)
}
```

## Theme Generation

The plugin provides powerful theme generation utilities to create consistent design systems from brand colors.

### Generating Color Palettes

```typescript
import { generateColorPalette } from '@philjs/plugin-tailwind';

// Generate a complete color palette from a single base color
const primary = generateColorPalette('#3b82f6');
// Returns: { 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950 }

console.log(primary);
// {
//   50: '#f0f7ff',
//   100: '#e0efff',
//   200: '#bddeff',
//   ...
//   500: '#3b82f6',  // Your base color
//   ...
//   950: '#112747'
// }
```

### Brand Theme Generation

```typescript
import { generateBrandTheme } from '@philjs/plugin-tailwind';

const theme = generateBrandTheme({
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  neutral: '#6b7280',
});

// Use in tailwind.config.js
export default {
  theme: {
    extend: {
      colors: theme.colors,
    },
  },
};
```

### Complete Theme Generation

```typescript
import { generateCompleteTheme } from '@philjs/plugin-tailwind';

const theme = generateCompleteTheme({
  brandColors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
  },
  typography: {
    baseSize: 16,
    ratio: 1.25,  // Type scale ratio
  },
  spacing: {
    baseUnit: 4,  // Base spacing unit in pixels
  },
  fonts: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
});
```

### Preset Themes

The plugin includes ready-to-use preset themes:

```typescript
import { presetThemes } from '@philjs/plugin-tailwind';

// Modern theme - blue/purple palette
const modernTheme = presetThemes.modern;

// Minimal theme - black/gray palette
const minimalTheme = presetThemes.minimal;

// Vibrant theme - pink/amber/emerald palette
const vibrantTheme = presetThemes.vibrant;
```

### Typography Scale Generator

```typescript
import { generateTypographyScale } from '@philjs/plugin-tailwind';

// Generate typography scale with custom base size and ratio
const fontSize = generateTypographyScale(16, 1.25);
// Returns: { xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl, 8xl, 9xl }
```

### Additional Scale Generators

```typescript
import {
  generateSpacingScale,
  generateBorderRadiusScale,
  generateShadowScale,
  generateBreakpoints,
  generateFontFamilies,
} from '@philjs/plugin-tailwind';

// Spacing scale
const spacing = generateSpacingScale(4); // 4px base unit

// Border radius scale
const borderRadius = generateBorderRadiusScale();

// Box shadow scale
const boxShadow = generateShadowScale();

// Breakpoints (mobile-first or desktop-first)
const screens = generateBreakpoints('mobile-first');

// Font families
const fontFamily = generateFontFamilies({
  sans: ['Inter', 'system-ui'],
  mono: ['Fira Code', 'monospace'],
});
```

## Content Detection

The plugin can automatically detect content paths based on your project structure.

### Automatic Detection

```typescript
import { detectContentPaths, ContentDetector } from '@philjs/plugin-tailwind';

// Quick detection
const patterns = await detectContentPaths('./');
// Returns: ['./src/**/*.{js,jsx,ts,tsx,html}', './index.html', ...]

// Advanced detection with options
const detector = new ContentDetector({
  rootDir: './',
  include: ['./custom/**/*.jsx'],
  exclude: ['node_modules', 'dist', '.git'],
  verbose: true,
});

const result = await detector.detect();
// Returns: {
//   patterns: string[],
//   directories: string[],
//   framework: 'react' | 'vue' | 'svelte' | 'solid' | 'preact' | undefined
// }
```

### Framework Detection

The content detector automatically identifies your framework from `package.json` and adjusts file extensions accordingly:

- **React/Preact**: `.js`, `.jsx`, `.ts`, `.tsx`
- **Vue**: `.js`, `.ts`, `.vue`
- **Svelte**: `.js`, `.ts`, `.svelte`
- **Solid**: `.js`, `.jsx`, `.ts`, `.tsx`

### Content Pattern Utilities

```typescript
import {
  validateContentPatterns,
  expandContentPatterns,
  optimizeContentPatterns,
} from '@philjs/plugin-tailwind';

// Validate patterns
const { valid, invalid } = validateContentPatterns([
  './src/**/*.tsx',
  './invalid<path>',
]);

// Expand directory patterns
const expanded = expandContentPatterns(['./src', './components']);
// Adds '/**/*.{js,jsx,ts,tsx,html}' to directories

// Optimize patterns (remove redundant ones)
const optimized = optimizeContentPatterns([
  './src/**/*.tsx',
  './src/components/**/*.tsx',  // Removed as covered by above
]);
```

## Vite Integration

The plugin provides a Vite plugin for seamless integration.

### Basic Vite Setup

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { createTailwindPlugin } from '@philjs/plugin-tailwind';

const tailwindPlugin = createTailwindPlugin({
  darkMode: 'class',
});

export default defineConfig({
  plugins: [
    tailwindPlugin.vitePlugin({}),
  ],
});
```

### With Custom Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { createTailwindPlugin } from '@philjs/plugin-tailwind';

const tailwindPlugin = createTailwindPlugin({
  configPath: './tailwind.config.js',
  optimization: {
    purge: true,
    minify: true,
  },
});

export default defineConfig({
  plugins: [
    tailwindPlugin.vitePlugin({
      // Additional plugin-specific options
    }),
  ],
});
```

The Vite plugin automatically:
- Configures PostCSS with Tailwind and Autoprefixer
- Applies production optimizations based on build mode
- Integrates with Tailwind's JIT compiler

## CSS Utility Functions

### Class Merging with Conflict Resolution

```typescript
import { cn, clsx } from '@philjs/plugin-tailwind';

// Merge classes with automatic conflict resolution
const className = cn(
  'px-4 py-2',
  'px-6',        // Overrides px-4
  isActive && 'bg-blue-500',
  'rounded-lg'
);
// Result: 'py-2 px-6 bg-blue-500 rounded-lg'

// clsx is an alias for cn
const className2 = clsx('btn', isPrimary && 'btn-primary');
```

The `cn` function intelligently handles Tailwind utility conflicts:
- Padding: `p-`, `px-`, `py-`, `pt-`, `pr-`, `pb-`, `pl-`
- Margin: `m-`, `mx-`, `my-`, `mt-`, `mr-`, `mb-`, `ml-`
- Width/Height: `w-`, `h-`, `min-w-`, `max-w-`, `min-h-`, `max-h-`
- Typography: `text-`, `font-`
- Background/Border: `bg-`, `border-`, `rounded-`
- Positioning: `top-`, `right-`, `bottom-`, `left-`, `inset-`, `z-`
- And more...

### Variant Generators

```typescript
import { createVariants } from '@philjs/plugin-tailwind';

// Create a variant-based class generator
const buttonVariants = createVariants({
  size: {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  },
  variant: {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    outline: 'border border-gray-300 hover:bg-gray-100',
  },
});

// Use in components
const className = buttonVariants({ size: 'md', variant: 'primary' });
// Result: 'px-4 py-2 text-base bg-blue-600 text-white hover:bg-blue-700'
```

### Responsive Utilities

```typescript
import { responsive } from '@philjs/plugin-tailwind';

// Generate responsive class strings
const gridCols = responsive('grid-cols-1', {
  sm: 'grid-cols-2',
  md: 'grid-cols-3',
  lg: 'grid-cols-4',
  xl: 'grid-cols-6',
});
// Result: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
```

### State Variants

```typescript
import { withStates } from '@philjs/plugin-tailwind';

// Generate state variant classes
const buttonClasses = withStates('bg-blue-500', {
  hover: true,           // Uses same class: 'hover:bg-blue-500'
  focus: 'ring-2',       // Custom class: 'focus:ring-2'
  active: 'bg-blue-700', // Custom class: 'active:bg-blue-700'
  disabled: 'opacity-50',
});
// Result: 'bg-blue-500 hover:bg-blue-500 focus:ring-2 active:bg-blue-700 disabled:opacity-50'
```

### Dark Mode Helper

```typescript
import { dark } from '@philjs/plugin-tailwind';

// Generate light/dark mode class pairs
const bgColor = dark('bg-white', 'bg-gray-900');
// Result: 'bg-white dark:bg-gray-900'

const textColor = dark('text-gray-900', 'text-gray-100');
// Result: 'text-gray-900 dark:text-gray-100'
```

### Container Queries

```typescript
import { container } from '@philjs/plugin-tailwind';

// Generate container query classes
const cardLayout = container('flex-col', {
  '@sm': 'flex-row',
  '@md': 'gap-4',
  '@lg': 'gap-8',
});
// Result: 'flex-col @sm:flex-row @md:gap-4 @lg:gap-8'
```

### Additional Utilities

```typescript
import {
  extractClasses,
  isValidClass,
  sortClasses,
  arbitrary,
  mergeThemes,
} from '@philjs/plugin-tailwind';

// Extract Tailwind classes from HTML/JSX strings
const classes = extractClasses('<div class="px-4 py-2">Hello</div>');
// Returns: ['px-4', 'py-2']

// Validate Tailwind class syntax
isValidClass('bg-blue-500');    // true
isValidClass('invalid class!'); // false

// Sort classes by Tailwind's recommended order
const sorted = sortClasses(['bg-blue-500', 'flex', 'p-4', 'text-white']);
// Returns: ['flex', 'p-4', 'text-white', 'bg-blue-500']

// Generate arbitrary value classes
const customWidth = arbitrary('width', '123px');
// Returns: '[width:123px]'

// Merge multiple theme configs
const merged = mergeThemes(theme1, theme2, theme3);
```

## CSS Optimization

### CSS Optimizer

```typescript
import { CSSOptimizer, optimizeCSS } from '@philjs/plugin-tailwind';

// Quick optimization
const result = optimizeCSS(cssContent, {
  minify: true,
  removeComments: true,
  deduplicateRules: true,
  mergeMediaQueries: true,
  sortProperties: false,
  removeEmptyRules: true,
});

console.log(result);
// {
//   css: '...',           // Optimized CSS
//   originalSize: 15000,  // Original size in bytes
//   optimizedSize: 8500,  // Optimized size in bytes
//   reduction: 43,        // Reduction percentage
// }

// Advanced usage with class instance
const optimizer = new CSSOptimizer({
  minify: true,
  mergeMediaQueries: true,
  sourcemap: true,
});

const optimized = optimizer.optimize(cssContent);
```

### Critical CSS Extraction

```typescript
import { extractCriticalCSS, CriticalCSSExtractor } from '@philjs/plugin-tailwind';

// Extract critical CSS for above-the-fold content
const { critical, deferred } = extractCriticalCSS(cssContent, htmlContent);

// Inline critical CSS
const html = `
<head>
  <style>${critical}</style>
  <link rel="preload" href="styles.css" as="style" onload="this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="styles.css"></noscript>
</head>
`;

// Advanced usage with custom viewport
const extractor = new CriticalCSSExtractor(1920, 1080);
const result = extractor.extractCritical(cssContent, htmlContent);
```

### Unused CSS Purging

```typescript
import { purgeUnusedCSS } from '@philjs/plugin-tailwind';

// Purge unused CSS based on content files
const contentStrings = [
  '<div class="flex items-center">...</div>',
  'className="bg-blue-500 text-white"',
];

const purged = purgeUnusedCSS(cssContent, contentStrings, {
  safelist: ['keep-this-class', 'and-this-one'],
  blocklist: ['never-include-this'],
});
```

### CSS Statistics Analysis

```typescript
import { analyzeCSSStats } from '@philjs/plugin-tailwind';

const stats = analyzeCSSStats(cssContent);

console.log(stats);
// {
//   size: 15000,                    // File size in bytes
//   ruleCount: 250,                 // Number of CSS rules
//   selectorCount: 380,             // Number of selectors
//   declarationCount: 890,          // Number of declarations
//   mediaQueryCount: 45,            // Number of media queries
//   uniqueProperties: ['color', 'background', ...],
//   uniqueColors: ['#3b82f6', 'rgba(0,0,0,0.5)', ...],
//   specificity: {
//     max: 120,                     // Highest specificity
//     avg: 15,                      // Average specificity
//   },
// }
```

## Generated Files

When the plugin runs setup, it creates the following files if they don't exist:

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### src/styles/tailwind.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom utilities */
@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors;
  }

  .btn-primary {
    @apply bg-blue-600 text-white hover:bg-blue-700;
  }

  .btn-secondary {
    @apply bg-gray-200 text-gray-800 hover:bg-gray-300;
  }

  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }

  .input {
    @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

## Example: Complete PhilJS Application

```typescript
// tailwind.config.ts
import { generateCompleteTheme, presetThemes } from '@philjs/plugin-tailwind';

const customTheme = generateCompleteTheme({
  brandColors: {
    primary: '#0ea5e9',
    secondary: '#a855f7',
  },
});

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      ...customTheme.extend,
    },
  },
  plugins: [],
};
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createTailwindPlugin } from '@philjs/plugin-tailwind';

const tailwindPlugin = createTailwindPlugin();

export default defineConfig({
  plugins: [
    react(),
    tailwindPlugin.vitePlugin({}),
  ],
});
```

```tsx
// src/components/Button.tsx
import { cn, createVariants, withStates } from '@philjs/plugin-tailwind';

const buttonVariants = createVariants({
  size: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  },
  variant: {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
  },
});

interface ButtonProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  children: React.ReactNode;
}

export function Button({
  size = 'md',
  variant = 'primary',
  className,
  children,
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-colors',
        buttonVariants({ size, variant }),
        className
      )}
    >
      {children}
    </button>
  );
}
```

## API Reference

### Main Exports

| Export | Description |
|--------|-------------|
| `createTailwindPlugin(config?)` | Create a Tailwind plugin instance |
| `tailwindUtils` | Collection of utility functions |

### Utility Functions

| Function | Description |
|----------|-------------|
| `cn(...classes)` | Merge classes with conflict resolution |
| `clsx(...classes)` | Alias for `cn` |
| `createVariants(variants)` | Create a variant-based class generator |
| `responsive(base, breakpoints)` | Generate responsive class strings |
| `withStates(base, states)` | Generate state variant classes |
| `dark(light, dark)` | Generate light/dark mode pairs |
| `container(base, sizes)` | Generate container query classes |

### Theme Generation

| Function | Description |
|----------|-------------|
| `generateColorPalette(baseColor)` | Generate color palette from base color |
| `generateBrandTheme(colors)` | Generate theme from brand colors |
| `generateCompleteTheme(options)` | Generate complete theme configuration |
| `generateTypographyScale(base, ratio)` | Generate typography scale |
| `generateSpacingScale(baseUnit)` | Generate spacing scale |
| `cssVarsToTheme(cssVars)` | Convert CSS variables to theme |
| `presetThemes` | Pre-built theme configurations |

### Content Detection

| Function | Description |
|----------|-------------|
| `ContentDetector` | Content detection class |
| `detectContentPaths(rootDir, options)` | Quick content path detection |
| `validateContentPatterns(patterns)` | Validate glob patterns |
| `optimizeContentPatterns(patterns)` | Optimize and deduplicate patterns |

### CSS Optimization

| Function | Description |
|----------|-------------|
| `CSSOptimizer` | CSS optimization class |
| `optimizeCSS(css, options)` | Quick CSS optimization |
| `CriticalCSSExtractor` | Critical CSS extraction class |
| `extractCriticalCSS(css, html)` | Extract critical CSS |
| `purgeUnusedCSS(css, content, options)` | Purge unused CSS |
| `analyzeCSSStats(css)` | Analyze CSS statistics |

## Requirements

- Node.js >= 24
- PhilJS Core >= 2.0.0
- Vite >= 7.3.0 (for Vite integration)

## Related Packages

- [@philjs/core](../core/overview.md) - PhilJS Core framework
- [@philjs/css](../css/overview.md) - CSS utilities
- [@philjs/styles](../styles/overview.md) - Style system
