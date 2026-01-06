/**
 * @philjs/vanilla-extract - Comprehensive vanilla-extract Integration for PhilJS
 *
 * Type-safe zero-runtime CSS with vanilla-extract integration.
 * Features include:
 * - PhilJS theme contracts and tokens
 * - Signal-aware dynamic theming
 * - Recipe system (CVA-style variants)
 * - Sprinkles (atomic CSS utilities)
 * - Runtime style helpers
 * - CSS variables integration
 * - Global styles and keyframes
 * - Font face definitions
 * - Responsive utilities
 *
 * @example
 * ```typescript
 * // styles.css.ts
 * import { style, recipe, sprinkles, vars } from '@philjs/vanilla-extract';
 *
 * export const button = recipe({
 *   base: {
 *     padding: vars.space[4],
 *     borderRadius: vars.radii.md,
 *   },
 *   variants: {
 *     size: {
 *       small: { padding: vars.space[2] },
 *       large: { padding: vars.space[6] },
 *     },
 *   },
 * });
 *
 * // Component
 * import { button } from './styles.css';
 *
 * <button className={button({ size: 'large' })}>Click me</button>
 * ```
 */

import { signal, computed, effect, type Signal } from '@philjs/core';

// ============================================================================
// Types
// ============================================================================

/** CSS property value types */
export type CSSValue = string | number | undefined;

/** CSS properties object */
export interface CSSProperties {
  [key: string]: CSSValue | CSSProperties;
}

/** Style rule with pseudo-selectors and media queries */
export interface StyleRule extends CSSProperties {
  '@media'?: Record<string, CSSProperties>;
  '@supports'?: Record<string, CSSProperties>;
  '@container'?: Record<string, CSSProperties>;
  ':hover'?: CSSProperties;
  ':focus'?: CSSProperties;
  ':active'?: CSSProperties;
  ':disabled'?: CSSProperties;
  ':first-child'?: CSSProperties;
  ':last-child'?: CSSProperties;
  '::before'?: CSSProperties;
  '::after'?: CSSProperties;
  '::placeholder'?: CSSProperties;
  selectors?: Record<string, CSSProperties>;
  vars?: Record<string, string>;
}

/** Theme contract definition */
export interface ThemeContract {
  colors?: Record<string, string>;
  space?: Record<string, string>;
  sizes?: Record<string, string>;
  fonts?: Record<string, string>;
  fontSizes?: Record<string, string>;
  fontWeights?: Record<string, string>;
  lineHeights?: Record<string, string>;
  letterSpacings?: Record<string, string>;
  radii?: Record<string, string>;
  shadows?: Record<string, string>;
  borders?: Record<string, string>;
  zIndices?: Record<string, string>;
  transitions?: Record<string, string>;
  [key: string]: Record<string, string> | undefined;
}

/** Recipe variant definition */
export interface RecipeVariants {
  [variantName: string]: {
    [variantValue: string]: StyleRule;
  };
}

/** Recipe configuration */
export interface RecipeConfig<V extends RecipeVariants = RecipeVariants> {
  base?: StyleRule;
  variants?: V;
  defaultVariants?: {
    [K in keyof V]?: keyof V[K];
  };
  compoundVariants?: Array<{
    variants: { [K in keyof V]?: keyof V[K] };
    style: StyleRule;
  }>;
}

/** Sprinkles property definition */
export interface SprinklesProperty {
  values: Record<string, string | number> | string[];
  responsive?: boolean;
  conditions?: Record<string, CSSProperties>;
}

/** Sprinkles configuration */
export interface SprinklesConfig {
  conditions?: {
    defaultCondition: string;
    conditionResolver?: (condition: string) => string;
    responsiveArray?: string[];
  } & Record<string, Record<string, string>>;
  properties: Record<string, SprinklesProperty | string[] | Record<string, string | number>>;
  shorthands?: Record<string, string[]>;
}

/** Keyframe definition */
export interface KeyframeRule {
  [percentage: string]: CSSProperties;
}

/** Font face definition */
export interface FontFaceRule {
  src: string;
  fontDisplay?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  fontWeight?: string | number | Array<number>;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  fontStretch?: string;
  fontFeatureSettings?: string;
  fontVariationSettings?: string;
  unicodeRange?: string;
}

/** Global style rules */
export interface GlobalStyleRule {
  [selector: string]: StyleRule;
}

/** Layer definition */
export interface LayerRule {
  [layerName: string]: string;
}

// ============================================================================
// CSS Variables / Theme Tokens
// ============================================================================

/** PhilJS color tokens */
export const colorTokens = {
  // Primary
  primary50: '#eff6ff',
  primary100: '#dbeafe',
  primary200: '#bfdbfe',
  primary300: '#93c5fd',
  primary400: '#60a5fa',
  primary500: '#3b82f6',
  primary600: '#2563eb',
  primary700: '#1d4ed8',
  primary800: '#1e40af',
  primary900: '#1e3a8a',

  // Secondary
  secondary50: '#f5f3ff',
  secondary100: '#ede9fe',
  secondary200: '#ddd6fe',
  secondary300: '#c4b5fd',
  secondary400: '#a78bfa',
  secondary500: '#8b5cf6',
  secondary600: '#7c3aed',
  secondary700: '#6d28d9',
  secondary800: '#5b21b6',
  secondary900: '#4c1d95',

  // Neutral
  neutral50: '#fafafa',
  neutral100: '#f5f5f5',
  neutral200: '#e5e5e5',
  neutral300: '#d4d4d4',
  neutral400: '#a3a3a3',
  neutral500: '#737373',
  neutral600: '#525252',
  neutral700: '#404040',
  neutral800: '#262626',
  neutral900: '#171717',

  // Semantic
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Base
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  current: 'currentColor',
};

/** PhilJS space tokens */
export const spaceTokens = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
};

/** PhilJS font size tokens */
export const fontSizeTokens = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
  '7xl': '4.5rem',
  '8xl': '6rem',
  '9xl': '8rem',
};

/** PhilJS font weight tokens */
export const fontWeightTokens = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

/** PhilJS line height tokens */
export const lineHeightTokens = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
};

/** PhilJS border radius tokens */
export const radiiTokens = {
  none: '0',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
};

/** PhilJS shadow tokens */
export const shadowTokens = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
};

/** PhilJS z-index tokens */
export const zIndexTokens = {
  hide: '-1',
  auto: 'auto',
  base: '0',
  docked: '10',
  dropdown: '1000',
  sticky: '1100',
  banner: '1200',
  overlay: '1300',
  modal: '1400',
  popover: '1500',
  skipLink: '1600',
  toast: '1700',
  tooltip: '1800',
};

/** PhilJS transition tokens */
export const transitionTokens = {
  none: 'none',
  all: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  colors: 'color, background-color, border-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  shadow: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  transform: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
};

/** PhilJS breakpoint tokens */
export const breakpointTokens = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================================================
// Theme Contract
// ============================================================================

/**
 * Create a theme contract with CSS variables
 */
export function createThemeContract<T extends ThemeContract>(contract: T): T {
  const result: Record<string, Record<string, string>> = {};

  for (const [category, tokens] of Object.entries(contract)) {
    if (!tokens) continue;

    result[category] = {};
    for (const [name, _value] of Object.entries(tokens)) {
      // Generate CSS variable reference
      result[category][name] = `var(--${category}-${name})`;
    }
  }

  return result as T;
}

/**
 * Create a theme that implements a contract
 */
export function createTheme<T extends ThemeContract>(
  contract: T,
  tokens: T,
  className?: string
): { className: string; vars: T } {
  const vars: Record<string, Record<string, string>> = {};
  const cssVars: Record<string, string> = {};

  for (const [category, categoryTokens] of Object.entries(tokens)) {
    if (!categoryTokens) continue;

    vars[category] = {};
    for (const [name, value] of Object.entries(categoryTokens)) {
      const varName = `--${category}-${name}`;
      vars[category][name] = `var(${varName})`;
      cssVars[varName] = value;
    }
  }

  const generatedClassName = className || `theme-${generateHash(JSON.stringify(tokens))}`;

  return {
    className: generatedClassName,
    vars: vars as T,
  };
}

/** Default PhilJS theme contract */
export const philjsThemeContract = createThemeContract({
  colors: colorTokens,
  space: spaceTokens,
  fontSizes: fontSizeTokens,
  fontWeights: fontWeightTokens,
  lineHeights: lineHeightTokens,
  radii: radiiTokens,
  shadows: shadowTokens,
  zIndices: zIndexTokens,
  transitions: transitionTokens,
});

/** CSS variables reference (shorthand) */
export const vars = philjsThemeContract;

// ============================================================================
// Style Functions
// ============================================================================

/**
 * Generate a unique hash for class name generation
 */
function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Convert camelCase to kebab-case
 */
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Process a style rule into CSS string
 */
function processStyleRule(rule: StyleRule, selector: string): string {
  const cssLines: string[] = [];
  const nestedRules: string[] = [];

  for (const [key, value] of Object.entries(rule)) {
    if (value === undefined || value === null) continue;

    if (key === 'selectors') {
      // Handle selectors
      const selectors = value as Record<string, CSSProperties>;
      for (const [sel, styles] of Object.entries(selectors)) {
        const resolvedSelector = sel.replace(/&/g, selector);
        nestedRules.push(processStyleRule(styles as StyleRule, resolvedSelector));
      }
    } else if (key === 'vars') {
      // Handle CSS variables
      const varsObj = value as Record<string, string>;
      for (const [varName, varValue] of Object.entries(varsObj)) {
        cssLines.push(`  --${varName}: ${varValue};`);
      }
    } else if (key.startsWith('@media')) {
      // Handle media queries
      const mediaStyles = value as CSSProperties;
      const mediaQuery = key;
      nestedRules.push(`${mediaQuery} {\n${processStyleRule(mediaStyles as StyleRule, selector)}\n}`);
    } else if (key.startsWith('@supports') || key.startsWith('@container')) {
      // Handle other at-rules
      const atStyles = value as CSSProperties;
      nestedRules.push(`${key} {\n${processStyleRule(atStyles as StyleRule, selector)}\n}`);
    } else if (key.startsWith(':') || key.startsWith('::')) {
      // Handle pseudo-selectors
      const pseudoStyles = value as CSSProperties;
      nestedRules.push(processStyleRule(pseudoStyles as StyleRule, `${selector}${key}`));
    } else if (typeof value === 'object') {
      // Nested styles (shouldn't happen in well-formed input)
      continue;
    } else {
      // Regular CSS property
      const cssProperty = toKebabCase(key);
      cssLines.push(`  ${cssProperty}: ${value};`);
    }
  }

  let css = '';
  if (cssLines.length > 0) {
    css = `${selector} {\n${cssLines.join('\n')}\n}`;
  }

  if (nestedRules.length > 0) {
    css += '\n' + nestedRules.join('\n');
  }

  return css;
}

/**
 * Create a style and return a class name
 *
 * @example
 * ```typescript
 * const buttonStyle = style({
 *   padding: vars.space[4],
 *   backgroundColor: vars.colors.primary500,
 *   borderRadius: vars.radii.md,
 *   ':hover': {
 *     backgroundColor: vars.colors.primary600,
 *   },
 * });
 * ```
 */
export function style(rule: StyleRule, debugId?: string): string {
  const className = debugId || `style-${generateHash(JSON.stringify(rule))}`;

  // In a real implementation, this would register the style
  // For now, return the class name
  return className;
}

/**
 * Create a style variant (conditional style based on selector)
 */
export function styleVariants<
  T extends Record<string, StyleRule>
>(variants: T, debugId?: string): { [K in keyof T]: string } {
  const result: Record<string, string> = {};

  for (const [key, rule] of Object.entries(variants)) {
    const className = debugId ? `${debugId}-${key}` : `variant-${generateHash(JSON.stringify(rule))}`;
    result[key] = className;
  }

  return result as { [K in keyof T]: string };
}

/**
 * Compose multiple class names
 */
export function composeStyles(...classNames: (string | undefined | null | false)[]): string {
  return classNames.filter(Boolean).join(' ');
}

// ============================================================================
// Recipe System
// ============================================================================

/**
 * Create a recipe (variant-based style function)
 *
 * @example
 * ```typescript
 * const button = recipe({
 *   base: {
 *     display: 'inline-flex',
 *     alignItems: 'center',
 *     borderRadius: vars.radii.md,
 *   },
 *   variants: {
 *     size: {
 *       small: { padding: vars.space[2], fontSize: vars.fontSizes.sm },
 *       medium: { padding: vars.space[4], fontSize: vars.fontSizes.base },
 *       large: { padding: vars.space[6], fontSize: vars.fontSizes.lg },
 *     },
 *     variant: {
 *       solid: { backgroundColor: vars.colors.primary500, color: 'white' },
 *       outline: { border: '1px solid', borderColor: vars.colors.primary500 },
 *     },
 *   },
 *   defaultVariants: {
 *     size: 'medium',
 *     variant: 'solid',
 *   },
 * });
 *
 * // Usage
 * <button className={button({ size: 'large', variant: 'outline' })}>
 * ```
 */
export function recipe<V extends RecipeVariants>(
  config: RecipeConfig<V>
): (options?: { [K in keyof V]?: keyof V[K] }) => string {
  const { base, variants, defaultVariants, compoundVariants } = config;

  // Generate class names for base and variants
  const baseClassName = base ? style(base, 'recipe-base') : '';

  const variantClassNames: Record<string, Record<string, string>> = {};

  if (variants) {
    for (const [variantName, variantOptions] of Object.entries(variants)) {
      variantClassNames[variantName] = {};
      for (const [optionName, optionStyle] of Object.entries(variantOptions)) {
        variantClassNames[variantName][optionName] = style(
          optionStyle,
          `recipe-${variantName}-${optionName}`
        );
      }
    }
  }

  // Generate compound variant class names
  const compoundClassNames: Array<{
    check: Record<string, string>;
    className: string;
  }> = [];

  if (compoundVariants) {
    for (let i = 0; i < compoundVariants.length; i++) {
      const compound = compoundVariants[i];
      compoundClassNames.push({
        check: compound.variants as Record<string, string>,
        className: style(compound.style, `recipe-compound-${i}`),
      });
    }
  }

  return (options = {}) => {
    const classes: string[] = [];

    // Add base class
    if (baseClassName) {
      classes.push(baseClassName);
    }

    // Merge default variants with provided options
    const resolvedOptions = { ...defaultVariants, ...options } as Record<string, string>;

    // Add variant classes
    for (const [variantName, variantValue] of Object.entries(resolvedOptions)) {
      if (variantValue && variantClassNames[variantName]?.[variantValue]) {
        classes.push(variantClassNames[variantName][variantValue]);
      }
    }

    // Check compound variants
    for (const compound of compoundClassNames) {
      const matches = Object.entries(compound.check).every(
        ([key, value]) => resolvedOptions[key] === value
      );
      if (matches) {
        classes.push(compound.className);
      }
    }

    return classes.join(' ');
  };
}

/**
 * Get the variant types from a recipe
 */
export type RecipeVariantProps<R> = R extends (options?: infer V) => string ? V : never;

// ============================================================================
// Sprinkles (Atomic CSS)
// ============================================================================

/**
 * Create sprinkles (atomic CSS utility function)
 *
 * @example
 * ```typescript
 * const sprinkles = createSprinkles({
 *   conditions: {
 *     default: {},
 *     hover: { selector: '&:hover' },
 *     focus: { selector: '&:focus' },
 *     sm: { '@media': 'screen and (min-width: 640px)' },
 *     md: { '@media': 'screen and (min-width: 768px)' },
 *   },
 *   properties: {
 *     padding: spaceTokens,
 *     margin: spaceTokens,
 *     backgroundColor: colorTokens,
 *     color: colorTokens,
 *     fontSize: fontSizeTokens,
 *     borderRadius: radiiTokens,
 *   },
 *   shorthands: {
 *     p: ['padding'],
 *     m: ['margin'],
 *     bg: ['backgroundColor'],
 *   },
 * });
 *
 * // Usage
 * <div className={sprinkles({ p: '4', bg: 'primary500', color: 'white' })}>
 * ```
 */
export function createSprinkles<C extends SprinklesConfig>(
  config: C
): (props: Record<string, any>) => string {
  const { conditions, properties, shorthands } = config;

  // Generate atomic classes for all property/value combinations
  const atomicClasses: Record<string, Record<string, Record<string, string>>> = {};

  for (const [propName, propConfig] of Object.entries(properties)) {
    atomicClasses[propName] = {};

    let values: Record<string, string | number>;

    if (Array.isArray(propConfig)) {
      values = Object.fromEntries(propConfig.map((v) => [v, v]));
    } else if ('values' in propConfig) {
      values = Array.isArray(propConfig.values)
        ? Object.fromEntries(propConfig.values.map((v) => [v, v]))
        : propConfig.values;
    } else {
      values = propConfig;
    }

    for (const [valueName, _value] of Object.entries(values)) {
      atomicClasses[propName][valueName] = {};

      if (conditions) {
        for (const conditionName of Object.keys(conditions)) {
          if (conditionName === 'defaultCondition' || conditionName === 'conditionResolver' || conditionName === 'responsiveArray') {
            continue;
          }
          atomicClasses[propName][valueName][conditionName] = `${propName}-${valueName}-${conditionName}`;
        }
      }

      atomicClasses[propName][valueName]['default'] = `${propName}-${valueName}`;
    }
  }

  // Resolve shorthands
  const resolveShorthand = (prop: string): string[] => {
    if (shorthands && shorthands[prop]) {
      return shorthands[prop];
    }
    return [prop];
  };

  return (props: Record<string, any>) => {
    const classes: string[] = [];

    for (const [prop, value] of Object.entries(props)) {
      if (value === undefined || value === null) continue;

      const resolvedProps = resolveShorthand(prop);

      for (const resolvedProp of resolvedProps) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          // Conditional values
          for (const [condition, condValue] of Object.entries(value)) {
            const className = atomicClasses[resolvedProp]?.[condValue as string]?.[condition];
            if (className) {
              classes.push(className);
            }
          }
        } else if (Array.isArray(value)) {
          // Responsive array
          const responsiveArray = conditions?.responsiveArray || ['default', 'sm', 'md', 'lg', 'xl', '2xl'];
          value.forEach((v, index) => {
            if (v !== null && v !== undefined) {
              const condition = responsiveArray[index] || 'default';
              const className = atomicClasses[resolvedProp]?.[v]?.[condition];
              if (className) {
                classes.push(className);
              }
            }
          });
        } else {
          // Simple value
          const className = atomicClasses[resolvedProp]?.[value]?.default;
          if (className) {
            classes.push(className);
          }
        }
      }
    }

    return classes.join(' ');
  };
}

/** Default PhilJS sprinkles */
export const sprinkles = createSprinkles({
  conditions: {
    defaultCondition: 'default',
    responsiveArray: ['default', 'sm', 'md', 'lg', 'xl'],
    default: {},
    hover: { selector: '&:hover' },
    focus: { selector: '&:focus' },
    active: { selector: '&:active' },
    disabled: { selector: '&:disabled' },
    sm: { '@media': 'screen and (min-width: 640px)' },
    md: { '@media': 'screen and (min-width: 768px)' },
    lg: { '@media': 'screen and (min-width: 1024px)' },
    xl: { '@media': 'screen and (min-width: 1280px)' },
  } as any,
  properties: {
    // Layout
    display: ['none', 'block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid'],
    position: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
    overflow: ['visible', 'hidden', 'scroll', 'auto'],

    // Flexbox
    flexDirection: ['row', 'row-reverse', 'column', 'column-reverse'],
    flexWrap: ['nowrap', 'wrap', 'wrap-reverse'],
    justifyContent: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'],
    alignItems: ['flex-start', 'flex-end', 'center', 'baseline', 'stretch'],
    gap: spaceTokens,

    // Spacing
    padding: spaceTokens,
    paddingTop: spaceTokens,
    paddingRight: spaceTokens,
    paddingBottom: spaceTokens,
    paddingLeft: spaceTokens,
    margin: spaceTokens,
    marginTop: spaceTokens,
    marginRight: spaceTokens,
    marginBottom: spaceTokens,
    marginLeft: spaceTokens,

    // Sizing
    width: { ...spaceTokens, full: '100%', screen: '100vw', auto: 'auto' },
    height: { ...spaceTokens, full: '100%', screen: '100vh', auto: 'auto' },
    minWidth: { 0: '0', full: '100%', min: 'min-content', max: 'max-content' },
    maxWidth: { ...spaceTokens, full: '100%', none: 'none' },

    // Typography
    fontSize: fontSizeTokens,
    fontWeight: fontWeightTokens,
    lineHeight: lineHeightTokens,
    textAlign: ['left', 'center', 'right', 'justify'],

    // Colors
    color: colorTokens,
    backgroundColor: colorTokens,

    // Borders
    borderRadius: radiiTokens,
    borderWidth: { 0: '0', 1: '1px', 2: '2px', 4: '4px', 8: '8px' },
    borderColor: colorTokens,
    borderStyle: ['none', 'solid', 'dashed', 'dotted'],

    // Effects
    boxShadow: shadowTokens,
    opacity: { 0: '0', 25: '0.25', 50: '0.5', 75: '0.75', 100: '1' },

    // Other
    cursor: ['auto', 'pointer', 'default', 'not-allowed', 'grab', 'grabbing'],
    zIndex: zIndexTokens,
    transition: transitionTokens,
  },
  shorthands: {
    p: ['padding'],
    pt: ['paddingTop'],
    pr: ['paddingRight'],
    pb: ['paddingBottom'],
    pl: ['paddingLeft'],
    px: ['paddingLeft', 'paddingRight'],
    py: ['paddingTop', 'paddingBottom'],
    m: ['margin'],
    mt: ['marginTop'],
    mr: ['marginRight'],
    mb: ['marginBottom'],
    ml: ['marginLeft'],
    mx: ['marginLeft', 'marginRight'],
    my: ['marginTop', 'marginBottom'],
    bg: ['backgroundColor'],
    rounded: ['borderRadius'],
    shadow: ['boxShadow'],
    w: ['width'],
    h: ['height'],
  },
});

// ============================================================================
// Keyframes
// ============================================================================

/**
 * Define keyframes animation
 *
 * @example
 * ```typescript
 * const fadeIn = keyframes({
 *   '0%': { opacity: '0' },
 *   '100%': { opacity: '1' },
 * });
 *
 * const style = style({
 *   animation: `${fadeIn} 300ms ease-in-out`,
 * });
 * ```
 */
export function keyframes(frames: KeyframeRule, debugId?: string): string {
  const name = debugId || `keyframes-${generateHash(JSON.stringify(frames))}`;
  return name;
}

/** Pre-defined keyframe animations */
export const animations = {
  fadeIn: keyframes({
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  }, 'fadeIn'),

  fadeOut: keyframes({
    '0%': { opacity: '1' },
    '100%': { opacity: '0' },
  }, 'fadeOut'),

  slideInUp: keyframes({
    '0%': { transform: 'translateY(100%)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  }, 'slideInUp'),

  slideInDown: keyframes({
    '0%': { transform: 'translateY(-100%)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  }, 'slideInDown'),

  slideInLeft: keyframes({
    '0%': { transform: 'translateX(-100%)', opacity: '0' },
    '100%': { transform: 'translateX(0)', opacity: '1' },
  }, 'slideInLeft'),

  slideInRight: keyframes({
    '0%': { transform: 'translateX(100%)', opacity: '0' },
    '100%': { transform: 'translateX(0)', opacity: '1' },
  }, 'slideInRight'),

  scaleIn: keyframes({
    '0%': { transform: 'scale(0.9)', opacity: '0' },
    '100%': { transform: 'scale(1)', opacity: '1' },
  }, 'scaleIn'),

  scaleOut: keyframes({
    '0%': { transform: 'scale(1)', opacity: '1' },
    '100%': { transform: 'scale(0.9)', opacity: '0' },
  }, 'scaleOut'),

  spin: keyframes({
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  }, 'spin'),

  ping: keyframes({
    '0%': { transform: 'scale(1)', opacity: '1' },
    '75%, 100%': { transform: 'scale(2)', opacity: '0' },
  }, 'ping'),

  pulse: keyframes({
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.5' },
  }, 'pulse'),

  bounce: keyframes({
    '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
    '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
  }, 'bounce'),

  shimmer: keyframes({
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  }, 'shimmer'),
};

// ============================================================================
// Font Face
// ============================================================================

/**
 * Define a font face
 *
 * @example
 * ```typescript
 * const interFont = fontFace({
 *   src: 'url(/fonts/Inter.woff2) format("woff2")',
 *   fontWeight: '100 900',
 *   fontStyle: 'normal',
 *   fontDisplay: 'swap',
 * });
 * ```
 */
export function fontFace(rule: FontFaceRule, fontFamily?: string): string {
  const name = fontFamily || `font-${generateHash(JSON.stringify(rule))}`;
  return name;
}

// ============================================================================
// Global Styles
// ============================================================================

/**
 * Define global styles
 *
 * @example
 * ```typescript
 * globalStyle('html, body', {
 *   margin: 0,
 *   padding: 0,
 *   fontFamily: vars.fonts.sans,
 * });
 *
 * globalStyle(`${containerClass} > *`, {
 *   marginBottom: vars.space[4],
 * });
 * ```
 */
export function globalStyle(selector: string, rule: StyleRule): void {
  // In a real implementation, this would register the global style
  // For build-time extraction
}

/**
 * Define a CSS layer
 */
export function layer(name: string): string {
  return name;
}

/**
 * Create global CSS reset
 */
export function createGlobalReset(): void {
  globalStyle('*, *::before, *::after', {
    boxSizing: 'border-box',
    margin: 0,
    padding: 0,
  });

  globalStyle('html', {
    lineHeight: '1.5',
    WebkitTextSizeAdjust: '100%',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    tabSize: '4',
  });

  globalStyle('body', {
    lineHeight: 'inherit',
    minHeight: '100vh',
  });

  globalStyle('img, picture, video, canvas, svg', {
    display: 'block',
    maxWidth: '100%',
  });

  globalStyle('input, button, textarea, select', {
    font: 'inherit',
  });

  globalStyle('p, h1, h2, h3, h4, h5, h6', {
    overflowWrap: 'break-word',
  });

  globalStyle('#root, #__next', {
    isolation: 'isolate',
  });
}

// ============================================================================
// Signal Integration
// ============================================================================

/**
 * Create a signal-controlled theme
 *
 * @example
 * ```typescript
 * const { theme, setTheme, vars } = createPhilJSTheme({
 *   colors: {
 *     primary: '#3b82f6',
 *     background: '#ffffff',
 *   },
 * });
 *
 * // Change theme reactively
 * setTheme({ colors: { primary: '#8b5cf6' } });
 * ```
 */
export function createPhilJSTheme<T extends ThemeContract>(
  initialContract: T
): {
  theme: Signal<T>;
  vars: T;
  setTheme: (newTheme: Partial<T>) => void;
  updateTheme: (updater: (current: T) => Partial<T>) => void;
  resetTheme: () => void;
  cssVars: Signal<Record<string, string>>;
} {
  const theme = signal<T>(initialContract);

  // Create static var references
  const vars = createThemeContract(initialContract);

  // Compute CSS variables
  const cssVars = computed(() => {
    const currentTheme = theme();
    const result: Record<string, string> = {};

    for (const [category, tokens] of Object.entries(currentTheme)) {
      if (!tokens) continue;
      for (const [name, value] of Object.entries(tokens)) {
        result[`--${category}-${name}`] = value;
      }
    }

    return result;
  });

  // Apply CSS variables to document
  effect(() => {
    const variables = cssVars();
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      for (const [name, value] of Object.entries(variables)) {
        root.style.setProperty(name, value);
      }
    }
  });

  return {
    theme,
    vars,
    setTheme: (newTheme) => {
      theme.update((current) => deepMerge(current, newTheme as T));
    },
    updateTheme: (updater) => {
      theme.update((current) => deepMerge(current, updater(current) as T));
    },
    resetTheme: () => {
      theme.set(initialContract);
    },
    cssVars,
  };
}

/**
 * Create a color mode signal for dark/light theming
 */
export function createColorMode(
  defaultMode: 'light' | 'dark' | 'system' = 'system'
): {
  mode: Signal<'light' | 'dark' | 'system'>;
  resolvedMode: Signal<'light' | 'dark'>;
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  toggle: () => void;
  isDark: Signal<boolean>;
  isLight: Signal<boolean>;
} {
  const mode = signal<'light' | 'dark' | 'system'>(defaultMode);

  const resolvedMode = computed(() => {
    const currentMode = mode();
    if (currentMode !== 'system') return currentMode;

    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const isDark = computed(() => resolvedMode() === 'dark');
  const isLight = computed(() => resolvedMode() === 'light');

  // Sync with document
  effect(() => {
    const resolved = resolvedMode();
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = resolved;
      document.documentElement.classList.toggle('dark', resolved === 'dark');
      document.documentElement.classList.toggle('light', resolved === 'light');
    }
  });

  return {
    mode,
    resolvedMode,
    setMode: (newMode) => mode.set(newMode),
    toggle: () => {
      const current = resolvedMode();
      mode.set(current === 'light' ? 'dark' : 'light');
    },
    isDark,
    isLight,
  };
}

/**
 * Create signal-controlled dynamic styles
 */
export function createDynamicStyle<P extends Record<string, any>>(
  styleFactory: (props: P) => StyleRule
): (props: Signal<P> | P) => Signal<string> {
  return (props) => {
    return computed(() => {
      const resolvedProps = typeof props === 'function' ? props() : props;
      const styleRule = styleFactory(resolvedProps);
      return style(styleRule);
    });
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Deep merge two objects
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const targetValue = result[key as keyof T];
    const sourceValue = source[key as keyof T];

    if (
      targetValue &&
      sourceValue &&
      typeof targetValue === 'object' &&
      typeof sourceValue === 'object' &&
      !Array.isArray(targetValue) &&
      !Array.isArray(sourceValue)
    ) {
      (result as Record<string, any>)[key] = deepMerge(
        targetValue as Record<string, any>,
        sourceValue as Record<string, any>
      );
    } else if (sourceValue !== undefined) {
      (result as Record<string, any>)[key] = sourceValue;
    }
  }

  return result;
}

/**
 * Create a CSS calc expression
 */
export function calc(expression: string): string {
  return `calc(${expression})`;
}

/**
 * Create a CSS clamp expression
 */
export function clamp(min: string, preferred: string, max: string): string {
  return `clamp(${min}, ${preferred}, ${max})`;
}

/**
 * Create a CSS min expression
 */
export function min(...values: string[]): string {
  return `min(${values.join(', ')})`;
}

/**
 * Create a CSS max expression
 */
export function max(...values: string[]): string {
  return `max(${values.join(', ')})`;
}

/**
 * Create a CSS var reference
 */
export function cssVar(name: string, fallback?: string): string {
  return fallback ? `var(--${name}, ${fallback})` : `var(--${name})`;
}

/**
 * Create media query helper
 */
export const media = {
  sm: '@media (min-width: 640px)',
  md: '@media (min-width: 768px)',
  lg: '@media (min-width: 1024px)',
  xl: '@media (min-width: 1280px)',
  '2xl': '@media (min-width: 1536px)',
  hover: '@media (hover: hover)',
  motion: '@media (prefers-reduced-motion: no-preference)',
  dark: '@media (prefers-color-scheme: dark)',
  light: '@media (prefers-color-scheme: light)',
  print: '@media print',
  portrait: '@media (orientation: portrait)',
  landscape: '@media (orientation: landscape)',
};

/**
 * Create responsive value helper
 */
export function responsive<T>(values: {
  base?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}): Record<string, T> {
  const result: Record<string, T> = {};

  if (values.base !== undefined) result['@media (min-width: 0)'] = values.base;
  if (values.sm !== undefined) result[media.sm] = values.sm;
  if (values.md !== undefined) result[media.md] = values.md;
  if (values.lg !== undefined) result[media.lg] = values.lg;
  if (values.xl !== undefined) result[media.xl] = values.xl;
  if (values['2xl'] !== undefined) result[media['2xl']] = values['2xl'];

  return result;
}

/**
 * Fallback style for browsers that don't support a feature
 */
export function fallbackVar(cssVarName: string, fallback: string): string {
  return `var(--${cssVarName}, ${fallback})`;
}

/**
 * Create contrast color (for text on colored backgrounds)
 */
export function contrastColor(
  backgroundColor: string,
  lightColor = '#ffffff',
  darkColor = '#000000'
): string {
  // This is a simplified version - real implementation would use color parsing
  return cssVar('contrast-color', lightColor);
}

// ============================================================================
// Pre-built Component Recipes
// ============================================================================

/** Button recipe */
export const buttonRecipe = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: vars.radii.md,
    fontWeight: vars.fontWeights.medium,
    transition: vars.transitions.all,
    cursor: 'pointer',
    ':disabled': {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
    ':focus': {
      outline: '2px solid',
      outlineColor: vars.colors.primary500,
      outlineOffset: '2px',
    },
  },
  variants: {
    variant: {
      solid: {
        backgroundColor: vars.colors.primary500,
        color: vars.colors.white,
        ':hover': {
          backgroundColor: vars.colors.primary600,
        },
      },
      outline: {
        backgroundColor: 'transparent',
        border: '1px solid',
        borderColor: vars.colors.primary500,
        color: vars.colors.primary500,
        ':hover': {
          backgroundColor: vars.colors.primary50,
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: vars.colors.primary500,
        ':hover': {
          backgroundColor: vars.colors.primary50,
        },
      },
    },
    size: {
      sm: {
        height: vars.space[8],
        paddingLeft: vars.space[3],
        paddingRight: vars.space[3],
        fontSize: vars.fontSizes.sm,
      },
      md: {
        height: vars.space[10],
        paddingLeft: vars.space[4],
        paddingRight: vars.space[4],
        fontSize: vars.fontSizes.base,
      },
      lg: {
        height: vars.space[12],
        paddingLeft: vars.space[6],
        paddingRight: vars.space[6],
        fontSize: vars.fontSizes.lg,
      },
    },
  },
  defaultVariants: {
    variant: 'solid',
    size: 'md',
  },
});

/** Input recipe */
export const inputRecipe = recipe({
  base: {
    width: '100%',
    borderRadius: vars.radii.md,
    border: '1px solid',
    borderColor: vars.colors.neutral300,
    backgroundColor: vars.colors.white,
    transition: vars.transitions.colors,
    '::placeholder': {
      color: vars.colors.neutral400,
    },
    ':hover': {
      borderColor: vars.colors.neutral400,
    },
    ':focus': {
      borderColor: vars.colors.primary500,
      outline: 'none',
      boxShadow: `0 0 0 1px ${vars.colors.primary500}`,
    },
    ':disabled': {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
  variants: {
    size: {
      sm: {
        height: vars.space[8],
        paddingLeft: vars.space[3],
        paddingRight: vars.space[3],
        fontSize: vars.fontSizes.sm,
      },
      md: {
        height: vars.space[10],
        paddingLeft: vars.space[4],
        paddingRight: vars.space[4],
        fontSize: vars.fontSizes.base,
      },
      lg: {
        height: vars.space[12],
        paddingLeft: vars.space[4],
        paddingRight: vars.space[4],
        fontSize: vars.fontSizes.lg,
      },
    },
    state: {
      default: {},
      error: {
        borderColor: vars.colors.error,
        ':focus': {
          boxShadow: `0 0 0 1px ${vars.colors.error}`,
        },
      },
      success: {
        borderColor: vars.colors.success,
        ':focus': {
          boxShadow: `0 0 0 1px ${vars.colors.success}`,
        },
      },
    },
  },
  defaultVariants: {
    size: 'md',
    state: 'default',
  },
});

/** Card recipe */
export const cardRecipe = recipe({
  base: {
    backgroundColor: vars.colors.white,
    borderRadius: vars.radii.lg,
    overflow: 'hidden',
  },
  variants: {
    variant: {
      elevated: {
        boxShadow: vars.shadows.md,
      },
      outline: {
        border: '1px solid',
        borderColor: vars.colors.neutral200,
      },
      filled: {
        backgroundColor: vars.colors.neutral50,
      },
    },
    padding: {
      none: {},
      sm: { padding: vars.space[4] },
      md: { padding: vars.space[6] },
      lg: { padding: vars.space[8] },
    },
  },
  defaultVariants: {
    variant: 'elevated',
    padding: 'md',
  },
});

// ============================================================================
// Exports
// ============================================================================

export {
  colorTokens,
  spaceTokens,
  fontSizeTokens,
  fontWeightTokens,
  lineHeightTokens,
  radiiTokens,
  shadowTokens,
  zIndexTokens,
  transitionTokens,
  breakpointTokens,
};
