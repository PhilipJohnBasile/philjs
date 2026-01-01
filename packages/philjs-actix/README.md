# PhilJS Actix-web Integration

Production-ready Actix-web integration for PhilJS applications with server-side rendering, WebSocket support, and comprehensive middleware.

## Features

- **Server-Side Rendering**: Full SSR support with streaming and hydration
- **Custom Extractors**: Type-safe request data extraction with better error messages
- **Pre-built Handlers**: Common route handlers for health checks, pagination, and more
- **WebSocket Support**: Real-time communication for LiveView components
- **Session Management**: Secure session handling out of the box
- **SEO Optimization**: Built-in SEO helpers and meta tag builders

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
philjs-actix = "2.0"
actix-web = "4.4"
```

## Quick Start

```rust
use actix_web::{web, App, HttpServer};
use philjs_actix::prelude::*;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/", web::get().to(index))
            .route("/health", web::get().to(health_check))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}

async fn index() -> impl Responder {
    render_to_response(|| view! {
        <h1>"Welcome to PhilJS with Actix!"</h1>
        <p>"Server-side rendered with love"</p>
    })
}
```

## Server-Side Rendering

### Basic SSR

```rust
use philjs_actix::prelude::*;

async fn home() -> impl Responder {
    render_to_response(|| view! {
        <div>
            <h1>"Home Page"</h1>
            <p>"This is server-side rendered"</p>
        </div>
    })
}
```

### SSR with Hydration

```rust
use philjs_actix::prelude::*;
use serde::Serialize;

#[derive(Serialize)]
struct PageData {
    user: String,
    items: Vec<String>,
}

async fn dashboard() -> impl Responder {
    let data = PageData {
        user: "John Doe".to_string(),
        items: vec!["Item 1".to_string(), "Item 2".to_string()],
    };

    render_with_data(
        || view! {
            <div id="dashboard">
                <h1>"Dashboard"</h1>
            </div>
        },
        data,
    )
}
```

### Full HTML Documents

```rust
use philjs_actix::ssr::{HtmlDocument, MetaTag, Script, SeoBuilder};

async fn landing_page() -> impl Responder {
    let seo = SeoBuilder::new("My Awesome App")
        .description("The best app ever built")
        .keywords(vec!["rust", "web", "philjs"])
        .og("image", "https://example.com/og-image.jpg")
        .og("type", "website")
        .twitter("card", "summary_large_image")
        .build();

    let mut doc = HtmlDocument::new("My Awesome App")
        .lang("en")
        .stylesheet("/static/styles.css")
        .script(Script::src("/static/app.js").module().defer())
        .body(render_to_string(|| view! {
            <div class="app">
                <h1>"Welcome"</h1>
            </div>
        }));

    for tag in seo {
        doc = doc.meta(tag);
    }

    doc.respond()
}
```

## Custom Extractors

PhilJS Actix provides custom extractors with improved error handling:

### JSON Extractor

```rust
use philjs_actix::extractors::Json;
use serde::Deserialize;

#[derive(Deserialize)]
struct CreateUser {
    name: String,
    email: String,
}

async fn create_user(Json(user): Json<CreateUser>) -> impl Responder {
    // Validation happens automatically with better error messages
    HttpResponse::Ok().json(user)
}
```

### Query Parameters

```rust
use philjs_actix::extractors::Query;

#[derive(Deserialize)]
struct SearchQuery {
    q: String,
    page: Option<u32>,
}

async fn search(Query(query): Query<SearchQuery>) -> impl Responder {
    let page = query.page.unwrap_or(1);
    HttpResponse::Ok().body(format!("Searching for: {}", query.q))
}
```

### SSR Context

```rust
use philjs_actix::extractors::SsrContext;

async fn about(ctx: SsrContext) -> impl Responder {
    let user_agent = ctx.user_agent().unwrap_or("unknown");

    render_to_response(|| view! {
        <div>
            <h1>"About"</h1>
            <p>"Your browser: " {user_agent}</p>
        </div>
    })
}
```

## Pre-built Handlers

### Health Check

```rust
use philjs_actix::handlers::health_check;

App::new()
    .route("/health", web::get().to(health_check))
```

### Pagination

```rust
use philjs_actix::handlers::{PaginationParams, PaginatedResponse};

async fn list_users(params: web::Query<PaginationParams>) -> impl Responder {
    let users = get_users(params.offset(), params.limit()).await;
    let total = count_users().await;

    PaginatedResponse::new(users, total, params.page, params.per_page).build()
}
```

### API Responses

```rust
use philjs_actix::handlers::ApiResponse;

async fn create_item(data: web::Json<Item>) -> impl Responder {
    match save_item(&data).await {
        Ok(item) => ApiResponse::success(item)
            .with_message("Item created successfully")
            .build(),
        Err(e) => ApiResponse::<()>::error(e.to_string())
            .with_error("Validation failed")
            .build(),
    }
}
```

### Redirects

```rust
use philjs_actix::handlers::redirect;

async fn old_route() -> impl Responder {
    redirect("/new-route", false) // temporary redirect
}

async fn moved_permanently() -> impl Responder {
    redirect("/new-location", true) // permanent redirect
}
```

## WebSocket LiveView

```rust
#[cfg(feature = "websocket")]
use philjs_actix::websocket::LiveViewSocket;

#[derive(Default)]
struct Counter {
    count: i32,
}

async fn counter_liveview(
    req: HttpRequest,
    stream: web::Payload,
) -> Result<HttpResponse, actix_web::Error> {
    LiveViewSocket::new(Counter::default())
        .upgrade(req, stream)
}

App::new()
    .route("/counter", web::get().to(counter_liveview))
```

## Middleware

### SSR Middleware

```rust
use philjs_actix::middleware::SsrMiddleware;

App::new()
    .wrap(SsrMiddleware::new())
    .route("/", web::get().to(index))
```

### Compression

```rust
#[cfg(feature = "compression")]
use philjs_actix::middleware::CompressionMiddleware;

App::new()
    .wrap(CompressionMiddleware::default())
```

## Static Files

```rust
#[cfg(feature = "static-files")]
use philjs_actix::handlers::StaticFileHandler;

App::new()
    .service(
        StaticFileHandler::new("./public")
            .with_cache_duration(3600)
            .build()
    )
```

## Error Handling

```rust
use philjs_actix::handlers::{ErrorHandler, not_found};

App::new()
    .default_service(web::to(not_found))
```

Custom errors:

```rust
use philjs_actix::handlers::ErrorHandler;

async fn custom_error() -> impl Responder {
    ErrorHandler::new(500, "Something went wrong").html()
}

async fn api_error() -> impl Responder {
    ErrorHandler::new(400, "Invalid request").json()
}
```

## Advanced SSR

### Streaming SSR

```rust
use philjs_actix::ssr::{SsrRenderer, SsrConfig};

async fn stream_page() -> impl Responder {
    let config = SsrConfig {
        streaming: true,
        hydration: true,
        ..Default::default()
    };

    let renderer = SsrRenderer::new(config);
    renderer.to_response(|| view! {
        <div>"Streamed content"</div>
    })
}
```

## Complete Example

```rust
use actix_web::{web, App, HttpServer, HttpResponse, Responder};
use philjs_actix::prelude::*;
use philjs_actix::handlers::{health_check, PaginationParams, ApiResponse};
use philjs_actix::extractors::{Json, SsrContext};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: i64,
    name: String,
    email: String,
}

async fn home(ctx: SsrContext) -> impl Responder {
    render_to_response(|| view! {
        <div>
            <h1>"Welcome to My App"</h1>
            <p>"Path: " {ctx.path()}</p>
        </div>
    })
}

async fn create_user(Json(user): Json<User>) -> impl Responder {
    ApiResponse::success(user)
        .with_message("User created")
        .build()
}

async fn list_users(params: web::Query<PaginationParams>) -> impl Responder {
    let users = vec![]; // fetch from database
    PaginatedResponse::new(users, 0, params.page, params.per_page).build()
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/", web::get().to(home))
            .route("/health", web::get().to(health_check))
            .route("/api/users", web::post().to(create_user))
            .route("/api/users", web::get().to(list_users))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```

## Features

Enable optional features in your `Cargo.toml`:

```toml
[dependencies]
philjs-actix = { version = "2.0", features = ["websocket", "session", "static-files"] }
```

Available features:
- `ssr` (default): Server-side rendering support
- `websocket`: WebSocket and LiveView support
- `session`: Session management
- `static-files`: Static file serving
- `compression`: Response compression
- `tls`: TLS/SSL support

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Source files: packages/philjs-actix/src/lib.rs

### Public API
- Public modules: config, cors, error, extractors, handlers, middleware, prelude, service, session, ssr, websocket
- Public items: api_error, api_response, render_document, render_stream, render_to_response, render_with_data
- Re-exports: actix_web::{
        web, App, HttpServer, HttpRequest, HttpResponse,
        http::StatusCode,
        Responder,
    }, config::PhilJsConfig, crate::config::PhilJsConfig, crate::error::PhilJsError, crate::extractors::{Json, Form, Path, Query, SsrContext, ConnectionInfo}, crate::handlers::{
        health_check, not_found, cors_preflight, redirect,
        ApiResponse, ErrorHandler, PaginationParams, PaginatedResponse,
    }, crate::middleware::{SsrMiddleware, CompressionMiddleware, TracingMiddleware}, crate::service::PhilJsService, crate::session::{SessionManager, SessionConfig}, crate::ssr::{
        SsrRenderer, SsrConfig, HtmlDocument, MetaTag, Script, SeoBuilder,
    }, crate::websocket::{LiveViewSocket, WebSocketHandler}, crate::{render_to_response, render_with_data, render_stream, api_response}, error::PhilJsError, middleware::{SsrMiddleware, CompressionMiddleware, TracingMiddleware}, philjs::prelude::*, service::PhilJsService, session::{SessionManager, SessionConfig}, websocket::{LiveViewSocket, WebSocketHandler}
<!-- API_SNAPSHOT_END -->

## License

MIT
