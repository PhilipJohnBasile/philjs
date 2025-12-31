/**
 * PhilJS Native - Bridge Utilities
 *
 * Provides utilities for calling native code from JavaScript,
 * handling native events, and managing native modules.
 */
import { signal, effect, batch } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
// ============================================================================
// Native Module Registry
// ============================================================================
/**
 * Registry of native modules
 */
const moduleRegistry = new Map();
/**
 * Module availability cache
 */
const moduleAvailability = new Map();
/**
 * Register a native module
 */
export function registerNativeModule(moduleName, methods) {
    const module = {
        moduleName,
        methods,
        isAvailable: () => moduleAvailability.get(moduleName) ?? true,
    };
    moduleRegistry.set(moduleName, module);
    return module;
}
/**
 * Get a registered native module
 */
export function getNativeModule(moduleName) {
    return moduleRegistry.get(moduleName);
}
/**
 * Check if a native module is available
 */
export async function isModuleAvailable(moduleName) {
    if (moduleAvailability.has(moduleName)) {
        return moduleAvailability.get(moduleName);
    }
    const platform = detectPlatform();
    if (platform === 'web') {
        moduleAvailability.set(moduleName, false);
        return false;
    }
    try {
        const available = await nativeBridge.call('NativeModules', 'isAvailable', moduleName);
        moduleAvailability.set(moduleName, available);
        return available;
    }
    catch {
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
export async function callNativeMethod(moduleName, methodName, ...args) {
    const platform = detectPlatform();
    if (platform === 'web') {
        console.warn(`Native method ${moduleName}.${methodName} called on web`);
        throw new Error(`Native module ${moduleName} is not available on web`);
    }
    return nativeBridge.call(moduleName, methodName, ...args);
}
/**
 * Call a native method with callback
 */
export function callNativeMethodWithCallback(moduleName, methodName, args, callback) {
    callNativeMethod(moduleName, methodName, ...args)
        .then(result => callback(null, result))
        .catch(error => callback(error));
}
/**
 * Batch multiple native calls
 */
export async function batchNativeCalls(calls) {
    const platform = detectPlatform();
    if (platform === 'web') {
        return calls.map(() => undefined);
    }
    return nativeBridge.call('NativeBatch', 'execute', calls);
}
/**
 * Create a promisified version of a callback-based native method
 */
export function promisifyNativeMethod(moduleName, methodName) {
    return (...args) => callNativeMethod(moduleName, methodName, ...args);
}
// ============================================================================
// Native Event Emitter
// ============================================================================
/**
 * Event listener registry
 */
const eventListeners = new Map();
/**
 * Create a native event emitter for a module
 */
export function createNativeEventEmitter(moduleName) {
    const getEventKey = (eventType) => `${moduleName}:${eventType}`;
    // Set up global handler for native events
    if (typeof globalThis !== 'undefined') {
        globalThis.__philjsNativeEventHandler = (module, eventType, data) => {
            const key = `${module}:${eventType}`;
            eventListeners.get(key)?.forEach(listener => {
                try {
                    listener(data);
                }
                catch (error) {
                    console.error(`Error in native event listener [${key}]:`, error);
                }
            });
        };
    }
    return {
        addListener(eventType, listener) {
            const key = getEventKey(eventType);
            if (!eventListeners.has(key)) {
                eventListeners.set(key, new Set());
                // Subscribe on native side
                nativeBridge.call('NativeEvents', 'subscribe', moduleName, eventType)
                    .catch(err => console.warn(`Failed to subscribe to ${key}:`, err));
            }
            eventListeners.get(key).add(listener);
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
        removeAllListeners(eventType) {
            const key = getEventKey(eventType);
            eventListeners.delete(key);
            nativeBridge.call('NativeEvents', 'unsubscribe', moduleName, eventType)
                .catch(err => console.warn(`Failed to unsubscribe from ${key}:`, err));
        },
        listenerCount(eventType) {
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
const constantsCache = new Map();
/**
 * Get native module constants
 */
export async function getNativeConstants(moduleName) {
    if (constantsCache.has(moduleName)) {
        return constantsCache.get(moduleName);
    }
    const platform = detectPlatform();
    if (platform === 'web') {
        return {};
    }
    try {
        const constants = await nativeBridge.call(moduleName, 'getConstants');
        constantsCache.set(moduleName, constants);
        return constants;
    }
    catch {
        return {};
    }
}
/**
 * Install a JSI binding
 */
export function installJSIBinding(name, implementation) {
    const platform = detectPlatform();
    // Check for existing JSI binding on native
    const existingBinding = globalThis.__jsi?.[name];
    if (existingBinding) {
        const binding = existingBinding;
        binding.isAvailable = true;
        return binding;
    }
    // Create a web fallback or stub
    const fallback = ((...args) => {
        if (platform === 'web') {
            if (implementation) {
                return implementation(...args);
            }
            console.warn(`JSI binding ${name} called on web without implementation`);
            return undefined;
        }
        throw new Error(`JSI binding ${name} not installed`);
    });
    fallback.isAvailable = platform !== 'web' && !!existingBinding;
    return fallback;
}
// ============================================================================
// Turbo Modules
// ============================================================================
/**
 * Turbo module registry
 */
const turboModules = new Map();
/**
 * Get or create a turbo module
 */
export function getTurboModule(name, spec) {
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
    const nativeModule = globalThis.__turboModules?.[name];
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
export function createNativeModuleWrapper(moduleName, methodNames) {
    const wrapper = {};
    for (const methodName of methodNames) {
        wrapper[methodName] = (...args) => callNativeMethod(moduleName, methodName, ...args);
    }
    return wrapper;
}
/**
 * Create type-safe event listener hooks
 */
export function createEventHooks(moduleName) {
    const emitter = createNativeEventEmitter(moduleName);
    const useEvent = (eventType, handler) => {
        effect(() => {
            const subscription = emitter.addListener(eventType, handler);
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
export function executeNative(options) {
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
export function dispatchViewCommand(viewTag, commandName, args = []) {
    const platform = detectPlatform();
    if (platform !== 'web') {
        nativeBridge.call('UIManager', 'dispatchViewManagerCommand', viewTag, commandName, args)
            .catch(err => console.warn(`Failed to dispatch command ${commandName}:`, err));
    }
}
/**
 * Find a native node handle
 */
export function findNodeHandle(componentOrHandle) {
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
export async function measureView(viewTag) {
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
//# sourceMappingURL=index.js.map