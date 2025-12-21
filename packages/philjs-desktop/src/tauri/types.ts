/**
 * Type definitions for Tauri integration
 */

export interface TauriConfig {
  /** Application name */
  appName: string;
  /** Application version */
  version?: string;
  /** Window configuration */
  window?: WindowConfig;
  /** Enable dev tools in development */
  devTools?: boolean;
  /** Custom Tauri configuration */
  tauri?: Record<string, unknown>;
}

export interface WindowConfig {
  /** Window title */
  title?: string;
  /** Window width */
  width?: number;
  /** Window height */
  height?: number;
  /** Minimum window width */
  minWidth?: number;
  /** Minimum window height */
  minHeight?: number;
  /** Maximum window width */
  maxWidth?: number;
  /** Maximum window height */
  maxHeight?: number;
  /** Whether window is resizable */
  resizable?: boolean;
  /** Whether window has decorations (title bar, borders) */
  decorations?: boolean;
  /** Whether window is transparent */
  transparent?: boolean;
  /** Whether window is always on top */
  alwaysOnTop?: boolean;
  /** Whether to center window on screen */
  center?: boolean;
  /** Initial X position */
  x?: number;
  /** Initial Y position */
  y?: number;
  /** Whether to start fullscreen */
  fullscreen?: boolean;
  /** Whether to focus window on creation */
  focus?: boolean;
  /** Whether window is visible on creation */
  visible?: boolean;
}

export interface TauriContext {
  /** Whether running in Tauri environment */
  isTauri: boolean;
  /** Invoke a Tauri command */
  invoke: <T = unknown>(command: string, args?: Record<string, unknown>) => Promise<T>;
  /** Listen to a Tauri event */
  listen: <T = unknown>(event: string, callback: EventCallback<T>) => Promise<UnlistenFn>;
  /** Listen to an event once */
  once: <T = unknown>(event: string, callback: EventCallback<T>) => Promise<UnlistenFn>;
  /** Emit an event */
  emit: (event: string, payload?: unknown) => Promise<void>;
  /** App metadata */
  app: AppInfo;
}

export interface AppInfo {
  /** App name */
  name: string;
  /** App version */
  version: string;
  /** Tauri version */
  tauriVersion: string;
}

export interface Event<T = unknown> {
  /** Event name */
  event: string;
  /** Event ID */
  id: number;
  /** Window label that emitted the event */
  windowLabel: string;
  /** Event payload */
  payload: T;
}

export type EventCallback<T = unknown> = (event: Event<T>) => void;

export type UnlistenFn = () => void;

export interface InvokeArgs {
  [key: string]: unknown;
}

export interface TauriPlugin {
  /** Plugin name */
  name: string;
  /** Plugin initialization */
  init?: () => Promise<void>;
  /** Commands provided by plugin */
  commands?: Record<string, (...args: any[]) => Promise<unknown>>;
  /** Events to listen to */
  events?: Record<string, EventCallback>;
}

export interface DesktopAppOptions<Props = Record<string, unknown>> {
  /** Root component to render */
  component: () => unknown;
  /** Component props */
  props?: Props;
  /** Container element ID */
  containerId?: string;
  /** Tauri configuration */
  config?: TauriConfig;
  /** Plugins to load */
  plugins?: TauriPlugin[];
  /** Error handler */
  onError?: (error: Error) => void;
  /** Ready callback */
  onReady?: () => void;
}

export interface CommandDefinition<TArgs = Record<string, unknown>, TResult = unknown> {
  /** Command name */
  name: string;
  /** Argument schema for validation */
  args?: {
    [K in keyof TArgs]: {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      required?: boolean;
      default?: TArgs[K];
    };
  };
  /** Handler function */
  handler: (args: TArgs) => Promise<TResult> | TResult;
}

export interface TypedCommand<TArgs, TResult> {
  (args: TArgs): Promise<TResult>;
  commandName: string;
}
