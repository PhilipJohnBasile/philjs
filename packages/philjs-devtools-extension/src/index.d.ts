/**
 * PhilJS DevTools Extension
 *
 * Browser extension for debugging and inspecting PhilJS applications.
 * Provides signal inspection, component tree visualization, and performance profiling.
 */
export { DevToolsPanel } from './panel/DevToolsPanel';
export { SignalInspector } from './panel/SignalInspector';
export { ComponentTree } from './panel/ComponentTree';
export { PerformanceProfiler } from './panel/PerformanceProfiler';
export { NetworkInspector } from './panel/NetworkInspector';
export { connectDevTools, disconnectDevTools, isDevToolsConnected } from './client/connector';
export type { DevToolsState, SignalData, ComponentNode, PerformanceMetrics } from './types';
//# sourceMappingURL=index.d.ts.map