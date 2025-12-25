//! # PhilJS SeaORM Integration
//!
//! Entity-based database queries with active record pattern for PhilJS.
//!
//! ## Features
//!
//! - **Entity-based Queries**: Type-safe ORM with active record pattern
//! - **PhilJS Resources**: Seamless integration with reactive resources
//! - **Migrations**: Database schema management
//! - **Transactions**: Safe transaction handling
//! - **Relations**: Eager loading and lazy loading support
//!
//! ## Quick Start
//!
//! ```rust
//! use philjs_seaorm::prelude::*;
//!
//! // Entity definition
//! #[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
//! #[sea_orm(table_name = "users")]
//! pub struct Model {
//!     #[sea_orm(primary_key)]
//!     pub id: i64,
//!     pub name: String,
//!     pub email: String,
//!     pub active: bool,
//! }
//!
//! // Query users
//! let users = Users::find()
//!     .filter(users::Column::Active.eq(true))
//!     .all(&db)
//!     .await?;
//!
//! // With PhilJS resources
//! let users = create_resource(
//!     || (),
//!     |_| async {
//!         Users::find().all(&db).await
//!     }
//! );
//! ```

#![warn(missing_docs)]

pub mod entity;
pub mod query;
pub mod migration;
pub mod context;
pub mod error;
pub mod reactive;
pub mod hooks;
pub mod pagination;

// Re-exports
pub use entity::{EntityHelpers, Pagination, SortOrder};
pub use query::{QueryHelpers, FilterBuilder, RelationLoader};
pub use migration::{Migrator, MigrationStatus};
pub use context::{provide_db, use_db, DbProvider};
pub use error::{OrmError, OrmResult};

// Re-export sea-orm types
pub use sea_orm::{
    entity::*, query::*, ActiveModelTrait, ActiveValue,
    ColumnTrait, EntityTrait, ModelTrait, PrimaryKeyTrait,
    DatabaseConnection, DatabaseTransaction, ConnectOptions,
    ConnectionTrait, TransactionTrait, Statement,
    DbErr, DbBackend, ExecResult,
    FromQueryResult, IntoActiveModel, TryIntoModel,
    Related, RelationDef, RelationTrait,
    Condition, Order, Value,
};

pub use sea_query::{Expr, Func, SimpleExpr};

/// Prelude - import commonly used items
pub mod prelude {
    pub use crate::entity::{EntityHelpers, Pagination, SortOrder};
    pub use crate::query::{QueryHelpers, FilterBuilder, RelationLoader};
    pub use crate::context::{provide_db, use_db, DbProvider};
    pub use crate::error::{OrmError, OrmResult};

    // Reactive queries
    pub use crate::reactive::{ReactiveEntity, ReactiveQueryBuilder, EntityResource};

    // Hooks
    pub use crate::hooks::{HookedEntity, BeforeHook, AfterHook, ValidationHook, LoggingHook};

    // Pagination
    pub use crate::pagination::{
        Paginator, PaginationParams, PaginationMeta, PaginatedResult,
        CursorPaginator, CursorParams, CursorResult, PaginateExt,
    };

    pub use sea_orm::{
        entity::*, query::*, ActiveModelTrait, ActiveValue,
        ColumnTrait, EntityTrait, ModelTrait, Set,
        DatabaseConnection, DatabaseTransaction,
        ConnectionTrait, TransactionTrait,
        FromQueryResult, IntoActiveModel,
        Related, RelationDef, RelationTrait,
        Condition, Order,
    };

    pub use sea_orm::entity::prelude::*;

    // Re-export PhilJS
    pub use philjs::prelude::*;
}

/// Create a database connection with default options
pub async fn connect(url: &str) -> OrmResult<DatabaseConnection> {
    let opts = ConnectOptions::new(url)
        .max_connections(10)
        .min_connections(1)
        .connect_timeout(std::time::Duration::from_secs(30))
        .idle_timeout(std::time::Duration::from_secs(600))
        .sqlx_logging(true)
        .to_owned();

    sea_orm::Database::connect(opts)
        .await
        .map_err(|e| OrmError::Connection(e.to_string()))
}

/// Create a database connection with custom options
pub async fn connect_with_options(opts: ConnectOptions) -> OrmResult<DatabaseConnection> {
    sea_orm::Database::connect(opts)
        .await
        .map_err(|e| OrmError::Connection(e.to_string()))
}

/// Connection options builder
pub struct ConnectionBuilder {
    url: String,
    max_connections: u32,
    min_connections: u32,
    connect_timeout_secs: u64,
    idle_timeout_secs: u64,
    sqlx_logging: bool,
}

impl ConnectionBuilder {
    /// Create a new connection builder
    pub fn new(url: impl Into<String>) -> Self {
        Self {
            url: url.into(),
            max_connections: 10,
            min_connections: 1,
            connect_timeout_secs: 30,
            idle_timeout_secs: 600,
            sqlx_logging: true,
        }
    }

    /// Set max connections
    pub fn max_connections(mut self, max: u32) -> Self {
        self.max_connections = max;
        self
    }

    /// Set min connections
    pub fn min_connections(mut self, min: u32) -> Self {
        self.min_connections = min;
        self
    }

    /// Set connect timeout
    pub fn connect_timeout_secs(mut self, secs: u64) -> Self {
        self.connect_timeout_secs = secs;
        self
    }

    /// Set idle timeout
    pub fn idle_timeout_secs(mut self, secs: u64) -> Self {
        self.idle_timeout_secs = secs;
        self
    }

    /// Enable/disable SQLx logging
    pub fn sqlx_logging(mut self, enabled: bool) -> Self {
        self.sqlx_logging = enabled;
        self
    }

    /// Build connection options
    pub fn build_options(&self) -> ConnectOptions {
        ConnectOptions::new(&self.url)
            .max_connections(self.max_connections)
            .min_connections(self.min_connections)
            .connect_timeout(std::time::Duration::from_secs(self.connect_timeout_secs))
            .idle_timeout(std::time::Duration::from_secs(self.idle_timeout_secs))
            .sqlx_logging(self.sqlx_logging)
            .to_owned()
    }

    /// Connect to the database
    pub async fn connect(self) -> OrmResult<DatabaseConnection> {
        connect_with_options(self.build_options()).await
    }
}
