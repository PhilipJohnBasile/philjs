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
