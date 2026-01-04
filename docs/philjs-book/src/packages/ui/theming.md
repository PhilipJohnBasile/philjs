# Theming

PhilJS UI includes a comprehensive theming system with design tokens, dark mode support, and CSS variable generation.

## ThemeProvider

Wrap your application with `ThemeProvider` to enable theming:

```tsx
import { ThemeProvider } from '@philjs/ui';

function App() {
  return (
    <ThemeProvider
      defaultColorMode="system"
      storageKey="my-app-theme"
    >
      <YourApp />
    </ThemeProvider>
  );
}
```

### ThemeProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSX.Element` | required | Child components |
| `theme` | `Partial<Theme>` | `undefined` | Custom theme overrides |
| `defaultColorMode` | `'light' \| 'dark' \| 'system'` | `'system'` | Initial color mode |
| `storageKey` | `string` | `'philjs-color-mode'` | localStorage key for persistence |

## Color Mode

### useColorMode Hook

Access and control the current color mode:

```tsx
import { useColorMode } from '@philjs/ui';

function ThemeToggle() {
  const { colorMode, setColorMode, isDark, toggleColorMode } = useColorMode();

  return (
    <div>
      {/* Current mode (reactive) */}
      <p>Current: {colorMode()}</p>

      {/* Check if dark mode */}
      <p>{isDark() ? 'Dark Mode' : 'Light Mode'}</p>

      {/* Toggle between light and dark */}
      <button onClick={toggleColorMode}>
        Toggle Theme
      </button>

      {/* Set specific mode */}
      <button onClick={() => setColorMode('system')}>
        Use System Theme
      </button>
    </div>
  );
}
```

### useTheme Hook

Access the full theme context:

```tsx
import { useTheme } from '@philjs/ui';

function MyComponent() {
  const { theme, colorMode, isDark, toggleColorMode, setColorMode } = useTheme();

  // Access design tokens
  const primaryColor = theme.colors.primary[500];
  const spacing4 = theme.spacing[4];

  return (
    <div style={{ color: primaryColor, padding: spacing4 }}>
      Themed content
    </div>
  );
}
```

## Design Tokens

### Colors

The default theme includes semantic color palettes:

```tsx
import { colors } from '@philjs/ui';

// Primary palette (blue)
colors.primary[50]   // #eff6ff (lightest)
colors.primary[100]  // #dbeafe
colors.primary[200]  // #bfdbfe
colors.primary[300]  // #93c5fd
colors.primary[400]  // #60a5fa
colors.primary[500]  // #3b82f6 (default)
colors.primary[600]  // #2563eb
colors.primary[700]  // #1d4ed8
colors.primary[800]  // #1e40af
colors.primary[900]  // #1e3a8a
colors.primary[950]  // #172554 (darkest)

// Semantic colors
colors.success[500]  // #22c55e (green)
colors.warning[500]  // #f59e0b (yellow/amber)
colors.error[500]    // #ef4444 (red)
colors.info[500]     // #06b6d4 (cyan)

// Neutral colors
colors.gray[50]      // #f9fafb
colors.gray[500]     // #6b7280
colors.gray[900]     // #111827

// Base colors
colors.white         // #ffffff
colors.black         // #000000
colors.transparent   // transparent
```

### Spacing

Consistent spacing scale based on 0.25rem (4px):

```tsx
import { spacing } from '@philjs/ui';

spacing[0]    // '0'
spacing.px    // '1px'
spacing[0.5]  // '0.125rem' (2px)
spacing[1]    // '0.25rem'  (4px)
spacing[2]    // '0.5rem'   (8px)
spacing[3]    // '0.75rem'  (12px)
spacing[4]    // '1rem'     (16px)
spacing[6]    // '1.5rem'   (24px)
spacing[8]    // '2rem'     (32px)
spacing[12]   // '3rem'     (48px)
spacing[16]   // '4rem'     (64px)
spacing[24]   // '6rem'     (96px)
spacing[32]   // '8rem'     (128px)
spacing[48]   // '12rem'    (192px)
spacing[64]   // '16rem'    (256px)
spacing[96]   // '24rem'    (384px)
```

### Typography

Font size scale with line heights:

```tsx
import { fontSize, fontWeight, fontFamily } from '@philjs/ui';

// Font sizes (with recommended line heights)
fontSize.xs    // ['0.75rem', { lineHeight: '1rem' }]
fontSize.sm    // ['0.875rem', { lineHeight: '1.25rem' }]
fontSize.base  // ['1rem', { lineHeight: '1.5rem' }]
fontSize.lg    // ['1.125rem', { lineHeight: '1.75rem' }]
fontSize.xl    // ['1.25rem', { lineHeight: '1.75rem' }]
fontSize['2xl'] // ['1.5rem', { lineHeight: '2rem' }]
fontSize['3xl'] // ['1.875rem', { lineHeight: '2.25rem' }]
fontSize['4xl'] // ['2.25rem', { lineHeight: '2.5rem' }]
fontSize['5xl'] // ['3rem', { lineHeight: '1' }]

// Font weights
fontWeight.thin       // '100'
fontWeight.light      // '300'
fontWeight.normal     // '400'
fontWeight.medium     // '500'
fontWeight.semibold   // '600'
fontWeight.bold       // '700'
fontWeight.extrabold  // '800'
fontWeight.black      // '900'

// Font families
fontFamily.sans   // System sans-serif stack
fontFamily.serif  // System serif stack
fontFamily.mono   // System monospace stack
```

### Border Radius

```tsx
import { borderRadius } from '@philjs/ui';

borderRadius.none     // '0'
borderRadius.sm       // '0.125rem' (2px)
borderRadius.DEFAULT  // '0.25rem'  (4px)
borderRadius.md       // '0.375rem' (6px)
borderRadius.lg       // '0.5rem'   (8px)
borderRadius.xl       // '0.75rem'  (12px)
borderRadius['2xl']   // '1rem'     (16px)
borderRadius['3xl']   // '1.5rem'   (24px)
borderRadius.full     // '9999px'   (fully rounded)
```

### Box Shadows

```tsx
import { boxShadow } from '@philjs/ui';

boxShadow.sm      // Subtle shadow
boxShadow.DEFAULT // Default shadow
boxShadow.md      // Medium shadow
boxShadow.lg      // Large shadow
boxShadow.xl      // Extra large shadow
boxShadow['2xl']  // 2x large shadow
boxShadow.inner   // Inner shadow
boxShadow.none    // No shadow
```

### Z-Index Scale

Semantic z-index values for layering:

```tsx
import { zIndex } from '@philjs/ui';

zIndex[0]             // '0'
zIndex[10]            // '10'
zIndex[20]            // '20'
zIndex[30]            // '30'
zIndex[40]            // '40'
zIndex[50]            // '50'
zIndex.dropdown       // '1000'
zIndex.sticky         // '1020'
zIndex.fixed          // '1030'
zIndex.modalBackdrop  // '1040'
zIndex.modal          // '1050'
zIndex.popover        // '1060'
zIndex.tooltip        // '1070'
```

### Breakpoints

Responsive breakpoints for media queries:

```tsx
import { breakpoints } from '@philjs/ui';

breakpoints.sm    // '640px'
breakpoints.md    // '768px'
breakpoints.lg    // '1024px'
breakpoints.xl    // '1280px'
breakpoints['2xl'] // '1536px'
```

### Transitions

Pre-defined transition values:

```tsx
import { transition } from '@philjs/ui';

transition.none     // 'none'
transition.all      // All properties, 150ms
transition.DEFAULT  // Common properties, 150ms
transition.colors   // Color-related properties
transition.opacity  // Opacity only
transition.shadow   // Box shadow only
transition.transform // Transform only
```

## Custom Themes

### Overriding Default Theme

Pass a partial theme to override specific values:

```tsx
import { ThemeProvider } from '@philjs/ui';

const customTheme = {
  colors: {
    primary: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe',
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef', // Custom purple primary
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
    }
  }
};

function App() {
  return (
    <ThemeProvider theme={customTheme}>
      <YourApp />
    </ThemeProvider>
  );
}
```

### Accessing the Default Theme

```tsx
import { defaultTheme } from '@philjs/ui';

// Full default theme object
console.log(defaultTheme.colors);
console.log(defaultTheme.spacing);
console.log(defaultTheme.fontSize);
```

## CSS Variables

### Generating CSS Variables

Use `generateCSSVariables` to create a CSS string with all theme values:

```tsx
import { generateCSSVariables, defaultTheme } from '@philjs/ui';

const cssVariables = generateCSSVariables(defaultTheme);
// Returns:
// :root {
//   --color-primary-50: #eff6ff;
//   --color-primary-100: #dbeafe;
//   ...
//   --spacing-0: 0;
//   --spacing-1: 0.25rem;
//   ...
//   --radius-sm: 0.125rem;
//   ...
// }
```

### Using CSS Variables

Reference theme values in your CSS:

```css
.my-component {
  /* Colors */
  background: var(--color-primary-500);
  color: var(--color-gray-900);
  border-color: var(--color-gray-200);

  /* Spacing */
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-2);

  /* Border radius */
  border-radius: var(--radius-md);

  /* Shadows */
  box-shadow: var(--shadow-md);

  /* Z-index */
  z-index: var(--z-dropdown);
}
```

## Dark Mode

### Automatic Class Application

The ThemeProvider automatically applies theme classes to the document:

```html
<!-- Light mode -->
<html class="light" data-theme="light">

<!-- Dark mode -->
<html class="dark" data-theme="dark">
```

### CSS Dark Mode Styles

Use the `dark` class or `data-theme` attribute for dark mode styles:

```css
/* Using class */
.my-component {
  background: white;
  color: #111827;
}

.dark .my-component {
  background: #1f2937;
  color: #f9fafb;
}

/* Using data attribute */
[data-theme="dark"] .my-component {
  background: #1f2937;
  color: #f9fafb;
}
```

### System Preference Detection

When `defaultColorMode` is `'system'`, the theme automatically responds to OS preferences:

```tsx
<ThemeProvider defaultColorMode="system">
  {/* Automatically uses dark mode when OS is in dark mode */}
</ThemeProvider>
```

The provider also listens for changes to the system preference and updates accordingly.

## Theme Type

The complete Theme type for TypeScript:

```tsx
import type { Theme } from '@philjs/ui';

// Theme structure
interface Theme {
  colors: {
    primary: ColorScale;
    gray: ColorScale;
    success: ColorScale;
    warning: ColorScale;
    error: ColorScale;
    info: ColorScale;
    white: string;
    black: string;
    transparent: string;
  };
  spacing: Record<string | number, string>;
  fontSize: Record<string, [string, { lineHeight: string }]>;
  fontWeight: Record<string, string>;
  fontFamily: {
    sans: string;
    serif: string;
    mono: string;
  };
  borderRadius: Record<string, string>;
  boxShadow: Record<string, string>;
  transition: Record<string, string>;
  zIndex: Record<string, string>;
  breakpoints: Record<string, string>;
}

type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950?: string;
};
```

## Best Practices

1. **Use semantic tokens**: Prefer `colors.primary` over hard-coded colors
2. **Respect spacing scale**: Use spacing tokens for consistent layouts
3. **Test both modes**: Always verify components in light and dark modes
4. **Use CSS variables**: Enable runtime theme changes without rebuilding
5. **Follow contrast guidelines**: Ensure WCAG 2.1 AA color contrast ratios
