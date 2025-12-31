# Deploying to Cloudflare

Cloudflare Pages is a good fit for static + WASM deployments.

## Cloudflare Pages

1. Build your WASM bundle:

```bash
wasm-pack build --target web --release
```

2. Push `index.html` and `pkg/` to your Pages project.
3. Set the output directory to the project root.

## Workers

If you need edge logic, add a Worker for API routes and keep the Rust UI as static assets.
