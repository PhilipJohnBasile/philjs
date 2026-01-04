/**
 * PhilJS DevTools Extension
 *
 * Browser extension for debugging and inspecting PhilJS applications.
 * Provides signal inspection, component tree visualization, and performance profiling.
 */
export { DevToolsPanel } from './panel/DevToolsPanel.js';
export { SignalInspector } from './panel/SignalInspector.js';
export { ComponentTree } from './panel/ComponentTree.js';
export { PerformanceProfiler } from './panel/PerformanceProfiler.js';
export { NetworkInspector } from './panel/NetworkInspector.js';
export { connectDevTools, disconnectDevTools, isDevToolsConnected } from './client/connector.js';
export type { DevToolsState, SignalData, ComponentNode, PerformanceMetrics } from './types.js';
//# sourceMappingURL=index.d.ts.map