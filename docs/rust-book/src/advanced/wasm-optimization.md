# WASM Optimization

WASM output size and runtime performance matter for production apps.

## Release Builds

```bash
wasm-pack build --target web --release
```

## Cargo Settings

In `Cargo.toml`:

```toml
[profile.release]
opt-level = "z"
lto = true
codegen-units = 1
panic = "abort"
```

## Reduce Imports

Only enable the `web-sys` features you need:

```toml
web-sys = { version = "0.3", features = ["Document", "Window"] }
```

## Analyze Size

Use `wasm-opt` for further size reduction:

```bash
wasm-opt -Oz -o pkg/app_opt.wasm pkg/app_bg.wasm
```
