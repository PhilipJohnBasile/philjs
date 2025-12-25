//! Basic PhilJS Actix-Web Example
//!
//! This example demonstrates a simple web application with SSR.
//!
//! Run with: cargo run --example basic

use actix_web::{web, App, HttpServer, HttpRequest, HttpResponse, Responder, middleware};
use philjs_actix::prelude::*;
use philjs_actix::cors::CorsConfig;

// Home page handler
async fn index() -> HttpResponse {
    render_document("Home | PhilJS Actix", || view! {
        <div class="container">
            <header>
                <h1>"Welcome to PhilJS Actix"</h1>
                <nav>
                    <a href="/">"Home"</a>
                    <a href="/about">"About"</a>
                    <a href="/counter">"Counter"</a>
                    <a href="/api/status">"API Status"</a>
                </nav>
            </header>
            <main>
                <p>"Production-ready Actix-web integration for PhilJS applications."</p>
                <ul>
                    <li>"Server-side rendering with streaming"</li>
                    <li>"Type-safe extractors"</li>
                    <li>"Middleware support"</li>
                    <li>"WebSocket and LiveView"</li>
                    <li>"Session management"</li>
                    <li>"Advanced CORS configuration"</li>
                </ul>
            </main>
        </div>
    })
}

// About page handler
async fn about() -> HttpResponse {
    render_document("About | PhilJS Actix", || view! {
        <div class="container">
            <h1>"About PhilJS Actix"</h1>
            <p>
                "PhilJS Actix provides seamless integration between the PhilJS "
                "reactive framework and Actix-web, one of the fastest Rust web frameworks."
            </p>
            <h2>"Features"</h2>
            <ul>
                <li>"SSR with hydration support"</li>
                <li>"WebSocket for LiveView"</li>
                <li>"Session management"</li>
                <li>"CORS handling"</li>
                <li>"Compression"</li>
                <li>"Tracing/logging"</li>
            </ul>
            <a href="/">"Back to Home"</a>
        </div>
    })
}

// Counter page with hydration data
async fn counter() -> HttpResponse {
    render_with_data(
        || view! {
            <div class="container">
                <h1>"Interactive Counter"</h1>
                <div id="counter" data-count="0">
                    <button id="decrement">"-"</button>
                    <span id="count">"0"</span>
                    <button id="increment">"+"</button>
                </div>
                <p class="hint">"This counter is rendered on the server and hydrated on the client."</p>
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
async fn api_status() -> HttpResponse {
    api_response(serde_json::json!({
        "status": "healthy",
        "version": "2.0.0",
        "framework": "philjs-actix",
        "features": [
            "ssr",
            "websocket",
            "session",
            "cors"
        ]
    }))
}

// Health check endpoint
async fn health() -> HttpResponse {
    health_check()
}

// User info with extractor
async fn user_info(query: Query<UserQuery>) -> HttpResponse {
    api_response(serde_json::json!({
        "message": format!("Hello, {}!", query.name.as_deref().unwrap_or("Guest")),
        "authenticated": query.token.is_some()
    }))
}

#[derive(Debug, serde::Deserialize)]
struct UserQuery {
    name: Option<String>,
    token: Option<String>,
}

// Not found handler
async fn not_found_handler() -> HttpResponse {
    render_document("404 - Not Found", || view! {
        <div class="container error-page">
            <h1>"404"</h1>
            <p>"The page you're looking for doesn't exist."</p>
            <a href="/">"Go Home"</a>
        </div>
    })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    println!("Starting PhilJS Actix server at http://localhost:8080");

    HttpServer::new(|| {
        // Configure CORS
        let cors = CorsConfig::new()
            .allow_origins(["http://localhost:3000", "http://localhost:8080"])
            .allow_credentials(true)
            .max_age(3600)
            .build();

        App::new()
            // Middleware
            .wrap(middleware::Logger::default())
            .wrap(middleware::Compress::default())
            .wrap(cors)
            // Pages
            .route("/", web::get().to(index))
            .route("/about", web::get().to(about))
            .route("/counter", web::get().to(counter))
            // API
            .route("/api/status", web::get().to(api_status))
            .route("/api/user", web::get().to(user_info))
            .route("/health", web::get().to(health))
            // Static files
            .service(actix_files::Files::new("/static", "./static").prefer_utf8(true))
            // 404 handler
            .default_service(web::route().to(not_found_handler))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
