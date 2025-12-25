# PhilJS Axum Integration

Modern Axum web framework integration for PhilJS applications.

## Features

- **Server-Side Rendering**: Full SSR support
- **Type-safe Extractors**: Custom extractors with better error handling
- **Middleware**: PhilJS-specific middleware
- **Route Handlers**: Pre-built handlers for common patterns

## Installation

```toml
[dependencies]
philjs-axum = "2.0"
axum = "0.7"
```

## Quick Start

```rust
use axum::{Router, routing::get};
use philjs_axum::prelude::*;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(index))
        .route("/health", get(health_check));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();

    axum::serve(listener, app).await.unwrap();
}

async fn index() -> Html<String> {
    Html("Hello from PhilJS!".to_string())
}
```

## Extractors

```rust
use philjs_axum::extractors::{PhilJsJson, PhilJsQuery};

async fn create_user(PhilJsJson(user): PhilJsJson<User>) -> impl IntoResponse {
    ApiResponse::success(user)
}
```

## License

MIT
