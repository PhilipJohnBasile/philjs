# @philjs/actix

Actix Web integration for PhilJS server-side applications with SSR, API routes, and real-time capabilities.

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
philjs-actix = "0.1"
actix-web = "4"
```

## Overview

`@philjs/actix` provides Actix Web integration for PhilJS:

- **SSR Rendering**: Server-side render PhilJS components
- **API Routes**: Type-safe API endpoints
- **WebSocket Support**: Real-time communication
- **Server Functions**: RPC-style server/client calls
- **Middleware**: Authentication, logging, compression
- **Static Files**: Asset serving with caching

## Quick Start

```rust
use actix_web::{App, HttpServer};
use philjs_actix::{PhilJSConfig, render_to_response};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .configure(PhilJSConfig::default())
            .route("/", web::get().to(index))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}

async fn index() -> impl Responder {
    render_to_response(|| view! { <App /> })
}
```

## SSR Configuration

```rust
use philjs_actix::{PhilJSConfig, SSROptions};

let config = PhilJSConfig {
    ssr: SSROptions {
        streaming: true,
        hydration: true,
        cache_ttl: Duration::from_secs(60),
    },
    static_files: "./dist",
    api_prefix: "/api",
};
```

## API Routes

```rust
use philjs_actix::api;

#[api(GET, "/users/:id")]
async fn get_user(path: Path<u64>) -> Result<Json<User>> {
    let user = db.find_user(path.into_inner()).await?;
    Ok(Json(user))
}

#[api(POST, "/users")]
async fn create_user(body: Json<CreateUser>) -> Result<Json<User>> {
    let user = db.create_user(body.into_inner()).await?;
    Ok(Json(user))
}
```

## WebSocket Support

```rust
use philjs_actix::ws::{WebSocket, Message};

async fn websocket(ws: WebSocket) -> impl Responder {
    ws.on_message(|msg| async move {
        match msg {
            Message::Text(text) => {
                ws.send(Message::Text(format!("Echo: {}", text))).await
            }
            _ => Ok(())
        }
    })
}
```

## See Also

- [@philjs/rust](../rust/overview.md) - Rust framework
- [@philjs/axum](../axum/overview.md) - Axum integration
- [@philjs/ssr](../ssr/overview.md) - SSR documentation
