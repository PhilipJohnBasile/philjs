# Deployment

## Build

```bash
pnpm build
```

## Static Hosting

If your app is static or pre-rendered, deploy `dist/client` to any CDN.

## SSR Hosting

For SSR, deploy the Node server entry from `dist/server` on a Node 24+ runtime.
