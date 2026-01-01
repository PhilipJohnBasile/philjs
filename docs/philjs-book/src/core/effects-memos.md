# Effects and Memos

Use effects for side effects, and memos for derived values that should update automatically.

## Effects

```tsx
import { effect, onCleanup, signal } from "@philjs/core";

const online = signal(true);

const dispose = effect(() => {
  const handler = () => online.set(navigator.onLine);
  window.addEventListener("online", handler);
  window.addEventListener("offline", handler);

  onCleanup(() => {
    window.removeEventListener("online", handler);
    window.removeEventListener("offline", handler);
  });
});
```

## Memos

```tsx
import { memo, signal } from "@philjs/core";

const count = signal(1);
const doubled = memo(() => count() * 2);
```

## Manage effect lifetimes

```tsx
import { createRoot, effect, signal } from "@philjs/core";

const count = signal(0);

const dispose = createRoot(() => {
  effect(() => console.log("count", count()));
  return () => {};
});

// Later
// dispose();
```

## When to use what

- **effect**: DOM/event listeners, logging, network calls, imperative bridges.
- **memo**: derived values that should stay in sync with dependencies.
- **resource**: async data with loading/error states.
- **linkedSignal**: writable computed with override/reset behavior.

## Avoiding pitfalls

- Do not perform heavy computation inside effects; compute in memos.
- Avoid async effects; use resources or actions instead.
- Clean up listeners with `onCleanup` to prevent leaks.
- Keep dependency graphs shallow; break large effects into smaller ones.

## Untracking in effects

Use `untrack` to read without subscribing:

```tsx
effect(() => {
  const value = untrack(() => expensiveSignal());
  console.log(value);
});
```

## Testing effects and memos

```tsx
import { describe, it, expect, vi } from 'vitest';
import { effect, memo, signal } from '@philjs/core';

describe('effects', () => {
  it('runs when dependencies change', () => {
    const a = signal(1);
    const spy = vi.fn();
    effect(() => spy(a()));
    a.set(2);
    expect(spy).toHaveBeenCalledTimes(2); // initial + update
  });
});
```

## Checklist

- [ ] Side effects live in `effect`; derived values in `memo`.
- [ ] Effects cleaned up via `onCleanup`.
- [ ] No async work inside effects; use resources/actions.
- [ ] Expensive reads wrapped in memos to avoid churn.

## Try it now: memo + effect combo

```tsx
const count = signal(0);
const label = memo(() => `Count is ${count()}`);

effect(() => {
  document.title = label(); // derived value used in side effect
});
```

Click a button to change `count` and watch both the UI and document title stay in sync.
