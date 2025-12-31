# Building for Production

Use the PhilJS CLI to build optimized releases.

```bash
cargo philjs build --release
```

## SSR builds

```bash
cargo philjs build --release --ssr
```

## WASM builds

```bash
wasm-pack build --target web --release
```

## Tips

- Ensure `lto = true` in `Cargo.toml`.
- Keep assets in `static/` for predictable output.
