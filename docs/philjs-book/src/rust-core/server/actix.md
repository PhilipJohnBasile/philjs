# SSR with Actix

PhilJS integrates with Actix via `philjs-actix`.

```rust
use philjs_actix::prelude::*;

async fn home() -> impl Responder {
    render_document("Home", || view! {
        <main>
            <h1>"PhilJS + Actix"</h1>
        </main>
    })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .configure(PhilJsConfig::default())
            .service(PhilJsService::new())
            .route("/", web::get().to(home))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```
