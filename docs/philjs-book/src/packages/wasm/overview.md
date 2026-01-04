# @philjs/wasm

Rust/WebAssembly integration for PhilJS with reactive signals. This package provides seamless WASM loading, reactive Rust signals, component integration, and first-class Vite support with HMR - making PhilJS the ideal choice for Rust developers building web applications.

## Installation

```bash
npm install @philjs/wasm @philjs/core
```

## Features

- **Seamless WASM Loading** - Load WASM modules with streaming compilation and intelligent caching
- **Reactive Rust Signals** - Create signals that can be read/written from both Rust and JavaScript
- **Component Integration** - Use WASM modules as PhilJS components with full lifecycle support
- **Vite Plugin** - First-class Vite integration for WASM loading, optimization, and HMR
- **Code Generation** - Generate TypeScript bindings from Rust source files
- **Type Safety** - Full TypeScript support with Rust type mappings
- **Memory Management** - Automatic memory allocation/deallocation helpers for safe WASM interop
- **CLI Tools** - Command-line interface for Rust-to-JS code generation

## Quick Start

### Loading a WASM Module

```typescript
import { loadWasm, bindRustFunctions } from '@philjs/wasm';

// Load a WASM module with streaming compilation
const module = await loadWasm('/my-module.wasm');

// Bind all exported Rust functions with automatic name transformation
const rust = bindRustFunctions(module);

// Call Rust functions from JavaScript (snake_case -> camelCase)
const result = rust.calculateSum(1, 2, 3);
```

### Using the useWasm Hook

```typescript
import { useWasm } from '@philjs/wasm';

function CryptoComponent() {
  const wasm = useWasm('/crypto.wasm');

  if (wasm.loading) {
    return <div>Loading WASM...</div>;
  }

  if (wasm.error) {
    return <div>Error: {wasm.error.message}</div>;
  }

  const hash = (wasm.data!.exports.sha256 as Function)('hello');
  return <div>Hash: {hash}</div>;
}
```

### Creating WASM Components

```typescript
import { createWasmComponent } from '@philjs/wasm';

// Create a component from a WASM module
const Counter = await createWasmComponent('/counter.wasm', {
  renderFn: 'render_counter',
  props: { initialCount: 0 }
});

// Render the component with props
const html = Counter.render({ count: 5 });

// Update props
Counter.update({ count: 10 });

// Clean up when done
Counter.dispose();
```

---

## WASM Loading

### loadWasm

Load a WASM module from a URL with streaming compilation support.

```typescript
import { loadWasm } from '@philjs/wasm';

const module = await loadWasm('/module.wasm', {
  cache: true,          // Cache the loaded module (default: true)
  timeout: 30000,       // Loading timeout in ms (default: 30000)
  initFn: 'init',       // Initialization function to call after loading
  imports: {            // Custom import object for WASM
    env: {
      log: (msg: string) => console.log(msg)
    }
  }
});

// Access exports
const result = (module.exports.add as Function)(2, 3);
```

### Module Management Functions

```typescript
import {
  loadWasm,
  unloadWasm,
  isWasmLoaded,
  getWasmModule
} from '@philjs/wasm';

// Load a module
const module = await loadWasm('/my-module.wasm');

// Check if a module is loaded
if (isWasmLoaded('/my-module.wasm')) {
  // Get the cached module
  const cachedModule = getWasmModule('/my-module.wasm');
}

// Unload from cache when no longer needed
unloadWasm('/my-module.wasm');
```

---

## Reactive Rust Signals

Create signals that can be read and written from both Rust and JavaScript, enabling true reactive state sharing between your Rust WASM code and PhilJS's reactive system.

### createRustSignal

Create a generic Rust signal with custom serialization.

```typescript
import { loadWasm, createRustSignal } from '@philjs/wasm';

const module = await loadWasm('/counter.wasm');

// Create a shared signal with custom serialization
const state = createRustSignal({
  module,
  initialValue: { count: 0, name: 'counter' },
  byteSize: 256,
  serialize: (v) => new TextEncoder().encode(JSON.stringify(v)),
  deserialize: (data) => JSON.parse(new TextDecoder().decode(data))
});

// Read and write from JavaScript
console.log(state()); // { count: 0, name: 'counter' }
state.set({ count: 5, name: 'counter' });

// Subscribe to changes
const unsubscribe = state.subscribe((value) => {
  console.log('State changed:', value);
});

// Get memory pointer for Rust access
const ptr = state.ptr();
// Pass ptr to Rust functions for direct memory access

// Sync value after Rust modifies memory
state.syncFromRust();

// Clean up subscription
unsubscribe();
```

### Specialized Signal Creators

Use type-specific signal creators for better performance with primitive types.

```typescript
import {
  loadWasm,
  createI32Signal,
  createI64Signal,
  createF32Signal,
  createF64Signal,
  createBoolSignal
} from '@philjs/wasm';

const module = await loadWasm('/counter.wasm');

// Integer signals (4 bytes)
const count = createI32Signal(module, 0);
count.set(42);
console.log(count()); // 42

// 64-bit integer (8 bytes, uses BigInt)
const bigCount = createI64Signal(module, 0n);
bigCount.set(9007199254740993n);

// Float signals
const temperature = createF32Signal(module, 20.5);  // 4 bytes
const precision = createF64Signal(module, 3.14159265359);  // 8 bytes

// Boolean signal (1 byte)
const isActive = createBoolSignal(module, false);
isActive.set(true);

// All signals support the same API
count.peek();           // Read without tracking
count.subscribe(fn);    // Subscribe to changes
count.ptr();            // Get memory pointer
count.syncFromRust();   // Sync from Rust memory
count.syncToRust();     // Sync to Rust memory
```

### Using Signals with Rust

```rust
use wasm_bindgen::prelude::*;

// Rust can directly access the signal's memory
#[wasm_bindgen]
pub fn increment_counter(ptr: *mut i32) {
    unsafe {
        *ptr += 1;
    }
}

#[wasm_bindgen]
pub fn double_value(ptr: *mut f64) {
    unsafe {
        *ptr *= 2.0;
    }
}
```

```typescript
// JavaScript side
const count = createI32Signal(module, 0);

// Pass pointer to Rust
(module.exports.increment_counter as Function)(count.ptr());

// Sync the value back
count.syncFromRust();
console.log(count()); // 1
```

---

## Function Binding

### bindRustFunctions

Bind Rust functions from a WASM module to JavaScript with automatic name transformation and error handling.

```typescript
import { loadWasm, bindRustFunctions } from '@philjs/wasm';

const module = await loadWasm('/math.wasm');

const math = bindRustFunctions(module, {
  // Only bind these functions
  include: ['add', 'multiply', 'calculate_sum'],

  // Exclude internal functions
  exclude: ['internal_helper'],

  // Transform names (default: snake_case to camelCase)
  transformNames: (name) => name.replace(/_([a-z])/g, (_, l) => l.toUpperCase()),

  // Wrap with error handling (default: true)
  wrapErrors: true
});

// Call bound functions (snake_case -> camelCase)
const sum = math.calculateSum(1, 2, 3, 4, 5);
const product = math.multiply(6, 7);
```

### Bound Function Properties

```typescript
const rust = bindRustFunctions(module);

// Each bound function has metadata
console.log(rust.calculateSum.rustName);  // 'calculate_sum'
console.log(rust.calculateSum.isAsync);   // false
```

---

## WASM Components

### createWasmComponent

Create a PhilJS component from a WASM module with full lifecycle support.

```typescript
import { createWasmComponent } from '@philjs/wasm';

const Counter = await createWasmComponent('/counter.wasm', {
  // Name of the render function in WASM
  renderFn: 'render_counter',

  // Initial props
  props: {
    initialCount: 0,
    step: 1
  },

  // Enable HMR in development
  hmr: true,

  // Standard load options
  cache: true,
  timeout: 30000
});

// Render with current props
const html = Counter.render();

// Render with new props (merges with existing)
const updatedHtml = Counter.render({ count: 10 });

// Update props without rendering
Counter.update({ step: 5 });

// Bind additional Rust functions
const increment = Counter.bindFunction<() => void>('increment');
increment();

// Access the underlying module
const module = Counter.module;

// Clean up
Counter.dispose();
```

### Rust Component Example

```rust
use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct CounterProps {
    count: i32,
    step: Option<i32>,
}

#[wasm_bindgen]
pub fn render_counter(props_ptr: *const u8, props_len: usize) -> *mut u8 {
    // Read props JSON from JavaScript
    let props_slice = unsafe {
        std::slice::from_raw_parts(props_ptr, props_len)
    };
    let props: CounterProps = serde_json::from_slice(props_slice).unwrap();

    // Generate HTML
    let step = props.step.unwrap_or(1);
    let html = format!(
        r#"<div class="counter">
            <span class="count">{}</span>
            <button onclick="increment()">+{}</button>
        </div>"#,
        props.count, step
    );

    // Return HTML with length prefix
    let mut result = Vec::with_capacity(4 + html.len());
    result.extend_from_slice(&(html.len() as u32).to_le_bytes());
    result.extend_from_slice(html.as_bytes());

    let ptr = result.as_mut_ptr();
    std::mem::forget(result);
    ptr
}

#[wasm_bindgen]
pub fn dispose() {
    // Cleanup logic here
}
```

---

## WasmProvider Context

For application-wide WASM module management, use the WasmProvider context.

### Provider Setup

```tsx
import { WasmProvider, getWasmContext } from '@philjs/wasm';

// In your app root
function App() {
  return (
    <WasmProvider preload={['/crypto.wasm', '/image.wasm']}>
      <MyApp />
    </WasmProvider>
  );
}
```

### Using the Context

```typescript
import { getWasmContext, initWasmProvider } from '@philjs/wasm';

// Initialize manually (called automatically by WasmProvider)
initWasmProvider();

// Get the context anywhere in your app
const ctx = getWasmContext();

// Load modules through context
const module = await ctx.loadModule('/crypto.wasm');

// Check module status
if (ctx.isLoaded('/crypto.wasm')) {
  const cachedModule = ctx.getModule('/crypto.wasm');
}

// Unload modules
ctx.unloadModule('/crypto.wasm');

// Access memory manager
const { memory } = ctx;
```

### Memory Management

```typescript
const ctx = getWasmContext();
const { memory } = ctx;

// Allocate memory in WASM
const ptr = memory.alloc(module, 1024);

// Copy string to WASM memory
const { ptr: strPtr, len } = memory.copyString(module, 'Hello from JS');

// Read string from WASM memory
const str = memory.readString(module, strPtr, len);

// Copy typed array to WASM
const floats = new Float32Array([1.0, 2.0, 3.0, 4.0]);
const { ptr: arrPtr, len: arrLen } = memory.copyTypedArray(module, floats);

// Read typed array from WASM
const result = memory.readTypedArray(module, arrPtr, arrLen, Float32Array);

// Free memory when done
memory.free(module, ptr, 1024);
memory.free(module, strPtr, len);
```

---

## Vite Plugin

Add the Vite plugin for seamless WASM integration with HMR support.

### Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { viteWasmPlugin } from '@philjs/wasm/vite';

export default defineConfig({
  plugins: [
    viteWasmPlugin({
      // Directory containing WASM files
      wasmDir: 'src/wasm',

      // File patterns to include
      include: ['**/*.wasm'],

      // File patterns to exclude
      exclude: ['node_modules/**'],

      // Enable streaming compilation (default: true)
      streaming: true,

      // Enable module caching (default: true)
      cache: true,

      // Generate TypeScript type definitions (default: true)
      generateTypes: true,

      // Enable HMR in development (default: true)
      hmr: true,

      // WASM optimization settings
      optimize: {
        // Enable wasm-opt (requires wasm-opt installed)
        wasmOpt: true,
        // Optimization level: 'O0' | 'O1' | 'O2' | 'O3' | 'Os' | 'Oz'
        level: 'Os',
        // Strip debug information (default: true)
        stripDebug: true
      },

      // Debug mode
      debug: false
    })
  ]
});
```

### Helper Function

```typescript
import { createWasmConfig } from '@philjs/wasm/vite';

// Create optimized Vite config for WASM
export default defineConfig({
  ...createWasmConfig({
    wasmDir: 'src/wasm',
    generateTypes: true
  })
});
```

### Import WASM in Your Code

```typescript
// The plugin transforms WASM imports automatically
import module from './counter.wasm';

// Or use inline loading with ?wasm query
import { init } from './counter.wasm?wasm';
const module = await init();
```

---

## Code Generation

Generate TypeScript bindings from Rust source files for type-safe WASM integration.

### CLI Usage

```bash
# Generate bindings from a Rust file
npx philjs-wasm generate src/lib.rs

# Generate with custom output path
npx philjs-wasm generate src/lib.rs -o src/bindings.ts

# Watch directory for changes
npx philjs-wasm watch src/rust

# Generate without PhilJS component bindings
npx philjs-wasm generate src/lib.rs --no-philjs

# Generate without signal bindings
npx philjs-wasm generate src/lib.rs --no-signals

# Verbose output
npx philjs-wasm generate src/lib.rs -v
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <file>` | Output file path | `<input>.ts` |
| `-t, --typescript` | Generate TypeScript types | `true` |
| `--no-typescript` | Disable TypeScript generation | - |
| `-p, --philjs` | Generate PhilJS component bindings | `true` |
| `--no-philjs` | Disable PhilJS bindings | - |
| `-s, --signals` | Generate signal bindings | `true` |
| `--no-signals` | Disable signal bindings | - |
| `-v, --verbose` | Verbose output | `false` |
| `-h, --help` | Show help message | - |
| `-V, --version` | Show version | - |

### Programmatic Usage

```typescript
import {
  generateBindings,
  parseRustModule,
  generateTypeScriptTypes,
  generateJSWrapper,
  generateComponentBinding,
  generateSignalBinding,
  RustToJSMapper
} from '@philjs/wasm/codegen';

// Generate all bindings from Rust code
const bindings = generateBindings(rustCode, {
  typescript: true,
  philjs: true,
  signals: true,
  jsdoc: true,
  indent: '  '
});

// Parse Rust module for more control
const module = parseRustModule(rustCode);

// Generate just TypeScript types
const types = generateTypeScriptTypes(module, {
  typeMapper: new RustToJSMapper(),
  jsdoc: true
});

// Generate wrapper for a specific function
const wrapper = generateJSWrapper(module.functions[0], {
  moduleName: 'wasmModule'
});

// Generate component binding for a struct
const componentBinding = generateComponentBinding(
  struct,
  methods,
  { philjs: true }
);

// Generate signal bindings for a struct
const signalBinding = generateSignalBinding(struct);
```

### Custom Type Mapping

```typescript
import { RustToJSMapper, parseRustType } from '@philjs/wasm/codegen';

const mapper = new RustToJSMapper({
  // Custom type mappings
  'MyCustomType': 'MyJSType',
  'RustDateTime': 'Date'
});

// Add mappings dynamically
mapper.addMapping('UserId', 'string');

// Map a type string
const tsType = mapper.mapTypeString('Vec<MyCustomType>'); // 'MyJSType[]'

// Map a parsed type
const parsed = parseRustType('Option<String>');
const mapped = mapper.mapType(parsed); // 'string | null'
```

---

## Rust Type Utilities

Utilities for working with Rust's Result and Option types in JavaScript.

### Result Type

```typescript
import {
  Ok,
  Err,
  unwrapResult,
  type RustResult
} from '@philjs/wasm';

// Create Result values
const success: RustResult<number, string> = Ok(42);
const failure: RustResult<number, string> = Err('Something went wrong');

// Check and unwrap
if (success.ok) {
  console.log(success.value); // 42
}

if (!failure.ok) {
  console.log(failure.error); // 'Something went wrong'
}

// Unwrap (throws if Err)
try {
  const value = unwrapResult(success); // 42
  const willThrow = unwrapResult(failure); // throws Error
} catch (e) {
  console.error(e.message); // 'Unwrap failed: Something went wrong'
}
```

### Option Type

```typescript
import {
  Some,
  None,
  unwrapOption,
  type RustOption
} from '@philjs/wasm';

// Create Option values
const someValue: RustOption<string> = Some('hello');
const noValue: RustOption<string> = None();

// Check and unwrap
if (someValue.some) {
  console.log(someValue.value); // 'hello'
}

if (!noValue.some) {
  console.log('No value present');
}

// Unwrap (throws if None)
try {
  const value = unwrapOption(someValue); // 'hello'
  const willThrow = unwrapOption(noValue); // throws Error
} catch (e) {
  console.error(e.message); // 'Unwrap failed: None'
}
```

---

## Types Reference

### Core Types

```typescript
// WASM module representation
interface WasmModule {
  instance: WebAssembly.Instance;
  module: WebAssembly.Module;
  memory: WebAssembly.Memory;
  exports: WasmExports;
}

// WASM exports type
type WasmExports = Record<string, WebAssembly.ExportValue>;

// Load options
interface WasmLoadOptions {
  imports?: WebAssembly.Imports;
  cache?: boolean;
  timeout?: number;
  initFn?: string;
}

// Component options
interface WasmComponentOptions extends WasmLoadOptions {
  props?: Record<string, unknown>;
  renderFn?: string;
  hmr?: boolean;
}
```

### Signal Types

```typescript
// Rust signal interface
interface RustSignal<T> {
  (): T;                                      // Read value
  set: (value: T | ((prev: T) => T)) => void; // Set value
  peek: () => T;                              // Read without tracking
  subscribe: (fn: (value: T) => void) => () => void;
  ptr: () => number;                          // Get memory pointer
  syncFromRust: () => void;                   // Sync from Rust
  syncToRust: () => void;                     // Sync to Rust
}

// Signal creation options
interface RustSignalOptions<T> {
  module: WasmModule;
  initialValue: T;
  serialize?: (value: T) => Uint8Array;
  deserialize?: (data: Uint8Array) => T;
  byteSize?: number;
}
```

### Binding Types

```typescript
// Bound Rust function
interface BoundRustFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  rustName: string;
  isAsync: boolean;
}

// Bind options
interface BindOptions {
  include?: string[];
  exclude?: string[];
  transformNames?: (name: string) => string;
  wrapErrors?: boolean;
}
```

### Component Types

```typescript
// WASM component
interface WasmComponent {
  module: WasmModule;
  render: (props?: Record<string, unknown>) => string;
  update: (props: Record<string, unknown>) => void;
  dispose: () => void;
  bindFunction: <T extends (...args: any[]) => any>(name: string) => BoundRustFunction<T>;
}

// Resource state (from useWasm)
interface WasmResourceState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}
```

### Context Types

```typescript
// WASM context
interface WasmContextValue {
  modules: Map<string, WasmModule>;
  loadModule: (url: string, options?: WasmLoadOptions) => Promise<WasmModule>;
  unloadModule: (url: string) => void;
  getModule: (url: string) => WasmModule | undefined;
  isLoaded: (url: string) => boolean;
  memory: WasmMemoryManager;
}

// Memory manager
interface WasmMemoryManager {
  alloc: (module: WasmModule, size: number) => number;
  free: (module: WasmModule, ptr: number, size: number) => void;
  copyString: (module: WasmModule, str: string) => { ptr: number; len: number };
  readString: (module: WasmModule, ptr: number, len: number) => string;
  copyTypedArray: <T extends ArrayBufferView>(module: WasmModule, array: T) => { ptr: number; len: number };
  readTypedArray: <T extends ArrayBufferView>(
    module: WasmModule,
    ptr: number,
    len: number,
    TypedArrayConstructor: new (buffer: ArrayBuffer, byteOffset: number, length: number) => T
  ) => T;
}

// Provider props
interface WasmProviderProps {
  children?: unknown;
  preload?: string[];
}
```

### Vite Plugin Types

```typescript
interface ViteWasmPluginOptions {
  wasmDir?: string;
  include?: string[];
  exclude?: string[];
  streaming?: boolean;
  cache?: boolean;
  generateTypes?: boolean;
  optimize?: {
    wasmOpt?: boolean;
    level?: 'O0' | 'O1' | 'O2' | 'O3' | 'Os' | 'Oz';
    stripDebug?: boolean;
  };
  hmr?: boolean;
  debug?: boolean;
}
```

### Codegen Types

```typescript
// Parsed Rust type
interface RustType {
  raw: string;
  name: string;
  generics?: RustType[];
  isReference?: boolean;
  isMutable?: boolean;
  lifetime?: string;
  isOptional?: boolean;
  isResult?: boolean;
}

// Parsed Rust function
interface RustFunction {
  name: string;
  rustName: string;
  doc?: string;
  isAsync: boolean;
  isPublic: boolean;
  hasWasmBindgen: boolean;
  wasmBindgenAttrs?: WasmBindgenAttrs;
  params: RustParam[];
  returnType?: RustType;
  generics?: string[];
}

// Parsed Rust struct
interface RustStruct {
  name: string;
  rustName: string;
  doc?: string;
  isPublic: boolean;
  hasWasmBindgen: boolean;
  wasmBindgenAttrs?: WasmBindgenAttrs;
  fields: RustField[];
  generics?: string[];
  derives?: string[];
}

// Parsed Rust enum
interface RustEnum {
  name: string;
  rustName: string;
  doc?: string;
  isPublic: boolean;
  hasWasmBindgen: boolean;
  wasmBindgenAttrs?: WasmBindgenAttrs;
  variants: RustEnumVariant[];
  generics?: string[];
}

// Codegen options
interface CodegenOptions {
  typescript?: boolean;
  jsdoc?: boolean;
  typeMapper?: RustToJSMapper;
  moduleName?: string;
  philjs?: boolean;
  signals?: boolean;
  indent?: string;
}
```

---

## API Reference

| Function | Description |
|----------|-------------|
| `loadWasm(url, options?)` | Load a WASM module from URL |
| `unloadWasm(url)` | Unload a cached WASM module |
| `isWasmLoaded(url)` | Check if a module is loaded |
| `getWasmModule(url)` | Get a loaded WASM module |
| `createWasmComponent(url, options?)` | Create a component from WASM |
| `useWasm(url, options?)` | Hook for reactive WASM loading |
| `bindRustFunctions(module, options?)` | Bind Rust functions to JS |
| `createRustSignal(options)` | Create a shared Rust signal |
| `createI32Signal(module, initial?)` | Create an i32 signal |
| `createI64Signal(module, initial?)` | Create an i64 signal (BigInt) |
| `createF32Signal(module, initial?)` | Create an f32 signal |
| `createF64Signal(module, initial?)` | Create an f64 signal |
| `createBoolSignal(module, initial?)` | Create a boolean signal |
| `initWasmProvider()` | Initialize the WASM provider |
| `getWasmContext()` | Get the WASM context |
| `WasmProvider(props)` | Provider component |
| `Ok(value)` | Create a Result Ok value |
| `Err(error)` | Create a Result Err value |
| `Some(value)` | Create an Option Some value |
| `None()` | Create an Option None value |
| `unwrapResult(result)` | Unwrap a Result (throws on Err) |
| `unwrapOption(option)` | Unwrap an Option (throws on None) |
| `viteWasmPlugin(options?)` | Vite plugin for WASM |
| `createWasmConfig(options?)` | Create Vite config for WASM |
| `generateBindings(code, options?)` | Generate bindings from Rust |
| `parseRustModule(code)` | Parse Rust module |
| `generateTypeScriptTypes(module, options?)` | Generate TS types |
| `generateJSWrapper(fn, options?)` | Generate JS wrapper |
| `generateComponentBinding(struct, methods?, options?)` | Generate component binding |
| `generateSignalBinding(struct, options?)` | Generate signal binding |
| `parseRustType(typeStr)` | Parse a Rust type string |
| `RustToJSMapper` | Type mapper class |

---

## Best Practices

1. **Preload Critical Modules** - Use WasmProvider with preload for modules needed at startup
2. **Enable Caching** - Keep caching enabled to avoid reloading modules on re-renders
3. **Handle Errors Gracefully** - Always handle loading errors in your UI
4. **Clean Up Components** - Call dispose() on WASM components when unmounting
5. **Use Typed Signals** - Use specialized signal creators (createI32Signal, etc.) for better performance
6. **Sync Carefully** - Call syncFromRust() after Rust modifies shared memory
7. **Generate Types** - Use the CLI to generate TypeScript bindings for type safety
8. **Optimize in Production** - Enable wasm-opt in the Vite plugin for production builds
