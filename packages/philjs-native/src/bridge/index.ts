/**
 * PhilJS Native - Bridge Utilities
 *
 * Provides utilities for calling native code from JavaScript,
 * handling native events, and managing native modules.
 */

import { signal, effect, batch, type Signal } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Native module definition
 */
export interface NativeModule<T = Record<string, any>> {
  readonly moduleName: string;
  readonly methods: T;
  isAvailable(): boolean;
}

/**
 * Event subscription
 */
export interface EventSubscription {
  remove(): void;
}

/**
 * Native event emitter interface
 */
export interface NativeEventEmitter {
  addListener(eventType: string, listener: (event: any) => void): EventSubscription;
  removeAllListeners(eventType: string): void;
  listenerCount(eventType: string): number;
}

/**
 * Turbo module spec (for advanced native modules)
 */
export interface TurboModuleSpec {
  getConstants?(): Record<string, any>;
}

/**
 * Native callback
 */
export type NativeCallback<T = any> = (error: Error | null, result?: T) => void;

/**
 * Batch call entry
 */
export interface BatchCallEntry {
  module: string;
  method: string;
  args: any[];
}

// ============================================================================
// Native Module Registry
// ============================================================================

/**
 * Registry of native modules
 */
const moduleRegistry = new Map<string, NativeModule>();

/**
 * Module availability cache
 */
const moduleAvailability = new Map<string, boolean>();

/**
 * Register a native module
 */
export function registerNativeModule<T extends Record<string, any>>(
  moduleName: string,
  methods: T
): NativeModule<T> {
  const module: NativeModule<T> = {
    moduleName,
    methods,
    isAvailable: () => moduleAvailability.get(moduleName) ?? true,
  };

  moduleRegistry.set(moduleName, module as NativeModule);
  return module;
}

/**
 * Get a registered native module
 */
export function getNativeModule<T = Record<string, any>>(
  moduleName: string
): NativeModule<T> | undefined {
  return moduleRegistry.get(moduleName) as NativeModule<T> | undefined;
}

/**
 * Check if a native module is available
 */
export async function isModuleAvailable(moduleName: string): Promise<boolean> {
  if (moduleAvailability.has(moduleName)) {
    return moduleAvailability.get(moduleName)!;
  }

  const platform = detectPlatform();

  if (platform === 'web') {
    moduleAvailability.set(moduleName, false);
    return false;
  }

  try {
    const available = await nativeBridge.call<boolean>('NativeModules', 'isAvailable', moduleName);
    moduleAvailability.set(moduleName, available);
    return available;
  } catch {
    moduleAvailability.set(moduleName, false);
    return false;
  }
}

// ============================================================================
// Native Method Calling
// ============================================================================

/**
 * Call a native method
 */
export async function callNativeMethod<T = any>(
  moduleName: string,
  methodName: string,
  ...args: any[]
): Promise<T> {
  const platform = detectPlatform();

  if (platform === 'web') {
    console.warn(`Native method ${moduleName}.${methodName} called on web`);
    throw new Error(`Native module ${moduleName} is not available on web`);
  }

  return nativeBridge.call<T>(moduleName, methodName, ...args);
}

/**
 * Call a native method with callback
 */
export function callNativeMethodWithCallback<T = any>(
  moduleName: string,
  methodName: string,
  args: any[],
  callback: NativeCallback<T>
): void {
  callNativeMethod<T>(moduleName, methodName, ...args)
    .then(result => callback(null, result))
    .catch(error => callback(error));
}

/**
 * Batch multiple native calls
 */
export async function batchNativeCalls(
  calls: BatchCallEntry[]
): Promise<any[]> {
  const platform = detectPlatform();

  if (platform === 'web') {
    return calls.map(() => undefined);
  }

  return nativeBridge.call<any[]>('NativeBatch', 'execute', calls);
}

/**
 * Create a promisified version of a callback-based native method
 */
export function promisifyNativeMethod<T = any>(
  moduleName: string,
  methodName: string
): (...args: any[]) => Promise<T> {
  return (...args: any[]) => callNativeMethod<T>(moduleName, methodName, ...args);
}

// ============================================================================
// Native Event Emitter
// ============================================================================

/**
 * Event listener registry
 */
const eventListeners = new Map<string, Set<(event: any) => void>>();

/**
 * Create a native event emitter for a module
 */
export function createNativeEventEmitter(moduleName: string): NativeEventEmitter {
  const getEventKey = (eventType: string) => `${moduleName}:${eventType}`;

  // Set up global handler for native events
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).__philjsNativeEventHandler = (
      module: string,
      eventType: string,
      data: any
    ) => {
      const key = `${module}:${eventType}`;
      eventListeners.get(key)?.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in native event listener [${key}]:`, error);
        }
      });
    };
  }

  return {
    addListener(eventType: string, listener: (event: any) => void): EventSubscription {
      const key = getEventKey(eventType);

      if (!eventListeners.has(key)) {
        eventListeners.set(key, new Set());

        // Subscribe on native side
        nativeBridge.call('NativeEvents', 'subscribe', moduleName, eventType)
          .catch(err => console.warn(`Failed to subscribe to ${key}:`, err));
      }

      eventListeners.get(key)!.add(listener);

      return {
        remove: () => {
          eventListeners.get(key)?.delete(listener);

          // Unsubscribe if no more listeners
          if (eventListeners.get(key)?.size === 0) {
            eventListeners.delete(key);
            nativeBridge.call('NativeEvents', 'unsubscribe', moduleName, eventType)
              .catch(err => console.warn(`Failed to unsubscribe from ${key}:`, err));
          }
        },
      };
    },

    removeAllListeners(eventType: string): void {
      const key = getEventKey(eventType);
      eventListeners.delete(key);
      nativeBridge.call('NativeEvents', 'unsubscribe', moduleName, eventType)
        .catch(err => console.warn(`Failed to unsubscribe from ${key}:`, err));
    },

    listenerCount(eventType: string): number {
      const key = getEventKey(eventType);
      return eventListeners.get(key)?.size ?? 0;
    },
  };
}

// ============================================================================
// Native Constants
// ============================================================================

/**
 * Constants cache
 */
const constantsCache = new Map<string, Record<string, any>>();

/**
 * Get native module constants
 */
export async function getNativeConstants(moduleName: string): Promise<Record<string, any>> {
  if (constantsCache.has(moduleName)) {
    return constantsCache.get(moduleName)!;
  }

  const platform = detectPlatform();

  if (platform === 'web') {
    return {};
  }

  try {
    const constants = await nativeBridge.call<Record<string, any>>(
      moduleName,
      'getConstants'
    );
    constantsCache.set(moduleName, constants);
    return constants;
  } catch {
    return {};
  }
}

// ============================================================================
// JSI Bridge (for direct native access)
// ============================================================================

/**
 * JSI function binding
 */
export interface JSIBinding<T extends (...args: any[]) => any = (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  isAvailable: boolean;
}

/**
 * Install a JSI binding
 */
export function installJSIBinding<T extends (...args: any[]) => any>(
  name: string,
  implementation?: T
): JSIBinding<T> {
  const platform = detectPlatform();

  // Check for existing JSI binding on native
  const existingBinding = (globalThis as any).__jsi?.[name];

  if (existingBinding) {
    const binding = existingBinding as JSIBinding<T>;
    binding.isAvailable = true;
    return binding;
  }

  // Create a web fallback or stub
  const fallback = ((...args: any[]) => {
    if (platform === 'web') {
      if (implementation) {
        return implementation(...args);
      }
      console.warn(`JSI binding ${name} called on web without implementation`);
      return undefined;
    }

    throw new Error(`JSI binding ${name} not installed`);
  }) as JSIBinding<T>;

  fallback.isAvailable = platform !== 'web' && !!existingBinding;

  return fallback;
}

// ============================================================================
// Turbo Modules
// ============================================================================

/**
 * Turbo module registry
 */
const turboModules = new Map<string, any>();

/**
 * Get or create a turbo module
 */
export function getTurboModule<T extends TurboModuleSpec>(
  name: string,
  spec: new () => T
): T | null {
  if (turboModules.has(name)) {
    return turboModules.get(name);
  }

  const platform = detectPlatform();

  if (platform === 'web') {
    // Create a stub for web
    const stub = new spec();
    turboModules.set(name, stub);
    return stub;
  }

  // Get native turbo module
  const nativeModule = (globalThis as any).__turboModules?.[name];

  if (nativeModule) {
    turboModules.set(name, nativeModule);
    return nativeModule;
  }

  return null;
}

// ============================================================================
// Codegen Helpers
// ============================================================================

/**
 * Create a native module wrapper with typed methods
 */
export function createNativeModuleWrapper<T extends Record<string, (...args: any[]) => any>>(
  moduleName: string,
  methodNames: (keyof T)[]
): T {
  const wrapper = {} as T;

  for (const methodName of methodNames) {
    (wrapper as any)[methodName] = (...args: any[]) =>
      callNativeMethod(moduleName, methodName as string, ...args);
  }

  return wrapper;
}

/**
 * Create type-safe event listener hooks
 */
export function createEventHooks<Events extends Record<string, any>>(
  moduleName: string
): {
  useEvent: <K extends keyof Events>(
    eventType: K,
    handler: (event: Events[K]) => void
  ) => void;
  emitter: NativeEventEmitter;
} {
  const emitter = createNativeEventEmitter(moduleName);

  const useEvent = <K extends keyof Events>(
    eventType: K,
    handler: (event: Events[K]) => void
  ) => {
    effect(() => {
      const subscription = emitter.addListener(
        eventType as string,
        handler
      );

      return () => subscription.remove();
    });
  };

  return { useEvent, emitter };
}

// ============================================================================
// Platform-Specific Execution
// ============================================================================

/**
 * Execute platform-specific native code
 */
export function executeNative<T>(options: {
  ios?: () => Promise<T>;
  android?: () => Promise<T>;
  web?: () => Promise<T>;
  default?: () => Promise<T>;
}): Promise<T> {
  const platform = detectPlatform();

  if (platform === 'ios' && options.ios) {
    return options.ios();
  }
  if (platform === 'android' && options.android) {
    return options.android();
  }
  if (platform === 'web' && options.web) {
    return options.web();
  }
  if (options.default) {
    return options.default();
  }

  return Promise.reject(new Error(`No implementation for platform: ${platform}`));
}

// ============================================================================
// Native UI
// ============================================================================

/**
 * Dispatch a command to a native view
 */
export function dispatchViewCommand(
  viewTag: number,
  commandName: string,
  args: any[] = []
): void {
  const platform = detectPlatform();

  if (platform !== 'web') {
    nativeBridge.call('UIManager', 'dispatchViewManagerCommand', viewTag, commandName, args)
      .catch(err => console.warn(`Failed to dispatch command ${commandName}:`, err));
  }
}

/**
 * Find a native node handle
 */
export function findNodeHandle(componentOrHandle: any): number | null {
  if (typeof componentOrHandle === 'number') {
    return componentOrHandle;
  }

  if (componentOrHandle && componentOrHandle._nativeTag) {
    return componentOrHandle._nativeTag;
  }

  return null;
}

/**
 * Measure a native view
 */
export async function measureView(viewTag: number): Promise<{
  x: number;
  y: number;
  width: number;
  height: number;
  pageX: number;
  pageY: number;
}> {
  const platform = detectPlatform();

  if (platform === 'web') {
    return { x: 0, y: 0, width: 0, height: 0, pageX: 0, pageY: 0 };
  }

  return nativeBridge.call('UIManager', 'measure', viewTag);
}

// ============================================================================
// Exports
// ============================================================================

/**
 * Bridge utilities object
 */
export const Bridge = {
  // Module management
  registerNativeModule,
  getNativeModule,
  isModuleAvailable,

  // Method calling
  callNativeMethod,
  callNativeMethodWithCallback,
  batchNativeCalls,
  promisifyNativeMethod,

  // Events
  createNativeEventEmitter,

  // Constants
  getNativeConstants,

  // JSI
  installJSIBinding,

  // Turbo Modules
  getTurboModule,

  // Helpers
  createNativeModuleWrapper,
  createEventHooks,
  executeNative,

  // UI
  dispatchViewCommand,
  findNodeHandle,
  measureView,
};

export default Bridge;
