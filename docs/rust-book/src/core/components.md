# Components

Components are Rust functions that return `impl IntoView` and are annotated with `#[component]`.

## Basic Component

```rust
use philjs::prelude::*;

#[component]
fn Greeting(name: String) -> impl IntoView {
    view! { <p>"Hello " {name}</p> }
}
```

## Props Structs

For larger components, prefer a props struct with defaults:

```rust
use philjs::prelude::*;

#[derive(Props)]
struct ButtonProps {
    label: String,
    #[prop(default = "primary")]
    variant: &'static str,
}

#[component]
fn Button(props: ButtonProps) -> impl IntoView {
    let class = format!("btn btn-{}", props.variant);

    view! {
        <button class=class>
            {props.label}
        </button>
    }
}
```

## Children

Use `Children` when you want to render nested content:

```rust
use philjs::prelude::*;

#[component]
fn Card(title: String, children: Children) -> impl IntoView {
    view! {
        <section class="card">
            <h2>{title}</h2>
            <div class="card-body">
                {children}
            </div>
        </section>
    }
}
```

## Composition

```rust
#[component]
fn Page() -> impl IntoView {
    view! {
        <Card title="Summary">
            <p>"Signals, SSR, and Rust."</p>
        </Card>
    }
}
```
