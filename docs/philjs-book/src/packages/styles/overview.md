# @philjs/styles - Complete Reference

The `@philjs/styles` package is a comprehensive styling solution for PhilJS applications, offering three distinct approaches to styling: Scoped CSS (Svelte-style), CSS Modules, and CSS-in-JS. Choose the approach that best fits your project's needs or combine them for maximum flexibility.

## Installation

```bash
npm install @philjs/styles
# or
pnpm add @philjs/styles
# or
bun add @philjs/styles
```

## Package Exports

The styles package provides multiple submodule exports for tree-shaking optimization:

| Export | Description |
|--------|-------------|
| `@philjs/styles` | Main entry point with all exports |
| `@philjs/styles/scoped` | Scoped CSS utilities (css, styled, keyframes) |
| `@philjs/styles/css-modules` | CSS Modules helpers |
| `@philjs/styles/css-in-js` | CSS-in-JS with theming |
| `@philjs/styles/vite` | Vite plugin for build optimization |

## Quick Start

```tsx
import { css, styled, keyframes } from '@philjs/styles';
import { createTheme, ThemeProvider } from '@philjs/styles/css-in-js';

// Scoped CSS
const buttonClass = css`
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background: blue;
  color: white;
`;

// Styled component
const Button = styled('button', {
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  backgroundColor: 'blue',
  color: 'white',
});

// With theming
const theme = createTheme({
  themes: {
    light: { colors: { primary: '#3b82f6' } },
    dark: { colors: { primary: '#60a5fa' } },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <button class={buttonClass}>Scoped CSS</button>
      <Button>Styled Component</Button>
    </ThemeProvider>
  );
}
```

## Architecture

```
@philjs/styles
├── Scoped CSS (Svelte-style)
│   ├── css``           - Template literal scoped styles
│   ├── styled()        - Styled component factory
│   ├── keyframes()     - Animation keyframes
│   ├── createGlobalStyle() - Global styles injection
│   └── cva()           - Variant-based styling (CVA/Stitches)
│
├── CSS Modules
│   ├── cssModules()    - CSS Module helper with compose
│   ├── useCSSModule()  - Hook for component usage
│   ├── bindStyles()    - Bind styles with cx helper
│   ├── createClassNames() - Conditional class names
│   └── getCSSModuleConfig() - Build tool configuration
│
├── CSS-in-JS
│   ├── createStyled()  - Themed styled component factory
│   ├── createTheme()   - Theme configuration
│   ├── useTheme()      - Access current theme
│   ├── ThemeProvider   - Theme context provider
│   └── setTheme()      - Runtime theme switching
│
├── Utilities
│   ├── cx/clsx/classNames - Class name utilities
│   ├── mergeStyles()   - Merge style objects
│   ├── extractCriticalCSS() - SSR critical CSS
│   ├── injectStyles()  - Runtime style injection
│   ├── cssVar()        - CSS variable helper
│   ├── media()         - Media query helper
│   ├── responsive()    - Responsive styles helper
│   └── hover/focus/active/disabled - State helpers
│
└── Vite Plugin
    ├── CSS scoping     - Automatic class scoping
    ├── CSS extraction  - Critical CSS extraction
    └── Template transforms - css`` optimization
```

---

## Approach 1: Scoped CSS (Svelte-style)

Scoped CSS provides automatic class name generation and style isolation, similar to Svelte's approach. Styles are scoped to prevent leakage between components.

### css`` Template Literal

The `css` template literal creates scoped styles with automatically generated class names:

```tsx
import { css } from '@philjs/styles';

// Basic usage - returns a scoped class name
const cardClass = css`
  padding: 1.5rem;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h2 {
    margin: 0 0 1rem;
    font-size: 1.25rem;
  }

  p {
    color: #666;
    line-height: 1.5;
  }
`;

function Card(props: { title: string; children: any }) {
  return (
    <div class={cardClass}>
      <h2>{props.title}</h2>
      <p>{props.children}</p>
    </div>
  );
}
```

### Dynamic Values in css``

You can interpolate dynamic values in your CSS:

```tsx
import { css } from '@philjs/styles';

const theme = {
  primary: '#3b82f6',
  radius: '8px',
};

const buttonClass = css`
  background-color: ${theme.primary};
  border-radius: ${theme.radius};
  padding: 0.5rem 1rem;
  color: white;
  border: none;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;
```

### Global Styles with :global

Escape scoping when needed using `:global`:

```tsx
const containerClass = css`
  padding: 1rem;

  /* This selector will NOT be scoped */
  :global(body) {
    margin: 0;
    font-family: system-ui, sans-serif;
  }

  /* Scoped styles continue normally */
  .content {
    max-width: 800px;
    margin: 0 auto;
  }
`;
```

### styled() Component Factory

Create styled components with object syntax:

```tsx
import { styled } from '@philjs/styles';

// Basic styled component
const Button = styled('button', {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.5rem 1rem',
  fontSize: '1rem',
  fontWeight: 500,
  borderRadius: '6px',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
});

// With dynamic props
interface CardProps {
  elevated?: boolean;
}

const Card = styled<CardProps>('div', (props) => ({
  padding: '1.5rem',
  borderRadius: '8px',
  background: 'white',
  boxShadow: props.elevated
    ? '0 10px 25px rgba(0, 0, 0, 0.15)'
    : '0 2px 4px rgba(0, 0, 0, 0.1)',
}));

// Usage
function App() {
  return (
    <div>
      <Button>Click me</Button>
      <Card elevated>
        <h2>Elevated Card</h2>
        <p>With shadow</p>
      </Card>
    </div>
  );
}
```

### Extending Styled Components

Compose styled components by wrapping existing ones:

```tsx
import { styled } from '@philjs/styles';

const BaseButton = styled('button', {
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
});

const PrimaryButton = styled(BaseButton, {
  backgroundColor: '#3b82f6',
  color: 'white',
});

const DangerButton = styled(BaseButton, {
  backgroundColor: '#ef4444',
  color: 'white',
});
```

### keyframes() for Animations

Define CSS keyframe animations:

```tsx
import { css, keyframes } from '@philjs/styles';

// Define the animation
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

// Use in styles
const modalClass = css`
  animation: ${fadeIn} 0.3s ease-out;
  padding: 2rem;
  background: white;
  border-radius: 8px;
`;

const heartClass = css`
  animation: ${pulse} 1s ease-in-out infinite;
  color: red;
  font-size: 2rem;
`;
```

### createGlobalStyle() for Global Styles

Inject global styles that affect the entire document:

```tsx
import { createGlobalStyle } from '@philjs/styles';

const GlobalStyles = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    line-height: 1.5;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, sans-serif;
    background-color: #f5f5f5;
    color: #333;
  }

  a {
    color: #3b82f6;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`;

function App() {
  return (
    <>
      <GlobalStyles />
      <main>Your app content</main>
    </>
  );
}
```

### cva() - Variant-Based Styling

Create component variants similar to Stitches or class-variance-authority (CVA):

```tsx
import { cva } from '@philjs/styles/scoped';

// Define button variants
const button = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  variants: {
    intent: {
      primary: {
        backgroundColor: '#3b82f6',
        color: 'white',
      },
      secondary: {
        backgroundColor: '#e5e7eb',
        color: '#374151',
      },
      danger: {
        backgroundColor: '#ef4444',
        color: 'white',
      },
    },
    size: {
      sm: {
        padding: '0.25rem 0.75rem',
        fontSize: '0.875rem',
      },
      md: {
        padding: '0.5rem 1rem',
        fontSize: '1rem',
      },
      lg: {
        padding: '0.75rem 1.5rem',
        fontSize: '1.125rem',
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
  },
  compoundVariants: [
    {
      intent: 'primary',
      disabled: true,
      css: {
        backgroundColor: '#93c5fd',
      },
    },
  ],
  defaultVariants: {
    intent: 'primary',
    size: 'md',
  },
});

// Usage
function Button(props: {
  intent?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: any;
}) {
  const className = button({
    intent: props.intent,
    size: props.size,
    disabled: props.disabled,
  });

  return (
    <button class={className} disabled={props.disabled}>
      {props.children}
    </button>
  );
}

// Example usage
<Button intent="primary" size="lg">Large Primary</Button>
<Button intent="danger" size="sm">Small Danger</Button>
<Button disabled>Disabled Button</Button>
```

---

## Approach 2: CSS Modules

CSS Modules provide locally-scoped CSS with compile-time class name generation. This approach works with standard `.module.css` files.

### Basic CSS Modules Usage

```css
/* Button.module.css */
.button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.primary {
  background-color: #3b82f6;
  color: white;
}

.secondary {
  background-color: #e5e7eb;
  color: #374151;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

```tsx
import { cssModules } from '@philjs/styles';
import styles from './Button.module.css';

// Wrap with cssModules for enhanced functionality
const s = cssModules(styles);

function Button(props: {
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  children: any;
}) {
  // Use compose for conditional class names
  const className = s.compose(
    'button',
    props.variant || 'primary',
    props.disabled && 'disabled'
  );

  return (
    <button class={className} disabled={props.disabled}>
      {props.children}
    </button>
  );
}
```

### useCSSModule() Hook

A hook-based approach for using CSS Modules in components:

```tsx
import { useCSSModule } from '@philjs/styles';
import styles from './Card.module.css';

function Card(props: {
  elevated?: boolean;
  title: string;
  children: any;
}) {
  const { styles: s, cx, getClass } = useCSSModule(styles);

  return (
    <div class={cx('card', props.elevated && 'elevated')}>
      <h2 class={getClass('title')}>{props.title}</h2>
      <div class={s.content}>
        {props.children}
      </div>
    </div>
  );
}
```

### bindStyles() for Simple Binding

Bind CSS Module styles with an integrated `cx` helper:

```tsx
import { bindStyles } from '@philjs/styles';
import rawStyles from './Alert.module.css';

const styles = bindStyles(rawStyles);

function Alert(props: {
  type: 'info' | 'warning' | 'error' | 'success';
  children: any;
}) {
  return (
    <div class={styles.cx('alert', props.type)}>
      <span class={styles.icon} />
      <p class={styles.message}>{props.children}</p>
    </div>
  );
}
```

### createClassNames() for Conditional Classes

Create conditional class name generators from CSS Modules:

```tsx
import { createClassNames } from '@philjs/styles';
import styles from './Form.module.css';

const cn = createClassNames(styles);

function FormField(props: {
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  children: any;
}) {
  // Object syntax - keys are class names, values are conditions
  const fieldClass = cn({
    field: true,
    error: !!props.error && props.touched,
    disabled: props.disabled,
  });

  // Or array syntax for simple lists
  const labelClass = cn(['label', 'required']);

  return (
    <div class={fieldClass}>
      <label class={labelClass}>{props.children}</label>
      {props.error && props.touched && (
        <span class={styles.errorMessage}>{props.error}</span>
      )}
    </div>
  );
}
```

### CSS Module Configuration

Configure CSS Modules for your build tool:

```tsx
import { getCSSModuleConfig } from '@philjs/styles';

const config = getCSSModuleConfig({
  scopeBehaviour: 'local',
  localIdentName: '[name]__[local]__[hash:base64:5]',
  exportLocalsConvention: 'camelCaseOnly',
});

// Use in Vite config
export default {
  css: config.vite.css,
};

// Or Webpack
module.exports = {
  module: {
    rules: [{
      test: /\.module\.css$/,
      use: [{
        loader: 'css-loader',
        options: config.webpack,
      }],
    }],
  },
};
```

### Type-Safe CSS Module Imports

For async CSS Module imports with type safety:

```tsx
import { importCSSModule } from '@philjs/styles';

// Async import with type inference
const styles = await importCSSModule(
  import('./DynamicComponent.module.css')
);

function DynamicComponent() {
  return <div class={styles.container}>Loaded dynamically!</div>;
}
```

---

## Approach 3: CSS-in-JS with Theming

Full runtime CSS-in-JS with comprehensive theming support, CSS variables, and dynamic styling.

### Theme Configuration

Create and configure themes with type-safe tokens:

```tsx
import { createTheme, ThemeProvider } from '@philjs/styles/css-in-js';

// Create a theme with light and dark variants
const theme = createTheme({
  defaultTheme: 'light',
  themes: {
    light: {
      colors: {
        primary: '#3b82f6',
        secondary: '#6366f1',
        accent: '#8b5cf6',
        background: '#ffffff',
        foreground: '#0f172a',
        muted: '#f1f5f9',
        mutedForeground: '#64748b',
        border: '#e2e8f0',
        error: '#ef4444',
        warning: '#f59e0b',
        success: '#22c55e',
        info: '#3b82f6',
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
      },
      borderRadius: {
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        full: '9999px',
      },
    },
    dark: {
      colors: {
        primary: '#60a5fa',
        secondary: '#818cf8',
        accent: '#a78bfa',
        background: '#0f172a',
        foreground: '#f8fafc',
        muted: '#1e293b',
        mutedForeground: '#94a3b8',
        border: '#334155',
        error: '#f87171',
        warning: '#fbbf24',
        success: '#4ade80',
        info: '#60a5fa',
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <YourAppContent />
    </ThemeProvider>
  );
}
```

### Default Theme Tokens

The package provides a comprehensive default theme:

```tsx
const defaultTheme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#6366f1',
    accent: '#8b5cf6',
    background: '#ffffff',
    foreground: '#0f172a',
    muted: '#f1f5f9',
    mutedForeground: '#64748b',
    border: '#e2e8f0',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#22c55e',
    info: '#3b82f6',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  fontWeight: {
    thin: 100,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
};
```

### useTheme() Hook

Access the current theme in components:

```tsx
import { useTheme } from '@philjs/styles/css-in-js';

function ThemedCard(props: { children: any }) {
  const theme = useTheme();

  return (
    <div style={{
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background,
      color: theme.colors.foreground,
      borderRadius: theme.borderRadius.lg,
      boxShadow: theme.shadows.md,
    }}>
      {props.children}
    </div>
  );
}
```

### createStyled() with Theme Access

Create styled components with theme access:

```tsx
import { createStyled } from '@philjs/styles/css-in-js';

// Create a styled factory for a tag
const styledButton = createStyled('button');
const styledDiv = createStyled('div');

// Use the factory with theme access
const PrimaryButton = styledButton((props) => ({
  padding: `${props.theme.spacing.sm} ${props.theme.spacing.md}`,
  backgroundColor: props.theme.colors.primary,
  color: 'white',
  border: 'none',
  borderRadius: props.theme.borderRadius.md,
  fontSize: props.theme.fontSize.base,
  fontWeight: props.theme.fontWeight.medium,
  cursor: 'pointer',
  transition: props.theme.transitions.fast,
  '&:hover': {
    opacity: 0.9,
  },
}));

const Card = styledDiv((props) => ({
  padding: props.theme.spacing.lg,
  backgroundColor: props.theme.colors.background,
  borderRadius: props.theme.borderRadius.lg,
  boxShadow: props.theme.shadows.md,
  border: `1px solid ${props.theme.colors.border}`,
}));

// Usage
function App() {
  return (
    <Card>
      <h2>Card Title</h2>
      <PrimaryButton>Click Me</PrimaryButton>
    </Card>
  );
}
```

### Runtime Theme Switching

Switch themes at runtime:

```tsx
import { setTheme, useTheme, subscribeToTheme } from '@philjs/styles/css-in-js';

function ThemeToggle() {
  const theme = useTheme();
  const isDark = theme.colors.background === '#0f172a';

  const toggleTheme = () => {
    setTheme({
      colors: isDark ? {
        background: '#ffffff',
        foreground: '#0f172a',
        primary: '#3b82f6',
      } : {
        background: '#0f172a',
        foreground: '#f8fafc',
        primary: '#60a5fa',
      },
    });
  };

  return (
    <button onClick={toggleTheme}>
      {isDark ? 'Switch to Light' : 'Switch to Dark'}
    </button>
  );
}

// Subscribe to theme changes
const unsubscribe = subscribeToTheme((newTheme) => {
  console.log('Theme changed:', newTheme.colors.primary);
});

// Later: unsubscribe when done
unsubscribe();
```

### CSS Variables from Theme

The theme automatically generates CSS custom properties:

```css
/* Automatically generated CSS variables */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #6366f1;
  --color-background: #ffffff;
  --color-foreground: #0f172a;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --font-size-base: 1rem;
  --radius-md: 0.375rem;
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  /* ... and more */
}
```

Use them in your CSS:

```tsx
import { css, cssVar } from '@philjs/styles';

const buttonClass = css`
  background-color: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  color: white;
`;

// Or use the cssVar helper
const cardStyles = {
  backgroundColor: cssVar('color-background'),
  padding: cssVar('spacing-lg'),
  borderRadius: cssVar('radius-lg'),
  boxShadow: cssVar('shadow-md'),
};
```

---

## Utility Functions

### cx/clsx/classNames - Class Name Utilities

Combine class names conditionally:

```tsx
import { cx, clsx, classNames } from '@philjs/styles';

// All three are aliases for the same function
const buttonClass = cx(
  'btn',
  'btn-primary',
  isLarge && 'btn-lg',
  isDisabled && 'btn-disabled',
  { 'btn-loading': isLoading }
);

// Object syntax
const cardClass = clsx({
  card: true,
  'card-elevated': elevated,
  'card-bordered': bordered,
});

// Mixed usage
const className = classNames(
  'base-class',
  condition && 'conditional-class',
  { 'object-class': true, 'skipped-class': false }
);
```

### mergeStyles() - Merge Style Objects

Combine multiple style objects:

```tsx
import { mergeStyles } from '@philjs/styles';

const baseStyles = {
  padding: '1rem',
  borderRadius: '4px',
};

const primaryStyles = {
  backgroundColor: '#3b82f6',
  color: 'white',
};

const hoverStyles = {
  opacity: 0.9,
};

const combinedStyles = mergeStyles(
  baseStyles,
  primaryStyles,
  isHovered && hoverStyles
);
```

### State Helpers

Helpers for common pseudo-state styles:

```tsx
import { hover, focus, active, disabled, media, responsive } from '@philjs/styles';

const buttonStyles = {
  padding: '0.5rem 1rem',
  backgroundColor: '#3b82f6',
  color: 'white',

  // State helpers
  ...hover({
    backgroundColor: '#2563eb',
  }),

  ...focus({
    outline: '2px solid #93c5fd',
    outlineOffset: '2px',
  }),

  ...active({
    transform: 'scale(0.98)',
  }),

  ...disabled({
    opacity: 0.5,
    cursor: 'not-allowed',
  }),
};

// Media query helper
const responsiveStyles = {
  padding: '0.5rem',

  ...media('768px', {
    padding: '1rem',
  }),

  ...media('1024px', {
    padding: '1.5rem',
  }),
};

// Or use responsive helper
const cardStyles = responsive({
  base: { padding: '0.5rem' },
  sm: { padding: '0.75rem' },
  md: { padding: '1rem' },
  lg: { padding: '1.5rem' },
  xl: { padding: '2rem' },
});
```

### extractCriticalCSS() - SSR Support

Extract critical CSS for server-side rendering:

```tsx
import { extractCriticalCSS, injectStyles } from '@philjs/styles';

// Server-side: Extract all injected styles
const criticalCSS = extractCriticalCSS();

// Include in your HTML response
const html = `
<!DOCTYPE html>
<html>
  <head>
    <style id="critical-css">${criticalCSS}</style>
  </head>
  <body>
    ${appHtml}
  </body>
</html>
`;
```

---

## Vite Plugin

The `@philjs/styles/vite` plugin provides build-time optimization for CSS scoping and extraction.

### Basic Configuration

```tsx
// vite.config.ts
import { defineConfig } from 'vite';
import { philjsStylesPlugin } from '@philjs/styles/vite';

export default defineConfig({
  plugins: [
    philjsStylesPlugin({
      // Enable CSS scoping (default: true)
      scoping: true,

      // CSS Modules configuration
      cssModules: {
        scopeBehaviour: 'local',
        localsConvention: 'camelCaseOnly',
      },

      // Extract critical CSS for SSR (default: false)
      extractCritical: true,

      // Class name prefix (default: 'philjs')
      classPrefix: 'philjs',
    }),
  ],
});
```

### Plugin Features

1. **Automatic CSS Scoping**: Transforms `.philjs.css` files with automatic class scoping
2. **Template Transforms**: Optimizes `css``` tagged template literals at build time
3. **Critical CSS Extraction**: Extracts critical CSS to a separate file for SSR
4. **CSS Modules Integration**: Configures CSS Modules with consistent settings

### Using .philjs.css Files

Create scoped CSS files:

```css
/* Button.philjs.css */
button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

button:hover {
  opacity: 0.9;
}

.primary {
  background-color: #3b82f6;
  color: white;
}
```

Import and use in components:

```tsx
import scopedClass from './Button.philjs.css';

function Button(props: { children: any }) {
  return (
    <button class={scopedClass}>
      {props.children}
    </button>
  );
}
```

### Build Output

With `extractCritical: true`, the plugin emits a `critical.css` file:

```
dist/
├── assets/
│   ├── index.js
│   └── index.css
└── critical.css    # Critical CSS for SSR
```

---

## API Reference

### Scoped CSS

| Function | Description |
|----------|-------------|
| `css\`...\`` | Create scoped CSS from template literal, returns class name |
| `styled(tag, styles)` | Create a styled component |
| `keyframes\`...\`` | Create keyframe animation, returns animation name |
| `createGlobalStyle\`...\`` | Create global styles component |
| `cva(config)` | Create variant-based style function |

### CSS Modules

| Function | Description |
|----------|-------------|
| `cssModules(styles)` | Wrap CSS Module with compose helper |
| `useCSSModule(styles)` | Hook for CSS Module usage with cx helper |
| `bindStyles(styles)` | Bind styles with integrated cx |
| `createClassNames(styles)` | Create conditional class name generator |
| `getCSSModuleConfig(options)` | Get build tool configuration |
| `importCSSModule(promise)` | Type-safe async CSS Module import |

### CSS-in-JS

| Function | Description |
|----------|-------------|
| `createTheme(config)` | Create theme configuration |
| `useTheme()` | Get current theme |
| `setTheme(theme)` | Update current theme |
| `subscribeToTheme(callback)` | Subscribe to theme changes |
| `ThemeProvider` | Theme context provider component |
| `createStyled(tag)` | Create styled component factory with theme |

### Utilities

| Function | Description |
|----------|-------------|
| `cx(...args)` / `clsx` / `classNames` | Combine class names |
| `mergeStyles(...styles)` | Merge style objects |
| `extractCriticalCSS()` | Extract injected styles for SSR |
| `injectStyles(css, id)` | Inject styles into document |
| `removeStyles(id)` | Remove injected styles |
| `cssVar(name, fallback?)` | Create CSS variable reference |
| `media(breakpoint, styles)` | Create media query styles |
| `responsive(styles)` | Create responsive styles |
| `hover(styles)` | Create hover state styles |
| `focus(styles)` | Create focus state styles |
| `active(styles)` | Create active state styles |
| `disabled(styles)` | Create disabled state styles |

### Types

```typescript
interface CSSProperties {
  [key: string]: string | number | undefined;
  [key: `--${string}`]: string | number;
}

interface Theme {
  colors: { primary: string; secondary: string; /* ... */ };
  spacing: { xs: string; sm: string; md: string; /* ... */ };
  fontSize: { xs: string; sm: string; base: string; /* ... */ };
  fontWeight: { thin: number; normal: number; bold: number; /* ... */ };
  borderRadius: { none: string; sm: string; md: string; /* ... */ };
  shadows: { none: string; sm: string; md: string; /* ... */ };
  breakpoints: { sm: string; md: string; lg: string; /* ... */ };
  transitions: { fast: string; normal: string; slow: string; };
  zIndex: { dropdown: number; modal: number; tooltip: number; /* ... */ };
}

interface ThemeConfig {
  defaultTheme?: 'light' | 'dark' | 'system';
  themes?: { light?: Partial<Theme>; dark?: Partial<Theme>; };
  cssVariablePrefix?: string;
}

interface StyleVariant<Props = {}> {
  base: CSSProperties;
  variants?: { [key: string]: { [value: string]: CSSProperties } };
  compoundVariants?: Array<{ css: CSSProperties; [key: string]: any }>;
  defaultVariants?: { [key: string]: string | boolean };
}
```

---

## Best Practices

### 1. Choose the Right Approach

| Use Case | Recommended Approach |
|----------|---------------------|
| Quick prototyping | Scoped CSS (`css\`\``) |
| Design system components | CSS-in-JS with theming |
| Large team with CSS expertise | CSS Modules |
| Dynamic styling based on props | `styled()` or `createStyled()` |
| Variant-heavy components | `cva()` |
| Static designs | CSS Modules |

### 2. Performance Tips

```tsx
// DO: Define styles outside component to avoid recreation
const buttonClass = css`
  padding: 0.5rem 1rem;
`;

function Button() {
  return <button class={buttonClass}>Click</button>;
}

// DON'T: Create styles inside component
function BadButton() {
  // This recreates styles on every render!
  const buttonClass = css`
    padding: 0.5rem 1rem;
  `;
  return <button class={buttonClass}>Click</button>;
}
```

### 3. Theme Organization

```tsx
// Create separate theme files for maintainability
// themes/light.ts
export const lightTheme = {
  colors: { /* ... */ },
  spacing: { /* ... */ },
};

// themes/dark.ts
export const darkTheme = {
  colors: { /* ... */ },
};

// themes/index.ts
import { createTheme } from '@philjs/styles';
import { lightTheme } from './light';
import { darkTheme } from './dark';

export const theme = createTheme({
  themes: { light: lightTheme, dark: darkTheme },
  defaultTheme: 'light',
});
```

### 4. Consistent Naming Conventions

```tsx
// Use consistent naming for variant-based styles
const button = cva({
  variants: {
    // Use semantic names
    intent: { primary: {}, secondary: {}, danger: {} },
    size: { sm: {}, md: {}, lg: {} },

    // Boolean variants as objects
    disabled: { true: {}, false: {} },
    loading: { true: {} },
  },
});
```

### 5. SSR Considerations

```tsx
// Always use extractCriticalCSS for SSR
import { extractCriticalCSS } from '@philjs/styles';

async function renderPage() {
  // Render your app first
  const html = await renderToString(<App />);

  // Then extract critical CSS
  const css = extractCriticalCSS();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>${html}</body>
    </html>
  `;
}
```

---

## Comparison with Other Solutions

| Feature | @philjs/styles | styled-components | Emotion | Tailwind | CSS Modules |
|---------|----------------|-------------------|---------|----------|-------------|
| Runtime CSS-in-JS | Yes | Yes | Yes | No | No |
| Zero-runtime option | CSS Modules | No | No | Yes | Yes |
| Theming | Built-in | Plugin | Built-in | Config | No |
| Variants (CVA) | Built-in | No | No | Plugin | No |
| Scoped CSS | Built-in | Yes | Yes | Scoped | Yes |
| TypeScript | First-class | Good | Good | Good | Manual |
| Bundle Size | ~5KB | ~12KB | ~11KB | 0 (purged) | 0 |
| SSR Support | Built-in | Built-in | Built-in | Yes | Yes |

## Next Steps

- [Core Package](../core/overview.md) - Learn about PhilJS reactivity
- [UI Components](../ui/overview.md) - Pre-built styled components
- [Motion](../motion/overview.md) - Animations and transitions
