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
export { css, compose, cx, globalStyle, keyframes, styleFactory, createStyles, extractCSS as extractAllCSS, resetStyles, styleRegistry } from './css.js';
export { createTheme, getTheme, generateThemeCSS, createThemeVariant, cssVar, themeVar, createBreakpoints, defaultTheme } from './theme.js';
export { variants, responsiveVariants, recipe, booleanVariant, dataVariants, stateVariants, slotVariants } from './variants.js';
export { generateAtomicClasses, createSpacingUtilities, createColorUtilities, createTypographyUtilities, createLayoutUtilities, createAtomicSystem, extractAtomicCSS, resetAtomicRegistry, atomicRegistry } from './atomic.js';
export { extractCSS, extractToFile, extractCriticalCSS, createVitePlugin, createRollupPlugin, createWebpackPlugin, analyzeCSSBundle } from './extract.js';
export { hydrateStyles, getSSRStyles, getCriticalSSRStyles, injectStyle, removeStyle, clearStyles, createDynamicStyle, createReactiveStyle, applyTheme, createThemeToggle, syncWithSystemTheme, setCSSVariable, getCSSVariable, removeCSSVariable, setCSSVariables, batchStyleUpdates, prefetchStyles, getStyleDebugInfo } from './runtime.js';
export { extractUsageFromFiles, extractUsageFromHTML, extractUsageFromJSX, purgeUnusedCSS, deduplicateCSS, atomicDeduplication, extractCriticalCSS as extractCriticalCSSFromFull, splitCSSByRoute, generateSourceMap, generateOptimizationReport, optimizeCSS } from './compiler.js';
export { createContainer, containerQuery, cq, defineLayers, layer, defaultLayerOrder, generateLayeredStylesheet, scopedStyles, componentScope, processNesting, viewTransition, startViewTransition, viewTransitionPresets, scrollTimeline, viewTimeline, scrollAnimation, createAnchor, anchorPosition, positionFallback, colorMix, relativeColor, lightDark, supportsCSS, cssFeatures, featureDetectionCSS } from './advanced.js';
export type { CSSProperties, CSSStyleObject, Theme, ThemeTokens, VariantConfig, VariantProps, CSSResult, AtomicConfig, ExtractConfig, CSSRule, StyleSheet, ResponsiveValue } from './types.js';
export type { ContainerConfig, ContainerQuery, LayerName, ScopeConfig, ViewTransitionConfig, ScrollTimelineConfig, ViewTimelineConfig, AnchorConfig, AnchorPositionConfig } from './advanced.js';
export { springPresets, calculateSpring, springAnimation, springEasing, slide, fade, scale, rotate, bounce, shake, pulse, flip, swing, wobble, rubberBand, calculateStagger, staggerAnimation, sequence, parallel, captureState, playFLIP, batchFLIP, motionPresets, easings, reducedMotionStyles, prefersReducedMotion, motionSafe, generateAllKeyframes, generateAnimationUtilities, } from './animations.js';
export type { SpringConfig, AnimationTimeline, Keyframe, MotionConfig, StaggerConfig, OrchestrationConfig, FLIPState, } from './animations.js';
export type { BuildPlugin, BundleStats } from './extract.js';
export { attachGestures, swipeableStyles, draggableStyles, zoomableStyles, pullToRefreshStyles, createGestureAnimation, swipeToDismiss, pullToRefresh, createCarousel, gesturePresets, directionVectors, } from './gestures.js';
export type { Point, GestureState, Direction, GestureType, GestureEvent, SwipeEvent, PinchEvent, RotateEvent, PanEvent, GestureConfig, SwipeConfig, PinchConfig, PanConfig, TapConfig, LongPressConfig, RotateConfig, GestureHandler, GestureHandlers, } from './gestures.js';
//# sourceMappingURL=index.d.ts.map