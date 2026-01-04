
# Autonomous Performance (`@philjs/perf`)

Self-optimizing runtime.

## AutoOptimize
The `optimizePerformance` function profiles your React components during development. If it detects unnecessary re-renders, it **automatically wraps components** in `React.memo` and inserts `useMemo` hooks into the source code.

```typescript
import { optimizePerformance } from '@philjs/perf';
await optimizePerformance();
```
