# Generative Testing (FuzzAI)

PhilJS introduces **FuzzAI**, a next-generation testing tool that uses LLMs to autonomously generate edge cases, fuzz inputs, and even attempt to fix broken tests.

## Why FuzzAI?

Traditional fuzzing sends random bytes (`0xFFFF`, `null`, `""`). FuzzAI sends *semantically valid but problematic* inputs:
-   A JSON payload with recursive structures.
-   A SQL injection string in a username field.
-   A date string in a slightly wrong format (`YYYY/MM/DD` vs `YYYY-MM-DD`).

## Usage

### `fuzz`

Decorate your test with `fuzz` to run it against generated inputs.

```typescript
import { fuzz, expect } from '@philjs/testing';
import { z } from 'zod';
import { calculateDiscount } from './pricing';

const UserSchema = z.object({
  age: z.number().min(0),
  history: z.array(z.string())
});

// Run 50 AI-generated scenarios
test.fuzz('pricing logic', { schema: UserSchema, iterations: 50 }, (input) => {
  const result = calculateDiscount(input);
  expect(result).toBeGreaterThanOrEqual(0);
});
```

### `fuzzAI` (Autonomuous)

Let the AI determine the schema from the function signature.

```typescript
import { fuzzAI } from '@philjs/testing';
import { parseCSV } from './parser';

// "Hallucinate 100 weird CSV strings and feed them to parseCSV"
await fuzzAI(parseCSV, { 
  iterations: 100,
  context: "This parser should handle quoted fields and newlines."
});
```

## Auto-Fixing Tests

When a test fails, you can run with `--fix` to let FuzzAI attempt to patch the test or the code.

```bash
npm test -- --fix
```

It analyzes the stack trace and the source code.

**Example Patch Suggested:**
```diff
- expect(result).toBe(100);
+ expect(result).toBeCloseTo(100, 2); // Floating point error detected
```

## Best Practices

-   **Deterministic Replays**: FuzzAI logs the seed of every run. If a failure occurs, re-run with that seed to reproduce.
-   **Narrow Scope**: Fuzz pure functions (utils, validators) rather than full integration flows for best results.
