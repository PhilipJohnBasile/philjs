# PhilJS SQLx Integration

Type-safe SQL queries with compile-time verification for PhilJS applications.

## Features

- **Reactive Query Wrappers**: Integrate SQLx queries with PhilJS's reactive system
- **Transaction Helpers**: Safe transaction handling with automatic rollback
- **Migration Utilities**: Database schema migration support
- **Compile-time Verification**: Type-safe SQL with compile-time checks
- **Connection Pooling**: Efficient database connection management

## Installation

```toml
[dependencies]
philjs-sqlx = { version = "2.0", features = ["postgres"] }
```

## Quick Start

```rust
use philjs_sqlx::prelude::*;
use sqlx::FromRow;

#[derive(FromRow, Serialize, Deserialize)]
struct User {
    id: i64,
    name: String,
    email: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create connection pool
    let pool = create_pool("postgres://localhost/mydb").await?;

    // Query users
    let users = sqlx::query_as!(User, "SELECT * FROM users WHERE active = $1", true)
        .fetch_all(&pool)
        .await?;

    Ok(())
}
```

## Reactive Queries

### Using with PhilJS Resources

```rust
use philjs_sqlx::reactive::DbResource;

#[derive(FromRow)]
struct Post {
    id: i64,
    title: String,
    content: String,
}

// Create a reactive database resource
let posts = DbResource::new(&pool, "SELECT * FROM posts ORDER BY created_at DESC");

// Use in components
view! {
    <Suspense fallback=|| view! { <div>"Loading..."</div> }>
        {move || {
            posts.fetch().await.map(|posts| view! {
                <For
                    each=move || posts.clone()
                    key=|post| post.id
                    children=|post| view! {
                        <div>
                            <h2>{post.title}</h2>
                            <p>{post.content}</p>
                        </div>
                    }
                />
            })
        }}
    </Suspense>
}
```

### Query Builder

```rust
use philjs_sqlx::reactive::ReactiveQueryBuilder;

let users = ReactiveQueryBuilder::new("users")
    .select(&["id", "name", "email"])
    .where_clause("active = true")
    .where_clause("verified = true")
    .order_by("name ASC")
    .limit(10)
    .offset(0)
    .fetch_all(&pool)
    .await?;
```

## Transactions

### Simple Transactions

```rust
use philjs_sqlx::transaction::with_transaction;

with_transaction(&pool, |tx| async move {
    sqlx::query("INSERT INTO users (name, email) VALUES ($1, $2)")
        .bind("Alice")
        .bind("alice@example.com")
        .execute(&mut *tx)
        .await?;

    sqlx::query("INSERT INTO profiles (user_id, bio) VALUES ($1, $2)")
        .bind(1)
        .bind("Software developer")
        .execute(&mut *tx)
        .await?;

    Ok(())
}).await?;
```

### Transaction with Savepoints

```rust
use philjs_sqlx::transaction::{with_transaction, Savepoint};

with_transaction(&pool, |tx| async move {
    // Insert user
    sqlx::query("INSERT INTO users (name) VALUES ($1)")
        .bind("Bob")
        .execute(&mut *tx)
        .await?;

    // Try to create profile with savepoint
    let sp = Savepoint::new(tx, "profile_creation").await?;

    match sqlx::query("INSERT INTO profiles (user_id, bio) VALUES ($1, $2)")
        .bind(2)
        .bind("Engineer")
        .execute(&mut *sp.transaction())
        .await
    {
        Ok(_) => sp.release().await?,
        Err(_) => sp.rollback().await?,
    }

    Ok(())
}).await?;
```

### Retry on Transient Errors

```rust
use philjs_sqlx::transaction::retry_transaction;

retry_transaction(&pool, 3, |tx| async move {
    sqlx::query("UPDATE counters SET value = value + 1 WHERE id = $1")
        .bind(1)
        .execute(&mut *tx)
        .await?;
    Ok(())
}).await?;
```

### Batch Operations

```rust
use philjs_sqlx::transaction::BatchOperation;

let users = vec![
    ("Alice", "alice@example.com"),
    ("Bob", "bob@example.com"),
    ("Carol", "carol@example.com"),
];

BatchOperation::new(&pool)
    .batch_size(100)
    .execute(users, |tx, (name, email)| async move {
        sqlx::query("INSERT INTO users (name, email) VALUES ($1, $2)")
            .bind(name)
            .bind(email)
            .execute(&mut *tx)
            .await?;
        Ok(())
    })
    .await?;
```

## Migrations

### Running Migrations

```rust
use philjs_sqlx::migrate::{run_migrations, MigrationRunner};

// Simple migration run
run_migrations(&pool, "./migrations").await?;

// With migration runner
let runner = MigrationRunner::new(&pool, "./migrations");
runner.run().await?;
```

### Reverting Migrations

```rust
let runner = MigrationRunner::new(&pool, "./migrations");
runner.revert().await?;
```

## Server Functions

```rust
use philjs_sqlx::prelude::*;

#[server]
async fn get_users() -> Result<Vec<User>, ServerFnError> {
    let pool = use_pool()?;

    let users = sqlx::query_as!(
        User,
        "SELECT id, name, email FROM users WHERE active = $1",
        true
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| ServerFnError::ServerError(e.to_string()))?;

    Ok(users)
}

#[server]
async fn create_user(name: String, email: String) -> Result<User, ServerFnError> {
    let pool = use_pool()?;

    let user = sqlx::query_as!(
        User,
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email",
        name,
        email
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| ServerFnError::ServerError(e.to_string()))?;

    Ok(user)
}
```

## Connection Pooling

### Custom Pool Configuration

```rust
use philjs_sqlx::pool::PoolConfig;

let config = PoolConfig::new("postgres://localhost/mydb")
    .max_connections(20)
    .min_connections(5)
    .connect_timeout_secs(30)
    .idle_timeout_secs(600)
    .test_on_acquire(true);

let pool = config.create().await?;
```

## Context Integration

```rust
use philjs_sqlx::context::{provide_pool, use_pool};

// Provide pool in your app setup
provide_pool(pool.clone());

// Use in components or server functions
let pool = use_pool()?;
```

## Helper Macros

```rust
use philjs_sqlx::{db_query_as, db_query_one, db_scalar};

// Query all
let users: Vec<User> = db_query_as!(User, &pool, "SELECT * FROM users")?;

// Query one
let user: User = db_query_one!(User, &pool, "SELECT * FROM users WHERE id = $1", 1)?;

// Query scalar
let count: i64 = db_scalar!(i64, &pool, "SELECT COUNT(*) FROM users")?;
```

## Features

```toml
[dependencies]
philjs-sqlx = { version = "2.0", features = ["postgres", "migrate", "uuid", "chrono"] }
```

Available features:
- `postgres` (default): PostgreSQL support
- `mysql`: MySQL support
- `sqlite`: SQLite support
- `mssql`: Microsoft SQL Server support
- `migrate`: Migration support
- `uuid`: UUID support
- `chrono`: DateTime support
- `json`: JSON support

## Complete Example

```rust
use philjs_sqlx::prelude::*;
use philjs_sqlx::transaction::with_transaction;
use philjs_sqlx::reactive::ReactiveQueryBuilder;
use sqlx::FromRow;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
struct User {
    id: i64,
    name: String,
    email: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create pool
    let pool = create_pool("postgres://localhost/mydb").await?;

    // Run migrations
    run_migrations(&pool, "./migrations").await?;

    // Insert user in transaction
    with_transaction(&pool, |tx| async move {
        sqlx::query("INSERT INTO users (name, email) VALUES ($1, $2)")
            .bind("Alice")
            .bind("alice@example.com")
            .execute(&mut *tx)
            .await?;
        Ok(())
    }).await?;

    // Query users
    let users = ReactiveQueryBuilder::new("users")
        .select(&["id", "name", "email"])
        .where_clause("active = true")
        .order_by("name ASC")
        .fetch_all::<_, _, User>(&pool)
        .await?;

    println!("Found {} users", users.len());

    Ok(())
}
```

## License

MIT
