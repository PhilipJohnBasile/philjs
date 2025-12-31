# Signals and Reactivity

Signals are the core primitive in PhilJS. They hold values and trigger precise updates.

## Creating Signals

```tsx
import { signal } from "@philjs/core";

const count = signal(0);
const name = signal("PhilJS");
```

## Reading and Writing

```tsx
count();
count.set(count() + 1);
```

## Derived Values

```tsx
import { memo } from "@philjs/core";

const doubled = memo(() => count() * 2);
```

## Batched Updates

```tsx
import { batch } from "@philjs/core";

batch(() => {
  count.set(1);
  name.set("Next");
});
```
