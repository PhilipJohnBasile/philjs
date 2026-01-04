# @philjs/axum

Axum integration for PhilJS server-side applications with type-safe routing, extractors, and SSR support.

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
philjs-axum = "0.1"
axum = "0.7"
tokio = { version = "1", features = ["full"] }
```

## Overview

`@philjs/axum` provides Axum integration for PhilJS:

- **Type-safe Routing**: Compile-time route verification
- **Extractors**: Request data extraction with validation
- **SSR Rendering**: Server-side render PhilJS components
- **Server Functions**: Seamless RPC between client and server
- **State Management**: Shared application state
- **Tower Integration**: Middleware ecosystem

## Quick Start

```rust
use axum::{Router, routing::get};
use philjs_axum::{render_to_response, PhilJSLayer};

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(index))
        .layer(PhilJSLayer::new());

    axum::serve(
        tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap(),
        app
    ).await.unwrap();
}

async fn index() -> impl IntoResponse {
    render_to_response(|| view! { <App /> })
}
```

## Type-safe Routes

```rust
use philjs_axum::routes;

let router = routes![
    GET "/" => home,
    GET "/users/:id" => get_user,
    POST "/users" => create_user,
    GET "/posts/*path" => get_post,
];
```

## Extractors

```rust
use philjs_axum::extract::{Path, Query, Json, State};

async fn get_user(
    Path(id): Path<u64>,
    Query(params): Query<UserParams>,
    State(db): State<Database>,
) -> Result<Json<User>, AppError> {
    let user = db.find_user(id).await?;
    Ok(Json(user))
}
```

## Server Functions

```rust
use philjs_axum::server_fn;

#[server_fn]
async fn get_todos() -> Result<Vec<Todo>, ServerError> {
    let todos = db.get_all_todos().await?;
    Ok(todos)
}

// Called from client automatically via RPC
```

## Streaming SSR

```rust
use philjs_axum::{render_to_stream, StreamingConfig};

async fn index() -> impl IntoResponse {
    render_to_stream(
        || view! { <App /> },
        StreamingConfig {
            chunk_size: 4096,
            flush_interval: Duration::from_millis(16),
        }
    )
}
```

## See Also

- [@philjs/rust](../rust/overview.md) - Rust framework
- [@philjs/actix](../actix/overview.md) - Actix integration
- [@philjs/tokio](../tokio/overview.md) - Async runtime
