//! SSR (Server-Side Rendering) Template
//!
//! Template focused on SSR with hydration and progressive enhancement.

use std::collections::HashMap;

/// Generate SSR template files
pub fn generate() -> HashMap<String, String> {
    let mut files = HashMap::new();

    // Cargo.toml
    files.insert(
        "Cargo.toml".to_string(),
        r#"[package]
name = "{{name}}"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
philjs = "2.0"
philjs-server = "2.0"
philjs-axum = "2.0"
wasm-bindgen = "0.2"
console_error_panic_hook = "0.1"

# Server
axum = { version = "0.7", features = ["macros"] }
tokio = { version = "1", features = ["full"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["fs", "cors", "compression-full"] }

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Utilities
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
anyhow = "1.0"

[features]
default = []
ssr = ["philjs/ssr"]
hydrate = ["philjs/hydrate"]

[profile.release]
opt-level = "z"
lto = true
codegen-units = 1
panic = "abort"
"#
        .to_string(),
    );

    // src/lib.rs
    files.insert(
        "src/lib.rs".to_string(),
        r#"//! {{name}} - PhilJS SSR Application
//!
//! Server-side rendered application with progressive hydration.

pub mod components;

#[cfg(not(target_arch = "wasm32"))]
pub mod server;

use philjs::prelude::*;
use components::app::App;

// ============================================================================
// Client Entry (WASM) - Hydration
// ============================================================================

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();

    // Hydrate the server-rendered HTML
    philjs::hydrate_to_element(
        document().get_element_by_id("app").expect("app element"),
        || view! { <App /> }
    );
}

// ============================================================================
// Server Entry - SSR
// ============================================================================

#[cfg(not(target_arch = "wasm32"))]
pub use server::start_server;

#[cfg(not(target_arch = "wasm32"))]
pub fn render_to_string() -> String {
    use philjs::ssr::render_to_string;

    render_to_string(|| view! {
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="description" content="PhilJS SSR Application" />
                <title>"{{name}}"</title>
                <link rel="stylesheet" href="/static/styles.css" />
                // Preload the WASM module for faster hydration
                <link rel="modulepreload" href="/pkg/app.js" />
            </head>
            <body>
                <div id="app">
                    <App />
                </div>
                // Load JS last for progressive enhancement
                <script type="module" src="/pkg/app.js"></script>
            </body>
        </html>
    })
}
"#
        .to_string(),
    );

    // src/components/mod.rs
    files.insert(
        "src/components/mod.rs".to_string(),
        "pub mod app;\npub mod counter;\npub mod navigation;\n".to_string(),
    );

    // src/components/app.rs
    files.insert(
        "src/components/app.rs".to_string(),
        r#"//! Root App Component

use philjs::prelude::*;
use super::counter::Counter;
use super::navigation::Navigation;

#[component]
pub fn App() -> impl IntoView {
    view! {
        <div class="app">
            <Navigation />

            <main class="main">
                <section class="hero">
                    <h1>"Welcome to {{name}}"</h1>
                    <p class="subtitle">
                        "A server-rendered PhilJS application with progressive hydration"
                    </p>
                </section>

                <section class="features">
                    <div class="feature-card">
                        <h2>"⚡ Fast Initial Load"</h2>
                        <p>"Server-rendered HTML loads instantly, no JavaScript required for first paint."</p>
                    </div>

                    <div class="feature-card">
                        <h2>"🔄 Progressive Hydration"</h2>
                        <p>"Components become interactive as JavaScript loads."</p>
                    </div>

                    <div class="feature-card">
                        <h2>"🦀 Rust-Powered"</h2>
                        <p>"Type-safe, performant, and reliable."</p>
                    </div>
                </section>

                <section class="demo">
                    <h2>"Interactive Demo"</h2>
                    <p>"This counter becomes interactive after hydration:"</p>
                    <Counter initial=0 />
                </section>
            </main>

            <footer class="footer">
                <p>
                    "Built with "
                    <a href="https://philjs.dev" target="_blank">"PhilJS"</a>
                </p>
            </footer>
        </div>
    }
}
"#
        .to_string(),
    );

    // src/components/counter.rs
    files.insert(
        "src/components/counter.rs".to_string(),
        r#"//! Counter Component
//!
//! Demonstrates hydration - works without JS (shows initial value)
//! but becomes interactive after hydration.

use philjs::prelude::*;

#[component]
pub fn Counter(
    #[prop(default = 0)]
    initial: i32,
) -> impl IntoView {
    let (count, set_count) = create_signal(initial);

    view! {
        <div class="counter">
            <button
                class="counter-btn"
                on:click=move |_| set_count.update(|c| *c -= 1)
            >
                "-"
            </button>

            <span class="counter-value">{count}</span>

            <button
                class="counter-btn"
                on:click=move |_| set_count.update(|c| *c += 1)
            >
                "+"
            </button>
        </div>
    }
}
"#
        .to_string(),
    );

    // src/components/navigation.rs
    files.insert(
        "src/components/navigation.rs".to_string(),
        r#"//! Navigation Component

use philjs::prelude::*;

#[component]
pub fn Navigation() -> impl IntoView {
    view! {
        <nav class="nav">
            <div class="nav-brand">
                <a href="/">"{{name}}"</a>
            </div>
            <ul class="nav-links">
                <li><a href="/">"Home"</a></li>
                <li><a href="/about">"About"</a></li>
                <li><a href="/docs">"Docs"</a></li>
            </ul>
        </nav>
    }
}
"#
        .to_string(),
    );

    // src/server.rs
    files.insert(
        "src/server.rs".to_string(),
        r#"//! Server Configuration

use axum::{
    routing::get,
    Router,
    response::Html,
};
use tower_http::{
    services::ServeDir,
    compression::CompressionLayer,
};
use std::net::SocketAddr;

pub async fn start_server() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive(tracing::Level::INFO.into()),
        )
        .init();

    let app = Router::new()
        .route("/", get(index))
        .route("/about", get(index))
        .route("/docs", get(index))
        .nest_service("/pkg", ServeDir::new("pkg"))
        .nest_service("/static", ServeDir::new("static"))
        .layer(CompressionLayer::new());

    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    tracing::info!("Server running at http://{}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;

    Ok(())
}

async fn index() -> Html<String> {
    Html(crate::render_to_string())
}
"#
        .to_string(),
    );

    // static/styles.css
    files.insert(
        "static/styles.css".to_string(),
        r#"/* {{name}} - SSR Styles */

:root {
    --primary: #3b82f6;
    --primary-dark: #2563eb;
    --text: #1f2937;
    --text-muted: #6b7280;
    --bg: #ffffff;
    --bg-alt: #f3f4f6;
    --border: #e5e7eb;
    --radius: 0.5rem;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: system-ui, -apple-system, sans-serif;
    line-height: 1.6;
    color: var(--text);
    background: var(--bg);
}

.app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* Navigation */
.nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    border-bottom: 1px solid var(--border);
}

.nav-brand a {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text);
    text-decoration: none;
}

.nav-links {
    display: flex;
    gap: 1.5rem;
    list-style: none;
}

.nav-links a {
    color: var(--text-muted);
    text-decoration: none;
}

.nav-links a:hover {
    color: var(--primary);
}

/* Main */
.main {
    flex: 1;
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

/* Hero */
.hero {
    text-align: center;
    padding: 4rem 0;
}

.hero h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.subtitle {
    font-size: 1.25rem;
    color: var(--text-muted);
}

/* Features */
.features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    padding: 2rem 0;
}

.feature-card {
    padding: 1.5rem;
    background: var(--bg-alt);
    border-radius: var(--radius);
}

.feature-card h2 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
}

/* Demo */
.demo {
    text-align: center;
    padding: 3rem 0;
}

.demo h2 {
    margin-bottom: 0.5rem;
}

.demo > p {
    color: var(--text-muted);
    margin-bottom: 1.5rem;
}

/* Counter */
.counter {
    display: inline-flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-alt);
    border-radius: var(--radius);
}

.counter-btn {
    width: 3rem;
    height: 3rem;
    font-size: 1.5rem;
    border: none;
    background: var(--primary);
    color: white;
    border-radius: var(--radius);
    cursor: pointer;
}

.counter-btn:hover {
    background: var(--primary-dark);
}

.counter-value {
    font-size: 2rem;
    font-weight: 700;
    min-width: 3rem;
    text-align: center;
}

/* Footer */
.footer {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
    border-top: 1px solid var(--border);
}

.footer a {
    color: var(--primary);
    text-decoration: none;
}
"#
        .to_string(),
    );

    // README.md
    files.insert(
        "README.md".to_string(),
        r#"# {{name}}

PhilJS SSR Application with progressive hydration.

## Features

- **Server-Side Rendering**: Fast initial page loads
- **Progressive Hydration**: JavaScript loads without blocking
- **SEO Friendly**: Full HTML content for crawlers
- **Type-Safe**: End-to-end Rust

## Getting Started

```bash
# Development
cargo philjs dev

# Production build
cargo philjs build --release --ssr

# Run server
cargo run --features ssr --release
```

## How SSR Works

1. Server renders complete HTML
2. Browser displays content immediately
3. JavaScript loads in background
4. Components become interactive (hydration)

## Project Structure

```
src/
├── lib.rs              # Entry point
├── components/         # UI components
│   ├── app.rs
│   ├── counter.rs
│   └── navigation.rs
└── server.rs           # SSR server
static/
└── styles.css
```
"#
        .to_string(),
    );

    files
}
