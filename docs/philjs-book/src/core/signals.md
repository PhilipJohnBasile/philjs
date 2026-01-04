# Signals and Reactivity

Signals are the core reactive primitive in PhilJS. Unlike React hooks, they are **fine-grained**: when a signal changes, only the specific text node or attribute that uses it updates. The component itself does **not** re-render.
This matches the performance of SolidJS (consistently benchmarking 10x faster than Virtual DOM approaches) while maintaining a familiar DX.

They are functions you call to read, and they expose a `.set` method to update.

## Basic signal

```tsx
import { signal } from "@philjs/core";

const count = signal(0);

count();       // 0
count.set(1);  // update
```

## Derived values with `memo`

```tsx
import { memo, signal } from "@philjs/core";

const price = signal(49);
const tax = memo(() => price() * 0.0825);
const total = memo(() => price() + tax());
```

## Writable computed values

```tsx
import { linkedSignal, signal } from "@philjs/core";

const first = signal("Ada");
const last = signal("Lovelace");
const full = linkedSignal(() => `${first()} ${last()}`);

full();            // "Ada Lovelace"
full.set("A. L."); // override
full.reset();      // back to computed
```

## Batch updates

```tsx
import { batch, signal } from "@philjs/core";

const first = signal("Ada");
const last = signal("Lovelace");

batch(() => {
  first.set("Grace");
  last.set("Hopper");
});
```

## Read without tracking

```tsx
import { signal, untrack } from "@philjs/core";

const count = signal(0);
const safeRead = () => untrack(() => count());
```

## Async data with resources

```tsx
import { resource, signal } from "@philjs/core";

const userId = signal("u_1");
const user = resource(async () => {
  const res = await fetch(`/api/users/${userId()}`);
  return res.json();
});
```

## Effects

Effects run when dependencies change—use them only for side effects (logging, DOM, network), not for computing values.

```tsx
import { effect } from '@philjs/core';

effect(() => {
  console.log('User changed', userId());
});
```

Keep effects lean; prefer `memo`/resources for derived data.

## Best practices

- **Read first, set second**: avoid reading signals inside setters unless wrapped in `batch`.
- **Prefer memos** for derived values; avoid recomputing in render.
- **Keep graphs shallow**: many small signals beat one large object with deep paths.
- **Avoid async in effects**; use resources or actions instead.
- **Use `untrack`** when you need to read without subscribing (e.g., logging).

## Testing signals

```tsx
import { describe, it, expect } from 'vitest';
import { signal, memo, batch } from '@philjs/core';

describe('signals', () => {
  it('updates memos once per batch', () => {
    const a = signal(1);
    const b = signal(2);
    const sum = memo(() => a() + b());
    batch(() => { a.set(3); b.set(4); });
    expect(sum()).toBe(7);
  });
});
```

## Performance tips

- Batch related updates to avoid redundant recomputation.
- Favor primitive values over giant objects; if using objects, update by path to avoid churn.
- In lists, keep stable keys and avoid recreating signal containers per render if not needed.

## Checklist

- [ ] Derived data uses `memo` or `linkedSignal`, not effects.
- [ ] Expensive reads wrapped in memos.
- [ ] Batch multiple writes.
- [ ] `untrack` used when reading without subscribing.
- [ ] Tests cover memo recomputation and batching.

## Try it now: optimistic counter with batch

```tsx
const counter = signal(0);
const double = memo(() => counter() * 2);

function incrementMany(n: number) {
  batch(() => {
    for (let i = 0; i < n; i++) counter.update(v => v + 1);
  });
}
```

Call `incrementMany(5)` and assert `double()` reflects the batched result with a single recompute.
