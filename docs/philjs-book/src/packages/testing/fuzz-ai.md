
# Generative Testing (`@philjs/test`)

PhilJS changes testing from "writing assertions" to "defining intent".

## FuzzAI
`fuzzAI` uses an LLM to hallucinate edge cases (SQL inputs, buffer overflows, weird JSON) and tests your functions against them.

```typescript
import { fuzzAI } from '@philjs/test';

await fuzzAI(myFunction, { iterations: 100 });
```

## AutoFix
When a test fails, `attemptTestFix` kicks in. It analyzes the stack trace and patches the test code (e.g., increasing timeouts, fixing regex).
