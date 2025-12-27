/**
 * @file Godot Hooks
 * @description PhilJS hooks for Godot HTML5 export integration
 */

import type {
  GodotEngine,
  GodotConfig,
  GodotJSInterface,
  GodotInstance,
  GodotState,
  UseGodotResult,
  SignalHandler,
  GodotEmbedProps,
} from './types';

declare global {
  interface Window {
    Engine?: new () => GodotEngine;
    godot?: GodotJSInterface;
  }
}

/**
 * Global Godot states
 */
const godotStates = new WeakMap<HTMLCanvasElement, GodotState>();

/**
 * Get or create Godot state for a canvas
 */
function getGodotState(canvas: HTMLCanvasElement): GodotState {
  let state = godotStates.get(canvas);
  if (!state) {
    state = {
      instance: null,
      isLoading: false,
      loadProgress: 0,
      error: null,
      signalHandlers: new Map(),
    };
    godotStates.set(canvas, state);
  }
  return state;
}

/**
 * Load Godot engine script
 * Uses ES2024 Promise.withResolvers() for cleaner async handling
 */
async function loadGodotScript(wasmPath: string): Promise<void> {
  // Check if already loaded
  if (window.Engine) {
    return;
  }

  // ES2024: Promise.withResolvers() for cleaner promise handling
  const { promise, resolve, reject } = Promise.withResolvers<void>();

  // Derive the JS path from the WASM path
  const jsPath = wasmPath.replace('.wasm', '.js');

  const script = document.createElement('script');
  script.src = jsPath;
  script.async = true;

  script.onload = () => {
    if (window.Engine) {
      resolve();
    } else {
      reject(new Error('Godot Engine not found after script load'));
    }
  };

  script.onerror = () => {
    reject(new Error(`Failed to load Godot script: ${jsPath}`));
  };

  document.head.appendChild(script);
  return promise;
}

/**
 * Create a Godot instance
 */
export async function createGodotInstance(
  canvas: HTMLCanvasElement,
  props: GodotEmbedProps
): Promise<GodotInstance> {
  const state = getGodotState(canvas);

  state.isLoading = true;
  state.loadProgress = 0;
  state.error = null;

  try {
    // Load the Godot engine script
    const wasmPath = props.wasmPath || props.pckPath.replace('.pck', '.wasm');
    await loadGodotScript(wasmPath);

    if (!window.Engine) {
      throw new Error('Godot Engine class not available');
    }

    // Create engine instance
    const engine = new window.Engine();

    // Configure the engine
    const config: GodotConfig = {
      executable: props.pckPath.replace('.pck', ''),
      mainPack: props.pckPath,
      canvas,
      args: props.args || [],
      onProgress: (current, total) => {
        state.loadProgress = total > 0 ? (current / total) * 100 : 0;
        props.onProgress?.(current, total);
      },
      onExit: (code) => {
        props.onExit?.(code);
      },
    };

    // Initialize and start
    await engine.init();

    // Create the instance wrapper
    const instance: GodotInstance = {
      engine,
      canvas,
      js: null,
      isRunning: false,

      start: async () => {
        await engine.startGame(config);
        instance.isRunning = true;
        instance.js = window.godot || null;
      },

      stop: () => {
        instance.isRunning = false;
      },

      restart: async () => {
        instance.stop();
        await instance.start();
      },

      call: (nodePath: string, method: string, ...args: unknown[]) => {
        if (!instance.js) {
          console.warn('Godot JS interface not available');
          return undefined;
        }
        return instance.js.call(nodePath, method, ...args);
      },

      get: (nodePath: string, property: string) => {
        if (!instance.js) {
          console.warn('Godot JS interface not available');
          return undefined;
        }
        return instance.js.get(nodePath, property);
      },

      set: (nodePath: string, property: string, value: unknown) => {
        if (!instance.js) {
          console.warn('Godot JS interface not available');
          return;
        }
        instance.js.set(nodePath, property, value);
      },

      onSignal: (nodePath: string, signal: string, callback: SignalHandler) => {
        const key = `${nodePath}:${signal}`;
        let handlers = state.signalHandlers.get(key);

        if (!handlers) {
          handlers = new Set();
          state.signalHandlers.set(key, handlers);
        }

        handlers.add(callback);

        // Connect to Godot signal if JS interface is available
        if (instance.js) {
          instance.js.connect(nodePath, signal, callback);
        }

        // Return unsubscribe function
        return () => {
          handlers?.delete(callback);
          if (instance.js) {
            instance.js.disconnect(nodePath, signal, callback);
          }
        };
      },

      emitSignal: (nodePath: string, signal: string, ...args: unknown[]) => {
        if (!instance.js) {
          console.warn('Godot JS interface not available');
          return;
        }
        instance.js.emit(nodePath, signal, ...args);
      },
    };

    // Auto-start if configured
    if (props.autoStart !== false) {
      await instance.start();
    }

    state.instance = instance;
    state.isLoading = false;
    state.loadProgress = 100;

    props.onReady?.(instance);

    return instance;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    state.error = err;
    state.isLoading = false;
    props.onError?.(err);
    throw err;
  }
}

/**
 * Hook to use Godot instance
 */
export function useGodot(canvas: HTMLCanvasElement | null): UseGodotResult {
  if (!canvas) {
    return {
      godot: null,
      isLoading: false,
      progress: 0,
      error: null,
      callGodot: () => undefined,
      onGodotSignal: () => () => {},
      setProperty: () => {},
      getProperty: () => undefined,
      reload: async () => {},
    };
  }

  const state = getGodotState(canvas);

  return {
    godot: state.instance,
    isLoading: state.isLoading,
    progress: state.loadProgress,
    error: state.error,

    callGodot: (nodePath: string, method: string, ...args: unknown[]) => {
      return state.instance?.call(nodePath, method, ...args);
    },

    onGodotSignal: (nodePath: string, signal: string, callback: SignalHandler) => {
      if (!state.instance) {
        return () => {};
      }
      return state.instance.onSignal(nodePath, signal, callback);
    },

    setProperty: (nodePath: string, property: string, value: unknown) => {
      state.instance?.set(nodePath, property, value);
    },

    getProperty: (nodePath: string, property: string) => {
      return state.instance?.get(nodePath, property);
    },

    reload: async () => {
      if (state.instance) {
        await state.instance.restart();
      }
    },
  };
}

/**
 * Call a method on a Godot node
 */
export function callGodot(
  canvas: HTMLCanvasElement,
  nodePath: string,
  method: string,
  ...args: unknown[]
): unknown {
  const state = godotStates.get(canvas);
  return state?.instance?.call(nodePath, method, ...args);
}

/**
 * Subscribe to a Godot signal
 */
export function onGodotSignal(
  canvas: HTMLCanvasElement,
  nodePath: string,
  signal: string,
  callback: SignalHandler
): () => void {
  const state = godotStates.get(canvas);
  if (!state?.instance) {
    return () => {};
  }
  return state.instance.onSignal(nodePath, signal, callback);
}

/**
 * Cleanup Godot instance
 */
export function disposeGodot(canvas: HTMLCanvasElement): void {
  const state = godotStates.get(canvas);
  if (state?.instance) {
    state.instance.stop();
    state.signalHandlers.clear();
  }
  godotStates.delete(canvas);
}

/**
 * Sync PhilJS signal to Godot property
 */
export function syncToGodot<T>(
  canvas: HTMLCanvasElement,
  nodePath: string,
  property: string,
  getValue: () => T
): () => void {
  // In a real implementation, this would use PhilJS effects
  const state = godotStates.get(canvas);

  const sync = () => {
    const value = getValue();
    state?.instance?.set(nodePath, property, value);
  };

  // Initial sync
  sync();

  // Return cleanup (in real impl, would cleanup effect)
  return () => {};
}

/**
 * Sync Godot signal to PhilJS signal
 */
export function syncFromGodot<T>(
  canvas: HTMLCanvasElement,
  nodePath: string,
  signal: string,
  setValue: (value: T) => void
): () => void {
  const state = godotStates.get(canvas);
  if (!state?.instance) {
    return () => {};
  }

  return state.instance.onSignal(nodePath, signal, (value: unknown) => {
    setValue(value as T);
  });
}

/**
 * Bidirectional sync between PhilJS and Godot
 */
export function createGodotBridge<T>(
  canvas: HTMLCanvasElement,
  nodePath: string,
  options: {
    property?: string;
    signal?: string;
    getValue: () => T;
    setValue: (value: T) => void;
  }
): () => void {
  const cleanupFns: (() => void)[] = [];

  if (options.property) {
    cleanupFns.push(syncToGodot(canvas, nodePath, options.property, options.getValue));
  }

  if (options.signal) {
    cleanupFns.push(syncFromGodot(canvas, nodePath, options.signal, options.setValue));
  }

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}
