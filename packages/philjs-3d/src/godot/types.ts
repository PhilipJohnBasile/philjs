/**
 * @file Godot Integration Types
 * @description Type definitions for Godot HTML5 export integration with PhilJS
 */

/**
 * Godot engine instance interface
 */
export interface GodotEngine {
  /** Start the engine with a config */
  startGame: (config: GodotConfig) => Promise<void>;
  /** Initialize the engine */
  init: (basePath?: string) => Promise<void>;
  /** Check if engine is running */
  isRunning: () => boolean;
  /** Get the canvas element */
  canvas: HTMLCanvasElement;
}

/**
 * Godot configuration for HTML5 export
 */
export interface GodotConfig {
  /** Path to the .pck file */
  executable: string;
  /** Main pack file */
  mainPack?: string;
  /** Canvas element ID */
  canvas?: HTMLCanvasElement;
  /** Arguments to pass to Godot */
  args?: string[];
  /** Called when engine starts */
  onExecute?: () => void;
  /** Called on progress */
  onProgress?: (current: number, total: number) => void;
  /** Called on print */
  onPrint?: (...args: unknown[]) => void;
  /** Called on error */
  onPrintError?: (...args: unknown[]) => void;
  /** Called when exiting */
  onExit?: (code: number) => void;
  /** Locale setting */
  locale?: string;
  /** Unload engine after exit */
  unloadAfterExit?: boolean;
  /** Experimental VK support */
  experimentalVK?: boolean;
}

/**
 * Godot JavaScript interface (window.godot object)
 */
export interface GodotJSInterface {
  /** Call a method on a node */
  call: (nodePath: string, method: string, ...args: unknown[]) => unknown;
  /** Get a property from a node */
  get: (nodePath: string, property: string) => unknown;
  /** Set a property on a node */
  set: (nodePath: string, property: string, value: unknown) => void;
  /** Connect to a signal */
  connect: (nodePath: string, signal: string, callback: (...args: unknown[]) => void) => void;
  /** Disconnect from a signal */
  disconnect: (nodePath: string, signal: string, callback: (...args: unknown[]) => void) => void;
  /** Emit a signal */
  emit: (nodePath: string, signal: string, ...args: unknown[]) => void;
  /** Check if node exists */
  hasNode: (nodePath: string) => boolean;
  /** Get scene tree */
  getTree: () => unknown;
}

/**
 * Signal handler type
 */
export type SignalHandler = (...args: unknown[]) => void;

/**
 * PhilJS Godot embed props
 */
export interface GodotEmbedProps {
  /** Path to the .pck file */
  pckPath: string;
  /** Path to the WASM file */
  wasmPath?: string;
  /** Width of the canvas */
  width?: number;
  /** Height of the canvas */
  height?: number;
  /** Canvas element ID */
  canvasId?: string;
  /** Device pixel ratio */
  pixelRatio?: number;
  /** Auto-start the game */
  autoStart?: boolean;
  /** Focus canvas on start */
  focusOnStart?: boolean;
  /** Arguments to pass to Godot */
  args?: string[];
  /** Called when engine is ready */
  onReady?: (godot: GodotInstance) => void;
  /** Called on load progress */
  onProgress?: (current: number, total: number) => void;
  /** Called on error */
  onError?: (error: Error) => void;
  /** Called when engine exits */
  onExit?: (code: number) => void;
  /** Custom styles */
  style?: Record<string, string | number>;
  /** CSS class name */
  className?: string;
}

/**
 * Godot instance wrapper
 */
export interface GodotInstance {
  /** The engine instance */
  engine: GodotEngine;
  /** Canvas element */
  canvas: HTMLCanvasElement;
  /** JavaScript interface for communication */
  js: GodotJSInterface | null;
  /** Whether the engine is running */
  isRunning: boolean;
  /** Start the engine */
  start: () => Promise<void>;
  /** Stop the engine */
  stop: () => void;
  /** Restart the engine */
  restart: () => Promise<void>;
  /** Call a Godot method */
  call: (nodePath: string, method: string, ...args: unknown[]) => unknown;
  /** Get a Godot property */
  get: (nodePath: string, property: string) => unknown;
  /** Set a Godot property */
  set: (nodePath: string, property: string, value: unknown) => void;
  /** Connect to a Godot signal */
  onSignal: (nodePath: string, signal: string, callback: SignalHandler) => () => void;
  /** Emit a signal to Godot */
  emitSignal: (nodePath: string, signal: string, ...args: unknown[]) => void;
}

/**
 * Godot state for PhilJS
 */
export interface GodotState {
  instance: GodotInstance | null;
  isLoading: boolean;
  loadProgress: number;
  error: Error | null;
  signalHandlers: Map<string, Set<SignalHandler>>;
}

/**
 * Godot hook result
 */
export interface UseGodotResult {
  /** Godot instance */
  godot: GodotInstance | null;
  /** Loading state */
  isLoading: boolean;
  /** Load progress (0-100) */
  progress: number;
  /** Error if any */
  error: Error | null;
  /** Call a Godot method */
  callGodot: (nodePath: string, method: string, ...args: unknown[]) => unknown;
  /** Listen to a Godot signal */
  onGodotSignal: (nodePath: string, signal: string, callback: SignalHandler) => () => void;
  /** Set a Godot property */
  setProperty: (nodePath: string, property: string, value: unknown) => void;
  /** Get a Godot property */
  getProperty: (nodePath: string, property: string) => unknown;
  /** Reload the Godot instance */
  reload: () => Promise<void>;
}
