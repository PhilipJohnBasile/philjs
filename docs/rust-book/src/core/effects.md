# Effects

Effects run when their dependencies change.

```rust
use philjs::prelude::*;

let count = signal!(0);
let _effect = effect!({
    println!("Count is {}", count.get());
});
```

## Watching values

```rust
use philjs::prelude::*;

let name = signal!("Ada".to_string());
watch(move || name.get(), |value, prev| {
    println!("Name changed from {:?} to {}", prev, value);
});
```
