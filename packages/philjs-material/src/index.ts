/**
 * @philjs/material - Material Design 3 Integration for PhilJS
 *
 * Complete Material Design 3 (Material You) theming and component
 * integration with PhilJS's signal-based reactivity system.
 *
 * Features:
 * - Dynamic color theming from source color
 * - Light/Dark/System theme modes
 * - Material Design 3 tokens and typography
 * - Component state management hooks
 * - Motion and elevation utilities
 *
 * @example
 * ```tsx
 * import { signal } from '@philjs/core';
 * import { useMaterialTheme, createThemeFromColor, Button } from '@philjs/material';
 *
 * function App() {
 *   const theme = useMaterialTheme('#6750A4');
 *
 *   return (
 *     <ThemeProvider theme={theme}>
 *       <Button variant="filled">Click me</Button>
 *     </ThemeProvider>
 *   );
 * }
 * ```
 */

import { signal, effect, computed, memo } from '@philjs/core';

// ============================================================================
// Types
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'tonalSpot' | 'vibrant' | 'expressive' | 'fidelity' | 'monochrome' | 'neutral' | 'content';

export interface ColorToken {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
}

export interface TypographyToken {
  displayLarge: TypographyStyle;
  displayMedium: TypographyStyle;
  displaySmall: TypographyStyle;
  headlineLarge: TypographyStyle;
  headlineMedium: TypographyStyle;
  headlineSmall: TypographyStyle;
  titleLarge: TypographyStyle;
  titleMedium: TypographyStyle;
  titleSmall: TypographyStyle;
  labelLarge: TypographyStyle;
  labelMedium: TypographyStyle;
  labelSmall: TypographyStyle;
  bodyLarge: TypographyStyle;
  bodyMedium: TypographyStyle;
  bodySmall: TypographyStyle;
}

export interface TypographyStyle {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing: string;
}

export interface ShapeToken {
  cornerNone: string;
  cornerExtraSmall: string;
  cornerSmall: string;
  cornerMedium: string;
  cornerLarge: string;
  cornerExtraLarge: string;
  cornerFull: string;
}

export interface ElevationToken {
  level0: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  level5: string;
}

export interface MotionToken {
  durationShort1: string;
  durationShort2: string;
  durationShort3: string;
  durationShort4: string;
  durationMedium1: string;
  durationMedium2: string;
  durationMedium3: string;
  durationMedium4: string;
  durationLong1: string;
  durationLong2: string;
  durationLong3: string;
  durationLong4: string;
  durationExtraLong1: string;
  durationExtraLong2: string;
  durationExtraLong3: string;
  durationExtraLong4: string;
  easingStandard: string;
  easingStandardDecelerate: string;
  easingStandardAccelerate: string;
  easingEmphasized: string;
  easingEmphasizedDecelerate: string;
  easingEmphasizedAccelerate: string;
}

export interface MaterialTheme {
  mode: ThemeMode;
  sourceColor: string;
  colorScheme: ColorScheme;
  colors: ColorToken;
  typography: TypographyToken;
  shape: ShapeToken;
  elevation: ElevationToken;
  motion: MotionToken;
}

// ============================================================================
// Default Values
// ============================================================================

const defaultTypography: TypographyToken = {
  displayLarge: { fontFamily: 'Roboto, sans-serif', fontSize: '57px', fontWeight: 400, lineHeight: '64px', letterSpacing: '-0.25px' },
  displayMedium: { fontFamily: 'Roboto, sans-serif', fontSize: '45px', fontWeight: 400, lineHeight: '52px', letterSpacing: '0px' },
  displaySmall: { fontFamily: 'Roboto, sans-serif', fontSize: '36px', fontWeight: 400, lineHeight: '44px', letterSpacing: '0px' },
  headlineLarge: { fontFamily: 'Roboto, sans-serif', fontSize: '32px', fontWeight: 400, lineHeight: '40px', letterSpacing: '0px' },
  headlineMedium: { fontFamily: 'Roboto, sans-serif', fontSize: '28px', fontWeight: 400, lineHeight: '36px', letterSpacing: '0px' },
  headlineSmall: { fontFamily: 'Roboto, sans-serif', fontSize: '24px', fontWeight: 400, lineHeight: '32px', letterSpacing: '0px' },
  titleLarge: { fontFamily: 'Roboto, sans-serif', fontSize: '22px', fontWeight: 400, lineHeight: '28px', letterSpacing: '0px' },
  titleMedium: { fontFamily: 'Roboto, sans-serif', fontSize: '16px', fontWeight: 500, lineHeight: '24px', letterSpacing: '0.15px' },
  titleSmall: { fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500, lineHeight: '20px', letterSpacing: '0.1px' },
  labelLarge: { fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500, lineHeight: '20px', letterSpacing: '0.1px' },
  labelMedium: { fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: 500, lineHeight: '16px', letterSpacing: '0.5px' },
  labelSmall: { fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: 500, lineHeight: '16px', letterSpacing: '0.5px' },
  bodyLarge: { fontFamily: 'Roboto, sans-serif', fontSize: '16px', fontWeight: 400, lineHeight: '24px', letterSpacing: '0.5px' },
  bodyMedium: { fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: '20px', letterSpacing: '0.25px' },
  bodySmall: { fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: 400, lineHeight: '16px', letterSpacing: '0.4px' },
};

const defaultShape: ShapeToken = {
  cornerNone: '0px',
  cornerExtraSmall: '4px',
  cornerSmall: '8px',
  cornerMedium: '12px',
  cornerLarge: '16px',
  cornerExtraLarge: '28px',
  cornerFull: '9999px',
};

const defaultElevation: ElevationToken = {
  level0: 'none',
  level1: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
  level2: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
  level3: '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px rgba(0, 0, 0, 0.3)',
  level4: '0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px rgba(0, 0, 0, 0.3)',
  level5: '0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px rgba(0, 0, 0, 0.3)',
};

const defaultMotion: MotionToken = {
  durationShort1: '50ms',
  durationShort2: '100ms',
  durationShort3: '150ms',
  durationShort4: '200ms',
  durationMedium1: '250ms',
  durationMedium2: '300ms',
  durationMedium3: '350ms',
  durationMedium4: '400ms',
  durationLong1: '450ms',
  durationLong2: '500ms',
  durationLong3: '550ms',
  durationLong4: '600ms',
  durationExtraLong1: '700ms',
  durationExtraLong2: '800ms',
  durationExtraLong3: '900ms',
  durationExtraLong4: '1000ms',
  easingStandard: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
  easingStandardDecelerate: 'cubic-bezier(0, 0, 0, 1)',
  easingStandardAccelerate: 'cubic-bezier(0.3, 0, 1, 1)',
  easingEmphasized: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
  easingEmphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
  easingEmphasizedAccelerate: 'cubic-bezier(0.3, 0.0, 0.8, 0.15)',
};

// ============================================================================
// Light Theme Colors
// ============================================================================

const lightColors: ColorToken = {
  primary: '#6750A4',
  onPrimary: '#FFFFFF',
  primaryContainer: '#EADDFF',
  onPrimaryContainer: '#21005D',
  secondary: '#625B71',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E8DEF8',
  onSecondaryContainer: '#1D192B',
  tertiary: '#7D5260',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFD8E4',
  onTertiaryContainer: '#31111D',
  error: '#B3261E',
  onError: '#FFFFFF',
  errorContainer: '#F9DEDC',
  onErrorContainer: '#410E0B',
  background: '#FFFBFE',
  onBackground: '#1C1B1F',
  surface: '#FFFBFE',
  onSurface: '#1C1B1F',
  surfaceVariant: '#E7E0EC',
  onSurfaceVariant: '#49454F',
  outline: '#79747E',
  outlineVariant: '#CAC4D0',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#313033',
  inverseOnSurface: '#F4EFF4',
  inversePrimary: '#D0BCFF',
  surfaceDim: '#DED8E1',
  surfaceBright: '#FFFBFE',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F7F2FA',
  surfaceContainer: '#F3EDF7',
  surfaceContainerHigh: '#ECE6F0',
  surfaceContainerHighest: '#E6E0E9',
};

// ============================================================================
// Dark Theme Colors
// ============================================================================

const darkColors: ColorToken = {
  primary: '#D0BCFF',
  onPrimary: '#381E72',
  primaryContainer: '#4F378B',
  onPrimaryContainer: '#EADDFF',
  secondary: '#CCC2DC',
  onSecondary: '#332D41',
  secondaryContainer: '#4A4458',
  onSecondaryContainer: '#E8DEF8',
  tertiary: '#EFB8C8',
  onTertiary: '#492532',
  tertiaryContainer: '#633B48',
  onTertiaryContainer: '#FFD8E4',
  error: '#F2B8B5',
  onError: '#601410',
  errorContainer: '#8C1D18',
  onErrorContainer: '#F9DEDC',
  background: '#1C1B1F',
  onBackground: '#E6E1E5',
  surface: '#1C1B1F',
  onSurface: '#E6E1E5',
  surfaceVariant: '#49454F',
  onSurfaceVariant: '#CAC4D0',
  outline: '#938F99',
  outlineVariant: '#49454F',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#E6E1E5',
  inverseOnSurface: '#313033',
  inversePrimary: '#6750A4',
  surfaceDim: '#141218',
  surfaceBright: '#3B383E',
  surfaceContainerLowest: '#0F0D13',
  surfaceContainerLow: '#1D1B20',
  surfaceContainer: '#211F26',
  surfaceContainerHigh: '#2B2930',
  surfaceContainerHighest: '#36343B',
};

// ============================================================================
// Color Generation from Source Color
// ============================================================================

/**
 * Convert hex color to HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  let r = parseInt(result[1]!, 16) / 255;
  let g = parseInt(result[2]!, 16) / 255;
  let b = parseInt(result[3]!, 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to hex
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Generate a color tone (0-100)
 */
function generateTone(hue: number, chroma: number, tone: number): string {
  // Simplified HCT to RGB conversion
  const lightness = tone;
  const saturation = Math.min(chroma * 1.5, 100);
  return hslToHex(hue, saturation, lightness);
}

/**
 * Create a color palette from source color
 */
export function createPaletteFromColor(sourceColor: string, isDark: boolean = false): ColorToken {
  const { h, s } = hexToHsl(sourceColor);
  const hue = h;
  const chroma = s;

  // Generate primary tones
  const primaryTones = {
    0: generateTone(hue, chroma, 0),
    10: generateTone(hue, chroma, 10),
    20: generateTone(hue, chroma, 20),
    30: generateTone(hue, chroma, 30),
    40: generateTone(hue, chroma, 40),
    50: generateTone(hue, chroma, 50),
    60: generateTone(hue, chroma, 60),
    70: generateTone(hue, chroma, 70),
    80: generateTone(hue, chroma, 80),
    90: generateTone(hue, chroma, 90),
    95: generateTone(hue, chroma, 95),
    99: generateTone(hue, chroma, 99),
    100: generateTone(hue, chroma, 100),
  };

  // Secondary hue (shifted by 15 degrees)
  const secondaryHue = (hue + 15) % 360;
  const secondaryChroma = chroma * 0.5;

  // Tertiary hue (shifted by 60 degrees)
  const tertiaryHue = (hue + 60) % 360;
  const tertiaryChroma = chroma * 0.6;

  // Error color (fixed red)
  const errorHue = 25;
  const errorChroma = 84;

  // Neutral tones
  const neutralHue = hue;
  const neutralChroma = 4;

  // Neutral variant tones
  const neutralVariantHue = hue;
  const neutralVariantChroma = 8;

  if (isDark) {
    return {
      primary: primaryTones[80],
      onPrimary: primaryTones[20],
      primaryContainer: primaryTones[30],
      onPrimaryContainer: primaryTones[90],
      secondary: generateTone(secondaryHue, secondaryChroma, 80),
      onSecondary: generateTone(secondaryHue, secondaryChroma, 20),
      secondaryContainer: generateTone(secondaryHue, secondaryChroma, 30),
      onSecondaryContainer: generateTone(secondaryHue, secondaryChroma, 90),
      tertiary: generateTone(tertiaryHue, tertiaryChroma, 80),
      onTertiary: generateTone(tertiaryHue, tertiaryChroma, 20),
      tertiaryContainer: generateTone(tertiaryHue, tertiaryChroma, 30),
      onTertiaryContainer: generateTone(tertiaryHue, tertiaryChroma, 90),
      error: generateTone(errorHue, errorChroma, 80),
      onError: generateTone(errorHue, errorChroma, 20),
      errorContainer: generateTone(errorHue, errorChroma, 30),
      onErrorContainer: generateTone(errorHue, errorChroma, 90),
      background: generateTone(neutralHue, neutralChroma, 6),
      onBackground: generateTone(neutralHue, neutralChroma, 90),
      surface: generateTone(neutralHue, neutralChroma, 6),
      onSurface: generateTone(neutralHue, neutralChroma, 90),
      surfaceVariant: generateTone(neutralVariantHue, neutralVariantChroma, 30),
      onSurfaceVariant: generateTone(neutralVariantHue, neutralVariantChroma, 80),
      outline: generateTone(neutralVariantHue, neutralVariantChroma, 60),
      outlineVariant: generateTone(neutralVariantHue, neutralVariantChroma, 30),
      shadow: '#000000',
      scrim: '#000000',
      inverseSurface: generateTone(neutralHue, neutralChroma, 90),
      inverseOnSurface: generateTone(neutralHue, neutralChroma, 20),
      inversePrimary: primaryTones[40],
      surfaceDim: generateTone(neutralHue, neutralChroma, 6),
      surfaceBright: generateTone(neutralHue, neutralChroma, 24),
      surfaceContainerLowest: generateTone(neutralHue, neutralChroma, 4),
      surfaceContainerLow: generateTone(neutralHue, neutralChroma, 10),
      surfaceContainer: generateTone(neutralHue, neutralChroma, 12),
      surfaceContainerHigh: generateTone(neutralHue, neutralChroma, 17),
      surfaceContainerHighest: generateTone(neutralHue, neutralChroma, 22),
    };
  }

  return {
    primary: primaryTones[40],
    onPrimary: primaryTones[100],
    primaryContainer: primaryTones[90],
    onPrimaryContainer: primaryTones[10],
    secondary: generateTone(secondaryHue, secondaryChroma, 40),
    onSecondary: generateTone(secondaryHue, secondaryChroma, 100),
    secondaryContainer: generateTone(secondaryHue, secondaryChroma, 90),
    onSecondaryContainer: generateTone(secondaryHue, secondaryChroma, 10),
    tertiary: generateTone(tertiaryHue, tertiaryChroma, 40),
    onTertiary: generateTone(tertiaryHue, tertiaryChroma, 100),
    tertiaryContainer: generateTone(tertiaryHue, tertiaryChroma, 90),
    onTertiaryContainer: generateTone(tertiaryHue, tertiaryChroma, 10),
    error: generateTone(errorHue, errorChroma, 40),
    onError: generateTone(errorHue, errorChroma, 100),
    errorContainer: generateTone(errorHue, errorChroma, 90),
    onErrorContainer: generateTone(errorHue, errorChroma, 10),
    background: generateTone(neutralHue, neutralChroma, 98),
    onBackground: generateTone(neutralHue, neutralChroma, 10),
    surface: generateTone(neutralHue, neutralChroma, 98),
    onSurface: generateTone(neutralHue, neutralChroma, 10),
    surfaceVariant: generateTone(neutralVariantHue, neutralVariantChroma, 90),
    onSurfaceVariant: generateTone(neutralVariantHue, neutralVariantChroma, 30),
    outline: generateTone(neutralVariantHue, neutralVariantChroma, 50),
    outlineVariant: generateTone(neutralVariantHue, neutralVariantChroma, 80),
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: generateTone(neutralHue, neutralChroma, 20),
    inverseOnSurface: generateTone(neutralHue, neutralChroma, 95),
    inversePrimary: primaryTones[80],
    surfaceDim: generateTone(neutralHue, neutralChroma, 87),
    surfaceBright: generateTone(neutralHue, neutralChroma, 98),
    surfaceContainerLowest: generateTone(neutralHue, neutralChroma, 100),
    surfaceContainerLow: generateTone(neutralHue, neutralChroma, 96),
    surfaceContainer: generateTone(neutralHue, neutralChroma, 94),
    surfaceContainerHigh: generateTone(neutralHue, neutralChroma, 92),
    surfaceContainerHighest: generateTone(neutralHue, neutralChroma, 90),
  };
}

/**
 * Create a complete Material theme from a source color
 */
export function createThemeFromColor(
  sourceColor: string,
  options: {
    mode?: ThemeMode;
    colorScheme?: ColorScheme;
    typography?: Partial<TypographyToken>;
    shape?: Partial<ShapeToken>;
  } = {}
): MaterialTheme {
  const mode = options.mode || 'light';
  const isDark = mode === 'dark' ||
    (mode === 'system' && typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  return {
    mode,
    sourceColor,
    colorScheme: options.colorScheme || 'tonalSpot',
    colors: createPaletteFromColor(sourceColor, isDark),
    typography: { ...defaultTypography, ...options.typography },
    shape: { ...defaultShape, ...options.shape },
    elevation: defaultElevation,
    motion: defaultMotion,
  };
}

// ============================================================================
// Theme State Management
// ============================================================================

const themeMode = signal<ThemeMode>('system');
const sourceColor = signal<string>('#6750A4');

/**
 * Get current effective theme colors
 */
export const theme = memo(() => {
  const mode = themeMode();
  const source = sourceColor();

  const systemDark = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;

  const isDark = mode === 'dark' || (mode === 'system' && systemDark);

  if (source === '#6750A4') {
    // Use default colors for default source
    return isDark ? darkColors : lightColors;
  }

  return createPaletteFromColor(source, isDark);
});

/**
 * Get full theme object
 */
export const fullTheme = memo((): MaterialTheme => {
  return createThemeFromColor(sourceColor(), { mode: themeMode() });
});

/**
 * Set theme mode
 */
export function setThemeMode(mode: ThemeMode): void {
  themeMode.set(mode);
}

/**
 * Set source color for dynamic theming
 */
export function setSourceColor(color: string): void {
  sourceColor.set(color);
}

/**
 * Hook to use the Material theme
 */
export function useTheme(): {
  theme: ReturnType<typeof theme>;
  fullTheme: ReturnType<typeof fullTheme>;
  mode: ReturnType<typeof signal<ThemeMode>>;
  sourceColor: ReturnType<typeof signal<string>>;
  setMode: typeof setThemeMode;
  setSourceColor: typeof setSourceColor;
} {
  return {
    theme,
    fullTheme,
    mode: themeMode,
    sourceColor,
    setMode: setThemeMode,
    setSourceColor,
  };
}

/**
 * Create a custom theme with specific source color
 */
export function useMaterialTheme(color: string, mode: ThemeMode = 'system'): MaterialTheme {
  const themeSignal = signal(createThemeFromColor(color, { mode }));

  effect(() => {
    const systemDark = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;

    const listener = (e: MediaQueryListEvent) => {
      if (mode === 'system') {
        themeSignal.set(createThemeFromColor(color, { mode }));
      }
    };

    if (typeof window !== 'undefined') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener);
      return () => {
        window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', listener);
      };
    }
  });

  return themeSignal();
}

// ============================================================================
// Component State Hooks
// ============================================================================

export type RippleState = {
  key: number;
  x: number;
  y: number;
  size: number;
};

/**
 * Hook for managing ripple effect state
 */
export function useRipple(): {
  ripples: ReturnType<typeof signal<RippleState[]>>;
  addRipple: (event: MouseEvent) => void;
  removeRipple: (key: number) => void;
} {
  const ripples = signal<RippleState[]>([]);
  let rippleKey = 0;

  const addRipple = (event: MouseEvent) => {
    const target = event.currentTarget as HTMLElement;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const key = ++rippleKey;
    ripples.set([...ripples(), { key, x, y, size }]);

    // Auto-remove after animation
    setTimeout(() => removeRipple(key), 600);
  };

  const removeRipple = (key: number) => {
    ripples.set(ripples().filter(r => r.key !== key));
  };

  return { ripples, addRipple, removeRipple };
}

/**
 * Hook for managing focus ring visibility
 */
export function useFocusRing(): {
  isFocusVisible: ReturnType<typeof signal<boolean>>;
  focusProps: {
    onFocus: (e: FocusEvent) => void;
    onBlur: () => void;
    onKeyDown: (e: KeyboardEvent) => void;
    onMouseDown: () => void;
  };
} {
  const isFocusVisible = signal(false);
  let hadKeyboardEvent = false;

  return {
    isFocusVisible,
    focusProps: {
      onFocus: (e: FocusEvent) => {
        if (hadKeyboardEvent) {
          isFocusVisible.set(true);
        }
      },
      onBlur: () => {
        isFocusVisible.set(false);
      },
      onKeyDown: () => {
        hadKeyboardEvent = true;
      },
      onMouseDown: () => {
        hadKeyboardEvent = false;
      },
    },
  };
}

/**
 * Hook for managing hover state
 */
export function useHover(): {
  isHovered: ReturnType<typeof signal<boolean>>;
  hoverProps: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
} {
  const isHovered = signal(false);

  return {
    isHovered,
    hoverProps: {
      onMouseEnter: () => isHovered.set(true),
      onMouseLeave: () => isHovered.set(false),
    },
  };
}

/**
 * Hook for managing pressed state
 */
export function usePressed(): {
  isPressed: ReturnType<typeof signal<boolean>>;
  pressProps: {
    onMouseDown: () => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onTouchStart: () => void;
    onTouchEnd: () => void;
  };
} {
  const isPressed = signal(false);

  return {
    isPressed,
    pressProps: {
      onMouseDown: () => isPressed.set(true),
      onMouseUp: () => isPressed.set(false),
      onMouseLeave: () => isPressed.set(false),
      onTouchStart: () => isPressed.set(true),
      onTouchEnd: () => isPressed.set(false),
    },
  };
}

// ============================================================================
// Snackbar/Toast
// ============================================================================

export interface SnackbarOptions {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  position?: 'bottom' | 'top';
}

const snackbarQueue = signal<Array<{ id: number; options: SnackbarOptions }>>([]);
let snackbarId = 0;

export const snackbar = {
  show: (message: string | SnackbarOptions): number => {
    const options = typeof message === 'string' ? { message } : message;
    const id = ++snackbarId;

    snackbarQueue.set([...snackbarQueue(), { id, options }]);

    // Auto-dismiss after duration
    const duration = options.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => snackbar.dismiss(id), duration);
    }

    return id;
  },

  dismiss: (id: number) => {
    snackbarQueue.set(snackbarQueue().filter(s => s.id !== id));
  },

  dismissAll: () => {
    snackbarQueue.set([]);
  },
};

export function useSnackbar(): {
  snackbars: typeof snackbarQueue;
  show: typeof snackbar.show;
  dismiss: typeof snackbar.dismiss;
} {
  return {
    snackbars: snackbarQueue,
    show: snackbar.show,
    dismiss: snackbar.dismiss,
  };
}

// ============================================================================
// Dialog State
// ============================================================================

export interface DialogState {
  isOpen: boolean;
  data?: unknown;
}

export function useDialog<T = unknown>(): {
  isOpen: ReturnType<typeof signal<boolean>>;
  data: ReturnType<typeof signal<T | undefined>>;
  open: (data?: T) => void;
  close: () => void;
  dialogProps: {
    open: boolean;
    onClose: () => void;
  };
} {
  const isOpen = signal(false);
  const data = signal<T | undefined>(undefined);

  const open = (d?: T) => {
    data.set(d);
    isOpen.set(true);
  };

  const close = () => {
    isOpen.set(false);
  };

  const dialogProps = computed(() => ({
    open: isOpen(),
    onClose: close,
  }));

  return {
    isOpen,
    data,
    open,
    close,
    dialogProps: dialogProps(),
  };
}

// ============================================================================
// Menu State
// ============================================================================

export function useMenu(): {
  isOpen: ReturnType<typeof signal<boolean>>;
  anchorEl: ReturnType<typeof signal<HTMLElement | null>>;
  open: (event: MouseEvent) => void;
  close: () => void;
  menuProps: {
    open: boolean;
    anchorEl: HTMLElement | null;
    onClose: () => void;
  };
} {
  const isOpen = signal(false);
  const anchorEl = signal<HTMLElement | null>(null);

  const open = (event: MouseEvent) => {
    anchorEl.set(event.currentTarget as HTMLElement);
    isOpen.set(true);
  };

  const close = () => {
    isOpen.set(false);
    anchorEl.set(null);
  };

  const menuProps = computed(() => ({
    open: isOpen(),
    anchorEl: anchorEl(),
    onClose: close,
  }));

  return {
    isOpen,
    anchorEl,
    open,
    close,
    menuProps: menuProps(),
  };
}

// ============================================================================
// CSS Variable Generation
// ============================================================================

/**
 * Generate CSS custom properties from theme
 */
export function generateCSSVariables(t: MaterialTheme): string {
  const lines: string[] = [':root {'];

  // Colors
  for (const [key, value] of Object.entries(t.colors)) {
    lines.push(`  --md-sys-color-${toKebabCase(key)}: ${value};`);
  }

  // Typography
  for (const [key, style] of Object.entries(t.typography)) {
    const prefix = `--md-sys-typescale-${toKebabCase(key)}`;
    lines.push(`  ${prefix}-font-family: ${style.fontFamily};`);
    lines.push(`  ${prefix}-font-size: ${style.fontSize};`);
    lines.push(`  ${prefix}-font-weight: ${style.fontWeight};`);
    lines.push(`  ${prefix}-line-height: ${style.lineHeight};`);
    lines.push(`  ${prefix}-letter-spacing: ${style.letterSpacing};`);
  }

  // Shape
  for (const [key, value] of Object.entries(t.shape)) {
    lines.push(`  --md-sys-shape-${toKebabCase(key)}: ${value};`);
  }

  // Elevation
  for (const [key, value] of Object.entries(t.elevation)) {
    lines.push(`  --md-sys-elevation-${toKebabCase(key)}: ${value};`);
  }

  // Motion
  for (const [key, value] of Object.entries(t.motion)) {
    lines.push(`  --md-sys-motion-${toKebabCase(key)}: ${value};`);
  }

  lines.push('}');
  return lines.join('\n');
}

function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Apply theme CSS variables to document
 */
export function applyTheme(t: MaterialTheme): void {
  if (typeof document === 'undefined') return;

  const css = generateCSSVariables(t);
  let styleElement = document.getElementById('md3-theme-vars');

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'md3-theme-vars';
    document.head.appendChild(styleElement);
  }

  styleElement.textContent = css;
}

// Auto-apply theme changes
effect(() => {
  const t = fullTheme();
  applyTheme(t);
});

// ============================================================================
// Exports
// ============================================================================

export {
  signal,
  effect,
  computed,
  memo,
} from '@philjs/core';

export {
  lightColors,
  darkColors,
  defaultTypography,
  defaultShape,
  defaultElevation,
  defaultMotion,
};
