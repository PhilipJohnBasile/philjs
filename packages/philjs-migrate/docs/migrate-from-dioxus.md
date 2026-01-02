# Migrating from Dioxus to PhilJS-Rust

This guide helps you migrate Dioxus applications to PhilJS-Rust. Dioxus uses a React-like hooks API while PhilJS uses SolidJS-style signals, requiring a mental model shift.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Why Migrate?](#why-migrate)
3. [Hooks to Signals](#hooks-to-signals)
4. [RSX to View Macro](#rsx-to-view-macro)
5. [Components](#components)
6. [State Management](#state-management)
7. [Effects and Lifecycle](#effects-and-lifecycle)
8. [Context](#context)
9. [Routing](#routing)
10. [Platform Considerations](#platform-considerations)
11. [Step-by-Step Migration](#step-by-step-migration)

---

## Quick Start

### Update Cargo.toml

```toml
# Before (Dioxus)
[dependencies]
dioxus = "0.5"
dioxus-web = "0.5"
# dioxus-desktop = "0.5"  # For desktop

# After (PhilJS)
[dependencies]
philjs = "1.0"
# philjs = { version = "1.0", features = ["wasm"] }  # For WASM
```

### Basic Component Conversion

```rust
// Before (Dioxus)
use dioxus::prelude::*;

fn Counter(cx: Scope) -> Element {
    let count = use_state(cx, || 0);

    cx.render(rsx! {
        button {
            onclick: move |_| count.set(*count.get() + 1),
            "Count: {count}"
        }
    })
}

// After (PhilJS)
use philjs::prelude::*;

#[component]
fn Counter() -> impl IntoView {
    let count = signal!(0);

    view! {
        <button on:click=move |_| count.update(|n| *n += 1)>
            "Count: " {count}
        </button>
    }
}
```

---

## Why Migrate?

### Dioxus Strengths

- React-like API familiar to web developers
- Native desktop and mobile renderers
- Virtual DOM with diffing
- Strong ecosystem

### PhilJS Advantages

1. **Fine-grained Reactivity**: No Virtual DOM overhead
2. **Simpler Mental Model**: Signals are more predictable than hooks
3. **No Hook Rules**: No "rules of hooks" to follow
4. **Better Performance**: Updates only what changes
5. **LiveView Support**: Server-driven UI out of the box
6. **TypeScript Interop**: Share code with @philjs/core

### When to Keep Dioxus

- Native desktop applications (PhilJS focuses on WASM/SSR)
- Native mobile applications
- Projects heavily invested in Dioxus ecosystem

---

## Hooks to Signals

### use_state to signal

The fundamental difference: Dioxus state is tied to component lifecycle, PhilJS signals are independent.

```rust
// Dioxus
fn Counter(cx: Scope) -> Element {
    let count = use_state(cx, || 0);

    // Read
    let value = *count.get();
    // or
    let value = **count;  // Deref

    // Write
    count.set(5);
    count.modify(|n| n + 1);
}

// PhilJS
#[component]
fn Counter() -> impl IntoView {
    let count = signal!(0);

    // Read
    let value = count.get();

    // Write
    count.set(5);
    count.update(|n| *n += 1);
}
```

### use_ref to signal

```rust
// Dioxus - mutable reference container
let data = use_ref(cx, || Vec::new());
data.write().push(item);
let items = data.read();

// PhilJS - signals handle everything
let data = signal!(Vec::new());
data.update(|v| v.push(item));
let items = data.get();
```

### use_memo to memo

```rust
// Dioxus
let doubled = use_memo(cx, (count,), |(count,)| count * 2);

// PhilJS - auto-tracks dependencies
let doubled = memo!(count.get() * 2);
// Or
let doubled = Memo::new(|| count.get() * 2);
```

### use_future to Resource

```rust
// Dioxus
let user = use_future(cx, (user_id,), |(id,)| async move {
    fetch_user(id).await
});

match user.value() {
    Some(data) => rsx! { p { "{data.name}" } },
    None => rsx! { p { "Loading..." } },
}

// PhilJS
let user = Resource::new(|| async move {
    let id = user_id.get();
    fetch_user(id).await
});

view! {
    {move || match user.get() {
        Some(Ok(data)) => view! { <p>{data.name}</p> },
        Some(Err(e)) => view! { <p>"Error: " {e.to_string()}</p> },
        None => view! { <p>"Loading..."</p> },
    }}
}
```

### use_coroutine to Resource

```rust
// Dioxus - coroutine for async tasks
let chat = use_coroutine(cx, |mut rx| async move {
    while let Some(msg) = rx.next().await {
        send_message(msg).await;
    }
});

chat.send(Message::new("Hello"));

// PhilJS - use effects for subscriptions
let messages = signal!(Vec::<Message>::new());

effect!(|| {
    // Subscribe to message stream
    let rx = subscribe_to_messages();
    spawn_local(async move {
        while let Some(msg) = rx.next().await {
            messages.update(|msgs| msgs.push(msg));
        }
    });
});

// Send messages
async fn send(msg: Message) {
    send_message(msg).await;
}
```

---

## RSX to View Macro

### Basic Syntax

```rust
// Dioxus (rsx!)
rsx! {
    div {
        class: "container",
        h1 { "Hello, World!" }
        p { "Welcome to the app" }
    }
}

// PhilJS (view!)
view! {
    <div class="container">
        <h1>"Hello, World!"</h1>
        <p>"Welcome to the app"</p>
    </div>
}
```

### Attributes

```rust
// Dioxus - colon syntax
rsx! {
    input {
        r#type: "text",
        value: "{name}",
        placeholder: "Enter name",
        disabled: is_disabled,
    }
}

// PhilJS - HTML-like syntax
view! {
    <input
        type="text"
        value=name
        placeholder="Enter name"
        disabled=is_disabled
    />
}
```

### Event Handlers

```rust
// Dioxus - lowercase event names
rsx! {
    button {
        onclick: move |evt| {
            log!("Clicked at {:?}", evt);
        },
        "Click me"
    }
    input {
        oninput: move |evt| {
            name.set(evt.value.clone());
        }
    }
}

// PhilJS - on:event syntax
view! {
    <button on:click=move |evt| {
        log!("Clicked at {:?}", evt);
    }>
        "Click me"
    </button>
    <input on:input=move |evt| {
        name.set(evt.target_value());
    } />
}
```

### Dynamic Content

```rust
// Dioxus
rsx! {
    p { "Count: {count}" }
    p { "{format!('Value is: {}', value)}" }
}

// PhilJS
view! {
    <p>"Count: " {count}</p>
    <p>{format!("Value is: {}", value.get())}</p>
}
```

### Conditional Rendering

```rust
// Dioxus
rsx! {
    if *show.get() {
        rsx! { p { "Visible" } }
    }

    match *status.get() {
        Status::Loading => rsx! { p { "Loading..." } },
        Status::Ready => rsx! { p { "Ready!" } },
        Status::Error(e) => rsx! { p { "Error: {e}" } },
    }
}

// PhilJS
view! {
    <Show when=move || show.get()>
        <p>"Visible"</p>
    </Show>

    {move || match status.get() {
        Status::Loading => view! { <p>"Loading..."</p> },
        Status::Ready => view! { <p>"Ready!"</p> },
        Status::Error(e) => view! { <p>"Error: " {e}</p> },
    }}
}
```

### Lists

```rust
// Dioxus
rsx! {
    ul {
        items.iter().map(|item| rsx! {
            li { key: "{item.id}", "{item.name}" }
        })
    }
}

// PhilJS
view! {
    <ul>
        <For
            each=move || items.get()
            key=|item| item.id
            view=|item| view! {
                <li>{item.name.clone()}</li>
            }
        />
    </ul>
}
```

---

## Components

### Function Components

```rust
// Dioxus
#[derive(Props)]
struct GreetingProps<'a> {
    name: &'a str,
    #[props(default)]
    enthusiastic: bool,
}

fn Greeting<'a>(cx: Scope<'a, GreetingProps<'a>>) -> Element {
    let punct = if cx.props.enthusiastic { "!" } else { "." };
    cx.render(rsx! {
        h1 { "Hello, {cx.props.name}{punct}" }
    })
}

// PhilJS
#[component]
fn Greeting(
    name: String,
    #[prop(default)] enthusiastic: bool,
) -> impl IntoView {
    let punct = if enthusiastic { "!" } else { "." };
    view! {
        <h1>"Hello, " {name} {punct}</h1>
    }
}
```

### Children

```rust
// Dioxus
#[derive(Props)]
struct CardProps<'a> {
    children: Element<'a>,
}

fn Card<'a>(cx: Scope<'a, CardProps<'a>>) -> Element {
    cx.render(rsx! {
        div { class: "card",
            &cx.props.children
        }
    })
}

// Usage
rsx! {
    Card {
        p { "Card content" }
    }
}

// PhilJS
#[component]
fn Card(children: Children) -> impl IntoView {
    view! {
        <div class="card">
            {children()}
        </div>
    }
}

// Usage
view! {
    <Card>
        <p>"Card content"</p>
    </Card>
}
```

---

## State Management

### Component-Local State

```rust
// Dioxus - state tied to component
fn Counter(cx: Scope) -> Element {
    let count = use_state(cx, || 0);
    // State resets when component remounts
}

// PhilJS - state can be component-local or shared
#[component]
fn Counter() -> impl IntoView {
    let count = signal!(0);
    // State is tied to this component instance
}

// PhilJS - shared state (create outside component)
let GLOBAL_COUNT: Signal<i32> = Signal::new(0);

#[component]
fn Counter() -> impl IntoView {
    // All Counter instances share this state
    view! {
        <button on:click=move |_| GLOBAL_COUNT.update(|n| *n += 1)>
            {GLOBAL_COUNT}
        </button>
    }
}
```

### Fermi (Dioxus state management) to Signals

```rust
// Dioxus with Fermi
static COUNT: Atom<i32> = Atom(|_| 0);

fn Counter(cx: Scope) -> Element {
    let count = use_read(cx, &COUNT);
    let set_count = use_set(cx, &COUNT);

    cx.render(rsx! {
        button {
            onclick: move |_| set_count(*count + 1),
            "Count: {count}"
        }
    })
}

// PhilJS - just use signals
static COUNT: Lazy<Signal<i32>> = Lazy::new(|| Signal::new(0));

#[component]
fn Counter() -> impl IntoView {
    view! {
        <button on:click=move |_| COUNT.update(|n| *n += 1)>
            "Count: " {COUNT}
        </button>
    }
}
```

---

## Effects and Lifecycle

### use_effect to effect

```rust
// Dioxus
fn Component(cx: Scope) -> Element {
    let count = use_state(cx, || 0);

    use_effect(cx, (count,), |(count,)| async move {
        log!("Count changed to {count}");
    });
}

// PhilJS - auto-tracks dependencies
#[component]
fn Component() -> impl IntoView {
    let count = signal!(0);

    effect!(|| {
        log!("Count changed to {}", count.get());
    });
}
```

### Cleanup

```rust
// Dioxus
use_effect(cx, (), |_| {
    let timer = set_interval(|| log!("tick"), Duration::from_secs(1));

    async move {
        // Cleanup when effect re-runs or component unmounts
        clear_interval(timer);
    }
});

// PhilJS
effect!(|| {
    let timer = set_interval(|| log!("tick"), Duration::from_secs(1));

    // Return cleanup function
    move || {
        clear_interval(timer);
    }
});

// Or use on_cleanup directly
on_cleanup(|| {
    log!("Component unmounting");
});
```

### on_mount

```rust
// Dioxus - no direct equivalent, use use_effect with empty deps
use_effect(cx, (), |_| async move {
    log!("Mounted");
});

// PhilJS
on_mount(|| {
    log!("Mounted");
});
```

---

## Context

### Providing Context

```rust
// Dioxus
fn App(cx: Scope) -> Element {
    use_context_provider(cx, || Theme::Dark);

    cx.render(rsx! {
        Child {}
    })
}

fn Child(cx: Scope) -> Element {
    let theme = use_context::<Theme>(cx).unwrap();
}

// PhilJS
#[component]
fn App() -> impl IntoView {
    provide_context(Theme::Dark);

    view! {
        <Child />
    }
}

#[component]
fn Child() -> impl IntoView {
    let theme = use_context::<Theme>().unwrap();
}
```

### Reactive Context

```rust
// Dioxus - context with state
fn App(cx: Scope) -> Element {
    let theme = use_state(cx, || Theme::Dark);
    use_context_provider(cx, theme.clone());
}

// PhilJS - context with signals
#[component]
fn App() -> impl IntoView {
    let theme = signal!(Theme::Dark);
    provide_context(theme.clone());

    view! {
        <Child />
    }
}

#[component]
fn Child() -> impl IntoView {
    let theme = use_context::<Signal<Theme>>().unwrap();

    view! {
        <p>"Theme: " {move || format!("{:?}", theme.get())}</p>
    }
}
```

---

## Routing

### Route Definition

```rust
// Dioxus
use dioxus_router::prelude::*;

#[derive(Clone, Routable, PartialEq)]
enum Route {
    #[route("/")]
    Home {},
    #[route("/users/:id")]
    User { id: String },
    #[route("/:..route")]
    NotFound { route: Vec<String> },
}

fn App(cx: Scope) -> Element {
    cx.render(rsx! {
        Router::<Route> {}
    })
}

// PhilJS
use philjs::router::*;

#[component]
fn App() -> impl IntoView {
    let routes = routes![
        ("/" => Home),
        ("/users/:id" => User),
        ("/*any" => NotFound),
    ];

    view! {
        <Router routes=routes>
            <Routes />
        </Router>
    }
}
```

### Accessing Route Params

```rust
// Dioxus
#[component]
fn User(cx: Scope, id: String) -> Element {
    cx.render(rsx! {
        p { "User ID: {id}" }
    })
}

// PhilJS
#[component]
fn User() -> impl IntoView {
    let params = use_params();
    let id = move || params.get("id").unwrap_or_default();

    view! {
        <p>"User ID: " {id}</p>
    }
}
```

### Navigation

```rust
// Dioxus
let nav = use_navigator(cx);
nav.push(Route::Home {});

// PhilJS
let navigate = use_navigate();
navigate("/");
```

---

## Platform Considerations

### Desktop/Mobile

Dioxus excels at native desktop and mobile applications. PhilJS focuses on:

1. **WASM for Browser**: Primary target
2. **SSR for Server**: Server-side rendering
3. **LiveView**: Server-driven UI

For desktop applications migrating from Dioxus:

```rust
// Option 1: Use Tauri + PhilJS WASM
// PhilJS runs in webview, Tauri provides native APIs

// Option 2: Use PhilJS LiveView
// Server renders HTML, client has minimal JS
// Better for data-heavy apps

// Option 3: Keep Dioxus for desktop
// Share business logic, different UI layer
```

### Hybrid Approach

```rust
// Shared business logic
mod shared {
    pub fn calculate_total(items: &[Item]) -> f64 {
        items.iter().map(|i| i.price).sum()
    }
}

// Dioxus desktop UI
#[cfg(feature = "desktop")]
mod desktop {
    use dioxus::prelude::*;
    use super::shared;
    // ... Dioxus components
}

// PhilJS web UI
#[cfg(feature = "web")]
mod web {
    use philjs::prelude::*;
    use super::shared;
    // ... PhilJS components
}
```

---

## Step-by-Step Migration

### 1. Update Dependencies

```toml
[dependencies]
philjs = "1.0"
```

### 2. Update Imports

```rust
// Before
use dioxus::prelude::*;

// After
use philjs::prelude::*;
```

### 3. Convert Component Signatures

```rust
// Before
fn MyComponent(cx: Scope) -> Element {
    cx.render(rsx! { ... })
}

// After
#[component]
fn MyComponent() -> impl IntoView {
    view! { ... }
}
```

### 4. Convert State (Hooks to Signals)

```rust
// use_state -> signal!
// use_ref -> signal!
// use_memo -> memo!
// use_effect -> effect!
// use_future -> Resource::new
```

### 5. Convert RSX to View Macro

- `rsx! { }` -> `view! { }`
- `div { }` -> `<div></div>`
- `class: "x"` -> `class="x"`
- `onclick:` -> `on:click=`
- `{"{value}"}` -> `{value}`

### 6. Handle Platform-Specific Code

- Decide on WASM, SSR, or LiveView strategy
- Consider keeping Dioxus for desktop if needed

### 7. Test

```bash
cargo build
cargo test
trunk serve  # WASM
```

---

## Comparison Table

| Feature | Dioxus | PhilJS-Rust |
|---------|--------|-------------|
| State | `use_state(cx, \|\| x)` | `signal!(x)` |
| Refs | `use_ref(cx, \|\| x)` | `signal!(x)` |
| Memo | `use_memo(cx, deps, \|_\| x)` | `memo!(x)` |
| Effect | `use_effect(cx, deps, async \|\| {})` | `effect!(\|\| {})` |
| Future | `use_future(cx, deps, async \|\| {})` | `Resource::new(\|\| async {})` |
| View Macro | `rsx! { div { } }` | `view! { <div></div> }` |
| Events | `onclick: handler` | `on:click=handler` |
| Attributes | `class: "x"` | `class="x"` |
| Children | `&cx.props.children` | `children()` |
| Context Provider | `use_context_provider(cx, val)` | `provide_context(val)` |
| Context Consumer | `use_context::<T>(cx)` | `use_context::<T>()` |
| Desktop | Native with `dioxus-desktop` | WASM + Tauri |
| Mobile | Native with `dioxus-mobile` | WASM + Capacitor |

---

## Need Help?

- [PhilJS-Rust Documentation](https://philjs.dev/rust)
- [Discord Community](https://discord.gg/philjs)
- [GitHub Issues](https://github.com/philjs/philjs/issues)
- [API Reference](https://docs.rs/philjs)
