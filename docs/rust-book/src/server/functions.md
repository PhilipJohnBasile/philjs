# Server Functions

Server functions run on the server but can be called from client code.

```rust
use philjs::server::server_fn;
use philjs::server::ServerResult;

server_fn! {
    async fn get_user(id: u64) -> ServerResult<String> {
        Ok(format!("user-{}", id))
    }
}
```

## Axum integration

```rust
use philjs::server::axum_handler::server_fn_router;

let app = Router::new().merge(server_fn_router());
```
