//! # PhilJS SQLx Integration
//!
//! Type-safe SQL queries with compile-time verification for PhilJS applications.
//!
//! ## Features
//!
//! - **Type-safe Queries**: Compile-time SQL verification
//! - **Connection Pooling**: Efficient database connection management
//! - **Server Function Integration**: Seamless use with PhilJS server functions
//! - **Transaction Support**: Safe transaction handling
//! - **Migration Support**: Database schema migrations
//!
//! ## Quick Start
//!
//! ```rust
//! use philjs_sqlx::prelude::*;
//!
//! #[derive(sqlx::FromRow, Serialize)]
//! struct User {
//!     id: i64,
//!     name: String,
//!     email: String,
//! }
//!
//! // Type-safe query with compile-time verification
//! let users = sqlx::query_as!(User, "SELECT * FROM users WHERE active = $1", true)
//!     .fetch_all(&pool)
//!     .await?;
//!
//! // With PhilJS server functions
//! #[server]
//! async fn get_users() -> Result<Vec<User>, ServerFnError> {
//!     let pool = use_context::<DbPool>()?;
//!     User::find_all(&pool).await.map_err(Into::into)
//! }
//! ```

#![warn(missing_docs)]

pub mod pool;
pub mod query;
pub mod context;
pub mod error;
pub mod reactive;
pub mod transaction;

#[cfg(feature = "migrate")]
pub mod migration;
#[cfg(feature = "migrate")]
pub mod migrate;

// Re-exports
pub use pool::{DbPool, PoolConfig, create_pool};
pub use query::{Query, QueryBuilder, Executor};
pub use context::{provide_pool, use_pool, DbContext};
pub use error::{DbError, DbResult};

// Re-export sqlx types
pub use sqlx::{
    FromRow, Row, Column, TypeInfo, ValueRef,
    query, query_as, query_scalar,
    Encode, Decode, Type,
};

#[cfg(feature = "postgres")]
pub use sqlx::{Postgres, PgPool, PgConnection, PgRow};

#[cfg(feature = "mysql")]
pub use sqlx::{MySql, MySqlPool, MySqlConnection, MySqlRow};

#[cfg(feature = "sqlite")]
pub use sqlx::{Sqlite, SqlitePool, SqliteConnection, SqliteRow};

/// Prelude - import commonly used items
pub mod prelude {
    pub use crate::pool::{DbPool, PoolConfig, create_pool};
    pub use crate::query::{Query, QueryBuilder, Executor};
    pub use crate::context::{provide_pool, use_pool, DbContext};
    pub use crate::error::{DbError, DbResult};

    // Reactive queries
    pub use crate::reactive::{ReactiveQuery, DbResource, ReactiveQueryBuilder};

    // Transactions
    pub use crate::transaction::{
        TransactionHelper, with_transaction, Savepoint,
        BatchOperation, retry_transaction,
    };

    #[cfg(feature = "migrate")]
    pub use crate::migrate::{run_migrations, MigrationRunner};

    pub use sqlx::{FromRow, Row, query, query_as, query_scalar};

    #[cfg(feature = "postgres")]
    pub use sqlx::{Postgres, PgPool};

    #[cfg(feature = "mysql")]
    pub use sqlx::{MySql, MySqlPool};

    #[cfg(feature = "sqlite")]
    pub use sqlx::{Sqlite, SqlitePool};

    // Re-export PhilJS
    pub use philjs::prelude::*;
}

/// Helper macro for type-safe queries with PhilJS integration
#[macro_export]
macro_rules! db_query {
    ($pool:expr, $query:expr $(, $arg:expr)*) => {{
        sqlx::query($query)
            $(.bind($arg))*
            .fetch_all($pool)
            .await
    }};
}

/// Helper macro for type-safe query_as with PhilJS integration
#[macro_export]
macro_rules! db_query_as {
    ($type:ty, $pool:expr, $query:expr $(, $arg:expr)*) => {{
        sqlx::query_as::<_, $type>($query)
            $(.bind($arg))*
            .fetch_all($pool)
            .await
    }};
}

/// Helper macro for single row queries
#[macro_export]
macro_rules! db_query_one {
    ($type:ty, $pool:expr, $query:expr $(, $arg:expr)*) => {{
        sqlx::query_as::<_, $type>($query)
            $(.bind($arg))*
            .fetch_one($pool)
            .await
    }};
}

/// Helper macro for optional single row queries
#[macro_export]
macro_rules! db_query_optional {
    ($type:ty, $pool:expr, $query:expr $(, $arg:expr)*) => {{
        sqlx::query_as::<_, $type>($query)
            $(.bind($arg))*
            .fetch_optional($pool)
            .await
    }};
}

/// Helper macro for scalar queries
#[macro_export]
macro_rules! db_scalar {
    ($type:ty, $pool:expr, $query:expr $(, $arg:expr)*) => {{
        sqlx::query_scalar::<_, $type>($query)
            $(.bind($arg))*
            .fetch_one($pool)
            .await
    }};
}

/// Helper macro for execute (insert, update, delete)
#[macro_export]
macro_rules! db_execute {
    ($pool:expr, $query:expr $(, $arg:expr)*) => {{
        sqlx::query($query)
            $(.bind($arg))*
            .execute($pool)
            .await
    }};
}
