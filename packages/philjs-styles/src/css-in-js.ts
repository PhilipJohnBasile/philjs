/**
 * PhilJS CSS-in-JS
 *
 * Runtime CSS-in-JS with theming support.
 */

import type { CSSProperties, Theme, ThemeConfig } from './types';
import { generateHash, injectStyles } from './utils';

// Default theme
const defaultTheme: Theme = {
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

// Current theme state
let currentTheme: Theme = defaultTheme;
let themeListeners: Set<(theme: Theme) => void> = new Set();

/**
 * Create a theme configuration
 */
export function createTheme(config: ThemeConfig): Theme {
  const { themes = {}, defaultTheme: defaultThemeName = 'light' } = config;

  const baseTheme = themes[defaultThemeName] || themes.light || {};

  return {
    ...defaultTheme,
    ...baseTheme,
    colors: { ...defaultTheme.colors, ...baseTheme.colors },
    spacing: { ...defaultTheme.spacing, ...baseTheme.spacing },
    fontSize: { ...defaultTheme.fontSize, ...baseTheme.fontSize },
    fontWeight: { ...defaultTheme.fontWeight, ...baseTheme.fontWeight },
    borderRadius: { ...defaultTheme.borderRadius, ...baseTheme.borderRadius },
    shadows: { ...defaultTheme.shadows, ...baseTheme.shadows },
    breakpoints: { ...defaultTheme.breakpoints, ...baseTheme.breakpoints },
    transitions: { ...defaultTheme.transitions, ...baseTheme.transitions },
    zIndex: { ...defaultTheme.zIndex, ...baseTheme.zIndex },
  } as Theme;
}

/**
 * Get the current theme
 */
export function useTheme(): Theme {
  return currentTheme;
}

/**
 * Set the current theme
 */
export function setTheme(theme: Theme | Partial<Theme>): void {
  currentTheme = {
    ...currentTheme,
    ...theme,
    colors: { ...currentTheme.colors, ...(theme.colors || {}) },
    spacing: { ...currentTheme.spacing, ...(theme.spacing || {}) },
  } as Theme;

  // Update CSS variables
  updateCSSVariables(currentTheme);

  // Notify listeners
  themeListeners.forEach((listener) => listener(currentTheme));
}

/**
 * Subscribe to theme changes
 */
export function subscribeToTheme(callback: (theme: Theme) => void): () => void {
  themeListeners.add(callback);
  return () => themeListeners.delete(callback);
}

/**
 * Theme Provider component
 */
export function ThemeProvider(props: {
  theme?: Theme | ThemeConfig;
  children: any;
}) {
  const theme = props.theme
    ? 'colors' in props.theme
      ? props.theme as Theme
      : createTheme(props.theme as ThemeConfig)
    : currentTheme;

  // Set theme on mount
  setTheme(theme);

  return props.children;
}

/**
 * Create a styled component factory
 */
export function createStyled<ComponentProps extends object = {}>(
  Component: string | ((props: ComponentProps) => any)
) {
  return function createStyledComponent(
    stylesOrFactory: CSSProperties | ((props: ComponentProps & { theme: Theme }) => CSSProperties)
  ) {
    const injected = new Set<string>();

    return function StyledComponent(props: ComponentProps & { className?: string; children?: any }) {
      const { className = '', children, ...rest } = props;

      // Get styles
      const styles = typeof stylesOrFactory === 'function'
        ? stylesOrFactory({ ...props, theme: currentTheme })
        : stylesOrFactory;

      // Generate class name
      const styleStr = JSON.stringify(styles);
      const hash = generateHash(styleStr);
      const generatedClass = `philjs-styled-${hash}`;

      // Inject styles
      if (!injected.has(hash)) {
        const cssText = generateCSS(`.${generatedClass}`, styles);
        injectStyles(cssText, `styled-${hash}`);
        injected.add(hash);
      }

      const combinedClass = `${generatedClass} ${className}`.trim();

      if (typeof Component === 'function') {
        return Component({ ...rest, className: combinedClass, children } as ComponentProps);
      }

      return {
        type: Component,
        props: { ...rest, className: combinedClass, children },
      };
    };
  };
}

/**
 * Generate CSS from style object
 */
function generateCSS(selector: string, styles: CSSProperties): string {
  const declarations: string[] = [];
  const nested: string[] = [];

  for (const [key, value] of Object.entries(styles)) {
    if (typeof value === 'object' && value !== null) {
      // Nested selector or media query
      if (key.startsWith('@')) {
        nested.push(`${key} { ${selector} { ${objectToDeclarations(value as CSSProperties)} } }`);
      } else if (key.startsWith('&')) {
        const nestedSelector = key.replace('&', selector);
        nested.push(`${nestedSelector} { ${objectToDeclarations(value as CSSProperties)} }`);
      } else {
        nested.push(`${selector} ${key} { ${objectToDeclarations(value as CSSProperties)} }`);
      }
    } else {
      const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      declarations.push(`${cssKey}: ${value};`);
    }
  }

  let css = '';
  if (declarations.length > 0) {
    css += `${selector} { ${declarations.join(' ')} }`;
  }
  if (nested.length > 0) {
    css += ' ' + nested.join(' ');
  }

  return css;
}

function objectToDeclarations(styles: CSSProperties): string {
  return Object.entries(styles)
    .filter(([, v]) => typeof v !== 'object')
    .map(([k, v]) => {
      const cssKey = k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      return `${cssKey}: ${v};`;
    })
    .join(' ');
}

/**
 * Update CSS variables from theme
 */
function updateCSSVariables(theme: Theme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Colors
  for (const [key, value] of Object.entries(theme.colors)) {
    root.style.setProperty(`--color-${key}`, value);
  }

  // Spacing
  for (const [key, value] of Object.entries(theme.spacing)) {
    root.style.setProperty(`--spacing-${key}`, value);
  }

  // Font sizes
  for (const [key, value] of Object.entries(theme.fontSize)) {
    root.style.setProperty(`--font-size-${key}`, value);
  }

  // Border radius
  for (const [key, value] of Object.entries(theme.borderRadius)) {
    root.style.setProperty(`--radius-${key}`, value);
  }

  // Shadows
  for (const [key, value] of Object.entries(theme.shadows)) {
    root.style.setProperty(`--shadow-${key}`, value);
  }
}

// Initialize CSS variables on load
if (typeof window !== 'undefined') {
  updateCSSVariables(currentTheme);
}
