# Effects and lifecycle

Effects run when their dependencies change and can register cleanup handlers.

## effect and onCleanup

```ts
import { effect, onCleanup, signal } from '@philjs/core';

const count = signal(0);

const dispose = effect(() => {
  const id = setInterval(() => console.log(count()), 1000);
  onCleanup(() => clearInterval(id));
});

count.set(1);
// later
dispose();
```

## Scoped roots

```ts
import { createRoot, effect, signal } from '@philjs/core';

const dispose = createRoot((disposeRoot) => {
  const name = signal('Phil');
  effect(() => console.log(name()));
  return disposeRoot;
});

dispose();
```

## Batch updates

```ts
import { batch } from '@philjs/core';

batch(() => {
  count.set(1);
  count.set(2);
});
```

## Avoid tracking with untrack

```ts
import { untrack } from '@philjs/core';

const value = untrack(() => expensiveSignal());
```

## Tips

- Keep effects small and focused.
- Use `createRoot` for temporary scopes or tests.
