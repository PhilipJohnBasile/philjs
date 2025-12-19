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

// Core inspector
export { initInspector, getInspector } from './inspector.js';
export type { InspectorConfig, InspectorShortcuts, InspectorState } from './inspector.js';

// Component info
export {
  extractComponentInfo,
  getComponentById,
  getComponentByElement,
  updateComponentMetrics,
  getAllComponents,
  searchComponents,
  clearComponentRegistry,
  registerSignal,
  getSignalInfo,
  formatPropValue,
  getComponentAncestors,
  getComponentChildren,
} from './component-info.js';
export type { ComponentInfo, SignalInfo, SourceLocation } from './component-info.js';

// Overlay
export {
  initOverlay,
  destroyOverlay,
  getOverlayRoot,
  highlightElement,
  highlightElementHover,
  removeHighlight,
  removeHoverHighlight,
  updateHighlightPosition,
  getCurrentHighlightedElement,
  flashHighlight,
  showElementMeasurements,
} from './overlay.js';
export type { HighlightOptions } from './overlay.js';

// Tooltip
export {
  showTooltip,
  hideTooltip,
  updateTooltip,
  isTooltipVisible,
  getCurrentTooltipComponent,
} from './tooltip.js';

// Keyboard
export {
  registerShortcut,
  unregisterShortcut,
  startKeyboardListening,
  stopKeyboardListening,
  getAllShortcuts,
  clearAllShortcuts,
  formatShortcut,
  matchesShortcut,
  ComponentNavigator,
} from './keyboard.js';
export type { KeyboardHandler, KeyboardShortcut } from './keyboard.js';

// Search
export {
  showSearchBox,
  hideSearchBox,
  isSearchBoxVisible,
  filterComponents,
  getSearchStats,
} from './search.js';

// Styles
export { INSPECTOR_STYLES, styleToCss, applyStyles } from './styles.js';

// Auto-initialize in browser
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Only auto-initialize in development
  if (
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1') &&
    !(window as any).__PHILJS_PROD__
  ) {
    // Don't auto-init in production unless explicitly enabled
  } else {
    // Auto-init in development
    import('./inspector.js').then(({ initInspector }) => {
      initInspector();
    });
  }
}
