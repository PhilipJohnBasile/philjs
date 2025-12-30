/**
 * Tauri Integration for PhilJS Desktop
 */

// Context and hooks
export {
  initTauriContext,
  getTauriContext,
  useTauri,
  isTauri,
  resetTauriContext,
} from './context.js';

// App creation
export {
  createDesktopApp,
  onBeforeClose,
  isAppInitialized,
  getLoadedPlugins,
  createDefaultConfig,
  getAppVersion,
  getAppName,
  getTauriVersion,
} from './app.js';

// Command invocation
export {
  invoke,
  createCommand,
  defineCommand,
  batchInvoke,
  invokeWithTimeout,
  invokeWithRetry,
} from './invoke.js';

// Events
export {
  listen,
  once,
  emit,
  onTauriEvent,
  createEventEmitter,
  createTypedListener,
  waitForEvent,
  removeAllListeners,
  removeAllEventListeners,
  TauriEvents,
} from './events.js';

// Types
export type {
  TauriConfig,
  WindowConfig,
  TauriContext,
  AppInfo,
  Event,
  EventCallback,
  UnlistenFn,
  InvokeArgs,
  TauriPlugin,
  DesktopAppOptions,
  CommandDefinition,
  TypedCommand,
  TauriEventType,
} from './types.js';
