
# Self-Optimizing Database (`@philjs/db`)

A database that learns query patterns.

## AutoIndex
The `optimizeSchema` function analyzes your query logs and automatically creates or drops indexes to maximize performance.

```typescript
import { optimizeSchema } from '@philjs/db';
await optimizeSchema();
```
