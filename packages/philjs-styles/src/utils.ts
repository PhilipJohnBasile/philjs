/**
 * PhilJS Styles - Utilities
 */

import type { CSSProperties } from './types';

const styleElements = new Map<string, HTMLStyleElement>();

/**
 * Generate a short hash from a string
 */
export function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}

/**
 * Inject styles into the document
 */
export function injectStyles(css: string, id: string): void {
  if (typeof document === 'undefined') return;

  // Check if already injected
  if (styleElements.has(id)) return;

  const style = document.createElement('style');
  style.setAttribute('data-philjs', id);
  style.textContent = css;
  document.head.appendChild(style);
  styleElements.set(id, style);
}

/**
 * Remove injected styles
 */
export function removeStyles(id: string): void {
  const style = styleElements.get(id);
  if (style) {
    style.remove();
    styleElements.delete(id);
  }
}

/**
 * Convert CSS property to string
 */
export function cssPropertyToString(property: string, value: unknown): string {
  const kebabCase = property.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
  return `${kebabCase}: ${value};`;
}

/**
 * Combine class names (clsx/classnames compatible)
 */
export function cx(...args: (string | undefined | null | false | Record<string, boolean>)[]): string {
  const classes: string[] = [];

  for (const arg of args) {
    if (!arg) continue;

    if (typeof arg === 'string') {
      classes.push(arg);
    } else if (typeof arg === 'object') {
      for (const [key, value] of Object.entries(arg)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(' ');
}

// Alias for cx
export const clsx = cx;
export const classNames = cx;

/**
 * Merge style objects
 */
export function mergeStyles(...styles: (CSSProperties | undefined | null)[]): CSSProperties {
  return styles.reduce<CSSProperties>((acc, style) => {
    if (!style) return acc;
    return { ...acc, ...style };
  }, {});
}

/**
 * Extract critical CSS for SSR
 */
export function extractCriticalCSS(): string {
  const criticalCSS: string[] = [];

  styleElements.forEach((style) => {
    if (style.textContent) {
      criticalCSS.push(style.textContent);
    }
  });

  return criticalCSS.join('\n');
}

/**
 * Get all injected style IDs
 */
export function getInjectedStyles(): string[] {
  return Array.from(styleElements.keys());
}

/**
 * Clear all injected styles
 */
export function clearAllStyles(): void {
  styleElements.forEach((style) => style.remove());
  styleElements.clear();
}

/**
 * Media query helper
 */
export function media(breakpoint: string, styles: CSSProperties): Record<string, CSSProperties> {
  return {
    [`@media (min-width: ${breakpoint})`]: styles,
  };
}

/**
 * Responsive styles helper
 */
export function responsive(styles: {
  base?: CSSProperties;
  sm?: CSSProperties;
  md?: CSSProperties;
  lg?: CSSProperties;
  xl?: CSSProperties;
  '2xl'?: CSSProperties;
}): CSSProperties {
  const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  };

  let result: CSSProperties = styles.base || {};

  for (const [key, bp] of Object.entries(breakpoints)) {
    const bpStyles = styles[key as keyof typeof styles];
    if (bpStyles) {
      result = {
        ...result,
        ...media(bp, bpStyles),
      } as CSSProperties;
    }
  }

  return result;
}

/**
 * Create CSS custom property getter
 */
export function cssVar(name: string, fallback?: string): string {
  return fallback ? `var(--${name}, ${fallback})` : `var(--${name})`;
}

/**
 * Create hover styles
 */
export function hover(styles: CSSProperties): Record<string, CSSProperties> {
  return { '&:hover': styles };
}

/**
 * Create focus styles
 */
export function focus(styles: CSSProperties): Record<string, CSSProperties> {
  return { '&:focus': styles };
}

/**
 * Create active styles
 */
export function active(styles: CSSProperties): Record<string, CSSProperties> {
  return { '&:active': styles };
}

/**
 * Create disabled styles
 */
export function disabled(styles: CSSProperties): Record<string, CSSProperties> {
  return { '&:disabled': styles };
}
