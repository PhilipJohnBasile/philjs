
# Autonomous Documentation (`@philjs/docs`)

Documentation that writes itself.

## Features

### `generateDocs`
The `generateDocs` function reads your source code, understands the intent via LLM, and generates/updates `README.md` files automatically.

```typescript
import { generateDocs } from '@philjs/docs';
await generateDocs('./src/app.ts');
```
