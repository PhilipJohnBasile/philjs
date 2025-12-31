/**
 * PhilJS Inspector - Visual Component Inspector
 *
 * In-page visual inspector for PhilJS components with React DevTools-like overlay
 *
 * Features:
 * - Hover highlighting with bounding box
 * - Component name overlay
 * - Props and signal values display
 * - Click to select and pin details
 * - Component hierarchy breadcrumb
 * - Performance metrics (render count, timing)
 * - Source location links
 * - Keyboard navigation
 * - Component search (Ctrl+F)
 *
 * @example
 * ```ts
 * import { initInspector } from 'philjs-inspector';
 *
 * // Initialize (automatically attaches to window)
 * initInspector();
 *
 * // Enable inspector
 * window.__PHILJS_INSPECTOR__.enable();
 *
 * // Or toggle with keyboard: Ctrl+Shift+I
 * ```
 */
export { initInspector, getInspector } from './inspector.js';
export type { InspectorConfig, InspectorShortcuts, InspectorState } from './inspector.js';
export { extractComponentInfo, getComponentById, getComponentByElement, updateComponentMetrics, getAllComponents, searchComponents, clearComponentRegistry, registerSignal, getSignalInfo, formatPropValue, getComponentAncestors, getComponentChildren, } from './component-info.js';
export type { ComponentInfo, SignalInfo, SourceLocation } from './component-info.js';
export { initOverlay, destroyOverlay, getOverlayRoot, highlightElement, highlightElementHover, removeHighlight, removeHoverHighlight, updateHighlightPosition, getCurrentHighlightedElement, flashHighlight, showElementMeasurements, } from './overlay.js';
export type { HighlightOptions } from './overlay.js';
export { showTooltip, hideTooltip, updateTooltip, isTooltipVisible, getCurrentTooltipComponent, } from './tooltip.js';
export { registerShortcut, unregisterShortcut, startKeyboardListening, stopKeyboardListening, getAllShortcuts, clearAllShortcuts, formatShortcut, matchesShortcut, ComponentNavigator, } from './keyboard.js';
export type { KeyboardHandler, KeyboardShortcut } from './keyboard.js';
export { showSearchBox, hideSearchBox, isSearchBoxVisible, filterComponents, getSearchStats, } from './search.js';
export { INSPECTOR_STYLES, styleToCss, applyStyles } from './styles.js';
//# sourceMappingURL=index.d.ts.map