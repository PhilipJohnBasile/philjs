# Context

Context lets you share state across a component tree without prop drilling.

```rust
use philjs::prelude::*;

#[derive(Clone)]
struct Theme {
    primary: String,
}

#[component]
fn ThemeProvider(children: Children) -> impl IntoView {
    provide_context(Theme { primary: "#3b82f6".into() });
    view! { <div class="theme">{children}</div> }
}

#[component]
fn Button() -> impl IntoView {
    let theme = use_context::<Theme>().expect("theme missing");
    view! { <button style=move || format!("background: {}", theme.primary)>"OK"</button> }
}
```
