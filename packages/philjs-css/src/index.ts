/**
 * PhilJS CSS - Type-safe CSS-in-TS with zero runtime
 *
 * A compile-time CSS solution that provides:
 * - Full TypeScript type safety for CSS properties
 * - Theme tokens with design system support
 * - Atomic utility classes
 * - Variant system (like Stitches/CVA)
 * - Zero runtime overhead (all CSS extracted at build time)
 */

// Core CSS functionality
export {
  css,
  compose,
  cx,
  globalStyle,
  keyframes,
  styleFactory,
  createStyles,
  extractCSS as extractAllCSS,
  resetStyles,
  styleRegistry
} from './css';

// Theme system
export {
  createTheme,
  getTheme,
  generateThemeCSS,
  createThemeVariant,
  cssVar,
  themeVar,
  createBreakpoints,
  defaultTheme
} from './theme';

// Variants
export {
  variants,
  responsiveVariants,
  recipe,
  booleanVariant,
  dataVariants,
  stateVariants,
  slotVariants
} from './variants';

// Atomic CSS
export {
  generateAtomicClasses,
  createSpacingUtilities,
  createColorUtilities,
  createTypographyUtilities,
  createLayoutUtilities,
  createAtomicSystem,
  extractAtomicCSS,
  resetAtomicRegistry,
  atomicRegistry
} from './atomic';

// Build-time extraction
export {
  extractCSS,
  extractToFile,
  extractCriticalCSS,
  createVitePlugin,
  createRollupPlugin,
  createWebpackPlugin,
  analyzeCSSBundle
} from './extract';

// Types
export type {
  CSSProperties,
  CSSStyleObject,
  Theme,
  ThemeTokens,
  VariantConfig,
  VariantProps,
  CSSResult,
  AtomicConfig,
  ExtractConfig,
  CSSRule,
  StyleSheet,
  ResponsiveValue,
  BundleStats
} from './types';

// Re-export from extract for convenience
export type { BuildPlugin } from './extract';
