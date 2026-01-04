# @philjs/rocket

Rocket framework integration for PhilJS with type-safe routing, request guards, and SSR support.

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
philjs-rocket = "0.1"
rocket = "0.5"
```

## Overview

`@philjs/rocket` provides Rocket integration for PhilJS:

- **Type-safe Routing**: Rocket's compile-time route verification
- **Request Guards**: Authentication and validation
- **SSR Rendering**: Server-side render PhilJS components
- **Fairings**: Middleware for requests and responses
- **Forms**: Type-safe form handling
- **Templates**: Integrated with PhilJS views

## Quick Start

```rust
#[macro_use] extern crate rocket;

use philjs_rocket::{render, PhilJS};

#[get("/")]
fn index() -> PhilJS {
    render(|| view! { <App /> })
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/", routes![index])
        .attach(PhilJS::fairing())
}
```

## Route Handlers

```rust
#[get("/users/<id>")]
fn get_user(id: u64, db: &State<Database>) -> Result<Json<User>, Status> {
    db.find_user(id)
        .map(Json)
        .ok_or(Status::NotFound)
}

#[post("/users", data = "<user>")]
fn create_user(user: Json<CreateUser>, db: &State<Database>) -> Result<Json<User>, Status> {
    db.create_user(user.into_inner())
        .map(Json)
        .map_err(|_| Status::InternalServerError)
}
```

## Request Guards

```rust
use philjs_rocket::guards::{AuthUser, ApiKey};

#[get("/profile")]
fn profile(user: AuthUser) -> PhilJS {
    render(|| view! { <Profile user=user /> })
}

#[get("/api/data")]
fn api_data(_key: ApiKey) -> Json<Data> {
    Json(get_data())
}
```

## See Also

- [@philjs/rust](../rust/overview.md) - Rust framework
- [@philjs/axum](../axum/overview.md) - Axum integration
- [@philjs/actix](../actix/overview.md) - Actix integration
