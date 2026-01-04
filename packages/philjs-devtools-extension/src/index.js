/**
 * PhilJS DevTools Extension
 *
 * Browser extension for debugging and inspecting PhilJS applications.
 * Provides signal inspection, component tree visualization, and performance profiling.
 */
// Re-export all modules
export { DevToolsPanel } from './panel/DevToolsPanel.js';
export { SignalInspector } from './panel/SignalInspector.js';
export { ComponentTree } from './panel/ComponentTree.js';
export { PerformanceProfiler } from './panel/PerformanceProfiler.js';
export { NetworkInspector } from './panel/NetworkInspector.js';
// Client-side hook for connecting to DevTools
export { connectDevTools, disconnectDevTools, isDevToolsConnected } from './client/connector.js';
//# sourceMappingURL=index.js.map