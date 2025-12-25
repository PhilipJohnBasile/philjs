//! Project templates for cargo-philjs
//!
//! Provides code templates for different project types and components.

// ============================================================================
// Lib.rs Templates
// ============================================================================

pub fn minimal_lib() -> &'static str {
    r#"//! PhilJS Application

use philjs::prelude::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();

    mount(|| view! {
        <h1>"Hello, PhilJS!"</h1>
    });
}
"#
}

pub fn spa_lib() -> &'static str {
    r#"//! PhilJS SPA Application

mod components;

use philjs::prelude::*;
use wasm_bindgen::prelude::*;

use components::app::App;

#[wasm_bindgen(start)]
pub fn main() {
    // Initialize panic hook for better error messages
    console_error_panic_hook::set_once();

    // Mount the app to the DOM
    mount(|| view! { <App /> });
}
"#
}

pub fn ssr_lib() -> &'static str {
    r#"//! PhilJS SSR Application
//!
//! Server-side rendered with hydration for interactivity.

mod components;
mod pages;

use philjs::prelude::*;

use components::app::App;

// ============================================================================
// Client Entry (WASM)
// ============================================================================

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();

    // Hydrate the server-rendered HTML
    hydrate(|| view! { <App /> });
}

// ============================================================================
// Server Entry
// ============================================================================

#[cfg(not(target_arch = "wasm32"))]
pub fn render_page() -> String {
    render_to_string(|| view! {
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>"PhilJS SSR App"</title>
                <link rel="stylesheet" href="/styles.css" />
            </head>
            <body>
                <div id="app">
                    <App />
                </div>
                {HydrationScript::new().to_html()}
                <script type="module" src="/pkg/app.js"></script>
            </body>
        </html>
    })
}

#[cfg(not(target_arch = "wasm32"))]
pub fn render_to_stream() -> impl futures::Stream<Item = String> {
    philjs::ssr::render_to_stream(|| view! { <App /> })
}
"#
}

pub fn fullstack_lib() -> &'static str {
    r#"//! PhilJS Fullstack Application
//!
//! Features:
//! - Server-side rendering with hydration
//! - Server functions with #[server] macro
//! - API routes
//! - Type-safe data fetching

mod components;
mod api;
#[cfg(not(target_arch = "wasm32"))]
mod server;

use philjs::prelude::*;

use components::app::App;

// ============================================================================
// Client Entry (WASM)
// ============================================================================

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
    hydrate(|| view! { <App /> });
}

// ============================================================================
// Server Functions
// ============================================================================

use philjs::server::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Todo {
    pub id: u64,
    pub text: String,
    pub completed: bool,
}

/// Get all todos - runs on server, callable from client
#[server(GetTodos)]
pub async fn get_todos() -> ServerResult<Vec<Todo>> {
    // In production, this would fetch from a database
    Ok(vec![
        Todo { id: 1, text: "Learn PhilJS".into(), completed: false },
        Todo { id: 2, text: "Build something awesome".into(), completed: false },
    ])
}

/// Create a new todo
#[server(CreateTodo)]
pub async fn create_todo(text: String) -> ServerResult<Todo> {
    // In production, this would insert into a database
    Ok(Todo {
        id: rand::random(),
        text,
        completed: false,
    })
}

/// Toggle todo completion
#[server(ToggleTodo)]
pub async fn toggle_todo(id: u64) -> ServerResult<()> {
    // In production, this would update the database
    Ok(())
}

// ============================================================================
// Server Entry
// ============================================================================

#[cfg(not(target_arch = "wasm32"))]
pub use server::start_server;
"#
}

pub fn liveview_lib() -> &'static str {
    r#"//! PhilJS LiveView Application
//!
//! Server-driven UI with real-time updates over WebSocket.
//! Inspired by Phoenix LiveView.

mod components;
mod liveview;

use philjs::prelude::*;
use philjs::liveview::*;

// ============================================================================
// LiveView Counter Example
// ============================================================================

pub struct CounterLiveView {
    count: Signal<i32>,
}

impl LiveView for CounterLiveView {
    fn mount(&mut self, _socket: &mut LiveSocket) {
        // Initialize state when client connects
        self.count = Signal::new(0);
    }

    fn handle_event(&mut self, event: &LiveEvent, _socket: &mut LiveSocket) {
        match event.event_type.as_str() {
            "increment" => self.count.update(|c| *c += 1),
            "decrement" => self.count.update(|c| *c -= 1),
            "reset" => self.count.set(0),
            _ => {}
        }
    }

    fn handle_info(&mut self, _info: &str, _socket: &mut LiveSocket) {
        // Handle messages from other processes
    }

    fn render(&self) -> String {
        format!(r#"
            <div class="counter">
                <h1>Count: {}</h1>
                <div class="buttons">
                    <button live:click="decrement">-</button>
                    <button live:click="reset">Reset</button>
                    <button live:click="increment">+</button>
                </div>
            </div>
        "#, self.count.get())
    }
}

// ============================================================================
// Server Entry
// ============================================================================

#[cfg(feature = "server")]
pub async fn start_server() {
    use axum::{routing::get, Router};

    let app = Router::new()
        .route("/", get(|| async { include_str!("../static/index.html") }))
        .nest("/live", liveview_router());

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
    println!("LiveView server running at http://127.0.0.1:3000");
    axum::serve(listener, app).await.unwrap();
}

#[cfg(feature = "server")]
fn liveview_router() -> Router {
    use axum::routing::get;

    Router::new()
        .route("/counter", get(ws_handler::<CounterLiveView>))
}

#[cfg(feature = "server")]
async fn ws_handler<L: LiveView + Default>(
    ws: axum::extract::WebSocketUpgrade,
) -> impl axum::response::IntoResponse {
    ws.on_upgrade(|socket| async {
        // Handle WebSocket connection
        let live_view = L::default();
        philjs::liveview::handle_websocket(socket, live_view).await;
    })
}
"#
}

// ============================================================================
// Component Templates
// ============================================================================

pub fn counter_component() -> &'static str {
    r#"//! Counter Component
//!
//! A reactive counter demonstrating PhilJS signals and events.

use philjs::prelude::*;

/// Counter component props
#[derive(Clone, Default)]
pub struct CounterProps {
    /// Initial count value
    pub initial: i32,
}

/// Interactive counter component
#[component]
pub fn Counter(props: CounterProps) -> impl IntoView {
    // Create reactive signal for count
    let count = Signal::new(props.initial);

    view! {
        <div class="counter">
            <h2 class="counter-value">"Count: " {count}</h2>
            <div class="counter-buttons">
                <button
                    class="btn btn-decrement"
                    on:click=move |_| count.update(|n| *n -= 1)
                >
                    "-"
                </button>
                <button
                    class="btn btn-reset"
                    on:click=move |_| count.set(0)
                >
                    "Reset"
                </button>
                <button
                    class="btn btn-increment"
                    on:click=move |_| count.update(|n| *n += 1)
                >
                    "+"
                </button>
            </div>
        </div>
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_counter_renders() {
        let html = render_to_string(|| view! {
            <Counter initial=5 />
        });
        assert!(html.contains("Count:"));
        assert!(html.contains("5"));
    }
}
"#
}

pub fn app_component() -> &'static str {
    r#"//! App Component
//!
//! Root component for the application.

use philjs::prelude::*;

use super::counter::Counter;

/// App component - root of the application
#[component]
pub fn App() -> impl IntoView {
    view! {
        <main class="app">
            <header class="header">
                <h1>"Welcome to PhilJS!"</h1>
                <p class="tagline">"The #1 UI framework for Rust developers"</p>
            </header>

            <section class="demo">
                <Counter initial=0 />
            </section>

            <footer class="footer">
                <p>
                    "Built with "
                    <a href="https://philjs.dev" target="_blank">"PhilJS"</a>
                    " - Reactive UI in pure Rust"
                </p>
            </footer>
        </main>
    }
}
"#
}

// ============================================================================
// Template-Specific Files
// ============================================================================

pub fn api_mod() -> &'static str {
    r#"//! API Routes
//!
//! Define your API endpoints here.

use philjs::server::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
}

/// Health check endpoint
pub async fn health() -> ServerResult<HealthResponse> {
    Ok(HealthResponse {
        status: "ok".into(),
        version: env!("CARGO_PKG_VERSION").into(),
    })
}
"#
}

pub fn server_mod() -> &'static str {
    r#"//! Server Configuration
//!
//! Axum server setup for SSR and API routes.

use axum::{
    routing::{get, post},
    Router,
};
use tower_http::services::ServeDir;

pub async fn start_server() {
    let app = Router::new()
        // Static files
        .nest_service("/pkg", ServeDir::new("pkg"))
        .nest_service("/static", ServeDir::new("static"))
        // Pages
        .route("/", get(render_index))
        // API routes
        .route("/api/health", get(crate::api::health));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await.unwrap();
    println!("Server running at http://127.0.0.1:8080");
    axum::serve(listener, app).await.unwrap();
}

async fn render_index() -> axum::response::Html<String> {
    axum::response::Html(crate::render_page())
}
"#
}

pub fn liveview_mod() -> &'static str {
    r#"//! LiveView Module
//!
//! LiveView components and utilities.

use philjs::liveview::*;

// Re-export LiveView types
pub use philjs::liveview::{LiveView, LiveSocket, LiveEvent};
"#
}

pub fn home_page() -> &'static str {
    r#"//! Home Page

use philjs::prelude::*;

#[component]
pub fn HomePage() -> impl IntoView {
    view! {
        <main class="page-home">
            <h1>"Home"</h1>
            <p>"Welcome to your PhilJS application!"</p>
        </main>
    }
}

pub fn meta() -> Vec<(&'static str, &'static str)> {
    vec![
        ("title", "Home | PhilJS App"),
        ("description", "Welcome to your PhilJS application"),
    ]
}
"#
}

// ============================================================================
// HTML Templates
// ============================================================================

pub fn spa_html() -> &'static str {
    r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="PhilJS Application">
    <title>PhilJS App</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div id="app">
        <!-- App will be mounted here -->
        <div class="loading">
            <p>Loading...</p>
        </div>
    </div>
    <script type="module">
        import init from '/pkg/app.js';
        init();
    </script>
</body>
</html>
"#
}

pub fn ssr_html() -> &'static str {
    r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="PhilJS SSR Application">
    <title>PhilJS SSR App</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div id="app">
        <!-- Server-rendered content will be placed here -->
    </div>
    <script type="module">
        import init from '/pkg/app.js';
        await init();
    </script>
</body>
</html>
"#
}

pub fn liveview_html() -> &'static str {
    r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="PhilJS LiveView Application">
    <title>PhilJS LiveView</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div id="app" data-live-view="true">
        <!-- LiveView content will be rendered here -->
    </div>
    <script>
        // PhilJS LiveView client
        const socket = new WebSocket(`ws://${window.location.host}/live/counter`);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'render') {
                document.getElementById('app').innerHTML = data.html;
            }
        };

        // Handle click events with live: prefix
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[live\\:click]');
            if (target) {
                const eventName = target.getAttribute('live:click');
                socket.send(JSON.stringify({ type: 'event', event: eventName }));
            }
        });

        socket.onclose = () => {
            console.log('LiveView connection closed, reconnecting...');
            setTimeout(() => window.location.reload(), 1000);
        };
    </script>
</body>
</html>
"#
}

// ============================================================================
// CSS Template
// ============================================================================

pub fn default_css() -> &'static str {
    r#"/* PhilJS Default Styles */

:root {
    --color-primary: #3b82f6;
    --color-primary-dark: #2563eb;
    --color-secondary: #10b981;
    --color-danger: #ef4444;
    --color-text: #1f2937;
    --color-text-light: #6b7280;
    --color-bg: #ffffff;
    --color-bg-alt: #f9fafb;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --radius: 0.5rem;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    line-height: 1.6;
    color: var(--color-text);
    background-color: var(--color-bg);
}

.app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.header {
    text-align: center;
    padding: 4rem 2rem;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
    color: white;
}

.header h1 {
    font-size: 3rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
}

.tagline {
    font-size: 1.25rem;
    opacity: 0.9;
}

.demo {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    background-color: var(--color-bg-alt);
}

.counter {
    text-align: center;
    padding: 2rem 3rem;
    background: white;
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
}

.counter-value {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: var(--color-primary);
}

.counter-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.btn {
    font-size: 1.25rem;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow);
}

.btn:active {
    transform: translateY(0);
}

.btn-increment {
    background-color: var(--color-secondary);
    color: white;
}

.btn-decrement {
    background-color: var(--color-danger);
    color: white;
}

.btn-reset {
    background-color: var(--color-text-light);
    color: white;
}

.footer {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-light);
}

.footer a {
    color: var(--color-primary);
    text-decoration: none;
}

.footer a:hover {
    text-decoration: underline;
}

.loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    font-size: 1.25rem;
    color: var(--color-text-light);
}

/* Responsive */
@media (max-width: 640px) {
    .header h1 {
        font-size: 2rem;
    }

    .counter-value {
        font-size: 2rem;
    }

    .counter-buttons {
        flex-direction: column;
    }
}
"#
}

// Keep backward compatibility with old function names
pub fn default_lib() -> &'static str {
    spa_lib()
}

pub fn island_lib() -> &'static str {
    r#"//! PhilJS Islands Application
//!
//! Partial hydration for interactive components.

mod components;

use philjs::prelude::*;
use wasm_bindgen::prelude::*;

use components::counter::Counter;

#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();

    // Register islands for partial hydration
    register_island("Counter", || view! { <Counter initial=0 /> });

    // Hydrate only the interactive islands
    hydrate_islands();
}
"#
}
