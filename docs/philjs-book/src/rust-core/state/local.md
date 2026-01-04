# Local State

Signals provide local component state.

```rust
use philjs::prelude::*;

#[component]
fn Counter() -> impl IntoView {
    let count = signal!(0);

    view! {
        <div>
            <button on:click=move |_| count.update(|n| *n += 1)>
                "Add"
            </button>
            <span>"Count: " {count}</span>
        </div>
    }
}
```
