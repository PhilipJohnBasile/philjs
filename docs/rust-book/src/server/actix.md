# SSR with Actix

Actix Web is a production-ready HTTP framework with excellent performance.

## Dependencies

```toml
[dependencies]
philjs = "0.1"
philjs-actix = "0.1"
actix-web = "4"
```

## Basic SSR Handler

```rust
use actix_web::{get, App, HttpResponse, HttpServer};
use philjs::prelude::*;
use philjs::ssr::render_to_string;

#[component]
fn App() -> impl IntoView {
    view! { <h1>"Hello from Actix"</h1> }
}

#[get("/")]
async fn index() -> HttpResponse {
    let html = render_to_string(|| view! { <App /> });
    HttpResponse::Ok().content_type("text/html").body(html)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| App::new().service(index))
        .bind(("127.0.0.1", 3000))?
        .run()
        .await
}
```
