/**
 * @philjs/theme - Chakra-style Theme System
 *
 * A comprehensive theming solution with CSS variable generation,
 * dark mode support, and semantic tokens.
 *
 * @example
 * ```tsx
 * import { createTheme, ThemeProvider, useTheme, useColorMode } from '@philjs/theme';
 *
 * const theme = createTheme({
 *   colors: {
 *     brand: {
 *       50: '#e6f6ff',
 *       500: '#0066cc',
 *       900: '#003366',
 *     },
 *   },
 * });
 *
 * function App() {
 *   return (
 *     <ThemeProvider theme={theme}>
 *       <MyApp />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 */

import { signal, computed, effect, memo, type Signal, type Computed } from '@philjs/core';

// ============ TYPE DEFINITIONS ============

export interface ColorScale {
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
}

export interface ThemeColors {
  // Base colors
  transparent: string;
  current: string;
  black: string;
  white: string;

  // Gray scales
  gray: ColorScale;
  slate: ColorScale;
  zinc: ColorScale;
  neutral: ColorScale;

  // Colors
  red: ColorScale;
  orange: ColorScale;
  amber: ColorScale;
  yellow: ColorScale;
  lime: ColorScale;
  green: ColorScale;
  emerald: ColorScale;
  teal: ColorScale;
  cyan: ColorScale;
  sky: ColorScale;
  blue: ColorScale;
  indigo: ColorScale;
  violet: ColorScale;
  purple: ColorScale;
  fuchsia: ColorScale;
  pink: ColorScale;
  rose: ColorScale;

  // Custom brand colors
  brand?: ColorScale;
  accent?: ColorScale;

  // Extensible
  [key: string]: string | ColorScale | undefined;
}

export interface ThemeTypography {
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  fontSizes: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
  };
  fontWeights: {
    hairline: number;
    thin: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
    black: number;
  };
  lineHeights: {
    none: number;
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
  letterSpacings: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
    widest: string;
  };
}

export interface ThemeSpacing {
  px: string;
  0: string;
  0.5: string;
  1: string;
  1.5: string;
  2: string;
  2.5: string;
  3: string;
  3.5: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  11: string;
  12: string;
  14: string;
  16: string;
  20: string;
  24: string;
  28: string;
  32: string;
  36: string;
  40: string;
  44: string;
  48: string;
  52: string;
  56: string;
  60: string;
  64: string;
  72: string;
  80: string;
  96: string;
  [key: string]: string;
}

export interface ThemeSizes extends ThemeSpacing {
  max: string;
  min: string;
  full: string;
  '3xs': string;
  '2xs': string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
  '7xl': string;
  '8xl': string;
}

export interface ThemeRadii {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

export interface ThemeShadows {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  outline: string;
}

export interface ThemeBreakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ThemeZIndices {
  hide: number;
  auto: string;
  base: number;
  docked: number;
  dropdown: number;
  sticky: number;
  banner: number;
  overlay: number;
  modal: number;
  popover: number;
  skipLink: number;
  toast: number;
  tooltip: number;
}

export interface ThemeTransitions {
  property: {
    common: string;
    colors: string;
    dimensions: string;
    position: string;
    background: string;
  };
  easing: {
    'ease-in': string;
    'ease-out': string;
    'ease-in-out': string;
  };
  duration: {
    'ultra-fast': string;
    faster: string;
    fast: string;
    normal: string;
    slow: string;
    slower: string;
    'ultra-slow': string;
  };
}

export interface SemanticTokens {
  colors: {
    'chakra-body-text': { _light: string; _dark: string };
    'chakra-body-bg': { _light: string; _dark: string };
    'chakra-border-color': { _light: string; _dark: string };
    'chakra-placeholder-color': { _light: string; _dark: string };
    [key: string]: { _light: string; _dark: string };
  };
}

export interface Theme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  sizes: ThemeSizes;
  radii: ThemeRadii;
  shadows: ThemeShadows;
  breakpoints: ThemeBreakpoints;
  zIndices: ThemeZIndices;
  transitions: ThemeTransitions;
  semanticTokens: SemanticTokens;
}

export type ColorMode = 'light' | 'dark' | 'system';
export type ResolvedColorMode = 'light' | 'dark';

export interface ThemeConfig {
  initialColorMode?: ColorMode;
  useSystemColorMode?: boolean;
  cssVarPrefix?: string;
}

// ============ DEFAULT THEME ============

const defaultColors: ThemeColors = {
  transparent: 'transparent',
  current: 'currentColor',
  black: '#000000',
  white: '#ffffff',

  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },

  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  zinc: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },

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

  red: {
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

  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407',
  },

  amber: {
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

  yellow: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    950: '#422006',
  },

  lime: {
    50: '#f7fee7',
    100: '#ecfccb',
    200: '#d9f99d',
    300: '#bef264',
    400: '#a3e635',
    500: '#84cc16',
    600: '#65a30d',
    700: '#4d7c0f',
    800: '#3f6212',
    900: '#365314',
    950: '#1a2e05',
  },

  green: {
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

  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },

  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e',
  },

  cyan: {
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

  sky: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },

  blue: {
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

  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },

  violet: {
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

  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  },

  fuchsia: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
    950: '#4a044e',
  },

  pink: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
    950: '#500724',
  },

  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
    950: '#4c0519',
  },
};

const defaultTypography: ThemeTypography = {
  fonts: {
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  fontWeights: {
    hairline: 100,
    thin: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

const defaultSpacing: ThemeSpacing = {
  px: '1px',
  0: '0',
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

const defaultSizes: ThemeSizes = {
  ...defaultSpacing,
  max: 'max-content',
  min: 'min-content',
  full: '100%',
  '3xs': '14rem',
  '2xs': '16rem',
  xs: '20rem',
  sm: '24rem',
  md: '28rem',
  lg: '32rem',
  xl: '36rem',
  '2xl': '42rem',
  '3xl': '48rem',
  '4xl': '56rem',
  '5xl': '64rem',
  '6xl': '72rem',
  '7xl': '80rem',
  '8xl': '90rem',
};

const defaultRadii: ThemeRadii = {
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

const defaultShadows: ThemeShadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  outline: '0 0 0 3px rgba(66, 153, 225, 0.6)',
};

const defaultBreakpoints: ThemeBreakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

const defaultZIndices: ThemeZIndices = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

const defaultTransitions: ThemeTransitions = {
  property: {
    common: 'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform',
    colors: 'background-color, border-color, color, fill, stroke',
    dimensions: 'width, height',
    position: 'left, right, top, bottom',
    background: 'background-color, background-image, background-position',
  },
  easing: {
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  duration: {
    'ultra-fast': '50ms',
    faster: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
    'ultra-slow': '500ms',
  },
};

const defaultSemanticTokens: SemanticTokens = {
  colors: {
    'chakra-body-text': { _light: 'gray.800', _dark: 'whiteAlpha.900' },
    'chakra-body-bg': { _light: 'white', _dark: 'gray.800' },
    'chakra-border-color': { _light: 'gray.200', _dark: 'whiteAlpha.300' },
    'chakra-placeholder-color': { _light: 'gray.500', _dark: 'whiteAlpha.400' },
  },
};

// ============ STATE ============

const themeSignal: Signal<Theme> = signal({
  colors: defaultColors,
  typography: defaultTypography,
  spacing: defaultSpacing,
  sizes: defaultSizes,
  radii: defaultRadii,
  shadows: defaultShadows,
  breakpoints: defaultBreakpoints,
  zIndices: defaultZIndices,
  transitions: defaultTransitions,
  semanticTokens: defaultSemanticTokens,
});

const colorModeSignal: Signal<ColorMode> = signal<ColorMode>('light');
const cssVarPrefixSignal: Signal<string> = signal('philjs');

// Resolved color mode (handles 'system')
const resolvedColorMode: Computed<ResolvedColorMode> = computed(() => {
  const mode = colorModeSignal();
  if (mode === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  return mode;
});

// ============ THEME CREATION ============

export interface CreateThemeOptions {
  colors?: Partial<ThemeColors>;
  typography?: Partial<ThemeTypography>;
  spacing?: Partial<ThemeSpacing>;
  sizes?: Partial<ThemeSizes>;
  radii?: Partial<ThemeRadii>;
  shadows?: Partial<ThemeShadows>;
  breakpoints?: Partial<ThemeBreakpoints>;
  zIndices?: Partial<ThemeZIndices>;
  transitions?: Partial<ThemeTransitions>;
  semanticTokens?: Partial<SemanticTokens>;
  config?: ThemeConfig;
}

export function createTheme(options: CreateThemeOptions = {}): Theme {
  const theme: Theme = {
    colors: { ...defaultColors, ...options.colors },
    typography: {
      ...defaultTypography,
      ...options.typography,
      fonts: { ...defaultTypography.fonts, ...options.typography?.fonts },
      fontSizes: { ...defaultTypography.fontSizes, ...options.typography?.fontSizes },
      fontWeights: { ...defaultTypography.fontWeights, ...options.typography?.fontWeights },
      lineHeights: { ...defaultTypography.lineHeights, ...options.typography?.lineHeights },
      letterSpacings: { ...defaultTypography.letterSpacings, ...options.typography?.letterSpacings },
    },
    spacing: { ...defaultSpacing, ...options.spacing },
    sizes: { ...defaultSizes, ...options.sizes },
    radii: { ...defaultRadii, ...options.radii },
    shadows: { ...defaultShadows, ...options.shadows },
    breakpoints: { ...defaultBreakpoints, ...options.breakpoints },
    zIndices: { ...defaultZIndices, ...options.zIndices },
    transitions: { ...defaultTransitions, ...options.transitions },
    semanticTokens: {
      colors: { ...defaultSemanticTokens.colors, ...options.semanticTokens?.colors },
    },
  };

  return theme;
}

export function extendTheme(options: CreateThemeOptions): Theme {
  const currentTheme = themeSignal();
  const newTheme = createTheme({
    colors: { ...currentTheme.colors, ...options.colors },
    typography: { ...currentTheme.typography, ...options.typography },
    spacing: { ...currentTheme.spacing, ...options.spacing },
    sizes: { ...currentTheme.sizes, ...options.sizes },
    radii: { ...currentTheme.radii, ...options.radii },
    shadows: { ...currentTheme.shadows, ...options.shadows },
    breakpoints: { ...currentTheme.breakpoints, ...options.breakpoints },
    zIndices: { ...currentTheme.zIndices, ...options.zIndices },
    transitions: { ...currentTheme.transitions, ...options.transitions },
    semanticTokens: { ...currentTheme.semanticTokens, ...options.semanticTokens },
  });
  themeSignal.set(newTheme);
  return newTheme;
}

// ============ HOOKS ============

export function useTheme(): Theme {
  return themeSignal();
}

export function useColorMode() {
  return {
    colorMode: colorModeSignal,
    resolvedColorMode,
    setColorMode: (mode: ColorMode) => colorModeSignal.set(mode),
    toggleColorMode: () => {
      const current = resolvedColorMode();
      colorModeSignal.set(current === 'light' ? 'dark' : 'light');
    },
  };
}

export function useColorModeValue<T>(lightValue: T, darkValue: T): Computed<T> {
  return computed(() => resolvedColorMode() === 'light' ? lightValue : darkValue);
}

export function useToken<T = string>(
  scale: keyof Theme,
  token: string,
  fallback?: T
): T | undefined {
  const theme = themeSignal();
  const scaleObj = theme[scale];

  if (typeof scaleObj === 'object' && scaleObj !== null) {
    const value = (scaleObj as Record<string, unknown>)[token];
    return (value as T) ?? fallback;
  }

  return fallback;
}

// ============ CSS VARIABLE GENERATION ============

function flattenColors(colors: ThemeColors, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === 'string') {
      result[prefix ? `${prefix}-${key}` : key] = value;
    } else if (typeof value === 'object' && value !== null) {
      for (const [shade, color] of Object.entries(value)) {
        result[`${prefix ? `${prefix}-` : ''}${key}-${shade}`] = color;
      }
    }
  }

  return result;
}

export function generateCssVariables(theme: Theme, prefix: string = 'philjs'): string {
  const lines: string[] = [':root {'];

  // Colors
  const flatColors = flattenColors(theme.colors);
  for (const [key, value] of Object.entries(flatColors)) {
    lines.push(`  --${prefix}-colors-${key}: ${value};`);
  }

  // Typography
  for (const [key, value] of Object.entries(theme.typography.fonts)) {
    lines.push(`  --${prefix}-fonts-${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(theme.typography.fontSizes)) {
    lines.push(`  --${prefix}-fontSizes-${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(theme.typography.fontWeights)) {
    lines.push(`  --${prefix}-fontWeights-${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(theme.typography.lineHeights)) {
    lines.push(`  --${prefix}-lineHeights-${key}: ${value};`);
  }

  // Spacing
  for (const [key, value] of Object.entries(theme.spacing)) {
    lines.push(`  --${prefix}-space-${key}: ${value};`);
  }

  // Radii
  for (const [key, value] of Object.entries(theme.radii)) {
    lines.push(`  --${prefix}-radii-${key}: ${value};`);
  }

  // Shadows
  for (const [key, value] of Object.entries(theme.shadows)) {
    lines.push(`  --${prefix}-shadows-${key}: ${value};`);
  }

  // Z-indices
  for (const [key, value] of Object.entries(theme.zIndices)) {
    lines.push(`  --${prefix}-zIndices-${key}: ${value};`);
  }

  lines.push('}');

  return lines.join('\n');
}

export function injectThemeStyles(theme: Theme, prefix: string = 'philjs'): void {
  if (typeof document === 'undefined') return;

  const styleId = `${prefix}-theme-variables`;
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = generateCssVariables(theme, prefix);
}

// ============ COMPONENTS ============

export interface ThemeProviderProps {
  theme?: Theme;
  colorMode?: ColorMode;
  cssVarPrefix?: string;
  children: unknown;
}

export function ThemeProvider(props: ThemeProviderProps): unknown {
  if (props.theme) {
    themeSignal.set(props.theme);
  }

  if (props.colorMode) {
    colorModeSignal.set(props.colorMode);
  }

  if (props.cssVarPrefix) {
    cssVarPrefixSignal.set(props.cssVarPrefix);
  }

  // Inject CSS variables
  effect(() => {
    const theme = themeSignal();
    const prefix = cssVarPrefixSignal();
    injectThemeStyles(theme, prefix);
  });

  // Handle system color mode changes
  effect(() => {
    if (typeof window === 'undefined') return;
    if (colorModeSignal() !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      // Force re-computation of resolvedColorMode
      colorModeSignal.set('system');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  });

  // Apply color mode class to document
  effect(() => {
    if (typeof document === 'undefined') return;
    const mode = resolvedColorMode();
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(mode);
    document.documentElement.setAttribute('data-theme', mode);
  });

  return props.children;
}

export function ColorModeScript(props: { initialColorMode?: ColorMode }): unknown {
  const script = `
    (function() {
      var mode = '${props.initialColorMode || 'light'}';
      if (mode === 'system') {
        mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.classList.add(mode);
      document.documentElement.setAttribute('data-theme', mode);
    })();
  `;

  return {
    type: 'script',
    props: {
      dangerouslySetInnerHTML: { __html: script },
    },
  };
}

// ============ EXPORTS ============

export {
  themeSignal as theme,
  colorModeSignal as colorMode,
  resolvedColorMode,
  defaultColors,
  defaultTypography,
  defaultSpacing,
  defaultSizes,
  defaultRadii,
  defaultShadows,
  defaultBreakpoints,
  defaultZIndices,
  defaultTransitions,
  defaultSemanticTokens,
};
