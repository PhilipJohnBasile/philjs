# philjs-styles

Scoped styles, CSS Modules, and CSS-in-JS for PhilJS.

## Features

- **Scoped Styles** - Component-scoped CSS with zero conflicts
- **CSS Modules** - Import CSS as JavaScript objects
- **CSS-in-JS** - Runtime and compile-time styling
- **Type Safety** - TypeScript support for CSS
- **SSR Compatible** - Server-side rendering support
- **Vite Plugin** - Optimized Vite integration
- **Theme Support** - Built-in theming utilities
- **No Runtime Overhead** - Optional zero-runtime CSS-in-JS

## Installation

```bash
pnpm add philjs-styles
```

## Quick Start

### Scoped Styles

```typescript
import { css } from 'philjs-styles/scoped';

export default function Button({ children }) {
  const styles = css`
    button {
      background: #3b82f6;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
    }

    button:hover {
      background: #2563eb;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <button>{children}</button>
    </>
  );
}
```

### CSS Modules

Create `Button.module.css`:

```css
.button {
  background: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
}

.button:hover {
  background: #2563eb;
}

.primary {
  background: #3b82f6;
}

.secondary {
  background: #8b5cf6;
}
```

Use in component:

```typescript
import styles from './Button.module.css';

export default function Button({ variant = 'primary', children }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
}
```

### CSS-in-JS

```typescript
import { styled } from 'philjs-styles/css-in-js';

const Button = styled('button', {
  base: {
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  variants: {
    variant: {
      primary: {
        background: '#3b82f6',
        color: 'white',
        '&:hover': {
          background: '#2563eb'
        }
      },
      secondary: {
        background: '#8b5cf6',
        color: 'white',
        '&:hover': {
          background: '#7c3aed'
        }
      }
    },
    size: {
      sm: { padding: '0.25rem 0.5rem', fontSize: '0.875rem' },
      md: { padding: '0.5rem 1rem', fontSize: '1rem' },
      lg: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' }
    }
  }
});

// Usage
<Button variant="primary" size="lg">Click me</Button>
```

## Vite Plugin

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import philjs from 'philjs-cli/vite';
import styles from 'philjs-styles/vite';

export default defineConfig({
  plugins: [
    philjs(),
    styles({
      modules: true,        // Enable CSS Modules
      scoped: true,         // Enable scoped styles
      cssInJs: 'compile'    // 'compile' or 'runtime'
    })
  ]
});
```

## Theming

```typescript
import { createTheme, ThemeProvider } from 'philjs-styles/css-in-js';

const theme = createTheme({
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    error: '#ef4444'
  },
  spacing: {
    sm: '0.5rem',
    md: '1rem',
    lg: '2rem'
  },
  fonts: {
    body: 'system-ui, sans-serif',
    mono: 'monospace'
  }
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <YourApp />
    </ThemeProvider>
  );
}
```

Use theme in components:

```typescript
import { styled, useTheme } from 'philjs-styles/css-in-js';

const Button = styled('button', ({ theme }) => ({
  background: theme.colors.primary,
  padding: theme.spacing.md,
  fontFamily: theme.fonts.body
}));
```

## Documentation

For more information, see the [PhilJS documentation](../../docs).

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./css-modules, ./scoped, ./css-in-js, ./vite
- Source files: packages/philjs-styles/src/index.ts, packages/philjs-styles/src/css-modules.ts, packages/philjs-styles/src/scoped.ts, packages/philjs-styles/src/css-in-js.ts

### Public API
- Direct exports: CSSModuleClasses, ThemeProvider, bindStyles, createClassNames, createGlobalStyle, createStyled, createTheme, css, cssModules, cva, getCSSModuleConfig, importCSSModule, keyframes, setTheme, styled, subscribeToTheme, useCSSModule, useTheme
- Re-exported names: CSSProperties, StyleObject, StyleVariant, Theme, ThemeConfig, ThemeProvider, bindStyles, classNames, clsx, createGlobalStyle, createStyled, createTheme, css, cssModules, cx, extractCriticalCSS, injectStyles, keyframes, mergeStyles, philjsStylesPlugin, styled, useCSSModule, useTheme
- Re-exported modules: ./css-in-js.js, ./css-modules.js, ./scoped.js, ./types.js, ./utils.js, ./vite-plugin.js
<!-- API_SNAPSHOT_END -->

## License

MIT
