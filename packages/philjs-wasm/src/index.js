/**
 * PhilJS WASM Integration
 *
 * Provides seamless Rust/WebAssembly integration with PhilJS's reactive system.
 * Makes PhilJS the best choice for Rust developers wanting to use WASM.
 */
// ============================================================================
// WASM Module Cache
// ============================================================================
const moduleCache = new Map();
const loadedModules = new Map();
// ============================================================================
// Memory Management
// ============================================================================
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
/**
 * Get memory from a WASM module
 */
function getMemory(module) {
    const exportedMemory = module.exports['memory'];
    if (exportedMemory && typeof exportedMemory === 'object' && 'buffer' in exportedMemory) {
        return exportedMemory;
    }
    return module.memory;
}
/**
 * Create a memory manager for WASM modules
 */
function createMemoryManager() {
    return {
        alloc(module, size) {
            const malloc = module.exports['__wbindgen_malloc'];
            if (!malloc || typeof malloc !== 'function') {
                throw new Error('WASM module does not export __wbindgen_malloc. Is it compiled with wasm-bindgen?');
            }
            return malloc(size);
        },
        free(module, ptr, size) {
            const free = module.exports['__wbindgen_free'];
            if (!free || typeof free !== 'function') {
                throw new Error('WASM module does not export __wbindgen_free. Is it compiled with wasm-bindgen?');
            }
            free(ptr, size);
        },
        copyString(module, str) {
            const encoded = textEncoder.encode(str);
            const ptr = this.alloc(module, encoded.length);
            const memory = getMemory(module);
            const view = new Uint8Array(memory.buffer, ptr, encoded.length);
            view.set(encoded);
            return { ptr, len: encoded.length };
        },
        readString(module, ptr, len) {
            const memory = getMemory(module);
            const view = new Uint8Array(memory.buffer, ptr, len);
            return textDecoder.decode(view);
        },
        copyTypedArray(module, array) {
            const ptr = this.alloc(module, array.byteLength);
            const memory = getMemory(module);
            const view = new Uint8Array(memory.buffer, ptr, array.byteLength);
            view.set(new Uint8Array(array.buffer, array.byteOffset, array.byteLength));
            return { ptr, len: array.byteLength };
        },
        readTypedArray(module, ptr, len, TypedArrayConstructor) {
            const memory = getMemory(module);
            // Create a copy to avoid issues with memory growth
            const copy = new ArrayBuffer(len);
            const srcView = new Uint8Array(memory.buffer, ptr, len);
            const dstView = new Uint8Array(copy);
            dstView.set(srcView);
            return new TypedArrayConstructor(copy, 0, len / TypedArrayConstructor.BYTES_PER_ELEMENT);
        }
    };
}
const memoryManager = createMemoryManager();
// ============================================================================
// WASM Loading
// ============================================================================
/**
 * Load a WASM module from a URL
 *
 * @example
 * ```ts
 * const module = await loadWasm('/my-module.wasm');
 * const result = (module.exports.add as Function)(2, 3);
 * ```
 */
export async function loadWasm(url, options = {}) {
    const { imports = {}, cache = true, timeout = 30000, initFn } = options;
    // Check cache
    if (cache && loadedModules.has(url)) {
        return loadedModules.get(url);
    }
    // Check if already loading
    if (cache && moduleCache.has(url)) {
        return moduleCache.get(url);
    }
    const loadPromise = (async () => {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            // Fetch the WASM file
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) {
                throw new Error(`Failed to fetch WASM module: ${response.status} ${response.statusText}`);
            }
            // Use streaming compilation if available
            let module;
            let instance;
            if (WebAssembly.instantiateStreaming) {
                const result = await WebAssembly.instantiateStreaming(response, imports);
                module = result.module;
                instance = result.instance;
            }
            else {
                // Fallback for older browsers
                const buffer = await response.arrayBuffer();
                module = await WebAssembly.compile(buffer);
                instance = await WebAssembly.instantiate(module, imports);
            }
            const memory = instance.exports['memory'] ||
                imports['env']?.['memory'];
            if (!memory) {
                throw new Error('WASM module does not export memory');
            }
            const wasmModule = {
                instance,
                module,
                memory,
                exports: instance.exports
            };
            // Call initialization function if specified
            if (initFn && typeof wasmModule.exports[initFn] === 'function') {
                wasmModule.exports[initFn]();
            }
            // Cache the loaded module
            if (cache) {
                loadedModules.set(url, wasmModule);
            }
            return wasmModule;
        }
        finally {
            clearTimeout(timeoutId);
        }
    })();
    // Cache the loading promise
    if (cache) {
        moduleCache.set(url, loadPromise);
    }
    return loadPromise;
}
/**
 * Unload a WASM module from cache
 */
export function unloadWasm(url) {
    moduleCache.delete(url);
    loadedModules.delete(url);
}
/**
 * Check if a WASM module is loaded
 */
export function isWasmLoaded(url) {
    return loadedModules.has(url);
}
/**
 * Get a loaded WASM module
 */
export function getWasmModule(url) {
    return loadedModules.get(url);
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
export async function createWasmComponent(wasmUrl, options = {}) {
    const { props = {}, renderFn = 'render', ...loadOptions } = options;
    const module = await loadWasm(wasmUrl, loadOptions);
    let currentProps = { ...props };
    const render = (newProps) => {
        if (newProps) {
            currentProps = { ...currentProps, ...newProps };
        }
        const renderFunc = module.exports[renderFn];
        if (typeof renderFunc !== 'function') {
            throw new Error(`WASM module does not export render function: ${renderFn}`);
        }
        // Serialize props to JSON and pass to Rust
        const propsJson = JSON.stringify(currentProps);
        const { ptr, len } = memoryManager.copyString(module, propsJson);
        try {
            // Call Rust render function
            const resultPtr = renderFunc(ptr, len);
            // Read result length (first 4 bytes)
            const memory = getMemory(module);
            const lenView = new Uint32Array(memory.buffer, resultPtr, 1);
            const resultLen = lenView[0];
            // Read HTML string
            const html = memoryManager.readString(module, resultPtr + 4, resultLen);
            // Free result memory
            memoryManager.free(module, resultPtr, resultLen + 4);
            return html;
        }
        finally {
            memoryManager.free(module, ptr, len);
        }
    };
    const update = (newProps) => {
        currentProps = { ...currentProps, ...newProps };
    };
    const dispose = () => {
        // Call Rust dispose function if available
        if (typeof module.exports['dispose'] === 'function') {
            module.exports['dispose']();
        }
    };
    const bindFunction = (name) => {
        const fn = module.exports[name];
        if (typeof fn !== 'function') {
            throw new Error(`WASM module does not export function: ${name}`);
        }
        const bound = Object.assign((...args) => fn(...args), { rustName: name, isAsync: false });
        return bound;
    };
    return {
        module,
        render,
        update,
        dispose,
        bindFunction
    };
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
export function useWasm(wasmUrl, options = {}) {
    let data = undefined;
    let loading = true;
    let error = null;
    const subscribers = new Set();
    const notify = () => {
        for (const subscriber of subscribers) {
            subscriber();
        }
    };
    const load = async () => {
        loading = true;
        error = null;
        notify();
        try {
            data = await loadWasm(wasmUrl, options);
            loading = false;
            notify();
        }
        catch (err) {
            error = err instanceof Error ? err : new Error(String(err));
            loading = false;
            notify();
        }
    };
    // Initial load
    load();
    return {
        get data() {
            return data;
        },
        get loading() {
            return loading;
        },
        get error() {
            return error;
        },
        reload: load
    };
}
// ============================================================================
// WasmProvider - Context for WASM module management
// ============================================================================
let wasmContext = null;
/**
 * Create a WASM context value
 */
function createWasmContext() {
    const modules = new Map();
    return {
        modules,
        async loadModule(url, options) {
            if (modules.has(url)) {
                return modules.get(url);
            }
            const module = await loadWasm(url, options);
            modules.set(url, module);
            return module;
        },
        unloadModule(url) {
            modules.delete(url);
            unloadWasm(url);
        },
        getModule(url) {
            return modules.get(url);
        },
        isLoaded(url) {
            return modules.has(url);
        },
        memory: memoryManager
    };
}
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
export function initWasmProvider() {
    wasmContext = createWasmContext();
    return wasmContext;
}
/**
 * Get the current WASM context
 */
export function getWasmContext() {
    if (!wasmContext) {
        wasmContext = createWasmContext();
    }
    return wasmContext;
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
export function WasmProvider(props) {
    const { children, preload = [] } = props;
    // Initialize context
    const ctx = initWasmProvider();
    // Preload modules
    for (const url of preload) {
        ctx.loadModule(url).catch(err => {
            console.error(`[philjs-wasm] Failed to preload ${url}:`, err);
        });
    }
    return children;
}
/**
 * Transform snake_case to camelCase
 */
function snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
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
export function bindRustFunctions(wasmModule, options = {}) {
    const { include, exclude = [], transformNames = snakeToCamel, wrapErrors = true } = options;
    const bound = {};
    for (const [name, value] of Object.entries(wasmModule.exports)) {
        // Skip non-functions
        if (typeof value !== 'function')
            continue;
        // Skip internal wasm-bindgen functions
        if (name.startsWith('__wbindgen') || name.startsWith('__wbg'))
            continue;
        // Apply include/exclude filters
        if (include && !include.includes(name))
            continue;
        if (exclude.includes(name))
            continue;
        const transformedName = transformNames(name);
        const wrappedFn = wrapErrors
            ? ((...args) => {
                try {
                    return value(...args);
                }
                catch (err) {
                    throw new Error(`Rust function '${name}' threw: ${err}`);
                }
            })
            : ((...args) => value(...args));
        // Create bound function with metadata as properties
        const boundFn = Object.assign(wrappedFn, {
            rustName: name,
            isAsync: false
        });
        bound[transformedName] = boundFn;
    }
    return bound;
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
export function createRustSignal(options) {
    const { module, initialValue, serialize = defaultSerialize, deserialize = defaultDeserialize, byteSize } = options;
    // Allocate memory for the signal value
    const serialized = serialize(initialValue);
    const size = byteSize ?? serialized.length;
    const ptr = memoryManager.alloc(module, size);
    // Copy initial value to WASM memory
    const memory = getMemory(module);
    const view = new Uint8Array(memory.buffer, ptr, size);
    view.set(serialized.slice(0, size));
    let cachedValue = initialValue;
    let isDirty = false;
    const subscribers = new Set();
    const read = (() => {
        // Sync from Rust if dirty
        if (isDirty) {
            const data = new Uint8Array(memory.buffer, ptr, size);
            cachedValue = deserialize(data);
            isDirty = false;
        }
        return cachedValue;
    });
    read.set = (nextValue) => {
        const newValue = typeof nextValue === 'function'
            ? nextValue(cachedValue)
            : nextValue;
        cachedValue = newValue;
        // Serialize and copy to WASM memory
        const serialized = serialize(newValue);
        const view = new Uint8Array(memory.buffer, ptr, size);
        view.set(serialized.slice(0, size));
        isDirty = false;
        // Notify subscribers
        for (const subscriber of subscribers) {
            subscriber(newValue);
        }
    };
    read.peek = () => cachedValue;
    read.subscribe = (fn) => {
        subscribers.add(fn);
        return () => subscribers.delete(fn);
    };
    read.ptr = () => ptr;
    read.syncFromRust = () => {
        const data = new Uint8Array(memory.buffer, ptr, size);
        const newValue = deserialize(data);
        if (newValue !== cachedValue) {
            cachedValue = newValue;
            for (const subscriber of subscribers) {
                subscriber(newValue);
            }
        }
    };
    read.syncToRust = () => {
        const serialized = serialize(cachedValue);
        const view = new Uint8Array(memory.buffer, ptr, size);
        view.set(serialized.slice(0, size));
    };
    return read;
}
// Default serialization for primitive types
function defaultSerialize(value) {
    if (typeof value === 'number') {
        // Serialize as f64 (8 bytes)
        const buffer = new ArrayBuffer(8);
        new Float64Array(buffer)[0] = value;
        return new Uint8Array(buffer);
    }
    if (typeof value === 'boolean') {
        return new Uint8Array([value ? 1 : 0]);
    }
    if (typeof value === 'string') {
        return textEncoder.encode(value);
    }
    // Default: JSON serialize
    return textEncoder.encode(JSON.stringify(value));
}
function defaultDeserialize(data) {
    // Try to parse as JSON first
    try {
        const str = textDecoder.decode(data);
        return JSON.parse(str);
    }
    catch {
        // If not JSON, return as-is for numeric types
        if (data.length === 8) {
            return new Float64Array(data.buffer, data.byteOffset, 1)[0];
        }
        if (data.length === 4) {
            return new Int32Array(data.buffer, data.byteOffset, 1)[0];
        }
        if (data.length === 1) {
            return data[0] !== 0;
        }
        return textDecoder.decode(data);
    }
}
// ============================================================================
// Specialized Signal Creators
// ============================================================================
/**
 * Create a Rust signal for an i32 value
 */
export function createI32Signal(module, initialValue = 0) {
    return createRustSignal({
        module,
        initialValue,
        byteSize: 4,
        serialize: (v) => {
            const buffer = new ArrayBuffer(4);
            new Int32Array(buffer)[0] = v;
            return new Uint8Array(buffer);
        },
        deserialize: (data) => new Int32Array(data.buffer, data.byteOffset, 1)[0]
    });
}
/**
 * Create a Rust signal for an i64 value (as BigInt)
 */
export function createI64Signal(module, initialValue = 0n) {
    return createRustSignal({
        module,
        initialValue,
        byteSize: 8,
        serialize: (v) => {
            const buffer = new ArrayBuffer(8);
            new BigInt64Array(buffer)[0] = v;
            return new Uint8Array(buffer);
        },
        deserialize: (data) => new BigInt64Array(data.buffer, data.byteOffset, 1)[0]
    });
}
/**
 * Create a Rust signal for an f32 value
 */
export function createF32Signal(module, initialValue = 0) {
    return createRustSignal({
        module,
        initialValue,
        byteSize: 4,
        serialize: (v) => {
            const buffer = new ArrayBuffer(4);
            new Float32Array(buffer)[0] = v;
            return new Uint8Array(buffer);
        },
        deserialize: (data) => new Float32Array(data.buffer, data.byteOffset, 1)[0]
    });
}
/**
 * Create a Rust signal for an f64 value
 */
export function createF64Signal(module, initialValue = 0) {
    return createRustSignal({
        module,
        initialValue,
        byteSize: 8,
        serialize: (v) => {
            const buffer = new ArrayBuffer(8);
            new Float64Array(buffer)[0] = v;
            return new Uint8Array(buffer);
        },
        deserialize: (data) => new Float64Array(data.buffer, data.byteOffset, 1)[0]
    });
}
/**
 * Create a Rust signal for a boolean value
 */
export function createBoolSignal(module, initialValue = false) {
    return createRustSignal({
        module,
        initialValue,
        byteSize: 1,
        serialize: (v) => new Uint8Array([v ? 1 : 0]),
        deserialize: (data) => data[0] !== 0
    });
}
// ============================================================================
// Export Vite Plugin
// ============================================================================
export { viteWasmPlugin } from './vite-plugin.js';
// ============================================================================
// Export Codegen Utilities
// ============================================================================
export { 
// Type mapper
RustToJSMapper, 
// Parser functions
parseRustType, parseRustModule, 
// Code generation functions
generateTypeScriptTypes, generateJSWrapper, generateComponentBinding, generateSignalBinding, generateBindings, } from './codegen.js';
/**
 * Create a Rust Result Ok value
 */
export function Ok(value) {
    return { ok: true, value };
}
/**
 * Create a Rust Result Err value
 */
export function Err(error) {
    return { ok: false, error };
}
/**
 * Create a Rust Option Some value
 */
export function Some(value) {
    return { some: true, value };
}
/**
 * Create a Rust Option None value
 */
export function None() {
    return { some: false };
}
/**
 * Unwrap a Rust Result, throwing if Err
 */
export function unwrapResult(result) {
    if (result.ok) {
        return result.value;
    }
    throw new Error(`Unwrap failed: ${result.error}`);
}
/**
 * Unwrap a Rust Option, throwing if None
 */
export function unwrapOption(option) {
    if (option.some) {
        return option.value;
    }
    throw new Error('Unwrap failed: None');
}
//# sourceMappingURL=index.js.map