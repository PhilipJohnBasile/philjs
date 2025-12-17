/**
 * PhilJS Scoped Styles
 *
 * Svelte-style scoped CSS with automatic class name generation.
 */

import type { CSSProperties, StyleObject } from './types';
import { generateHash, cssPropertyToString, injectStyles } from './utils';

const styleCache = new Map<string, string>();
const injectedStyles = new Set<string>();

/**
 * Create scoped CSS from a template literal
 */
export function css(strings: TemplateStringsArray, ...values: unknown[]): string {
  // Combine template strings with values
  let cssText = '';
  strings.forEach((str, i) => {
    cssText += str;
    if (i < values.length) {
      cssText += String(values[i]);
    }
  });

  // Generate hash for scoping
  const hash = generateHash(cssText);
  const scopedClass = `philjs-${hash}`;

  // Check cache
  if (styleCache.has(hash)) {
    return scopedClass;
  }

  // Scope the CSS
  const scopedCSS = scopeCSS(cssText, scopedClass);

  // Cache and inject
  styleCache.set(hash, scopedCSS);
  injectStyles(scopedCSS, hash);

  return scopedClass;
}

/**
 * Create a styled component
 */
export function styled<P extends object = {}>(
  tag: string | ((props: P) => any),
  styles: CSSProperties | ((props: P) => CSSProperties)
) {
  return function StyledComponent(props: P & { className?: string; children?: any }) {
    const { className = '', children, ...rest } = props;

    // Get styles (call function if needed)
    const styleObj = typeof styles === 'function' ? styles(props) : styles;

    // Generate hash from styles
    const styleString = JSON.stringify(styleObj);
    const hash = generateHash(styleString);
    const scopedClass = `philjs-${hash}`;

    // Inject styles if not already
    if (!injectedStyles.has(hash)) {
      const cssText = `.${scopedClass} { ${objectToCSS(styleObj)} }`;
      injectStyles(cssText, hash);
      injectedStyles.add(hash);
    }

    // Create element
    const combinedClassName = `${scopedClass} ${className}`.trim();

    if (typeof tag === 'function') {
      return tag({ ...rest, className: combinedClassName, children } as P);
    }

    return {
      type: tag,
      props: {
        ...rest,
        className: combinedClassName,
        children,
      },
    };
  };
}

/**
 * Create keyframe animations
 */
export function keyframes(strings: TemplateStringsArray, ...values: unknown[]): string {
  let cssText = '';
  strings.forEach((str, i) => {
    cssText += str;
    if (i < values.length) {
      cssText += String(values[i]);
    }
  });

  const hash = generateHash(cssText);
  const animationName = `philjs-anim-${hash}`;

  if (!injectedStyles.has(hash)) {
    const keyframeCSS = `@keyframes ${animationName} { ${cssText} }`;
    injectStyles(keyframeCSS, `keyframe-${hash}`);
    injectedStyles.add(hash);
  }

  return animationName;
}

/**
 * Create global styles
 */
export function createGlobalStyle(strings: TemplateStringsArray, ...values: unknown[]): () => null {
  let cssText = '';
  strings.forEach((str, i) => {
    cssText += str;
    if (i < values.length) {
      cssText += String(values[i]);
    }
  });

  const hash = generateHash(cssText);

  return function GlobalStyle() {
    if (!injectedStyles.has(hash)) {
      injectStyles(cssText, `global-${hash}`);
      injectedStyles.add(hash);
    }
    return null;
  };
}

/**
 * Scope CSS by adding class to selectors
 */
function scopeCSS(css: string, scopedClass: string): string {
  // Simple regex-based scoping (production would use PostCSS)
  return css.replace(
    /([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g,
    (match, selector, ending) => {
      // Skip keyframes, media queries, etc.
      if (selector.trim().startsWith('@') || selector.trim().startsWith('from') ||
          selector.trim().startsWith('to') || /^\d+%$/.test(selector.trim())) {
        return match;
      }

      // Add scoped class to selector
      const scopedSelector = selector
        .split(',')
        .map((s: string) => {
          s = s.trim();
          if (s.startsWith(':global')) {
            return s.replace(':global', '').trim();
          }
          if (s === '&') {
            return `.${scopedClass}`;
          }
          if (s.startsWith('&')) {
            return `.${scopedClass}${s.slice(1)}`;
          }
          return `.${scopedClass} ${s}`;
        })
        .join(', ');

      return `${scopedSelector}${ending}`;
    }
  );
}

/**
 * Convert style object to CSS string
 */
function objectToCSS(obj: CSSProperties): string {
  return Object.entries(obj)
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
      return `${cssKey}: ${value};`;
    })
    .join(' ');
}

/**
 * Create variant-based styles (like Stitches/CVA)
 */
export function cva<V extends Record<string, Record<string, CSSProperties>>>(config: {
  base?: CSSProperties;
  variants?: V;
  compoundVariants?: Array<Partial<{ [K in keyof V]: keyof V[K] }> & { css: CSSProperties }>;
  defaultVariants?: Partial<{ [K in keyof V]: keyof V[K] }>;
}) {
  const { base = {}, variants = {} as V, compoundVariants = [], defaultVariants = {} } = config;

  return function variantStyles(props: Partial<{ [K in keyof V]: keyof V[K] }> = {}): string {
    // Start with base styles
    let finalStyles: CSSProperties = { ...base };

    // Apply variant styles
    for (const [variantKey, variantValue] of Object.entries({
      ...defaultVariants,
      ...props,
    })) {
      const variantStyles = (variants as any)[variantKey]?.[variantValue as string];
      if (variantStyles) {
        finalStyles = { ...finalStyles, ...variantStyles };
      }
    }

    // Apply compound variants
    for (const compound of compoundVariants) {
      const { css: compoundCSS, ...conditions } = compound;
      const allMatch = Object.entries(conditions).every(([key, value]) => {
        const propValue = (props as any)[key] ?? (defaultVariants as any)[key];
        return propValue === value;
      });

      if (allMatch) {
        finalStyles = { ...finalStyles, ...compoundCSS };
      }
    }

    // Generate class
    const styleString = JSON.stringify(finalStyles);
    const hash = generateHash(styleString);
    const className = `philjs-var-${hash}`;

    if (!injectedStyles.has(hash)) {
      const cssText = `.${className} { ${objectToCSS(finalStyles)} }`;
      injectStyles(cssText, `var-${hash}`);
      injectedStyles.add(hash);
    }

    return className;
  };
}
