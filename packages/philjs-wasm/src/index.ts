/**
 * PhilJS WASM Integration
 *
 * Provides seamless Rust/WebAssembly integration with PhilJS's reactive system.
 * Makes PhilJS the best choice for Rust developers wanting to use WASM.
 */

// ============================================================================
// Type Definitions for Rust/WASM Interop
// ============================================================================

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
  copyString: (module: WasmModule, str: string) => { ptr: number; len: number };
  /** Read a string from WASM memory */
  readString: (module: WasmModule, ptr: number, len: number) => string;
  /** Copy a typed array to WASM memory */
  copyTypedArray: <T extends ArrayBufferView>(module: WasmModule, array: T) => { ptr: number; len: number };
  /** Read a typed array from WASM memory */
  readTypedArray: <T extends ArrayBufferView>(
    module: WasmModule,
    ptr: number,
    len: number,
    TypedArrayConstructor: new (buffer: ArrayBuffer, byteOffset: number, length: number) => T
  ) => T;
}

// ============================================================================
// WASM Module Cache
// ============================================================================

const moduleCache = new Map<string, Promise<WasmModule>>();
const loadedModules = new Map<string, WasmModule>();

// ============================================================================
// Memory Management
// ============================================================================

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * Get memory from a WASM module
 */
function getMemory(module: WasmModule): WebAssembly.Memory {
  const exportedMemory = module.exports['memory'];
  if (exportedMemory && typeof exportedMemory === 'object' && 'buffer' in exportedMemory) {
    return exportedMemory as WebAssembly.Memory;
  }
  return module.memory;
}

/**
 * Create a memory manager for WASM modules
 */
function createMemoryManager(): WasmMemoryManager {
  return {
    alloc(module: WasmModule, size: number): number {
      const malloc = module.exports['__wbindgen_malloc'] as WbMalloc | undefined;
      if (!malloc || typeof malloc !== 'function') {
        throw new Error('WASM module does not export __wbindgen_malloc. Is it compiled with wasm-bindgen?');
      }
      return malloc(size);
    },

    free(module: WasmModule, ptr: number, size: number): void {
      const free = module.exports['__wbindgen_free'] as WbFree | undefined;
      if (!free || typeof free !== 'function') {
        throw new Error('WASM module does not export __wbindgen_free. Is it compiled with wasm-bindgen?');
      }
      free(ptr, size);
    },

    copyString(module: WasmModule, str: string): { ptr: number; len: number } {
      const encoded = textEncoder.encode(str);
      const ptr = this.alloc(module, encoded.length);
      const memory = getMemory(module);
      const view = new Uint8Array(memory.buffer, ptr, encoded.length);
      view.set(encoded);
      return { ptr, len: encoded.length };
    },

    readString(module: WasmModule, ptr: number, len: number): string {
      const memory = getMemory(module);
      const view = new Uint8Array(memory.buffer, ptr, len);
      return textDecoder.decode(view);
    },

    copyTypedArray<T extends ArrayBufferView>(module: WasmModule, array: T): { ptr: number; len: number } {
      const ptr = this.alloc(module, array.byteLength);
      const memory = getMemory(module);
      const view = new Uint8Array(memory.buffer, ptr, array.byteLength);
      view.set(new Uint8Array(array.buffer, array.byteOffset, array.byteLength));
      return { ptr, len: array.byteLength };
    },

    readTypedArray<T extends ArrayBufferView>(
      module: WasmModule,
      ptr: number,
      len: number,
      TypedArrayConstructor: new (buffer: ArrayBuffer, byteOffset: number, length: number) => T
    ): T {
      const memory = getMemory(module);
      // Create a copy to avoid issues with memory growth
      const copy = new ArrayBuffer(len);
      const srcView = new Uint8Array(memory.buffer, ptr, len);
      const dstView = new Uint8Array(copy);
      dstView.set(srcView);
      return new TypedArrayConstructor(copy, 0, len / (TypedArrayConstructor as any).BYTES_PER_ELEMENT);
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
export async function loadWasm(url: string, options: WasmLoadOptions = {}): Promise<WasmModule> {
  const { imports = {}, cache = true, timeout = 30000, initFn } = options;

  // Check cache
  if (cache && loadedModules.has(url)) {
    return loadedModules.get(url)!;
  }

  // Check if already loading
  if (cache && moduleCache.has(url)) {
    return moduleCache.get(url)!;
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
      let module: WebAssembly.Module;
      let instance: WebAssembly.Instance;

      if (WebAssembly.instantiateStreaming) {
        const result = await WebAssembly.instantiateStreaming(response, imports);
        module = result.module;
        instance = result.instance;
      } else {
        // Fallback for older browsers
        const buffer = await response.arrayBuffer();
        module = await WebAssembly.compile(buffer);
        instance = await WebAssembly.instantiate(module, imports);
      }

      const memory = (instance.exports['memory'] as WebAssembly.Memory) ||
        (imports['env']?.['memory'] as WebAssembly.Memory);

      if (!memory) {
        throw new Error('WASM module does not export memory');
      }

      const wasmModule: WasmModule = {
        instance,
        module,
        memory,
        exports: instance.exports as WasmExports
      };

      // Call initialization function if specified
      if (initFn && typeof wasmModule.exports[initFn] === 'function') {
        (wasmModule.exports[initFn] as Function)();
      }

      // Cache the loaded module
      if (cache) {
        loadedModules.set(url, wasmModule);
      }

      return wasmModule;
    } finally {
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
export function unloadWasm(url: string): void {
  moduleCache.delete(url);
  loadedModules.delete(url);
}

/**
 * Check if a WASM module is loaded
 */
export function isWasmLoaded(url: string): boolean {
  return loadedModules.has(url);
}

/**
 * Get a loaded WASM module
 */
export function getWasmModule(url: string): WasmModule | undefined {
  return loadedModules.get(url);
}

// ============================================================================
// createWasmComponent - Load WASM module as PhilJS component
// ============================================================================

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
export async function createWasmComponent(
  wasmUrl: string,
  options: WasmComponentOptions = {}
): Promise<WasmComponent> {
  const { props = {}, renderFn = 'render', ...loadOptions } = options;

  const module = await loadWasm(wasmUrl, loadOptions);

  let currentProps = { ...props };

  const render = (newProps?: Record<string, unknown>): string => {
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
      const resultPtr = (renderFunc as Function)(ptr, len) as number;

      // Read result length (first 4 bytes)
      const memory = getMemory(module);
      const lenView = new Uint32Array(memory.buffer, resultPtr, 1);
      const resultLen = lenView[0]!;

      // Read HTML string
      const html = memoryManager.readString(module, resultPtr + 4, resultLen!);

      // Free result memory
      memoryManager.free(module, resultPtr, resultLen + 4);

      return html;
    } finally {
      memoryManager.free(module, ptr, len);
    }
  };

  const update = (newProps: Record<string, unknown>): void => {
    currentProps = { ...currentProps, ...newProps };
  };

  const dispose = (): void => {
    // Call Rust dispose function if available
    if (typeof module.exports['dispose'] === 'function') {
      (module.exports['dispose'] as Function)();
    }
  };

  const bindFunction = <T extends (...args: any[]) => any>(name: string): BoundRustFunction<T> => {
    const fn = module.exports[name];
    if (typeof fn !== 'function') {
      throw new Error(`WASM module does not export function: ${name}`);
    }

    const bound = Object.assign(
      (...args: any[]) => (fn as Function)(...args),
      { rustName: name, isAsync: false }
    ) as BoundRustFunction<T>;

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

// ============================================================================
// useWasm - Hook to load and use WASM modules
// ============================================================================

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
export function useWasm(
  wasmUrl: string,
  options: WasmLoadOptions = {}
): WasmResourceState<WasmModule> {
  let data: WasmModule | undefined = undefined;
  let loading = true;
  let error: Error | null = null;
  const subscribers = new Set<() => void>();

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
    } catch (err) {
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

let wasmContext: WasmContextValue | null = null;

/**
 * Create a WASM context value
 */
function createWasmContext(): WasmContextValue {
  const modules = new Map<string, WasmModule>();

  return {
    modules,

    async loadModule(url: string, options?: WasmLoadOptions): Promise<WasmModule> {
      if (modules.has(url)) {
        return modules.get(url)!;
      }

      const module = await loadWasm(url, options);
      modules.set(url, module);
      return module;
    },

    unloadModule(url: string): void {
      modules.delete(url);
      unloadWasm(url);
    },

    getModule(url: string): WasmModule | undefined {
      return modules.get(url);
    },

    isLoaded(url: string): boolean {
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
export function initWasmProvider(): WasmContextValue {
  wasmContext = createWasmContext();
  return wasmContext;
}

/**
 * Get the current WASM context
 */
export function getWasmContext(): WasmContextValue {
  if (!wasmContext) {
    wasmContext = createWasmContext();
  }
  return wasmContext;
}

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
export function WasmProvider(props: WasmProviderProps): unknown {
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

// ============================================================================
// bindRustFunctions - Bind Rust functions to JS
// ============================================================================

/**
 * Bound functions object
 */
export type BoundFunctions<T extends Record<string, (...args: any[]) => any>> = {
  [K in keyof T]: BoundRustFunction<T[K]>;
};

/**
 * Transform snake_case to camelCase
 */
function snakeToCamel(str: string): string {
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
export function bindRustFunctions<T extends Record<string, (...args: any[]) => any> = Record<string, (...args: any[]) => any>>(
  wasmModule: WasmModule,
  options: BindOptions = {}
): BoundFunctions<T> {
  const {
    include,
    exclude = [],
    transformNames = snakeToCamel,
    wrapErrors = true
  } = options;

  const bound: Record<string, BoundRustFunction<any>> = {};

  for (const [name, value] of Object.entries(wasmModule.exports)) {
    // Skip non-functions
    if (typeof value !== 'function') continue;

    // Skip internal wasm-bindgen functions
    if (name.startsWith('__wbindgen') || name.startsWith('__wbg')) continue;

    // Apply include/exclude filters
    if (include && !include.includes(name)) continue;
    if (exclude.includes(name)) continue;

    const transformedName = transformNames(name);

    const wrappedFn = wrapErrors
      ? ((...args: any[]) => {
          try {
            return (value as Function)(...args);
          } catch (err) {
            throw new Error(`Rust function '${name}' threw: ${err}`);
          }
        })
      : ((...args: any[]) => (value as Function)(...args));

    // Create bound function with metadata as properties
    const boundFn = Object.assign(wrappedFn, {
      rustName: name,
      isAsync: false
    }) as BoundRustFunction<any>;

    bound[transformedName] = boundFn;
  }

  return bound as BoundFunctions<T>;
}

// ============================================================================
// createRustSignal - Signals that can be read/written from Rust
// ============================================================================

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
export function createRustSignal<T>(options: RustSignalOptions<T>): RustSignal<T> {
  const {
    module,
    initialValue,
    serialize = defaultSerialize,
    deserialize = defaultDeserialize,
    byteSize
  } = options;

  // Allocate memory for the signal value
  const serialized = serialize(initialValue);
  const size = byteSize ?? serialized.length;
  const ptr = memoryManager.alloc(module, size);

  // Copy initial value to WASM memory
  const memory = getMemory(module);
  const view = new Uint8Array(memory.buffer, ptr, size);
  view.set(serialized.slice(0, size));

  let cachedValue: T = initialValue;
  let isDirty = false;
  const subscribers = new Set<(value: T) => void>();

  const read = (() => {
    // Sync from Rust if dirty
    if (isDirty) {
      const data = new Uint8Array(memory.buffer, ptr, size);
      cachedValue = deserialize(data);
      isDirty = false;
    }
    return cachedValue;
  }) as RustSignal<T>;

  read.set = (nextValue: T | ((prev: T) => T)) => {
    const newValue = typeof nextValue === 'function'
      ? (nextValue as (prev: T) => T)(cachedValue)
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

  read.subscribe = (fn: (value: T) => void) => {
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
function defaultSerialize(value: unknown): Uint8Array {
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

function defaultDeserialize(data: Uint8Array): any {
  // Try to parse as JSON first
  try {
    const str = textDecoder.decode(data);
    return JSON.parse(str);
  } catch {
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
export function createI32Signal(
  module: WasmModule,
  initialValue: number = 0
): RustSignal<number> {
  return createRustSignal({
    module,
    initialValue,
    byteSize: 4,
    serialize: (v) => {
      const buffer = new ArrayBuffer(4);
      new Int32Array(buffer)[0] = v;
      return new Uint8Array(buffer);
    },
    deserialize: (data) => new Int32Array(data.buffer, data.byteOffset, 1)[0]!
  });
}

/**
 * Create a Rust signal for an i64 value (as BigInt)
 */
export function createI64Signal(
  module: WasmModule,
  initialValue: bigint = 0n
): RustSignal<bigint> {
  return createRustSignal({
    module,
    initialValue,
    byteSize: 8,
    serialize: (v) => {
      const buffer = new ArrayBuffer(8);
      new BigInt64Array(buffer)[0] = v;
      return new Uint8Array(buffer);
    },
    deserialize: (data) => new BigInt64Array(data.buffer, data.byteOffset, 1)[0]!
  });
}

/**
 * Create a Rust signal for an f32 value
 */
export function createF32Signal(
  module: WasmModule,
  initialValue: number = 0
): RustSignal<number> {
  return createRustSignal({
    module,
    initialValue,
    byteSize: 4,
    serialize: (v) => {
      const buffer = new ArrayBuffer(4);
      new Float32Array(buffer)[0] = v;
      return new Uint8Array(buffer);
    },
    deserialize: (data) => new Float32Array(data.buffer, data.byteOffset, 1)[0]!
  });
}

/**
 * Create a Rust signal for an f64 value
 */
export function createF64Signal(
  module: WasmModule,
  initialValue: number = 0
): RustSignal<number> {
  return createRustSignal({
    module,
    initialValue,
    byteSize: 8,
    serialize: (v) => {
      const buffer = new ArrayBuffer(8);
      new Float64Array(buffer)[0] = v;
      return new Uint8Array(buffer);
    },
    deserialize: (data) => new Float64Array(data.buffer, data.byteOffset, 1)[0]!
  });
}

/**
 * Create a Rust signal for a boolean value
 */
export function createBoolSignal(
  module: WasmModule,
  initialValue: boolean = false
): RustSignal<boolean> {
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

export { viteWasmPlugin, type ViteWasmPluginOptions } from './vite-plugin.js';

// ============================================================================
// Export Codegen Utilities
// ============================================================================

export {
  // Type definitions
  type RustType,
  type RustFunction,
  type RustParam,
  type RustStruct,
  type RustField,
  type RustEnum,
  type RustEnumVariant,
  type WasmBindgenAttrs,
  type RustModule,
  type RustImpl,
  type CodegenOptions,
  type CodegenCLIOptions,
  type CodegenResult,

  // Type mapper
  RustToJSMapper,

  // Parser functions
  parseRustType,
  parseRustModule,

  // Code generation functions
  generateTypeScriptTypes,
  generateJSWrapper,
  generateComponentBinding,
  generateSignalBinding,
  generateBindings,
} from './codegen.js';

// ============================================================================
// Utility Types for Rust Interop
// ============================================================================

/**
 * Rust Result type for JS
 */
export type RustResult<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Rust Option type for JS
 */
export type RustOption<T> =
  | { some: true; value: T }
  | { some: false };

/**
 * Create a Rust Result Ok value
 */
export function Ok<T>(value: T): RustResult<T, never> {
  return { ok: true, value };
}

/**
 * Create a Rust Result Err value
 */
export function Err<E>(error: E): RustResult<never, E> {
  return { ok: false, error };
}

/**
 * Create a Rust Option Some value
 */
export function Some<T>(value: T): RustOption<T> {
  return { some: true, value };
}

/**
 * Create a Rust Option None value
 */
export function None<T>(): RustOption<T> {
  return { some: false };
}

/**
 * Unwrap a Rust Result, throwing if Err
 */
export function unwrapResult<T, E>(result: RustResult<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw new Error(`Unwrap failed: ${result.error}`);
}

/**
 * Unwrap a Rust Option, throwing if None
 */
export function unwrapOption<T>(option: RustOption<T>): T {
  if (option.some) {
    return option.value;
  }
  throw new Error('Unwrap failed: None');
}
