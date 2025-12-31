# Server Functions

Server functions let you call Rust logic from the client without writing manual endpoints.

## Define a Server Function

```rust
use philjs::prelude::*;
use philjs::server::*;

#[server]
async fn get_user(id: u64) -> ServerResult<String> {
    Ok(format!("user:{}", id))
}
```

## Call from the Client

```rust
use philjs::server::call_server;

let response = call_server::<GetUser>(123).await?;
```

## Error Handling

Server functions return `ServerResult<T>` which includes a structured `ServerError`:

```rust
#[server]
async fn protected() -> ServerResult<String> {
    Err(ServerError::unauthorized("not signed in"))
}
```
