//! Fullstack Application Template
//!
//! Complete fullstack template with SSR, API routes, and server functions.

use std::collections::HashMap;

/// Generate fullstack template files
pub fn generate() -> HashMap<String, String> {
    let mut files = HashMap::new();

    // Cargo.toml
    files.insert(
        "Cargo.toml".to_string(),
        r#"[package]
name = "{{name}}"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
philjs = "2.0"
philjs-server = "2.0"
philjs-axum = "2.0"
wasm-bindgen = "0.2"
console_error_panic_hook = "0.1"

# Server
axum = { version = "0.7", features = ["macros"] }
tokio = { version = "1", features = ["full"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["fs", "cors", "compression-full"] }

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Database (optional - uncomment as needed)
# sqlx = { version = "0.7", features = ["runtime-tokio-native-tls", "postgres"] }
# sea-orm = { version = "0.12", features = ["sqlx-postgres", "runtime-tokio-native-tls"] }

# Utilities
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
anyhow = "1.0"
thiserror = "1.0"

[features]
default = []
ssr = ["philjs/ssr", "philjs-axum/ssr"]

[profile.release]
opt-level = "z"
lto = true
codegen-units = 1
panic = "abort"

[profile.release.package."*"]
opt-level = "z"
"#
        .to_string(),
    );

    // src/lib.rs
    files.insert(
        "src/lib.rs".to_string(),
        r#"//! {{name}} - PhilJS Fullstack Application
//!
//! Full-stack application with SSR, API routes, and server functions.

pub mod components;
pub mod api;
pub mod server_functions;

#[cfg(not(target_arch = "wasm32"))]
pub mod server;

use philjs::prelude::*;
use components::app::App;

// ============================================================================
// Client Entry (WASM)
// ============================================================================

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
    tracing_wasm::set_as_global_default();

    // Hydrate the server-rendered HTML
    mount_to_body(|| view! { <App /> });
}

// ============================================================================
// Server Entry
// ============================================================================

#[cfg(not(target_arch = "wasm32"))]
pub use server::start_server;

#[cfg(not(target_arch = "wasm32"))]
pub fn render_app() -> String {
    use philjs::ssr::render_to_string;

    render_to_string(|| view! {
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>"{{name}} | PhilJS Fullstack App"</title>
                <link rel="stylesheet" href="/static/styles.css" />
            </head>
            <body>
                <div id="app">
                    <App />
                </div>
                <script type="module" src="/pkg/app.js"></script>
            </body>
        </html>
    })
}
"#
        .to_string(),
    );

    // src/components/mod.rs
    files.insert(
        "src/components/mod.rs".to_string(),
        "pub mod app;\npub mod todo_list;\n".to_string(),
    );

    // src/components/app.rs
    files.insert(
        "src/components/app.rs".to_string(),
        r#"//! Root App Component

use philjs::prelude::*;
use super::todo_list::TodoList;

#[component]
pub fn App() -> impl IntoView {
    view! {
        <main class="app">
            <header class="header">
                <h1>"{{name}}"</h1>
                <p class="tagline">"PhilJS Fullstack Application"</p>
            </header>

            <section class="content">
                <TodoList />
            </section>

            <footer class="footer">
                <p>
                    "Built with "
                    <a href="https://philjs.dev" target="_blank">"PhilJS"</a>
                    " - Full-stack Rust web framework"
                </p>
            </footer>
        </main>
    }
}
"#
        .to_string(),
    );

    // src/components/todo_list.rs
    files.insert(
        "src/components/todo_list.rs".to_string(),
        r#"//! Todo List Component
//!
//! Demonstrates server functions and reactive state.

use philjs::prelude::*;
use crate::server_functions::{get_todos, create_todo, toggle_todo, Todo};

#[component]
pub fn TodoList() -> impl IntoView {
    let (todos, set_todos) = create_signal(Vec::<Todo>::new());
    let (new_todo_text, set_new_todo_text) = create_signal(String::new());
    let (loading, set_loading) = create_signal(false);

    // Load todos on mount
    create_effect(move |_| {
        spawn_local(async move {
            if let Ok(todos_list) = get_todos().await {
                set_todos.set(todos_list);
            }
        });
    });

    let add_todo = move |_| {
        let text = new_todo_text.get();
        if text.trim().is_empty() {
            return;
        }

        set_loading.set(true);
        spawn_local(async move {
            match create_todo(text.clone()).await {
                Ok(todo) => {
                    set_todos.update(|todos| todos.push(todo));
                    set_new_todo_text.set(String::new());
                }
                Err(e) => {
                    tracing::error!("Failed to create todo: {:?}", e);
                }
            }
            set_loading.set(false);
        });
    };

    let toggle = move |id: u64| {
        spawn_local(async move {
            if toggle_todo(id).await.is_ok() {
                set_todos.update(|todos| {
                    if let Some(todo) = todos.iter_mut().find(|t| t.id == id) {
                        todo.completed = !todo.completed;
                    }
                });
            }
        });
    };

    view! {
        <div class="todo-list">
            <h2>"Todo List"</h2>
            <p class="subtitle">"Powered by server functions"</p>

            <div class="todo-input">
                <input
                    type="text"
                    placeholder="What needs to be done?"
                    prop:value=new_todo_text
                    on:input=move |ev| set_new_todo_text.set(event_target_value(&ev))
                    on:keypress=move |ev| {
                        if ev.key() == "Enter" {
                            add_todo(ev);
                        }
                    }
                />
                <button
                    on:click=add_todo
                    disabled=loading
                    class="btn-add"
                >
                    {move || if loading.get() { "Adding..." } else { "Add" }}
                </button>
            </div>

            <ul class="todos">
                <For
                    each=move || todos.get()
                    key=|todo| todo.id
                    children=move |todo: Todo| {
                        let id = todo.id;
                        view! {
                            <li class="todo-item" class:completed=todo.completed>
                                <input
                                    type="checkbox"
                                    checked=todo.completed
                                    on:change=move |_| toggle(id)
                                />
                                <span class="todo-text">{todo.text}</span>
                            </li>
                        }
                    }
                />
            </ul>

            {move || {
                let count = todos.get().iter().filter(|t| !t.completed).count();
                view! {
                    <div class="todo-stats">
                        {count} " item(s) remaining"
                    </div>
                }
            }}
        </div>
    }
}
"#
        .to_string(),
    );

    // src/server_functions.rs
    files.insert(
        "src/server_functions.rs".to_string(),
        r#"//! Server Functions
//!
//! Functions that run on the server but can be called from the client.

use philjs::prelude::*;
use serde::{Deserialize, Serialize};

#[cfg(not(target_arch = "wasm32"))]
use std::sync::Mutex;
#[cfg(not(target_arch = "wasm32"))]
use once_cell::sync::Lazy;

/// Todo item
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Todo {
    pub id: u64,
    pub text: String,
    pub completed: bool,
}

// In-memory storage (replace with database in production)
#[cfg(not(target_arch = "wasm32"))]
static TODOS: Lazy<Mutex<Vec<Todo>>> = Lazy::new(|| {
    Mutex::new(vec![
        Todo { id: 1, text: "Learn PhilJS".into(), completed: false },
        Todo { id: 2, text: "Build fullstack app".into(), completed: false },
        Todo { id: 3, text: "Deploy to production".into(), completed: false },
    ])
});

/// Get all todos
#[server(GetTodos)]
pub async fn get_todos() -> Result<Vec<Todo>, ServerFnError> {
    Ok(TODOS.lock().unwrap().clone())
}

/// Create a new todo
#[server(CreateTodo)]
pub async fn create_todo(text: String) -> Result<Todo, ServerFnError> {
    let mut todos = TODOS.lock().unwrap();
    let id = todos.iter().map(|t| t.id).max().unwrap_or(0) + 1;
    let todo = Todo {
        id,
        text,
        completed: false,
    };
    todos.push(todo.clone());
    Ok(todo)
}

/// Toggle todo completion
#[server(ToggleTodo)]
pub async fn toggle_todo(id: u64) -> Result<(), ServerFnError> {
    let mut todos = TODOS.lock().unwrap();
    if let Some(todo) = todos.iter_mut().find(|t| t.id == id) {
        todo.completed = !todo.completed;
    }
    Ok(())
}
"#
        .to_string(),
    );

    // src/api/mod.rs
    files.insert(
        "src/api/mod.rs".to_string(),
        "pub mod health;\n".to_string(),
    );

    // src/api/health.rs
    files.insert(
        "src/api/health.rs".to_string(),
        r#"//! Health Check API

use axum::{response::Json, http::StatusCode};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
}

/// GET /api/health
pub async fn health_check() -> (StatusCode, Json<HealthResponse>) {
    (
        StatusCode::OK,
        Json(HealthResponse {
            status: "ok".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
        }),
    )
}
"#
        .to_string(),
    );

    // src/server.rs
    files.insert(
        "src/server.rs".to_string(),
        r#"//! Server Configuration
//!
//! Axum server with SSR and API routes.

use axum::{
    routing::{get, post},
    Router,
    response::Html,
};
use tower_http::{
    services::ServeDir,
    compression::CompressionLayer,
    cors::CorsLayer,
};
use std::net::SocketAddr;

use crate::api::health::health_check;

pub async fn start_server() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive(tracing::Level::INFO.into()),
        )
        .init();

    let app = Router::new()
        // Pages
        .route("/", get(render_index))

        // API routes
        .route("/api/health", get(health_check))

        // Static files
        .nest_service("/pkg", ServeDir::new("pkg"))
        .nest_service("/static", ServeDir::new("static"))

        // Middleware
        .layer(CompressionLayer::new())
        .layer(CorsLayer::permissive());

    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    tracing::info!("Server listening on http://{}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;

    Ok(())
}

async fn render_index() -> Html<String> {
    Html(crate::render_app())
}
"#
        .to_string(),
    );

    // static/styles.css
    files.insert(
        "static/styles.css".to_string(),
        r#"/* {{name}} Styles */

:root {
    --color-primary: #3b82f6;
    --color-primary-dark: #2563eb;
    --color-secondary: #10b981;
    --color-danger: #ef4444;
    --color-text: #1f2937;
    --color-text-light: #6b7280;
    --color-bg: #ffffff;
    --color-bg-alt: #f9fafb;
    --color-border: #e5e7eb;
    --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --radius: 0.5rem;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    line-height: 1.6;
    color: var(--color-text);
    background-color: var(--color-bg-alt);
}

.app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.header {
    text-align: center;
    padding: 3rem 2rem;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
    color: white;
}

.header h1 {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
}

.tagline {
    font-size: 1.125rem;
    opacity: 0.9;
}

.content {
    flex: 1;
    max-width: 800px;
    width: 100%;
    margin: 0 auto;
    padding: 3rem 2rem;
}

.footer {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-light);
    background-color: var(--color-bg);
    border-top: 1px solid var(--color-border);
}

.footer a {
    color: var(--color-primary);
    text-decoration: none;
}

.footer a:hover {
    text-decoration: underline;
}

/* Todo List */
.todo-list {
    background: white;
    border-radius: var(--radius);
    padding: 2rem;
    box-shadow: var(--shadow-lg);
}

.todo-list h2 {
    font-size: 1.875rem;
    margin-bottom: 0.5rem;
}

.subtitle {
    color: var(--color-text-light);
    margin-bottom: 2rem;
}

.todo-input {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
}

.todo-input input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 2px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 1rem;
    transition: border-color 0.2s;
}

.todo-input input:focus {
    outline: none;
    border-color: var(--color-primary);
}

.btn-add {
    padding: 0.75rem 1.5rem;
    background-color: var(--color-primary);
    color: white;
    border: none;
    border-radius: var(--radius);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
}

.btn-add:hover:not(:disabled) {
    background-color: var(--color-primary-dark);
}

.btn-add:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.todos {
    list-style: none;
    margin-bottom: 1.5rem;
}

.todo-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border);
    transition: background-color 0.2s;
}

.todo-item:hover {
    background-color: var(--color-bg-alt);
}

.todo-item.completed .todo-text {
    text-decoration: line-through;
    color: var(--color-text-light);
}

.todo-item input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
}

.todo-text {
    flex: 1;
    font-size: 1rem;
}

.todo-stats {
    padding: 1rem;
    color: var(--color-text-light);
    font-size: 0.875rem;
    text-align: center;
}

/* Responsive */
@media (max-width: 640px) {
    .header h1 {
        font-size: 2rem;
    }

    .content {
        padding: 2rem 1rem;
    }

    .todo-list {
        padding: 1.5rem;
    }

    .todo-input {
        flex-direction: column;
    }
}
"#
        .to_string(),
    );

    // README.md
    files.insert(
        "README.md".to_string(),
        r#"# {{name}}

PhilJS Fullstack Application with SSR and server functions.

## Features

- Server-Side Rendering (SSR)
- Server Functions for type-safe client-server communication
- RESTful API routes
- Hot reload development
- Optimized production builds

## Getting Started

```bash
# Install dependencies
cargo build

# Start development server
cargo philjs dev

# Build for production
cargo philjs build --release

# Run production server
cargo run --features ssr --release
```

## Project Structure

```
src/
├── lib.rs              # Entry point
├── components/         # UI components
│   ├── app.rs         # Root component
│   └── todo_list.rs   # Example component
├── server_functions.rs # Server functions
├── api/               # REST API routes
│   └── health.rs      # Health check
└── server.rs          # Server configuration
static/
└── styles.css         # Styles
```

## Server Functions

Server functions run on the server but can be called from client code:

```rust
#[server(GetData)]
pub async fn get_data() -> Result<Vec<Data>, ServerFnError> {
    // This code runs on the server only
    Ok(vec![])
}

// Call from client:
let data = get_data().await?;
```

## API Routes

RESTful API endpoints are available at `/api/*`:

- `GET /api/health` - Health check

## Learn More

- [PhilJS Documentation](https://philjs.dev/docs)
- [PhilJS Examples](https://github.com/anthropics/philjs/tree/main/examples)
"#
        .to_string(),
    );

    files
}
