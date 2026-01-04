# @philjs/macros

Procedural macros for PhilJS Rust development including component, signal, and view macros.

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
philjs-macros = "0.1"
```

## Overview

`@philjs/macros` provides essential macros for PhilJS Rust:

- **component**: Define reactive components
- **signal**: Create reactive signals
- **memo**: Derive computed values
- **effect**: Run side effects
- **view**: JSX-like template syntax
- **server**: Server function definitions
- **Store**: Derive deep reactive stores

## Component Macro

```rust
use philjs_macros::component;

#[component]
fn Counter(
    #[prop(default = 0)] initial: i32,
    #[prop(optional)] label: Option<String>,
) -> impl IntoView {
    let count = signal!(initial);

    view! {
        <div>
            <span>{label.unwrap_or_default()}</span>
            <span>{count}</span>
            <button on:click=move |_| count.update(|c| *c += 1)>"+1"</button>
        </div>
    }
}
```

## Signal Macro

```rust
use philjs_macros::signal;

// Simple signal
let count = signal!(0);

// With type annotation
let name = signal!::<String>("".into());

// Tuple destructuring
let (get, set) = signal!(0).split();
```

## View Macro

```rust
use philjs_macros::view;

view! {
    <div class="container" id="main">
        <h1>"Hello, " {name}</h1>
        <Show when=move || logged_in.get()>
            <UserMenu />
        </Show>
        <For each=move || items.get() key=|item| item.id>
            {|item| view! { <ItemCard item=item /> }}
        </For>
    </div>
}
```

## Store Macro

```rust
use philjs_macros::Store;

#[derive(Store, Clone)]
struct AppState {
    user: Option<User>,
    settings: Settings,
    notifications: Vec<Notification>,
}

// Deep reactive updates
store.user.set(Some(user));
store.settings.theme.set(Theme::Dark);
store.notifications.push(notification);
```

## Server Macro

```rust
use philjs_macros::server;

#[server]
async fn get_user(id: u64) -> Result<User, ServerError> {
    db.find_user(id).await
}

#[server(GetPosts, "/api/posts")]
async fn get_posts(page: u32) -> Result<Vec<Post>, ServerError> {
    db.get_posts(page).await
}
```

## See Also

- [@philjs/rust](../rust/overview.md) - Rust framework
- [@philjs/core](../core/overview.md) - Core concepts
