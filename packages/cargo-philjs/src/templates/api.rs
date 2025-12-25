//! REST API Template
//!
//! Backend API service with Axum.

use std::collections::HashMap;

/// Generate API template files
pub fn generate() -> HashMap<String, String> {
    let mut files = HashMap::new();

    // Cargo.toml
    files.insert(
        "Cargo.toml".to_string(),
        r#"[package]
name = "{{name}}"
version = "0.1.0"
edition = "2021"

[dependencies]
# Web framework
axum = { version = "0.7", features = ["macros"] }
tokio = { version = "1", features = ["full"] }
tower = { version = "0.4", features = ["util"] }
tower-http = { version = "0.5", features = ["fs", "cors", "compression-full", "trace"] }

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"
validator = { version = "0.16", features = ["derive"] }

# Database
sqlx = { version = "0.7", features = ["runtime-tokio-native-tls", "postgres", "uuid", "chrono"] }
# Or use SeaORM:
# sea-orm = { version = "0.12", features = ["sqlx-postgres", "runtime-tokio-native-tls", "macros"] }

# Authentication & Security
jsonwebtoken = "9"
argon2 = "0.5"
uuid = { version = "1", features = ["v4", "serde"] }

# Configuration
dotenvy = "0.15"
config = "0.13"

# Error handling
anyhow = "1.0"
thiserror = "1.0"

# Logging
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }

# Utilities
chrono = { version = "0.4", features = ["serde"] }
once_cell = "1.19"

[dev-dependencies]
http-body-util = "0.1"

[profile.release]
opt-level = 3
lto = true
codegen-units = 1
"#
        .to_string(),
    );

    // src/main.rs
    files.insert(
        "src/main.rs".to_string(),
        r#"//! {{name}} API Server

mod api;
mod config;
mod db;
mod error;
mod middleware;
mod models;

use axum::{
    routing::{get, post, put, delete},
    Router,
};
use std::net::SocketAddr;
use tower_http::{
    compression::CompressionLayer,
    cors::CorsLayer,
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::{
    api::{health, users},
    config::Config,
    db::Database,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "{{name}}=debug,tower_http=debug,axum=trace".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Config::from_env()?;

    // Initialize database
    let db = Database::new(&config.database_url).await?;

    // Build application
    let app = Router::new()
        // Health check
        .route("/health", get(health::check))
        .route("/health/ready", get(health::ready))

        // User routes
        .route("/api/users", get(users::list).post(users::create))
        .route("/api/users/:id", get(users::get).put(users::update).delete(users::delete))

        // Add more routes here

        // Middleware
        .layer(TraceLayer::new_for_http())
        .layer(CompressionLayer::new())
        .layer(CorsLayer::permissive())

        // State
        .with_state(db);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("API server listening on http://{}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;

    Ok(())
}
"#
        .to_string(),
    );

    // src/config.rs
    files.insert(
        "src/config.rs".to_string(),
        r#"//! Application Configuration

use anyhow::Result;

#[derive(Debug, Clone)]
pub struct Config {
    pub port: u16,
    pub database_url: String,
    pub jwt_secret: String,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        dotenvy::dotenv().ok();

        Ok(Self {
            port: std::env::var("PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()?,
            database_url: std::env::var("DATABASE_URL")
                .expect("DATABASE_URL must be set"),
            jwt_secret: std::env::var("JWT_SECRET")
                .unwrap_or_else(|_| "change-me-in-production".to_string()),
        })
    }
}
"#
        .to_string(),
    );

    // src/db.rs
    files.insert(
        "src/db.rs".to_string(),
        r#"//! Database Connection

use sqlx::{postgres::PgPoolOptions, PgPool};
use anyhow::Result;

#[derive(Clone)]
pub struct Database {
    pub pool: PgPool,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = PgPoolOptions::new()
            .max_connections(10)
            .connect(database_url)
            .await?;

        // Run migrations
        sqlx::migrate!("./migrations").run(&pool).await?;

        Ok(Self { pool })
    }
}
"#
        .to_string(),
    );

    // src/error.rs
    files.insert(
        "src/error.rs".to_string(),
        r#"//! Error Types

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Not found")]
    NotFound,

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Internal server error")]
    Internal(#[from] anyhow::Error),
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    message: String,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            ApiError::Database(ref e) => {
                tracing::error!("Database error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Database error".to_string())
            }
            ApiError::Validation(ref msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            ApiError::NotFound => (StatusCode::NOT_FOUND, "Resource not found".to_string()),
            ApiError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized".to_string()),
            ApiError::Internal(ref e) => {
                tracing::error!("Internal error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
            }
        };

        let body = Json(ErrorResponse {
            error: status.to_string(),
            message,
        });

        (status, body).into_response()
    }
}

pub type ApiResult<T> = Result<T, ApiError>;
"#
        .to_string(),
    );

    // src/middleware.rs
    files.insert(
        "src/middleware.rs".to_string(),
        r#"//! Middleware

use axum::{
    extract::Request,
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};

/// JWT authentication middleware
pub async fn auth(
    headers: HeaderMap,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = headers
        .get("Authorization")
        .and_then(|value| value.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if !auth_header.starts_with("Bearer ") {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = &auth_header[7..];

    // TODO: Verify JWT token
    // let claims = verify_token(token)?;
    // request.extensions_mut().insert(claims);

    Ok(next.run(request).await)
}
"#
        .to_string(),
    );

    // src/models.rs
    files.insert(
        "src/models.rs".to_string(),
        r#"//! Database Models

use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateUser {
    pub email: String,
    pub name: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUser {
    pub email: Option<String>,
    pub name: Option<String>,
}
"#
        .to_string(),
    );

    // src/api/mod.rs
    files.insert(
        "src/api/mod.rs".to_string(),
        "pub mod health;\npub mod users;\n".to_string(),
    );

    // src/api/health.rs
    files.insert(
        "src/api/health.rs".to_string(),
        r#"//! Health Check Endpoints

use axum::{extract::State, http::StatusCode, Json};
use serde::Serialize;

use crate::db::Database;

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
}

/// GET /health - Basic health check
pub async fn check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

/// GET /health/ready - Check if service is ready (including DB)
pub async fn ready(State(db): State<Database>) -> Result<Json<HealthResponse>, StatusCode> {
    // Test database connection
    sqlx::query("SELECT 1")
        .execute(&db.pool)
        .await
        .map_err(|_| StatusCode::SERVICE_UNAVAILABLE)?;

    Ok(Json(HealthResponse {
        status: "ready".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    }))
}
"#
        .to_string(),
    );

    // src/api/users.rs
    files.insert(
        "src/api/users.rs".to_string(),
        r#"//! User API Endpoints

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    db::Database,
    error::{ApiError, ApiResult},
    models::{CreateUser, UpdateUser, User},
};

#[derive(Deserialize)]
pub struct ListQuery {
    #[serde(default)]
    pub page: u32,
    #[serde(default = "default_limit")]
    pub limit: u32,
}

fn default_limit() -> u32 {
    20
}

/// GET /api/users - List users
pub async fn list(
    State(db): State<Database>,
    Query(params): Query<ListQuery>,
) -> ApiResult<Json<Vec<User>>> {
    let offset = params.page * params.limit;

    let users = sqlx::query_as::<_, User>(
        "SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
    )
    .bind(params.limit as i64)
    .bind(offset as i64)
    .fetch_all(&db.pool)
    .await?;

    Ok(Json(users))
}

/// GET /api/users/:id - Get user by ID
pub async fn get(
    State(db): State<Database>,
    Path(id): Path<Uuid>,
) -> ApiResult<Json<User>> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(id)
        .fetch_optional(&db.pool)
        .await?
        .ok_or(ApiError::NotFound)?;

    Ok(Json(user))
}

/// POST /api/users - Create user
pub async fn create(
    State(db): State<Database>,
    Json(payload): Json<CreateUser>,
) -> ApiResult<(StatusCode, Json<User>)> {
    // TODO: Hash password with argon2

    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (id, email, name, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING *",
    )
    .bind(Uuid::new_v4())
    .bind(&payload.email)
    .bind(&payload.name)
    .fetch_one(&db.pool)
    .await?;

    Ok((StatusCode::CREATED, Json(user)))
}

/// PUT /api/users/:id - Update user
pub async fn update(
    State(db): State<Database>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateUser>,
) -> ApiResult<Json<User>> {
    let user = sqlx::query_as::<_, User>(
        "UPDATE users SET
            email = COALESCE($1, email),
            name = COALESCE($2, name),
            updated_at = NOW()
         WHERE id = $3
         RETURNING *",
    )
    .bind(payload.email)
    .bind(payload.name)
    .bind(id)
    .fetch_optional(&db.pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    Ok(Json(user))
}

/// DELETE /api/users/:id - Delete user
pub async fn delete(
    State(db): State<Database>,
    Path(id): Path<Uuid>,
) -> ApiResult<StatusCode> {
    let result = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(id)
        .execute(&db.pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound);
    }

    Ok(StatusCode::NO_CONTENT)
}
"#
        .to_string(),
    );

    // migrations/001_create_users.sql
    files.insert(
        "migrations/001_create_users.sql".to_string(),
        r#"-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
"#
        .to_string(),
    );

    // .env.example
    files.insert(
        ".env.example".to_string(),
        r#"# Server
PORT=3000

# Database
DATABASE_URL=postgres://user:password@localhost/{{name}}

# Security
JWT_SECRET=change-me-in-production

# Logging
RUST_LOG={{name}}=debug,tower_http=debug
"#
        .to_string(),
    );

    // README.md
    files.insert(
        "README.md".to_string(),
        r#"# {{name}}

REST API built with Axum and PostgreSQL.

## Features

- RESTful API with Axum
- PostgreSQL database with SQLx
- Authentication with JWT
- Input validation
- Error handling
- Health checks
- OpenAPI/Swagger ready

## Getting Started

### Prerequisites

- Rust 1.75+
- PostgreSQL
- sqlx-cli: `cargo install sqlx-cli`

### Setup

1. Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

2. Create database:

```bash
createdb {{name}}
```

3. Run migrations:

```bash
sqlx migrate run
```

4. Start server:

```bash
cargo run
```

## API Endpoints

### Health

- `GET /health` - Basic health check
- `GET /health/ready` - Readiness check (includes DB)

### Users

- `GET /api/users` - List users (paginated)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Project Structure

```
src/
├── main.rs           # Application entry point
├── config.rs         # Configuration
├── db.rs             # Database setup
├── error.rs          # Error types
├── middleware.rs     # Middleware
├── models.rs         # Data models
└── api/             # API endpoints
    ├── health.rs    # Health checks
    └── users.rs     # User CRUD
migrations/          # Database migrations
```

## Development

```bash
# Run with auto-reload
cargo watch -x run

# Run tests
cargo test

# Check code
cargo clippy

# Format code
cargo fmt
```

## Production

```bash
# Build release
cargo build --release

# Run release
./target/release/{{name}}
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `RUST_LOG` - Logging configuration

## Learn More

- [Axum Documentation](https://docs.rs/axum)
- [SQLx Documentation](https://docs.rs/sqlx)
"#
        .to_string(),
    );

    files
}
