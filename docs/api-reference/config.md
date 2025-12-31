# Configuration API Reference

PhilJS configuration reference.

## philjs.config.ts

```js
export default {
  // Routes directory
  routes: './src/routes',

  // Public directory
  public: './public',

  // Build output
  outDir: './dist',

  // Server options
  server: {
    port: 3000,
    host: 'localhost'
  },

  // Build options
  build: {
    target: 'es2020',
    minify: true
  }
};
```

## Route Config

```tsx
// routes/page.tsx
export const config = {
  // Cache configuration
  cache: {
    maxAge: 3600,
    staleWhileRevalidate: 86400
  },

  // Runtime
  runtime: 'edge',

  // Revalidation
  revalidate: 60
};
```

## Next Steps

- [Core API](/docs/api-reference/core.md) - Core APIs

---

ℹ️ **Note**: Configuration is fully typed with TypeScript.
