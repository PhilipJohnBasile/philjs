# Effects and Memos

Effects run when signals they read change. Memos cache derived values.

## Effects

```tsx
import { effect, signal } from "@philjs/core";

const count = signal(0);

const dispose = effect(() => {
  console.log("count", count());
});

// Later
// dispose();
```

## Cleanup

```tsx
const stop = effect(() => {
  const id = setInterval(() => console.log(count()), 1000);
  return () => clearInterval(id);
});
```

## Memos

```tsx
import { memo } from "@philjs/core";

const filtered = memo(() => items().filter((item) => item.active));
```
