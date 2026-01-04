# Stores

Use stores for structured state with multiple fields.

```rust
use philjs::prelude::*;

#[derive(Store)]
struct AppState {
    count: i32,
    name: String,
}

let store = AppStateStore::new(AppState { count: 0, name: "Phil".into() });
store.count.set(1);
```

Stores are ideal for shared state that needs a single source of truth.
