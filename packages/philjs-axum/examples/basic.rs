//! Basic PhilJS Axum Example
//!
//! This example demonstrates a simple web application with SSR.
//!
//! Run with: cargo run --example basic

use axum::{Router, routing::get};
use philjs_axum::prelude::*;
use std::net::SocketAddr;

// Home page handler
async fn index() -> PhilJsHtml {
    render_document("Home | PhilJS Axum", || view! {
        <div class="container">
            <header>
                <h1>"Welcome to PhilJS Axum"</h1>
                <nav>
                    <a href="/">"Home"</a>
                    <a href="/about">"About"</a>
                    <a href="/counter">"Counter"</a>
                </nav>
            </header>
            <main>
                <p>"A fast, type-safe web framework integration for Rust."</p>
                <ul>
                    <li>"Server-side rendering with streaming"</li>
                    <li>"Type-safe extractors"</li>
                    <li>"Tower middleware compatibility"</li>
                    <li>"WebSocket and LiveView support"</li>
                </ul>
            </main>
        </div>
    })
}

// About page handler
async fn about() -> PhilJsHtml {
    render_document("About | PhilJS Axum", || view! {
        <div class="container">
            <h1>"About PhilJS Axum"</h1>
            <p>
                "PhilJS Axum provides seamless integration between the PhilJS "
                "reactive framework and the Axum web framework."
            </p>
            <a href="/">"Back to Home"</a>
        </div>
    })
}

// Counter page with hydration data
async fn counter() -> PhilJsHtml {
    render_with_hydration(
        || view! {
            <div class="container">
                <h1>"Interactive Counter"</h1>
                <div id="counter" data-count="0">
                    <button id="decrement">"-"</button>
                    <span id="count">"0"</span>
                    <button id="increment">"+"</button>
                </div>
                <a href="/">"Back to Home"</a>
            </div>
        },
        serde_json::json!({
            "initialCount": 0,
            "step": 1
        }),
    )
}

// JSON API endpoint
async fn api_status() -> impl IntoResponse {
    api_response(serde_json::json!({
        "status": "ok",
        "version": "2.0.0",
        "framework": "philjs-axum"
    }))
}

// Health check endpoint
async fn health() -> impl IntoResponse {
    health_check()
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::init();

    // Build application state
    let state = AppStateBuilder::new()
        .with_name("PhilJS Axum Example")
        .with_version("2.0.0")
        .build();

    // Build router
    let app = Router::new()
        // Pages
        .route("/", get(index))
        .route("/about", get(about))
        .route("/counter", get(counter))
        // API
        .route("/api/status", get(api_status))
        .route("/health", get(health))
        // 404 handler
        .fallback(not_found)
        // Middleware
        .layer(PhilJsLayer::new())
        .layer(TracingLayer::new())
        .layer(SecurityHeadersLayer::new())
        .layer(RequestIdLayer::new())
        .with_state(state);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Server running at http://localhost:3000");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
