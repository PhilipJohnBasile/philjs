/**
 * PhilJS CSS Runtime - SSR Hydration and Dynamic Styles
 *
 * This module provides runtime utilities for:
 * - SSR style hydration
 * - Dynamic style injection
 * - Theme switching at runtime
 * - CSS-in-JS to CSS extraction
 */

import type { CSSStyleObject, Theme, CSSResult } from './types';
import { css, styleRegistry } from './css';
import { getTheme, generateThemeCSS, createThemeVariant } from './theme';

// ============================================================================
// Style Sheet Manager
// ============================================================================

interface StyleSheetManager {
  styleElement: HTMLStyleElement | null;
  rules: Map<string, string>;
  hydrated: boolean;
}

const sheetManager: StyleSheetManager = {
  styleElement: null,
  rules: new Map(),
  hydrated: false
};

/**
 * Get or create the style element
 */
function getStyleElement(): HTMLStyleElement {
  if (typeof document === 'undefined') {
    throw new Error('Runtime CSS requires a DOM environment');
  }

  if (!sheetManager.styleElement) {
    sheetManager.styleElement = document.createElement('style');
    sheetManager.styleElement.setAttribute('data-philjs-css', 'runtime');
    document.head.appendChild(sheetManager.styleElement);
  }

  return sheetManager.styleElement;
}

/**
 * Inject a style rule at runtime
 */
export function injectStyle(className: string, cssText: string): void {
  if (sheetManager.rules.has(className)) {
    return; // Already injected
  }

  sheetManager.rules.set(className, cssText);

  const styleEl = getStyleElement();
  styleEl.textContent = Array.from(sheetManager.rules.values()).join('\n');
}

/**
 * Remove a style rule at runtime
 */
export function removeStyle(className: string): void {
  if (!sheetManager.rules.has(className)) {
    return;
  }

  sheetManager.rules.delete(className);

  const styleEl = getStyleElement();
  styleEl.textContent = Array.from(sheetManager.rules.values()).join('\n');
}

/**
 * Clear all runtime styles
 */
export function clearStyles(): void {
  sheetManager.rules.clear();

  if (sheetManager.styleElement) {
    sheetManager.styleElement.textContent = '';
  }
}

// ============================================================================
// SSR Hydration
// ============================================================================

/**
 * Hydrate styles from SSR
 *
 * Call this on the client to sync with server-rendered styles
 *
 * @example
 * ```ts
 * // In your app entry point
 * import { hydrateStyles } from 'philjs-css/runtime';
 *
 * hydrateStyles();
 * ```
 */
export function hydrateStyles(): void {
  if (typeof document === 'undefined') {
    return; // SSR environment
  }

  if (sheetManager.hydrated) {
    return; // Already hydrated
  }

  // Find server-rendered style element
  const ssrStyles = document.querySelector('style[data-philjs-css="ssr"]');

  if (ssrStyles) {
    // Parse existing styles and add to registry
    const cssText = ssrStyles.textContent || '';
    const classRegex = /\.([a-zA-Z0-9_-]+)\s*\{([^}]+)\}/g;
    let match;

    while ((match = classRegex.exec(cssText)) !== null) {
      const className = match[1];
      const rules = match[2];
      sheetManager.rules.set(className, `.${className} { ${rules} }`);
    }
  }

  sheetManager.hydrated = true;
}

/**
 * Get SSR style tag for server rendering
 *
 * @example
 * ```ts
 * // In your SSR handler
 * import { getSSRStyles } from 'philjs-css/runtime';
 *
 * const html = `
 *   <html>
 *     <head>${getSSRStyles()}</head>
 *     <body>${app}</body>
 *   </html>
 * `;
 * ```
 */
export function getSSRStyles(): string {
  const allStyles = styleRegistry.getStyles();
  const theme = getTheme();
  let css = '';

  if (theme) {
    css += generateThemeCSS(theme) + '\n';
  }

  css += allStyles;

  return `<style data-philjs-css="ssr">${css}</style>`;
}

/**
 * Get SSR style tag with critical CSS only
 */
export function getCriticalSSRStyles(usedClasses: string[]): string {
  const allStyles = styleRegistry.getStyles();
  const lines = allStyles.split('\n');
  const usedStyles: string[] = [];

  for (const line of lines) {
    for (const className of usedClasses) {
      if (line.includes(`.${className}`)) {
        usedStyles.push(line);
        break;
      }
    }
  }

  const theme = getTheme();
  let css = '';

  if (theme) {
    css += generateThemeCSS(theme) + '\n';
  }

  css += usedStyles.join('\n');

  return `<style data-philjs-css="ssr">${css}</style>`;
}

// ============================================================================
// Dynamic Styles
// ============================================================================

/**
 * Create a dynamic style that can change at runtime
 *
 * @example
 * ```ts
 * const dynamicButton = createDynamicStyle({
 *   padding: '10px 20px',
 *   backgroundColor: 'blue'
 * });
 *
 * // Later, update the style
 * dynamicButton.update({ backgroundColor: 'red' });
 *
 * // Clean up when done
 * dynamicButton.dispose();
 * ```
 */
export function createDynamicStyle(initialStyles: CSSStyleObject): {
  className: string;
  update: (styles: CSSStyleObject) => void;
  dispose: () => void;
} {
  let currentStyles = initialStyles;
  const result = css(initialStyles);
  const className = result.className;

  // Inject initial style
  injectStyle(className, result.css);

  return {
    className,
    update(styles: CSSStyleObject) {
      currentStyles = { ...currentStyles, ...styles };
      const newResult = css(currentStyles);
      injectStyle(className, newResult.css);
    },
    dispose() {
      removeStyle(className);
    }
  };
}

/**
 * Create a reactive style that updates based on a signal/observable
 *
 * @example
 * ```ts
 * const [getColor, setColor] = createSignal('blue');
 *
 * const reactiveStyle = createReactiveStyle(() => ({
 *   backgroundColor: getColor()
 * }));
 *
 * // Style updates automatically when color changes
 * setColor('red');
 * ```
 */
export function createReactiveStyle(
  getStyles: () => CSSStyleObject
): {
  className: string;
  refresh: () => void;
  dispose: () => void;
} {
  const dynamicStyle = createDynamicStyle(getStyles());

  return {
    className: dynamicStyle.className,
    refresh() {
      dynamicStyle.update(getStyles());
    },
    dispose() {
      dynamicStyle.dispose();
    }
  };
}

// ============================================================================
// Theme Switching
// ============================================================================

/**
 * Apply a theme at runtime
 *
 * @example
 * ```ts
 * const darkTheme = createThemeVariant(lightTheme, 'dark', {
 *   colors: { background: '#1a1a1a', text: '#ffffff' }
 * });
 *
 * // Switch to dark theme
 * applyTheme(darkTheme);
 *
 * // Switch to light theme
 * applyTheme(lightTheme, '[data-theme="light"]');
 * ```
 */
export function applyTheme(theme: Theme, selector: string = ':root'): void {
  if (typeof document === 'undefined') {
    return;
  }

  const themeCSS = generateThemeCSS(theme, selector);
  const themeStyleId = `philjs-theme-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`;

  // Remove existing theme style
  const existing = document.getElementById(themeStyleId);
  if (existing) {
    existing.remove();
  }

  // Create new theme style
  const styleEl = document.createElement('style');
  styleEl.id = themeStyleId;
  styleEl.textContent = themeCSS;
  document.head.appendChild(styleEl);
}

/**
 * Toggle between light and dark themes
 *
 * @example
 * ```ts
 * const { toggle, isDark } = createThemeToggle(lightTheme, darkTheme);
 *
 * // Toggle theme
 * toggle();
 *
 * // Check current theme
 * console.log(isDark()); // true or false
 * ```
 */
export function createThemeToggle(
  lightTheme: Theme,
  darkTheme: Theme
): {
  toggle: () => void;
  setTheme: (mode: 'light' | 'dark') => void;
  isDark: () => boolean;
} {
  let isDarkMode = false;

  // Check system preference
  if (typeof window !== 'undefined') {
    isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // Apply initial theme
  applyTheme(isDarkMode ? darkTheme : lightTheme);

  return {
    toggle() {
      isDarkMode = !isDarkMode;
      applyTheme(isDarkMode ? darkTheme : lightTheme);

      // Persist preference
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('philjs-theme', isDarkMode ? 'dark' : 'light');
      }
    },
    setTheme(mode: 'light' | 'dark') {
      isDarkMode = mode === 'dark';
      applyTheme(isDarkMode ? darkTheme : lightTheme);

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('philjs-theme', mode);
      }
    },
    isDark() {
      return isDarkMode;
    }
  };
}

/**
 * Sync theme with system preference
 *
 * @example
 * ```ts
 * syncWithSystemTheme(lightTheme, darkTheme);
 * // Theme will automatically change when system preference changes
 * ```
 */
export function syncWithSystemTheme(
  lightTheme: Theme,
  darkTheme: Theme
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
    applyTheme(e.matches ? darkTheme : lightTheme);
  };

  // Apply initial theme
  handleChange(mediaQuery);

  // Listen for changes
  mediaQuery.addEventListener('change', handleChange);

  // Return cleanup function
  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
}

// ============================================================================
// CSS Custom Properties (Variables) at Runtime
// ============================================================================

/**
 * Set a CSS variable at runtime
 *
 * @example
 * ```ts
 * setCSSVariable('--primary-color', '#3b82f6');
 * setCSSVariable('--spacing-md', '16px', document.querySelector('.container'));
 * ```
 */
export function setCSSVariable(
  name: string,
  value: string,
  element: HTMLElement = document.documentElement
): void {
  if (typeof document === 'undefined') {
    return;
  }

  element.style.setProperty(name, value);
}

/**
 * Get a CSS variable value at runtime
 */
export function getCSSVariable(
  name: string,
  element: HTMLElement = document.documentElement
): string {
  if (typeof document === 'undefined') {
    return '';
  }

  return getComputedStyle(element).getPropertyValue(name).trim();
}

/**
 * Remove a CSS variable at runtime
 */
export function removeCSSVariable(
  name: string,
  element: HTMLElement = document.documentElement
): void {
  if (typeof document === 'undefined') {
    return;
  }

  element.style.removeProperty(name);
}

/**
 * Batch set multiple CSS variables
 *
 * @example
 * ```ts
 * setCSSVariables({
 *   '--primary-color': '#3b82f6',
 *   '--secondary-color': '#10b981',
 *   '--spacing-md': '16px'
 * });
 * ```
 */
export function setCSSVariables(
  variables: Record<string, string>,
  element: HTMLElement = document.documentElement
): void {
  for (const [name, value] of Object.entries(variables)) {
    setCSSVariable(name, value, element);
  }
}

// ============================================================================
// Style Performance Utilities
// ============================================================================

/**
 * Batch style updates for better performance
 *
 * @example
 * ```ts
 * batchStyleUpdates(() => {
 *   injectStyle('class1', '.class1 { color: red; }');
 *   injectStyle('class2', '.class2 { color: blue; }');
 *   injectStyle('class3', '.class3 { color: green; }');
 * });
 * ```
 */
export function batchStyleUpdates(fn: () => void): void {
  // Collect all updates
  const pendingRules = new Map<string, string>();
  const originalInject = injectStyle;

  // Override inject to collect
  (globalThis as any).__philjsBatchedInject = (className: string, cssText: string) => {
    pendingRules.set(className, cssText);
  };

  try {
    fn();
  } finally {
    delete (globalThis as any).__philjsBatchedInject;
  }

  // Apply all at once
  for (const [className, cssText] of pendingRules) {
    sheetManager.rules.set(className, cssText);
  }

  // Single DOM update
  const styleEl = getStyleElement();
  styleEl.textContent = Array.from(sheetManager.rules.values()).join('\n');
}

/**
 * Prefetch and cache styles for components
 *
 * @example
 * ```ts
 * // Prefetch styles for components that will be rendered soon
 * prefetchStyles([buttonStyles, cardStyles, modalStyles]);
 * ```
 */
export function prefetchStyles(styles: CSSResult[]): void {
  if (typeof document === 'undefined') {
    return;
  }

  // Use requestIdleCallback if available
  const schedule = (window as any).requestIdleCallback || setTimeout;

  schedule(() => {
    for (const style of styles) {
      injectStyle(style.className, style.css);
    }
  });
}

// ============================================================================
// Style Debugging
// ============================================================================

/**
 * Get debug info about current styles
 */
export function getStyleDebugInfo(): {
  totalRules: number;
  rulesByType: Record<string, number>;
  totalSize: number;
} {
  const rules = Array.from(sheetManager.rules.values());
  const rulesByType: Record<string, number> = {
    component: 0,
    atomic: 0,
    theme: 0,
    animation: 0,
    media: 0
  };

  for (const rule of rules) {
    if (rule.includes('@keyframes')) {
      rulesByType.animation++;
    } else if (rule.includes('@media')) {
      rulesByType.media++;
    } else if (rule.includes('--')) {
      rulesByType.theme++;
    } else if (rule.match(/\.(m|p|w|h|text|bg|flex|grid)[0-9a-z]+/i)) {
      rulesByType.atomic++;
    } else {
      rulesByType.component++;
    }
  }

  return {
    totalRules: rules.length,
    rulesByType,
    totalSize: rules.join('').length
  };
}
