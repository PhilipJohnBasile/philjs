/**
 * PhilJS Visual Component Inspector
 *
 * A comprehensive tool for inspecting component trees, props, state, and styles
 * similar to React DevTools and Vue DevTools
 */

export { ComponentInspector, createInspector, getInspector } from './component-inspector';
export { PropsPanel } from './props-panel';
export { StatePanel } from './state-panel';
export { StylePanel } from './style-panel';
export { PerformancePanel } from './performance-panel';
export { ElementHighlighter } from './element-highlighter';
export { SearchBar } from './search-bar';

// New panels
export { HooksPanel, createHooksPanel } from './hooks-panel';
export { ProfilerPanel, createProfilerPanel } from './profiler-panel';

export type {
  InspectorConfig,
  ComponentNode,
  PropInfo,
  StateInfo,
  StyleInfo,
  PerformanceInfo,
  InspectorEvent
} from './types';

export type { HookInfo, HooksPanelProps } from './hooks-panel';
export type { RenderInfo, CommitInfo, ProfilerPanelProps } from './profiler-panel';
