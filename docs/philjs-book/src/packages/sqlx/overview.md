# @philjs/sqlx

SQLx integration for PhilJS with compile-time checked queries and async database operations.

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
philjs-sqlx = "0.1"
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres"] }
```

## Overview

`@philjs/sqlx` provides SQLx integration for PhilJS:

- **Compile-time Queries**: SQL validation at compile time
- **Async Operations**: Full async/await support
- **Multiple Databases**: PostgreSQL, MySQL, SQLite, MSSQL
- **Migrations**: Built-in migration system
- **Connection Pooling**: Efficient connection management
- **Reactive Integration**: Signal-based query results

## Quick Start

```rust
use philjs_sqlx::{query, query_as, Pool};

// Compile-time checked query
let users = sqlx::query_as!(
    User,
    "SELECT id, name, email FROM users WHERE active = $1",
    true
)
.fetch_all(&pool)
.await?;
```

## Reactive Queries

```rust
use philjs_sqlx::use_sql_query;

#[component]
fn UserList() -> impl IntoView {
    let users = use_sql_query!(
        Vec<User>,
        "SELECT * FROM users ORDER BY created_at DESC"
    );

    view! {
        <Suspense>
            <For each=move || users.get()>
                {|user| view! { <UserRow user=user /> }}
            </For>
        </Suspense>
    }
}
```

## Transactions

```rust
use philjs_sqlx::transaction;

async fn transfer_funds(from: i64, to: i64, amount: f64) -> Result<()> {
    let mut tx = pool.begin().await?;

    sqlx::query!("UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, from)
        .execute(&mut *tx)
        .await?;

    sqlx::query!("UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, to)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(())
}
```

## See Also

- [@philjs/db](../db/overview.md) - Database layer
- [@philjs/seaorm](../seaorm/overview.md) - SeaORM integration
- [@philjs/rust](../rust/overview.md) - Rust framework
