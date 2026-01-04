# Deploying to Vercel

PhilJS Rust apps can be deployed with the CLI or a custom build pipeline.

## CLI deployment

```bash
cargo philjs deploy --platform=vercel
```

## Manual flow

1. Build the SSR binary and WASM bundle.
2. Upload the server binary and `static/` assets.
3. Ensure Node 24+ on the runtime if you use TS tooling.
