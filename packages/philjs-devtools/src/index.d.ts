/**
 * Developer tools for PhilJS.
 * Shows hydration map, performance budgets, AI cost panel, and component inspector.
 */
export { TimeTravelDebugger, initTimeTravel, getTimeTravelDebugger, debugSignal, diffState, } from "./time-travel.js";
export type { StateSnapshot, TimelineNode, TimeTravelConfig, DiffType, StateDiff, } from "./time-travel.js";
export { ReduxDevTools, initReduxDevTools, getReduxDevTools, disconnectReduxDevTools, ActionReplayer, StatePersistence, } from "./redux-devtools.js";
export type { ReduxAction, ReduxDevToolsConfig, DevToolsState, PersistenceConfig, } from "./redux-devtools.js";
export { ComponentInspector, createInspector, getInspector, PropsPanel, StatePanel, StylePanel, PerformancePanel, ElementHighlighter, SearchBar, } from "./inspector/index.js";
export type { InspectorConfig, ComponentNode, PropInfo, StateInfo, StyleInfo, PerformanceInfo, InspectorEvent, } from "./inspector/types.js";
/**
 * Show the developer overlay.
 */
export declare function showOverlay(): void;
export { startProfiling, stopProfiling, recordRenderStart, recordRenderEnd, recordMemo, startMemoryProfiling, stopMemoryProfiling, captureMemorySnapshot, startNetworkProfiling, stopNetworkProfiling, generateFlameGraph, analyzeRenderPerformance, analyzeMemoryUsage, analyzeNetworkRequests, exportProfileData, importProfileData, } from "./profiler.js";
export type { RenderProfile, MemoryProfile, NetworkProfile, BundleProfile, ModuleInfo, ChunkInfo, DuplicateInfo, FlameNode, ProfilerConfig, } from "./profiler.js";
//# sourceMappingURL=index.d.ts.map