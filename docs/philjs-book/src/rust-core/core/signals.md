# Signals

Signals are the reactive primitive in PhilJS Rust. Use `signal!` to create them.

```rust
use philjs::prelude::*;

let count = signal!(0);
count.get();
count.set(1);
count.update(|n| *n += 1);
```

## Derived values

```rust
use philjs::prelude::*;

let price = signal!(42);
let total = memo!(price.get() * 1.08);
```

## Async resources

```rust
use philjs::prelude::*;

let user = resource!(async { fetch_user().await });
```
