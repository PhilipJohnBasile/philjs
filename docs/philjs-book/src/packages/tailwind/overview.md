# @philjs/tailwind

Official Tailwind CSS integration for PhilJS applications with design tokens, custom utilities, IntelliSense support, and Vite optimizations.

## Installation

```bash
npm install @philjs/tailwind tailwindcss autoprefixer postcss
```

## Quick Setup

The fastest way to get started is using the `createTailwindConfig()` helper:

```javascript
// tailwind.config.js
import { createTailwindConfig } from '@philjs/tailwind';

export default createTailwindConfig({
  content: ['./src/**/*.{js,ts,jsx,tsx}', './index.html'],
  darkMode: 'class',
  theme: {
    // Your custom theme extensions
  },
  plugins: [
    // Additional plugins
  ],
});
```

This automatically includes the PhilJS preset and plugin with sensible defaults.

## Manual Configuration

For more control, configure each component individually:

```javascript
// tailwind.config.js
import { philjsPreset, philjsTailwindPlugin } from '@philjs/tailwind';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './index.html'],
  darkMode: 'class',
  presets: [philjsPreset()],
  plugins: [philjsTailwindPlugin()],
};
```

---

## Components

### philjsPreset

The Tailwind preset provides PhilJS design tokens including colors, typography, spacing, animations, and more.

```javascript
import { philjsPreset } from '@philjs/tailwind/preset';

// Or with options
import { createPhilJSPreset } from '@philjs/tailwind';

export default {
  presets: [
    philjsPreset({
      fontFamily: 'Inter, system-ui, sans-serif',
      primaryColor: 'blue',
      borderRadius: 'rounded',
      spacingScale: 1,
    }),
  ],
};
```

#### PhilJSPresetOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fontFamily` | `string` | `'Inter, system-ui, sans-serif'` | Base font family for the application |
| `primaryColor` | `string` | `'blue'` | Primary color palette name |
| `darkMode` | `boolean` | `true` | Enable dark mode color variables |
| `colors` | `Record<string, string \| Record<string, string>>` | `{}` | Custom color palette additions |
| `borderRadius` | `'sharp' \| 'rounded' \| 'pill'` | `'rounded'` | Border radius scale preset |
| `spacingScale` | `number` | `1` | Multiplier for custom spacing values |

#### Border Radius Scales

```css
/* sharp */
sm: 0.125rem, DEFAULT: 0.25rem, md: 0.375rem, lg: 0.5rem

/* rounded (default) */
sm: 0.25rem, DEFAULT: 0.375rem, md: 0.5rem, lg: 0.75rem

/* pill */
sm: 0.5rem, DEFAULT: 0.75rem, md: 1rem, lg: 1.5rem
```

#### Design Token Mapping

The preset maps CSS custom properties to Tailwind classes:

```css
/* Semantic colors (via CSS variables) */
.bg-background    /* hsl(var(--background)) */
.text-foreground  /* hsl(var(--foreground)) */
.bg-card          /* hsl(var(--card)) */
.bg-muted         /* hsl(var(--muted)) */
.bg-accent        /* hsl(var(--accent)) */
.bg-destructive   /* hsl(var(--destructive)) */
.border-border    /* hsl(var(--border)) */
.ring-ring        /* hsl(var(--ring)) */

/* Primary color scale */
.bg-primary-50 through .bg-primary-950
.text-primary-500
```

#### Included Animations

```javascript
// Pre-configured animations
'fade-in'     // Fade in over 0.2s
'fade-out'    // Fade out over 0.2s
'slide-in'    // Slide down with fade
'slide-out'   // Slide up with fade
'scale-in'    // Scale up with fade
'scale-out'   // Scale down with fade
'spin-slow'   // Slow spin (3s)
'pulse-slow'  // Slow pulse (3s)
'bounce-slow' // Slow bounce (2s)
```

#### Custom Shadows

```html
<div class="shadow-philjs-sm">Small shadow</div>
<div class="shadow-philjs">Default shadow</div>
<div class="shadow-philjs-md">Medium shadow</div>
<div class="shadow-philjs-lg">Large shadow</div>
<div class="shadow-philjs-xl">Extra large shadow</div>
```

---

### philjsTailwindPlugin

Custom utilities and component classes for PhilJS applications.

```javascript
import { philjsTailwindPlugin } from '@philjs/tailwind/plugin';

export default {
  plugins: [
    philjsTailwindPlugin({
      signals: true,     // Signal state utilities
      components: true,  // Base component styles
      animations: true,  // Animation utilities
      forms: true,       // Form styling utilities
      typography: true,  // Typography utilities
    }),
  ],
};
```

#### PhilJSPluginOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `signals` | `boolean` | `true` | Add signal-related utilities |
| `components` | `boolean` | `true` | Add component base styles |
| `animations` | `boolean` | `true` | Add animation utilities |
| `forms` | `boolean` | `true` | Add form utilities |
| `typography` | `boolean` | `true` | Add typography utilities |

#### Signal Utilities

For reactive state indication:

```html
<div class="signal-loading">Loading state (reduced opacity, no pointer events)</div>
<input class="signal-error" />  <!-- Red border for errors -->
<input class="signal-success" />  <!-- Green border for success -->
<div class="signal-pending">Pulsing animation for pending state</div>
```

#### Component Base Styles

Pre-built component classes:

```html
<!-- Buttons -->
<button class="btn btn-primary btn-md">Primary</button>
<button class="btn btn-secondary btn-sm">Secondary</button>
<button class="btn btn-outline btn-lg">Outline</button>
<button class="btn btn-ghost">Ghost</button>

<!-- Button sizes: btn-sm, btn-md, btn-lg -->

<!-- Cards -->
<div class="card">Card with border and shadow</div>

<!-- Inputs -->
<input class="input" placeholder="Styled input" />

<!-- Badges -->
<span class="badge">Status</span>
```

#### Animation Utilities

```html
<div class="animate-in slide-in-from-top">Slide from top</div>
<div class="animate-in slide-in-from-bottom">Slide from bottom</div>
<div class="animate-in slide-in-from-left">Slide from left</div>
<div class="animate-in slide-in-from-right">Slide from right</div>

<div class="animate-in zoom-in-50">Zoom in from 50%</div>
<div class="animate-in zoom-in-75">Zoom in from 75%</div>
<div class="animate-in zoom-in-90">Zoom in from 90%</div>
<div class="animate-in zoom-in-95">Zoom in from 95%</div>

<div class="animate-out">Animate out</div>

<!-- Dynamic delays and durations -->
<div class="animate-delay-150">150ms delay</div>
<div class="animate-duration-300">300ms duration</div>
```

#### Form Utilities

```html
<div class="form-group">
  <label class="form-label">Email</label>
  <input class="input" type="email" />
  <p class="form-helper">We'll never share your email.</p>
</div>

<div class="form-group">
  <label class="form-label">Password</label>
  <input class="input" type="password" />
  <p class="form-error">Password is required</p>
</div>
```

#### Typography Utilities

```html
<p class="text-balance">Balanced text wrapping for headlines</p>
<p class="text-pretty">Pretty text wrapping for paragraphs</p>
<p class="truncate-2">Truncate to 2 lines with ellipsis...</p>
<p class="truncate-3">Truncate to 3 lines with ellipsis...</p>
```

---

### philjsTailwindVite

Vite plugin for Tailwind CSS optimizations.

```javascript
// vite.config.ts
import { defineConfig } from 'vite';
import { philjsTailwindVite } from '@philjs/tailwind/vite';

export default defineConfig({
  plugins: [
    philjsTailwindVite({
      jit: true,
      content: ['./src/**/*.{js,ts,jsx,tsx}', './index.html'],
      purge: true,
      extractCritical: false,
    }),
  ],
});
```

#### PhilJSTailwindViteOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `jit` | `boolean` | `true` | Enable Just-in-Time mode optimizations |
| `content` | `string[]` | `['./src/**/*.{js,ts,jsx,tsx}', './index.html']` | Content paths for Tailwind class detection |
| `purge` | `boolean` | `true` | Purge unused styles in production |
| `extractCritical` | `boolean` | `false` | Extract critical CSS for SSR |

#### Features

**Content Path Optimization**: Automatically configures PostCSS with Tailwind and Autoprefixer.

**Class Detection**: Scans specified content paths for Tailwind class usage.

**Critical CSS Extraction**: When `extractCritical: true`, extracts above-the-fold styles and inlines them in the HTML `<head>` for faster initial render.

```javascript
// Enable critical CSS for SSR
philjsTailwindVite({
  extractCritical: true,
});
// Generates: critical.css asset
// Injects: <style id="critical-css">...</style> in <head>
```

---

## Utility Functions

### tw() - Template Literal Helper

Tagged template for building Tailwind class strings:

```typescript
import { tw } from '@philjs/tailwind';

// Basic usage
const classes = tw`flex items-center justify-center`;

// With interpolation
const size = 'lg';
const classes = tw`p-4 text-${size} font-bold`;

// With arrays
const conditionalClasses = ['hover:bg-blue-500', isActive && 'bg-blue-600'];
const classes = tw`flex ${conditionalClasses}`;
```

### cn() - Class Name Merger

Combines `clsx` conditional logic with `twMerge` conflict resolution:

```typescript
import { cn } from '@philjs/tailwind';

// Conditional classes
const buttonClass = cn(
  'px-4 py-2 rounded',
  isPrimary && 'bg-blue-500 text-white',
  isDisabled && 'opacity-50 cursor-not-allowed',
  className // User-provided override
);

// Object syntax
const classes = cn({
  'bg-red-500': hasError,
  'bg-green-500': isSuccess,
  'animate-pulse': isLoading,
});

// Tailwind conflict resolution
cn('px-2 py-1', 'p-4'); // => 'p-4' (later wins)
cn('text-red-500', 'text-blue-500'); // => 'text-blue-500'
```

### cva() - Class Variance Authority

Create variant-based component styles:

```typescript
import { cva, type VariantProps } from '@philjs/tailwind';

const button = cva({
  base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  variants: {
    variant: {
      primary: 'bg-primary-500 text-white hover:bg-primary-600',
      secondary: 'bg-muted text-foreground hover:bg-accent',
      outline: 'border border-input bg-transparent hover:bg-accent',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4',
      lg: 'h-12 px-6 text-lg',
    },
  },
  compoundVariants: [
    {
      variant: 'primary',
      size: 'lg',
      class: 'font-bold uppercase tracking-wide',
    },
  ],
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

// Usage
button(); // Default: primary, md
button({ variant: 'secondary', size: 'lg' });
button({ variant: 'outline', className: 'my-4' });

// TypeScript support
type ButtonProps = VariantProps<typeof button>;
// { variant?: 'primary' | 'secondary' | 'outline' | 'ghost', size?: 'sm' | 'md' | 'lg' }
```

### twMerge() - Tailwind-Aware Merge

Intelligently merges Tailwind classes, resolving conflicts:

```typescript
import { twMerge } from '@philjs/tailwind';

// Later classes override earlier ones
twMerge('px-2 py-1 p-4'); // => 'p-4'
twMerge('text-sm text-lg'); // => 'text-lg'
twMerge('bg-red-500 bg-blue-500'); // => 'bg-blue-500'

// Preserves non-conflicting classes
twMerge('flex items-center', 'justify-between gap-4');
// => 'flex items-center justify-between gap-4'
```

### twJoin() - Simple Join

Joins classes without conflict resolution (faster for non-conflicting cases):

```typescript
import { twJoin } from '@philjs/tailwind';

twJoin('flex', 'items-center', isActive && 'bg-blue-500');
// => 'flex items-center bg-blue-500' (if isActive is true)
```

### clsx() - Conditional Classes

Low-level conditional class builder:

```typescript
import { clsx } from '@philjs/tailwind';

clsx('foo', true && 'bar', false && 'baz'); // => 'foo bar'
clsx(['foo', 'bar']); // => 'foo bar'
clsx({ foo: true, bar: false, baz: true }); // => 'foo baz'
```

---

## Pre-built Patterns

Import common class patterns for consistency:

```typescript
import { patterns, focusRing } from '@philjs/tailwind';

// Focus ring utility
<button className={cn(patterns.button.base, focusRing)}>
  Accessible Button
</button>

// Button patterns
patterns.button.base     // Base button styles
patterns.button.primary  // Primary variant
patterns.button.secondary
patterns.button.outline
patterns.button.ghost
patterns.button.link

// Input pattern
patterns.input.base

// Card pattern
patterns.card.base
```

---

## IntelliSense Support

For VS Code IntelliSense with the `tw()` and `cn()` functions, add to your `.vscode/settings.json`:

```json
{
  "tailwindCSS.experimental.classRegex": [
    ["tw`([^`]*)`", "([^`]*)"],
    ["cn\\(([^)]*)\\)", "'([^']*)'"],
    ["cva\\(([^)]*)\\)", "'([^']*)'"]
  ]
}
```

This enables autocomplete for:
- Tagged template: `` tw`flex items-center` ``
- Function calls: `cn('flex', 'items-center')`
- CVA definitions: `cva({ base: 'flex items-center' })`

---

## Complete Example

```typescript
// components/Button.tsx
import { cn, cva, type VariantProps } from '@philjs/tailwind';

const buttonVariants = cva({
  base: 'btn inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  variants: {
    variant: {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
    },
    size: {
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

// Usage
<Button>Default</Button>
<Button variant="secondary" size="lg">Large Secondary</Button>
<Button variant="outline" className="mt-4">Custom Class</Button>
```

---

## Dark Mode

The preset automatically includes dark mode CSS variables. Enable with:

```javascript
// tailwind.config.js
export default {
  darkMode: 'class', // or 'media'
  // ...
};
```

Toggle dark mode in your app:

```typescript
// Toggle dark class on document
document.documentElement.classList.toggle('dark');
```

The semantic colors automatically adjust:

```css
/* Light mode */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;

/* Dark mode */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
```

---

## API Reference

### Exports

```typescript
// Main exports
export { philjsPreset, createPhilJSPreset } from '@philjs/tailwind';
export { philjsTailwindPlugin, createPhilJSPlugin } from '@philjs/tailwind';
export { philjsTailwindVite } from '@philjs/tailwind';
export { createTailwindConfig } from '@philjs/tailwind';

// Utilities
export { tw, cn, clsx, cva, twMerge, twJoin } from '@philjs/tailwind';
export { focusRing, patterns } from '@philjs/tailwind';

// Types
export type { PhilJSPresetOptions } from '@philjs/tailwind';
export type { PhilJSPluginOptions } from '@philjs/tailwind';
export type { PhilJSTailwindViteOptions } from '@philjs/tailwind';
export type { ClassValue, VariantProps } from '@philjs/tailwind';

// Subpath exports
import { philjsPreset } from '@philjs/tailwind/preset';
import { philjsTailwindPlugin } from '@philjs/tailwind/plugin';
import { philjsTailwindVite } from '@philjs/tailwind/vite';
```

---

## See Also

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [@philjs/css](../css/overview.md) - CSS-in-JS alternative
- [@philjs/ui](../ui/overview.md) - Pre-built UI components
