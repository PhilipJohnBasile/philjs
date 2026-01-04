# @philjs/rust

Pure Rust implementation of the PhilJS framework with fine-grained reactivity, JSX-like syntax, and first-class WebAssembly support.

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
philjs = "0.1"
philjs-macros = "0.1"

[features]
default = ["wasm"]
wasm = ["philjs/wasm"]
ssr = ["philjs/ssr"]
```

## Overview

`@philjs/rust` brings the PhilJS paradigm to Rust with:

- **Fine-grained Reactivity**: Signals, memos, and effects with automatic dependency tracking
- **JSX-like Syntax**: The `view!` macro provides ergonomic UI authoring
- **Component Model**: Props, children, and composition patterns
- **SSR Support**: Server-side rendering with hydration
- **WASM-first**: Optimized for WebAssembly deployment
- **Type-safe Routing**: File-based routing with compile-time safety
- **Server Functions**: RPC-style server/client communication
- **Data Fetching**: TanStack Query-style caching and mutations
- **LiveView**: Phoenix-style server-driven UI

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

## Reactivity System

### Signals

```rust
use philjs::prelude::*;

// Create a signal
let count = signal!(0);

// Read the value
let value = count.get();

// Set the value
count.set(5);

// Update based on previous value
count.update(|c| *c += 1);
```

### Memos

```rust
let count = signal!(0);

// Derived computation with automatic caching
let doubled = memo!(move || count.get() * 2);

println!("{}", doubled.get()); // 0
count.set(5);
println!("{}", doubled.get()); // 10
```

### Effects

```rust
let count = signal!(0);

// Run side effects when dependencies change
effect!(move || {
    println!("Count changed to: {}", count.get());
});
```

## Server Functions

Define server-side functions that can be called from the client:

```rust
use philjs::server::*;

#[server]
async fn get_user(id: u64) -> ServerResult<User> {
    let user = db.find_user(id).await?;
    Ok(user)
}

#[server]
async fn create_post(title: String, content: String) -> ServerResult<Post> {
    let post = db.create_post(&title, &content).await?;
    Ok(post)
}
```

## Type-safe Routing

```rust
use philjs::router::*;

let routes = routes![
    ("/" => HomePage),
    ("/users/:id" => UserPage),
    ("/posts/*rest" => PostsPage),
];

// Access route parameters with type safety
#[component]
fn UserPage() -> impl IntoView {
    let params = use_params::<UserParams>();

    view! {
        <h1>"User: " {params.id}</h1>
    }
}
```

## Data Fetching

TanStack Query-style data fetching:

```rust
use philjs::query::*;

#[component]
fn UserList() -> impl IntoView {
    let users = use_query(["users"], || async {
        fetch_users().await
    });

    view! {
        <Show
            when=move || users.is_loading()
            fallback=|| view! { <p>"Loading..."</p> }
        >
            <ul>
                <For
                    each=move || users.data().unwrap_or_default()
                    key=|user| user.id
                    children=|user| view! { <li>{user.name}</li> }
                />
            </ul>
        </Show>
    }
}
```

## LiveView (Server-Driven UI)

Phoenix-style server-driven UI:

```rust
use philjs::liveview::*;

struct Counter {
    count: Signal<i32>
}

impl LiveView for Counter {
    fn mount(&mut self, socket: &mut LiveSocket) {
        // Initialize state
    }

    fn handle_event(&mut self, event: &LiveEvent, socket: &mut LiveSocket) {
        match event.event_type.as_str() {
            "increment" => self.count.update(|c| *c += 1),
            "decrement" => self.count.update(|c| *c -= 1),
            _ => {}
        }
    }

    fn render(&self) -> String {
        format!(r#"
            <div>
                <h1>Count: {}</h1>
                <button live:click="increment">+</button>
                <button live:click="decrement">-</button>
            </div>
        "#, self.count.get())
    }
}
```

## Server-Side Rendering

```rust
use philjs::ssr::*;

// Render to string
let html = render_to_string(|| view! { <App /> });

// Streaming SSR
let stream = render_to_stream(|| view! { <App /> }, StreamingConfig {
    chunk_size: 1024,
    timeout: Duration::from_secs(5),
});

// With hydration script
let hydration = generate_hydration_script(&state);
```

## Module Exports

```rust
// Prelude - import everything
pub use philjs::prelude::*;

// Reactive primitives
pub use philjs::reactive::{
    Signal, Memo, Effect, Resource,
    batch, provide_context, use_context,
};

// View components
pub use philjs::view::{
    Element, Text, Fragment, Dynamic,
    Children, IntoView,
};

// DOM and mounting
pub use philjs::dom::{
    NodeRef, Event, mount,
    hydrate, hydrate_to,
};

// SSR
pub use philjs::ssr::{
    render_to_string, render_to_stream,
    StreamingConfig, HydrationScript,
};

// Meta tags
pub use philjs::meta::{
    Title, Meta, Link, Style, Script,
};

// Store for deep reactive updates
pub use philjs::store::{
    Store, StoreField, create_store,
};
```

## See Also

- [@philjs/wasm](../wasm/overview.md) - WebAssembly utilities
- [@philjs/ssr](../ssr/overview.md) - Server-side rendering
- [@philjs/liveview](../liveview/overview.md) - LiveView implementation
