/**
 * Advanced CSS Features for PhilJS CSS
 *
 * Next-generation CSS capabilities:
 * - Container Queries
 * - CSS Layers (@layer)
 * - Scoped Styles
 * - CSS Nesting
 * - View Transitions
 * - Scroll-driven Animations
 * - CSS Anchor Positioning
 */
import type { CSSStyleObject } from './types.js';
export interface ContainerConfig {
    name: string;
    type?: 'inline-size' | 'size' | 'normal';
}
export interface ContainerQuery {
    container: string;
    minWidth?: string;
    maxWidth?: string;
    minHeight?: string;
    maxHeight?: string;
    orientation?: 'portrait' | 'landscape';
}
/**
 * Create a container context
 */
export declare function createContainer(name: string, type?: ContainerConfig['type']): CSSStyleObject;
/**
 * Create container query styles
 */
export declare function containerQuery(query: ContainerQuery, styles: CSSStyleObject): string;
/**
 * Container query responsive styles
 */
export declare function cq(breakpoints: {
    sm?: CSSStyleObject;
    md?: CSSStyleObject;
    lg?: CSSStyleObject;
    xl?: CSSStyleObject;
}): string[];
export type LayerName = 'reset' | 'base' | 'tokens' | 'components' | 'utilities' | 'overrides' | string;
/**
 * Define CSS layer order
 */
export declare function defineLayers(order: LayerName[]): string;
/**
 * Create styles within a specific layer
 */
export declare function layer(name: LayerName, css: string): string;
/**
 * Default layer configuration for PhilJS
 */
export declare const defaultLayerOrder: LayerName[];
/**
 * Generate layer-aware stylesheet
 */
export declare function generateLayeredStylesheet(layers: Record<LayerName, string>): string;
export interface ScopeConfig {
    root: string;
    limit?: string;
}
/**
 * Create scoped styles
 */
export declare function scopedStyles(scope: ScopeConfig, styles: string): string;
/**
 * Create component-scoped styles with auto-generated scope
 */
export declare function componentScope(componentId: string, styles: CSSStyleObject): {
    scopeId: string;
    css: string;
    scopeAttribute: string;
};
/**
 * Process nested CSS object into flat CSS
 */
export declare function processNesting(selector: string, styles: Record<string, unknown>): string;
export interface ViewTransitionConfig {
    name: string;
    oldStyles?: CSSStyleObject;
    newStyles?: CSSStyleObject;
    groupStyles?: CSSStyleObject;
    imagePairStyles?: CSSStyleObject;
}
/**
 * Create view transition styles
 */
export declare function viewTransition(config: ViewTransitionConfig): string;
/**
 * Trigger a view transition
 */
export declare function startViewTransition(updateCallback: () => void | Promise<void>): Promise<void>;
/**
 * Common view transition presets
 */
export declare const viewTransitionPresets: {
    fade: string;
    slideLeft: string;
    slideUp: string;
    scale: string;
};
export interface ScrollTimelineConfig {
    name: string;
    source?: 'nearest' | 'root' | 'self' | string;
    axis?: 'block' | 'inline' | 'y' | 'x';
    scrollOffsets?: string;
}
export interface ViewTimelineConfig {
    name: string;
    subject?: string;
    axis?: 'block' | 'inline' | 'y' | 'x';
    inset?: string;
}
/**
 * Create scroll timeline
 */
export declare function scrollTimeline(config: ScrollTimelineConfig): string;
/**
 * Create view timeline
 */
export declare function viewTimeline(config: ViewTimelineConfig): string;
/**
 * Apply scroll-driven animation to element
 */
export declare function scrollAnimation(config: {
    animation: string;
    timeline: string;
    range?: string;
}): CSSStyleObject;
export interface AnchorConfig {
    name: string;
}
export interface AnchorPositionConfig {
    anchor: string;
    position?: 'top' | 'right' | 'bottom' | 'left' | 'center';
    fallback?: string;
}
/**
 * Create anchor element styles
 */
export declare function createAnchor(name: string): CSSStyleObject;
/**
 * Position element relative to anchor
 */
export declare function anchorPosition(config: AnchorPositionConfig): CSSStyleObject;
/**
 * Create position fallback
 */
export declare function positionFallback(name: string, positions: CSSStyleObject[]): string;
/**
 * Create color-mix expression
 */
export declare function colorMix(color1: string, color2: string, percentage?: number, colorSpace?: 'srgb' | 'lab' | 'lch' | 'oklch' | 'oklab'): string;
/**
 * Create relative color
 */
export declare function relativeColor(base: string, adjustments: {
    l?: string;
    c?: string;
    h?: string;
    a?: string;
}): string;
/**
 * Light-dark color function
 */
export declare function lightDark(lightColor: string, darkColor: string): string;
/**
 * Check for CSS feature support
 */
export declare function supportsCSS(feature: string): boolean;
/**
 * Check for specific feature support
 */
export declare const cssFeatures: {
    containerQueries: () => boolean;
    layers: () => boolean;
    nesting: () => boolean;
    viewTransitions: () => boolean;
    scrollTimeline: () => boolean;
    anchorPositioning: () => boolean;
    colorMix: () => boolean;
    oklch: () => boolean;
    has: () => boolean;
    subgrid: () => boolean;
};
/**
 * Generate feature detection CSS
 */
export declare function featureDetectionCSS(): string;
//# sourceMappingURL=advanced.d.ts.map