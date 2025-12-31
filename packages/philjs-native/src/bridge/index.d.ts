/**
 * PhilJS Native - Bridge Utilities
 *
 * Provides utilities for calling native code from JavaScript,
 * handling native events, and managing native modules.
 */
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
/**
 * Register a native module
 */
export declare function registerNativeModule<T extends Record<string, any>>(moduleName: string, methods: T): NativeModule<T>;
/**
 * Get a registered native module
 */
export declare function getNativeModule<T = Record<string, any>>(moduleName: string): NativeModule<T> | undefined;
/**
 * Check if a native module is available
 */
export declare function isModuleAvailable(moduleName: string): Promise<boolean>;
/**
 * Call a native method
 */
export declare function callNativeMethod<T = any>(moduleName: string, methodName: string, ...args: any[]): Promise<T>;
/**
 * Call a native method with callback
 */
export declare function callNativeMethodWithCallback<T = any>(moduleName: string, methodName: string, args: any[], callback: NativeCallback<T>): void;
/**
 * Batch multiple native calls
 */
export declare function batchNativeCalls(calls: BatchCallEntry[]): Promise<any[]>;
/**
 * Create a promisified version of a callback-based native method
 */
export declare function promisifyNativeMethod<T = any>(moduleName: string, methodName: string): (...args: any[]) => Promise<T>;
/**
 * Create a native event emitter for a module
 */
export declare function createNativeEventEmitter(moduleName: string): NativeEventEmitter;
/**
 * Get native module constants
 */
export declare function getNativeConstants(moduleName: string): Promise<Record<string, any>>;
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
export declare function installJSIBinding<T extends (...args: any[]) => any>(name: string, implementation?: T): JSIBinding<T>;
/**
 * Get or create a turbo module
 */
export declare function getTurboModule<T extends TurboModuleSpec>(name: string, spec: new () => T): T | null;
/**
 * Create a native module wrapper with typed methods
 */
export declare function createNativeModuleWrapper<T extends Record<string, (...args: any[]) => any>>(moduleName: string, methodNames: (keyof T)[]): T;
/**
 * Create type-safe event listener hooks
 */
export declare function createEventHooks<Events extends Record<string, any>>(moduleName: string): {
    useEvent: <K extends keyof Events>(eventType: K, handler: (event: Events[K]) => void) => void;
    emitter: NativeEventEmitter;
};
/**
 * Execute platform-specific native code
 */
export declare function executeNative<T>(options: {
    ios?: () => Promise<T>;
    android?: () => Promise<T>;
    web?: () => Promise<T>;
    default?: () => Promise<T>;
}): Promise<T>;
/**
 * Dispatch a command to a native view
 */
export declare function dispatchViewCommand(viewTag: number, commandName: string, args?: any[]): void;
/**
 * Find a native node handle
 */
export declare function findNodeHandle(componentOrHandle: any): number | null;
/**
 * Measure a native view
 */
export declare function measureView(viewTag: number): Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
    pageX: number;
    pageY: number;
}>;
/**
 * Bridge utilities object
 */
export declare const Bridge: {
    registerNativeModule: typeof registerNativeModule;
    getNativeModule: typeof getNativeModule;
    isModuleAvailable: typeof isModuleAvailable;
    callNativeMethod: typeof callNativeMethod;
    callNativeMethodWithCallback: typeof callNativeMethodWithCallback;
    batchNativeCalls: typeof batchNativeCalls;
    promisifyNativeMethod: typeof promisifyNativeMethod;
    createNativeEventEmitter: typeof createNativeEventEmitter;
    getNativeConstants: typeof getNativeConstants;
    installJSIBinding: typeof installJSIBinding;
    getTurboModule: typeof getTurboModule;
    createNativeModuleWrapper: typeof createNativeModuleWrapper;
    createEventHooks: typeof createEventHooks;
    executeNative: typeof executeNative;
    dispatchViewCommand: typeof dispatchViewCommand;
    findNodeHandle: typeof findNodeHandle;
    measureView: typeof measureView;
};
export default Bridge;
//# sourceMappingURL=index.d.ts.map