//! Basic PhilJS Poem Example
//!
//! Run with: cargo run --example basic

use poem::{Route, Server, get, post, handler, Response, IntoResponse};
use poem::listener::TcpListener;
use poem::web::{Data, Form, Path};
use poem::middleware::Cors;
use philjs_poem::prelude::*;
use serde::{Serialize, Deserialize};
use std::sync::Arc;
use parking_lot::RwLock;

// ============================================================================
// State
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AppState {
    counter: i32,
    messages: Vec<String>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            counter: 0,
            messages: vec!["Welcome to PhilJS!".to_string()],
        }
    }
}

// ============================================================================
// Handlers
// ============================================================================

/// Home page
#[handler]
fn index(ctx: SsrContext) -> PhilJsHtml {
    render_document("Home | PhilJS", || view! {
        <div class="container">
            <h1>"Welcome to PhilJS + Poem"</h1>
            <p>"A modern full-stack web framework"</p>
            <nav>
                <a href="/counter">"Counter"</a>
                " | "
                <a href="/messages">"Messages"</a>
                " | "
                <a href="/about">"About"</a>
            </nav>
        </div>
    })
}

/// Counter page
#[handler]
fn counter(state: Data<&Arc<RwLock<AppState>>>) -> PhilJsHtml {
    let count = state.read().counter;

    render_document("Counter | PhilJS", || view! {
        <div class="container">
            <h1>"Counter"</h1>
            <p class="counter-value">{count}</p>
            <div class="buttons">
                <form method="post" action="/counter/dec" style="display:inline">
                    <button type="submit">"-"</button>
                </form>
                <form method="post" action="/counter/inc" style="display:inline">
                    <button type="submit">"+"</button>
                </form>
            </div>
            <a href="/">"Back"</a>
        </div>
    })
}

/// Increment counter
#[handler]
fn increment(state: Data<&Arc<RwLock<AppState>>>) -> Response {
    state.write().counter += 1;
    Response::builder()
        .status(poem::http::StatusCode::SEE_OTHER)
        .header("Location", "/counter")
        .finish()
}

/// Decrement counter
#[handler]
fn decrement(state: Data<&Arc<RwLock<AppState>>>) -> Response {
    state.write().counter -= 1;
    Response::builder()
        .status(poem::http::StatusCode::SEE_OTHER)
        .header("Location", "/counter")
        .finish()
}

/// Messages page
#[handler]
fn messages(state: Data<&Arc<RwLock<AppState>>>) -> PhilJsHtml {
    let msgs = state.read().messages.clone();

    render_document("Messages | PhilJS", || view! {
        <div class="container">
            <h1>"Messages"</h1>
            <ul>
                {msgs.iter().enumerate().map(|(i, msg)| view! {
                    <li key={i}>{msg}</li>
                }).collect::<Vec<_>>()}
            </ul>
            <form method="post" action="/messages">
                <input type="text" name="message" placeholder="Message" required />
                <button type="submit">"Add"</button>
            </form>
            <a href="/">"Back"</a>
        </div>
    })
}

#[derive(Deserialize)]
struct MessageForm {
    message: String,
}

/// Add message
#[handler]
fn add_message(
    Form(form): Form<MessageForm>,
    state: Data<&Arc<RwLock<AppState>>>,
) -> Response {
    state.write().messages.push(form.message);
    Response::builder()
        .status(poem::http::StatusCode::SEE_OTHER)
        .header("Location", "/messages")
        .finish()
}

/// About page
#[handler]
fn about() -> PhilJsHtml {
    render_document("About | PhilJS", || view! {
        <div class="container">
            <h1>"About PhilJS"</h1>
            <p>"PhilJS is a modern full-stack web framework."</p>
            <ul>
                <li>"Server-Side Rendering"</li>
                <li>"LiveView for real-time updates"</li>
                <li>"Type-safe APIs with OpenAPI"</li>
            </ul>
            <a href="/">"Back"</a>
        </div>
    })
}

/// API status endpoint
#[handler]
fn api_status(state: Data<&Arc<RwLock<AppState>>>) -> poem::web::Json<serde_json::Value> {
    let s = state.read();
    poem::web::Json(serde_json::json!({
        "status": "ok",
        "counter": s.counter,
        "message_count": s.messages.len(),
        "version": "2.0.0"
    }))
}

// ============================================================================
// Main
// ============================================================================

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    // Create state
    let state = Arc::new(RwLock::new(AppState::default()));

    // Build the app
    let app = Route::new()
        .at("/", get(index))
        .at("/counter", get(counter))
        .at("/counter/inc", post(increment))
        .at("/counter/dec", post(decrement))
        .at("/messages", get(messages).post(add_message))
        .at("/about", get(about))
        .at("/api/status", get(api_status))
        .with(SsrMiddleware::new())
        .with(Cors::new())
        .data(state);

    // Run the server
    tracing::info!("Starting server at http://127.0.0.1:3000");
    Server::new(TcpListener::bind("127.0.0.1:3000"))
        .run(app)
        .await
}
