# philjs-wasm

Rust/WebAssembly integration for PhilJS with reactive signals. This package makes PhilJS the best choice for Rust developers wanting to use WASM in their web applications.

## Features

- **Seamless WASM Loading** - Load WASM modules with streaming compilation and caching
- **Reactive Rust Signals** - Create signals that can be read/written from both Rust and JavaScript
- **Component Integration** - Use WASM modules as PhilJS components
- **Vite Plugin** - First-class Vite integration for WASM loading and HMR
- **Type Safety** - Full TypeScript support with Rust type mappings
- **Memory Management** - Automatic memory allocation/deallocation helpers

## Installation

```bash
npm install philjs-wasm @philjs/core
```

## Quick Start

### Loading a WASM Module

```typescript
import { loadWasm, bindRustFunctions } from 'philjs-wasm';

// Load a WASM module
const module = await loadWasm('/my-module.wasm');

// Bind all exported Rust functions
const rust = bindRustFunctions(module);

// Call Rust functions from JavaScript
const result = rust.calculateSum(1, 2, 3);
```

### Using the useWasm Hook

```typescript
import { useWasm } from 'philjs-wasm';

function MyComponent() {
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
import { createWasmComponent } from 'philjs-wasm';

// Create a component from a WASM module
const Counter = await createWasmComponent('/counter.wasm', {
  renderFn: 'render_counter',
  props: { initialCount: 0 }
});

// Render the component
const html = Counter.render({ count: 5 });
```

### Shared Rust Signals

Create signals that can be read/written from both Rust and JavaScript:

```typescript
import { loadWasm, createI32Signal, createF64Signal } from 'philjs-wasm';

const module = await loadWasm('/counter.wasm');

// Create a shared i32 signal
const count = createI32Signal(module, 0);

// Use from JavaScript
console.log(count()); // 0
count.set(5);

// Pass pointer to Rust for direct memory access
// const ptr = count.ptr();
// module.exports.increment_counter(ptr);

// Sync value from Rust memory
count.syncFromRust();
console.log(count()); // Value updated by Rust
```

## WasmProvider

For application-wide WASM module management:

```tsx
import { WasmProvider, getWasmContext } from 'philjs-wasm';

// In your app root
function App() {
  return (
    <WasmProvider preload={['/crypto.wasm', '/image.wasm']}>
      <MyApp />
    </WasmProvider>
  );
}

// In any component
function MyComponent() {
  const ctx = getWasmContext();
  const module = ctx.getModule('/crypto.wasm');
  // ...
}
```

## Vite Plugin

Add the Vite plugin for seamless WASM integration:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { viteWasmPlugin } from 'philjs-wasm/vite';

export default defineConfig({
  plugins: [
    viteWasmPlugin({
      wasmDir: 'src/wasm',
      generateTypes: true,
      streaming: true,
      cache: true,
      hmr: true, // Enable HMR for WASM in development
      optimize: {
        wasmOpt: true,
        level: 'Os'
      }
    })
  ]
});
```

## API Reference

### Loading Functions

#### `loadWasm(url, options?)`

Load a WASM module from a URL.

```typescript
const module = await loadWasm('/module.wasm', {
  cache: true,        // Cache the loaded module
  timeout: 30000,     // Loading timeout in ms
  initFn: 'init',     // Initialization function to call
  imports: {}         // Custom import object
});
```

#### `unloadWasm(url)`

Unload a cached WASM module.

#### `isWasmLoaded(url)`

Check if a WASM module is loaded.

#### `getWasmModule(url)`

Get a loaded WASM module.

### Component Functions

#### `createWasmComponent(url, options?)`

Create a PhilJS component from a WASM module.

```typescript
const component = await createWasmComponent('/component.wasm', {
  renderFn: 'render',
  props: { /* initial props */ }
});

component.render({ /* new props */ });
component.update({ /* partial props */ });
component.dispose();
```

### Hook Functions

#### `useWasm(url, options?)`

Hook to load and use WASM modules with reactive state.

```typescript
const { data, loading, error, reload } = useWasm('/module.wasm');
```

### Binding Functions

#### `bindRustFunctions(module, options?)`

Bind Rust functions from a WASM module to JavaScript.

```typescript
const rust = bindRustFunctions(module, {
  include: ['add', 'multiply'],    // Only bind these functions
  exclude: ['internal_fn'],        // Exclude these functions
  transformNames: snakeToCamel,    // Transform function names
  wrapErrors: true                 // Wrap errors with context
});
```

### Signal Functions

#### `createRustSignal(options)`

Create a signal that can be shared between Rust and JavaScript.

```typescript
const signal = createRustSignal({
  module,
  initialValue: 0,
  serialize: (v) => /* ... */,
  deserialize: (data) => /* ... */,
  byteSize: 4
});
```

#### Specialized Signal Creators

```typescript
// Integer signals
const i32Signal = createI32Signal(module, 0);
const i64Signal = createI64Signal(module, 0n);

// Float signals
const f32Signal = createF32Signal(module, 0.0);
const f64Signal = createF64Signal(module, 0.0);

// Boolean signal
const boolSignal = createBoolSignal(module, false);
```

### Context Functions

#### `initWasmProvider()`

Initialize the WASM provider context.

#### `getWasmContext()`

Get the current WASM context.

### Rust Type Utilities

```typescript
import { Ok, Err, Some, None, unwrapResult, unwrapOption } from 'philjs-wasm';

// Result type
type RustResult<T, E> = { ok: true; value: T } | { ok: false; error: E };

const result: RustResult<number, string> = Ok(42);
const value = unwrapResult(result); // 42

// Option type
type RustOption<T> = { some: true; value: T } | { some: false };

const option: RustOption<string> = Some('hello');
const str = unwrapOption(option); // 'hello'
```

## Rust Side Integration

Example Rust code for use with philjs-wasm:

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[wasm_bindgen]
pub fn render(props_ptr: *const u8, props_len: usize) -> *mut u8 {
    // Read props JSON from JavaScript
    let props_slice = unsafe {
        std::slice::from_raw_parts(props_ptr, props_len)
    };
    let props_json = std::str::from_utf8(props_slice).unwrap();

    // Generate HTML
    let html = format!("<div>Hello from Rust!</div>");

    // Return HTML with length prefix
    let mut result = Vec::with_capacity(4 + html.len());
    result.extend_from_slice(&(html.len() as u32).to_le_bytes());
    result.extend_from_slice(html.as_bytes());

    let ptr = result.as_mut_ptr();
    std::mem::forget(result);
    ptr
}

// Shared memory signal access
#[wasm_bindgen]
pub fn increment_counter(ptr: *mut i32) {
    unsafe {
        *ptr += 1;
    }
}
```

## TypeScript Types

```typescript
import type {
  WasmModule,
  WasmExports,
  WasmLoadOptions,
  WasmComponentOptions,
  WasmComponent,
  BoundRustFunction,
  BindOptions,
  RustSignal,
  RustSignalOptions,
  WasmContextValue,
  WasmMemoryManager,
  RustResult,
  RustOption
} from 'philjs-wasm';
```

## Memory Management

The package includes a memory manager for safe WASM memory operations:

```typescript
const ctx = getWasmContext();
const { memory } = ctx;

// Allocate memory
const ptr = memory.alloc(module, 1024);

// Copy string to WASM memory
const { ptr: strPtr, len } = memory.copyString(module, 'Hello');

// Read string from WASM memory
const str = memory.readString(module, strPtr, len);

// Copy typed array
const { ptr: arrPtr, len: arrLen } = memory.copyTypedArray(module, new Float32Array([1, 2, 3]));

// Read typed array
const arr = memory.readTypedArray(module, arrPtr, arrLen, Float32Array);

// Free memory
memory.free(module, ptr, 1024);
```

## Best Practices

1. **Preload WASM modules** - Use WasmProvider with preload for critical modules
2. **Use caching** - Enable caching to avoid reloading modules
3. **Handle errors** - Always handle loading errors gracefully
4. **Clean up** - Call dispose() on components when done
5. **Use typed signals** - Use specialized signal creators for better performance
6. **Sync carefully** - Call syncFromRust() after Rust modifies shared memory

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./vite, ./codegen, ./cli
- Source files: packages/philjs-wasm/src/index.ts, packages/philjs-wasm/src/codegen.ts, packages/philjs-wasm/src/cli.ts

### Public API
- Direct exports: BindOptions, BoundFunctions, BoundRustFunction, CodegenCLIOptions, CodegenOptions, CodegenResult, Err, None, Ok, RustEnum, RustEnumVariant, RustField, RustFunction, RustImpl, RustModule, RustOption, RustParam, RustResult, RustSignal, RustSignalOptions, RustStruct, RustToJSMapper, RustType, Some, WasmBindgenAttrs, WasmComponent, WasmComponentOptions, WasmContextValue, WasmExports, WasmLoadOptions, WasmMemoryManager, WasmModule, WasmProvider, WasmProviderProps, WasmResourceState, WbFree, WbMalloc, WbRealloc, bindRustFunctions, createBoolSignal, createF32Signal, createF64Signal, createI32Signal, createI64Signal, createRustSignal, createWasmComponent, generateBindings, generateCommand, generateComponentBinding, generateJSWrapper, generateSignalBinding, generateTypeScriptTypes, getWasmContext, getWasmModule, initWasmProvider, isWasmLoaded, loadWasm, main, parseArgs, parseRustModule, parseRustType, showHelp, showVersion, unloadWasm, unwrapOption, unwrapResult, useWasm, watchCommand
- Re-exported names: // Code generation functions
  generateTypeScriptTypes, // Parser functions
  parseRustType, // Type definitions
  type RustType, // Type mapper
  RustToJSMapper, CodegenCLIOptions, CodegenOptions, CodegenResult, RustEnum, RustEnumVariant, RustField, RustFunction, RustImpl, RustModule, RustParam, RustStruct, ViteWasmPluginOptions, WasmBindgenAttrs, generateBindings, generateComponentBinding, generateJSWrapper, generateSignalBinding, parseRustModule, viteWasmPlugin
- Re-exported modules: ./codegen.js, ./vite-plugin.js
<!-- API_SNAPSHOT_END -->

## License

MIT
