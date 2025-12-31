# Signals and Reactivity

Signals are the core reactive primitive in PhilJS. They are functions you call to read, and they expose a `.set` method to update.

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
