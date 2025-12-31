# Deployment

PhilJS supports static, SSR, and hybrid deployments.

## Build

```bash
pnpm build
```

## Preview

```bash
pnpm dev
pnpm build
philjs preview
```

## Configure output

`philjs.config.ts`

```ts
import { defineConfig } from "philjs-cli";

export default defineConfig({
  build: {
    outDir: "dist",
    ssg: false,
  },
  dev: {
    port: 3000,
  },
});
```

## Runtime requirements

- Node 24+ for SSR runtimes
- Edge targets when using `@philjs/ssr` worker adapters
