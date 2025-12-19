# PhilJS CSS API Reference

Complete API documentation for PhilJS CSS.

## Table of Contents

- [Core CSS](#core-css)
- [Theme System](#theme-system)
- [Variants](#variants)
- [Atomic Utilities](#atomic-utilities)
- [Build-time Extraction](#build-time-extraction)
- [Types](#types)

---

## Core CSS

### `css(styleObject)`

Create a type-safe CSS style.

**Parameters:**
- `styleObject`: `CSSStyleObject` - The CSS style definition

**Returns:** `CSSResult`
- `className`: `string` - The generated class name
- `css`: `string` - The complete CSS
- `toString()`: `string` - Returns the className

**Example:**
```typescript
const button = css({
  padding: '10px 20px',
  backgroundColor: 'blue',
  '&:hover': {
    backgroundColor: 'darkblue'
  }
});

// Usage: <button class={button}>Click</button>
```

---

### `compose(...styles)`

Compose multiple CSS results into a single class name string.

**Parameters:**
- `...styles`: `(CSSResult | string | undefined | null | false)[]` - Styles to compose

**Returns:** `string` - Combined class names

**Example:**
```typescript
const base = css({ padding: '10px' });
const primary = css({ backgroundColor: 'blue' });
const button = compose(base, primary);
```

---

### `cx(...classNames)`

Conditional class name helper.

**Parameters:**
- `...classNames`: `(string | undefined | null | false)[]` - Class names (falsy values filtered)

**Returns:** `string` - Combined class names

**Example:**
```typescript
const className = cx(
  'base',
  isActive && 'active',
  isDisabled && 'disabled'
);
```

---

### `globalStyle(selector, styles)`

Define global styles.

**Parameters:**
- `selector`: `string` - CSS selector
- `styles`: `CSSStyleObject` - Style definition

**Example:**
```typescript
globalStyle('body', {
  margin: 0,
  padding: 0,
  fontFamily: 'system-ui'
});
```

---

### `keyframes(frames)`

Create a CSS animation.

**Parameters:**
- `frames`: `Record<string, CSSProperties>` - Animation keyframes

**Returns:** `string` - Animation name

**Example:**
```typescript
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 }
});

const animated = css({
  animation: `${fadeIn} 300ms ease-in`
});
```

---

### `styleFactory(defaults)`

Create a style factory with default props.

**Parameters:**
- `defaults`: `CSSStyleObject` - Default styles

**Returns:** `(overrides?: CSSStyleObject) => CSSResult`

**Example:**
```typescript
const createButton = styleFactory({
  padding: '10px 20px',
  borderRadius: '4px'
});

const primaryButton = createButton({
  backgroundColor: 'blue'
});
```

---

### `createStyles(styles)`

Batch create multiple styles.

**Parameters:**
- `styles`: `Record<string, CSSStyleObject>` - Style definitions

**Returns:** `{ [key]: CSSResult }`

**Example:**
```typescript
const styles = createStyles({
  container: { maxWidth: '1200px' },
  header: { fontSize: '24px' }
});

// Usage: styles.container, styles.header
```

---

## Theme System

### `createTheme(tokens)`

Create a type-safe theme with design tokens.

**Parameters:**
- `tokens`: `ThemeTokens` - Theme token definitions

**Returns:** `Theme` - Theme object with typed token access

**Example:**
```typescript
const theme = createTheme({
  colors: {
    primary: '#3b82f6',
    secondary: '#10b981'
  },
  spacing: {
    sm: '8px',
    md: '16px',
    lg: '24px'
  }
});

// Usage: theme.colors.primary
```

---

### `createThemeVariant(baseTheme, name, overrides)`

Create a theme variant (e.g., dark mode).

**Parameters:**
- `baseTheme`: `Theme` - Base theme
- `name`: `string` - Variant name
- `overrides`: `Partial<ThemeTokens>` - Token overrides

**Returns:** `Theme`

**Example:**
```typescript
const darkTheme = createThemeVariant(theme, 'dark', {
  colors: {
    background: '#1f2937',
    text: '#f9fafb'
  }
});
```

---

### `generateThemeCSS(theme, selector?)`

Generate CSS variable declarations for a theme.

**Parameters:**
- `theme`: `Theme` - The theme
- `selector`: `string` - CSS selector (default: ':root')

**Returns:** `string` - CSS variable declarations

**Example:**
```typescript
const css = generateThemeCSS(theme);
// :root {
//   --colors-primary: #3b82f6;
//   --spacing-md: 16px;
// }
```

---

### `cssVar(name)`

Reference a CSS variable.

**Parameters:**
- `name`: `string` - Variable name (without --)

**Returns:** `string` - CSS variable reference

**Example:**
```typescript
const button = css({
  color: cssVar('colors-primary')
});
```

---

### `themeVar(category, key)`

Type-safe CSS variable reference.

**Parameters:**
- `category`: `string` - Token category
- `key`: `string` - Token key

**Returns:** `string` - CSS variable reference

**Example:**
```typescript
const button = css({
  color: themeVar('colors', 'primary'),
  padding: themeVar('spacing', 'md')
});
```

---

### `createBreakpoints(breakpoints)`

Create responsive breakpoint utilities.

**Parameters:**
- `breakpoints`: `Record<string, string>` - Breakpoint definitions

**Returns:** `{ [key]: string }` - Media query strings

**Example:**
```typescript
const breakpoints = createBreakpoints({
  sm: '640px',
  md: '768px',
  lg: '1024px'
});

const responsive = css({
  width: '100%',
  [breakpoints.md]: { width: '50%' }
});
```

---

## Variants

### `variants(config)`

Create a component with variants (like Stitches/CVA).

**Parameters:**
- `config`: `VariantConfig` - Variant configuration

**Returns:** `(props?: VariantProps) => string` - Function that returns class names

**Example:**
```typescript
const button = variants({
  base: { padding: '10px' },
  variants: {
    size: {
      sm: { padding: '6px 12px' },
      lg: { padding: '14px 28px' }
    },
    color: {
      primary: { backgroundColor: 'blue' },
      danger: { backgroundColor: 'red' }
    }
  },
  defaultVariants: {
    size: 'sm',
    color: 'primary'
  }
});

// Usage
const className = button({ size: 'lg', color: 'danger' });
```

---

### `slotVariants(config)`

Create slot-based variants for complex components.

**Parameters:**
- `config`: Slot variant configuration

**Returns:** `(props?) => { [slot]: string }`

**Example:**
```typescript
const card = slotVariants({
  slots: {
    root: { borderRadius: '8px' },
    header: { padding: '16px' },
    body: { padding: '16px' }
  },
  variants: {
    size: {
      sm: {
        header: { padding: '12px' },
        body: { padding: '12px' }
      }
    }
  }
});

const classes = card({ size: 'sm' });
// classes.root, classes.header, classes.body
```

---

### `responsiveVariants(config)`

Create responsive variants.

**Parameters:**
- `config`: Responsive variant configuration

**Returns:** `CSSResult`

**Example:**
```typescript
const responsive = responsiveVariants({
  base: { width: '100%' },
  breakpoints: {
    md: { width: '50%' },
    lg: { width: '33.333%' }
  }
});
```

---

### `booleanVariant(styles)`

Create a boolean variant.

**Parameters:**
- `styles`: `CSSStyleObject` - Styles for true state

**Returns:** `{ true: CSSStyleObject }`

**Example:**
```typescript
const button = variants({
  variants: {
    loading: booleanVariant({
      opacity: 0.5,
      pointerEvents: 'none'
    })
  }
});
```

---

### `stateVariants(config)`

Create state-based variants (hover, focus, etc.).

**Parameters:**
- `config`: State variant configuration

**Returns:** `CSSResult`

**Example:**
```typescript
const interactive = stateVariants({
  base: { color: '#000' },
  states: {
    hover: { color: '#3b82f6' },
    focus: { outline: '2px solid #3b82f6' }
  }
});
```

---

## Atomic Utilities

### `createAtomicSystem(config)`

Create a complete atomic CSS system.

**Parameters:**
- `config`: Atomic system configuration

**Returns:** `Record<string, string>` - Atomic class names

**Example:**
```typescript
const atoms = createAtomicSystem({
  spacing: { 0: '0', 4: '16px' },
  colors: { blue: '#3b82f6' },
  fontSize: { sm: '14px', base: '16px' }
});

// atoms.m4, atoms.p4, atoms.textBlue, atoms.bgBlue, etc.
```

---

### `createSpacingUtilities(scale)`

Create spacing utilities (margin/padding).

**Parameters:**
- `scale`: `Record<string, string | number>` - Spacing scale

**Returns:** `Record<string, string>` - Class names

**Example:**
```typescript
const spacing = createSpacingUtilities({
  0: '0',
  1: '4px',
  2: '8px',
  4: '16px'
});

// spacing.m4, spacing.p2, spacing.mt1, etc.
```

---

### `createColorUtilities(palette)`

Create color utilities.

**Parameters:**
- `palette`: `Record<string, string>` - Color palette

**Returns:** `Record<string, string>` - Class names

**Example:**
```typescript
const colors = createColorUtilities({
  blue: '#3b82f6',
  red: '#ef4444'
});

// colors.textBlue, colors.bgRed, colors.borderBlue
```

---

### `createTypographyUtilities(config)`

Create typography utilities.

**Parameters:**
- `config`: Typography configuration

**Returns:** `Record<string, string>` - Class names

**Example:**
```typescript
const typography = createTypographyUtilities({
  fontSize: { sm: '14px', base: '16px' },
  fontWeight: { normal: 400, bold: 700 }
});

// typography.textSm, typography.fontBold
```

---

### `createLayoutUtilities()`

Create layout utilities.

**Returns:** `Record<string, string>` - Class names

**Example:**
```typescript
const layout = createLayoutUtilities();

// layout.flex, layout.grid, layout.block, layout.itemsCenter, etc.
```

---

## Build-time Extraction

### `extractCSS(config?)`

Extract all CSS from the registry.

**Parameters:**
- `config?`: `Partial<ExtractConfig>` - Extraction configuration

**Returns:** `string` - Complete CSS

**Example:**
```typescript
const css = extractCSS({
  minify: true,
  sourceMap: true,
  atomicClasses: true
});
```

---

### `extractToFile(filePath, config?)`

Extract CSS and write to file.

**Parameters:**
- `filePath`: `string` - Output file path
- `config?`: `Partial<ExtractConfig>` - Extraction configuration

**Returns:** `Promise<void>`

**Example:**
```typescript
await extractToFile('./dist/styles.css', {
  minify: true,
  sourceMap: true
});
```

---

### `extractCriticalCSS(html, config?)`

Extract only CSS used in HTML (for SSR).

**Parameters:**
- `html`: `string` - HTML string
- `config?`: `Partial<ExtractConfig>` - Extraction configuration

**Returns:** `string` - Critical CSS

**Example:**
```typescript
const criticalCSS = extractCriticalCSS(html, {
  minify: true
});
```

---

### `analyzeCSSBundle()`

Analyze CSS bundle statistics.

**Returns:** `BundleStats`

**Example:**
```typescript
const stats = analyzeCSSBundle();
console.log(`Size: ${stats.minifiedSize} bytes`);
console.log(`Classes: ${stats.classCount}`);
```

---

### `createVitePlugin(config?)`

Create a Vite plugin for CSS extraction.

**Parameters:**
- `config?`: `Partial<ExtractConfig>` - Plugin configuration

**Returns:** Vite plugin

**Example:**
```typescript
// vite.config.ts
export default {
  plugins: [
    createVitePlugin({
      outputPath: 'styles.css',
      minify: true
    })
  ]
};
```

---

### `createRollupPlugin(config?)`

Create a Rollup plugin for CSS extraction.

**Parameters:**
- `config?`: `Partial<ExtractConfig>` - Plugin configuration

**Returns:** Rollup plugin

---

### `createWebpackPlugin(config?)`

Create a Webpack plugin for CSS extraction.

**Parameters:**
- `config?`: `Partial<ExtractConfig>` - Plugin configuration

**Returns:** Webpack plugin

---

## Types

### `CSSStyleObject`

Type-safe CSS style object with nesting support.

```typescript
interface CSSStyleObject extends CSSProperties {
  '&:hover'?: CSSStyleObject;
  '&:focus'?: CSSStyleObject;
  // ... other pseudo selectors
  '@media'?: { [query: string]: CSSStyleObject };
}
```

---

### `Theme`

Theme object with typed token access.

```typescript
interface Theme {
  tokens: ThemeTokens;
  cssVars: Record<string, string>;
  getToken(category, key): any;
}
```

---

### `VariantConfig`

Variant configuration type.

```typescript
interface VariantConfig<V> {
  base?: CSSStyleObject;
  variants?: V;
  compoundVariants?: Array<any>;
  defaultVariants?: { [K in keyof V]?: keyof V[K] };
}
```

---

### `CSSResult`

CSS result object.

```typescript
interface CSSResult {
  className: string;
  css: string;
  toString(): string;
}
```

---

### `ExtractConfig`

CSS extraction configuration.

```typescript
interface ExtractConfig {
  outputPath: string;
  minify?: boolean;
  sourceMap?: boolean;
  atomicClasses?: boolean;
}
```

---

### `BundleStats`

CSS bundle statistics.

```typescript
interface BundleStats {
  totalSize: number;
  minifiedSize: number;
  gzipSize: number;
  classCount: number;
  ruleCount: number;
  themeVars: number;
}
```

---

## Utility Functions

### `resetStyles()`

Reset the style registry (useful for testing).

### `resetAtomicRegistry()`

Reset the atomic class registry (useful for testing).

### `getTheme()`

Get the current active theme.

**Returns:** `Theme | null`
