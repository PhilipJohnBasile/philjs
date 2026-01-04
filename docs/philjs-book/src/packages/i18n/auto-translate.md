
# Real-time Translation (`@philjs/i18n`)

No more JSON files.

## AutoTranslate
The `translateUI` function translates text on the fly using context-aware AI models, handling slang and idioms correctly.

```typescript
import { translateUI } from '@philjs/i18n';
const greeting = await translateUI("What's up?", "fr"); // "Quoi de neuf?"
```
