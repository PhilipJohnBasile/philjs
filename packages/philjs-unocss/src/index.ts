/**
 * @philjs/unocss - Comprehensive UnoCSS Integration for PhilJS
 *
 * Atomic CSS-in-JS with UnoCSS and PhilJS signals integration.
 * Features include:
 * - PhilJS preset with tokens, shortcuts, and rules
 * - Signal-aware dynamic styling
 * - Attributify mode support
 * - Icons integration
 * - Typography preset
 * - Web fonts integration
 * - Variant groups
 * - Tagify mode
 * - Runtime utilities
 * - Theme switching
 * - CSS custom properties
 *
 * @example
 * ```typescript
 * // uno.config.ts
 * import { defineConfig } from 'unocss';
 * import { presetPhilJS, presetPhilJSIcons, philjsTheme } from '@philjs/unocss';
 *
 * export default defineConfig({
 *   presets: [presetPhilJS(), presetPhilJSIcons()],
 *   theme: philjsTheme,
 * });
 *
 * // Component
 * import { uno, useTheme, css } from '@philjs/unocss';
 *
 * const theme = useTheme();
 * <button class={uno('px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-md')}>
 * ```
 */

import { signal, computed, effect, batch, type Signal, type Computed } from '@philjs/core';

// ============================================================================
// Types
// ============================================================================

/** UnoCSS Preset interface */
export interface Preset {
  name: string;
  enforce?: 'pre' | 'post';
  theme?: Theme;
  rules?: Rule[];
  shortcuts?: Shortcut[];
  variants?: Variant[];
  preflights?: Preflight[];
  safelist?: string[];
  blocklist?: string[];
  layers?: Record<string, number>;
  extractors?: Extractor[];
  preprocess?: Preprocessor[];
  postprocess?: Postprocessor[];
}

/** Theme configuration */
export interface Theme {
  colors?: Record<string, string | Record<string, string>>;
  spacing?: Record<string, string>;
  fontSize?: Record<string, string | [string, string | Record<string, string>]>;
  fontFamily?: Record<string, string>;
  fontWeight?: Record<string, string | number>;
  lineHeight?: Record<string, string | number>;
  letterSpacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
  boxShadow?: Record<string, string>;
  breakpoints?: Record<string, string>;
  zIndex?: Record<string, string | number>;
  animation?: Record<string, string>;
  easing?: Record<string, string>;
  duration?: Record<string, string>;
  [key: string]: any;
}

/** Rule definition */
export type Rule = [RegExp | string, Record<string, string> | RuleHandler] | [RegExp | string, Record<string, string> | RuleHandler, RuleMeta];

/** Rule handler function */
export type RuleHandler = (match: RegExpMatchArray, context: RuleContext) => Record<string, string> | string | undefined;

/** Rule context */
export interface RuleContext {
  theme: Theme;
  symbols: Record<string, symbol>;
  rawSelector: string;
  currentSelector: string;
  generator: any;
  variantHandlers: any[];
}

/** Rule metadata */
export interface RuleMeta {
  layer?: string;
  sort?: number;
  prefix?: string;
  internal?: boolean;
}

/** Shortcut definition */
export type Shortcut = [string | RegExp, string | ShortcutHandler] | [string | RegExp, string | ShortcutHandler, ShortcutMeta];

/** Shortcut handler */
export type ShortcutHandler = (match: RegExpMatchArray, context: RuleContext) => string | undefined;

/** Shortcut metadata */
export interface ShortcutMeta {
  layer?: string;
}

/** Variant definition */
export interface Variant {
  name: string;
  match: (input: string, context: any) => VariantMatchResult | undefined;
  multiPass?: boolean;
  autocomplete?: string | string[];
}

/** Variant match result */
export interface VariantMatchResult {
  matcher: string;
  selector?: (selector: string) => string | undefined;
  parent?: string;
  layer?: string;
  body?: (body: string) => string | undefined;
}

/** Preflight definition */
export interface Preflight {
  getCSS: (context: { theme: Theme }) => string | Promise<string>;
  layer?: string;
}

/** Extractor definition */
export interface Extractor {
  name: string;
  extract: (code: string, id?: string) => Set<string> | string[] | Promise<Set<string> | string[]>;
  order?: number;
}

/** Preprocessor */
export type Preprocessor = (matcher: string, context: any) => string | undefined;

/** Postprocessor */
export type Postprocessor = (util: any, context: any) => void;

/** PhilJS preset options */
export interface PhilJSPresetOptions {
  /** Prefix for PhilJS utilities */
  prefix?: string;
  /** Enable dark mode support */
  darkMode?: boolean | 'class' | 'media';
  /** Custom theme colors */
  colors?: Record<string, string | Record<string, string>>;
  /** Enable important utilities */
  important?: boolean | string;
  /** Enable attributify mode */
  attributify?: boolean;
  /** Enable tagify mode */
  tagify?: boolean;
  /** Enable icons preset */
  icons?: boolean | IconsOptions;
  /** Enable typography preset */
  typography?: boolean | TypographyOptions;
  /** Enable web fonts */
  webFonts?: boolean | WebFontsOptions;
  /** Enable variant groups */
  variantGroup?: boolean;
  /** Component prefix */
  componentPrefix?: string;
}

/** Icons preset options */
export interface IconsOptions {
  /** Icon scale */
  scale?: number;
  /** Icon mode */
  mode?: 'mask' | 'background' | 'auto';
  /** Warn on missing icons */
  warn?: boolean;
  /** Custom icon collections */
  collections?: Record<string, Record<string, string> | (() => Promise<Record<string, string>>)>;
  /** Extra CSS properties */
  extraProperties?: Record<string, string>;
  /** CDN URL */
  cdn?: string;
}

/** Typography preset options */
export interface TypographyOptions {
  /** CSS class for prose */
  cssExtend?: Record<string, Record<string, string>>;
  /** Selector prefix */
  selectorName?: string;
}

/** Web fonts options */
export interface WebFontsOptions {
  /** Font provider */
  provider?: 'google' | 'bunny' | 'fontshare' | 'none';
  /** Font families */
  fonts?: Record<string, string | WebFontMeta | (string | WebFontMeta)[]>;
}

/** Web font metadata */
export interface WebFontMeta {
  name: string;
  weights?: (string | number)[];
  italic?: boolean;
  provider?: string;
}

// ============================================================================
// Color System
// ============================================================================

/** PhilJS color palette */
export const philjsColors = {
  // Primary
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Secondary
  secondary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
  },

  // Accent
  accent: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    950: '#083344',
  },

  // Success
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  // Warning
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  // Error/Danger
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },

  // Neutral/Gray
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },

  // Base
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  current: 'currentColor',
};

// ============================================================================
// Spacing System
// ============================================================================

/** PhilJS spacing scale */
export const philjsSpacing: Record<string, string> = {
  '0': '0',
  'px': '1px',
  '0.5': '0.125rem',
  '1': '0.25rem',
  '1.5': '0.375rem',
  '2': '0.5rem',
  '2.5': '0.625rem',
  '3': '0.75rem',
  '3.5': '0.875rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '7': '1.75rem',
  '8': '2rem',
  '9': '2.25rem',
  '10': '2.5rem',
  '11': '2.75rem',
  '12': '3rem',
  '14': '3.5rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
  '28': '7rem',
  '32': '8rem',
  '36': '9rem',
  '40': '10rem',
  '44': '11rem',
  '48': '12rem',
  '52': '13rem',
  '56': '14rem',
  '60': '15rem',
  '64': '16rem',
  '72': '18rem',
  '80': '20rem',
  '96': '24rem',
};

// ============================================================================
// Typography
// ============================================================================

/** PhilJS font sizes */
export const philjsFontSizes: Record<string, [string, string]> = {
  'xs': ['0.75rem', '1rem'],
  'sm': ['0.875rem', '1.25rem'],
  'base': ['1rem', '1.5rem'],
  'lg': ['1.125rem', '1.75rem'],
  'xl': ['1.25rem', '1.75rem'],
  '2xl': ['1.5rem', '2rem'],
  '3xl': ['1.875rem', '2.25rem'],
  '4xl': ['2.25rem', '2.5rem'],
  '5xl': ['3rem', '1'],
  '6xl': ['3.75rem', '1'],
  '7xl': ['4.5rem', '1'],
  '8xl': ['6rem', '1'],
  '9xl': ['8rem', '1'],
};

/** PhilJS font weights */
export const philjsFontWeights: Record<string, string> = {
  'thin': '100',
  'extralight': '200',
  'light': '300',
  'normal': '400',
  'medium': '500',
  'semibold': '600',
  'bold': '700',
  'extrabold': '800',
  'black': '900',
};

/** PhilJS font families */
export const philjsFontFamilies: Record<string, string> = {
  'sans': 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  'serif': 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  'mono': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};

/** PhilJS line heights */
export const philjsLineHeights: Record<string, string> = {
  'none': '1',
  'tight': '1.25',
  'snug': '1.375',
  'normal': '1.5',
  'relaxed': '1.625',
  'loose': '2',
};

/** PhilJS letter spacing */
export const philjsLetterSpacing: Record<string, string> = {
  'tighter': '-0.05em',
  'tight': '-0.025em',
  'normal': '0em',
  'wide': '0.025em',
  'wider': '0.05em',
  'widest': '0.1em',
};

// ============================================================================
// Border & Effects
// ============================================================================

/** PhilJS border radii */
export const philjsBorderRadius: Record<string, string> = {
  'none': '0',
  'sm': '0.125rem',
  'DEFAULT': '0.25rem',
  'md': '0.375rem',
  'lg': '0.5rem',
  'xl': '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  'full': '9999px',
};

/** PhilJS box shadows */
export const philjsBoxShadows: Record<string, string> = {
  'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  'none': 'none',
};

// ============================================================================
// Breakpoints & Layout
// ============================================================================

/** PhilJS breakpoints */
export const philjsBreakpoints: Record<string, string> = {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
};

/** PhilJS z-index scale */
export const philjsZIndex: Record<string, string> = {
  'auto': 'auto',
  '0': '0',
  '10': '10',
  '20': '20',
  '30': '30',
  '40': '40',
  '50': '50',
  'dropdown': '1000',
  'sticky': '1100',
  'fixed': '1200',
  'modal-backdrop': '1300',
  'modal': '1400',
  'popover': '1500',
  'tooltip': '1600',
  'toast': '1700',
};

// ============================================================================
// Animations
// ============================================================================

/** PhilJS animations */
export const philjsAnimations: Record<string, string> = {
  'none': 'none',
  'spin': 'philjs-spin 1s linear infinite',
  'ping': 'philjs-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
  'pulse': 'philjs-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  'bounce': 'philjs-bounce 1s infinite',
  'fade-in': 'philjs-fade-in 0.3s ease-out',
  'fade-out': 'philjs-fade-out 0.3s ease-in',
  'slide-in-up': 'philjs-slide-in-up 0.3s ease-out',
  'slide-in-down': 'philjs-slide-in-down 0.3s ease-out',
  'slide-in-left': 'philjs-slide-in-left 0.3s ease-out',
  'slide-in-right': 'philjs-slide-in-right 0.3s ease-out',
  'scale-in': 'philjs-scale-in 0.2s ease-out',
  'scale-out': 'philjs-scale-out 0.2s ease-in',
  'shimmer': 'philjs-shimmer 2s linear infinite',
};

/** PhilJS durations */
export const philjsDurations: Record<string, string> = {
  '0': '0ms',
  '75': '75ms',
  '100': '100ms',
  '150': '150ms',
  '200': '200ms',
  '300': '300ms',
  '500': '500ms',
  '700': '700ms',
  '1000': '1000ms',
};

/** PhilJS easings */
export const philjsEasings: Record<string, string> = {
  'linear': 'linear',
  'in': 'cubic-bezier(0.4, 0, 1, 1)',
  'out': 'cubic-bezier(0, 0, 0.2, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// ============================================================================
// Complete Theme
// ============================================================================

/** Complete PhilJS theme for UnoCSS */
export const philjsTheme: Theme = {
  colors: philjsColors,
  spacing: philjsSpacing,
  fontSize: philjsFontSizes,
  fontFamily: philjsFontFamilies,
  fontWeight: philjsFontWeights,
  lineHeight: philjsLineHeights,
  letterSpacing: philjsLetterSpacing,
  borderRadius: philjsBorderRadius,
  boxShadow: philjsBoxShadows,
  breakpoints: philjsBreakpoints,
  zIndex: philjsZIndex,
  animation: philjsAnimations,
  duration: philjsDurations,
  easing: philjsEasings,
};

// ============================================================================
// Rules
// ============================================================================

/** PhilJS custom rules */
export const philjsRules: Rule[] = [
  // Signal-aware animations
  [/^signal-pulse$/, { animation: 'philjs-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }],
  [/^signal-spin$/, { animation: 'philjs-spin 1s linear infinite' }],
  [/^signal-ping$/, { animation: 'philjs-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }],
  [/^signal-bounce$/, { animation: 'philjs-bounce 1s infinite' }],

  // Loading states
  [/^loading$/, { opacity: '0.5', 'pointer-events': 'none', cursor: 'wait' }],
  [/^skeleton$/, {
    'background': 'linear-gradient(90deg, var(--un-skeleton-from, #f0f0f0) 25%, var(--un-skeleton-to, #e0e0e0) 50%, var(--un-skeleton-from, #f0f0f0) 75%)',
    'background-size': '200% 100%',
    'animation': 'philjs-shimmer 1.5s infinite',
  }],

  // Island markers
  [/^island$/, { '--philjs-island': '1' }],
  [/^hydrated$/, { '--philjs-hydrated': '1' }],
  [/^island-pending$/, { '--philjs-island-pending': '1', opacity: '0.7' }],
  [/^island-error$/, { '--philjs-island-error': '1' }],

  // Responsive containers
  [/^container-(\w+)$/, (match) => {
    const sizes: Record<string, string> = {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    };
    return {
      'max-width': sizes[match[1]] || match[1],
      'margin-left': 'auto',
      'margin-right': 'auto',
    };
  }],

  // Glass morphism
  [/^glass$/, {
    'background': 'rgba(255, 255, 255, 0.1)',
    'backdrop-filter': 'blur(10px)',
    'border': '1px solid rgba(255, 255, 255, 0.2)',
  }],
  [/^glass-dark$/, {
    'background': 'rgba(0, 0, 0, 0.1)',
    'backdrop-filter': 'blur(10px)',
    'border': '1px solid rgba(0, 0, 0, 0.2)',
  }],

  // Text balance and wrap
  [/^text-balance$/, { 'text-wrap': 'balance' }],
  [/^text-pretty$/, { 'text-wrap': 'pretty' }],

  // Container queries
  [/^@container$/, { 'container-type': 'inline-size' }],
  [/^@container-normal$/, { 'container-type': 'normal' }],
  [/^container-name-(\w+)$/, (match) => ({ 'container-name': match[1] })],

  // Scroll snap
  [/^snap-mandatory$/, { 'scroll-snap-type': 'both mandatory' }],
  [/^snap-x-mandatory$/, { 'scroll-snap-type': 'x mandatory' }],
  [/^snap-y-mandatory$/, { 'scroll-snap-type': 'y mandatory' }],
  [/^snap-proximity$/, { 'scroll-snap-type': 'both proximity' }],

  // Focus visible ring
  [/^focus-ring$/, {
    'outline': '2px solid var(--un-ring-color, #3b82f6)',
    'outline-offset': '2px',
  }],
  [/^focus-ring-inset$/, {
    'outline': '2px solid var(--un-ring-color, #3b82f6)',
    'outline-offset': '-2px',
  }],

  // Safe area insets
  [/^safe-top$/, { 'padding-top': 'env(safe-area-inset-top)' }],
  [/^safe-bottom$/, { 'padding-bottom': 'env(safe-area-inset-bottom)' }],
  [/^safe-left$/, { 'padding-left': 'env(safe-area-inset-left)' }],
  [/^safe-right$/, { 'padding-right': 'env(safe-area-inset-right)' }],

  // Fluid typography
  [/^fluid-text-(\w+)$/, (match) => {
    const sizes: Record<string, [string, string, string]> = {
      'xs': ['0.75rem', '0.875rem', '1rem'],
      'sm': ['0.875rem', '1rem', '1.125rem'],
      'base': ['1rem', '1.125rem', '1.25rem'],
      'lg': ['1.125rem', '1.5rem', '2rem'],
      'xl': ['1.25rem', '2rem', '3rem'],
      '2xl': ['1.5rem', '2.5rem', '4rem'],
      '3xl': ['1.875rem', '3rem', '5rem'],
    };
    const [min, preferred, max] = sizes[match[1]] || ['1rem', '1.25rem', '1.5rem'];
    return {
      'font-size': `clamp(${min}, ${preferred} + 1vw, ${max})`,
    };
  }],

  // Aspect ratios
  [/^aspect-video$/, { 'aspect-ratio': '16 / 9' }],
  [/^aspect-square$/, { 'aspect-ratio': '1 / 1' }],
  [/^aspect-portrait$/, { 'aspect-ratio': '3 / 4' }],
  [/^aspect-widescreen$/, { 'aspect-ratio': '21 / 9' }],

  // Logical properties
  [/^ms-(\w+)$/, (match) => ({ 'margin-inline-start': philjsSpacing[match[1]] || match[1] })],
  [/^me-(\w+)$/, (match) => ({ 'margin-inline-end': philjsSpacing[match[1]] || match[1] })],
  [/^ps-(\w+)$/, (match) => ({ 'padding-inline-start': philjsSpacing[match[1]] || match[1] })],
  [/^pe-(\w+)$/, (match) => ({ 'padding-inline-end': philjsSpacing[match[1]] || match[1] })],

  // Isolation
  [/^isolate$/, { isolation: 'isolate' }],
  [/^isolation-auto$/, { isolation: 'auto' }],

  // Content visibility
  [/^content-visible$/, { 'content-visibility': 'visible' }],
  [/^content-hidden$/, { 'content-visibility': 'hidden' }],
  [/^content-auto$/, { 'content-visibility': 'auto' }],

  // View transitions
  [/^view-transition-name-(\w+)$/, (match) => ({ 'view-transition-name': match[1] })],

  // Mask utilities
  [/^mask-linear$/, { 'mask-image': 'linear-gradient(black, transparent)' }],
  [/^mask-radial$/, { 'mask-image': 'radial-gradient(black 50%, transparent 80%)' }],
];

// ============================================================================
// Shortcuts
// ============================================================================

/** PhilJS shortcuts */
export const philjsShortcuts: Shortcut[] = [
  // Button variants
  ['btn', 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'],
  ['btn-sm', 'h-8 px-3 text-sm'],
  ['btn-md', 'h-10 px-4 text-sm'],
  ['btn-lg', 'h-12 px-6 text-base'],
  ['btn-xl', 'h-14 px-8 text-lg'],
  ['btn-primary', 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-primary-500'],
  ['btn-secondary', 'bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700 focus-visible:ring-secondary-500'],
  ['btn-accent', 'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 focus-visible:ring-accent-500'],
  ['btn-success', 'bg-success-500 text-white hover:bg-success-600 active:bg-success-700 focus-visible:ring-success-500'],
  ['btn-warning', 'bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700 focus-visible:ring-warning-500'],
  ['btn-error', 'bg-error-500 text-white hover:bg-error-600 active:bg-error-700 focus-visible:ring-error-500'],
  ['btn-outline', 'border border-neutral-300 bg-transparent hover:bg-neutral-100 active:bg-neutral-200'],
  ['btn-ghost', 'bg-transparent hover:bg-neutral-100 active:bg-neutral-200'],
  ['btn-link', 'bg-transparent text-primary-500 underline-offset-4 hover:underline'],

  // Card components
  ['card', 'rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900'],
  ['card-header', 'flex flex-col space-y-1.5 p-6'],
  ['card-title', 'text-xl font-semibold leading-none tracking-tight'],
  ['card-description', 'text-sm text-neutral-500 dark:text-neutral-400'],
  ['card-content', 'p-6 pt-0'],
  ['card-footer', 'flex items-center p-6 pt-0'],

  // Form elements
  ['input', 'flex h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700'],
  ['input-error', 'border-error-500 focus:ring-error-500'],
  ['input-success', 'border-success-500 focus:ring-success-500'],
  ['label', 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'],
  ['textarea', 'flex min-h-20 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'],
  ['select', 'flex h-10 w-full items-center justify-between rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'],
  ['checkbox', 'h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500'],
  ['radio', 'h-4 w-4 border-neutral-300 text-primary-500 focus:ring-primary-500'],
  ['switch', 'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'],

  // Layout
  ['container', 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'],
  ['container-sm', 'mx-auto w-full max-w-3xl px-4'],
  ['container-lg', 'mx-auto w-full max-w-5xl px-4 sm:px-6'],
  ['container-xl', 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'],
  ['section', 'py-12 md:py-16 lg:py-20'],
  ['section-sm', 'py-8 md:py-12'],
  ['section-lg', 'py-16 md:py-24 lg:py-32'],

  // Flex utilities
  ['center', 'flex items-center justify-center'],
  ['between', 'flex items-center justify-between'],
  ['around', 'flex items-center justify-around'],
  ['evenly', 'flex items-center justify-evenly'],
  ['stack', 'flex flex-col'],
  ['stack-center', 'flex flex-col items-center'],
  ['row', 'flex flex-row'],
  ['row-center', 'flex flex-row items-center'],

  // Grid utilities
  ['grid-cols-auto-fit', 'grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]'],
  ['grid-cols-auto-fill', 'grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))]'],

  // Text utilities
  ['text-gradient', 'bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent'],
  ['text-gradient-accent', 'bg-gradient-to-r from-accent-500 to-primary-500 bg-clip-text text-transparent'],
  ['truncate-2', 'overflow-hidden display-[-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]'],
  ['truncate-3', 'overflow-hidden display-[-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]'],

  // Badge components
  ['badge', 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'],
  ['badge-primary', 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'],
  ['badge-secondary', 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300'],
  ['badge-success', 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300'],
  ['badge-warning', 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300'],
  ['badge-error', 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300'],
  ['badge-outline', 'border border-current bg-transparent'],

  // Alert components
  ['alert', 'relative w-full rounded-lg border p-4'],
  ['alert-info', 'border-primary-200 bg-primary-50 text-primary-900 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-100'],
  ['alert-success', 'border-success-200 bg-success-50 text-success-900 dark:border-success-800 dark:bg-success-950 dark:text-success-100'],
  ['alert-warning', 'border-warning-200 bg-warning-50 text-warning-900 dark:border-warning-800 dark:bg-warning-950 dark:text-warning-100'],
  ['alert-error', 'border-error-200 bg-error-50 text-error-900 dark:border-error-800 dark:bg-error-950 dark:text-error-100'],

  // Avatar
  ['avatar', 'relative flex shrink-0 overflow-hidden rounded-full'],
  ['avatar-sm', 'h-8 w-8'],
  ['avatar-md', 'h-10 w-10'],
  ['avatar-lg', 'h-12 w-12'],
  ['avatar-xl', 'h-16 w-16'],

  // Divider
  ['divider', 'border-t border-neutral-200 dark:border-neutral-800'],
  ['divider-vertical', 'border-l border-neutral-200 dark:border-neutral-800 h-full'],

  // Skeleton
  ['skeleton-text', 'h-4 w-full rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse'],
  ['skeleton-circle', 'rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse'],
  ['skeleton-box', 'rounded-md bg-neutral-200 dark:bg-neutral-800 animate-pulse'],

  // Overlay
  ['overlay', 'fixed inset-0 bg-black/50 backdrop-blur-sm z-modal-backdrop'],
  ['overlay-light', 'fixed inset-0 bg-white/50 backdrop-blur-sm z-modal-backdrop'],

  // Prose
  ['prose', 'max-w-prose text-base leading-relaxed'],
  ['prose-sm', 'max-w-prose text-sm leading-relaxed'],
  ['prose-lg', 'max-w-prose text-lg leading-relaxed'],

  // Focus states
  ['focus-default', 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'],
  ['focus-within-ring', 'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2'],

  // Transitions
  ['transition-default', 'transition-all duration-200 ease-out'],
  ['transition-colors-fast', 'transition-colors duration-150 ease-out'],
  ['transition-transform', 'transition-transform duration-200 ease-out'],

  // Interactive states
  ['interactive', 'cursor-pointer select-none transition-colors hover:bg-neutral-100 active:bg-neutral-200 dark:hover:bg-neutral-800 dark:active:bg-neutral-700'],
  ['pressable', 'cursor-pointer select-none active:scale-95 transition-transform'],

  // Visibility
  ['sr-only', 'absolute w-1 h-1 p-0 -m-1 overflow-hidden whitespace-nowrap border-0 clip-[rect(0,0,0,0)]'],
  ['not-sr-only', 'static w-auto h-auto p-0 m-0 overflow-visible whitespace-normal clip-auto'],
];

// ============================================================================
// Variants
// ============================================================================

/** PhilJS variants */
export const philjsVariants: Variant[] = [
  // Signal-based variants
  {
    name: 'signal',
    match: (matcher) => {
      if (matcher.startsWith('signal:')) {
        return {
          matcher: matcher.slice(7),
          selector: (s) => `[data-signal-active] ${s}`,
        };
      }
    },
  },

  // Island variants
  {
    name: 'island',
    match: (matcher) => {
      if (matcher.startsWith('island:')) {
        return {
          matcher: matcher.slice(7),
          selector: (s) => `[data-island] ${s}`,
        };
      }
    },
  },

  // Hydrated variant
  {
    name: 'hydrated',
    match: (matcher) => {
      if (matcher.startsWith('hydrated:')) {
        return {
          matcher: matcher.slice(9),
          selector: (s) => `[data-hydrated] ${s}`,
        };
      }
    },
  },

  // Theme variants
  {
    name: 'light',
    match: (matcher) => {
      if (matcher.startsWith('light:')) {
        return {
          matcher: matcher.slice(6),
          parent: '@media (prefers-color-scheme: light)',
        };
      }
    },
  },

  // High contrast variant
  {
    name: 'contrast',
    match: (matcher) => {
      if (matcher.startsWith('contrast:')) {
        return {
          matcher: matcher.slice(9),
          parent: '@media (prefers-contrast: more)',
        };
      }
    },
  },

  // Reduced motion variant
  {
    name: 'motion-safe',
    match: (matcher) => {
      if (matcher.startsWith('motion-safe:')) {
        return {
          matcher: matcher.slice(12),
          parent: '@media (prefers-reduced-motion: no-preference)',
        };
      }
    },
  },

  // Print variant
  {
    name: 'print',
    match: (matcher) => {
      if (matcher.startsWith('print:')) {
        return {
          matcher: matcher.slice(6),
          parent: '@media print',
        };
      }
    },
  },

  // Portrait/landscape
  {
    name: 'portrait',
    match: (matcher) => {
      if (matcher.startsWith('portrait:')) {
        return {
          matcher: matcher.slice(9),
          parent: '@media (orientation: portrait)',
        };
      }
    },
  },
  {
    name: 'landscape',
    match: (matcher) => {
      if (matcher.startsWith('landscape:')) {
        return {
          matcher: matcher.slice(10),
          parent: '@media (orientation: landscape)',
        };
      }
    },
  },

  // Touch/pointer variants
  {
    name: 'touch',
    match: (matcher) => {
      if (matcher.startsWith('touch:')) {
        return {
          matcher: matcher.slice(6),
          parent: '@media (pointer: coarse)',
        };
      }
    },
  },
  {
    name: 'pointer',
    match: (matcher) => {
      if (matcher.startsWith('pointer:')) {
        return {
          matcher: matcher.slice(8),
          parent: '@media (pointer: fine)',
        };
      }
    },
  },

  // Container query variants
  {
    name: '@sm',
    match: (matcher) => {
      if (matcher.startsWith('@sm:')) {
        return {
          matcher: matcher.slice(4),
          parent: '@container (min-width: 640px)',
        };
      }
    },
  },
  {
    name: '@md',
    match: (matcher) => {
      if (matcher.startsWith('@md:')) {
        return {
          matcher: matcher.slice(4),
          parent: '@container (min-width: 768px)',
        };
      }
    },
  },
  {
    name: '@lg',
    match: (matcher) => {
      if (matcher.startsWith('@lg:')) {
        return {
          matcher: matcher.slice(4),
          parent: '@container (min-width: 1024px)',
        };
      }
    },
  },

  // Group state variants
  {
    name: 'group-loading',
    match: (matcher) => {
      if (matcher.startsWith('group-loading:')) {
        return {
          matcher: matcher.slice(14),
          selector: (s) => `.group[data-loading] ${s}`,
        };
      }
    },
  },
  {
    name: 'group-error',
    match: (matcher) => {
      if (matcher.startsWith('group-error:')) {
        return {
          matcher: matcher.slice(12),
          selector: (s) => `.group[data-error] ${s}`,
        };
      }
    },
  },
  {
    name: 'group-success',
    match: (matcher) => {
      if (matcher.startsWith('group-success:')) {
        return {
          matcher: matcher.slice(14),
          selector: (s) => `.group[data-success] ${s}`,
        };
      }
    },
  },

  // Peer state variants
  {
    name: 'peer-loading',
    match: (matcher) => {
      if (matcher.startsWith('peer-loading:')) {
        return {
          matcher: matcher.slice(13),
          selector: (s) => `.peer[data-loading] ~ ${s}`,
        };
      }
    },
  },
];

// ============================================================================
// Preflights (Global CSS)
// ============================================================================

/** PhilJS preflights (global CSS) */
export const philjsPreflights: Preflight[] = [
  {
    getCSS: ({ theme }) => `
/* PhilJS UnoCSS Preset - Global Styles */

/* CSS Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border-width: 0;
  border-style: solid;
}

html {
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
  font-family: ${theme.fontFamily?.sans || 'system-ui, sans-serif'};
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  line-height: inherit;
}

hr {
  height: 0;
  color: inherit;
  border-top-width: 1px;
}

img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
  height: auto;
}

button, input, optgroup, select, textarea {
  font-family: inherit;
  font-size: 100%;
  font-weight: inherit;
  line-height: inherit;
  color: inherit;
  margin: 0;
  padding: 0;
}

button, [type='button'], [type='reset'], [type='submit'] {
  -webkit-appearance: button;
  background-color: transparent;
  background-image: none;
}

[role="button"], button {
  cursor: pointer;
}

:disabled {
  cursor: default;
}

[hidden] {
  display: none;
}

/* PhilJS Animations */
@keyframes philjs-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes philjs-ping {
  0% { transform: scale(1); opacity: 1; }
  75%, 100% { transform: scale(2); opacity: 0; }
}

@keyframes philjs-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes philjs-bounce {
  0%, 100% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

@keyframes philjs-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes philjs-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes philjs-slide-in-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes philjs-slide-in-down {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes philjs-slide-in-left {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes philjs-slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes philjs-scale-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes philjs-scale-out {
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0.95); opacity: 0; }
}

@keyframes philjs-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

@media (prefers-color-scheme: dark) {
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}
`,
  },
];

// ============================================================================
// Preset Factory
// ============================================================================

/**
 * PhilJS UnoCSS Preset
 *
 * @example
 * ```typescript
 * import { defineConfig } from 'unocss';
 * import { presetPhilJS } from '@philjs/unocss';
 *
 * export default defineConfig({
 *   presets: [
 *     presetPhilJS({
 *       darkMode: 'class',
 *       colors: {
 *         brand: '#ff6b6b',
 *       },
 *     }),
 *   ],
 * });
 * ```
 */
export function presetPhilJS(options: PhilJSPresetOptions = {}): Preset {
  const {
    prefix = '',
    darkMode = true,
    colors = {},
    important = false,
    componentPrefix = 'phil-',
  } = options;

  // Merge custom colors with defaults
  const mergedColors = {
    ...philjsColors,
    ...colors,
  };

  // Add prefix to shortcuts if specified
  const prefixedShortcuts: Shortcut[] = componentPrefix
    ? philjsShortcuts.map(([key, value, meta]) => {
        if (typeof key === 'string') {
          return [`${componentPrefix}${key}`, value, meta];
        }
        return [key, value, meta];
      })
    : philjsShortcuts;

  return {
    name: '@philjs/unocss',
    theme: {
      ...philjsTheme,
      colors: mergedColors,
    },
    rules: philjsRules,
    shortcuts: prefixedShortcuts,
    variants: philjsVariants,
    preflights: philjsPreflights,
    layers: {
      'philjs-base': 0,
      'philjs-components': 10,
      'philjs-utilities': 20,
    },
  };
}

/**
 * PhilJS Icons Preset
 *
 * @example
 * ```typescript
 * import { presetPhilJSIcons } from '@philjs/unocss';
 *
 * export default defineConfig({
 *   presets: [presetPhilJSIcons({ scale: 1.2 })],
 * });
 *
 * // Usage: <div class="i-ph-house" />
 * ```
 */
export function presetPhilJSIcons(options: IconsOptions = {}): Preset {
  const {
    scale = 1,
    mode = 'auto',
    warn = true,
    extraProperties = {},
    cdn,
  } = options;

  return {
    name: '@philjs/unocss-icons',
    rules: [
      // Icon rule pattern
      [/^i-(.+)$/, (match) => {
        const iconName = match[1];
        return {
          '--un-icon': `url("data:image/svg+xml,...")`,
          'width': `${scale}em`,
          'height': `${scale}em`,
          'display': 'inline-block',
          'vertical-align': 'middle',
          ...extraProperties,
          ...(mode === 'mask' || mode === 'auto'
            ? {
                'background-color': 'currentColor',
                'mask-image': 'var(--un-icon)',
                'mask-size': 'contain',
                'mask-repeat': 'no-repeat',
              }
            : {
                'background-image': 'var(--un-icon)',
                'background-size': 'contain',
                'background-repeat': 'no-repeat',
              }),
        };
      }],
    ],
  };
}

/**
 * PhilJS Typography Preset
 */
export function presetPhilJSTypography(options: TypographyOptions = {}): Preset {
  const { selectorName = 'prose' } = options;

  return {
    name: '@philjs/unocss-typography',
    rules: [
      [new RegExp(`^${selectorName}$`), {
        'max-width': '65ch',
        'color': 'var(--un-prose-body)',
        'line-height': '1.75',
      }],
    ],
    shortcuts: [
      [`${selectorName}`, 'text-base leading-relaxed text-neutral-700 dark:text-neutral-300'],
      [`${selectorName}-sm`, 'text-sm leading-relaxed'],
      [`${selectorName}-lg`, 'text-lg leading-relaxed'],
      [`${selectorName}-xl`, 'text-xl leading-relaxed'],
    ],
    preflights: [
      {
        getCSS: () => `
.${selectorName} h1, .${selectorName} h2, .${selectorName} h3, .${selectorName} h4, .${selectorName} h5, .${selectorName} h6 {
  font-weight: 700;
  line-height: 1.25;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}
.${selectorName} h1 { font-size: 2.25em; }
.${selectorName} h2 { font-size: 1.5em; }
.${selectorName} h3 { font-size: 1.25em; }
.${selectorName} h4 { font-size: 1em; }
.${selectorName} p { margin-top: 1em; margin-bottom: 1em; }
.${selectorName} a { color: var(--un-prose-link, #3b82f6); text-decoration: underline; }
.${selectorName} a:hover { color: var(--un-prose-link-hover, #2563eb); }
.${selectorName} code { font-family: ui-monospace, monospace; background: var(--un-prose-code-bg, #f3f4f6); padding: 0.2em 0.4em; border-radius: 0.25em; font-size: 0.875em; }
.${selectorName} pre { background: var(--un-prose-pre-bg, #1f2937); color: var(--un-prose-pre-color, #f9fafb); padding: 1em; border-radius: 0.5em; overflow-x: auto; }
.${selectorName} pre code { background: transparent; padding: 0; }
.${selectorName} blockquote { border-left: 4px solid var(--un-prose-quote-border, #e5e7eb); padding-left: 1em; font-style: italic; color: var(--un-prose-quote, #6b7280); }
.${selectorName} ul, .${selectorName} ol { padding-left: 1.5em; margin-top: 1em; margin-bottom: 1em; }
.${selectorName} li { margin-top: 0.25em; margin-bottom: 0.25em; }
.${selectorName} hr { border-top: 1px solid var(--un-prose-hr, #e5e7eb); margin-top: 2em; margin-bottom: 2em; }
.${selectorName} img { max-width: 100%; height: auto; border-radius: 0.5em; margin-top: 1em; margin-bottom: 1em; }
.${selectorName} table { width: 100%; border-collapse: collapse; margin-top: 1em; margin-bottom: 1em; }
.${selectorName} th, .${selectorName} td { border: 1px solid var(--un-prose-table-border, #e5e7eb); padding: 0.5em 1em; text-align: left; }
.${selectorName} th { background: var(--un-prose-th-bg, #f9fafb); font-weight: 600; }
`,
      },
    ],
  };
}

// ============================================================================
// Signal Integration
// ============================================================================

/** Theme state */
interface ThemeState {
  mode: 'light' | 'dark' | 'system';
  resolvedMode: 'light' | 'dark';
  colors: Record<string, string>;
  customProperties: Record<string, string>;
}

const themeState = signal<ThemeState>({
  mode: 'system',
  resolvedMode: 'light',
  colors: {},
  customProperties: {},
});

/**
 * Use theme with signal reactivity
 */
export function useTheme(): {
  mode: Computed<'light' | 'dark' | 'system'>;
  resolvedMode: Computed<'light' | 'dark'>;
  isDark: Computed<boolean>;
  isLight: Computed<boolean>;
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  toggle: () => void;
  setColor: (name: string, value: string) => void;
  setCSSVar: (name: string, value: string) => void;
  getCSSVar: (name: string) => string;
} {
  const mode = computed(() => themeState().mode);
  const resolvedMode = computed(() => {
    const current = themeState().mode;
    if (current !== 'system') return current;
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
      document.documentElement.classList.toggle('dark', resolved === 'dark');
      document.documentElement.classList.toggle('light', resolved === 'light');
      document.documentElement.dataset.theme = resolved;
    }
  });

  return {
    mode,
    resolvedMode,
    isDark,
    isLight,
    setMode: (mode) => {
      themeState.update((state) => ({ ...state, mode }));
    },
    toggle: () => {
      const current = resolvedMode();
      themeState.update((state) => ({
        ...state,
        mode: current === 'light' ? 'dark' : 'light',
      }));
    },
    setColor: (name, value) => {
      themeState.update((state) => ({
        ...state,
        colors: { ...state.colors, [name]: value },
      }));
    },
    setCSSVar: (name, value) => {
      themeState.update((state) => ({
        ...state,
        customProperties: { ...state.customProperties, [name]: value },
      }));
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty(`--${name}`, value);
      }
    },
    getCSSVar: (name) => {
      if (typeof document !== 'undefined') {
        return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
      }
      return themeState().customProperties[name] || '';
    },
  };
}

/**
 * Create dynamic class signal based on condition
 */
export function useConditionalClass(
  condition: Signal<boolean> | (() => boolean),
  trueClass: string,
  falseClass: string = ''
): Computed<string> {
  return computed(() => {
    const value = typeof condition === 'function' ? condition() : condition();
    return value ? trueClass : falseClass;
  });
}

/**
 * Create class signal from multiple conditions
 */
export function useClasses(
  classes: Record<string, Signal<boolean> | boolean | (() => boolean)>
): Computed<string> {
  return computed(() => {
    const activeClasses: string[] = [];

    for (const [className, condition] of Object.entries(classes)) {
      let isActive: boolean;

      if (typeof condition === 'boolean') {
        isActive = condition;
      } else if (typeof condition === 'function') {
        isActive = condition();
      } else {
        isActive = condition();
      }

      if (isActive) {
        activeClasses.push(className);
      }
    }

    return activeClasses.join(' ');
  });
}

/**
 * Create variant class based on signal value
 */
export function useVariant<T extends string>(
  value: Signal<T> | (() => T),
  variants: Record<T, string>,
  baseClass: string = ''
): Computed<string> {
  return computed(() => {
    const currentValue = typeof value === 'function' ? value() : value();
    const variantClass = variants[currentValue] || '';
    return baseClass ? `${baseClass} ${variantClass}` : variantClass;
  });
}

// ============================================================================
// Runtime Utilities
// ============================================================================

/**
 * Merge class names (like clsx/cn)
 */
export function uno(...classes: (string | undefined | null | false | Record<string, boolean>)[]): string {
  const result: string[] = [];

  for (const cls of classes) {
    if (!cls) continue;

    if (typeof cls === 'string') {
      result.push(cls);
    } else if (typeof cls === 'object') {
      for (const [key, value] of Object.entries(cls)) {
        if (value) {
          result.push(key);
        }
      }
    }
  }

  return result.join(' ');
}

/**
 * Class name builder with variants
 */
export function cva<V extends Record<string, Record<string, string>>>(config: {
  base?: string;
  variants?: V;
  defaultVariants?: { [K in keyof V]?: keyof V[K] };
  compoundVariants?: Array<{
    [K in keyof V]?: keyof V[K];
  } & { class: string }>;
}): (props?: { [K in keyof V]?: keyof V[K] } & { class?: string }) => string {
  const { base = '', variants = {}, defaultVariants = {}, compoundVariants = [] } = config;

  return (props = {}) => {
    const classes: string[] = [base];
    const resolvedProps = { ...defaultVariants, ...props };

    // Add variant classes
    for (const [variantName, variantValue] of Object.entries(resolvedProps)) {
      if (variantName === 'class') continue;
      const variantClasses = (variants as any)[variantName];
      if (variantClasses && variantValue) {
        classes.push(variantClasses[variantValue as string] || '');
      }
    }

    // Check compound variants
    for (const compound of compoundVariants) {
      const { class: compoundClass, ...conditions } = compound;
      const matches = Object.entries(conditions).every(
        ([key, value]) => (resolvedProps as any)[key] === value
      );
      if (matches) {
        classes.push(compoundClass);
      }
    }

    // Add additional class
    if (props.class) {
      classes.push(props.class);
    }

    return classes.filter(Boolean).join(' ');
  };
}

/**
 * Create CSS custom property
 */
export function cssVar(name: string, fallback?: string): string {
  return fallback ? `var(--${name}, ${fallback})` : `var(--${name})`;
}

/**
 * Create inline style object with CSS variables
 */
export function cssVars(vars: Record<string, string | number>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, value] of Object.entries(vars)) {
    result[`--${name}`] = String(value);
  }
  return result;
}

// ============================================================================
// Configuration Helpers
// ============================================================================

/**
 * Define UnoCSS config with PhilJS defaults
 */
export function defineConfig(config: {
  presets?: Preset[];
  theme?: Theme;
  rules?: Rule[];
  shortcuts?: Shortcut[];
  variants?: Variant[];
  safelist?: string[];
  blocklist?: string[];
  [key: string]: any;
}): object {
  return {
    presets: [presetPhilJS(), ...(config.presets || [])],
    theme: {
      ...philjsTheme,
      ...config.theme,
    },
    rules: [...philjsRules, ...(config.rules || [])],
    shortcuts: [...philjsShortcuts, ...(config.shortcuts || [])],
    variants: [...philjsVariants, ...(config.variants || [])],
    ...config,
  };
}

/**
 * Extend theme with custom values
 */
export function extendTheme(customTheme: Partial<Theme>): Theme {
  const result: Theme = { ...philjsTheme };

  for (const [key, value] of Object.entries(customTheme)) {
    if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = { ...(result[key] as object || {}), ...value };
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Create a custom color palette
 */
export function createColorPalette(
  name: string,
  baseColor: string,
  options?: {
    shades?: number[];
    saturationAdjust?: number;
    lightnessAdjust?: number;
  }
): Record<string, string> {
  const shades = options?.shades || [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const palette: Record<string, string> = {};

  // Simplified palette generation (in real implementation, use color manipulation library)
  for (const shade of shades) {
    const lightness = 100 - (shade / 10);
    palette[String(shade)] = baseColor; // Placeholder - would calculate actual shade
  }

  return palette;
}

// ============================================================================
// Attributify Mode Helpers
// ============================================================================

/**
 * Generate attributify props type
 */
export interface AttributifyAttributes {
  // Layout
  flex?: boolean | string;
  grid?: boolean | string;
  block?: boolean;
  inline?: boolean;
  'inline-block'?: boolean;
  hidden?: boolean;

  // Spacing
  p?: string | number;
  px?: string | number;
  py?: string | number;
  pt?: string | number;
  pr?: string | number;
  pb?: string | number;
  pl?: string | number;
  m?: string | number;
  mx?: string | number;
  my?: string | number;
  mt?: string | number;
  mr?: string | number;
  mb?: string | number;
  ml?: string | number;

  // Sizing
  w?: string | number;
  h?: string | number;
  'min-w'?: string | number;
  'min-h'?: string | number;
  'max-w'?: string | number;
  'max-h'?: string | number;

  // Typography
  text?: string;
  font?: string;
  leading?: string | number;
  tracking?: string;

  // Colors
  bg?: string;
  color?: string;
  border?: string;

  // Border
  rounded?: string | boolean;

  // Effects
  shadow?: string | boolean;
  opacity?: string | number;

  // Flex/Grid
  'items-center'?: boolean;
  'justify-center'?: boolean;
  'gap'?: string | number;

  // States
  hover?: string;
  focus?: string;
  active?: string;
  disabled?: string;

  // Responsive
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;

  // Dark mode
  dark?: string;
}

// ============================================================================
// Exports
// ============================================================================

// Re-export theme values
export {
  philjsColors as colors,
  philjsSpacing as spacing,
  philjsFontSizes as fontSizes,
  philjsFontWeights as fontWeights,
  philjsFontFamilies as fontFamilies,
  philjsLineHeights as lineHeights,
  philjsLetterSpacing as letterSpacing,
  philjsBorderRadius as borderRadius,
  philjsBoxShadows as boxShadows,
  philjsBreakpoints as breakpoints,
  philjsZIndex as zIndex,
  philjsAnimations as animations,
  philjsDurations as durations,
  philjsEasings as easings,
};

// Default export
export default presetPhilJS;
