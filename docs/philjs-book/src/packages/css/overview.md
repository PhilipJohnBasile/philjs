# @philjs/css

Type-safe CSS-in-TypeScript with **ZERO runtime overhead**. All styles are extracted at build time, giving you the developer experience of CSS-in-JS with the performance of static CSS.

## Introduction

`@philjs/css` is a comprehensive styling solution that provides:

- **Full TypeScript type safety** for all CSS properties
- **Theme tokens** with design system support
- **Atomic utility classes** for rapid development
- **Variant system** (similar to Stitches/CVA)
- **Zero runtime overhead** - all CSS extracted at build time
- **SSR hydration** and runtime style injection
- **Advanced CSS features** - Container Queries, CSS Layers, View Transitions, and more
- **Animation system** with spring physics and orchestration
- **Gesture system** for touch interactions

## Installation

```bash
npm install @philjs/css
```

## Quick Start

```typescript
import { css, createTheme, variants } from '@philjs/css';

// Create type-safe styles
const button = css({
  padding: '10px 20px',
  backgroundColor: '#3b82f6',
  color: 'white',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#2563eb'
  }
});

// Use in your component
<button class={button}>Click me</button>
```

---

## Core CSS Functions

### css()

The core function for creating type-safe styles with full CSS property autocomplete.

```typescript
import { css } from '@philjs/css';

const card = css({
  padding: '16px',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',

  // Pseudo selectors
  '&:hover': {
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
  },

  // Pseudo elements
  '&::before': {
    content: '""',
    display: 'block',
    height: '4px',
    backgroundColor: '#3b82f6'
  }
});

// Returns { className: 'css-0', css: '...', toString: () => 'css-0' }
console.log(card.className); // 'css-0'
```

### compose()

Combine multiple CSS results into a single class string.

```typescript
import { css, compose } from '@philjs/css';

const base = css({ padding: '10px' });
const primary = css({ backgroundColor: 'blue', color: 'white' });
const rounded = css({ borderRadius: '4px' });

const buttonClasses = compose(base, primary, rounded);
// Returns: 'css-0 css-1 css-2'
```

### cx()

Conditional class helper for dynamic styling.

```typescript
import { cx } from '@philjs/css';

function Button({ isActive, isDisabled }) {
  const className = cx(
    'base-button',
    isActive && 'active',
    isDisabled && 'disabled',
    !isDisabled && 'interactive'
  );

  return <button class={className}>Click me</button>;
}
```

### globalStyle()

Define global styles that apply to any selector.

```typescript
import { globalStyle } from '@philjs/css';

globalStyle('body', {
  margin: 0,
  padding: 0,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  backgroundColor: '#f5f5f5'
});

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box'
});
```

### keyframes()

Create CSS keyframe animations with type safety.

```typescript
import { css, keyframes } from '@philjs/css';

const fadeIn = keyframes({
  from: { opacity: 0, transform: 'translateY(-10px)' },
  to: { opacity: 1, transform: 'translateY(0)' }
});

const animatedElement = css({
  animation: `${fadeIn} 300ms ease-out forwards`
});
```

### styleFactory()

Create a style factory with default properties.

```typescript
import { styleFactory } from '@philjs/css';

const createButton = styleFactory({
  padding: '10px 20px',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
});

const primaryButton = createButton({
  backgroundColor: '#3b82f6',
  color: 'white'
});

const dangerButton = createButton({
  backgroundColor: '#ef4444',
  color: 'white'
});
```

### createStyles()

Batch create multiple named styles at once.

```typescript
import { createStyles } from '@philjs/css';

const styles = createStyles({
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px'
  },
  header: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px'
  },
  button: {
    padding: '10px 20px',
    borderRadius: '4px'
  }
});

// Access individual styles
<div class={styles.container}>
  <h1 class={styles.header}>Title</h1>
  <button class={styles.button}>Click</button>
</div>
```

---

## Theme System

### createTheme()

Create a type-safe theme with design tokens that automatically generate CSS variables.

```typescript
import { createTheme } from '@philjs/css';

const theme = createTheme({
  colors: {
    primary: '#3b82f6',
    secondary: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    background: '#ffffff',
    text: '#111827',
    textMuted: '#6b7280'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px'
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem'
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)'
  }
});

// Access tokens directly
console.log(theme.colors.primary); // '#3b82f6'
console.log(theme.spacing.md);     // '16px'
```

### getTheme()

Retrieve the currently active theme.

```typescript
import { getTheme } from '@philjs/css';

const currentTheme = getTheme();
if (currentTheme) {
  console.log(currentTheme.tokens.colors);
}
```

### generateThemeCSS()

Generate CSS variable declarations from a theme.

```typescript
import { generateThemeCSS } from '@philjs/css';

const css = generateThemeCSS(theme);
// Output:
// :root {
//   --colors-primary: #3b82f6;
//   --colors-secondary: #10b981;
//   --spacing-md: 16px;
//   ...
// }

// With custom selector
const darkCSS = generateThemeCSS(darkTheme, '[data-theme="dark"]');
```

### createThemeVariant()

Create theme variants like dark mode by extending a base theme.

```typescript
import { createThemeVariant } from '@philjs/css';

const darkTheme = createThemeVariant(theme, 'dark', {
  colors: {
    background: '#1f2937',
    text: '#f9fafb',
    textMuted: '#9ca3af',
    primary: '#60a5fa'
  }
});
```

### cssVar() and themeVar()

Reference CSS variables in your styles.

```typescript
import { css, cssVar, themeVar } from '@philjs/css';

// Using cssVar (simple string reference)
const button = css({
  color: cssVar('colors-primary'),
  padding: cssVar('spacing-md')
});
// Generates: color: var(--colors-primary);

// Using themeVar (category + key)
const card = css({
  backgroundColor: themeVar('colors', 'background'),
  borderRadius: themeVar('borderRadius', 'lg'),
  boxShadow: themeVar('shadows', 'md')
});
// Generates: background-color: var(--colors-background);
```

### createBreakpoints()

Create responsive breakpoint utilities.

```typescript
import { css, createBreakpoints } from '@philjs/css';

const breakpoints = createBreakpoints({
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px'
});

const responsive = css({
  width: '100%',
  [breakpoints.md]: { width: '50%' },
  [breakpoints.lg]: { width: '33.333%' }
});
```

### Default Theme

A sensible default theme is provided out of the box.

```typescript
import { defaultTheme } from '@philjs/css';

// Includes colors, spacing, fontSize, fontWeight,
// lineHeight, borderRadius, shadows, breakpoints, transitions
```

---

## Variant System

### variants()

Create components with multiple variant options, similar to Stitches or CVA.

```typescript
import { variants } from '@philjs/css';

const button = variants({
  base: {
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s ease'
  },
  variants: {
    size: {
      sm: { padding: '6px 12px', fontSize: '14px' },
      md: { padding: '10px 20px', fontSize: '16px' },
      lg: { padding: '14px 28px', fontSize: '18px' }
    },
    color: {
      primary: {
        backgroundColor: '#3b82f6',
        color: 'white',
        '&:hover': { backgroundColor: '#2563eb' }
      },
      secondary: {
        backgroundColor: '#10b981',
        color: 'white',
        '&:hover': { backgroundColor: '#059669' }
      },
      danger: {
        backgroundColor: '#ef4444',
        color: 'white',
        '&:hover': { backgroundColor: '#dc2626' }
      }
    },
    outline: {
      true: {
        backgroundColor: 'transparent',
        border: '2px solid currentColor'
      }
    }
  },
  compoundVariants: [
    {
      color: 'primary',
      outline: true,
      css: { color: '#3b82f6', borderColor: '#3b82f6' }
    },
    {
      size: 'sm',
      outline: true,
      css: { border: '1px solid currentColor' }
    }
  ],
  defaultVariants: {
    size: 'md',
    color: 'primary'
  }
});

// Usage
<button class={button()}>Default</button>
<button class={button({ size: 'lg', color: 'danger' })}>Large Danger</button>
<button class={button({ color: 'primary', outline: true })}>Outlined</button>
```

### responsiveVariants()

Create responsive variants based on breakpoints.

```typescript
import { responsiveVariants } from '@philjs/css';

const container = responsiveVariants({
  base: {
    width: '100%',
    padding: '16px'
  },
  breakpoints: {
    '768px': { maxWidth: '720px', margin: '0 auto' },
    '1024px': { maxWidth: '960px' },
    '1280px': { maxWidth: '1200px' }
  }
});
```

### recipe()

Create a variant recipe with additional metadata.

```typescript
import { recipe } from '@philjs/css';

const cardRecipe = recipe({
  base: {
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: 'white'
  },
  variants: {
    elevated: {
      true: { boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
      false: { boxShadow: 'none' }
    },
    bordered: {
      true: { border: '1px solid #e5e7eb' }
    }
  }
});

// Access base class name
console.log(cardRecipe.classNames.base);
```

### booleanVariant()

Helper for cleaner boolean variant definitions.

```typescript
import { variants, booleanVariant } from '@philjs/css';

const button = variants({
  base: { padding: '10px 20px' },
  variants: {
    loading: booleanVariant({
      opacity: 0.5,
      pointerEvents: 'none',
      cursor: 'wait'
    }),
    disabled: booleanVariant({
      cursor: 'not-allowed',
      opacity: 0.6
    }),
    fullWidth: booleanVariant({
      width: '100%'
    })
  }
});

<button class={button({ loading: true })}>Loading...</button>
```

### dataVariants()

Create styles that respond to data attributes.

```typescript
import { dataVariants } from '@philjs/css';

const button = dataVariants({
  base: {
    padding: '10px 20px',
    transition: 'all 0.2s'
  },
  data: {
    disabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    loading: {
      opacity: 0.7,
      pointerEvents: 'none'
    },
    active: {
      backgroundColor: '#3b82f6',
      color: 'white'
    }
  }
});

// Usage in HTML
<button class={button} data-disabled>Disabled</button>
<button class={button} data-loading>Loading</button>
```

### stateVariants()

Create styles for interactive states.

```typescript
import { stateVariants } from '@philjs/css';

const interactive = stateVariants({
  base: {
    color: '#000',
    transition: 'all 0.2s'
  },
  states: {
    hover: {
      color: '#3b82f6',
      transform: 'translateY(-1px)'
    },
    focus: {
      outline: '2px solid #3b82f6',
      outlineOffset: '2px'
    },
    active: {
      transform: 'scale(0.98)'
    },
    disabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  }
});
```

### slotVariants()

Create slot-based variants for complex multi-part components.

```typescript
import { slotVariants } from '@philjs/css';

const card = slotVariants({
  slots: {
    root: {
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: 'white'
    },
    header: {
      padding: '16px',
      borderBottom: '1px solid #e5e7eb',
      fontWeight: 600
    },
    body: {
      padding: '16px'
    },
    footer: {
      padding: '16px',
      backgroundColor: '#f9fafb',
      borderTop: '1px solid #e5e7eb'
    }
  },
  variants: {
    size: {
      sm: {
        root: { maxWidth: '400px' },
        header: { padding: '12px', fontSize: '14px' },
        body: { padding: '12px' },
        footer: { padding: '12px' }
      },
      lg: {
        root: { maxWidth: '800px' },
        header: { padding: '24px', fontSize: '20px' },
        body: { padding: '24px' },
        footer: { padding: '24px' }
      }
    }
  }
});

// Usage
const classes = card({ size: 'lg' });

<div class={classes.root}>
  <div class={classes.header}>Card Title</div>
  <div class={classes.body}>Card content goes here...</div>
  <div class={classes.footer}>Card footer</div>
</div>
```

---

## Atomic CSS

Generate Tailwind-style atomic utility classes.

### generateAtomicClasses()

Generate atomic classes for specific properties and values.

```typescript
import { generateAtomicClasses } from '@philjs/css';

const utilities = generateAtomicClasses({
  properties: ['margin', 'padding', 'color', 'backgroundColor'],
  values: {
    '0': '0',
    '1': '0.25rem',
    '2': '0.5rem',
    '4': '1rem',
    '8': '2rem',
    'blue': '#3b82f6',
    'red': '#ef4444'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px'
  }
});

// Access classes
<div class={`${utilities.margin4} ${utilities.padding2} ${utilities.colorBlue}`}>
  Content
</div>

// Responsive
<div class={`${utilities.margin4} ${utilities['md:margin8']}`}>
  Responsive margins
</div>
```

### createSpacingUtilities()

Create margin and padding utilities from a spacing scale.

```typescript
import { createSpacingUtilities } from '@philjs/css';

const spacing = createSpacingUtilities({
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem'
});

// Generated classes:
// spacing.m0, spacing.m1, spacing.m2, ...
// spacing.mt1, spacing.mr2, spacing.mb3, spacing.ml4
// spacing.mx2, spacing.my4 (horizontal/vertical)
// spacing.p0, spacing.p1, spacing.p2, ...
// spacing.pt1, spacing.pr2, spacing.pb3, spacing.pl4
// spacing.px2, spacing.py4

<div class={`${spacing.m4} ${spacing.p2} ${spacing.mt8}`}>
  Spaced content
</div>
```

### createColorUtilities()

Generate text, background, and border color utilities.

```typescript
import { createColorUtilities } from '@philjs/css';

const colors = createColorUtilities({
  blue: '#3b82f6',
  red: '#ef4444',
  green: '#10b981',
  yellow: '#f59e0b',
  gray: '#6b7280',
  white: '#ffffff',
  black: '#000000'
});

// Generated classes:
// colors.textBlue, colors.textRed, colors.textGreen, ...
// colors.bgBlue, colors.bgRed, colors.bgGreen, ...
// colors.borderBlue, colors.borderRed, colors.borderGreen, ...

<div class={`${colors.bgBlue} ${colors.textWhite}`}>
  Blue background with white text
</div>
```

### createTypographyUtilities()

Generate font-related utility classes.

```typescript
import { createTypographyUtilities } from '@philjs/css';

const typography = createTypographyUtilities({
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem'
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em'
  }
});

// Generated classes:
// typography.textXs, typography.textSm, typography.textBase, ...
// typography.fontLight, typography.fontNormal, typography.fontBold, ...
// typography.leadingTight, typography.leadingNormal, ...
// typography.trackingTight, typography.trackingWide, ...
```

### createLayoutUtilities()

Generate display, flexbox, and position utilities.

```typescript
import { createLayoutUtilities } from '@philjs/css';

const layout = createLayoutUtilities();

// Display utilities
// layout.block, layout.inline, layout.inlineBlock
// layout.flex, layout.inlineFlex
// layout.grid, layout.inlineGrid
// layout.hidden

// Flex utilities
// layout.flexRow, layout.flexCol
// layout.flexWrap, layout.flexNoWrap
// layout.itemsCenter, layout.itemsStart, layout.itemsEnd
// layout.justifyCenter, layout.justifyStart, layout.justifyEnd
// layout.justifyBetween, layout.justifyAround

// Position utilities
// layout.relative, layout.absolute, layout.fixed, layout.sticky

<div class={`${layout.flex} ${layout.itemsCenter} ${layout.justifyBetween}`}>
  <span>Left</span>
  <span>Right</span>
</div>
```

### createAtomicSystem()

Create a complete atomic utility system from configuration.

```typescript
import { createAtomicSystem } from '@philjs/css';

const atoms = createAtomicSystem({
  spacing: {
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px'
  },
  colors: {
    blue: '#3b82f6',
    red: '#ef4444',
    green: '#10b981',
    gray: '#6b7280'
  },
  fontSize: {
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '24px'
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    bold: 700
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px'
  }
});

// Use all utilities
<div class={`
  ${atoms.m4}
  ${atoms.p2}
  ${atoms.bgBlue}
  ${atoms.textWhite}
  ${atoms.textLg}
  ${atoms.fontBold}
  ${atoms.flex}
  ${atoms.itemsCenter}
`}>
  Fully styled with atomic classes
</div>
```

### extractAtomicCSS()

Extract all registered atomic CSS.

```typescript
import { extractAtomicCSS } from '@philjs/css';

const css = extractAtomicCSS();
// Returns all atomic utility CSS rules
```

---

## Build-time Extraction

### extractCSS()

Extract all CSS from the style registry.

```typescript
import { extractCSS } from '@philjs/css';

const css = extractCSS({
  minify: true,
  sourceMap: true,
  atomicClasses: true
});
```

### extractToFile()

Extract CSS and write directly to a file.

```typescript
import { extractToFile } from '@philjs/css';

await extractToFile('./dist/styles.css', {
  minify: true,
  sourceMap: true,
  atomicClasses: true
});
```

### extractCriticalCSS()

Extract only the CSS used in rendered HTML for faster first paint.

```typescript
import { extractCriticalCSS } from '@philjs/css';

const html = '<div class="css-0 css-1">Content</div>';
const criticalCSS = extractCriticalCSS(html, { minify: true });
```

### Vite Plugin

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { createVitePlugin } from '@philjs/css';

export default defineConfig({
  plugins: [
    createVitePlugin({
      outputPath: 'dist/styles.css',
      minify: true,
      sourceMap: true,
      atomicClasses: true
    })
  ]
});
```

### Rollup Plugin

```typescript
// rollup.config.js
import { createRollupPlugin } from '@philjs/css';

export default {
  plugins: [
    createRollupPlugin({
      outputPath: 'dist/styles.css',
      minify: true,
      sourceMap: true
    })
  ]
};
```

### Webpack Plugin

```typescript
// webpack.config.js
const { createWebpackPlugin } = require('@philjs/css');

module.exports = {
  plugins: [
    new (createWebpackPlugin({
      outputPath: 'styles.css',
      minify: true,
      atomicClasses: true
    }))()
  ]
};
```

### analyzeCSSBundle()

Analyze your CSS bundle and get statistics.

```typescript
import { analyzeCSSBundle } from '@philjs/css';

const stats = analyzeCSSBundle();
console.log(`Total size: ${stats.totalSize} bytes`);
console.log(`Minified: ${stats.minifiedSize} bytes`);
console.log(`Gzip estimate: ${stats.gzipSize} bytes`);
console.log(`Classes: ${stats.classCount}`);
console.log(`Rules: ${stats.ruleCount}`);
console.log(`Theme variables: ${stats.themeVars}`);
```

---

## Runtime Utilities

### SSR Hydration

#### hydrateStyles()

Hydrate styles on the client after SSR.

```typescript
import { hydrateStyles } from '@philjs/css';

// In your app entry point
hydrateStyles();
```

#### getSSRStyles()

Get the style tag for server-side rendering.

```typescript
import { getSSRStyles } from '@philjs/css';

// In your SSR handler
const html = `
  <html>
    <head>
      ${getSSRStyles()}
    </head>
    <body>${renderedApp}</body>
  </html>
`;
```

#### getCriticalSSRStyles()

Get SSR styles with only critical CSS.

```typescript
import { getCriticalSSRStyles } from '@philjs/css';

const usedClasses = ['css-0', 'css-1', 'css-2'];
const styles = getCriticalSSRStyles(usedClasses);
```

### Dynamic Styles

#### injectStyle() / removeStyle()

Inject and remove styles at runtime.

```typescript
import { injectStyle, removeStyle, clearStyles } from '@philjs/css';

// Inject a style
injectStyle('dynamic-class', '.dynamic-class { color: red; }');

// Remove a style
removeStyle('dynamic-class');

// Clear all runtime styles
clearStyles();
```

#### createDynamicStyle()

Create a style that can be updated at runtime.

```typescript
import { createDynamicStyle } from '@philjs/css';

const dynamicButton = createDynamicStyle({
  padding: '10px 20px',
  backgroundColor: 'blue',
  color: 'white'
});

// Use the class name
<button class={dynamicButton.className}>Dynamic</button>

// Update styles later
dynamicButton.update({ backgroundColor: 'red' });

// Clean up when done
dynamicButton.dispose();
```

#### createReactiveStyle()

Create a style that reacts to state changes.

```typescript
import { createReactiveStyle } from '@philjs/css';
import { createSignal } from '@philjs/core';

const [getColor, setColor] = createSignal('blue');

const reactiveStyle = createReactiveStyle(() => ({
  backgroundColor: getColor(),
  padding: '10px 20px',
  color: 'white'
}));

// Style updates automatically when you call refresh after state changes
setColor('red');
reactiveStyle.refresh();

// Clean up
reactiveStyle.dispose();
```

### Theme Switching

#### applyTheme()

Apply a theme at runtime.

```typescript
import { applyTheme } from '@philjs/css';

// Apply theme to :root
applyTheme(darkTheme);

// Apply to specific selector
applyTheme(darkTheme, '[data-theme="dark"]');
```

#### createThemeToggle()

Create a light/dark theme toggle.

```typescript
import { createThemeToggle } from '@philjs/css';

const { toggle, setTheme, isDark } = createThemeToggle(lightTheme, darkTheme);

// Toggle between themes
<button onclick={toggle}>
  {isDark() ? 'Switch to Light' : 'Switch to Dark'}
</button>

// Set specific theme
setTheme('dark');
```

#### syncWithSystemTheme()

Automatically sync with system color scheme preference.

```typescript
import { syncWithSystemTheme } from '@philjs/css';

// Syncs automatically with system preference
const cleanup = syncWithSystemTheme(lightTheme, darkTheme);

// Stop syncing
cleanup();
```

### CSS Variables at Runtime

```typescript
import {
  setCSSVariable,
  getCSSVariable,
  removeCSSVariable,
  setCSSVariables
} from '@philjs/css';

// Set a single variable
setCSSVariable('--primary-color', '#3b82f6');

// Set on specific element
const element = document.querySelector('.container');
setCSSVariable('--local-color', 'red', element);

// Get a variable value
const color = getCSSVariable('--primary-color');

// Remove a variable
removeCSSVariable('--primary-color');

// Batch set multiple variables
setCSSVariables({
  '--primary-color': '#3b82f6',
  '--secondary-color': '#10b981',
  '--spacing-md': '16px'
});
```

### Performance Utilities

#### batchStyleUpdates()

Batch multiple style updates for better performance.

```typescript
import { batchStyleUpdates, injectStyle } from '@philjs/css';

batchStyleUpdates(() => {
  // All these updates happen in a single DOM update
  injectStyle('class1', '.class1 { color: red; }');
  injectStyle('class2', '.class2 { color: blue; }');
  injectStyle('class3', '.class3 { color: green; }');
});
```

#### prefetchStyles()

Prefetch and cache styles for components that will be rendered soon.

```typescript
import { prefetchStyles, css } from '@philjs/css';

const buttonStyles = css({ padding: '10px' });
const cardStyles = css({ borderRadius: '8px' });
const modalStyles = css({ position: 'fixed' });

// Prefetch during idle time
prefetchStyles([buttonStyles, cardStyles, modalStyles]);
```

#### getStyleDebugInfo()

Get debugging information about current styles.

```typescript
import { getStyleDebugInfo } from '@philjs/css';

const info = getStyleDebugInfo();
console.log(`Total rules: ${info.totalRules}`);
console.log(`Rules by type:`, info.rulesByType);
// { component: 10, atomic: 50, theme: 5, animation: 3, media: 8 }
console.log(`Total size: ${info.totalSize} bytes`);
```

---

## Advanced CSS Features

### Container Queries

Create responsive styles based on container size rather than viewport.

```typescript
import { createContainer, containerQuery, cq } from '@philjs/css';

// Define a container
const containerStyles = createContainer('sidebar', 'inline-size');
// Generates: container-name: sidebar; container-type: inline-size;

// Create container query
const sidebarQuery = containerQuery(
  { container: 'sidebar', minWidth: '400px' },
  { display: 'flex', gap: '16px' }
);
// @container sidebar (min-width: 400px) { display: flex; gap: 16px; }

// Use responsive shortcuts
const responsiveCard = cq({
  sm: { padding: '8px' },
  md: { padding: '16px', display: 'flex' },
  lg: { padding: '24px', gap: '16px' },
  xl: { padding: '32px' }
});
```

### CSS Layers

Organize your CSS with cascade layers for better specificity control.

```typescript
import { defineLayers, layer, generateLayeredStylesheet, defaultLayerOrder } from '@philjs/css';

// Define layer order
const layerDefinition = defineLayers(['reset', 'base', 'components', 'utilities']);
// @layer reset, base, components, utilities;

// Add styles to a layer
const baseStyles = layer('base', `
  body { margin: 0; font-family: system-ui; }
  a { color: inherit; }
`);
// @layer base { body { ... } a { ... } }

// Generate complete layered stylesheet
const stylesheet = generateLayeredStylesheet({
  reset: '*, *::before, *::after { box-sizing: border-box; }',
  base: 'body { margin: 0; }',
  components: '.button { padding: 10px; }',
  utilities: '.hidden { display: none; }'
});
```

### Scoped Styles

Create component-scoped styles using the CSS @scope rule.

```typescript
import { scopedStyles, componentScope } from '@philjs/css';

// Manual scoping
const scoped = scopedStyles(
  { root: '.card', limit: '.card-footer' },
  'a { color: blue; } p { margin: 0; }'
);
// @scope (.card) to (.card-footer) { a { color: blue; } ... }

// Auto-generated component scope
const { scopeId, css, scopeAttribute } = componentScope('my-card', {
  padding: '16px',
  backgroundColor: 'white'
});

<div data-scope={scopeId}>
  <style>{css}</style>
  ...content...
</div>
```

### CSS Nesting

Process nested CSS objects into standard CSS.

```typescript
import { processNesting } from '@philjs/css';

const css = processNesting('.card', {
  padding: '16px',
  backgroundColor: 'white',
  '&:hover': {
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  '& .title': {
    fontSize: '18px',
    fontWeight: 'bold'
  },
  '@media (min-width: 768px)': {
    padding: '24px'
  }
});
```

### View Transitions

Create smooth transitions between page states.

```typescript
import { viewTransition, startViewTransition, viewTransitionPresets } from '@philjs/css';

// Define custom view transition
const heroTransition = viewTransition({
  name: 'hero-image',
  oldStyles: {
    animation: 'fade-out 0.3s ease-out forwards'
  },
  newStyles: {
    animation: 'fade-in 0.3s ease-in forwards'
  },
  groupStyles: {
    animationDuration: '0.5s'
  }
});

// Trigger a view transition
async function navigateTo(url) {
  await startViewTransition(() => {
    // Update DOM
    router.navigate(url);
  });
}

// Use presets
const fadeCSS = viewTransitionPresets.fade;
const slideLeftCSS = viewTransitionPresets.slideLeft;
const slideUpCSS = viewTransitionPresets.slideUp;
const scaleCSS = viewTransitionPresets.scale;
```

### Scroll-driven Animations

Create animations that respond to scroll position.

```typescript
import { scrollTimeline, viewTimeline, scrollAnimation } from '@philjs/css';

// Create scroll timeline
const scrollTL = scrollTimeline({
  name: 'page-scroll',
  source: 'root',
  axis: 'y'
});
// @scroll-timeline page-scroll { source: root; axis: y; }

// Create view timeline (element visibility)
const viewTL = viewTimeline({
  name: 'card-reveal',
  axis: 'y',
  inset: '0 0 100px 0'
});

// Apply scroll-driven animation
const scrollAnimatedStyles = scrollAnimation({
  animation: 'fade-in 1s linear',
  timeline: 'scroll()',
  range: 'entry 0% cover 50%'
});
// animation: fade-in 1s linear;
// animation-timeline: scroll();
// animation-range: entry 0% cover 50%;
```

### Anchor Positioning

Position elements relative to other elements using CSS anchoring.

```typescript
import { createAnchor, anchorPosition, positionFallback } from '@philjs/css';

// Create an anchor
const triggerStyles = createAnchor('tooltip-trigger');
// anchor-name: --tooltip-trigger;

// Position relative to anchor
const tooltipStyles = anchorPosition({
  anchor: 'tooltip-trigger',
  position: 'top' // 'top' | 'right' | 'bottom' | 'left' | 'center'
});

// Create position fallback for overflow
const fallback = positionFallback('tooltip-fallback', [
  { bottom: 'anchor(top)', left: 'anchor(center)' },
  { top: 'anchor(bottom)', left: 'anchor(center)' },
  { left: 'anchor(right)', top: 'anchor(center)' }
]);
```

### Color Functions

Modern CSS color manipulation.

```typescript
import { colorMix, relativeColor, lightDark } from '@philjs/css';

// Mix two colors
const mixed = colorMix('#ff0000', '#0000ff', 50, 'oklch');
// color-mix(in oklch, #ff0000 50%, #0000ff)

// Adjust color properties
const lighter = relativeColor('#3b82f6', { l: 'calc(l + 20%)' });
// oklch(from #3b82f6 calc(l + 20%) c h / alpha)

// Automatic light/dark mode colors
const adaptiveColor = lightDark('#000000', '#ffffff');
// light-dark(#000000, #ffffff)

// Use in styles
const button = css({
  backgroundColor: colorMix('var(--primary)', 'white', 20),
  color: lightDark('#1a1a1a', '#f5f5f5')
});
```

### Feature Detection

Check for CSS feature support.

```typescript
import { supportsCSS, cssFeatures, featureDetectionCSS } from '@philjs/css';

// Check individual feature
if (supportsCSS('container-type: inline-size')) {
  // Use container queries
}

// Pre-built feature checks
if (cssFeatures.containerQueries()) { /* ... */ }
if (cssFeatures.layers()) { /* ... */ }
if (cssFeatures.nesting()) { /* ... */ }
if (cssFeatures.viewTransitions()) { /* ... */ }
if (cssFeatures.scrollTimeline()) { /* ... */ }
if (cssFeatures.anchorPositioning()) { /* ... */ }
if (cssFeatures.colorMix()) { /* ... */ }
if (cssFeatures.oklch()) { /* ... */ }
if (cssFeatures.has()) { /* ... */ }
if (cssFeatures.subgrid()) { /* ... */ }

// Generate feature detection CSS variables
const detectionCSS = featureDetectionCSS();
// Sets CSS variables like --philjs-has-container-queries: 1;
```

---

## Animation System

### Spring Physics

Create natural, physics-based animations.

```typescript
import { springPresets, calculateSpring, springAnimation, springEasing } from '@philjs/css';

// Available spring presets
const presets = {
  default: { mass: 1, stiffness: 100, damping: 10 },
  gentle: { mass: 1, stiffness: 120, damping: 14 },
  wobbly: { mass: 1, stiffness: 180, damping: 12 },
  stiff: { mass: 1, stiffness: 210, damping: 20 },
  slow: { mass: 1, stiffness: 280, damping: 60 },
  molasses: { mass: 1, stiffness: 280, damping: 120 },
  snappy: { mass: 1, stiffness: 400, damping: 30 },
  bouncy: { mass: 1, stiffness: 300, damping: 10 }
};

// Calculate spring values
const values = calculateSpring(0, 100, springPresets.bouncy);
// Returns array of positions over time

// Generate spring animation CSS
const springCSS = springAnimation(
  'transform',        // property
  'translateY(0)',    // from
  'translateY(-20px)', // to
  springPresets.wobbly,
  'px'                // unit
);

// Get spring-like cubic-bezier
const easing = springEasing(springPresets.snappy);
// Returns: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
```

### Keyframe Generators

Generate common animation keyframes.

```typescript
import {
  slide, fade, scale, rotate,
  bounce, shake, pulse, flip,
  swing, wobble, rubberBand
} from '@philjs/css';

// Slide animations
const slideUp = slide('up', '100%');
const slideDown = slide('down', '50px');
const slideLeft = slide('left');
const slideRight = slide('right');

// Fade animations
const fadeIn = fade('in');
const fadeOut = fade('out');
const fadeInUp = fade('in-up');
const fadeInDown = fade('in-down');
const fadeInLeft = fade('in-left');
const fadeInRight = fade('in-right');

// Scale animations
const scaleIn = scale('in');
const scaleOut = scale('out');
const scaleUp = scale('up');   // 0.95 -> 1
const scaleDown = scale('down'); // 1.05 -> 1

// Rotate animation
const spin = rotate(360);
const spinWithScale = rotate(360, { origin: 'center', scale: true });

// Effect animations
const bounceLight = bounce('light');
const bounceMedium = bounce('medium');
const bounceHeavy = bounce('heavy');

const shakeAnim = shake(10); // intensity in pixels
const pulseAnim = pulse(1.05); // scale factor
const flipX = flip('x');
const flipY = flip('y');
const swingAnim = swing();
const wobbleAnim = wobble();
const rubberBandAnim = rubberBand();
```

### Animation Orchestration

Coordinate multiple animations.

#### Stagger

```typescript
import { calculateStagger, staggerAnimation } from '@philjs/css';

// Calculate stagger delays
const delays = calculateStagger(10, {
  each: 0.1,        // 100ms between each
  from: 'first'     // 'first' | 'last' | 'center' | number
});
// [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]

// Grid-based stagger
const gridDelays = calculateStagger(12, {
  each: 0.05,
  grid: [4, 3],     // 4 columns, 3 rows
  axis: 'x'         // 'x' | 'y' | undefined (diagonal)
});

// Generate staggered animation CSS
const staggerCSS = staggerAnimation(
  '.list-item',
  'fadeIn 0.3s ease-out forwards',
  5,
  { each: 0.1, from: 'first' }
);
// .list-item:nth-child(1) { animation-delay: 0.00s; }
// .list-item:nth-child(2) { animation-delay: 0.10s; }
// ...
```

#### Sequence

```typescript
import { sequence } from '@philjs/css';

const sequenceCSS = sequence([
  { animation: 'fadeIn', duration: 0.3 },
  { animation: 'slideUp', duration: 0.4 },
  { animation: 'scaleIn', duration: 0.2 }
]);
// Generates CSS variables for sequential timing
// --seq-0-delay: 0.00s; --seq-0-duration: 0.30s;
// --seq-1-delay: 0.30s; --seq-1-duration: 0.40s;
// --seq-2-delay: 0.70s; --seq-2-duration: 0.20s;
```

#### Parallel

```typescript
import { parallel } from '@philjs/css';

const parallelAnim = parallel(
  ['fadeIn', 'slideUp', 'scaleIn'],
  { duration: 0.3, delay: 0, easing: 'ease-out' }
);
// 'fadeIn 0.3s ease-out 0s, slideUp 0.3s ease-out 0s, scaleIn 0.3s ease-out 0s'
```

### FLIP Technique

First-Last-Invert-Play for smooth layout animations.

```typescript
import { captureState, playFLIP, batchFLIP } from '@philjs/css';

// Single element FLIP
const element = document.querySelector('.card');

// Capture initial state
const first = captureState(element);

// Make DOM changes
element.classList.add('expanded');

// Capture final state
const last = captureState(element);

// Animate the transition
const animation = playFLIP(element, first, last, {
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
});

// Batch FLIP for multiple elements
const items = document.querySelectorAll('.list-item');

const animations = batchFLIP(
  Array.from(items),
  () => {
    // Reorder items
    items.forEach((item, i) => {
      item.style.order = String(items.length - i);
    });
  },
  { duration: 400 }
);
```

### Motion Presets

Pre-configured animation settings.

```typescript
import { motionPresets, easings } from '@philjs/css';

// Entrance animations
motionPresets.fadeIn;      // { animation: 'fadeIn', duration: 0.3, easing: 'ease-out' }
motionPresets.fadeInUp;
motionPresets.fadeInDown;
motionPresets.slideInLeft;
motionPresets.slideInRight;
motionPresets.slideInUp;
motionPresets.slideInDown;
motionPresets.scaleIn;

// Exit animations
motionPresets.fadeOut;
motionPresets.fadeOutUp;
motionPresets.fadeOutDown;
motionPresets.slideOutLeft;
motionPresets.slideOutRight;
motionPresets.scaleOut;

// Attention animations
motionPresets.bounce;
motionPresets.shake;
motionPresets.pulse;       // iterations: 'infinite'
motionPresets.swing;
motionPresets.wobble;
motionPresets.rubberBand;

// Easing functions
easings.linear;
easings.ease;
easings.easeIn;
easings.easeOut;
easings.easeInOut;
easings.easeInCubic;
easings.easeOutCubic;
easings.easeInOutCubic;
easings.easeInExpo;
easings.easeOutExpo;
easings.easeInBack;
easings.easeOutBack;
easings.elasticOut;
easings.snappy;
easings.smooth;
easings.sharp;
```

### Reduced Motion Support

Respect user preferences for reduced motion.

```typescript
import {
  reducedMotionStyles,
  prefersReducedMotion,
  motionSafe
} from '@philjs/css';

// Generate reduced motion CSS
const reducedCSS = reducedMotionStyles();
// @media (prefers-reduced-motion: reduce) {
//   *, *::before, *::after {
//     animation-duration: 0.01ms !important;
//     animation-iteration-count: 1 !important;
//     transition-duration: 0.01ms !important;
//     scroll-behavior: auto !important;
//   }
// }

// Check user preference
if (prefersReducedMotion()) {
  // Use simpler animations
}

// Create motion-safe animation
const safeAnimation = motionSafe(
  'bounce 0.5s ease-out',
  'fadeIn 0.1s ease-out' // fallback for reduced motion
);
```

### Animation Utilities

Generate animation utility classes.

```typescript
import { generateAllKeyframes, generateAnimationUtilities } from '@philjs/css';

// Generate all standard keyframes
const keyframesCSS = generateAllKeyframes();
// Includes: fade-in, fade-out, slide-up, scale-in, bounce, shake, etc.

// Generate animation utility classes
const utilityCSS = generateAnimationUtilities();
// Duration utilities: .duration-75, .duration-100, .duration-150, ...
// Delay utilities: .delay-75, .delay-100, .delay-150, ...
// Easing utilities: .ease-linear, .ease-in, .ease-out, ...
// Fill utilities: .fill-none, .fill-forwards, .fill-backwards, .fill-both
// Direction utilities: .direction-normal, .direction-reverse, .direction-alternate
// Iteration utilities: .iterate-1, .iterate-2, .iterate-infinite
// Play state utilities: .animate-running, .animate-paused
// Preset animations: .animate-fade-in, .animate-slide-in-left, .animate-bounce, ...
```

---

## Gesture System

Handle touch and pointer gestures with CSS-driven animations.

### attachGestures()

Attach gesture handlers to an element.

```typescript
import { attachGestures } from '@philjs/css';

const cleanup = attachGestures(
  element,
  {
    // Tap gestures
    onTap: (e) => console.log('Tapped!'),
    onDoubleTap: (e) => console.log('Double tapped!'),
    onLongPress: (e) => console.log('Long pressed!'),

    // Swipe gestures
    onSwipe: (e) => console.log(`Swiped ${e.direction}`),
    onSwipeUp: (e) => handleSwipeUp(),
    onSwipeDown: (e) => handleSwipeDown(),
    onSwipeLeft: (e) => handleSwipeLeft(),
    onSwipeRight: (e) => handleSwipeRight(),

    // Pan gestures
    onPanStart: (e) => console.log('Pan started'),
    onPan: (e) => {
      element.style.transform = `translate(${e.offset.x}px, ${e.offset.y}px)`;
    },
    onPanEnd: (e) => console.log('Pan ended'),

    // Multi-touch gestures
    onPinchStart: (e) => console.log('Pinch started'),
    onPinch: (e) => {
      element.style.transform = `scale(${e.scale})`;
    },
    onPinchEnd: (e) => console.log('Pinch ended'),

    onRotateStart: (e) => console.log('Rotate started'),
    onRotate: (e) => {
      element.style.transform = `rotate(${e.rotation}deg)`;
    },
    onRotateEnd: (e) => console.log('Rotate ended')
  },
  {
    // Configuration
    swipe: { threshold: 50, velocity: 0.3, direction: 'all' },
    pinch: { threshold: 0.1, minScale: 0.5, maxScale: 3 },
    pan: { threshold: 10, lockDirection: false },
    tap: { maxDuration: 300, maxDistance: 10, doubleTapDelay: 300 },
    longPress: { duration: 500, maxDistance: 10 }
  }
);

// Clean up when done
cleanup();
```

### Gesture Styles

```typescript
import {
  swipeableStyles,
  draggableStyles,
  zoomableStyles,
  pullToRefreshStyles
} from '@philjs/css';

// Swipeable element styles
const swipeable = swipeableStyles({
  direction: 'horizontal', // 'horizontal' | 'vertical' | 'both'
  threshold: '30%',
  resistance: 0.5
});

// Draggable element styles
const draggable = draggableStyles({
  cursor: 'grab',  // 'grab' | 'move' | 'pointer'
  activeScale: 1.02
});

// Pinch-zoomable element styles
const zoomable = zoomableStyles({
  minScale: 0.5,
  maxScale: 3,
  origin: 'center'
});

// Pull-to-refresh container styles
const pullToRefresh = pullToRefreshStyles({
  threshold: '80px',
  indicatorSize: '40px'
});
```

### Gesture-driven Animations

```typescript
import { createGestureAnimation } from '@philjs/css';

// Bind gesture to CSS property
const cleanup = createGestureAnimation({
  element: document.querySelector('.slider'),
  gesture: 'pan',
  property: 'transform',
  range: [0, 300],
  unit: 'px',
  easing: (t) => t // linear by default
});

cleanup();
```

### Swipe to Dismiss

```typescript
import { swipeToDismiss } from '@philjs/css';

const cleanup = swipeToDismiss(
  document.querySelector('.notification'),
  {
    direction: ['left', 'right'], // or single direction: 'right'
    threshold: 100,
    onDismiss: (direction) => {
      console.log(`Dismissed to ${direction}`);
      // Remove from DOM or handle dismissal
    }
  }
);
```

### Pull to Refresh

```typescript
import { pullToRefresh } from '@philjs/css';

const cleanup = pullToRefresh(
  document.querySelector('.scroll-container'),
  {
    threshold: 80,
    resistance: 0.4,
    onRefresh: async () => {
      await fetchNewData();
      updateUI();
    }
  }
);
```

### Carousel

```typescript
import { createCarousel } from '@philjs/css';

const carousel = createCarousel(
  document.querySelector('.carousel'),
  {
    itemSelector: '.carousel-item',
    infinite: true,
    autoplay: 5000, // 5 seconds
    onChange: (index) => {
      console.log(`Now showing slide ${index}`);
      updateIndicators(index);
    }
  }
);

// Control the carousel
carousel.next();
carousel.prev();
carousel.goTo(3);
console.log(carousel.getCurrentIndex());

// Clean up
carousel.cleanup();
```

### Gesture Presets

```typescript
import { gesturePresets, directionVectors } from '@philjs/css';

// Standard preset (default)
gesturePresets.standard;
// { swipe: { threshold: 50, velocity: 0.3 }, ... }

// Sensitive preset (lower thresholds)
gesturePresets.sensitive;
// { swipe: { threshold: 30, velocity: 0.2 }, ... }

// Strict preset (higher thresholds)
gesturePresets.strict;
// { swipe: { threshold: 80, velocity: 0.5 }, ... }

// Direction vectors for calculations
directionVectors.up;    // { x: 0, y: -1 }
directionVectors.down;  // { x: 0, y: 1 }
directionVectors.left;  // { x: -1, y: 0 }
directionVectors.right; // { x: 1, y: 0 }
```

---

## TypeScript Types

The package exports comprehensive types for full type safety:

```typescript
import type {
  // Core types
  CSSProperties,
  CSSStyleObject,
  CSSResult,

  // Theme types
  Theme,
  ThemeTokens,

  // Variant types
  VariantConfig,
  VariantProps,

  // Atomic types
  AtomicConfig,
  AtomicProperty,

  // Extraction types
  ExtractConfig,
  CSSRule,
  StyleSheet,

  // Responsive types
  ResponsiveValue,

  // Advanced CSS types
  ContainerConfig,
  ContainerQuery,
  LayerName,
  ScopeConfig,
  ViewTransitionConfig,
  ScrollTimelineConfig,
  ViewTimelineConfig,
  AnchorConfig,
  AnchorPositionConfig,

  // Animation types
  SpringConfig,
  AnimationTimeline,
  Keyframe,
  MotionConfig,
  StaggerConfig,
  OrchestrationConfig,
  FLIPState,

  // Gesture types
  Point,
  GestureState,
  Direction,
  GestureType,
  GestureEvent,
  SwipeEvent,
  PinchEvent,
  RotateEvent,
  PanEvent,
  GestureConfig,
  SwipeConfig,
  PinchConfig,
  PanConfig,
  TapConfig,
  LongPressConfig,
  RotateConfig,
  GestureHandler,
  GestureHandlers,

  // Build types
  BuildPlugin,
  BundleStats
} from '@philjs/css';
```

---

## Best Practices

### 1. Use the Theme System

Define your design tokens once and reference them everywhere:

```typescript
const theme = createTheme({
  colors: { primary: '#3b82f6' },
  spacing: { md: '16px' }
});

const button = css({
  backgroundColor: themeVar('colors', 'primary'),
  padding: themeVar('spacing', 'md')
});
```

### 2. Prefer Variants for Component APIs

```typescript
const Button = variants({
  base: { /* ... */ },
  variants: {
    size: { sm: {}, md: {}, lg: {} },
    variant: { primary: {}, secondary: {}, ghost: {} }
  },
  defaultVariants: { size: 'md', variant: 'primary' }
});
```

### 3. Use Atomic Classes for Utility-First Development

```typescript
const atoms = createAtomicSystem({ /* config */ });

// Quick prototyping
<div class={`${atoms.flex} ${atoms.itemsCenter} ${atoms.p4}`}>
```

### 4. Extract CSS at Build Time

```typescript
// vite.config.ts
createVitePlugin({
  outputPath: 'dist/styles.css',
  minify: true
})
```

### 5. Respect Reduced Motion Preferences

```typescript
const animation = css({
  animation: prefersReducedMotion()
    ? 'none'
    : `${fadeIn} 0.3s ease-out`
});

// Or use motionSafe helper
```

### 6. Use FLIP for Layout Animations

```typescript
const first = captureState(element);
updateDOM();
const last = captureState(element);
playFLIP(element, first, last);
```

---

## Related Packages

- `@philjs/core` - Core reactivity system
- `@philjs/motion` - Advanced motion library
- `@philjs/tailwind` - Tailwind CSS integration
- `@philjs/styles` - Additional styling utilities
