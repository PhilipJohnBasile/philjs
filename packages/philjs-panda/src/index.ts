/**
 * @philjs/panda - Comprehensive Panda CSS Integration for PhilJS
 *
 * Type-safe CSS-in-JS with Panda CSS integration.
 * Features include:
 * - PhilJS-optimized preset with tokens, patterns, and recipes
 * - Signal-aware dynamic styling
 * - Semantic token system
 * - Responsive and dark mode conditions
 * - Layout patterns (Stack, Flex, Grid, Container)
 * - Component recipes with variants
 * - Runtime style utilities
 * - JSX style props integration
 *
 * @example
 * ```typescript
 * // panda.config.ts
 * import { defineConfig } from '@pandacss/dev';
 * import { philjsPreset, philjsConditions } from '@philjs/panda';
 *
 * export default defineConfig({
 *   presets: [philjsPreset],
 *   conditions: philjsConditions,
 * });
 *
 * // Component
 * import { css, cva } from '../styled-system/css';
 * import { stack, flex } from '../styled-system/patterns';
 *
 * const button = cva({
 *   base: { px: 4, py: 2, rounded: 'md' },
 *   variants: {
 *     visual: {
 *       solid: { bg: 'primary.500', color: 'white' },
 *       outline: { border: '1px solid', borderColor: 'primary.500' },
 *     },
 *   },
 * });
 * ```
 */

import { signal, computed, effect, type Signal } from '@philjs/core';

// ============================================================================
// Types
// ============================================================================

/** Panda CSS token types */
export interface TokenCategory {
  [key: string]: string | TokenCategory;
}

/** Theme tokens */
export interface ThemeTokens {
  colors?: TokenCategory;
  spacing?: TokenCategory;
  sizes?: TokenCategory;
  fonts?: TokenCategory;
  fontSizes?: TokenCategory;
  fontWeights?: TokenCategory;
  lineHeights?: TokenCategory;
  letterSpacings?: TokenCategory;
  radii?: TokenCategory;
  shadows?: TokenCategory;
  borders?: TokenCategory;
  durations?: TokenCategory;
  easings?: TokenCategory;
  animations?: TokenCategory;
  zIndex?: TokenCategory;
  opacity?: TokenCategory;
  aspectRatios?: TokenCategory;
  breakpoints?: TokenCategory;
  assets?: TokenCategory;
}

/** Semantic tokens */
export interface SemanticTokens {
  colors?: Record<string, { value: string | { base: string; _dark?: string } }>;
  spacing?: Record<string, { value: string }>;
  radii?: Record<string, { value: string }>;
  shadows?: Record<string, { value: string | { base: string; _dark?: string } }>;
  fonts?: Record<string, { value: string }>;
  fontSizes?: Record<string, { value: string }>;
}

/** Text style definition */
export interface TextStyle {
  fontSize?: string;
  fontWeight?: string | number;
  lineHeight?: string | number;
  letterSpacing?: string;
  fontFamily?: string;
  textDecoration?: string;
  textTransform?: string;
}

/** Layer style definition */
export interface LayerStyle {
  background?: string;
  backgroundColor?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  opacity?: number;
}

/** Recipe variant */
export interface RecipeVariant {
  [key: string]: Record<string, any>;
}

/** Recipe definition */
export interface RecipeDefinition {
  className?: string;
  base?: Record<string, any>;
  variants?: Record<string, RecipeVariant>;
  defaultVariants?: Record<string, string>;
  compoundVariants?: Array<{
    [key: string]: string | Record<string, any>;
    css: Record<string, any>;
  }>;
}

/** Pattern definition */
export interface PatternDefinition {
  description?: string;
  properties?: Record<string, {
    type: string;
    value?: any;
  }>;
  transform?: (props: Record<string, any>) => Record<string, any>;
}

/** Utility definition */
export interface UtilityDefinition {
  className?: string;
  shorthand?: string | string[];
  values?: string | string[] | Record<string, string>;
  transform?: (value: any) => Record<string, any>;
}

/** Preset configuration */
export interface PresetConfig {
  name: string;
  theme: {
    tokens?: ThemeTokens;
    semanticTokens?: SemanticTokens;
    textStyles?: Record<string, TextStyle>;
    layerStyles?: Record<string, LayerStyle>;
    recipes?: Record<string, RecipeDefinition>;
    slotRecipes?: Record<string, RecipeDefinition>;
    extend?: {
      tokens?: ThemeTokens;
      semanticTokens?: SemanticTokens;
      textStyles?: Record<string, TextStyle>;
      layerStyles?: Record<string, LayerStyle>;
      recipes?: Record<string, RecipeDefinition>;
    };
  };
  patterns?: Record<string, PatternDefinition>;
  utilities?: Record<string, UtilityDefinition>;
  conditions?: Record<string, string>;
  globalCss?: Record<string, any>;
}

/** CSS properties for runtime styling */
export interface CSSProperties {
  // Layout
  display?: string;
  position?: string;
  top?: string | number;
  right?: string | number;
  bottom?: string | number;
  left?: string | number;
  zIndex?: number | string;

  // Flexbox
  flexDirection?: string;
  flexWrap?: string;
  justifyContent?: string;
  alignItems?: string;
  alignContent?: string;
  gap?: string | number;
  rowGap?: string | number;
  columnGap?: string | number;
  flex?: string | number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: string;
  alignSelf?: string;
  justifySelf?: string;
  order?: number;

  // Grid
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridColumn?: string;
  gridRow?: string;
  gridArea?: string;
  gridAutoFlow?: string;
  gridAutoColumns?: string;
  gridAutoRows?: string;

  // Spacing
  padding?: string | number;
  paddingTop?: string | number;
  paddingRight?: string | number;
  paddingBottom?: string | number;
  paddingLeft?: string | number;
  paddingX?: string | number;
  paddingY?: string | number;
  margin?: string | number;
  marginTop?: string | number;
  marginRight?: string | number;
  marginBottom?: string | number;
  marginLeft?: string | number;
  marginX?: string | number;
  marginY?: string | number;

  // Sizing
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  height?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;

  // Typography
  fontFamily?: string;
  fontSize?: string | number;
  fontWeight?: string | number;
  lineHeight?: string | number;
  letterSpacing?: string | number;
  textAlign?: string;
  textDecoration?: string;
  textTransform?: string;
  whiteSpace?: string;
  wordBreak?: string;

  // Colors
  color?: string;
  backgroundColor?: string;
  background?: string;
  opacity?: number;

  // Borders
  border?: string;
  borderWidth?: string | number;
  borderStyle?: string;
  borderColor?: string;
  borderRadius?: string | number;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;

  // Effects
  boxShadow?: string;
  textShadow?: string;
  filter?: string;
  backdropFilter?: string;
  mixBlendMode?: string;

  // Transforms
  transform?: string;
  transformOrigin?: string;
  scale?: number | string;
  rotate?: string;
  translate?: string;

  // Transitions & Animations
  transition?: string;
  transitionProperty?: string;
  transitionDuration?: string;
  transitionTimingFunction?: string;
  transitionDelay?: string;
  animation?: string;

  // Other
  overflow?: string;
  overflowX?: string;
  overflowY?: string;
  cursor?: string;
  pointerEvents?: string;
  userSelect?: string;
  visibility?: string;
  outline?: string;

  // Shorthand tokens
  p?: string | number;
  pt?: string | number;
  pr?: string | number;
  pb?: string | number;
  pl?: string | number;
  px?: string | number;
  py?: string | number;
  m?: string | number;
  mt?: string | number;
  mr?: string | number;
  mb?: string | number;
  ml?: string | number;
  mx?: string | number;
  my?: string | number;
  w?: string | number;
  h?: string | number;
  minW?: string | number;
  minH?: string | number;
  maxW?: string | number;
  maxH?: string | number;
  bg?: string;
  rounded?: string | number;
  shadow?: string;

  // Responsive/conditional
  _hover?: CSSProperties;
  _focus?: CSSProperties;
  _active?: CSSProperties;
  _disabled?: CSSProperties;
  _dark?: CSSProperties;
  _light?: CSSProperties;
  sm?: CSSProperties;
  md?: CSSProperties;
  lg?: CSSProperties;
  xl?: CSSProperties;
  '2xl'?: CSSProperties;
}

// ============================================================================
// Color System
// ============================================================================

/** PhilJS color palette */
export const philjsColors = {
  // Primary brand colors
  primary: {
    50: { value: '#eff6ff' },
    100: { value: '#dbeafe' },
    200: { value: '#bfdbfe' },
    300: { value: '#93c5fd' },
    400: { value: '#60a5fa' },
    500: { value: '#3b82f6' },
    600: { value: '#2563eb' },
    700: { value: '#1d4ed8' },
    800: { value: '#1e40af' },
    900: { value: '#1e3a8a' },
    950: { value: '#172554' },
  },

  // Secondary/accent colors
  secondary: {
    50: { value: '#f5f3ff' },
    100: { value: '#ede9fe' },
    200: { value: '#ddd6fe' },
    300: { value: '#c4b5fd' },
    400: { value: '#a78bfa' },
    500: { value: '#8b5cf6' },
    600: { value: '#7c3aed' },
    700: { value: '#6d28d9' },
    800: { value: '#5b21b6' },
    900: { value: '#4c1d95' },
    950: { value: '#2e1065' },
  },

  // Accent color
  accent: {
    50: { value: '#ecfeff' },
    100: { value: '#cffafe' },
    200: { value: '#a5f3fc' },
    300: { value: '#67e8f9' },
    400: { value: '#22d3ee' },
    500: { value: '#06b6d4' },
    600: { value: '#0891b2' },
    700: { value: '#0e7490' },
    800: { value: '#155e75' },
    900: { value: '#164e63' },
    950: { value: '#083344' },
  },

  // Success
  success: {
    50: { value: '#f0fdf4' },
    100: { value: '#dcfce7' },
    200: { value: '#bbf7d0' },
    300: { value: '#86efac' },
    400: { value: '#4ade80' },
    500: { value: '#22c55e' },
    600: { value: '#16a34a' },
    700: { value: '#15803d' },
    800: { value: '#166534' },
    900: { value: '#14532d' },
    950: { value: '#052e16' },
  },

  // Warning
  warning: {
    50: { value: '#fffbeb' },
    100: { value: '#fef3c7' },
    200: { value: '#fde68a' },
    300: { value: '#fcd34d' },
    400: { value: '#fbbf24' },
    500: { value: '#f59e0b' },
    600: { value: '#d97706' },
    700: { value: '#b45309' },
    800: { value: '#92400e' },
    900: { value: '#78350f' },
    950: { value: '#451a03' },
  },

  // Error/danger
  error: {
    50: { value: '#fef2f2' },
    100: { value: '#fee2e2' },
    200: { value: '#fecaca' },
    300: { value: '#fca5a5' },
    400: { value: '#f87171' },
    500: { value: '#ef4444' },
    600: { value: '#dc2626' },
    700: { value: '#b91c1c' },
    800: { value: '#991b1b' },
    900: { value: '#7f1d1d' },
    950: { value: '#450a0a' },
  },

  // Neutral/gray
  neutral: {
    50: { value: '#fafafa' },
    100: { value: '#f5f5f5' },
    200: { value: '#e5e5e5' },
    300: { value: '#d4d4d4' },
    400: { value: '#a3a3a3' },
    500: { value: '#737373' },
    600: { value: '#525252' },
    700: { value: '#404040' },
    800: { value: '#262626' },
    900: { value: '#171717' },
    950: { value: '#0a0a0a' },
  },
};

// ============================================================================
// Token System
// ============================================================================

/** PhilJS spacing scale */
export const philjsSpacing = {
  0: { value: '0' },
  0.5: { value: '0.125rem' },
  1: { value: '0.25rem' },
  1.5: { value: '0.375rem' },
  2: { value: '0.5rem' },
  2.5: { value: '0.625rem' },
  3: { value: '0.75rem' },
  3.5: { value: '0.875rem' },
  4: { value: '1rem' },
  5: { value: '1.25rem' },
  6: { value: '1.5rem' },
  7: { value: '1.75rem' },
  8: { value: '2rem' },
  9: { value: '2.25rem' },
  10: { value: '2.5rem' },
  11: { value: '2.75rem' },
  12: { value: '3rem' },
  14: { value: '3.5rem' },
  16: { value: '4rem' },
  20: { value: '5rem' },
  24: { value: '6rem' },
  28: { value: '7rem' },
  32: { value: '8rem' },
  36: { value: '9rem' },
  40: { value: '10rem' },
  44: { value: '11rem' },
  48: { value: '12rem' },
  52: { value: '13rem' },
  56: { value: '14rem' },
  60: { value: '15rem' },
  64: { value: '16rem' },
  72: { value: '18rem' },
  80: { value: '20rem' },
  96: { value: '24rem' },
};

/** PhilJS font sizes */
export const philjsFontSizes = {
  xs: { value: '0.75rem' },
  sm: { value: '0.875rem' },
  md: { value: '1rem' },
  lg: { value: '1.125rem' },
  xl: { value: '1.25rem' },
  '2xl': { value: '1.5rem' },
  '3xl': { value: '1.875rem' },
  '4xl': { value: '2.25rem' },
  '5xl': { value: '3rem' },
  '6xl': { value: '3.75rem' },
  '7xl': { value: '4.5rem' },
  '8xl': { value: '6rem' },
  '9xl': { value: '8rem' },
};

/** PhilJS font weights */
export const philjsFontWeights = {
  hairline: { value: '100' },
  thin: { value: '200' },
  light: { value: '300' },
  normal: { value: '400' },
  medium: { value: '500' },
  semibold: { value: '600' },
  bold: { value: '700' },
  extrabold: { value: '800' },
  black: { value: '900' },
};

/** PhilJS line heights */
export const philjsLineHeights = {
  none: { value: '1' },
  tight: { value: '1.25' },
  snug: { value: '1.375' },
  normal: { value: '1.5' },
  relaxed: { value: '1.625' },
  loose: { value: '2' },
};

/** PhilJS border radii */
export const philjsRadii = {
  none: { value: '0' },
  sm: { value: '0.125rem' },
  md: { value: '0.375rem' },
  lg: { value: '0.5rem' },
  xl: { value: '0.75rem' },
  '2xl': { value: '1rem' },
  '3xl': { value: '1.5rem' },
  full: { value: '9999px' },
};

/** PhilJS shadows */
export const philjsShadows = {
  xs: { value: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
  sm: { value: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
  md: { value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' },
  lg: { value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' },
  xl: { value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' },
  '2xl': { value: '0 25px 50px -12px rgb(0 0 0 / 0.25)' },
  inner: { value: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)' },
  none: { value: 'none' },
};

/** PhilJS durations */
export const philjsDurations = {
  fastest: { value: '50ms' },
  faster: { value: '100ms' },
  fast: { value: '150ms' },
  normal: { value: '200ms' },
  slow: { value: '300ms' },
  slower: { value: '400ms' },
  slowest: { value: '500ms' },
};

/** PhilJS easings */
export const philjsEasings = {
  linear: { value: 'linear' },
  in: { value: 'cubic-bezier(0.4, 0, 1, 1)' },
  out: { value: 'cubic-bezier(0, 0, 0.2, 1)' },
  'in-out': { value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  'ease-in': { value: 'cubic-bezier(0.4, 0, 1, 1)' },
  'ease-out': { value: 'cubic-bezier(0, 0, 0.2, 1)' },
  'ease-in-out': { value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
};

/** PhilJS z-index scale */
export const philjsZIndex = {
  hide: { value: '-1' },
  auto: { value: 'auto' },
  base: { value: '0' },
  docked: { value: '10' },
  dropdown: { value: '1000' },
  sticky: { value: '1100' },
  banner: { value: '1200' },
  overlay: { value: '1300' },
  modal: { value: '1400' },
  popover: { value: '1500' },
  skipLink: { value: '1600' },
  toast: { value: '1700' },
  tooltip: { value: '1800' },
};

/** PhilJS breakpoints */
export const philjsBreakpoints = {
  sm: { value: '640px' },
  md: { value: '768px' },
  lg: { value: '1024px' },
  xl: { value: '1280px' },
  '2xl': { value: '1536px' },
};

// ============================================================================
// Semantic Tokens
// ============================================================================

/** PhilJS semantic tokens */
export const philjsSemanticTokens = {
  colors: {
    // Background
    'bg.canvas': { value: { base: '{colors.white}', _dark: '{colors.neutral.950}' } },
    'bg.default': { value: { base: '{colors.white}', _dark: '{colors.neutral.900}' } },
    'bg.subtle': { value: { base: '{colors.neutral.50}', _dark: '{colors.neutral.800}' } },
    'bg.muted': { value: { base: '{colors.neutral.100}', _dark: '{colors.neutral.700}' } },
    'bg.emphasized': { value: { base: '{colors.neutral.200}', _dark: '{colors.neutral.600}' } },

    // Foreground/Text
    'fg.default': { value: { base: '{colors.neutral.950}', _dark: '{colors.neutral.50}' } },
    'fg.muted': { value: { base: '{colors.neutral.600}', _dark: '{colors.neutral.400}' } },
    'fg.subtle': { value: { base: '{colors.neutral.400}', _dark: '{colors.neutral.500}' } },
    'fg.disabled': { value: { base: '{colors.neutral.300}', _dark: '{colors.neutral.600}' } },

    // Border
    'border.default': { value: { base: '{colors.neutral.200}', _dark: '{colors.neutral.800}' } },
    'border.muted': { value: { base: '{colors.neutral.100}', _dark: '{colors.neutral.900}' } },
    'border.subtle': { value: { base: '{colors.neutral.50}', _dark: '{colors.neutral.950}' } },
    'border.emphasized': { value: { base: '{colors.neutral.300}', _dark: '{colors.neutral.700}' } },

    // Primary semantic
    'colorPalette.50': { value: '{colors.primary.50}' },
    'colorPalette.100': { value: '{colors.primary.100}' },
    'colorPalette.200': { value: '{colors.primary.200}' },
    'colorPalette.300': { value: '{colors.primary.300}' },
    'colorPalette.400': { value: '{colors.primary.400}' },
    'colorPalette.500': { value: '{colors.primary.500}' },
    'colorPalette.600': { value: '{colors.primary.600}' },
    'colorPalette.700': { value: '{colors.primary.700}' },
    'colorPalette.800': { value: '{colors.primary.800}' },
    'colorPalette.900': { value: '{colors.primary.900}' },
  },
  shadows: {
    'shadow.xs': { value: { base: '{shadows.xs}', _dark: '0 1px 2px 0 rgb(0 0 0 / 0.4)' } },
    'shadow.sm': { value: { base: '{shadows.sm}', _dark: '0 1px 3px 0 rgb(0 0 0 / 0.4)' } },
    'shadow.md': { value: { base: '{shadows.md}', _dark: '0 4px 6px -1px rgb(0 0 0 / 0.4)' } },
    'shadow.lg': { value: { base: '{shadows.lg}', _dark: '0 10px 15px -3px rgb(0 0 0 / 0.4)' } },
    'shadow.xl': { value: { base: '{shadows.xl}', _dark: '0 20px 25px -5px rgb(0 0 0 / 0.4)' } },
  },
};

// ============================================================================
// Text Styles
// ============================================================================

/** PhilJS text styles */
export const philjsTextStyles = {
  // Headings
  'heading.xs': {
    fontSize: '{fontSizes.sm}',
    fontWeight: '{fontWeights.semibold}',
    lineHeight: '{lineHeights.tight}',
    letterSpacing: '-0.01em',
  },
  'heading.sm': {
    fontSize: '{fontSizes.md}',
    fontWeight: '{fontWeights.semibold}',
    lineHeight: '{lineHeights.tight}',
    letterSpacing: '-0.01em',
  },
  'heading.md': {
    fontSize: '{fontSizes.lg}',
    fontWeight: '{fontWeights.semibold}',
    lineHeight: '{lineHeights.tight}',
    letterSpacing: '-0.01em',
  },
  'heading.lg': {
    fontSize: '{fontSizes.xl}',
    fontWeight: '{fontWeights.semibold}',
    lineHeight: '{lineHeights.tight}',
    letterSpacing: '-0.02em',
  },
  'heading.xl': {
    fontSize: '{fontSizes.2xl}',
    fontWeight: '{fontWeights.bold}',
    lineHeight: '{lineHeights.tight}',
    letterSpacing: '-0.02em',
  },
  'heading.2xl': {
    fontSize: '{fontSizes.3xl}',
    fontWeight: '{fontWeights.bold}',
    lineHeight: '{lineHeights.tight}',
    letterSpacing: '-0.02em',
  },
  'heading.3xl': {
    fontSize: '{fontSizes.4xl}',
    fontWeight: '{fontWeights.bold}',
    lineHeight: '{lineHeights.none}',
    letterSpacing: '-0.02em',
  },

  // Body text
  'body.xs': {
    fontSize: '{fontSizes.xs}',
    lineHeight: '{lineHeights.normal}',
  },
  'body.sm': {
    fontSize: '{fontSizes.sm}',
    lineHeight: '{lineHeights.normal}',
  },
  'body.md': {
    fontSize: '{fontSizes.md}',
    lineHeight: '{lineHeights.relaxed}',
  },
  'body.lg': {
    fontSize: '{fontSizes.lg}',
    lineHeight: '{lineHeights.relaxed}',
  },

  // Labels
  'label.xs': {
    fontSize: '{fontSizes.xs}',
    fontWeight: '{fontWeights.medium}',
    lineHeight: '{lineHeights.tight}',
  },
  'label.sm': {
    fontSize: '{fontSizes.sm}',
    fontWeight: '{fontWeights.medium}',
    lineHeight: '{lineHeights.tight}',
  },
  'label.md': {
    fontSize: '{fontSizes.md}',
    fontWeight: '{fontWeights.medium}',
    lineHeight: '{lineHeights.tight}',
  },
};

// ============================================================================
// Layer Styles
// ============================================================================

/** PhilJS layer styles */
export const philjsLayerStyles = {
  'container.default': {
    backgroundColor: 'bg.default',
    borderRadius: '{radii.lg}',
    border: '1px solid {colors.border.default}',
  },
  'container.subtle': {
    backgroundColor: 'bg.subtle',
    borderRadius: '{radii.lg}',
  },
  'container.raised': {
    backgroundColor: 'bg.default',
    borderRadius: '{radii.lg}',
    boxShadow: '{shadows.md}',
  },
  'container.overlay': {
    backgroundColor: 'bg.default',
    borderRadius: '{radii.xl}',
    boxShadow: '{shadows.xl}',
  },
};

// ============================================================================
// Component Recipes
// ============================================================================

/** Button recipe */
export const buttonRecipe: RecipeDefinition = {
  className: 'button',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '{radii.md}',
    fontWeight: '{fontWeights.medium}',
    transitionProperty: 'color, background-color, border-color, box-shadow',
    transitionDuration: '{durations.fast}',
    cursor: 'pointer',
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    _focusVisible: {
      outline: '2px solid {colors.primary.500}',
      outlineOffset: '2px',
    },
  },
  variants: {
    variant: {
      solid: {
        backgroundColor: '{colors.primary.500}',
        color: 'white',
        _hover: {
          backgroundColor: '{colors.primary.600}',
        },
        _active: {
          backgroundColor: '{colors.primary.700}',
        },
      },
      outline: {
        backgroundColor: 'transparent',
        border: '1px solid {colors.primary.500}',
        color: '{colors.primary.500}',
        _hover: {
          backgroundColor: '{colors.primary.50}',
        },
        _active: {
          backgroundColor: '{colors.primary.100}',
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '{colors.primary.500}',
        _hover: {
          backgroundColor: '{colors.primary.50}',
        },
        _active: {
          backgroundColor: '{colors.primary.100}',
        },
      },
      link: {
        backgroundColor: 'transparent',
        color: '{colors.primary.500}',
        _hover: {
          textDecoration: 'underline',
        },
      },
    },
    size: {
      xs: {
        height: '{sizes.6}',
        paddingX: '{spacing.2}',
        fontSize: '{fontSizes.xs}',
        gap: '{spacing.1}',
      },
      sm: {
        height: '{sizes.8}',
        paddingX: '{spacing.3}',
        fontSize: '{fontSizes.sm}',
        gap: '{spacing.1.5}',
      },
      md: {
        height: '{sizes.10}',
        paddingX: '{spacing.4}',
        fontSize: '{fontSizes.sm}',
        gap: '{spacing.2}',
      },
      lg: {
        height: '{sizes.12}',
        paddingX: '{spacing.6}',
        fontSize: '{fontSizes.md}',
        gap: '{spacing.2}',
      },
      xl: {
        height: '{sizes.14}',
        paddingX: '{spacing.8}',
        fontSize: '{fontSizes.lg}',
        gap: '{spacing.3}',
      },
    },
  },
  defaultVariants: {
    variant: 'solid',
    size: 'md',
  },
};

/** Input recipe */
export const inputRecipe: RecipeDefinition = {
  className: 'input',
  base: {
    width: '100%',
    display: 'flex',
    borderRadius: '{radii.md}',
    border: '1px solid {colors.border.default}',
    backgroundColor: 'bg.default',
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: '{durations.fast}',
    _placeholder: {
      color: 'fg.subtle',
    },
    _hover: {
      borderColor: '{colors.border.emphasized}',
    },
    _focus: {
      borderColor: '{colors.primary.500}',
      boxShadow: '0 0 0 1px {colors.primary.500}',
      outline: 'none',
    },
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    _invalid: {
      borderColor: '{colors.error.500}',
      _focus: {
        boxShadow: '0 0 0 1px {colors.error.500}',
      },
    },
  },
  variants: {
    size: {
      sm: {
        height: '{sizes.8}',
        paddingX: '{spacing.3}',
        fontSize: '{fontSizes.sm}',
      },
      md: {
        height: '{sizes.10}',
        paddingX: '{spacing.4}',
        fontSize: '{fontSizes.sm}',
      },
      lg: {
        height: '{sizes.12}',
        paddingX: '{spacing.4}',
        fontSize: '{fontSizes.md}',
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
};

/** Card recipe */
export const cardRecipe: RecipeDefinition = {
  className: 'card',
  base: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'bg.default',
    borderRadius: '{radii.lg}',
    overflow: 'hidden',
  },
  variants: {
    variant: {
      elevated: {
        boxShadow: '{shadows.md}',
      },
      outline: {
        border: '1px solid {colors.border.default}',
      },
      filled: {
        backgroundColor: 'bg.subtle',
      },
    },
    size: {
      sm: {
        padding: '{spacing.4}',
      },
      md: {
        padding: '{spacing.6}',
      },
      lg: {
        padding: '{spacing.8}',
      },
    },
  },
  defaultVariants: {
    variant: 'elevated',
    size: 'md',
  },
};

/** Badge recipe */
export const badgeRecipe: RecipeDefinition = {
  className: 'badge',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '{radii.full}',
    fontWeight: '{fontWeights.medium}',
    whiteSpace: 'nowrap',
  },
  variants: {
    variant: {
      solid: {
        backgroundColor: '{colors.primary.500}',
        color: 'white',
      },
      subtle: {
        backgroundColor: '{colors.primary.100}',
        color: '{colors.primary.700}',
      },
      outline: {
        border: '1px solid {colors.primary.500}',
        color: '{colors.primary.500}',
      },
    },
    size: {
      sm: {
        paddingX: '{spacing.2}',
        paddingY: '{spacing.0.5}',
        fontSize: '{fontSizes.xs}',
      },
      md: {
        paddingX: '{spacing.2.5}',
        paddingY: '{spacing.0.5}',
        fontSize: '{fontSizes.sm}',
      },
      lg: {
        paddingX: '{spacing.3}',
        paddingY: '{spacing.1}',
        fontSize: '{fontSizes.sm}',
      },
    },
  },
  defaultVariants: {
    variant: 'solid',
    size: 'md',
  },
};

// ============================================================================
// Patterns
// ============================================================================

/** PhilJS patterns */
export const philjsPatterns: Record<string, PatternDefinition> = {
  // Stack pattern - vertical layout
  stack: {
    description: 'Vertical stack layout',
    properties: {
      gap: { type: 'spacing' },
      direction: { type: 'string', value: 'column' },
      align: { type: 'string' },
      justify: { type: 'string' },
    },
    transform: ({ gap, direction, align, justify }) => ({
      display: 'flex',
      flexDirection: direction || 'column',
      gap,
      alignItems: align,
      justifyContent: justify,
    }),
  },

  // HStack pattern - horizontal layout
  hstack: {
    description: 'Horizontal stack layout',
    properties: {
      gap: { type: 'spacing' },
      align: { type: 'string' },
      justify: { type: 'string' },
      wrap: { type: 'string' },
    },
    transform: ({ gap, align, justify, wrap }) => ({
      display: 'flex',
      flexDirection: 'row',
      gap,
      alignItems: align || 'center',
      justifyContent: justify,
      flexWrap: wrap,
    }),
  },

  // VStack pattern - vertical layout (alias for stack)
  vstack: {
    description: 'Vertical stack layout',
    properties: {
      gap: { type: 'spacing' },
      align: { type: 'string' },
      justify: { type: 'string' },
    },
    transform: ({ gap, align, justify }) => ({
      display: 'flex',
      flexDirection: 'column',
      gap,
      alignItems: align || 'center',
      justifyContent: justify,
    }),
  },

  // Flex pattern
  flex: {
    description: 'Flexible layout',
    properties: {
      direction: { type: 'string' },
      align: { type: 'string' },
      justify: { type: 'string' },
      wrap: { type: 'string' },
      gap: { type: 'spacing' },
      basis: { type: 'string' },
      grow: { type: 'number' },
      shrink: { type: 'number' },
    },
    transform: ({ direction, align, justify, wrap, gap, basis, grow, shrink }) => ({
      display: 'flex',
      flexDirection: direction,
      alignItems: align,
      justifyContent: justify,
      flexWrap: wrap,
      gap,
      flexBasis: basis,
      flexGrow: grow,
      flexShrink: shrink,
    }),
  },

  // Grid pattern
  grid: {
    description: 'Grid layout',
    properties: {
      columns: { type: 'number' },
      rows: { type: 'number' },
      gap: { type: 'spacing' },
      rowGap: { type: 'spacing' },
      columnGap: { type: 'spacing' },
      minChildWidth: { type: 'spacing' },
    },
    transform: ({ columns, rows, gap, rowGap, columnGap, minChildWidth }) => {
      const templateColumns = minChildWidth
        ? `repeat(auto-fit, minmax(${minChildWidth}, 1fr))`
        : columns
          ? `repeat(${columns}, 1fr)`
          : undefined;

      return {
        display: 'grid',
        gridTemplateColumns: templateColumns,
        gridTemplateRows: rows ? `repeat(${rows}, 1fr)` : undefined,
        gap,
        rowGap: rowGap,
        columnGap: columnGap,
      };
    },
  },

  // Center pattern
  center: {
    description: 'Center content',
    properties: {
      inline: { type: 'boolean' },
    },
    transform: ({ inline }) => ({
      display: inline ? 'inline-flex' : 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
  },

  // Container pattern
  container: {
    description: 'Responsive container',
    properties: {
      centerContent: { type: 'boolean' },
    },
    transform: ({ centerContent }) => ({
      width: '100%',
      maxWidth: '1280px',
      marginInline: 'auto',
      paddingInline: '{spacing.4}',
      ...(centerContent && {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }),
    }),
  },

  // Spacer pattern
  spacer: {
    description: 'Flexible spacer',
    properties: {},
    transform: () => ({
      flex: '1',
      alignSelf: 'stretch',
    }),
  },

  // Divider pattern
  divider: {
    description: 'Visual divider',
    properties: {
      orientation: { type: 'string', value: 'horizontal' },
      thickness: { type: 'spacing', value: '1px' },
      color: { type: 'color' },
    },
    transform: ({ orientation, thickness, color }) => {
      const isHorizontal = orientation !== 'vertical';
      return {
        backgroundColor: color || '{colors.border.default}',
        ...(isHorizontal
          ? { height: thickness || '1px', width: '100%' }
          : { width: thickness || '1px', height: '100%' }),
      };
    },
  },

  // Aspect ratio pattern
  aspectRatio: {
    description: 'Maintain aspect ratio',
    properties: {
      ratio: { type: 'number' },
    },
    transform: ({ ratio }) => ({
      position: 'relative',
      '&::before': {
        content: '""',
        display: 'block',
        height: 0,
        paddingBottom: ratio ? `${(1 / ratio) * 100}%` : '100%',
      },
      '& > *': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      },
    }),
  },

  // Visually hidden pattern
  visuallyHidden: {
    description: 'Hide visually but keep accessible',
    properties: {},
    transform: () => ({
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: 0,
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      borderWidth: 0,
    }),
  },

  // Float pattern
  float: {
    description: 'Float element to corner',
    properties: {
      placement: { type: 'string', value: 'top-end' },
      offset: { type: 'spacing' },
    },
    transform: ({ placement, offset }) => {
      const positions: Record<string, Record<string, string>> = {
        'top-start': { top: offset || '0', left: offset || '0' },
        'top-end': { top: offset || '0', right: offset || '0' },
        'bottom-start': { bottom: offset || '0', left: offset || '0' },
        'bottom-end': { bottom: offset || '0', right: offset || '0' },
      };
      return {
        position: 'absolute',
        ...positions[placement || 'top-end'],
      };
    },
  },

  // Circle pattern
  circle: {
    description: 'Circle shape',
    properties: {
      size: { type: 'spacing' },
    },
    transform: ({ size }) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: '9999px',
      flexShrink: 0,
    }),
  },

  // Square pattern
  square: {
    description: 'Square shape',
    properties: {
      size: { type: 'spacing' },
    },
    transform: ({ size }) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      flexShrink: 0,
    }),
  },
};

// ============================================================================
// Conditions
// ============================================================================

/** PhilJS conditions for responsive and state styling */
export const philjsConditions = {
  // Responsive
  sm: '@media (min-width: 640px)',
  md: '@media (min-width: 768px)',
  lg: '@media (min-width: 1024px)',
  xl: '@media (min-width: 1280px)',
  '2xl': '@media (min-width: 1536px)',

  // Reduced motion
  motionSafe: '@media (prefers-reduced-motion: no-preference)',
  motionReduce: '@media (prefers-reduced-motion: reduce)',

  // Color scheme
  light: '[data-theme=light] &, .light &, &.light',
  dark: '[data-theme=dark] &, .dark &, &.dark, @media (prefers-color-scheme: dark)',

  // Print
  print: '@media print',

  // Orientation
  portrait: '@media (orientation: portrait)',
  landscape: '@media (orientation: landscape)',

  // State pseudo-classes
  hover: '&:is(:hover, [data-hover])',
  focus: '&:is(:focus, [data-focus])',
  focusVisible: '&:is(:focus-visible, [data-focus-visible])',
  focusWithin: '&:focus-within',
  active: '&:is(:active, [data-active])',
  disabled: '&:is(:disabled, [disabled], [data-disabled])',
  enabled: '&:enabled',
  checked: '&:is(:checked, [data-checked], [aria-checked=true])',
  indeterminate: '&:is(:indeterminate, [data-indeterminate], [aria-checked=mixed])',
  invalid: '&:is(:invalid, [data-invalid], [aria-invalid=true])',
  valid: '&:is(:valid, [data-valid])',
  required: '&:is(:required, [data-required], [aria-required=true])',
  optional: '&:optional',
  readOnly: '&:is(:read-only, [data-readonly], [aria-readonly=true])',
  empty: '&:empty',

  // Pseudo-elements
  before: '&::before',
  after: '&::after',
  placeholder: '&::placeholder',
  selection: '&::selection',
  firstLetter: '&::first-letter',
  firstLine: '&::first-line',
  marker: '&::marker',

  // Structural pseudo-classes
  first: '&:first-child',
  last: '&:last-child',
  even: '&:nth-child(even)',
  odd: '&:nth-child(odd)',
  only: '&:only-child',
  firstOfType: '&:first-of-type',
  lastOfType: '&:last-of-type',

  // Group states
  groupHover: '.group:hover &, [data-group]:hover &',
  groupFocus: '.group:focus &, [data-group]:focus &',
  groupActive: '.group:active &, [data-group]:active &',
  groupDisabled: '.group:disabled &, [data-group]:disabled &',

  // Peer states
  peerHover: '.peer:hover ~ &, [data-peer]:hover ~ &',
  peerFocus: '.peer:focus ~ &, [data-peer]:focus ~ &',
  peerInvalid: '.peer:invalid ~ &, [data-peer]:invalid ~ &',
  peerChecked: '.peer:checked ~ &, [data-peer]:checked ~ &',

  // RTL/LTR
  ltr: '[dir=ltr] &',
  rtl: '[dir=rtl] &',

  // Misc
  expanded: '&[aria-expanded=true]',
  selected: '&[aria-selected=true]',
  grabbed: '&[aria-grabbed=true]',
  pressed: '&[aria-pressed=true]',
  current: '&[aria-current]',
  hidden: '&[hidden]',
};

// ============================================================================
// Global CSS
// ============================================================================

/** PhilJS global CSS reset and base styles */
export const philjsGlobalCss = {
  '*': {
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'border.default',
  },
  '*, *::before, *::after': {
    boxSizing: 'border-box',
  },
  html: {
    lineHeight: 1.5,
    WebkitTextSizeAdjust: '100%',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    textRendering: 'optimizeLegibility',
  },
  body: {
    lineHeight: 'inherit',
    color: 'fg.default',
    backgroundColor: 'bg.canvas',
  },
  hr: {
    height: 0,
    color: 'inherit',
    borderTopWidth: '1px',
  },
  'h1, h2, h3, h4, h5, h6': {
    fontSize: 'inherit',
    fontWeight: 'inherit',
  },
  a: {
    color: 'inherit',
    textDecoration: 'inherit',
  },
  'b, strong': {
    fontWeight: 'bold',
  },
  'code, kbd, samp, pre': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '1em',
  },
  small: {
    fontSize: '80%',
  },
  'sub, sup': {
    fontSize: '75%',
    lineHeight: 0,
    position: 'relative',
    verticalAlign: 'baseline',
  },
  sub: {
    bottom: '-0.25em',
  },
  sup: {
    top: '-0.5em',
  },
  table: {
    textIndent: 0,
    borderColor: 'inherit',
    borderCollapse: 'collapse',
  },
  'button, input, optgroup, select, textarea': {
    fontFamily: 'inherit',
    fontSize: '100%',
    fontWeight: 'inherit',
    lineHeight: 'inherit',
    color: 'inherit',
    margin: 0,
    padding: 0,
  },
  'button, select': {
    textTransform: 'none',
  },
  'button, [type="button"], [type="reset"], [type="submit"]': {
    WebkitAppearance: 'button',
    backgroundColor: 'transparent',
    backgroundImage: 'none',
  },
  ':-moz-focusring': {
    outline: 'auto',
  },
  ':-moz-ui-invalid': {
    boxShadow: 'none',
  },
  '::-webkit-inner-spin-button, ::-webkit-outer-spin-button': {
    height: 'auto',
  },
  '[type="search"]': {
    WebkitAppearance: 'textfield',
    outlineOffset: '-2px',
  },
  '::-webkit-search-decoration': {
    WebkitAppearance: 'none',
  },
  '::-webkit-file-upload-button': {
    WebkitAppearance: 'button',
    font: 'inherit',
  },
  summary: {
    display: 'list-item',
  },
  'blockquote, dl, dd, h1, h2, h3, h4, h5, h6, hr, figure, p, pre': {
    margin: 0,
  },
  fieldset: {
    margin: 0,
    padding: 0,
  },
  legend: {
    padding: 0,
  },
  'ol, ul, menu': {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  textarea: {
    resize: 'vertical',
  },
  'input::placeholder, textarea::placeholder': {
    opacity: 1,
    color: 'fg.subtle',
  },
  '[role="button"]': {
    cursor: 'pointer',
  },
  ':disabled': {
    cursor: 'default',
  },
  'img, svg, video, canvas, audio, iframe, embed, object': {
    display: 'block',
    verticalAlign: 'middle',
  },
  'img, video': {
    maxWidth: '100%',
    height: 'auto',
  },
  '[hidden]': {
    display: 'none',
  },
};

// ============================================================================
// Complete Preset
// ============================================================================

/** Complete PhilJS preset for Panda CSS */
export const philjsPreset: PresetConfig = {
  name: '@philjs/panda',
  theme: {
    tokens: {
      colors: {
        ...philjsColors,
        white: { value: '#ffffff' },
        black: { value: '#000000' },
        transparent: { value: 'transparent' },
        current: { value: 'currentColor' },
      },
      spacing: philjsSpacing,
      sizes: {
        ...philjsSpacing,
        full: { value: '100%' },
        min: { value: 'min-content' },
        max: { value: 'max-content' },
        fit: { value: 'fit-content' },
        prose: { value: '65ch' },
        xs: { value: '20rem' },
        sm: { value: '24rem' },
        md: { value: '28rem' },
        lg: { value: '32rem' },
        xl: { value: '36rem' },
        '2xl': { value: '42rem' },
        '3xl': { value: '48rem' },
        '4xl': { value: '56rem' },
        '5xl': { value: '64rem' },
        '6xl': { value: '72rem' },
        '7xl': { value: '80rem' },
        '8xl': { value: '90rem' },
      },
      fonts: {
        sans: { value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
        serif: { value: 'Georgia, Cambria, "Times New Roman", Times, serif' },
        mono: { value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' },
      },
      fontSizes: philjsFontSizes,
      fontWeights: philjsFontWeights,
      lineHeights: philjsLineHeights,
      radii: philjsRadii,
      shadows: philjsShadows,
      durations: philjsDurations,
      easings: philjsEasings,
      zIndex: philjsZIndex,
      breakpoints: philjsBreakpoints,
    },
    semanticTokens: philjsSemanticTokens,
    textStyles: philjsTextStyles,
    layerStyles: philjsLayerStyles,
    recipes: {
      button: buttonRecipe,
      input: inputRecipe,
      card: cardRecipe,
      badge: badgeRecipe,
    },
  },
  patterns: philjsPatterns,
  conditions: philjsConditions,
  globalCss: philjsGlobalCss,
};

// ============================================================================
// Runtime Utilities
// ============================================================================

/** CSS property mappings for shorthand tokens */
const tokenMappings: Record<string, string> = {
  p: 'padding',
  pt: 'paddingTop',
  pr: 'paddingRight',
  pb: 'paddingBottom',
  pl: 'paddingLeft',
  px: 'paddingInline',
  py: 'paddingBlock',
  m: 'margin',
  mt: 'marginTop',
  mr: 'marginRight',
  mb: 'marginBottom',
  ml: 'marginLeft',
  mx: 'marginInline',
  my: 'marginBlock',
  w: 'width',
  h: 'height',
  minW: 'minWidth',
  minH: 'minHeight',
  maxW: 'maxWidth',
  maxH: 'maxHeight',
  bg: 'backgroundColor',
  rounded: 'borderRadius',
  shadow: 'boxShadow',
};

/**
 * Resolve token values to CSS values
 */
function resolveTokenValue(value: string | number, tokenType?: string): string {
  if (typeof value === 'number') {
    return tokenType === 'spacing' ? `${value * 0.25}rem` : `${value}`;
  }

  // Check for token references like {spacing.4}
  if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
    // In a real implementation, this would resolve the token
    return value;
  }

  return value;
}

/**
 * Transform style object to CSS
 */
export function transformStyles(styles: CSSProperties): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(styles)) {
    if (value === undefined || value === null) continue;

    // Handle condition keys
    if (key.startsWith('_') || key.match(/^(sm|md|lg|xl|2xl)$/)) {
      result[key] = transformStyles(value as CSSProperties);
      continue;
    }

    // Map shorthand tokens
    const cssKey = tokenMappings[key] || key;
    result[cssKey] = value;
  }

  return result;
}

/**
 * Generate CSS class from styles (runtime utility)
 */
export function css(styles: CSSProperties): string {
  // In a real implementation, this would generate atomic classes
  // For now, return a placeholder
  const transformed = transformStyles(styles);
  const hash = JSON.stringify(transformed).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  return `css-${Math.abs(hash).toString(36)}`;
}

/**
 * Create a class variance authority (CVA) recipe
 */
export function cva<T extends RecipeDefinition>(config: T) {
  return (props: Record<string, string> = {}): string => {
    const { base, variants, defaultVariants } = config;
    const classes: string[] = [];

    // Add base class
    if (config.className) {
      classes.push(config.className);
    }

    // Add base styles
    if (base) {
      classes.push(css(base as CSSProperties));
    }

    // Merge default variants with provided props
    const mergedProps = { ...defaultVariants, ...props };

    // Add variant classes
    if (variants) {
      for (const [variantKey, variantOptions] of Object.entries(variants)) {
        const selectedValue = mergedProps[variantKey];
        if (selectedValue && variantOptions[selectedValue]) {
          classes.push(css(variantOptions[selectedValue] as CSSProperties));
        }
      }
    }

    return classes.join(' ');
  };
}

// ============================================================================
// Signal Integration
// ============================================================================

/**
 * Create a signal-controlled style
 */
export function signalStyle<T extends CSSProperties>(
  getStyles: () => T
): Signal<string> {
  return computed(() => css(getStyles()));
}

/**
 * Create reactive inline styles from signals
 */
export function useSignalStyles(
  styles: Record<string, Signal<string | number> | string | number>
): Signal<Record<string, string | number>> {
  return computed(() => {
    const result: Record<string, string | number> = {};

    for (const [key, value] of Object.entries(styles)) {
      if (typeof value === 'function') {
        result[key] = (value as Signal<string | number>)();
      } else {
        result[key] = value;
      }
    }

    return result;
  });
}

/**
 * Theme signal for dynamic theme switching
 */
export function createThemeSignal<T extends Record<string, any>>(
  initialTheme: T
): {
  theme: Signal<T>;
  setTheme: (theme: Partial<T>) => void;
  resetTheme: () => void;
  getToken: <K extends keyof T>(key: K) => Signal<T[K]>;
} {
  const theme = signal<T>(initialTheme);

  return {
    theme,
    setTheme: (newTheme) => {
      theme.update((t) => ({ ...t, ...newTheme }));
    },
    resetTheme: () => {
      theme.set(initialTheme);
    },
    getToken: <K extends keyof T>(key: K) => {
      return computed(() => theme()[key]);
    },
  };
}

/**
 * Color mode signal for dark/light mode
 */
export function createColorModeSignal(
  initialMode: 'light' | 'dark' | 'system' = 'system'
): {
  colorMode: Signal<'light' | 'dark' | 'system'>;
  resolvedColorMode: Signal<'light' | 'dark'>;
  setColorMode: (mode: 'light' | 'dark' | 'system') => void;
  toggleColorMode: () => void;
} {
  const colorMode = signal<'light' | 'dark' | 'system'>(initialMode);

  const resolvedColorMode = computed(() => {
    const mode = colorMode();
    if (mode !== 'system') return mode;

    // Check system preference
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Sync with document
  effect(() => {
    const resolved = resolvedColorMode();
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    }
  });

  return {
    colorMode,
    resolvedColorMode,
    setColorMode: (mode) => colorMode.set(mode),
    toggleColorMode: () => {
      const current = resolvedColorMode();
      colorMode.set(current === 'light' ? 'dark' : 'light');
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Merge multiple style objects
 */
export function mergeStyles(...styles: (CSSProperties | undefined)[]): CSSProperties {
  return styles.reduce<CSSProperties>((acc, style) => {
    if (!style) return acc;
    return { ...acc, ...style };
  }, {});
}

/**
 * Create responsive style object
 */
export function responsive<T>(
  values: { base?: T; sm?: T; md?: T; lg?: T; xl?: T; '2xl'?: T }
): Record<string, T> {
  const result: Record<string, T> = {};

  if (values.base !== undefined) result[''] = values.base;
  if (values.sm !== undefined) result.sm = values.sm;
  if (values.md !== undefined) result.md = values.md;
  if (values.lg !== undefined) result.lg = values.lg;
  if (values.xl !== undefined) result.xl = values.xl;
  if (values['2xl'] !== undefined) result['2xl'] = values['2xl'];

  return result;
}

/**
 * Create conditional style
 */
export function when(
  condition: boolean | Signal<boolean>,
  trueStyles: CSSProperties,
  falseStyles?: CSSProperties
): CSSProperties {
  const isTrue = typeof condition === 'function' ? condition() : condition;
  return isTrue ? trueStyles : (falseStyles || {});
}

// ============================================================================
// Configuration Helpers
// ============================================================================

/**
 * Define a Panda CSS config with PhilJS preset
 */
export function defineConfig(config: {
  include?: string[];
  exclude?: string[];
  outdir?: string;
  theme?: {
    extend?: Partial<PresetConfig['theme']>;
  };
  presets?: PresetConfig[];
  conditions?: Record<string, string>;
  globalCss?: Record<string, any>;
}): object {
  return {
    ...config,
    presets: [philjsPreset, ...(config.presets || [])],
    conditions: {
      ...philjsConditions,
      ...config.conditions,
    },
    philjs: true,
  };
}

/**
 * Create a custom preset extending PhilJS preset
 */
export function createPreset(
  name: string,
  config: Partial<PresetConfig>
): PresetConfig {
  return {
    name,
    theme: {
      ...philjsPreset.theme,
      ...config.theme,
      extend: {
        ...philjsPreset.theme.extend,
        ...config.theme?.extend,
      },
    },
    patterns: {
      ...philjsPreset.patterns,
      ...config.patterns,
    },
    conditions: {
      ...philjsConditions,
      ...config.conditions,
    },
    globalCss: {
      ...philjsGlobalCss,
      ...config.globalCss,
    },
  };
}

// ============================================================================
// Exports
// ============================================================================

// Legacy export for backwards compatibility
export const pandaPreset = philjsPreset;
