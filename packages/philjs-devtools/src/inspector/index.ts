/**
 * PhilJS Visual Component Inspector
 *
 * A comprehensive tool for inspecting component trees, props, state, and styles
 * similar to React DevTools and Vue DevTools
 */

export { ComponentInspector, createInspector, getInspector } from './component-inspector.js';
export { PropsPanel } from './props-panel.js';
export { StatePanel } from './state-panel.js';
export { StylePanel } from './style-panel.js';
export { PerformancePanel } from './performance-panel.js';
export { ElementHighlighter } from './element-highlighter.js';
export { SearchBar } from './search-bar.js';

export type {
  InspectorConfig,
  ComponentNode,
  PropInfo,
  StateInfo,
  StyleInfo,
  PerformanceInfo,
  InspectorEvent
} from './types.js';
