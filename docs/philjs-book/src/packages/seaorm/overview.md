# @philjs/seaorm

SeaORM integration for PhilJS with async database operations, migrations, and type-safe queries.

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
philjs-seaorm = "0.1"
sea-orm = { version = "0.12", features = ["sqlx-postgres", "runtime-tokio-native-tls"] }
```

## Overview

`@philjs/seaorm` provides SeaORM integration for PhilJS:

- **Async ORM**: Full async/await support
- **Type-safe Queries**: Compile-time query validation
- **Migrations**: Schema version control
- **Multiple Databases**: PostgreSQL, MySQL, SQLite
- **Reactive Queries**: Signal-based data fetching
- **Connection Pooling**: Efficient database connections

## Quick Start

```rust
use philjs_seaorm::{Database, Entity, ActiveModel};

// Define entity
#[derive(Clone, Debug, DeriveEntityModel)]
#[sea_orm(table_name = "users")]
pub struct User {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub name: String,
    pub email: String,
}

// Connect and query
let db = Database::connect("postgres://localhost/mydb").await?;
let users = User::find().all(&db).await?;
```

## Reactive Queries

```rust
use philjs_seaorm::use_query;

#[component]
fn UserList() -> impl IntoView {
    let users = use_query(|| User::find().all(&db));

    view! {
        <For each=move || users.get() key=|u| u.id>
            {|user| view! { <UserCard user=user /> }}
        </For>
    }
}
```

## Mutations

```rust
use philjs_seaorm::use_mutation;

#[component]
fn CreateUser() -> impl IntoView {
    let create = use_mutation(|data: CreateUserData| async move {
        let user = user::ActiveModel {
            name: Set(data.name),
            email: Set(data.email),
            ..Default::default()
        };
        user.insert(&db).await
    });

    view! {
        <form on:submit=move |e| create.mutate(form_data(e))>
            // form fields
        </form>
    }
}
```

## See Also

- [@philjs/db](../db/overview.md) - Database layer
- [@philjs/sqlx](../sqlx/overview.md) - SQLx integration
- [@philjs/rust](../rust/overview.md) - Rust framework
