# SSR with Axum

PhilJS integrates with Axum via `philjs-axum`.

```rust
use philjs_axum::prelude::*;

async fn home() -> PhilJsHtml {
    render_document("Home", || view! {
        <main>
            <h1>"PhilJS + Axum"</h1>
        </main>
    })
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(home))
        .layer(PhilJsLayer::new());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

## Notes

- Use `render_document` for full HTML shells.
- Use `render_to_response` for partial HTML responses.
