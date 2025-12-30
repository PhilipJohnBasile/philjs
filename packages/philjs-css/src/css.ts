import type { CSSStyleObject, CSSResult, CSSProperties } from './types.js';

/**
 * Global stylesheet registry
 */
class StyleRegistry {
  private styles = new Map<string, string>();
  private counter = 0;

  /**
   * Register a style and return a unique class name
   */
  register(css: string): string {
    // Check if this exact CSS already exists
    for (const [className, existingCss] of this.styles.entries()) {
      if (existingCss === css) {
        return className;
      }
    }

    // Generate new class name
    const className = `css-${this.counter++}`;
    this.styles.set(className, css);
    return className;
  }

  /**
   * Get all registered styles as CSS string
   */
  getStyles(): string {
    return Array.from(this.styles.entries())
      .map(([className, css]) => `.${className} { ${css} }`)
      .join('\n');
  }

  /**
   * Clear all styles
   */
  reset(): void {
    this.styles.clear();
    this.counter = 0;
  }

  /**
   * Get style for specific class
   */
  getStyle(className: string): string | undefined {
    return this.styles.get(className);
  }
}

export const styleRegistry = new StyleRegistry();

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Convert a CSS value to string
 */
function valueToString(value: string | number): string {
  if (typeof value === 'number') {
    // Properties that should not have units
    const unitlessProps = new Set([
      'opacity',
      'z-index',
      'font-weight',
      'line-height',
      'flex',
      'flex-grow',
      'flex-shrink',
      'order'
    ]);

    return unitlessProps.has(camelToKebab(String(value))) ? String(value) : `${value}px`;
  }
  return value;
}

/**
 * Process nested CSS objects and return flat CSS rules
 */
interface ProcessedRule {
  selector: string;
  css: string;
}

function processStyleObject(
  obj: CSSStyleObject,
  parentSelector = ''
): ProcessedRule[] {
  const rules: ProcessedRule[] = [];
  const properties: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;

    // Handle nested selectors (pseudo, combinators, etc.)
    if (key.startsWith('&') || key.startsWith('@')) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Handle media queries and other @ rules
        if (key.startsWith('@media') || key.startsWith('@supports') || key.startsWith('@container')) {
          const nestedRules = processStyleObject(value as CSSStyleObject, parentSelector);
          rules.push({
            selector: key,
            css: nestedRules.map(r => `${r.selector} { ${r.css} }`).join(' ')
          });
        } else {
          // Handle pseudo selectors and combinators
          const selector = parentSelector + key.replace('&', '');
          const nestedRules = processStyleObject(value as CSSStyleObject, selector);
          rules.push(...nestedRules);
        }
      }
    } else {
      // Regular CSS property
      const cssKey = camelToKebab(key);
      const cssValue = valueToString(value as string | number);
      properties.push(`${cssKey}: ${cssValue};`);
    }
  }

  if (properties.length > 0) {
    rules.unshift({
      selector: parentSelector || '&',
      css: properties.join(' ')
    });
  }

  return rules;
}

/**
 * Generate complete CSS from style object
 */
function generateCSS(styleObj: CSSStyleObject, className: string): string {
  const rules = processStyleObject(styleObj);
  const cssBlocks: string[] = [];

  for (const rule of rules) {
    const selector = rule.selector.replace('&', `.${className}`);

    // Handle @ rules (media queries, etc.)
    if (rule.selector.startsWith('@')) {
      cssBlocks.push(`${rule.selector} { ${rule.css} }`);
    } else {
      cssBlocks.push(`${selector} { ${rule.css} }`);
    }
  }

  return cssBlocks.join('\n');
}

/**
 * Core css() function for creating type-safe styles
 *
 * @example
 * ```ts
 * const button = css({
 *   padding: '10px 20px',
 *   backgroundColor: '#3b82f6',
 *   color: 'white',
 *   borderRadius: '4px',
 *   '&:hover': {
 *     backgroundColor: '#2563eb'
 *   }
 * });
 *
 * // Use in component
 * <button class={button}>Click me</button>
 * ```
 */
export function css(styleObj: CSSStyleObject): CSSResult {
  const rules = processStyleObject(styleObj);

  // Generate simple CSS for base properties
  const baseProperties = rules
    .filter(r => r.selector === '&')
    .map(r => r.css)
    .join(' ');

  const className = styleRegistry.register(baseProperties);

  // Generate full CSS with nested rules
  const fullCSS = generateCSS(styleObj, className);

  const result: CSSResult = {
    className,
    css: fullCSS,
    toString() {
      return this.className;
    }
  };

  return result;
}

/**
 * Compose multiple CSS results
 *
 * @example
 * ```ts
 * const base = css({ padding: '10px' });
 * const primary = css({ backgroundColor: 'blue' });
 * const button = compose(base, primary);
 * ```
 */
export function compose(...styles: (CSSResult | string | undefined | null | false)[]): string {
  return styles
    .filter((s): s is CSSResult | string => Boolean(s))
    .map(s => (typeof s === 'string' ? s : s.className))
    .join(' ');
}

/**
 * Conditional class helper
 *
 * @example
 * ```ts
 * const className = cx(
 *   'base-class',
 *   isActive && 'active',
 *   isDisabled && 'disabled',
 *   conditionalClass
 * );
 * ```
 */
export function cx(...classNames: (string | undefined | null | false)[]): string {
  return classNames.filter(Boolean).join(' ');
}

/**
 * Global styles helper
 *
 * @example
 * ```ts
 * globalStyle('body', {
 *   margin: 0,
 *   padding: 0,
 *   fontFamily: 'system-ui, sans-serif'
 * });
 * ```
 */
export function globalStyle(selector: string, styles: CSSStyleObject): void {
  const rules = processStyleObject(styles);
  const css = rules.map(r => r.css).join(' ');

  styleRegistry.register(`/* global */ ${selector} { ${css} }`);
}

/**
 * Keyframe animation helper
 *
 * @example
 * ```ts
 * const fadeIn = keyframes({
 *   from: { opacity: 0 },
 *   to: { opacity: 1 }
 * });
 *
 * const animated = css({
 *   animation: `${fadeIn} 300ms ease-in`
 * });
 * ```
 */
export function keyframes(frames: Record<string, CSSProperties>): string {
  const name = `animation-${styleRegistry['counter']++}`;
  const frameRules = Object.entries(frames)
    .map(([key, props]) => {
      const rules = processStyleObject(props as CSSStyleObject);
      const css = rules.map(r => r.css).join(' ');
      return `  ${key} { ${css} }`;
    })
    .join('\n');

  const animationCSS = `@keyframes ${name} {\n${frameRules}\n}`;
  styleRegistry.register(animationCSS);

  return name;
}

/**
 * Create a CSS style factory with default props
 *
 * @example
 * ```ts
 * const createButton = styleFactory({
 *   padding: '10px 20px',
 *   borderRadius: '4px'
 * });
 *
 * const primaryButton = createButton({
 *   backgroundColor: 'blue',
 *   color: 'white'
 * });
 * ```
 */
export function styleFactory(defaults: CSSStyleObject) {
  return (overrides: CSSStyleObject = {}): CSSResult => {
    return css({ ...defaults, ...overrides });
  };
}

/**
 * Batch create multiple styles at once
 *
 * @example
 * ```ts
 * const styles = createStyles({
 *   container: { maxWidth: '1200px', margin: '0 auto' },
 *   header: { fontSize: '24px', fontWeight: 'bold' },
 *   button: { padding: '10px 20px', borderRadius: '4px' }
 * });
 * ```
 */
export function createStyles<T extends Record<string, CSSStyleObject>>(
  styles: T
): { [K in keyof T]: CSSResult } {
  const result: Record<string, CSSResult> = {};

  for (const [key, style] of Object.entries(styles)) {
    result[key] = css(style);
  }

  return result as { [K in keyof T]: CSSResult };
}

/**
 * Extract all registered CSS
 */
export function extractCSS(): string {
  return styleRegistry.getStyles();
}

/**
 * Reset the style registry (useful for testing)
 */
export function resetStyles(): void {
  styleRegistry.reset();
}
