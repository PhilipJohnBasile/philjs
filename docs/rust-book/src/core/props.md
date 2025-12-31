# Props

Props define what data a component receives. Use typed props for clarity and safety.

## Simple Props

```rust
use philjs::prelude::*;

#[component]
fn Badge(label: String) -> impl IntoView {
    view! { <span class="badge">{label}</span> }
}
```

## Optional Props

```rust
use philjs::prelude::*;

#[derive(Props)]
struct BannerProps {
    title: String,
    #[prop(optional)]
    subtitle: Option<String>,
}

#[component]
fn Banner(props: BannerProps) -> impl IntoView {
    view! {
        <header>
            <h1>{props.title}</h1>
            {props.subtitle.map(|text| view! { <p>{text}</p> })}
        </header>
    }
}
```

## Default Values

```rust
#[derive(Props)]
struct ButtonProps {
    label: String,
    #[prop(default = "primary")]
    variant: &'static str,
}
```
