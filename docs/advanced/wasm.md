# WebAssembly (WASM)

Use WebAssembly to run high-performance Rust or C/C++ code inside PhilJS applications.

## What You'll Learn

- When to choose WASM for performance or portability
- Loading modules with `philjs-wasm`
- Using WASM in components and signals
- Build and bundling considerations

## Quick Start

Load a module and bind its exports:

```ts
import { loadWasm, bindRustFunctions } from 'philjs-wasm';

const module = await loadWasm('/math.wasm');
const rust = bindRustFunctions(module);

const total = rust.sum(1, 2, 3);
```

## useWasm Hook

Use the hook to manage loading state inside components.

```tsx
import { useWasm } from 'philjs-wasm';

function HashDemo() {
  const wasm = useWasm('/crypto.wasm');

  if (wasm.loading) return <div>Loading WASM...</div>;
  if (wasm.error) return <div>Error: {wasm.error.message}</div>;

  const hash = (wasm.data!.exports.sha256 as Function)('hello');
  return <div>Hash: {hash}</div>;
}
```

## Shared Signals

Share state between Rust and PhilJS with typed signals.

```ts
import { loadWasm, createI32Signal } from 'philjs-wasm';

const module = await loadWasm('/counter.wasm');
const count = createI32Signal(module, 0);

count.set(5);
count.syncFromRust();
```

## WASM Components

Render WASM modules as components when you need server-side rendering or reusable UI.

```ts
import { createWasmComponent } from 'philjs-wasm';

const Counter = await createWasmComponent('/counter.wasm', {
  renderFn: 'render_counter',
  props: { initialCount: 0 },
});

const html = Counter.render({ count: 5 });
```

## Vite Plugin

Add the Vite plugin for streaming compilation and HMR.

```ts
import { defineConfig } from 'vite';
import { viteWasmPlugin } from 'philjs-wasm/vite';

export default defineConfig({
  plugins: [
    viteWasmPlugin({
      wasmDir: 'src/wasm',
      generateTypes: true,
      streaming: true,
      cache: true,
      hmr: true,
    }),
  ],
});
```

## Best Practices

- Keep WASM boundaries coarse; batch data to reduce crossings.
- Use Web Workers for long-running computations to avoid blocking the UI.
- Version and cache modules to prevent mismatched exports.
- Validate input sizes to avoid memory pressure.

## Related Topics

- [Web Workers](/docs/advanced/web-workers.md)
- [Performance Optimization](/docs/performance/optimization-guide.md)
- [WASM Package README](/packages/philjs-wasm/README.md)
