# Debugging

Use Rust tooling plus browser diagnostics when running in WASM.

## Panic hooks

```rust
use console_error_panic_hook;

console_error_panic_hook::set_once();
```

## Logging

```rust
use tracing::info;

info!("Hydration complete");
```

## Tips

- Use `RUST_LOG=info` on the server.
- Inspect rendered HTML for hydration mismatches.
