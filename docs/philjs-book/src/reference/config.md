# Config

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "preserve",
    "jsxImportSource": "@philjs/core",
    "strict": true
  }
}
```

## vite.config.ts

```ts
import { defineConfig } from "vite";
import philjs from "@philjs/core/vite";

export default defineConfig({
  plugins: [philjs()],
});
```
