# philjs-core

Core signals, memos, and resources for PhilJS.

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

## API

### `signal<T>(initial: T)`

Creates a reactive signal.

### `memo<T>(calc: () => T)`

Creates a memoized computation.

### `resource<T>(calc: () => T)`

Creates a resource that can be refreshed.

## License

MIT
