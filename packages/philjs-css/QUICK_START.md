# PhilJS CSS - Quick Start Guide

Get started with PhilJS CSS in 5 minutes!

## Installation

```bash
npm install philjs-css
```

## Step 1: Create a Theme (Optional but Recommended)

```typescript
// theme.ts
import { createTheme } from 'philjs-css';

export const theme = createTheme({
  colors: {
    primary: '#3b82f6',
    secondary: '#10b981',
    danger: '#ef4444',
    text: '#111827',
    background: '#ffffff'
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
    xl: '24px'
  }
});
```

## Step 2: Create Your First Component Styles

```typescript
// Button.styles.ts
import { css } from 'philjs-css';
import { theme } from './theme';

export const button = css({
  padding: theme.spacing.md,
  backgroundColor: theme.colors.primary,
  color: 'white',
  fontSize: theme.fontSize.base,
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',

  '&:hover': {
    backgroundColor: '#2563eb',
    transform: 'translateY(-1px)'
  },

  '&:active': {
    transform: 'translateY(0)'
  },

  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
});
```

## Step 3: Use in Your Components

```typescript
// Button.tsx
import { button } from './Button.styles';

export function Button({ children, ...props }) {
  return (
    <button class={button.className} {...props}>
      {children}
    </button>
  );
}

// Or with PhilJS:
export const Button = ({ children, ...props }) => (
  <button class={button.className} {...props}>
    {children}
  </button>
);
```

## Step 4: Build-time Extraction

Add to your build configuration:

### Vite

```typescript
// vite.config.ts
import { createVitePlugin } from 'philjs-css/extract';

export default {
  plugins: [
    createVitePlugin({
      outputPath: 'styles.css',
      minify: true
    })
  ]
};
```

### Manual Extraction

```typescript
// build-css.ts
import { extractToFile } from 'philjs-css';

await extractToFile('./dist/styles.css', {
  minify: true,
  sourceMap: true,
  atomicClasses: true
});
```

## Step 5: Include CSS in Your HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

## Advanced: Component Variants

```typescript
// Button.styles.ts
import { variants } from 'philjs-css';
import { theme } from './theme';

export const button = variants({
  base: {
    padding: theme.spacing.md,
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500
  },
  variants: {
    color: {
      primary: {
        backgroundColor: theme.colors.primary,
        color: 'white'
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
        color: 'white'
      },
      danger: {
        backgroundColor: theme.colors.danger,
        color: 'white'
      }
    },
    size: {
      sm: { padding: '6px 12px', fontSize: '14px' },
      md: { padding: '10px 20px', fontSize: '16px' },
      lg: { padding: '14px 28px', fontSize: '18px' }
    }
  },
  defaultVariants: {
    color: 'primary',
    size: 'md'
  }
});

// Usage
export function Button({ color, size, children, ...props }) {
  return (
    <button class={button({ color, size })} {...props}>
      {children}
    </button>
  );
}

// <Button color="danger" size="lg">Delete</Button>
```

## Advanced: Atomic Utilities

```typescript
// utilities.ts
import { createAtomicSystem } from 'philjs-css';
import { theme } from './theme';

export const atoms = createAtomicSystem({
  spacing: theme.spacing,
  colors: theme.colors,
  fontSize: theme.fontSize
});

// Usage
export function Card({ children }) {
  return (
    <div class={`${atoms.bgWhite} ${atoms.p6} ${atoms.rounded8}`}>
      {children}
    </div>
  );
}
```

## Advanced: Global Styles

```typescript
// global.styles.ts
import { globalStyle } from 'philjs-css';
import { theme } from './theme';

globalStyle('*', {
  margin: 0,
  padding: 0,
  boxSizing: 'border-box'
});

globalStyle('body', {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  color: theme.colors.text,
  backgroundColor: theme.colors.background,
  lineHeight: 1.5
});

globalStyle('a', {
  color: theme.colors.primary,
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline'
  }
});
```

## SSR with Critical CSS

```typescript
// server.ts
import { extractCriticalCSS } from 'philjs-css';

export function renderPage(app) {
  const html = renderToString(app);
  const criticalCSS = extractCriticalCSS(html, { minify: true });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${criticalCSS}</style>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <div id="app">${html}</div>
      </body>
    </html>
  `;
}
```

## Tips

1. **Organize by component**: Keep styles close to components
2. **Use themes**: Centralize design tokens for consistency
3. **Extract at build time**: Zero runtime overhead
4. **Use variants**: For component variations
5. **Use atomic utilities**: For one-off styles
6. **Critical CSS**: For faster first paint in SSR

## Next Steps

- Read the [full documentation](./README.md)
- Check out the [API reference](./API.md)
- Explore [examples](./examples/)
- Learn about [build-time extraction](./examples/build-time-extraction.ts)

## Common Patterns

### Layout Components

```typescript
export const container = css({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: theme.spacing.lg
});

export const flexRow = css({
  display: 'flex',
  gap: theme.spacing.md,
  alignItems: 'center'
});

export const grid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: theme.spacing.lg
});
```

### Responsive Design

```typescript
import { createBreakpoints } from 'philjs-css';

const breakpoints = createBreakpoints(theme.breakpoints);

export const hero = css({
  padding: theme.spacing.lg,
  fontSize: theme.fontSize.xl,

  [breakpoints.md]: {
    padding: theme.spacing.xl,
    fontSize: theme.fontSize['2xl']
  },

  [breakpoints.lg]: {
    padding: '80px',
    fontSize: theme.fontSize['4xl']
  }
});
```

### Animations

```typescript
import { keyframes } from 'philjs-css';

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 }
});

export const modal = css({
  animation: `${fadeIn} 200ms ease-out`,
  backgroundColor: 'white',
  padding: theme.spacing.xl,
  borderRadius: '8px'
});
```

Happy styling!
