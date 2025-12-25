//! # PhilJS Poem Integration
//!
//! Production-ready Poem web framework integration for PhilJS applications.
//!
//! ## Features
//!
//! - **SSR Support**: Server-side rendering with streaming
//! - **Middleware**: Request/response lifecycle middleware
//! - **Extractors**: Type-safe request data extraction
//! - **Responses**: Custom response types for PhilJS views
//! - **WebSocket**: LiveView support for real-time updates
//! - **OpenAPI**: Full OpenAPI documentation support
//!
//! ## Quick Start
//!
//! ```rust,no_run
//! use poem::{Route, Server, get, handler};
//! use poem::listener::TcpListener;
//! use philjs_poem::prelude::*;
//!
//! #[handler]
//! fn index() -> PhilJsHtml {
//!     render_document("Home", || view! {
//!         <h1>"Welcome to PhilJS!"</h1>
//!     })
//! }
//!
//! #[tokio::main]
//! async fn main() -> Result<(), std::io::Error> {
//!     let app = Route::new()
//!         .at("/", get(index))
//!         .with(SsrMiddleware::new());
//!
//!     Server::new(TcpListener::bind("127.0.0.1:3000"))
//!         .run(app)
//!         .await
//! }
//! ```

#![warn(missing_docs)]

pub mod config;
pub mod error;
pub mod extractors;
pub mod middleware;
pub mod responses;
pub mod ssr;

#[cfg(feature = "websocket")]
pub mod websocket;

#[cfg(feature = "openapi")]
pub mod openapi;

// Re-exports
pub use config::PhilJsConfig;
pub use error::PhilJsError;
pub use extractors::{SsrContext, AuthUser, PhilJsJson, PhilJsQuery};
pub use middleware::{SsrMiddleware, CorsMiddleware, SecurityMiddleware, RateLimitMiddleware};
pub use responses::{PhilJsHtml, PhilJsJson as JsonResponse, PhilJsStream, PhilJsError as ErrorResponse};
pub use ssr::{render, render_document, render_with_data, render_stream};

#[cfg(feature = "websocket")]
pub use websocket::{LiveViewSocket, LiveViewHandler, BroadcastManager, PresenceTracker};

/// Prelude - import commonly used items
pub mod prelude {
    pub use crate::config::PhilJsConfig;
    pub use crate::error::PhilJsError;
    pub use crate::extractors::{SsrContext, AuthUser, PhilJsJson, PhilJsQuery};
    pub use crate::middleware::{SsrMiddleware, CorsMiddleware, SecurityMiddleware};
    pub use crate::responses::{PhilJsHtml, PhilJsStream};
    pub use crate::ssr::{render, render_document, render_with_data};

    #[cfg(feature = "websocket")]
    pub use crate::websocket::{LiveViewSocket, LiveViewHandler};

    // Re-export Poem essentials
    pub use poem::{
        Route, Server, Endpoint, IntoResponse, Response,
        get, post, put, patch, delete,
        handler,
        http::StatusCode,
        web::{Data, Path, Query, Json, Form},
        middleware::Cors,
    };

    // Re-export PhilJS
    pub use philjs::prelude::*;
}

use poem::{Response, IntoResponse};
use poem::http::StatusCode;

/// Render a PhilJS view to an HTML response
pub fn render_to_response<F, V>(f: F) -> PhilJsHtml
where
    F: FnOnce() -> V,
    V: philjs::IntoView,
{
    let html = philjs::render_to_string(f);
    PhilJsHtml::new(html)
}

/// Render a PhilJS view with hydration data
pub fn render_with_hydration<F, V, D>(f: F, data: D) -> PhilJsHtml
where
    F: FnOnce() -> V,
    V: philjs::IntoView,
    D: serde::Serialize,
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

    PhilJsHtml::new(html)
}

/// Render a full HTML document
pub fn render_full_document<F, V>(title: &str, f: F) -> PhilJsHtml
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

    PhilJsHtml::new(html)
}

/// Create a JSON API response
pub fn api_response<T: serde::Serialize>(data: T) -> JsonResponse<T> {
    JsonResponse::new(data)
}

/// Create an error API response
pub fn api_error(status: StatusCode, message: &str) -> ErrorResponse {
    ErrorResponse::new(status, message)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_render_to_response() {
        // Test would go here
    }
}
