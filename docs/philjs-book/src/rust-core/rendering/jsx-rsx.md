# JSX/RSX

PhilJS Rust uses the `view!` macro to write RSX, a JSX-like syntax that compiles to Rust.

```rust
use philjs::prelude::*;

#[component]
fn Hero(title: String) -> impl IntoView {
    view! {
        <header class="hero">
            <h1>{title}</h1>
            <p>"Signals-first UI in Rust."</p>
        </header>
    }
}
```

## Dynamic expressions

```rust
use philjs::prelude::*;

let count = signal!(0);

view! {
    <p>"Count: " {count}</p>
}
```

## Attributes

```rust
view! {
    <button class="primary" disabled=false>
        "Save"
    </button>
}
```
