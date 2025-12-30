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
} from './css.js';

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
} from './theme.js';

// Variants
export {
  variants,
  responsiveVariants,
  recipe,
  booleanVariant,
  dataVariants,
  stateVariants,
  slotVariants
} from './variants.js';

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
} from './atomic.js';

// Build-time extraction
export {
  extractCSS,
  extractToFile,
  extractCriticalCSS,
  createVitePlugin,
  createRollupPlugin,
  createWebpackPlugin,
  analyzeCSSBundle
} from './extract.js';

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
} from './runtime.js';

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
} from './compiler.js';

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
} from './advanced.js';

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
} from './types.js';

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
} from './advanced.js';

// Animation System
export {
  // Spring physics
  springPresets,
  calculateSpring,
  springAnimation,
  springEasing,
  // Keyframe generators
  slide,
  fade,
  scale,
  rotate,
  bounce,
  shake,
  pulse,
  flip,
  swing,
  wobble,
  rubberBand,
  // Orchestration
  calculateStagger,
  staggerAnimation,
  sequence,
  parallel,
  // FLIP technique
  captureState,
  playFLIP,
  batchFLIP,
  // Presets
  motionPresets,
  easings,
  // Reduced motion
  reducedMotionStyles,
  prefersReducedMotion,
  motionSafe,
  // Generators
  generateAllKeyframes,
  generateAnimationUtilities,
} from './animations.js';

export type {
  SpringConfig,
  AnimationTimeline,
  Keyframe,
  MotionConfig,
  StaggerConfig,
  OrchestrationConfig,
  FLIPState,
} from './animations.js';

// Re-export from extract for convenience
export type { BuildPlugin, BundleStats } from './extract.js';

// Gesture System
export {
  attachGestures,
  swipeableStyles,
  draggableStyles,
  zoomableStyles,
  pullToRefreshStyles,
  createGestureAnimation,
  swipeToDismiss,
  pullToRefresh,
  createCarousel,
  gesturePresets,
  directionVectors,
} from './gestures.js';

export type {
  Point,
  GestureState,
  Direction,
  GestureType,
  GestureEvent,
  SwipeEvent,
  PinchEvent,
  RotateEvent,
  PanEvent,
  GestureConfig,
  SwipeConfig,
  PinchConfig,
  PanConfig,
  TapConfig,
  LongPressConfig,
  RotateConfig,
  GestureHandler,
  GestureHandlers,
} from './gestures.js';
