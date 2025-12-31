# Building for Production

Production builds include optimized WASM and (optionally) SSR binaries.

## WASM Build

```bash
wasm-pack build --target web --release
```

The output lives in `pkg/`. Serve `index.html` and the `pkg/` folder as static assets.

## SSR Build

If you run a Rust SSR server:

```bash
cargo build --release --features ssr
```

You can deploy the resulting binary alongside your static assets.
