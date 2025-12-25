# Migration Guide

This guide helps you migrate from other frameworks to philjs-macros.

## From Leptos

### Component Syntax

**Leptos:**
```rust
#[component]
fn MyComponent(cx: Scope, name: String) -> impl IntoView {
    view! { cx,
        <div>{name}</div>
    }
}
```

**PhilJS:**
```rust
#[component]
fn MyComponent(name: String) -> impl IntoView {
    view! {
        <div>{name}</div>
    }
}
```

Changes:
- No `cx: Scope` parameter needed
- No `cx` in `view!` macro

### Signals

**Leptos:**
```rust
let (count, set_count) = create_signal(cx, 0);
```

**PhilJS:**
```rust
#[signal]
struct State {
    count: i32,
}

let state = State::new(0);
state.set_count(5);
```

Changes:
- Use `#[signal]` macro for better organization
- Method-based API instead of tuple returns

### Props

**Leptos:**
```rust
#[component]
fn Button(
    cx: Scope,
    #[prop(default = "primary".into())]
    variant: String,
) -> impl IntoView {
    // ...
}
```

**PhilJS:**
```rust
#[derive(Props)]
struct ButtonProps {
    #[prop(default = r#""primary".to_string()"#)]
    variant: String,
}

#[component]
fn Button(props: ButtonProps) -> impl IntoView {
    // ...
}
```

Changes:
- Explicit props struct with `#[derive(Props)]`
- Default values use full expressions

### Server Functions

**Leptos:**
```rust
#[server(GetUser, "/api")]
pub async fn get_user(cx: Scope, id: u32) -> Result<User, ServerFnError> {
    // ...
}
```

**PhilJS:**
```rust
#[server(prefix = "/api")]
pub async fn get_user(id: u32) -> Result<User, ServerError> {
    // ...
}
```

Changes:
- No `cx: Scope` parameter
- Function name derived automatically
- Use `prefix` instead of second argument

## From Dioxus

### Component Syntax

**Dioxus:**
```rust
#[component]
fn MyComponent(cx: Scope, name: String) -> Element {
    rsx! {
        div { "{name}" }
    }
}
```

**PhilJS:**
```rust
#[component]
fn MyComponent(name: String) -> impl IntoView {
    view! {
        <div>{name}</div>
    }
}
```

Changes:
- No `cx: Scope` parameter
- Use `view!` instead of `rsx!`
- HTML-like syntax instead of Rust-like
- Return `impl IntoView` instead of `Element`

### Hooks vs Signals

**Dioxus:**
```rust
fn App(cx: Scope) -> Element {
    let count = use_state(cx, || 0);

    rsx! {
        button { onclick: move |_| count += 1, "{count}" }
    }
}
```

**PhilJS:**
```rust
#[component]
fn App() -> impl IntoView {
    #[signal]
    struct State {
        count: i32,
    }

    let state = State::new(0);

    view! {
        <button on:click=move |_| state.update_count(|c| *c += 1)>
            {state.count()}
        </button>
    }
}
```

Changes:
- Use `#[signal]` instead of hooks
- Method-based updates
- No need for `cx` parameter

### Props

**Dioxus:**
```rust
#[derive(Props)]
struct ButtonProps<'a> {
    text: &'a str,
    #[props(default)]
    disabled: bool,
}
```

**PhilJS:**
```rust
#[derive(Props)]
struct ButtonProps {
    text: String,
    #[prop(default = "false")]
    disabled: bool,
}
```

Changes:
- Use `#[prop(...)]` instead of `#[props(...)]`
- Default values use expressions

## From Yew

### Component Syntax

**Yew:**
```rust
#[function_component]
fn MyComponent(props: &Props) -> Html {
    html! {
        <div>{"Hello"}</div>
    }
}
```

**PhilJS:**
```rust
#[component]
fn MyComponent(props: Props) -> impl IntoView {
    view! {
        <div>"Hello"</div>
    }
}
```

Changes:
- Use `#[component]` instead of `#[function_component]`
- Props by value, not reference
- Use `view!` instead of `html!`
- Return `impl IntoView` instead of `Html`

### State Management

**Yew:**
```rust
let count = use_state(|| 0);

let increment = {
    let count = count.clone();
    Callback::from(move |_| count.set(*count + 1))
};
```

**PhilJS:**
```rust
#[signal]
struct State {
    count: i32,
}

let state = State::new(0);
let increment = move |_| state.update_count(|c| *c += 1);
```

Changes:
- Use `#[signal]` for cleaner API
- No need for manual cloning
- Simpler callback syntax

### Properties

**Yew:**
```rust
#[derive(Properties, PartialEq)]
struct Props {
    #[prop_or_default]
    value: i32,
}
```

**PhilJS:**
```rust
#[derive(Props)]
struct Props {
    #[prop(default = "0")]
    value: i32,
}
```

Changes:
- Use `#[derive(Props)]` instead of `Properties`
- No need for `PartialEq`
- Use `#[prop(default)]` instead of `#[prop_or_default]`

## Common Patterns

### Conditional Rendering

**Leptos/Dioxus:**
```rust
{move || if show() {
    view! { <div>"Content"</div> }
} else {
    view! { <div>"Empty"</div> }
}}
```

**PhilJS:**
```rust
{if show {
    view! { <div>"Content"</div> }
} else {
    view! { <div>"Empty"</div> }
}}
```

### List Rendering

**Leptos:**
```rust
<For
    each=items
    key=|item| item.id
    view=move |cx, item| view! { cx, <li>{item.name}</li> }
/>
```

**PhilJS:**
```rust
{items.iter().map(|item| view! {
    <li>{&item.name}</li>
}).collect::<Vec<_>>()}
```

### Event Handlers

**Dioxus:**
```rust
onclick: move |event| { /* ... */ }
```

**PhilJS:**
```rust
on:click={move |event| { /* ... */ }}
```

### Server Functions

**All frameworks → PhilJS:**
```rust
#[server]
async fn my_function(param: String) -> Result<Data, Error> {
    // Server-only code
    Ok(data)
}
```

## Migration Checklist

- [ ] Remove `cx: Scope` from all components
- [ ] Change `view! { cx,` to `view! {`
- [ ] Convert hook-based state to `#[signal]` structs
- [ ] Update props to use `#[derive(Props)]`
- [ ] Change attribute syntax in templates
- [ ] Update server function syntax
- [ ] Adjust imports to use `philjs_macros`
- [ ] Update return types to `impl IntoView`
- [ ] Test all components and features

## Getting Help

If you encounter issues during migration:

1. Check the [documentation](./README.md)
2. Look at [examples](../examples/)
3. Review [macro design](./macro-design.md)
4. Open an issue on GitHub
5. Ask in Discord community
