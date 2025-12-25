# philjs-macros

Procedural macros for PhilJS - ergonomic Rust macros for building reactive web applications.

## Features

- **`#[component]`** - Transform functions into PhilJS components with automatic props handling
- **`#[signal]`** - Create reactive signals from struct fields with generated getters/setters
- **`#[derive(Props)]`** - Derive Props trait with builder pattern and validation
- **`view!`** - JSX-like syntax for building UI in Rust
- **`#[server]`** - Mark functions as server-only with automatic RPC generation

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
philjs-macros = "0.1.0"
```

## Usage

### Component Macro

Transform functions into reusable components:

```rust
use philjs_macros::component;

#[component]
fn Button(text: String, disabled: bool) -> impl IntoView {
    view! {
        <button disabled={disabled}>
            {text}
        </button>
    }
}

// Use the component
let props = ButtonProps {
    text: "Click me!".to_string(),
    disabled: false,
};
let button = Button(props);
```

### Signal Macro

Create reactive state management:

```rust
use philjs_macros::signal;

#[signal]
struct AppState {
    count: i32,
    user: Option<String>,
}

let state = AppState::new(0, None);

// Use generated methods
state.set_count(5);
state.update_count(|c| *c += 1);
println!("Count: {}", state.count());
```

### Props Macro

Derive builder pattern for component props:

```rust
use philjs_macros::Props;

#[derive(Props)]
struct CardProps {
    title: String,

    #[prop(default = "primary")]
    variant: &'static str,

    #[prop(optional)]
    description: Option<String>,

    #[prop(into)]
    content: String,
}

let props = CardProps::builder()
    .title("My Card".to_string())
    .content("Hello")  // Accepts &str with #[prop(into)]
    .build();
```

### View Macro

JSX-like syntax for building UI:

```rust
use philjs_macros::view;

let name = "World";
let items = vec!["Apple", "Banana", "Cherry"];

let ui = view! {
    <div class="container">
        <h1>"Hello, " {name}</h1>
        <ul>
            {items.iter().map(|item| view! {
                <li>{item}</li>
            }).collect::<Vec<_>>()}
        </ul>
    </div>
};
```

Features:
- Self-closing tags: `<img src="photo.jpg" />`
- Namespaced attributes: `<button on:click={handler}>`
- Expressions: `{count}`, `{format!("x = {}", x)}`
- Conditionals: `{show.then(|| view! { <div>"Visible"</div> })}`
- Loops: `{items.iter().map(|i| ...).collect::<Vec<_>>()}`

### Server Macro

Create server functions with automatic client-side RPC:

```rust
use philjs_macros::server;

#[server]
async fn fetch_user(id: u32) -> Result<User, ServerError> {
    let db = get_database().await;
    db.get_user(id).await
}

// On the client, this automatically becomes an RPC call:
let user = fetch_user(42).await?;
```

Custom endpoints:

```rust
#[server(endpoint = "/api/custom")]
async fn custom_function(data: String) -> Result<(), Error> {
    // Server-only code
    Ok(())
}

#[server(prefix = "/v1")]
async fn versioned_api(param: i32) -> Result<i32, Error> {
    // Will be available at /v1/versioned_api
    Ok(param * 2)
}
```

## Advanced Usage

### Component with Generics

```rust
#[component]
fn List<T: Display>(items: Vec<T>) -> impl IntoView {
    view! {
        <ul>
            {items.iter().map(|item| view! {
                <li>{item}</li>
            }).collect::<Vec<_>>()}
        </ul>
    }
}
```

### Transparent Components

For components that don't need props structs:

```rust
#[component(transparent)]
fn Title(text: String) -> impl IntoView {
    view! { <h1>{text}</h1> }
}

// Use directly without props struct
let title = Title("Hello".to_string());
```

### Signal with Complex Types

```rust
#[derive(Clone)]
struct User {
    id: u32,
    name: String,
}

#[signal]
struct UserManager {
    current: Option<User>,
    all_users: Vec<User>,
}

let manager = UserManager::new(None, vec![]);
manager.update_all_users(|users| {
    users.push(User { id: 1, name: "Alice".to_string() });
});
```

## Testing

Run the test suite:

```bash
cargo test
```

The test suite includes:
- Component macro tests
- Signal macro tests
- Props derive tests
- View macro tests
- Server function tests

## Architecture

This crate uses:
- **syn** - Parsing Rust syntax
- **quote** - Code generation
- **proc-macro2** - Procedural macro utilities
- **darling** - Attribute parsing

All macros are designed to:
- Provide helpful error messages
- Generate efficient code
- Support generics and complex types
- Match the ergonomics of Leptos/Dioxus

## License

MIT
