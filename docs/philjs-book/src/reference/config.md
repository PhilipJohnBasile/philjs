# Configuration

PhilJS projects are configured with `philjs.config.ts`.

```ts
import { defineConfig } from "philjs-cli";

export default defineConfig({
  routes: "./src/routes",
  publicDir: "./public",
  build: {
    outDir: "dist",
    ssg: false,
  },
  dev: {
    port: 3000,
    host: "localhost",
  },
});
```

## Route modules

Each route can export a `config` object for caching or runtime hints.

```tsx
export const config = {
  revalidate: 60,
  runtime: "edge",
};
```
