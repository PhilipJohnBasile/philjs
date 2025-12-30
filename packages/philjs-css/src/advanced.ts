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

import type { CSSProperties, CSSStyleObject } from './types.js';

// =============================================================================
// Container Queries
// =============================================================================

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
export function createContainer(name: string, type: ContainerConfig['type'] = 'inline-size'): CSSStyleObject {
  return {
    containerName: name,
    containerType: type,
  } as CSSStyleObject;
}

/**
 * Create container query styles
 */
export function containerQuery(
  query: ContainerQuery,
  styles: CSSStyleObject
): string {
  const conditions: string[] = [];

  if (query.minWidth) conditions.push(`(min-width: ${query.minWidth})`);
  if (query.maxWidth) conditions.push(`(max-width: ${query.maxWidth})`);
  if (query.minHeight) conditions.push(`(min-height: ${query.minHeight})`);
  if (query.maxHeight) conditions.push(`(max-height: ${query.maxHeight})`);
  if (query.orientation) conditions.push(`(orientation: ${query.orientation})`);

  const conditionStr = conditions.join(' and ');
  const containerRef = query.container ? `${query.container} ` : '';

  return `@container ${containerRef}${conditionStr} { ${styleObjectToCSS(styles)} }`;
}

/**
 * Container query responsive styles
 */
export function cq(breakpoints: {
  sm?: CSSStyleObject;
  md?: CSSStyleObject;
  lg?: CSSStyleObject;
  xl?: CSSStyleObject;
}): string[] {
  const queries: string[] = [];

  if (breakpoints.sm) {
    queries.push(containerQuery({ container: '', minWidth: '320px' }, breakpoints.sm));
  }
  if (breakpoints.md) {
    queries.push(containerQuery({ container: '', minWidth: '640px' }, breakpoints.md));
  }
  if (breakpoints.lg) {
    queries.push(containerQuery({ container: '', minWidth: '1024px' }, breakpoints.lg));
  }
  if (breakpoints.xl) {
    queries.push(containerQuery({ container: '', minWidth: '1280px' }, breakpoints.xl));
  }

  return queries;
}

// =============================================================================
// CSS Layers
// =============================================================================

export type LayerName = 'reset' | 'base' | 'tokens' | 'components' | 'utilities' | 'overrides' | string;

/**
 * Define CSS layer order
 */
export function defineLayers(order: LayerName[]): string {
  return `@layer ${order.join(', ')};`;
}

/**
 * Create styles within a specific layer
 */
export function layer(name: LayerName, css: string): string {
  return `@layer ${name} { ${css} }`;
}

/**
 * Default layer configuration for PhilJS
 */
export const defaultLayerOrder: LayerName[] = [
  'reset',
  'base',
  'tokens',
  'components',
  'utilities',
  'overrides',
];

/**
 * Generate layer-aware stylesheet
 */
export function generateLayeredStylesheet(layers: Record<LayerName, string>): string {
  const order = Object.keys(layers);
  let output = defineLayers(order) + '\n\n';

  for (const [name, css] of Object.entries(layers)) {
    if (css.trim()) {
      output += layer(name, css) + '\n\n';
    }
  }

  return output;
}

// =============================================================================
// Scoped Styles
// =============================================================================

export interface ScopeConfig {
  root: string;
  limit?: string;
}

/**
 * Create scoped styles
 */
export function scopedStyles(scope: ScopeConfig, styles: string): string {
  const limitClause = scope.limit ? ` to (${scope.limit})` : '';
  return `@scope (${scope.root})${limitClause} { ${styles} }`;
}

/**
 * Create component-scoped styles with auto-generated scope
 */
export function componentScope(componentId: string, styles: CSSStyleObject): {
  scopeId: string;
  css: string;
  scopeAttribute: string;
} {
  const scopeId = `philjs-${componentId}-${Math.random().toString(36).slice(2, 8)}`;
  const scopeAttribute = `data-scope="${scopeId}"`;
  const css = scopedStyles(
    { root: `[data-scope="${scopeId}"]` },
    styleObjectToCSS(styles)
  );

  return { scopeId, css, scopeAttribute };
}

// =============================================================================
// CSS Nesting
// =============================================================================

/**
 * Process nested CSS object into flat CSS
 */
export function processNesting(selector: string, styles: Record<string, unknown>): string {
  let css = '';
  const rootProps: string[] = [];

  for (const [key, value] of Object.entries(styles)) {
    if (key.startsWith('&') || key.startsWith(':') || key.startsWith('@')) {
      // Nested selector
      if (key.startsWith('@')) {
        css += `${key} { ${selector} { ${processNestedValue(value as Record<string, unknown>)} } }\n`;
      } else {
        const nestedSelector = key.startsWith('&')
          ? selector + key.slice(1)
          : selector + key;
        css += `${nestedSelector} { ${processNestedValue(value as Record<string, unknown>)} }\n`;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Nested element
      css += processNesting(`${selector} ${key}`, value as Record<string, unknown>);
    } else {
      // Regular property
      rootProps.push(`${camelToKebab(key)}: ${value};`);
    }
  }

  if (rootProps.length > 0) {
    css = `${selector} { ${rootProps.join(' ')} }\n` + css;
  }

  return css;
}

function processNestedValue(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .filter(([_, v]) => typeof v !== 'object')
    .map(([k, v]) => `${camelToKebab(k)}: ${v};`)
    .join(' ');
}

// =============================================================================
// View Transitions
// =============================================================================

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
export function viewTransition(config: ViewTransitionConfig): string {
  let css = '';

  // View transition name
  css += `.${config.name} { view-transition-name: ${config.name}; }\n`;

  // Old view styles
  if (config.oldStyles) {
    css += `::view-transition-old(${config.name}) { ${styleObjectToCSS(config.oldStyles)} }\n`;
  }

  // New view styles
  if (config.newStyles) {
    css += `::view-transition-new(${config.name}) { ${styleObjectToCSS(config.newStyles)} }\n`;
  }

  // Group styles
  if (config.groupStyles) {
    css += `::view-transition-group(${config.name}) { ${styleObjectToCSS(config.groupStyles)} }\n`;
  }

  // Image pair styles
  if (config.imagePairStyles) {
    css += `::view-transition-image-pair(${config.name}) { ${styleObjectToCSS(config.imagePairStyles)} }\n`;
  }

  return css;
}

/**
 * Trigger a view transition
 */
export async function startViewTransition(
  updateCallback: () => void | Promise<void>
): Promise<void> {
  if (typeof document !== 'undefined' && 'startViewTransition' in document) {
    await (document as any).startViewTransition(updateCallback).finished;
  } else {
    await updateCallback();
  }
}

/**
 * Common view transition presets
 */
export const viewTransitionPresets = {
  fade: viewTransition({
    name: 'fade',
    oldStyles: { animation: 'fade-out 0.3s ease-out forwards' },
    newStyles: { animation: 'fade-in 0.3s ease-in forwards' },
  }),

  slideLeft: viewTransition({
    name: 'slide-left',
    oldStyles: { animation: 'slide-out-left 0.3s ease-out forwards' },
    newStyles: { animation: 'slide-in-left 0.3s ease-in forwards' },
  }),

  slideUp: viewTransition({
    name: 'slide-up',
    oldStyles: { animation: 'slide-out-up 0.3s ease-out forwards' },
    newStyles: { animation: 'slide-in-up 0.3s ease-in forwards' },
  }),

  scale: viewTransition({
    name: 'scale',
    oldStyles: { animation: 'scale-out 0.3s ease-out forwards' },
    newStyles: { animation: 'scale-in 0.3s ease-in forwards' },
  }),
};

// =============================================================================
// Scroll-Driven Animations
// =============================================================================

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
export function scrollTimeline(config: ScrollTimelineConfig): string {
  const props: string[] = [];

  if (config.source) props.push(`source: ${config.source}`);
  if (config.axis) props.push(`axis: ${config.axis}`);
  if (config.scrollOffsets) props.push(`scroll-offsets: ${config.scrollOffsets}`);

  return `@scroll-timeline ${config.name} { ${props.join('; ')}; }`;
}

/**
 * Create view timeline
 */
export function viewTimeline(config: ViewTimelineConfig): string {
  const props: string[] = [];

  if (config.subject) props.push(`subject: ${config.subject}`);
  if (config.axis) props.push(`axis: ${config.axis}`);
  if (config.inset) props.push(`inset: ${config.inset}`);

  return `@view-timeline ${config.name} { ${props.join('; ')}; }`;
}

/**
 * Apply scroll-driven animation to element
 */
export function scrollAnimation(config: {
  animation: string;
  timeline: string;
  range?: string;
}): CSSStyleObject {
  return {
    animation: config.animation,
    animationTimeline: config.timeline,
    animationRange: config.range,
  } as CSSStyleObject;
}

// =============================================================================
// CSS Anchor Positioning
// =============================================================================

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
export function createAnchor(name: string): CSSStyleObject {
  return {
    anchorName: `--${name}`,
  } as CSSStyleObject;
}

/**
 * Position element relative to anchor
 */
export function anchorPosition(config: AnchorPositionConfig): CSSStyleObject {
  const styles: any = {
    positionAnchor: `--${config.anchor}`,
  };

  if (config.position) {
    switch (config.position) {
      case 'top':
        styles.bottom = `anchor(top)`;
        styles.left = `anchor(center)`;
        styles.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        styles.top = `anchor(bottom)`;
        styles.left = `anchor(center)`;
        styles.transform = 'translateX(-50%)';
        break;
      case 'left':
        styles.right = `anchor(left)`;
        styles.top = `anchor(center)`;
        styles.transform = 'translateY(-50%)';
        break;
      case 'right':
        styles.left = `anchor(right)`;
        styles.top = `anchor(center)`;
        styles.transform = 'translateY(-50%)';
        break;
      case 'center':
        styles.left = `anchor(center)`;
        styles.top = `anchor(center)`;
        styles.transform = 'translate(-50%, -50%)';
        break;
    }
  }

  if (config.fallback) {
    styles.positionFallback = config.fallback;
  }

  return styles as CSSStyleObject;
}

/**
 * Create position fallback
 */
export function positionFallback(name: string, positions: CSSStyleObject[]): string {
  const tries = positions.map((pos, i) =>
    `@try { ${styleObjectToCSS(pos)} }`
  ).join('\n  ');

  return `@position-fallback --${name} {\n  ${tries}\n}`;
}

// =============================================================================
// CSS Color Functions
// =============================================================================

/**
 * Create color-mix expression
 */
export function colorMix(
  color1: string,
  color2: string,
  percentage: number = 50,
  colorSpace: 'srgb' | 'lab' | 'lch' | 'oklch' | 'oklab' = 'oklch'
): string {
  return `color-mix(in ${colorSpace}, ${color1} ${percentage}%, ${color2})`;
}

/**
 * Create relative color
 */
export function relativeColor(
  base: string,
  adjustments: { l?: string; c?: string; h?: string; a?: string }
): string {
  const { l = 'l', c = 'c', h = 'h', a = 'alpha' } = adjustments;
  return `oklch(from ${base} ${l} ${c} ${h} / ${a})`;
}

/**
 * Light-dark color function
 */
export function lightDark(lightColor: string, darkColor: string): string {
  return `light-dark(${lightColor}, ${darkColor})`;
}

// =============================================================================
// Utilities
// =============================================================================

function styleObjectToCSS(obj: CSSStyleObject): string {
  return Object.entries(obj)
    .map(([key, value]) => `${camelToKebab(key)}: ${value};`)
    .join(' ');
}

function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

// =============================================================================
// Feature Detection
// =============================================================================

/**
 * Check for CSS feature support
 */
export function supportsCSS(feature: string): boolean {
  if (typeof CSS === 'undefined') return false;
  return CSS.supports(feature);
}

/**
 * Check for specific feature support
 */
export const cssFeatures = {
  containerQueries: () => supportsCSS('container-type: inline-size'),
  layers: () => supportsCSS('@layer test {}'),
  nesting: () => supportsCSS('selector(&)'),
  viewTransitions: () => typeof document !== 'undefined' && 'startViewTransition' in document,
  scrollTimeline: () => supportsCSS('animation-timeline: scroll()'),
  anchorPositioning: () => supportsCSS('anchor-name: --test'),
  colorMix: () => supportsCSS('color: color-mix(in srgb, red, blue)'),
  oklch: () => supportsCSS('color: oklch(50% 0.1 180)'),
  has: () => supportsCSS(':has(*)'),
  subgrid: () => supportsCSS('grid-template-columns: subgrid'),
};

/**
 * Generate feature detection CSS
 */
export function featureDetectionCSS(): string {
  return `
@supports (container-type: inline-size) {
  :root { --philjs-has-container-queries: 1; }
}
@supports selector(:has(*)) {
  :root { --philjs-has-has-selector: 1; }
}
@supports (color: oklch(50% 0.1 180)) {
  :root { --philjs-has-oklch: 1; }
}
@supports (view-transition-name: test) {
  :root { --philjs-has-view-transitions: 1; }
}
`;
}
