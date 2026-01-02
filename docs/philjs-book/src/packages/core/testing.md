# Testing utilities

`@philjs/core/testing` provides lightweight helpers for component and signal tests.

## Render components

```ts
import { render } from '@philjs/core/testing';
import { signal } from '@philjs/core';

const count = signal(0);
const view = <div data-testid="count">{count()}</div>;

const result = render(view);
console.log(result.html);
console.log(result.getByTestId('count'));
```

## Re-render and cleanup

```ts
result.rerender();
result.cleanup();
```

## Test signals

```ts
import { createTestSignal } from '@philjs/core/testing';

const { signal: value, updates } = createTestSignal(0);
value.set(1);
value.set(2);

console.log(updates); // [0, 1, 2]
```

## Async helpers

```ts
import { nextTick, async } from '@philjs/core/testing';

await nextTick();
await async.waitFor(() => ready());
await async.waitForSignal(status, 'done');
```

## Assertions and spies

```ts
import { assert, createSpy } from '@philjs/core/testing';

const spy = createSpy();
spy('event');

assert(spy.callCount === 1, 'Expected one call');
```
