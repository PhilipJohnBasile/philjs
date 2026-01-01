# WebAssembly (WASM)

Use WASM to speed up CPU-heavy tasks (parsing, math, image/voice processing) while PhilJS handles UI and orchestration.

## When to reach for WASM

- Hot loops where JS perf isn’t enough.
- Reusing existing Rust/Go/C++ logic.
- Deterministic compute (e.g., codecs, parsers).

## Build and load

- Compile with target `wasm32-unknown-unknown` (Rust) or Emscripten/Go as needed.
- Use `import` with `WebAssembly.instantiateStreaming` where supported.
- Keep WASM modules small; split features if needed.

## Passing data

- Use `Uint8Array`/`Float32Array` for buffers.
- Avoid round-tripping large blobs; batch work per call.
- For strings, standardize encoding (UTF-8) and helpers.

## Threading and SIMD

- Enable WASM threads (SharedArrayBuffer) where allowed; check COOP/COEP headers.
- Use SIMD flags for vectorized workloads if supported by target browsers.

## SSR and islands

- Avoid executing WASM during SSR; load in islands after hydration or on interaction.
- For edge runtimes, ensure WASM bundle is small and supported by the platform.

## Testing

- Unit-test WASM functions with deterministic inputs/outputs.
- Benchmark critical functions and compare to JS fallbacks.
- In Playwright, ensure WASM loads and runs on target browsers; provide fallbacks when blocked.

## Security

- Validate untrusted inputs before passing to WASM.
- Keep WASM modules signed/versioned; avoid dynamic code fetch from untrusted origins.
- Beware of large memory allocations; set sane limits and monitor in performance tools.
