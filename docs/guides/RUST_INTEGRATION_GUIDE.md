# PhilJS Rust Integration Guide

Complete guide for integrating PhilJS with Rust web frameworks: Actix-web, Axum, and Rocket.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Axum Integration](#axum-integration)
4. [Actix-web Integration](#actix-web-integration)
5. [Rocket Integration](#rocket-integration)
6. [Server-Side Rendering](#server-side-rendering)
7. [Hydration](#hydration)
8. [Server Functions](#server-functions)
9. [LiveView](#liveview)
10. [Deployment](#deployment)

---

## Prerequisites

### System Requirements

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Install wasm-pack
cargo install wasm-pack

# Install cargo-philjs (PhilJS CLI)
cargo install cargo-philjs
```

### Project Setup

```bash
# Create a new PhilJS project with SSR
cargo philjs new my-app --template=ssr

# Or add to existing project
cargo philjs init --template=ssr
```

---

## Quick Start

### 1. Add Dependencies

```toml
# Cargo.toml
[dependencies]
philjs = "2.0"
philjs-axum = "2.0"  # or philjs-actix, philjs-rocket
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }

[features]
default = ["ssr"]
ssr = ["philjs/ssr"]
hydration = ["philjs/hydration"]
```

### 2. Create Your First Component

```rust
// src/components/counter.rs
use philjs::prelude::*;

#[component]
pub fn Counter(initial: i32) -> impl IntoView {
    let count = signal!(initial);

    view! {
        <div class="counter">
            <h2>"Count: " {count}</h2>
            <button on:click=move |_| count.update(|n| *n + 1)>
                "Increment"
            </button>
            <button on:click=move |_| count.update(|n| *n - 1)>
                "Decrement"
            </button>
        </div>
    }
}
```

### 3. Set Up the Server

```rust
// src/main.rs
use axum::{Router, routing::get};
use philjs::prelude::*;
use philjs_axum::prelude::*;

mod components;
use components::Counter;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(home))
        .philjs_static("/static");

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();

    println!("Server running at http://localhost:3000");
    axum::serve(listener, app).await.unwrap();
}

async fn home() -> impl IntoResponse {
    render_to_response(|| view! {
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <title>"PhilJS App"</title>
                <link rel="stylesheet" href="/static/styles.css" />
            </head>
            <body>
                <div id="app">
                    <h1>"Welcome to PhilJS"</h1>
                    <Counter initial=0 />
                </div>
                {HydrationScript::new()}
                <script type="module" src="/static/app.js"></script>
            </body>
        </html>
    })
}
```

---

## Axum Integration

### Full Setup

```rust
use axum::{
    Router,
    routing::{get, post},
    extract::{Path, Query, State},
    response::IntoResponse,
    http::StatusCode,
};
use philjs::prelude::*;
use philjs_axum::prelude::*;
use std::sync::Arc;

// Application state
#[derive(Clone)]
struct AppState {
    db: Arc<Database>,
}

#[tokio::main]
async fn main() {
    let state = AppState {
        db: Arc::new(Database::new().await),
    };

    let app = Router::new()
        // Pages
        .route("/", get(home_page))
        .route("/users/:id", get(user_page))
        .route("/about", get(about_page))

        // API routes
        .route("/api/users", get(list_users).post(create_user))
        .route("/api/users/:id", get(get_user).delete(delete_user))

        // Server functions
        .merge(philjs_axum::server_fn_router())

        // Static files
        .philjs_static("/static")

        // Middleware
        .layer(philjs_axum::middleware::compression())
        .layer(philjs_axum::middleware::cors())

        // State
        .with_state(state);

    axum::serve(
        tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap(),
        app,
    )
    .await
    .unwrap();
}

// SSR page handler
async fn home_page(State(state): State<AppState>) -> impl IntoResponse {
    let users = state.db.get_recent_users(10).await;

    render_to_response(|| view! {
        <Layout title="Home">
            <h1>"Recent Users"</h1>
            <UserList users=users />
        </Layout>
    })
}

// Dynamic route handler
async fn user_page(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> impl IntoResponse {
    match state.db.get_user(id).await {
        Some(user) => render_to_response(|| view! {
            <Layout title=user.name.clone()>
                <UserProfile user=user />
            </Layout>
        }),
        None => StatusCode::NOT_FOUND.into_response(),
    }
}
```

### Streaming SSR with Axum

```rust
use futures::Stream;
use axum::body::Body;

async fn streaming_page() -> impl IntoResponse {
    let stream = render_to_stream(|| view! {
        <Layout>
            <Suspense fallback=|| view! { <LoadingSpinner /> }>
                <AsyncData />
            </Suspense>
        </Layout>
    });

    Response::builder()
        .header("Content-Type", "text/html; charset=utf-8")
        .body(Body::from_stream(stream))
        .unwrap()
}
```

### Axum Extractors

```rust
use philjs_axum::extractors::{PhilJsJson, PhilJsQuery, SsrContext};

// Custom JSON extractor with better error messages
async fn create_user(
    PhilJsJson(input): PhilJsJson<CreateUserInput>,
) -> impl IntoResponse {
    // input is validated and parsed
    ApiResponse::success(User::create(input).await)
}

// SSR context with request info
async fn dynamic_page(ctx: SsrContext) -> impl IntoResponse {
    let user_agent = ctx.user_agent();
    let is_mobile = ctx.is_mobile();

    render_to_response(|| view! {
        <Layout>
            {if is_mobile {
                view! { <MobileLayout /> }
            } else {
                view! { <DesktopLayout /> }
            }}
        </Layout>
    })
}
```

---

## Actix-web Integration

### Full Setup

```rust
use actix_web::{web, App, HttpServer, HttpResponse, Responder};
use philjs::prelude::*;
use philjs_actix::prelude::*;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let db = web::Data::new(Database::new().await);

    HttpServer::new(move || {
        App::new()
            .app_data(db.clone())
            // Pages
            .route("/", web::get().to(home_page))
            .route("/users/{id}", web::get().to(user_page))

            // API
            .service(
                web::scope("/api")
                    .route("/users", web::get().to(list_users))
                    .route("/users", web::post().to(create_user))
            )

            // Server functions
            .configure(philjs_actix::configure_server_fns)

            // Static files
            .service(philjs_actix::static_files("/static", "./static"))

            // Middleware
            .wrap(philjs_actix::middleware::Compression::default())
            .wrap(philjs_actix::middleware::Logger::default())
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}

async fn home_page(db: web::Data<Database>) -> impl Responder {
    let users = db.get_recent_users(10).await;

    render_to_response(|| view! {
        <Layout>
            <HomePage users=users />
        </Layout>
    })
}
```

### WebSocket LiveView with Actix

```rust
use actix_web_actors::ws;
use philjs_actix::liveview::LiveViewSocket;

#[derive(Default)]
struct CounterLiveView {
    count: i32,
}

impl philjs::liveview::LiveView for CounterLiveView {
    fn mount(&mut self, _socket: &mut LiveSocket) {
        self.count = 0;
    }

    fn handle_event(&mut self, event: &LiveEvent, socket: &mut LiveSocket) {
        match event.event_type.as_str() {
            "increment" => self.count += 1,
            "decrement" => self.count -= 1,
            _ => {}
        }
        socket.push_patch();
    }

    fn render(&self) -> String {
        format!(r#"
            <div id="counter" phx-update="replace">
                <h1>Count: {}</h1>
                <button phx-click="increment">+</button>
                <button phx-click="decrement">-</button>
            </div>
        "#, self.count)
    }
}

async fn counter_ws(
    req: HttpRequest,
    stream: web::Payload,
) -> Result<HttpResponse, actix_web::Error> {
    LiveViewSocket::new(CounterLiveView::default())
        .upgrade(req, stream)
}
```

---

## Rocket Integration

### Full Setup

```rust
#[macro_use] extern crate rocket;
use philjs::prelude::*;
use philjs_rocket::prelude::*;
use rocket::fs::FileServer;

#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/", routes![home, user_page, about])
        .mount("/api", routes![list_users, create_user])
        .mount("/static", FileServer::from("static"))
        .attach(philjs_rocket::fairing())
}

#[get("/")]
async fn home(db: &State<Database>) -> PhilJsResponse {
    let users = db.get_recent_users(10).await;

    render(|| view! {
        <Layout>
            <HomePage users=users />
        </Layout>
    })
}

#[get("/users/<id>")]
async fn user_page(id: i64, db: &State<Database>) -> Option<PhilJsResponse> {
    let user = db.get_user(id).await?;

    Some(render(|| view! {
        <Layout>
            <UserProfile user=user />
        </Layout>
    }))
}
```

---

## Server-Side Rendering

### Basic SSR

```rust
use philjs::ssr::{render_to_string, render_to_stream, HydrationScript};

// Render to string (simple, blocking)
let html = render_to_string(|| view! {
    <div>
        <h1>"Hello, SSR!"</h1>
        <Counter initial=0 />
    </div>
});

// Render with hydration script
let full_html = render_to_string(|| view! {
    <!DOCTYPE html>
    <html>
        <head><title>"My App"</title></head>
        <body>
            <div id="app">
                <App />
            </div>
            {HydrationScript::new()}
        </body>
    </html>
});
```

### Streaming SSR

```rust
use philjs::ssr::{render_to_stream_async, StreamingConfig};

let config = StreamingConfig {
    flush_on_suspense: true,
    chunk_size: 16384,
};

let stream = render_to_stream_async(|| view! {
    <html>
        <head>
            <title>"Streaming App"</title>
        </head>
        <body>
            <header>
                <Nav />
            </header>
            <main>
                // This will stream in when data is ready
                <Suspense fallback=|| view! { <Skeleton /> }>
                    <AsyncContent />
                </Suspense>
            </main>
        </body>
    </html>
}, config);
```

---

## Hydration

### Full Hydration

```rust
// Client-side entry point (src/client.rs)
use philjs::dom::hydrate;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn main() {
    // Full hydration - attach all event handlers
    hydrate(|| view! {
        <App />
    });
}
```

### Partial Hydration (Islands)

```rust
use philjs::dom::hydration::{hydrate_to, HydrationMode};

#[wasm_bindgen(start)]
pub fn main() {
    // Only hydrate interactive islands
    hydrate_with_mode(|| view! { <App /> }, HydrationMode::Partial);
}

// Mark components as islands in your views
view! {
    <div data-philjs-island="counter">
        <Counter initial=0 />
    </div>
}
```

### Progressive Hydration

```rust
// Hydrate on visibility
view! {
    <div data-philjs-hydrate="visible">
        <HeavyComponent />
    </div>
}

// Hydrate on idle
view! {
    <div data-philjs-hydrate="idle">
        <Analytics />
    </div>
}

// Hydrate on first interaction
view! {
    <div data-philjs-hydrate="interaction">
        <InteractiveWidget />
    </div>
}
```

---

## Server Functions

### Defining Server Functions

```rust
use philjs::server::*;

// Simple server function
#[server]
async fn get_user(id: u64) -> ServerResult<User> {
    let user = db::find_user(id).await?;
    Ok(user)
}

// Server function with validation
#[server]
async fn create_post(input: CreatePostInput) -> ServerResult<Post> {
    // Validate input
    input.validate()?;

    // Check authentication
    let user_id = use_server_context()
        .ok_or(ServerError::Unauthorized)?
        .require_auth()?;

    // Create post
    let post = db::create_post(user_id, input).await?;
    Ok(post)
}

// Using in components
#[component]
fn UserProfile(id: u64) -> impl IntoView {
    let user = resource!(get_user(id));

    view! {
        <Suspense fallback=|| view! { <Loading /> }>
            {move || user.get().map(|u| view! {
                <div class="profile">
                    <h1>{u.name}</h1>
                    <p>{u.email}</p>
                </div>
            })}
        </Suspense>
    }
}
```

---

## LiveView

### Phoenix-Style LiveView

```rust
use philjs::liveview::*;

#[derive(Default)]
struct TodoApp {
    todos: Vec<Todo>,
    input: String,
}

impl LiveView for TodoApp {
    fn mount(&mut self, _socket: &mut LiveSocket) {
        self.todos = db::get_todos().await;
    }

    fn handle_event(&mut self, event: &LiveEvent, socket: &mut LiveSocket) {
        match event.event_type.as_str() {
            "add_todo" => {
                if !self.input.is_empty() {
                    self.todos.push(Todo::new(&self.input));
                    self.input.clear();
                    socket.push_patch();
                }
            }
            "toggle_todo" => {
                if let Some(id) = event.value.get("id").and_then(|v| v.as_u64()) {
                    if let Some(todo) = self.todos.iter_mut().find(|t| t.id == id) {
                        todo.completed = !todo.completed;
                        socket.push_patch();
                    }
                }
            }
            "update_input" => {
                if let Some(value) = event.value.get("value").and_then(|v| v.as_str()) {
                    self.input = value.to_string();
                }
            }
            _ => {}
        }
    }

    fn render(&self) -> String {
        // Use PhilJS view macro for rendering
        render_to_string(|| view! {
            <div class="todo-app" id="todo-app">
                <h1>"Todo List"</h1>

                <form phx-submit="add_todo">
                    <input
                        type="text"
                        value=self.input.clone()
                        phx-change="update_input"
                        placeholder="Add a todo..."
                    />
                    <button type="submit">"Add"</button>
                </form>

                <ul class="todo-list">
                    {self.todos.iter().map(|todo| view! {
                        <li
                            class=if todo.completed { "completed" } else { "" }
                            phx-click="toggle_todo"
                            phx-value-id=todo.id
                        >
                            {&todo.text}
                        </li>
                    }).collect::<Vec<_>>()}
                </ul>
            </div>
        })
    }
}
```

---

## Deployment

### Docker

```dockerfile
# Dockerfile
FROM rust:1.75 as builder

WORKDIR /app
COPY . .

# Build for production
RUN cargo build --release --features ssr

# Runtime image
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/my-app /usr/local/bin/
COPY --from=builder /app/static /app/static

WORKDIR /app
ENV RUST_LOG=info
EXPOSE 3000

CMD ["my-app"]
```

### Vercel

```bash
# Install adapter
cargo add philjs-vercel

# Deploy
cargo philjs deploy --platform=vercel
```

### Cloudflare Workers

```bash
# Build for Cloudflare
cargo philjs build --target=cloudflare

# Deploy
wrangler deploy
```

### Railway / Fly.io

```bash
# Railway
cargo philjs deploy --platform=railway

# Fly.io
cargo philjs deploy --platform=fly
```

---

## Best Practices

### 1. Project Structure

```
my-app/
├── src/
│   ├── lib.rs           # Library entry point
│   ├── main.rs          # Server entry point
│   ├── client.rs        # Client entry point (WASM)
│   ├── components/      # Reusable components
│   │   ├── mod.rs
│   │   ├── layout.rs
│   │   └── counter.rs
│   ├── pages/           # Page components
│   │   ├── mod.rs
│   │   ├── home.rs
│   │   └── about.rs
│   ├── server/          # Server-only code
│   │   ├── mod.rs
│   │   └── db.rs
│   └── api/             # API handlers
│       └── mod.rs
├── static/              # Static assets
├── Cargo.toml
└── philjs.toml          # PhilJS configuration
```

### 2. Feature Flags

```toml
[features]
default = ["ssr"]
ssr = ["philjs/ssr", "philjs-axum"]
hydration = ["philjs/hydration", "philjs/wasm"]
full = ["ssr", "hydration"]
```

### 3. Performance Tips

- Use streaming SSR for large pages
- Enable partial hydration for static content
- Use server functions for data mutations
- Cache database queries with `Resource`
- Minimize bundle size with tree-shaking

---

## Troubleshooting

### Common Issues

1. **WASM target not installed**
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

2. **Hydration mismatch**
   - Ensure server and client render the same content
   - Check for random values or timestamps in components

3. **Server function not found**
   - Verify the function is registered
   - Check the endpoint URL matches

4. **Slow initial load**
   - Enable streaming SSR
   - Use partial hydration
   - Optimize WASM bundle size

---

## Resources

- [PhilJS Documentation](https://philjs.dev/docs)
- [API Reference](https://philjs.dev/api)
- [Examples](https://github.com/anthropics/philjs/tree/main/examples)
- [Discord Community](https://discord.gg/philjs)
