# PhilJS Axum Integration

Modern Axum web framework integration for PhilJS applications.

<!-- PACKAGE_GUIDE_START -->
## Overview

Axum web framework integration for PhilJS - SSR, middleware, and typed extractors

## Focus Areas

- axum, philjs, ssr, web, rust

## Entry Points

- packages/philjs-axum/src/lib.rs

## Quick Start

```toml
[dependencies]
philjs-axum = "0.1.0"
```

```rust
use philjs_axum::{PhilJsHtml, api_error, api_response};
```

Use the exported items above as building blocks in your application.

## Exports at a Glance

- PhilJsHtml
- api_error
- api_response
- render_document
- render_to_response
- render_with_hydration
<!-- PACKAGE_GUIDE_END -->

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

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Source files: packages/philjs-axum/src/lib.rs

### Public API
- Public modules: extractors, handlers, middleware, prelude, ssr, state, tower, websocket
- Public items: PhilJsHtml, api_error, api_response, render_document, render_to_response, render_with_hydration
- Re-exports: axum::extract::{State, Path, Query}, axum::{Router, routing::{get, post, put, patch, delete}, response::{Html, Json, IntoResponse}, http::StatusCode}, crate::extractors::{PhilJsJson, PhilJsQuery, SsrContext}, crate::handlers::{health_check, not_found, ApiResponse, PaginationParams}, crate::middleware::PhilJsLayer, crate::ssr::{HtmlDocument, MetaTag, Script, SeoBuilder}, crate::state::{AppState, AppStateBuilder, Environment}, crate::tower::{TracingLayer, TimeoutLayer, RequestIdLayer, SecurityHeadersLayer, RateLimitLayer}, crate::websocket::{LiveViewSocket, LiveViewHandler, BroadcastChannel, PresenceTracker}, extractors::{PhilJsJson, PhilJsQuery, SsrContext}, handlers::{health_check, not_found, ApiResponse}, middleware::PhilJsLayer, philjs::prelude::*, ssr::{HtmlDocument, MetaTag, Script}, state::{AppState, AppStateBuilder, Environment, CacheStats}, tower::{TracingLayer, TimeoutLayer, RequestIdLayer, SecurityHeadersLayer, RateLimitLayer}, websocket::{LiveViewSocket, LiveViewHandler, BroadcastChannel, PresenceTracker}
<!-- API_SNAPSHOT_END -->

## License

MIT
