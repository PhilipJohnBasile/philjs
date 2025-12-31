# Fragments

Fragments group multiple views without an extra wrapper element.

## fragment Function

```rust
use philjs::prelude::*;
use philjs::view::fragment;

let view = fragment(vec![
    view! { <span>"A"</span> }.into(),
    view! { <span>"B"</span> }.into(),
]);
```

## Multiple Roots in Components

```rust
#[component]
fn Pair() -> impl IntoView {
    fragment(vec![
        view! { <strong>"Left"</strong> }.into(),
        view! { <em>"Right"</em> }.into(),
    ])
}
```
