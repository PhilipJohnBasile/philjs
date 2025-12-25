//! # PhilJS Axum Integration
//!
//! Modern Axum web framework integration for PhilJS applications.
//!
//! ## Features
//!
//! - **SSR Support**: Server-side rendering with streaming
//! - **Extractors**: Type-safe request data extraction
//! - **Handlers**: Common handler patterns
//! - **WebSocket**: LiveView support for real-time updates
//! - **Tower Middleware**: Compatible middleware layers
//!
//! ## Quick Start
//!
//! ```rust,no_run
//! use axum::{Router, routing::get};
//! use philjs_axum::prelude::*;
//!
//! async fn index() -> PhilJsHtml {
//!     render_document("Home", || view! {
//!         <h1>"Welcome to PhilJS!"</h1>
//!     })
//! }
//!
//! #[tokio::main]
//! async fn main() {
//!     let app = Router::new()
//!         .route("/", get(index))
//!         .layer(PhilJsLayer::new());
//!
//!     let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
//!     axum::serve(listener, app).await.unwrap();
//! }
//! ```

#![warn(missing_docs)]

pub mod extractors;
pub mod handlers;
pub mod middleware;
pub mod ssr;
pub mod state;
pub mod websocket;
pub mod tower;

pub use extractors::{PhilJsJson, PhilJsQuery, SsrContext};
pub use handlers::{health_check, not_found, ApiResponse};
pub use middleware::PhilJsLayer;
pub use ssr::{HtmlDocument, MetaTag, Script};
pub use state::{AppState, AppStateBuilder, Environment, CacheStats};
pub use websocket::{LiveViewSocket, LiveViewHandler, BroadcastChannel, PresenceTracker};
pub use tower::{TracingLayer, TimeoutLayer, RequestIdLayer, SecurityHeadersLayer, RateLimitLayer};

/// Prelude - import commonly used items
pub mod prelude {
    pub use crate::extractors::{PhilJsJson, PhilJsQuery, SsrContext};
    pub use crate::handlers::{health_check, not_found, ApiResponse, PaginationParams};
    pub use crate::middleware::PhilJsLayer;
    pub use crate::ssr::{HtmlDocument, MetaTag, Script, SeoBuilder};
    pub use crate::state::{AppState, AppStateBuilder, Environment};
    pub use crate::websocket::{LiveViewSocket, LiveViewHandler, BroadcastChannel, PresenceTracker};
    pub use crate::tower::{TracingLayer, TimeoutLayer, RequestIdLayer, SecurityHeadersLayer, RateLimitLayer};
    pub use axum::{Router, routing::{get, post, put, patch, delete}, response::{Html, Json, IntoResponse}, http::StatusCode};
    pub use axum::extract::{State, Path, Query};
    pub use philjs::prelude::*;
}

use axum::response::{Html, IntoResponse};
use serde::Serialize;

/// Render a PhilJS view to an HTML response
pub fn render_to_response<F, V>(f: F) -> Html<String>
where
    F: FnOnce() -> V,
    V: philjs::IntoView,
{
    let html = philjs::render_to_string(f);
    Html(html)
}

/// Render a PhilJS view with hydration data
pub fn render_with_hydration<F, V, D>(f: F, data: D) -> Html<String>
where
    F: FnOnce() -> V,
    V: philjs::IntoView,
    D: Serialize,
{
    let view_html = philjs::render_to_string(f);
    let data_json = serde_json::to_string(&data).unwrap_or_default();

    let html = format!(
        r#"{}
<script type="application/json" id="__PHILJS_DATA__">{}</script>
<script>
window.__PHILJS_DATA__ = JSON.parse(document.getElementById('__PHILJS_DATA__').textContent);
</script>"#,
        view_html, data_json
    );

    Html(html)
}

/// Render a full HTML document
pub fn render_document<F, V>(title: &str, f: F) -> Html<String>
where
    F: FnOnce() -> V,
    V: philjs::IntoView,
{
    let body_html = philjs::render_to_string(f);

    let html = format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{}</title>
    <link rel="stylesheet" href="/static/styles.css">
</head>
<body>
    <div id="app">{}</div>
    <script type="module" src="/static/app.js"></script>
</body>
</html>"#,
        title, body_html
    );

    Html(html)
}

/// PhilJS HTML response type
pub type PhilJsHtml = Html<String>;

/// Create a JSON API response
pub fn api_response<T: Serialize>(data: T) -> impl IntoResponse {
    axum::Json(data)
}

/// Create an error API response
pub fn api_error(status: axum::http::StatusCode, message: &str) -> impl IntoResponse {
    (
        status,
        axum::Json(serde_json::json!({
            "error": message,
            "status": status.as_u16()
        }))
    )
}
