# SSR with Axum

Axum is a fast async web framework that pairs well with PhilJS SSR.

## Dependencies

```toml
[dependencies]
philjs = "0.1"
philjs-axum = "0.1"
axum = "0.7"
tokio = { version = "1", features = ["full"] }
```

## Basic SSR Route

```rust
use axum::{routing::get, Router};
use axum::response::Html;
use philjs::prelude::*;
use philjs::ssr::render_to_string;

#[component]
fn App() -> impl IntoView {
    view! { <h1>"Hello from Axum"</h1> }
}

async fn index() -> Html<String> {
    let html = render_to_string(|| view! { <App /> });
    Html(html)
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/", get(index));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

## SSR with Hydration Data

Use `render_to_string_with_context` to collect hydration data:

```rust
use philjs::ssr::render_to_string_with_context;

let (html, ctx) = render_to_string_with_context(|| view! { <App /> });
let document = format!(
    "<!doctype html><html><head>{}</head><body>{}</body></html>",
    ctx.head_elements(),
    format!("{}{}", html, ctx.data_scripts())
);
```
