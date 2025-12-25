/**
 * PhilJS CSS - Type-safe CSS-in-TS with zero runtime
 *
 * A compile-time CSS solution that provides:
 * - Full TypeScript type safety for CSS properties
 * - Theme tokens with design system support
 * - Atomic utility classes
 * - Variant system (like Stitches/CVA)
 * - Zero runtime overhead (all CSS extracted at build time)
 * - SSR hydration and runtime style injection
 * - Compile-time optimizations (purging, deduplication, atomic extraction)
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

// Runtime utilities (SSR hydration, dynamic styles)
export {
  hydrateStyles,
  getSSRStyles,
  getCriticalSSRStyles,
  injectStyle,
  removeStyle,
  clearStyles,
  createDynamicStyle,
  createReactiveStyle,
  applyTheme,
  createThemeToggle,
  syncWithSystemTheme,
  setCSSVariable,
  getCSSVariable,
  removeCSSVariable,
  setCSSVariables,
  batchStyleUpdates,
  prefetchStyles,
  getStyleDebugInfo
} from './runtime';

// Compiler utilities (build-time optimization)
export {
  extractUsageFromFiles,
  extractUsageFromHTML,
  extractUsageFromJSX,
  purgeUnusedCSS,
  deduplicateCSS,
  atomicDeduplication,
  extractCriticalCSS as extractCriticalCSSFromFull,
  splitCSSByRoute,
  generateSourceMap,
  generateOptimizationReport,
  optimizeCSS
} from './compiler';

// Advanced CSS features (next-gen CSS)
export {
  // Container Queries
  createContainer,
  containerQuery,
  cq,
  // CSS Layers
  defineLayers,
  layer,
  defaultLayerOrder,
  generateLayeredStylesheet,
  // Scoped Styles
  scopedStyles,
  componentScope,
  // CSS Nesting
  processNesting,
  // View Transitions
  viewTransition,
  startViewTransition,
  viewTransitionPresets,
  // Scroll-driven Animations
  scrollTimeline,
  viewTimeline,
  scrollAnimation,
  // CSS Anchor Positioning
  createAnchor,
  anchorPosition,
  positionFallback,
  // CSS Color Functions
  colorMix,
  relativeColor,
  lightDark,
  // Feature Detection
  supportsCSS,
  cssFeatures,
  featureDetectionCSS
} from './advanced';

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
  ResponsiveValue
} from './types';

// Advanced types
export type {
  ContainerConfig,
  ContainerQuery,
  LayerName,
  ScopeConfig,
  ViewTransitionConfig,
  ScrollTimelineConfig,
  ViewTimelineConfig,
  AnchorConfig,
  AnchorPositionConfig
} from './advanced';

// Re-export from extract for convenience
export type { BuildPlugin, BundleStats } from './extract';
