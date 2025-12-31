# Events

PhilJS uses `on:event` handlers in `view!`.

```rust
use philjs::prelude::*;

#[component]
pub fn Counter() -> impl IntoView {
    let count = signal!(0);

    view! {
        <div>
            <button on:click=move |_| count.update(|n| *n += 1)>
                "Increment"
            </button>
            <p>"Count: " {count}</p>
        </div>
    }
}
```

Event handlers receive the browser event type when needed:

```rust
use philjs::prelude::*;
use web_sys::KeyboardEvent;

#[component]
pub fn Search() -> impl IntoView {
    let query = signal!(String::new());

    view! {
        <input
            type="search"
            on:keyup=move |event: KeyboardEvent| {
                query.set(event.key());
            }
        />
    }
}
```
