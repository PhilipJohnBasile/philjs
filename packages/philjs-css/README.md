# PhilJS CSS

Type-safe CSS-in-TypeScript solution with zero runtime overhead. Write your styles in TypeScript with full type safety, and extract them to static CSS at build time.

## Features

- **Type-Safe CSS** - Full TypeScript type safety for CSS properties
- **Theme Tokens** - Type-safe design tokens for colors, spacing, typography, and more
- **Atomic Classes** - Generate atomic utility classes with type inference
- **CSS Variables** - Type-safe CSS custom properties
- **Media Queries** - Type-safe responsive breakpoints
- **Pseudo Selectors** - Full support for hover, focus, active, and more
- **Variants** - Compound variants system (like Stitches/CVA)
- **Zero Runtime** - All CSS extracted at build time for optimal performance

## Installation

```bash
npm install philjs-css
```

## Quick Start

### Basic Usage

```typescript
import { css } from 'philjs-css';

const button = css({
  padding: '10px 20px',
  backgroundColor: '#3b82f6',
  color: 'white',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',

  '&:hover': {
    backgroundColor: '#2563eb'
  },

  '&:active': {
    transform: 'scale(0.98)'
  }
});

// Use in your components
<button class={button}>Click me</button>
```

### Theme System

Create a type-safe theme with design tokens:

```typescript
import { createTheme } from 'philjs-css';

const theme = createTheme({
  colors: {
    primary: '#3b82f6',
    secondary: '#10b981',
    danger: '#ef4444',
    background: '#ffffff',
    text: '#1f2937'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  fontSize: {
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '24px',
    '2xl': '32px'
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
});

// Use theme tokens in styles
const button = css({
  padding: theme.spacing.md,
  backgroundColor: theme.colors.primary,
  fontSize: theme.fontSize.base,
  fontWeight: theme.fontWeight.semibold,

  '&:hover': {
    backgroundColor: theme.colors.secondary
  }
});
```

### Variants System

Create components with variants (similar to Stitches or CVA):

```typescript
import { variants } from 'philjs-css';

const button = variants({
  base: {
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500
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
<button class={button({ outline: true })}>Outline</button>
```

### Atomic Utilities

Generate type-safe atomic utility classes:

```typescript
import { createAtomicSystem } from 'philjs-css';

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
  }
});

// Usage
<div class={`${atoms.flex} ${atoms.itemsCenter} ${atoms.justifyBetween} ${atoms.p4}`}>
  <span class={`${atoms.textLg} ${atoms.fontBold} ${atoms.textBlue}`}>Title</span>
  <button class={`${atoms.bgRed} ${atoms.textSm} ${atoms.p2}`}>Delete</button>
</div>
```

### Responsive Design

Use breakpoints for responsive styles:

```typescript
import { css, createBreakpoints } from 'philjs-css';

const breakpoints = createBreakpoints({
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px'
});

const container = css({
  width: '100%',
  padding: '16px',

  [breakpoints.md]: {
    width: '768px',
    margin: '0 auto',
    padding: '24px'
  },

  [breakpoints.lg]: {
    width: '1024px',
    padding: '32px'
  }
});
```

### Keyframe Animations

Create reusable animations:

```typescript
import { keyframes, css } from 'philjs-css';

const fadeIn = keyframes({
  from: { opacity: 0, transform: 'translateY(10px)' },
  to: { opacity: 1, transform: 'translateY(0)' }
});

const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' }
});

const animatedBox = css({
  animation: `${fadeIn} 300ms ease-out`,

  '&:hover': {
    animation: `${spin} 1s linear infinite`
  }
});
```

### Global Styles

Define global styles for your application:

```typescript
import { globalStyle } from 'philjs-css';

globalStyle('*', {
  margin: 0,
  padding: 0,
  boxSizing: 'border-box'
});

globalStyle('body', {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  lineHeight: 1.5,
  color: '#1f2937',
  backgroundColor: '#ffffff'
});

globalStyle('a', {
  color: '#3b82f6',
  textDecoration: 'none',

  '&:hover': {
    textDecoration: 'underline'
  }
});
```

### Slot-Based Variants

Create complex components with multiple styled parts:

```typescript
import { slotVariants } from 'philjs-css';

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
    },
    elevated: {
      true: {
        root: { boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }
      }
    }
  },
  defaultVariants: {
    size: 'sm'
  }
});

// Usage
const classes = card({ size: 'lg', elevated: true });

<div class={classes.root}>
  <div class={classes.header}>Card Title</div>
  <div class={classes.body}>Card content goes here</div>
  <div class={classes.footer}>Footer content</div>
</div>
```

### CSS Extraction

Extract all CSS to a static file at build time:

```typescript
import { extractCSS } from 'philjs-css';

// Extract all CSS
const css = extractCSS({
  minify: true,
  sourceMap: true,
  atomicClasses: true
});

// Write to file
import { extractToFile } from 'philjs-css';

await extractToFile('./dist/styles.css', {
  minify: true,
  sourceMap: true
});
```

### Build Tool Integration

#### Vite

```typescript
// vite.config.ts
import { createVitePlugin } from 'philjs-css/extract';

export default {
  plugins: [
    createVitePlugin({
      outputPath: 'styles.css',
      minify: true,
      sourceMap: true,
      atomicClasses: true
    })
  ]
};
```

#### Rollup

```typescript
// rollup.config.js
import { createRollupPlugin } from 'philjs-css/extract';

export default {
  plugins: [
    createRollupPlugin({
      outputPath: './dist/styles.css',
      minify: true
    })
  ]
};
```

#### Webpack

```typescript
// webpack.config.js
const { createWebpackPlugin } = require('philjs-css/extract');

module.exports = {
  plugins: [
    createWebpackPlugin({
      outputPath: 'styles.css',
      minify: true
    })
  ]
};
```

### Critical CSS for SSR

Extract only the CSS used in the current HTML for faster first paint:

```typescript
import { extractCriticalCSS } from 'philjs-css';

const html = renderToString(<App />);
const criticalCSS = extractCriticalCSS(html, { minify: true });

const htmlWithCSS = `
<!DOCTYPE html>
<html>
  <head>
    <style>${criticalCSS}</style>
  </head>
  <body>${html}</body>
</html>
`;
```

## Advanced Features

### Composing Styles

```typescript
import { css, compose } from 'philjs-css';

const base = css({ padding: '10px', borderRadius: '4px' });
const primary = css({ backgroundColor: 'blue', color: 'white' });
const large = css({ padding: '20px', fontSize: '18px' });

// Compose multiple styles
const button = compose(base, primary, large);
```

### Conditional Classes

```typescript
import { cx } from 'philjs-css';

const className = cx(
  'base-class',
  isActive && 'active',
  isDisabled && 'disabled',
  isPrimary ? 'primary' : 'secondary'
);
```

### Style Factory

Create reusable style factories with defaults:

```typescript
import { styleFactory } from 'philjs-css';

const createButton = styleFactory({
  padding: '10px 20px',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer'
});

const primaryButton = createButton({
  backgroundColor: 'blue',
  color: 'white'
});

const secondaryButton = createButton({
  backgroundColor: 'gray',
  color: 'black'
});
```

### Batch Style Creation

```typescript
import { createStyles } from 'philjs-css';

const styles = createStyles({
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px'
  },
  content: {
    lineHeight: 1.6,
    color: '#333'
  }
});

// Use like: styles.container, styles.header, styles.content
```

### Theme Variants (Dark Mode)

```typescript
import { createTheme, createThemeVariant } from 'philjs-css';

const lightTheme = createTheme({
  colors: {
    background: '#ffffff',
    text: '#000000',
    primary: '#3b82f6'
  }
});

const darkTheme = createThemeVariant(lightTheme, 'dark', {
  colors: {
    background: '#1f2937',
    text: '#ffffff',
    primary: '#60a5fa'
  }
});
```

## Bundle Analysis

Analyze your CSS bundle to optimize for size:

```typescript
import { analyzeCSSBundle } from 'philjs-css';

const stats = analyzeCSSBundle();

console.log(`Total size: ${stats.totalSize} bytes`);
console.log(`Minified: ${stats.minifiedSize} bytes`);
console.log(`Gzipped (est): ${stats.gzipSize} bytes`);
console.log(`Classes: ${stats.classCount}`);
console.log(`Rules: ${stats.ruleCount}`);
console.log(`Theme vars: ${stats.themeVars}`);
```

## TypeScript Support

PhilJS CSS is written in TypeScript and provides full type safety:

```typescript
import { css, type CSSStyleObject } from 'philjs-css';

// Type-safe style objects
const styles: CSSStyleObject = {
  display: 'flex', // ✅ Valid
  flexDirection: 'row', // ✅ Valid
  // flexDirection: 'invalid', // ❌ Type error
};

// Type-safe theme tokens
const theme = createTheme({
  colors: { primary: '#000' }
});

// Autocomplete works
theme.colors.primary; // ✅ Autocomplete available
// theme.colors.invalid; // ❌ Type error
```

## Performance

PhilJS CSS is designed for zero runtime overhead:

- **Build-time extraction** - All CSS is generated at build time
- **Minimal bundle size** - No runtime CSS-in-JS library in your bundle
- **Atomic CSS** - Reuse styles to minimize CSS output
- **Critical CSS** - Extract only what's needed for SSR
- **Minification** - Built-in CSS minification support

## Migration Guide

### From Emotion/Styled-Components

```typescript
// Before (Emotion)
import { css } from '@emotion/react';

const button = css`
  padding: 10px 20px;
  background-color: blue;
`;

// After (PhilJS CSS)
import { css } from 'philjs-css';

const button = css({
  padding: '10px 20px',
  backgroundColor: 'blue'
});
```

### From Tailwind CSS

```typescript
// Before (Tailwind)
<div class="flex items-center justify-between p-4 bg-blue-500 text-white">

// After (PhilJS CSS with atomic utilities)
import { createAtomicSystem } from 'philjs-css';

const atoms = createAtomicSystem({...});

<div class={`${atoms.flex} ${atoms.itemsCenter} ${atoms.justifyBetween} ${atoms.p4} ${atoms.bgBlue} ${atoms.textWhite}`}>
```

### From Stitches

```typescript
// Before (Stitches)
import { styled } from '@stitches/react';

const Button = styled('button', {
  variants: {
    color: {
      primary: { bg: 'blue' },
      secondary: { bg: 'gray' }
    }
  }
});

// After (PhilJS CSS)
import { variants } from 'philjs-css';

const button = variants({
  variants: {
    color: {
      primary: { backgroundColor: 'blue' },
      secondary: { backgroundColor: 'gray' }
    }
  }
});
```

## API Reference

See the [full API documentation](./docs/api.md) for detailed information on all available functions and types.

## License

MIT

## Contributing

Contributions are welcome! Please read our [contributing guide](../../CONTRIBUTING.md) for details.
