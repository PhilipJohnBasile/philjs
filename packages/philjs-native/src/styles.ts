/**
 * PhilJS Native Styling
 *
 * Type-safe styling system with flexbox layout.
 * Similar to React Native's StyleSheet.
 */

import { signal, memo, type Signal } from 'philjs-core';
import { detectPlatform, platformInfo, platformSelect } from './runtime.js';

// ============================================================================
// Style Types
// ============================================================================

/**
 * Flex alignment
 */
export type FlexAlignType =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'stretch'
  | 'baseline';

/**
 * Flex justify content
 */
export type FlexJustifyType =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';

/**
 * Flex direction
 */
export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';

/**
 * Flex wrap
 */
export type FlexWrap = 'wrap' | 'nowrap' | 'wrap-reverse';

/**
 * Position type
 */
export type PositionType = 'absolute' | 'relative';

/**
 * Dimension value
 */
export type DimensionValue = number | string | 'auto';

/**
 * Color value
 */
export type ColorValue = string;

/**
 * Font weight
 */
export type FontWeight =
  | 'normal'
  | 'bold'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900';

/**
 * Text align
 */
export type TextAlign = 'auto' | 'left' | 'right' | 'center' | 'justify';

/**
 * Text decoration
 */
export type TextDecorationLine = 'none' | 'underline' | 'line-through' | 'underline line-through';

/**
 * Border style
 */
export type BorderStyle = 'solid' | 'dotted' | 'dashed';

/**
 * Overflow
 */
export type Overflow = 'visible' | 'hidden' | 'scroll';

/**
 * Display
 */
export type Display = 'none' | 'flex';

/**
 * Native style (platform-specific)
 */
export type NativeStyle = Record<string, any>;

// ============================================================================
// View Style
// ============================================================================

/**
 * View style properties
 */
export interface ViewStyle {
  // Layout
  flex?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: DimensionValue;
  flexDirection?: FlexDirection;
  flexWrap?: FlexWrap;
  alignItems?: FlexAlignType;
  alignSelf?: FlexAlignType | 'auto';
  alignContent?: FlexAlignType | 'space-between' | 'space-around';
  justifyContent?: FlexJustifyType;
  gap?: number;
  rowGap?: number;
  columnGap?: number;

  // Dimensions
  width?: DimensionValue;
  height?: DimensionValue;
  minWidth?: DimensionValue;
  maxWidth?: DimensionValue;
  minHeight?: DimensionValue;
  maxHeight?: DimensionValue;
  aspectRatio?: number;

  // Position
  position?: PositionType;
  top?: DimensionValue;
  right?: DimensionValue;
  bottom?: DimensionValue;
  left?: DimensionValue;
  zIndex?: number;

  // Margin
  margin?: DimensionValue;
  marginTop?: DimensionValue;
  marginRight?: DimensionValue;
  marginBottom?: DimensionValue;
  marginLeft?: DimensionValue;
  marginHorizontal?: DimensionValue;
  marginVertical?: DimensionValue;

  // Padding
  padding?: DimensionValue;
  paddingTop?: DimensionValue;
  paddingRight?: DimensionValue;
  paddingBottom?: DimensionValue;
  paddingLeft?: DimensionValue;
  paddingHorizontal?: DimensionValue;
  paddingVertical?: DimensionValue;

  // Border
  borderWidth?: number;
  borderTopWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
  borderColor?: ColorValue;
  borderTopColor?: ColorValue;
  borderRightColor?: ColorValue;
  borderBottomColor?: ColorValue;
  borderLeftColor?: ColorValue;
  borderStyle?: BorderStyle;
  borderRadius?: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;

  // Background
  backgroundColor?: ColorValue;
  opacity?: number;

  // Shadow (iOS)
  shadowColor?: ColorValue;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;

  // Elevation (Android)
  elevation?: number;

  // Overflow
  overflow?: Overflow;

  // Display
  display?: Display;

  // Transform
  transform?: Transform[];
}

/**
 * Transform types
 */
export type Transform =
  | { perspective: number }
  | { rotate: string }
  | { rotateX: string }
  | { rotateY: string }
  | { rotateZ: string }
  | { scale: number }
  | { scaleX: number }
  | { scaleY: number }
  | { translateX: number }
  | { translateY: number }
  | { skewX: string }
  | { skewY: string }
  | { matrix: number[] };

// ============================================================================
// Text Style
// ============================================================================

/**
 * Text style properties
 */
export interface TextStyle extends ViewStyle {
  // Font
  color?: ColorValue;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: 'normal' | 'italic';
  fontWeight?: FontWeight;
  fontVariant?: ('small-caps' | 'oldstyle-nums' | 'lining-nums' | 'tabular-nums' | 'proportional-nums')[];
  letterSpacing?: number;
  lineHeight?: number;

  // Text
  textAlign?: TextAlign;
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
  textDecorationLine?: TextDecorationLine;
  textDecorationStyle?: 'solid' | 'double' | 'dotted' | 'dashed';
  textDecorationColor?: ColorValue;
  textShadowColor?: ColorValue;
  textShadowOffset?: { width: number; height: number };
  textShadowRadius?: number;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';

  // iOS specific
  writingDirection?: 'auto' | 'ltr' | 'rtl';

  // Android specific
  includeFontPadding?: boolean;
}

// ============================================================================
// Image Style
// ============================================================================

/**
 * Image style properties
 */
export interface ImageStyle extends ViewStyle {
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  tintColor?: ColorValue;
  overlayColor?: ColorValue;
}

// ============================================================================
// StyleSheet
// ============================================================================

/**
 * Named styles object
 */
export type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

/**
 * Flatten style result
 */
export type StyleProp<T> = T | T[] | null | undefined | false;

let styleIdCounter = 0;

/**
 * StyleSheet API
 */
export const StyleSheet = {
  /**
   * Create a StyleSheet
   */
  create<T extends NamedStyles<T>>(styles: T): T {
    // In production, this would optimize and validate styles
    // For now, just return the styles with unique IDs
    const result = {} as T;

    for (const key in styles) {
      if (Object.prototype.hasOwnProperty.call(styles, key)) {
        const style = styles[key];
        result[key] = {
          __styleId: ++styleIdCounter,
          ...style,
        } as any;
      }
    }

    return result;
  },

  /**
   * Flatten style array into single style object
   */
  flatten<T extends ViewStyle | TextStyle | ImageStyle>(
    style: StyleProp<T>
  ): T | undefined {
    if (!style) return undefined;
    if (!Array.isArray(style)) return style as T;

    return style.reduce((acc, s) => {
      if (!s) return acc;
      if (Array.isArray(s)) {
        return { ...acc, ...this.flatten(s) };
      }
      return { ...acc, ...s };
    }, {} as T);
  },

  /**
   * Compose multiple styles
   */
  compose<T extends ViewStyle | TextStyle | ImageStyle>(
    style1: StyleProp<T>,
    style2: StyleProp<T>
  ): StyleProp<T> {
    if (!style1 && !style2) return undefined;
    if (!style1) return style2;
    if (!style2) return style1;
    return [style1, style2] as StyleProp<T>;
  },

  /**
   * Absolute fill shorthand
   */
  absoluteFill: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  /**
   * Absolute fill object
   */
  absoluteFillObject: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  /**
   * Hairline width (1 pixel on all devices)
   */
  hairlineWidth: typeof window !== 'undefined'
    ? 1 / (window.devicePixelRatio || 1)
    : 1,
};

// ============================================================================
// Color Scheme
// ============================================================================

/**
 * Color scheme type
 */
export type ColorSchemeName = 'light' | 'dark';

/**
 * Current color scheme signal
 */
export const colorScheme: Signal<ColorSchemeName> = signal(getInitialColorScheme());

/**
 * Get initial color scheme
 */
function getInitialColorScheme(): ColorSchemeName {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

// Listen for color scheme changes
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    colorScheme.set(e.matches ? 'dark' : 'light');
  });
}

/**
 * Hook to get color scheme
 */
export function useColorScheme(): ColorSchemeName {
  return colorScheme();
}

// ============================================================================
// Platform-specific Styling
// ============================================================================

/**
 * Platform-specific style selection
 */
export function platformStyles<T extends ViewStyle | TextStyle | ImageStyle>(options: {
  ios?: T;
  android?: T;
  web?: T;
  native?: T;
  default: T;
}): T {
  const platform = detectPlatform();

  if (platform === 'ios' && options.ios) {
    return { ...options.default, ...options.ios };
  }
  if (platform === 'android' && options.android) {
    return { ...options.default, ...options.android };
  }
  if (platform === 'web' && options.web) {
    return { ...options.default, ...options.web };
  }
  if (platform !== 'web' && options.native) {
    return { ...options.default, ...options.native };
  }

  return options.default;
}

// ============================================================================
// Theme Support
// ============================================================================

/**
 * Theme colors
 */
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  error: string;
  onPrimary: string;
  onSecondary: string;
  onBackground: string;
  onSurface: string;
  onError: string;
  text: string;
  textSecondary: string;
  border: string;
  disabled: string;
}

/**
 * Theme spacing
 */
export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

/**
 * Theme typography
 */
export interface ThemeTypography {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  h4: TextStyle;
  h5: TextStyle;
  h6: TextStyle;
  body1: TextStyle;
  body2: TextStyle;
  caption: TextStyle;
  button: TextStyle;
  overline: TextStyle;
}

/**
 * Full theme definition
 */
export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
}

/**
 * Default light theme
 */
export const lightTheme: Theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    error: '#FF3B30',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#000000',
    onSurface: '#000000',
    onError: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C6C6C8',
    disabled: '#C7C7CC',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    h1: { fontSize: 34, fontWeight: 'bold', letterSpacing: 0.25 },
    h2: { fontSize: 28, fontWeight: 'bold', letterSpacing: 0 },
    h3: { fontSize: 22, fontWeight: '600', letterSpacing: 0.15 },
    h4: { fontSize: 20, fontWeight: '600', letterSpacing: 0.15 },
    h5: { fontSize: 17, fontWeight: '600', letterSpacing: 0.15 },
    h6: { fontSize: 15, fontWeight: '600', letterSpacing: 0.15 },
    body1: { fontSize: 17, fontWeight: 'normal', letterSpacing: 0.5 },
    body2: { fontSize: 15, fontWeight: 'normal', letterSpacing: 0.25 },
    caption: { fontSize: 13, fontWeight: 'normal', letterSpacing: 0.4 },
    button: { fontSize: 17, fontWeight: '600', letterSpacing: 0.5, textTransform: 'none' },
    overline: { fontSize: 11, fontWeight: '500', letterSpacing: 1.5, textTransform: 'uppercase' },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
};

/**
 * Default dark theme
 */
export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#000000',
    surface: '#1C1C1E',
    error: '#FF453A',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
    onError: '#FFFFFF',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    disabled: '#48484A',
  },
};

/**
 * Current theme signal
 */
export const currentTheme: Signal<Theme> = signal(lightTheme);

/**
 * Set theme
 */
export function setTheme(theme: Theme): void {
  currentTheme.set(theme);
}

/**
 * Hook to get current theme
 */
export function useTheme(): Theme {
  return currentTheme();
}

/**
 * Hook to get themed styles
 */
export function useThemedStyles<T extends NamedStyles<T>>(
  createStyles: (theme: Theme) => T
): T {
  const theme = useTheme();
  return memo(() => createStyles(theme))();
}

// ============================================================================
// Responsive Utilities
// ============================================================================

/**
 * Breakpoints
 */
export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};

/**
 * Current breakpoint
 */
export const currentBreakpoint: Signal<keyof typeof breakpoints> = signal(
  getBreakpoint()
);

function getBreakpoint(): keyof typeof breakpoints {
  if (typeof window === 'undefined') return 'md';

  const width = window.innerWidth;
  if (width < breakpoints.sm) return 'xs';
  if (width < breakpoints.md) return 'sm';
  if (width < breakpoints.lg) return 'md';
  if (width < breakpoints.xl) return 'lg';
  if (width < breakpoints.xxl) return 'xl';
  return 'xxl';
}

// Update breakpoint on resize
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    currentBreakpoint.set(getBreakpoint());
  });
}

/**
 * Responsive style based on breakpoint
 */
export function responsive<T>(options: Partial<Record<keyof typeof breakpoints, T>>): T | undefined {
  const bp = currentBreakpoint();
  const bpOrder: (keyof typeof breakpoints)[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  const currentIndex = bpOrder.indexOf(bp);

  // Find the closest defined value
  for (let i = currentIndex; i >= 0; i--) {
    if (options[bpOrder[i]] !== undefined) {
      return options[bpOrder[i]];
    }
  }

  return undefined;
}

// ============================================================================
// Common Style Patterns
// ============================================================================

/**
 * Common style patterns
 */
export const commonStyles = StyleSheet.create({
  // Flex patterns
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  wrap: {
    flexWrap: 'wrap',
  },

  // Fill patterns
  fill: {
    flex: 1,
  },
  fillAbsolute: StyleSheet.absoluteFillObject,

  // Shadow patterns
  shadow: platformStyles({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
    default: {},
  }),
  shadowLarge: platformStyles({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }),
});
