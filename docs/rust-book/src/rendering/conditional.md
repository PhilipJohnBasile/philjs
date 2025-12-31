# Conditional Rendering

Use `Show` or standard Rust control flow to render conditionally.

## Using Show

```rust
use philjs::prelude::*;

let is_logged_in = signal!(false);

let view = Show::new(
    move || is_logged_in.get(),
    || view! { <p>"Welcome back"</p> },
    || view! { <p>"Sign in"</p> },
)
.render();
```

## Using if in view!

```rust
view! {
    {if is_logged_in.get() {
        view! { <p>"Welcome back"</p> }
    } else {
        view! { <p>"Sign in"</p> }
    }}
}
```
