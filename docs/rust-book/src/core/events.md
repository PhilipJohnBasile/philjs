# Events

PhilJS uses `on:event` handlers in RSX to wire DOM events to Rust closures.

## Click Handler

```rust
use philjs::prelude::*;

#[component]
fn Counter() -> impl IntoView {
    let count = signal!(0);

    view! {
        <button on:click=move |_| count.update(|c| *c + 1)>
            "Count: " {count}
        </button>
    }
}
```

## Prevent Default

```rust
use philjs::prelude::*;

#[component]
fn Link() -> impl IntoView {
    view! {
        <a href="https://example.com" on:click=move |event| event.prevent_default()>
            "Stay on page"
        </a>
    }
}
```

## Accessing Event Data

Use the event wrappers in `philjs::dom` when you need details:

```rust
use philjs::prelude::*;
use philjs::dom::MouseEvent;

#[component]
fn Tracker() -> impl IntoView {
    view! {
        <div on:mousemove=move |event: MouseEvent| {
            println!("x={} y={}", event.client_x(), event.client_y());
        }>
            "Move the mouse"
        </div>
    }
}
```
