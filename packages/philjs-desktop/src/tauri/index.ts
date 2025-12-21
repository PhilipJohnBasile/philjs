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
} from './context';

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
} from './app';

// Command invocation
export {
  invoke,
  createCommand,
  defineCommand,
  batchInvoke,
  invokeWithTimeout,
  invokeWithRetry,
} from './invoke';

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
} from './events';

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
} from './types';
