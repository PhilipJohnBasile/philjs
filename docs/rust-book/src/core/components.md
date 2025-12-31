# Components

PhilJS components are Rust functions annotated with `#[component]` and returning `impl IntoView`.

## Basic component

```rust
use philjs::prelude::*;

#[component]
pub fn Greeting(name: String) -> impl IntoView {
    view! { <p>"Hello " {name}</p> }
}
```

## Children

```rust
use philjs::prelude::*;

#[component]
pub fn Card(title: String, children: Children) -> impl IntoView {
    view! {
        <section class="card">
            <h2>{title}</h2>
            <div>{children}</div>
        </section>
    }
}
```

## Composition

```rust
view! {
    <Card title="Summary">
        <p>"Signals, SSR, and islands."</p>
    </Card>
}
```
