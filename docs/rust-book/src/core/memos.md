# Memos

Memos cache derived values and re-compute when dependencies change.

```rust
use philjs::prelude::*;

let count = signal!(2);
let doubled = memo!(count.get() * 2);

assert_eq!(doubled.get(), 4);
count.set(3);
assert_eq!(doubled.get(), 6);
```
