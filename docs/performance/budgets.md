# Performance Budgets

Set and enforce performance budgets to maintain fast applications.

## Setting Budgets

### Configure Budgets

```js
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  performance: {
    maxEntrypointSize: 250000, // 250kb
    maxAssetSize: 100000 // 100kb
  }
};
```

## Monitoring Budgets

### CI Integration

```yaml
# .github/workflows/budget.yml
name: Performance Budget

on: [pull_request]

jobs:
  budget:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm run build
      - run: npm run budget-check
```

## Best Practices

### ✅ Do: Set Realistic Budgets

```js
// ✅ Good - achievable targets
budgets: {
  bundle: 250, // 250kb
  initial: 100 // 100kb
}
```

## Next Steps

- [Bundle Size](/docs/performance/bundle-size.md) - Optimize bundle
- [Web Vitals](/docs/performance/web-vitals.md) - Monitor vitals

---

💡 **Tip**: Set budgets early and enforce them in CI.

⚠️ **Warning**: Budgets should be challenging but achievable.

ℹ️ **Note**: Performance budgets prevent performance regression.
