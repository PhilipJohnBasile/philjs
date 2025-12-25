//! Tower Middleware Example for PhilJS Axum
//!
//! This example demonstrates using Tower middleware layers.
//!
//! Run with: cargo run --example tower_middleware

use axum::{Router, routing::get, response::Json};
use philjs_axum::prelude::*;
use philjs_axum::tower::{
    TracingLayer, TimeoutLayer, RequestIdLayer,
    SecurityHeadersLayer, RateLimitLayer,
};
use std::net::SocketAddr;
use std::time::Duration;

// Home page
async fn index() -> PhilJsHtml {
    render_document("Tower Middleware Demo", || view! {
        <div class="container">
            <h1>"Tower Middleware Demo"</h1>
            <p>"This example demonstrates various Tower middleware layers."</p>

            <h2>"Active Middleware"</h2>
            <ul>
                <li><strong>"TracingLayer"</strong>" - Request/response logging"</li>
                <li><strong>"TimeoutLayer"</strong>" - 30 second request timeout"</li>
                <li><strong>"RequestIdLayer"</strong>" - Unique request ID header"</li>
                <li><strong>"SecurityHeadersLayer"</strong>" - Security headers (CSP, HSTS, etc.)"</li>
                <li><strong>"RateLimitLayer"</strong>" - 100 requests per minute"</li>
            </ul>

            <h2>"Test Endpoints"</h2>
            <ul>
                <li><a href="/api/info">"GET /api/info"</a>" - API info"</li>
                <li><a href="/api/slow">"GET /api/slow"</a>" - Slow endpoint (5 second delay)"</li>
                <li><a href="/api/headers">"GET /api/headers"</a>" - View response headers"</li>
            </ul>
        </div>
    })
}

// API info endpoint
async fn api_info() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "name": "Tower Middleware Demo",
        "version": "2.0.0",
        "middleware": [
            "TracingLayer",
            "TimeoutLayer",
            "RequestIdLayer",
            "SecurityHeadersLayer",
            "RateLimitLayer"
        ]
    }))
}

// Slow endpoint to test timeout
async fn slow_endpoint() -> Json<serde_json::Value> {
    // Simulate slow operation
    tokio::time::sleep(Duration::from_secs(5)).await;

    Json(serde_json::json!({
        "message": "This response was delayed by 5 seconds",
        "tip": "Try setting timeout lower than 5 seconds to see timeout behavior"
    }))
}

// Headers info endpoint
async fn headers_info(
    headers: axum::http::HeaderMap,
) -> Json<serde_json::Value> {
    let request_id = headers
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("not set");

    Json(serde_json::json!({
        "request_id": request_id,
        "note": "Check the response headers for security headers added by SecurityHeadersLayer"
    }))
}

// Rate limit test endpoint
async fn rate_limit_test() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "message": "This endpoint is rate limited to 100 requests per minute",
        "tip": "Send many requests quickly to trigger the rate limit"
    }))
}

#[tokio::main]
async fn main() {
    // Initialize tracing with nice formatting
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::DEBUG)
        .with_target(true)
        .init();

    // Build router with Tower middleware layers
    let app = Router::new()
        // Pages
        .route("/", get(index))
        // API endpoints
        .route("/api/info", get(api_info))
        .route("/api/slow", get(slow_endpoint))
        .route("/api/headers", get(headers_info))
        .route("/api/rate-test", get(rate_limit_test))
        // 404 handler
        .fallback(not_found)
        // Tower middleware layers (applied in reverse order)
        // RateLimitLayer is innermost - applied last
        .layer(RateLimitLayer::per_minute(100))
        // SecurityHeadersLayer adds security headers
        .layer(SecurityHeadersLayer::new()
            .csp("default-src 'self'; script-src 'self' 'unsafe-inline'")
            .frame_options("DENY")
            .hsts("max-age=31536000; includeSubDomains"))
        // RequestIdLayer adds/propagates request IDs
        .layer(RequestIdLayer::new())
        // TimeoutLayer enforces request timeout
        .layer(TimeoutLayer::from_secs(30))
        // TracingLayer is outermost - applied first
        .layer(TracingLayer::new()
            .level(tracing::Level::INFO)
            .include_headers(true))
        // PhilJS layer
        .layer(PhilJsLayer::new());

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Tower middleware demo running at http://localhost:3000");
    println!("Watch the console for tracing output!");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
