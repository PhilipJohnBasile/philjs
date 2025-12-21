/**
 * @file Unity Integration Types
 * @description Type definitions for Unity WebGL build integration with PhilJS
 */

/**
 * Unity instance interface
 */
export interface UnityInstance {
  /** Send a message to a Unity game object */
  SendMessage: (gameObject: string, method: string, param?: string | number) => void;
  /** Set fullscreen mode */
  SetFullscreen: (fullscreen: 0 | 1) => void;
  /** Quit the Unity player */
  Quit: () => Promise<void>;
  /** Get the current memory usage */
  GetMemoryInfo?: () => { totalJSHeapSize: number; usedJSHeapSize: number };
  /** The Unity module */
  Module?: UnityModule;
}

/**
 * Unity module interface
 */
export interface UnityModule {
  /** Canvas element */
  canvas: HTMLCanvasElement;
  /** Called when Unity sends a message */
  SendMessage?: (gameObject: string, method: string, param?: string | number) => void;
  /** Memory heap */
  HEAPU8?: Uint8Array;
  /** Call a C function */
  ccall?: (name: string, returnType: string, argTypes: string[], args: unknown[]) => unknown;
  /** Get a C function */
  cwrap?: (name: string, returnType: string, argTypes: string[]) => (...args: unknown[]) => unknown;
}

/**
 * Unity loader configuration
 */
export interface UnityConfig {
  /** Data file URL (.data) */
  dataUrl: string;
  /** Framework file URL (.framework.js) */
  frameworkUrl: string;
  /** Code file URL (.wasm) */
  codeUrl: string;
  /** Streaming assets URL */
  streamingAssetsUrl?: string;
  /** Company name */
  companyName?: string;
  /** Product name */
  productName?: string;
  /** Product version */
  productVersion?: string;
  /** Show banner */
  showBanner?: (msg: string, type: string) => void;
  /** Match WebGL to canvas size */
  matchWebGLToCanvasSize?: boolean;
  /** Device pixel ratio */
  devicePixelRatio?: number;
}

/**
 * Unity loading progress
 */
export interface UnityLoadingProgress {
  /** Progress value (0-1) */
  progress: number;
  /** Current loading phase */
  phase: 'downloading' | 'decompressing' | 'loading' | 'complete';
  /** Bytes loaded */
  loaded?: number;
  /** Total bytes */
  total?: number;
}

/**
 * Unity event types
 */
export type UnityEventType =
  | 'ready'
  | 'progress'
  | 'error'
  | 'message'
  | 'quit'
  | 'focus'
  | 'blur';

/**
 * Unity event handler
 */
export type UnityEventHandler = (data: unknown) => void;

/**
 * PhilJS Unity embed props
 */
export interface UnityEmbedProps {
  /** Build folder URL */
  buildUrl: string;
  /** Loader script URL */
  loaderUrl?: string;
  /** Width of the canvas */
  width?: number;
  /** Height of the canvas */
  height?: number;
  /** Device pixel ratio */
  pixelRatio?: number;
  /** Company name (for data caching) */
  companyName?: string;
  /** Product name (for data caching) */
  productName?: string;
  /** Product version */
  productVersion?: string;
  /** Streaming assets URL */
  streamingAssetsUrl?: string;
  /** Called when Unity is ready */
  onReady?: (instance: UnityInstanceWrapper) => void;
  /** Called on load progress */
  onProgress?: (progress: UnityLoadingProgress) => void;
  /** Called on error */
  onError?: (error: Error) => void;
  /** Called when Unity sends a message */
  onMessage?: (data: unknown) => void;
  /** Called when Unity quits */
  onQuit?: () => void;
  /** Custom styles */
  style?: Record<string, string | number>;
  /** CSS class name */
  className?: string;
  /** Show loading progress bar */
  showProgress?: boolean;
}

/**
 * Unity instance wrapper for PhilJS
 */
export interface UnityInstanceWrapper {
  /** The Unity instance */
  instance: UnityInstance;
  /** Canvas element */
  canvas: HTMLCanvasElement;
  /** Send message to Unity */
  sendMessage: (gameObject: string, method: string, param?: string | number) => void;
  /** Request fullscreen */
  requestFullscreen: () => void;
  /** Exit fullscreen */
  exitFullscreen: () => void;
  /** Quit Unity */
  quit: () => Promise<void>;
  /** Register event handler */
  on: (event: UnityEventType, handler: UnityEventHandler) => () => void;
  /** Take a screenshot */
  takeScreenshot: () => string | null;
  /** Get memory usage */
  getMemoryUsage: () => { total: number; used: number } | null;
  /** Check if instance is ready */
  isReady: boolean;
}

/**
 * Unity state for PhilJS
 */
export interface UnityState {
  instance: UnityInstanceWrapper | null;
  isLoading: boolean;
  loadProgress: UnityLoadingProgress;
  error: Error | null;
  isReady: boolean;
  eventHandlers: Map<UnityEventType, Set<UnityEventHandler>>;
}

/**
 * Use Unity hook result
 */
export interface UseUnityResult {
  /** Unity instance wrapper */
  unity: UnityInstanceWrapper | null;
  /** Loading state */
  isLoading: boolean;
  /** Load progress */
  progress: UnityLoadingProgress;
  /** Error if any */
  error: Error | null;
  /** Whether Unity is ready */
  isReady: boolean;
  /** Send message to Unity */
  sendMessage: (gameObject: string, method: string, param?: string | number) => void;
  /** Register event handler */
  onUnityEvent: (event: UnityEventType, handler: UnityEventHandler) => () => void;
  /** Request fullscreen */
  requestFullscreen: () => void;
  /** Reload Unity */
  reload: () => Promise<void>;
}

/**
 * Unity message from JS to Unity
 */
export interface UnityMessage {
  gameObject: string;
  method: string;
  param?: string | number;
}

/**
 * Unity callback registration
 */
export interface UnityCallback {
  name: string;
  handler: (...args: unknown[]) => void;
}
