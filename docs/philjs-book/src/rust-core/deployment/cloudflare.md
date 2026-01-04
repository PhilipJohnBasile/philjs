# Deploying to Cloudflare

Use the Cloudflare target for edge deployment.

```bash
cargo philjs build --target=cloudflare
wrangler deploy
```

## Notes

- Ensure `wrangler.toml` points to the generated worker bundle.
- Keep WASM size small for faster cold starts.
