# philjs-core

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

Core signals, memos, and resources for PhilJS.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Installation

```bash
pnpm add philjs-core
```

## Usage

### Signals

```js
import { signal } from "philjs-core";

const count = signal(0);

console.log(count()); // 0

count.set(5);
console.log(count()); // 5

count.set((prev) => prev + 1);
console.log(count()); // 6

// Subscribe to changes
const unsubscribe = count.subscribe((value) => {
  console.log("Count changed:", value);
});

count.set(10); // Logs: "Count changed: 10"

unsubscribe();
```

### Memos

```js
import { signal, memo } from "philjs-core";

const count = signal(10);
const doubled = memo(() => count() * 2);

console.log(doubled()); // 20
```

### Resources

```js
import { resource } from "philjs-core";

let apiData = { value: 1 };
const data = resource(() => apiData);

console.log(data()); // { value: 1 }

apiData = { value: 2 };
data.refresh();

console.log(data()); // { value: 2 }
```

### Async Operations with Promise.withResolvers()

```js
import { signal } from "philjs-core";

const data = signal(null);

// Using ES2024 Promise.withResolvers() for cleaner async control
async function fetchWithTimeout(url, timeout = 5000) {
  const { promise, resolve, reject } = Promise.withResolvers();

  const timer = setTimeout(() => reject(new Error("Timeout")), timeout);

  fetch(url)
    .then(res => res.json())
    .then(result => {
      clearTimeout(timer);
      data.set(result);
      resolve(result);
    })
    .catch(reject);

  return promise;
}
```

### Grouping Data with Object.groupBy()

```js
import { signal, memo } from "philjs-core";

const items = signal([
  { type: "fruit", name: "apple" },
  { type: "vegetable", name: "carrot" },
  { type: "fruit", name: "banana" },
]);

// Using ES2024 Object.groupBy() for cleaner grouping
const grouped = memo(() => Object.groupBy(items(), item => item.type));

console.log(grouped());
// { fruit: [...], vegetable: [...] }
```

### Resource Management with `using`

```ts
import { signal } from "philjs-core";

// Using TypeScript 6 explicit resource management
function createManagedResource() {
  const state = signal({ active: true });

  return {
    state,
    [Symbol.dispose]() {
      state.set({ active: false });
      console.log("Resource disposed");
    }
  };
}

function example() {
  using resource = createManagedResource();
  // resource is automatically disposed when scope exits
}
```

## API

### `signal<T>(initial: T)`

Creates a reactive signal.

### `memo<T>(calc: () => T)`

Creates a memoized computation.

### `resource<T>(calc: () => T)`

Creates a resource that can be refreshed.

## License

MIT
