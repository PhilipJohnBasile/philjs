# Deploying to Vercel

Vercel works well for static + WASM deployments.

## Static Deployment

1. Build your WASM bundle:

```bash
wasm-pack build --target web --release
```

2. Ensure `index.html` references the `pkg/` output.
3. Deploy the project root with the Vercel CLI:

```bash
vercel --prod
```

## SSR Note

Vercel does not run Rust binaries directly. For Rust SSR, deploy the server separately (for example, on a VM or container platform) and point Vercel to the static assets.
