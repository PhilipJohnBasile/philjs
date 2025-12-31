# Props

Props are defined as function parameters in `#[component]` functions.

## Optional props

```rust
use philjs::prelude::*;

#[component]
pub fn Badge(
    label: String,
    #[prop(optional)]
    tone: Option<String>,
) -> impl IntoView {
    let class = tone.unwrap_or_else(|| "primary".to_string());
    view! { <span class=class>{label}</span> }
}
```

## Default values

```rust
use philjs::prelude::*;

#[component]
pub fn Button(
    label: String,
    #[prop(default = "primary".to_string())]
    tone: String,
) -> impl IntoView {
    view! { <button class=tone>{label}</button> }
}
```
