# TypeScript integration

PhilJS is TypeScript-first. The core package exports types for signals, JSX, and resources.

## Typed signals

```ts
import type { Signal } from '@philjs/core';
import { signal } from '@philjs/core';

const count: Signal<number> = signal(0);
```

## Component typing

```tsx
import type { JSXElement } from '@philjs/core';

function Button(props: { label: string }): JSXElement {
  return <button>{props.label}</button>;
}
```

## Resource and memo types

```ts
import { memo } from '@philjs/core';
import type { Memo } from '@philjs/core';

const fullName: Memo<string> = memo(() => `${first()} ${last()}`);
```

## Explicit resource management

`@philjs/core/disposable` wraps TS 6 using/await using.

```ts
import { disposableTimeout, createDisposableScope } from '@philjs/core/disposable';

using scope = createDisposableScope();
scope.add(disposableTimeout(() => console.log('tick'), 100));
```

## Tips

- Prefer `Signal<T>` and `Memo<T>` in public APIs.
- Keep component props explicit so the compiler can infer JSX types.
