//! LiveView Template
//!
//! Phoenix-style server-driven UI with real-time updates via WebSocket.

use std::collections::HashMap;

/// Generate LiveView template files
pub fn generate() -> HashMap<String, String> {
    let mut files = HashMap::new();

    // Cargo.toml
    files.insert(
        "Cargo.toml".to_string(),
        r#"[package]
name = "{{name}}"
version = "0.1.0"
edition = "2021"

[dependencies]
philjs-liveview = "2.0"
axum = { version = "0.7", features = ["macros", "ws"] }
tokio = { version = "1", features = ["full"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["fs", "cors"] }

serde = { version = "1", features = ["derive"] }
serde_json = "1"

tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
anyhow = "1.0"

[profile.release]
opt-level = 3
lto = true
"#
        .to_string(),
    );

    // src/main.rs
    files.insert(
        "src/main.rs".to_string(),
        r#"//! {{name}} - PhilJS LiveView Application
//!
//! Server-driven UI with real-time updates.

mod views;

use axum::{
    routing::get,
    Router,
};
use tower_http::services::ServeDir;
use std::net::SocketAddr;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive(tracing::Level::INFO.into()),
        )
        .init();

    let app = Router::new()
        .route("/", get(views::home::home))
        .route("/live", get(views::home::live_handler))
        .route("/counter", get(views::counter::counter))
        .route("/counter/live", get(views::counter::live_handler))
        .nest_service("/static", ServeDir::new("static"));

    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    tracing::info!("LiveView server at http://{}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;

    Ok(())
}
"#
        .to_string(),
    );

    // src/views/mod.rs
    files.insert(
        "src/views/mod.rs".to_string(),
        "pub mod home;\npub mod counter;\n".to_string(),
    );

    // src/views/home.rs
    files.insert(
        "src/views/home.rs".to_string(),
        r#"//! Home View

use axum::{
    response::Html,
    extract::WebSocketUpgrade,
    response::Response,
};
use philjs_liveview::prelude::*;

pub async fn home() -> Html<String> {
    Html(render_page("{{name}}", r#"
        <main class="home">
            <h1>Welcome to {{name}}</h1>
            <p>A LiveView application powered by PhilJS</p>

            <div class="features">
                <div class="feature">
                    <h2>🚀 Server-Driven UI</h2>
                    <p>All rendering happens on the server</p>
                </div>
                <div class="feature">
                    <h2>⚡ Real-Time Updates</h2>
                    <p>WebSocket pushes changes instantly</p>
                </div>
                <div class="feature">
                    <h2>🔒 Secure by Default</h2>
                    <p>No client-side state to expose</p>
                </div>
            </div>

            <nav class="demo-nav">
                <a href="/counter" data-phx-link="redirect">Try Counter Demo →</a>
            </nav>
        </main>
    "#))
}

pub async fn live_handler(ws: WebSocketUpgrade) -> Response {
    ws.on_upgrade(|socket| async {
        // Handle LiveView WebSocket connection
        let _ = socket;
    })
}

fn render_page(title: &str, content: &str) -> String {
    format!(r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{title}</title>
    <link rel="stylesheet" href="/static/styles.css">
</head>
<body>
    {content}
    <script src="/static/liveview.js"></script>
</body>
</html>"#)
}
"#
        .to_string(),
    );

    // src/views/counter.rs
    files.insert(
        "src/views/counter.rs".to_string(),
        r#"//! Counter LiveView

use axum::{
    response::Html,
    extract::WebSocketUpgrade,
    response::Response,
};
use philjs_liveview::prelude::*;
use std::sync::atomic::{AtomicI32, Ordering};

static COUNT: AtomicI32 = AtomicI32::new(0);

pub async fn counter() -> Html<String> {
    let count = COUNT.load(Ordering::Relaxed);
    Html(render_counter(count))
}

pub async fn live_handler(ws: WebSocketUpgrade) -> Response {
    ws.on_upgrade(|mut socket| async move {
        use futures::StreamExt;

        while let Some(msg) = socket.recv().await {
            if let Ok(axum::extract::ws::Message::Text(text)) = msg {
                match text.as_str() {
                    "increment" => {
                        let new = COUNT.fetch_add(1, Ordering::Relaxed) + 1;
                        let html = render_count(new);
                        let _ = socket.send(axum::extract::ws::Message::Text(html)).await;
                    }
                    "decrement" => {
                        let new = COUNT.fetch_sub(1, Ordering::Relaxed) - 1;
                        let html = render_count(new);
                        let _ = socket.send(axum::extract::ws::Message::Text(html)).await;
                    }
                    _ => {}
                }
            }
        }
    })
}

fn render_count(count: i32) -> String {
    format!(r#"<span id="count">{}</span>"#, count)
}

fn render_counter(count: i32) -> String {
    format!(r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Counter - {{{{name}}}}</title>
    <link rel="stylesheet" href="/static/styles.css">
</head>
<body>
    <main class="counter-page">
        <h1>LiveView Counter</h1>
        <p>State lives on the server, updates via WebSocket</p>

        <div class="counter" phx-hook="Counter" id="counter">
            <button phx-click="decrement" class="btn">-</button>
            <span id="count">{count}</span>
            <button phx-click="increment" class="btn">+</button>
        </div>

        <a href="/" class="back">← Back to Home</a>
    </main>
    <script src="/static/liveview.js"></script>
</body>
</html>"#)
}
"#
        .to_string(),
    );

    // static/styles.css
    files.insert(
        "static/styles.css".to_string(),
        r#"/* {{name}} LiveView Styles */

:root {
    --primary: #6366f1;
    --primary-dark: #4f46e5;
    --text: #1f2937;
    --text-muted: #6b7280;
    --bg: #f9fafb;
    --card: #ffffff;
    --border: #e5e7eb;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: system-ui, sans-serif;
    line-height: 1.6;
    color: var(--text);
    background: var(--bg);
    min-height: 100vh;
}

/* Home */
.home {
    max-width: 900px;
    margin: 0 auto;
    padding: 4rem 2rem;
    text-align: center;
}

.home h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
}

.home > p {
    color: var(--text-muted);
    font-size: 1.25rem;
    margin-bottom: 3rem;
}

.features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
}

.feature {
    background: var(--card);
    padding: 1.5rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
}

.feature h2 {
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
}

.feature p {
    color: var(--text-muted);
    font-size: 0.875rem;
}

.demo-nav a {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: var(--primary);
    color: white;
    text-decoration: none;
    border-radius: 0.5rem;
    font-weight: 500;
}

.demo-nav a:hover {
    background: var(--primary-dark);
}

/* Counter */
.counter-page {
    max-width: 600px;
    margin: 0 auto;
    padding: 4rem 2rem;
    text-align: center;
}

.counter-page h1 {
    margin-bottom: 0.5rem;
}

.counter-page > p {
    color: var(--text-muted);
    margin-bottom: 2rem;
}

.counter {
    display: inline-flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem;
    background: var(--card);
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    margin-bottom: 2rem;
}

.counter .btn {
    width: 3rem;
    height: 3rem;
    font-size: 1.5rem;
    font-weight: 600;
    border: none;
    background: var(--primary);
    color: white;
    border-radius: 0.5rem;
    cursor: pointer;
}

.counter .btn:hover {
    background: var(--primary-dark);
}

.counter #count {
    font-size: 2.5rem;
    font-weight: 700;
    min-width: 4rem;
}

.back {
    color: var(--text-muted);
    text-decoration: none;
}

.back:hover {
    color: var(--primary);
}
"#
        .to_string(),
    );

    // static/liveview.js
    files.insert(
        "static/liveview.js".to_string(),
        r#"// PhilJS LiveView Client
(function() {
    'use strict';

    const path = window.location.pathname;
    const ws = new WebSocket(`ws://${window.location.host}${path}/live`);

    ws.onmessage = function(event) {
        const temp = document.createElement('div');
        temp.innerHTML = event.data;
        const newEl = temp.firstElementChild;
        const oldEl = document.getElementById(newEl.id);
        if (oldEl) {
            oldEl.replaceWith(newEl);
        }
    };

    ws.onclose = function() {
        console.log('LiveView connection closed');
    };

    document.addEventListener('click', function(e) {
        const action = e.target.getAttribute('phx-click');
        if (action && ws.readyState === WebSocket.OPEN) {
            ws.send(action);
        }
    });
})();
"#
        .to_string(),
    );

    // README.md
    files.insert(
        "README.md".to_string(),
        r#"# {{name}}

PhilJS LiveView - Server-driven UI with real-time updates.

## Features

- **Server-Rendered**: All HTML generated on server
- **WebSocket Updates**: Real-time UI updates without page reload
- **No Client State**: State lives on the server
- **Minimal JavaScript**: Just WebSocket handling

## Getting Started

```bash
# Run server
cargo run

# Open http://127.0.0.1:8080
```

## How LiveView Works

1. Server renders initial HTML
2. Client connects via WebSocket
3. User interactions sent to server
4. Server updates state, sends HTML diff
5. Client patches DOM

## Project Structure

```
src/
├── main.rs       # Server setup
└── views/        # LiveView handlers
    ├── home.rs
    └── counter.rs
static/
├── styles.css
└── liveview.js   # WebSocket client
```
"#
        .to_string(),
    );

    files
}
