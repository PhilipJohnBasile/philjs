//! # PhilJS Rocket Integration
//!
//! Production-ready Rocket web framework integration for PhilJS applications.
//!
//! ## Features
//!
//! - **SSR Support**: Server-side rendering with streaming
//! - **Fairings**: Request/response lifecycle hooks
//! - **Guards**: Type-safe request validation
//! - **Responders**: Custom response types for PhilJS views
//! - **WebSocket**: LiveView support for real-time updates
//! - **Templates**: Tera/Handlebars integration
//!
//! ## Quick Start
//!
//! ```rust,no_run
//! use rocket::{get, launch, routes};
//! use philjs_rocket::prelude::*;
//!
//! #[get("/")]
//! fn index() -> PhilJsHtml {
//!     render_document("Home", || view! {
//!         <h1>"Welcome to PhilJS!"</h1>
//!     })
//! }
//!
//! #[launch]
//! fn rocket() -> _ {
//!     rocket::build()
//!         .attach(PhilJsSsrFairing::new())
//!         .mount("/", routes![index])
//! }
//! ```

#![warn(missing_docs)]

pub mod app;
pub mod config;
pub mod error;
pub mod fairing;
pub mod guards;
pub mod handlers;
pub mod middleware;
pub mod responders;
pub mod ssr;
pub mod state;

#[cfg(feature = "websocket")]
pub mod websocket;

#[cfg(feature = "templates")]
pub mod templates;

// Re-exports
pub use app::{PhilJsApp, PhilJsPresets};
pub use config::PhilJsConfig;
pub use error::PhilJsError;
pub use fairing::{PhilJsSsrFairing, PhilJsLiveViewFairing, PhilJsMetricsFairing, PhilJsCorsFairing, PhilJsSecurityFairing};
pub use guards::{SsrContext, AuthUser, CsrfToken, ConnectionInfo, PaginationParams, QueryParams};
pub use handlers::{health_check, PaginationParams as HandlerPaginationParams, ErrorHandler};
pub use responders::{PhilJsHtml, PhilJsJson, PhilJsStream, PhilJsRedirect, PhilJsEmpty, PhilJsError as ErrorResponse, ApiResponse, PaginatedResponse};
pub use ssr::{render, render_document, render_with_data, render_stream, HtmlDocument, MetaTag, Script, SeoBuilder};
pub use state::{AppState, AppStateBuilder, CacheState, SessionState};

#[cfg(feature = "websocket")]
pub use websocket::{LiveViewSocket, LiveViewHandler, BroadcastManager, PresenceTracker};

#[cfg(feature = "templates")]
pub use templates::{TemplateContext, render_template, template_fairing};

/// Prelude - import commonly used items
pub mod prelude {
    // App builder
    pub use crate::app::{PhilJsApp, PhilJsPresets};

    // Configuration
    pub use crate::config::PhilJsConfig;

    // Errors
    pub use crate::error::PhilJsError;

    // Fairings
    pub use crate::fairing::{PhilJsSsrFairing, PhilJsLiveViewFairing, PhilJsMetricsFairing, PhilJsCorsFairing, PhilJsSecurityFairing};

    // Guards
    pub use crate::guards::{SsrContext, AuthUser, CsrfToken, ConnectionInfo, PaginationParams, QueryParams};

    // Handlers
    pub use crate::handlers::{health_check, ErrorHandler, api_success, api_error, paginated};

    // Middleware
    pub use crate::middleware::{TimingMiddleware, RequestIdMiddleware, LoggingMiddleware, CacheControl};

    // Responders
    pub use crate::responders::{PhilJsHtml, PhilJsJson, PhilJsStream, PhilJsRedirect, PhilJsEmpty, ApiResponse, PaginatedResponse};

    // SSR
    pub use crate::ssr::{render, render_document, render_with_data, HtmlDocument, MetaTag, Script, SeoBuilder};

    // State
    pub use crate::state::{AppState, AppStateBuilder, CacheState, SessionState};

    #[cfg(feature = "websocket")]
    pub use crate::websocket::{LiveViewSocket, LiveViewHandler, BroadcastManager, PresenceTracker};

    #[cfg(feature = "templates")]
    pub use crate::templates::{TemplateContext, render_template};

    // Re-export Rocket essentials
    pub use rocket::{
        get, post, put, patch, delete, options, head,
        routes, catchers, catch,
        uri, launch,
        State, Request, Response,
        http::{Status, ContentType, Header},
        response::Redirect,
        serde::json::Json,
    };

    // Re-export PhilJS
    pub use philjs::prelude::*;
}

use rocket::response::Responder;
use rocket::http::ContentType;
use std::io::Cursor;

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
pub fn api_response<T: serde::Serialize>(data: T) -> PhilJsJson<T> {
    PhilJsJson::new(data)
}

/// Create an error API response
pub fn api_error(status: rocket::http::Status, message: &str) -> ErrorResponse {
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
