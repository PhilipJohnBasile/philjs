/**
 * PhilJS WASM Integration
 *
 * Provides seamless Rust/WebAssembly integration with PhilJS's reactive system.
 * Makes PhilJS the best choice for Rust developers wanting to use WASM.
 */
/**
 * Represents a WebAssembly module with its exports
 */
export interface WasmModule {
    /** The WebAssembly instance */
    instance: WebAssembly.Instance;
    /** The WebAssembly module */
    module: WebAssembly.Module;
    /** The memory buffer for WASM */
    memory: WebAssembly.Memory;
    /** Exported functions from the WASM module */
    exports: WasmExports;
}
/**
 * WASM module exports interface
 * Uses a Record type to avoid index signature conflicts
 */
export type WasmExports = Record<string, WebAssembly.ExportValue>;
/**
 * Helper type for wasm-bindgen malloc
 */
export type WbMalloc = (size: number) => number;
/**
 * Helper type for wasm-bindgen realloc
 */
export type WbRealloc = (ptr: number, oldSize: number, newSize: number) => number;
/**
 * Helper type for wasm-bindgen free
 */
export type WbFree = (ptr: number, size: number) => void;
/**
 * Options for loading WASM modules
 */
export interface WasmLoadOptions {
    /** Custom import object for the WASM module */
    imports?: WebAssembly.Imports;
    /** Whether to cache the module */
    cache?: boolean;
    /** Timeout for loading in milliseconds */
    timeout?: number;
    /** Optional initialization function name to call after loading */
    initFn?: string;
}
/**
 * Options for creating WASM components
 */
export interface WasmComponentOptions extends WasmLoadOptions {
    /** Props to pass to the WASM component */
    props?: Record<string, unknown>;
    /** Render function name in WASM */
    renderFn?: string;
    /** Whether to enable HMR for development */
    hmr?: boolean;
}
/**
 * Represents a Rust function bound to JavaScript
 */
export interface BoundRustFunction<T extends (...args: any[]) => any = (...args: any[]) => any> {
    /** Call the Rust function */
    (...args: Parameters<T>): ReturnType<T>;
    /** The original Rust function name */
    rustName: string;
    /** Whether the function is async */
    isAsync: boolean;
}
/**
 * Options for binding Rust functions
 */
export interface BindOptions {
    /** Function names to bind (if not specified, binds all exported functions) */
    include?: string[];
    /** Function names to exclude from binding */
    exclude?: string[];
    /** Transform function names (e.g., snake_case to camelCase) */
    transformNames?: (name: string) => string;
    /** Wrap functions with error handling */
    wrapErrors?: boolean;
}
/**
 * Rust signal that can be read/written from both Rust and JavaScript
 */
export interface RustSignal<T> {
    /** Read the current value */
    (): T;
    /** Set a new value */
    set: (value: T | ((prev: T) => T)) => void;
    /** Read without tracking dependencies */
    peek: () => T;
    /** Subscribe to changes */
    subscribe: (fn: (value: T) => void) => () => void;
    /** Get the memory pointer for Rust access */
    ptr: () => number;
    /** Sync value from Rust memory */
    syncFromRust: () => void;
    /** Sync value to Rust memory */
    syncToRust: () => void;
}
/**
 * WASM context value
 */
export interface WasmContextValue {
    /** Loaded WASM modules by URL */
    modules: Map<string, WasmModule>;
    /** Load a WASM module */
    loadModule: (url: string, options?: WasmLoadOptions) => Promise<WasmModule>;
    /** Unload a WASM module */
    unloadModule: (url: string) => void;
    /** Get a loaded module */
    getModule: (url: string) => WasmModule | undefined;
    /** Check if a module is loaded */
    isLoaded: (url: string) => boolean;
    /** Memory management utilities */
    memory: WasmMemoryManager;
}
/**
 * Memory management for WASM
 */
export interface WasmMemoryManager {
    /** Allocate memory in WASM */
    alloc: (module: WasmModule, size: number) => number;
    /** Free memory in WASM */
    free: (module: WasmModule, ptr: number, size: number) => void;
    /** Copy a string to WASM memory */
    copyString: (module: WasmModule, str: string) => {
        ptr: number;
        len: number;
    };
    /** Read a string from WASM memory */
    readString: (module: WasmModule, ptr: number, len: number) => string;
    /** Copy a typed array to WASM memory */
    copyTypedArray: <T extends ArrayBufferView>(module: WasmModule, array: T) => {
        ptr: number;
        len: number;
    };
    /** Read a typed array from WASM memory */
    readTypedArray: <T extends ArrayBufferView>(module: WasmModule, ptr: number, len: number, TypedArrayConstructor: new (buffer: ArrayBuffer, byteOffset: number, length: number) => T) => T;
}
/**
 * Load a WASM module from a URL
 *
 * @example
 * ```ts
 * const module = await loadWasm('/my-module.wasm');
 * const result = (module.exports.add as Function)(2, 3);
 * ```
 */
export declare function loadWasm(url: string, options?: WasmLoadOptions): Promise<WasmModule>;
/**
 * Unload a WASM module from cache
 */
export declare function unloadWasm(url: string): void;
/**
 * Check if a WASM module is loaded
 */
export declare function isWasmLoaded(url: string): boolean;
/**
 * Get a loaded WASM module
 */
export declare function getWasmModule(url: string): WasmModule | undefined;
/**
 * Component created from a WASM module
 */
export interface WasmComponent {
    /** The underlying WASM module */
    module: WasmModule;
    /** Render the component to HTML string */
    render: (props?: Record<string, unknown>) => string;
    /** Update component props */
    update: (props: Record<string, unknown>) => void;
    /** Dispose the component */
    dispose: () => void;
    /** Bind a Rust function for use in the component */
    bindFunction: <T extends (...args: any[]) => any>(name: string) => BoundRustFunction<T>;
}
/**
 * Create a PhilJS component from a WASM module
 *
 * @example
 * ```ts
 * const Counter = await createWasmComponent('/counter.wasm', {
 *   renderFn: 'render_counter',
 *   props: { initialCount: 0 }
 * });
 *
 * const html = Counter.render({ count: 5 });
 * ```
 */
export declare function createWasmComponent(wasmUrl: string, options?: WasmComponentOptions): Promise<WasmComponent>;
/**
 * State of a WASM resource
 */
export interface WasmResourceState<T> {
    /** The loaded data */
    data: T | undefined;
    /** Loading state */
    loading: boolean;
    /** Error if any */
    error: Error | null;
    /** Reload the WASM module */
    reload: () => void;
}
/**
 * Hook to load and use WASM modules with reactive state
 *
 * @example
 * ```ts
 * const wasmResource = useWasm('/my-module.wasm');
 *
 * if (wasmResource.loading) {
 *   return <div>Loading WASM...</div>;
 * }
 *
 * if (wasmResource.error) {
 *   return <div>Error: {wasmResource.error.message}</div>;
 * }
 *
 * const result = wasmResource.data!.exports.calculate(10);
 * ```
 */
export declare function useWasm(wasmUrl: string, options?: WasmLoadOptions): WasmResourceState<WasmModule>;
/**
 * Initialize the WASM provider
 * Call this at the root of your application
 *
 * @example
 * ```ts
 * // In your app initialization
 * initWasmProvider();
 *
 * // Later, use the context
 * const ctx = getWasmContext();
 * const module = await ctx.loadModule('/my-module.wasm');
 * ```
 */
export declare function initWasmProvider(): WasmContextValue;
/**
 * Get the current WASM context
 */
export declare function getWasmContext(): WasmContextValue;
/**
 * WasmProvider component props
 */
export interface WasmProviderProps {
    /** Child elements */
    children?: unknown;
    /** WASM modules to preload */
    preload?: string[];
}
/**
 * WasmProvider component for managing WASM modules
 *
 * @example
 * ```tsx
 * <WasmProvider preload={['/crypto.wasm', '/image.wasm']}>
 *   <App />
 * </WasmProvider>
 * ```
 */
export declare function WasmProvider(props: WasmProviderProps): unknown;
/**
 * Bound functions object
 */
export type BoundFunctions<T extends Record<string, (...args: any[]) => any>> = {
    [K in keyof T]: BoundRustFunction<T[K]>;
};
/**
 * Bind Rust functions from a WASM module to JavaScript
 *
 * @example
 * ```ts
 * const module = await loadWasm('/math.wasm');
 *
 * const math = bindRustFunctions(module, {
 *   include: ['add', 'multiply', 'calculate_sum'],
 *   transformNames: snakeToCamel
 * });
 *
 * const result = math.calculateSum(1, 2, 3);
 * ```
 */
export declare function bindRustFunctions<T extends Record<string, (...args: any[]) => any> = Record<string, (...args: any[]) => any>>(wasmModule: WasmModule, options?: BindOptions): BoundFunctions<T>;
/**
 * Options for creating Rust signals
 */
export interface RustSignalOptions<T> {
    /** The WASM module to use */
    module: WasmModule;
    /** Initial value */
    initialValue: T;
    /** Serializer for the value */
    serialize?: (value: T) => Uint8Array;
    /** Deserializer for the value */
    deserialize?: (data: Uint8Array) => T;
    /** Size of the value in bytes (for fixed-size types) */
    byteSize?: number;
}
/**
 * Create a signal that can be read/written from both Rust and JavaScript
 *
 * This is useful for sharing state between Rust WASM code and PhilJS's
 * reactive system.
 *
 * @example
 * ```ts
 * const module = await loadWasm('/counter.wasm');
 *
 * // Create a shared signal for an i32 counter
 * const count = createRustSignal({
 *   module,
 *   initialValue: 0,
 *   byteSize: 4
 * });
 *
 * // Use from JavaScript
 * console.log(count()); // 0
 * count.set(5);
 *
 * // Rust can read/write the same memory location
 * // Pass count.ptr() to Rust functions
 * ```
 */
export declare function createRustSignal<T>(options: RustSignalOptions<T>): RustSignal<T>;
/**
 * Create a Rust signal for an i32 value
 */
export declare function createI32Signal(module: WasmModule, initialValue?: number): RustSignal<number>;
/**
 * Create a Rust signal for an i64 value (as BigInt)
 */
export declare function createI64Signal(module: WasmModule, initialValue?: bigint): RustSignal<bigint>;
/**
 * Create a Rust signal for an f32 value
 */
export declare function createF32Signal(module: WasmModule, initialValue?: number): RustSignal<number>;
/**
 * Create a Rust signal for an f64 value
 */
export declare function createF64Signal(module: WasmModule, initialValue?: number): RustSignal<number>;
/**
 * Create a Rust signal for a boolean value
 */
export declare function createBoolSignal(module: WasmModule, initialValue?: boolean): RustSignal<boolean>;
export { viteWasmPlugin, type ViteWasmPluginOptions } from './vite-plugin.js';
export { type RustType, type RustFunction, type RustParam, type RustStruct, type RustField, type RustEnum, type RustEnumVariant, type WasmBindgenAttrs, type RustModule, type RustImpl, type CodegenOptions, type CodegenCLIOptions, type CodegenResult, RustToJSMapper, parseRustType, parseRustModule, generateTypeScriptTypes, generateJSWrapper, generateComponentBinding, generateSignalBinding, generateBindings, } from './codegen.js';
/**
 * Rust Result type for JS
 */
export type RustResult<T, E = string> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: E;
};
/**
 * Rust Option type for JS
 */
export type RustOption<T> = {
    some: true;
    value: T;
} | {
    some: false;
};
/**
 * Create a Rust Result Ok value
 */
export declare function Ok<T>(value: T): RustResult<T, never>;
/**
 * Create a Rust Result Err value
 */
export declare function Err<E>(error: E): RustResult<never, E>;
/**
 * Create a Rust Option Some value
 */
export declare function Some<T>(value: T): RustOption<T>;
/**
 * Create a Rust Option None value
 */
export declare function None<T>(): RustOption<T>;
/**
 * Unwrap a Rust Result, throwing if Err
 */
export declare function unwrapResult<T, E>(result: RustResult<T, E>): T;
/**
 * Unwrap a Rust Option, throwing if None
 */
export declare function unwrapOption<T>(option: RustOption<T>): T;
//# sourceMappingURL=index.d.ts.map