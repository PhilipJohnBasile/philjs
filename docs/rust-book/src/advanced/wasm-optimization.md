# WASM Optimization

WASM bundles can be made extremely small with a few settings.

## Recommended Cargo settings

```toml
[profile.release]
lto = true
opt-level = "z"
codegen-units = 1
```

## wasm-pack

```bash
wasm-pack build --target web --release
```

## wasm-opt

```bash
wasm-opt -Oz -o pkg/app_bg.wasm pkg/app_bg.wasm
```

## Tips

- Avoid large allocations in render loops.
- Keep feature flags minimal in release builds.
