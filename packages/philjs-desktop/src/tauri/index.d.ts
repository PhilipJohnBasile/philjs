/**
 * Tauri Integration for PhilJS Desktop
 */
export { initTauriContext, getTauriContext, useTauri, isTauri, resetTauriContext, } from './context.js';
export { createDesktopApp, onBeforeClose, isAppInitialized, getLoadedPlugins, createDefaultConfig, getAppVersion, getAppName, getTauriVersion, } from './app.js';
export { invoke, createCommand, defineCommand, batchInvoke, invokeWithTimeout, invokeWithRetry, } from './invoke.js';
export { listen, once, emit, onTauriEvent, createEventEmitter, createTypedListener, waitForEvent, removeAllListeners, removeAllEventListeners, TauriEvents, } from './events.js';
export type { TauriConfig, WindowConfig, TauriContext, AppInfo, Event, EventCallback, UnlistenFn, InvokeArgs, TauriPlugin, DesktopAppOptions, CommandDefinition, TypedCommand, TauriEventType, } from './types.js';
//# sourceMappingURL=index.d.ts.map