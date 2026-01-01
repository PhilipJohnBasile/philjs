# Property-Based and Fuzz Testing

Use properties to uncover edge cases that example-based tests miss.

## When to use

- Core algorithms (parsers, reducers, diffing/patching).
- Store operations and undo/redo logic.
- Cache invalidation rules and selectors.

## Tooling

- `fast-check` (JS property testing).
- Custom fuzzers for domain-specific inputs.

## Defining properties

- Idempotence: applying the same patch twice yields same result.
- Reversibility: undo after redo returns to initial state.
- Invariants: e.g., cache tags remain unique, totals stay non-negative.

## Example

```ts
import fc from 'fast-check';
import { createStore } from '@philjs/core';

fc.assert(
  fc.property(fc.array(fc.record({ id: fc.string(), done: fc.boolean() })), (todos) => {
    const [, set, store] = createStore({ todos: [] });
    set('todos', todos);
    return store.select(s => s.todos.length) === todos.length;
  })
);
```

## Fuzzing loaders/actions

- Generate random params/query inputs; assert schemas reject bad data.
- Fuzz mutation payloads; ensure server-side validation guards hold.

## Testing guidance

- Limit runs in CI to a sane number; increase locally for deeper checks.
- Shrink failing cases to minimal repro; keep them as fixtures/regression tests.
- Combine with deterministic seed for reproducibility.

## Checklist

- [ ] Properties defined for core invariants.
- [ ] Seeds recorded for failures.
- [ ] Fuzz inputs for loaders/actions and stores.
- [ ] Regression tests added from shrunk counterexamples.
