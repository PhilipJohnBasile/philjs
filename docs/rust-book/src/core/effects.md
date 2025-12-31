# Effects

Effects run whenever the signals they read change. Use them for side effects such as logging, persistence, or subscribing to external APIs.

## Basic Effect

```rust
use philjs::prelude::*;

let count = signal!(0);

let _effect = Effect::new(move || {
    println!("count is {}", count.get());
});

count.set(1);
```

## Cleanup

Use `on_cleanup` for teardown logic:

```rust
use philjs::prelude::*;

let _effect = Effect::new(move || {
    let handle = start_subscription();
    on_cleanup(move || handle.stop());
});
```

## Watching a Specific Value

`watch` runs a callback when a signal changes:

```rust
use philjs::prelude::*;

let query = signal!("".to_string());

let _watcher = watch(
    move || query.get(),
    move |next, prev| {
        println!("query changed from {} to {}", prev, next);
    },
);
```
