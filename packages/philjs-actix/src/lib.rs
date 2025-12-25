//! # PhilJS Actix-Web Integration
//!
//! Production-ready Actix-web integration for PhilJS applications.
//!
//! ## Features
//!
//! - **SSR Middleware**: Server-side rendering with streaming support
//! - **Static File Serving**: Optimized static asset delivery
//! - **API Route Helpers**: Type-safe API endpoint creation
//! - **WebSocket Support**: Real-time LiveView communication
//! - **Session Management**: Secure session handling
//!
//! ## Quick Start
//!
//! ```rust
//! use actix_web::{web, App, HttpServer};
//! use philjs_actix::prelude::*;
//!
//! #[actix_web::main]
//! async fn main() -> std::io::Result<()> {
//!     HttpServer::new(|| {
//!         App::new()
//!             .configure(PhilJsConfig::default())
//!             .service(PhilJsService::new())
//!     })
//!     .bind("127.0.0.1:8080")?
//!     .run()
//!     .await
//! }
//! ```
//!
//! ## SSR Handler
//!
//! ```rust
//! use philjs_actix::prelude::*;
//!
//! async fn home() -> impl Responder {
//!     render_to_response(|| view! {
//!         <h1>"Welcome to PhilJS!"</h1>
//!     })
//! }
//! ```
//!
//! ## WebSocket LiveView
//!
//! ```rust
//! use philjs_actix::websocket::LiveViewSocket;
//!
//! async fn liveview(req: HttpRequest, stream: web::Payload) -> impl Responder {
//!     LiveViewSocket::new(MyComponent::default())
//!         .upgrade(req, stream)
//! }
//! ```

#![warn(missing_docs)]

pub mod config;
pub mod middleware;
pub mod service;
pub mod error;
pub mod extractors;
pub mod handlers;
pub mod ssr;
pub mod cors;

#[cfg(feature = "websocket")]
pub mod websocket;

#[cfg(feature = "session")]
pub mod session;

// Re-exports
pub use config::PhilJsConfig;
pub use error::PhilJsError;
pub use middleware::{SsrMiddleware, CompressionMiddleware, TracingMiddleware};
pub use service::PhilJsService;

#[cfg(feature = "websocket")]
pub use websocket::{LiveViewSocket, WebSocketHandler};

#[cfg(feature = "session")]
pub use session::{SessionManager, SessionConfig};

/// Prelude - import commonly used items
pub mod prelude {
    pub use crate::config::PhilJsConfig;
    pub use crate::error::PhilJsError;
    pub use crate::middleware::{SsrMiddleware, CompressionMiddleware, TracingMiddleware};
    pub use crate::service::PhilJsService;
    pub use crate::{render_to_response, render_with_data, render_stream, api_response};

    // Re-export extractors
    pub use crate::extractors::{Json, Form, Path, Query, SsrContext, ConnectionInfo};

    // Re-export handlers
    pub use crate::handlers::{
        health_check, not_found, cors_preflight, redirect,
        ApiResponse, ErrorHandler, PaginationParams, PaginatedResponse,
    };

    // Re-export SSR utilities
    pub use crate::ssr::{
        SsrRenderer, SsrConfig, HtmlDocument, MetaTag, Script, SeoBuilder,
    };

    #[cfg(feature = "websocket")]
    pub use crate::websocket::{LiveViewSocket, WebSocketHandler};

    #[cfg(feature = "session")]
    pub use crate::session::{SessionManager, SessionConfig};

    // Re-export Actix essentials
    pub use actix_web::{
        web, App, HttpServer, HttpRequest, HttpResponse,
        http::StatusCode,
        Responder,
    };

    // Re-export PhilJS
    pub use philjs::prelude::*;
}

use actix_web::{HttpResponse, http::header};
use philjs::prelude::*;
use serde::Serialize;

/// Render a PhilJS view to an HTTP response
pub fn render_to_response<F, V>(f: F) -> HttpResponse
where
    F: FnOnce() -> V,
    V: IntoView,
{
    let html = render_to_string(f);
    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(html)
}

/// Render with embedded data for hydration
pub fn render_with_data<F, V, D>(f: F, data: D) -> HttpResponse
where
    F: FnOnce() -> V,
    V: IntoView,
    D: Serialize,
{
    let view_html = render_to_string(f);
    let data_json = serde_json::to_string(&data).unwrap_or_default();

    let html = format!(
        r#"{}
<script type="application/json" id="__PHILJS_DATA__">{}</script>
<script>
window.__PHILJS_DATA__ = JSON.parse(document.getElementById('__PHILJS_DATA__').textContent);
</script>"#,
        view_html, data_json
    );

    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(html)
}

/// Render a streaming response
pub fn render_stream<F, V>(f: F) -> HttpResponse
where
    F: FnOnce() -> V,
    V: IntoView,
{
    let html = render_to_string(f);

    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .insert_header((header::TRANSFER_ENCODING, "chunked"))
        .body(html)
}

/// Create a JSON API response
pub fn api_response<T: Serialize>(data: T) -> HttpResponse {
    match serde_json::to_string(&data) {
        Ok(json) => HttpResponse::Ok()
            .content_type("application/json")
            .body(json),
        Err(e) => HttpResponse::InternalServerError()
            .body(format!("Serialization error: {}", e)),
    }
}

/// Create an error API response
pub fn api_error(status: actix_web::http::StatusCode, message: &str) -> HttpResponse {
    let error = serde_json::json!({
        "error": message,
        "status": status.as_u16()
    });

    HttpResponse::build(status)
        .content_type("application/json")
        .body(error.to_string())
}

/// Render a full HTML document
pub fn render_document<F, V>(title: &str, f: F) -> HttpResponse
where
    F: FnOnce() -> V,
    V: IntoView,
{
    let body_html = render_to_string(f);

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

    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(html)
}
