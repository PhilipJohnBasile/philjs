# Hydration

Hydration attaches event handlers to server-rendered HTML.

```rust
use wasm_bindgen::prelude::*;
use philjs::dom::{hydrate_with_mode, HydrationMode};
use philjs::prelude::*;

#[wasm_bindgen(start)]
pub fn main() {
    hydrate_with_mode(|| view! { <App /> }, HydrationMode::Full);
}
```

## Partial hydration

```rust
use philjs::dom::{hydrate_with_mode, HydrationMode};

hydrate_with_mode(|| view! { <App /> }, HydrationMode::Partial);
```
