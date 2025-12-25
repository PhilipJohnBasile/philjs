//! Basic PhilJS Rocket Example
//!
//! Run with: cargo run --example basic

use rocket::{get, post, launch, routes, State};
use rocket::form::Form;
use rocket::response::Redirect;
use philjs_rocket::prelude::*;
use serde::{Serialize, Deserialize};

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
// Routes
// ============================================================================

/// Home page
#[get("/")]
fn index(ctx: SsrContext) -> PhilJsHtml {
    render_document("Home | PhilJS", || view! {
        <div class="container">
            <h1>"Welcome to PhilJS + Rocket"</h1>
            <p>"A blazing-fast full-stack web framework"</p>
            <nav>
                <a href="/counter">"Counter Demo"</a>
                " | "
                <a href="/messages">"Messages"</a>
                " | "
                <a href="/about">"About"</a>
            </nav>
        </div>
    })
}

/// Counter page with state
#[get("/counter")]
fn counter(state: &State<std::sync::RwLock<AppState>>) -> PhilJsHtml {
    let app_state = state.read().unwrap();
    let count = app_state.counter;

    render_document("Counter | PhilJS", || view! {
        <div class="container">
            <h1>"Counter"</h1>
            <p class="counter-value">{count}</p>
            <div class="counter-buttons">
                <form method="post" action="/counter/decrement" style="display:inline">
                    <button type="submit">"-"</button>
                </form>
                <form method="post" action="/counter/increment" style="display:inline">
                    <button type="submit">"+"</button>
                </form>
            </div>
            <a href="/">"Back to Home"</a>
        </div>
    })
}

/// Increment counter
#[post("/counter/increment")]
fn increment(state: &State<std::sync::RwLock<AppState>>) -> Redirect {
    let mut app_state = state.write().unwrap();
    app_state.counter += 1;
    Redirect::to("/counter")
}

/// Decrement counter
#[post("/counter/decrement")]
fn decrement(state: &State<std::sync::RwLock<AppState>>) -> Redirect {
    let mut app_state = state.write().unwrap();
    app_state.counter -= 1;
    Redirect::to("/counter")
}

/// Messages page
#[get("/messages")]
fn messages(state: &State<std::sync::RwLock<AppState>>) -> PhilJsHtml {
    let app_state = state.read().unwrap();
    let msgs = &app_state.messages;

    render_document("Messages | PhilJS", || view! {
        <div class="container">
            <h1>"Messages"</h1>
            <ul class="message-list">
                {msgs.iter().enumerate().map(|(i, msg)| view! {
                    <li key={i}>{msg}</li>
                }).collect::<Vec<_>>()}
            </ul>
            <form method="post" action="/messages">
                <input type="text" name="message" placeholder="Enter a message" required />
                <button type="submit">"Add Message"</button>
            </form>
            <a href="/">"Back to Home"</a>
        </div>
    })
}

#[derive(FromForm)]
struct MessageForm {
    message: String,
}

/// Add a message
#[post("/messages", data = "<form>")]
fn add_message(
    form: Form<MessageForm>,
    state: &State<std::sync::RwLock<AppState>>,
) -> Redirect {
    let mut app_state = state.write().unwrap();
    app_state.messages.push(form.message.clone());
    Redirect::to("/messages")
}

/// About page
#[get("/about")]
fn about() -> PhilJsHtml {
    render_document("About | PhilJS", || view! {
        <div class="container">
            <h1>"About PhilJS"</h1>
            <p>
                "PhilJS is a modern full-stack web framework that combines "
                "the power of Rust with the flexibility of JavaScript/TypeScript."
            </p>
            <h2>"Features"</h2>
            <ul>
                <li>"Server-Side Rendering (SSR)"</li>
                <li>"LiveView for real-time updates"</li>
                <li>"Type-safe routing and guards"</li>
                <li>"Seamless Rust/TypeScript integration"</li>
            </ul>
            <a href="/">"Back to Home"</a>
        </div>
    })
}

/// JSON API endpoint
#[get("/api/status")]
fn api_status(state: &State<std::sync::RwLock<AppState>>) -> PhilJsJson<serde_json::Value> {
    let app_state = state.read().unwrap();

    json({
        "status": "ok",
        "counter": app_state.counter,
        "message_count": app_state.messages.len(),
        "version": "2.0.0"
    })
}

// ============================================================================
// Main
// ============================================================================

#[launch]
fn rocket() -> _ {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    // Create initial state
    let state = std::sync::RwLock::new(AppState::default());

    rocket::build()
        // Attach PhilJS fairings
        .attach(PhilJsSsrFairing::new())
        .attach(PhilJsMetricsFairing::new())
        // Add application state
        .manage(state)
        // Mount routes
        .mount("/", routes![
            index,
            counter,
            increment,
            decrement,
            messages,
            add_message,
            about,
            api_status,
        ])
}
