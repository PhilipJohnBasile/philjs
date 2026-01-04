
# Self-Healing Security (`@philjs/security`)

Security that sleeps with one eye open.

## AutoSAST
The `scanAndPatch` system runs continuously in the background. If it detects a vulnerability (e.g., SQL Injection pattern), it **rewrites the code** to use parameterized queries and commits the fix.

```typescript
import { scanAndPatch } from '@philjs/security';
await scanAndPatch();
```
