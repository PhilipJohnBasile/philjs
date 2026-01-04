# Context

Use context for app-wide state like themes or user sessions.

```rust
use philjs::prelude::*;

#[derive(Clone)]
struct Theme {
    name: String,
}

#[component]
fn App() -> impl IntoView {
    provide_context(Theme { name: "dark".into() });
    view! { <Dashboard /> }
}

#[component]
fn Dashboard() -> impl IntoView {
    let theme = use_context::<Theme>();
    view! { <p>{theme.name}</p> }
}
```
