# JSX/RSX

PhilJS uses the `view!` macro to provide JSX-like syntax (often called RSX in Rust).

## Basic RSX

```rust
use philjs::prelude::*;

view! {
    <section class="hero">
        <h1>"PhilJS Rust"</h1>
        <p>"Signals meet Rust."</p>
    </section>
}
```

## Dynamic Values

```rust
let title = signal!("Dashboard".to_string());

view! {
    <h1>{title}</h1>
}
```

## Attributes

```rust
let active = signal!(true);

view! {
    <button class=move || if active.get() { "btn active" } else { "btn" }>
        "Toggle"
    </button>
}
```

## Inline Styles

```rust
let size = signal!(16);

view! {
    <p style=move || format!("font-size: {}px", size.get())>
        "Resizable"
    </p>
}
```
