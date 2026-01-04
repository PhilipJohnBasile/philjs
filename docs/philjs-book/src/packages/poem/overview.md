# @philjs/poem

Poem framework integration for PhilJS with OpenAPI support and elegant routing.

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
philjs-poem = "0.1"
poem = "2"
poem-openapi = "4"
```

## Overview

`@philjs/poem` provides Poem integration for PhilJS:

- **OpenAPI Support**: Auto-generated API documentation
- **Type-safe Routing**: Compile-time route verification
- **Middleware**: Request/response processing
- **SSR Rendering**: Server-side PhilJS rendering
- **WebSocket**: Real-time communication
- **Static Files**: Asset serving

## Quick Start

```rust
use poem::{Route, Server};
use philjs_poem::{render, PhilJSEndpoint};

#[handler]
fn index() -> impl IntoResponse {
    render(|| view! { <App /> })
}

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    let app = Route::new()
        .at("/", get(index))
        .nest("/api", api_routes());

    Server::new(TcpListener::bind("0.0.0.0:3000"))
        .run(app)
        .await
}
```

## OpenAPI Integration

```rust
use poem_openapi::{OpenApi, Object, payload::Json};

#[derive(Object)]
struct User {
    id: u64,
    name: String,
}

struct Api;

#[OpenApi]
impl Api {
    #[oai(path = "/users/:id", method = "get")]
    async fn get_user(&self, id: Path<u64>) -> Json<User> {
        Json(User { id: id.0, name: "John".into() })
    }
}
```

## See Also

- [@philjs/rust](../rust/overview.md) - Rust framework
- [@philjs/axum](../axum/overview.md) - Axum integration
- [@philjs/openapi](../openapi/overview.md) - OpenAPI utilities
