# Memos

Memos derive values from signals and recompute only when their dependencies change.

## Creating a Memo

```rust
use philjs::prelude::*;

let count = signal!(2);
let doubled = memo!(count.get() * 2);

assert_eq!(doubled.get(), 4);
count.set(5);
assert_eq!(doubled.get(), 10);
```

## Manual Memo

```rust
use philjs::prelude::*;

let items = signal!(vec![1, 2, 3]);
let sum = Memo::new(move || items.get().iter().sum::<i32>());
```

## When to Use Memos

- Expensive derived values
- Filtering or aggregating lists
- Computations that should not run on every render
