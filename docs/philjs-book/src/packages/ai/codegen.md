# AI Code Generation

`@philjs/ai` provides a CodeGenerator that turns descriptions into production-ready PhilJS code. It focuses on signals-first state, type-safe output, and repeatable results.

## Create a generator

```ts
import { createOpenAIProvider, createCodeGenerator } from '@philjs/ai';

const provider = createOpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });
const codegen = createCodeGenerator(provider, {
  temperature: 0.2,
  maxTokens: 4096
});

const result = await codegen.generateComponent(
  'A counter with increment and decrement buttons',
  {
    useSignals: true,
    includeTypes: true,
    includeJSDoc: true,
    styleApproach: 'inline'
  }
);

console.log(result.code);
```

## Common tasks

### Generate a function

```ts
const fn = await codegen.generateFunction(
  'Parse a currency string into cents with validation',
  { name: 'parseCurrency' }
);

console.log(fn.signature);
```

### Refactor code

```ts
const refactor = await codegen.refactorCode(
  sourceCode,
  'Replace manual subscriptions with signals and effects'
);

console.log(refactor.refactored);
```

### Explain code

```ts
const explanation = await codegen.explainCode(sourceCode, {
  detailLevel: 'detailed'
});
```

### Generate tests

```ts
const tests = await codegen.generateTests(sourceCode, 'unit');
console.log(tests.code);
```

## Options that matter

`CodeGenOptions` controls the output:

- `includeTypes` and `includeJSDoc` for type-rich results.
- `useSignals` to prefer @philjs/core for state.
- `framework` for `philjs` or `react-compat`.
- `styleApproach` for Tailwind, CSS modules, inline styles, or none.

## Validation helpers

`@philjs/ai` exposes parsing utilities to validate model output.

```ts
import { extractCode, extractJSON, validateCode } from '@philjs/ai';

const code = extractCode(modelText);
const validation = validateCode(code);

if (!validation.valid) {
  console.warn(validation.errors);
}
```

## Next steps

- Streaming completions: [AI streaming](./streaming.md)
- Retrieval pipelines: [RAG](./rag.md)
- Tool calling: [Tools](./tools.md)
