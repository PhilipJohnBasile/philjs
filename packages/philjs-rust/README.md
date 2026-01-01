# PhilJS for Rust

Pure Rust UI framework with fine-grained reactivity. Write components in Rust, render anywhere.

## Features

- **Fine-grained Reactivity** - Signals, memos, and effects with automatic dependency tracking
- **JSX-like Syntax** - `view!` macro for ergonomic UI authoring
- **Component Model** - Props, children, and composition
- **SSR Support** - Server-side rendering with hydration
- **WASM-first** - Optimized for WebAssembly deployment
- **Type-safe** - Full Rust type safety

## Installation

```toml
[dependencies]
philjs = "0.1.0"
```

## Quick Start

```rust
use philjs::prelude::*;

#[component]
fn Counter(initial: i32) -> impl IntoView {
    let count = signal!(initial);

    view! {
        <div class="counter">
            <h1>"Count: " {count}</h1>
            <button on:click=move |_| count.set(count.get() + 1)>
                "+"
            </button>
            <button on:click=move |_| count.set(count.get() - 1)>
                "-"
            </button>
        </div>
    }
}

fn main() {
    mount(|| view! { <Counter initial=0 /> });
}
```

## Reactive Primitives

### Signals

```rust
use philjs::prelude::*;

let count = signal!(0);

// Read
let value = count.get();

// Write
count.set(5);

// Update
count.update(|n| *n += 1);
```

### Memos (Computed Values)

```rust
use philjs::prelude::*;

let count = signal!(0);
let doubled = memo!(count.get() * 2);

count.set(5);
assert_eq!(doubled.get(), 10);
```

### Effects

```rust
use philjs::prelude::*;

let count = signal!(0);

let _effect = Effect::new(move || {
    println!("Count changed to: {}", count.get());
});

count.set(1); // Prints: "Count changed to: 1"
```

### Resources (Async Data)

```rust
use philjs::prelude::*;

let user_id = signal!(1);

let user = Resource::new(
    move || user_id.get(),
    |id| async move {
        fetch_user(id).await
    }
);

// In your view
view! {
    {match user.state().get() {
        ResourceState::Loading => view! { <div>"Loading..."</div> },
        ResourceState::Ready(user) => view! { <div>{user.name}</div> },
        ResourceState::Error(e) => view! { <div>"Error: " {e}</div> },
        _ => view! { <div></div> },
    }}
}
```

## Components

### Defining Components

```rust
use philjs::prelude::*;

#[component]
fn Button(
    /// Button label
    label: String,
    /// Click handler
    #[prop(optional)]
    on_click: Option<Box<dyn Fn()>>,
    /// Children
    children: Children,
) -> impl IntoView {
    view! {
        <button on:click=move |_| {
            if let Some(handler) = &on_click {
                handler();
            }
        }>
            {label}
            {children}
        </button>
    }
}
```

### Using Components

```rust
view! {
    <Button label="Click me" on_click={|| println!("Clicked!")}>
        <span>"Icon"</span>
    </Button>
}
```

## Control Flow

### Conditional Rendering

```rust
use philjs::prelude::*;

let show = signal!(true);

view! {
    {Show::new(move || show.get(), || view! { <div>"Visible!"</div> })}
}
```

### Lists

```rust
use philjs::prelude::*;

let items = signal!(vec!["a", "b", "c"]);

view! {
    <ul>
        {For::new(
            move || items.get(),
            |item| view! { <li>{item}</li> }
        )}
    </ul>
}
```

## Context (Dependency Injection)

```rust
use philjs::prelude::*;

#[derive(Clone)]
struct Theme {
    primary: String,
    secondary: String,
}

// Provide
provide_context(Theme {
    primary: "#007bff".to_string(),
    secondary: "#6c757d".to_string(),
});

// Consume
let theme: Option<Theme> = use_context();
```

## Server-Side Rendering

```rust
use philjs::prelude::*;

let html = render_to_string(|| view! {
    <html>
        <head><title>"My App"</title></head>
        <body>
            <div id="app">
                <Counter initial=0 />
            </div>
            {HydrationScript::new().to_html()}
        </body>
    </html>
});
```

## Stores (Complex State)

```rust
use philjs::prelude::*;

#[derive(Store)]
struct AppState {
    count: i32,
    user: Option<User>,
    items: Vec<Item>,
}

let store = AppStateStore::new(AppState {
    count: 0,
    user: None,
    items: vec![],
});

// Access fields as signals
store.count.set(5);
let count = store.count.get();
```

## Comparison with Other Rust Frameworks

| Feature | PhilJS | Leptos | Dioxus | Yew |
|---------|--------|--------|--------|-----|
| Fine-grained Reactivity |  |  |  |  |
| `view!` Macro |  |  |  (rsx!) |  (html!) |
| SSR |  |  |  |  |
| Hydration |  |  |  |  |
| Islands |  |  |  |  |
| JS Interop |  Best |  |  |  |
| Bundle Size | ~50KB | ~60KB | ~80KB | ~100KB |

## Integration with PhilJS (JavaScript)

PhilJS Rust can interop seamlessly with the JavaScript PhilJS:

```rust
// Rust component
#[component]
fn RustCounter() -> impl IntoView {
    let count = signal!(0);
    view! { <div>{count}</div> }
}
```

```typescript
// JavaScript
import { useRustComponent } from 'philjs-wasm';

const RustCounter = useRustComponent('RustCounter');

// Use in JavaScript view
<RustCounter />
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Source files: packages/philjs-rust/src/lib.rs

### Public API
- Public modules: dom, liveview, meta, prelude, query, reactive, router, runtime, server, ssr, store, view, wasm
- Public items: spread_attrs
- Re-exports: crate::dom::{
        node_ref::NodeRef,
        event::Event,
        mount::mount,
    }, crate::reactive::{
        signal::Signal,
        memo::Memo,
        effect::Effect,
        resource::Resource,
        batch::batch,
        context::{provide_context, use_context},
    }, crate::ssr::{render_to_string, render_to_stream}, crate::view::{
        element::Element,
        text::Text,
        fragment::Fragment,
        dynamic::Dynamic,
        children::Children,
        into_view::IntoView,
    }, dom::{
    HydrationMode,
    HydrationContext,
    HydrationState,
    HydrationError,
    generate_hydration_script,
}, dom::{
    node_ref::NodeRef,
    event::Event,
    mount::mount,
}, dom::{hydrate, hydrate_to, hydrate_to_body}, meta::{
    Title, TitleTemplate, Meta, Link, Style, Script, Html, Body,
    MetaContext, use_meta_context, with_meta_context,
}, philjs_macros::{component, effect, memo, resource, signal, view, Store}, reactive::{
    Action, MultiAction, ActionError,
    create_action, create_server_action, create_multi_action,
    RwSignal, create_rw_signal,
    StoredValue, create_stored_value,
    Trigger, create_trigger,
    on_cleanup,
}, reactive::{
    signal::Signal,
    memo::Memo,
    effect::Effect,
    resource::Resource,
    batch::batch,
    context::{provide_context, use_context, Context},
}, router::form::{Form, FormMethod, FormData, ActionForm, MultiActionForm}, server::functions::{
    ServerResult,
    ServerError,
    ServerFnConfig,
}, ssr::{
    render_to_string,
    render_to_stream,
    render_to_stream_async,
    StreamingConfig,
    HydrationScript,
}, store::{Store, StoreField, StoreVec, StoreMap, create_store, produce}, view::{
    Transition, TransitionConfig, use_transition, use_deferred_value,
    AnimatedShow, AnimatedShowConfig, AnimationState,
    fade, slide, scale,
}, view::{
    element::Element,
    text::Text,
    fragment::Fragment,
    dynamic::Dynamic,
    children::Children,
    into_view::IntoView,
    view::View,
}
<!-- API_SNAPSHOT_END -->

## License

MIT
