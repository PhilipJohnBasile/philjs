import type { Theme, ThemeTokens } from './types.js';

/**
 * Global theme registry
 */
let currentTheme: Theme | null = null;

/**
 * Convert theme tokens to CSS variables
 */
function tokensToCSSVars(tokens: ThemeTokens): Record<string, string> {
  const cssVars: Record<string, string> = {};

  for (const [category, values] of Object.entries(tokens)) {
    if (!values || typeof values !== 'object') continue;

    for (const [key, value] of Object.entries(values)) {
      const varName = `--${category}-${key}`;
      cssVars[varName] = String(value);
    }
  }

  return cssVars;
}

/**
 * Create a type-safe theme with design tokens
 *
 * @example
 * ```ts
 * const theme = createTheme({
 *   colors: {
 *     primary: '#3b82f6',
 *     secondary: '#10b981',
 *     danger: '#ef4444'
 *   },
 *   spacing: {
 *     xs: '4px',
 *     sm: '8px',
 *     md: '16px',
 *     lg: '24px',
 *     xl: '32px'
 *   },
 *   fontSize: {
 *     sm: '14px',
 *     base: '16px',
 *     lg: '18px',
 *     xl: '24px'
 *   }
 * });
 * ```
 */
export function createTheme<T extends ThemeTokens>(tokens: T): Theme & {
  colors: T['colors'] extends Record<string, string> ? T['colors'] : never;
  spacing: T['spacing'] extends Record<string, string | number> ? T['spacing'] : never;
  fontSize: T['fontSize'] extends Record<string, string | number> ? T['fontSize'] : never;
  fontFamily: T['fontFamily'] extends Record<string, string> ? T['fontFamily'] : never;
  fontWeight: T['fontWeight'] extends Record<string, string | number> ? T['fontWeight'] : never;
  lineHeight: T['lineHeight'] extends Record<string, string | number> ? T['lineHeight'] : never;
  letterSpacing: T['letterSpacing'] extends Record<string, string> ? T['letterSpacing'] : never;
  borderRadius: T['borderRadius'] extends Record<string, string | number> ? T['borderRadius'] : never;
  borderWidth: T['borderWidth'] extends Record<string, string | number> ? T['borderWidth'] : never;
  shadows: T['shadows'] extends Record<string, string> ? T['shadows'] : never;
  zIndex: T['zIndex'] extends Record<string, number> ? T['zIndex'] : never;
  breakpoints: T['breakpoints'] extends Record<string, string> ? T['breakpoints'] : never;
  transitions: T['transitions'] extends Record<string, string> ? T['transitions'] : never;
} {
  const cssVars = tokensToCSSVars(tokens);

  const theme: Theme = {
    tokens,
    cssVars,
    getToken(category: keyof ThemeTokens, key: string) {
      const categoryTokens = tokens[category];
      if (!categoryTokens) {
        throw new Error(`Theme category "${String(category)}" does not exist`);
      }
      if (!(key in categoryTokens)) {
        throw new Error(`Token "${key}" does not exist in category "${String(category)}"`);
      }
      return categoryTokens[key]!;
    }
  };

  // Set as current theme
  currentTheme = theme;

  // Return typed theme with direct access to tokens
  return new Proxy(theme, {
    get(target, prop) {
      if (prop in target) {
        return target[prop as keyof Theme];
      }
      if (typeof prop === 'string' && prop in tokens) {
        return tokens[prop];
      }
      return undefined;
    }
  }) as any;
}

/**
 * Get the current active theme
 */
export function getTheme(): Theme | null {
  return currentTheme;
}

/**
 * Generate CSS variable declarations for theme
 *
 * @example
 * ```ts
 * const css = generateThemeCSS(theme);
 * // :root {
 * //   --colors-primary: #3b82f6;
 * //   --spacing-md: 16px;
 * // }
 * ```
 */
export function generateThemeCSS(theme: Theme, selector = ':root'): string {
  const declarations = Object.entries(theme.cssVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  return `${selector} {\n${declarations}\n}`;
}

/**
 * Create a theme variant (e.g., dark mode)
 *
 * @example
 * ```ts
 * const darkTheme = createThemeVariant(theme, 'dark', {
 *   colors: {
 *     primary: '#60a5fa',
 *     background: '#1f2937'
 *   }
 * });
 * ```
 */
export function createThemeVariant<T extends ThemeTokens>(
  baseTheme: Theme,
  name: string,
  overrides: Partial<T>
): Theme {
  const mergedTokens: ThemeTokens = { ...baseTheme.tokens };

  // Deep merge overrides
  for (const [category, values] of Object.entries(overrides)) {
    if (!values || typeof values !== 'object') continue;

    mergedTokens[category] = {
      ...(mergedTokens[category] || {}),
      ...values
    };
  }

  const cssVars = tokensToCSSVars(mergedTokens);

  return {
    tokens: mergedTokens,
    cssVars,
    getToken(category: keyof ThemeTokens, key: string) {
      const categoryTokens = mergedTokens[category];
      if (!categoryTokens) {
        throw new Error(`Theme category "${String(category)}" does not exist`);
      }
      if (!(key in categoryTokens)) {
        throw new Error(`Token "${key}" does not exist in category "${String(category)}"`);
      }
      return categoryTokens[key]!;
    }
  };
}

/**
 * CSS variable reference helper
 *
 * @example
 * ```ts
 * const buttonStyle = css({
 *   color: cssVar('colors-primary'),
 *   padding: cssVar('spacing-md')
 * });
 * ```
 */
export function cssVar(name: string): string {
  return `var(--${name})`;
}

/**
 * Type-safe CSS variable reference
 *
 * @example
 * ```ts
 * const buttonStyle = css({
 *   color: themeVar('colors', 'primary'),
 *   padding: themeVar('spacing', 'md')
 * });
 * ```
 */
export function themeVar(category: string, key: string): string {
  return `var(--${category}-${key})`;
}

/**
 * Create responsive breakpoint utilities
 *
 * @example
 * ```ts
 * const breakpoints = createBreakpoints({
 *   sm: '640px',
 *   md: '768px',
 *   lg: '1024px',
 *   xl: '1280px'
 * });
 *
 * const responsive = css({
 *   width: '100%',
 *   [breakpoints.md]: { width: '50%' },
 *   [breakpoints.lg]: { width: '33.333%' }
 * });
 * ```
 */
export function createBreakpoints<T extends Record<string, string>>(
  breakpoints: T
): { [K in keyof T]: string } {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(breakpoints)) {
    result[key] = `@media (min-width: ${value})`;
  }

  return result as { [K in keyof T]: string };
}

/**
 * Default theme with sensible defaults
 */
export const defaultTheme = createTheme({
  colors: {
    white: '#ffffff',
    black: '#000000',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
    blue500: '#3b82f6',
    blue600: '#2563eb',
    green500: '#10b981',
    green600: '#059669',
    red500: '#ef4444',
    red600: '#dc2626',
    yellow500: '#f59e0b',
    yellow600: '#d97706'
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem'
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem'
  },
  fontWeight: {
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
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
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
