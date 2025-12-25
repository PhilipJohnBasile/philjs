//! Context integration for PhilJS

use sqlx::Database;
use std::sync::Arc;
use parking_lot::RwLock;

use crate::pool::DbPool;
use crate::error::{DbError, DbResult};

/// Database context for PhilJS applications
pub struct DbContext<DB: Database> {
    pool: DbPool<DB>,
}

impl<DB: Database> DbContext<DB> {
    /// Create a new database context
    pub fn new(pool: DbPool<DB>) -> Self {
        Self { pool }
    }

    /// Get a reference to the pool
    pub fn pool(&self) -> &DbPool<DB> {
        &self.pool
    }
}

impl<DB: Database> Clone for DbContext<DB> {
    fn clone(&self) -> Self {
        Self {
            pool: self.pool.clone(),
        }
    }
}

/// Global pool storage (for server functions)
static GLOBAL_POOL: once_cell::sync::OnceCell<Arc<dyn std::any::Any + Send + Sync>> = once_cell::sync::OnceCell::new();

/// Provide a database pool to the application context
///
/// This makes the pool available to server functions via `use_pool()`
///
/// # Example
///
/// ```rust
/// use philjs_sqlx::prelude::*;
///
/// async fn setup() -> DbResult<()> {
///     let pool = create_pool(&PoolConfig::new("postgres://localhost/db")).await?;
///     provide_pool(pool);
///     Ok(())
/// }
/// ```
#[cfg(feature = "postgres")]
pub fn provide_pool(pool: DbPool<sqlx::Postgres>) {
    let _ = GLOBAL_POOL.set(Arc::new(pool));
}

/// Get the database pool from context
///
/// # Example
///
/// ```rust
/// use philjs_sqlx::prelude::*;
///
/// #[server]
/// async fn get_users() -> Result<Vec<User>, ServerFnError> {
///     let pool = use_pool()?;
///     // Use pool...
/// }
/// ```
#[cfg(feature = "postgres")]
pub fn use_pool() -> DbResult<DbPool<sqlx::Postgres>> {
    GLOBAL_POOL
        .get()
        .and_then(|p| p.downcast_ref::<DbPool<sqlx::Postgres>>().cloned())
        .ok_or_else(|| DbError::Context("Database pool not provided. Call provide_pool() first.".to_string()))
}

/// Database context provider for reactive applications
pub struct DbProvider<DB: Database> {
    pool: Arc<DbPool<DB>>,
}

impl<DB: Database> DbProvider<DB> {
    /// Create a new database provider
    pub fn new(pool: DbPool<DB>) -> Self {
        Self {
            pool: Arc::new(pool),
        }
    }

    /// Get the pool
    pub fn pool(&self) -> &DbPool<DB> {
        &self.pool
    }
}

impl<DB: Database> Clone for DbProvider<DB> {
    fn clone(&self) -> Self {
        Self {
            pool: self.pool.clone(),
        }
    }
}

/// Transaction context for managing database transactions
pub struct TransactionContext<'c, DB: Database> {
    tx: Option<sqlx::Transaction<'c, DB>>,
}

impl<'c, DB: Database> TransactionContext<'c, DB> {
    /// Create a new transaction context
    pub fn new(tx: sqlx::Transaction<'c, DB>) -> Self {
        Self { tx: Some(tx) }
    }

    /// Get a mutable reference to the transaction
    pub fn tx(&mut self) -> Option<&mut sqlx::Transaction<'c, DB>> {
        self.tx.as_mut()
    }

    /// Take the transaction (for committing)
    pub fn take(&mut self) -> Option<sqlx::Transaction<'c, DB>> {
        self.tx.take()
    }

    /// Commit the transaction
    pub async fn commit(mut self) -> DbResult<()> {
        if let Some(tx) = self.tx.take() {
            tx.commit().await.map_err(|e| DbError::Transaction(e.to_string()))?;
        }
        Ok(())
    }

    /// Rollback the transaction
    pub async fn rollback(mut self) -> DbResult<()> {
        if let Some(tx) = self.tx.take() {
            tx.rollback().await.map_err(|e| DbError::Transaction(e.to_string()))?;
        }
        Ok(())
    }
}

/// Request-scoped database connection
pub struct RequestDb<DB: Database> {
    pool: DbPool<DB>,
    request_id: String,
}

impl<DB: Database> RequestDb<DB> {
    /// Create a new request-scoped database
    pub fn new(pool: DbPool<DB>, request_id: impl Into<String>) -> Self {
        Self {
            pool,
            request_id: request_id.into(),
        }
    }

    /// Get the pool
    pub fn pool(&self) -> &DbPool<DB> {
        &self.pool
    }

    /// Get the request ID
    pub fn request_id(&self) -> &str {
        &self.request_id
    }

    /// Begin a transaction
    pub async fn begin(&self) -> DbResult<sqlx::Transaction<'_, DB>> {
        self.pool
            .begin()
            .await
            .map_err(|e| DbError::Transaction(e.to_string()))
    }
}

impl<DB: Database> Clone for RequestDb<DB> {
    fn clone(&self) -> Self {
        Self {
            pool: self.pool.clone(),
            request_id: self.request_id.clone(),
        }
    }
}

/// Multi-tenant database context
pub struct TenantDb<DB: Database> {
    pool: DbPool<DB>,
    tenant_id: String,
    schema: Option<String>,
}

impl<DB: Database> TenantDb<DB> {
    /// Create a new tenant database context
    pub fn new(pool: DbPool<DB>, tenant_id: impl Into<String>) -> Self {
        Self {
            pool,
            tenant_id: tenant_id.into(),
            schema: None,
        }
    }

    /// Set the tenant schema
    pub fn with_schema(mut self, schema: impl Into<String>) -> Self {
        self.schema = Some(schema.into());
        self
    }

    /// Get the pool
    pub fn pool(&self) -> &DbPool<DB> {
        &self.pool
    }

    /// Get the tenant ID
    pub fn tenant_id(&self) -> &str {
        &self.tenant_id
    }

    /// Get the schema
    pub fn schema(&self) -> Option<&str> {
        self.schema.as_deref()
    }
}

impl<DB: Database> Clone for TenantDb<DB> {
    fn clone(&self) -> Self {
        Self {
            pool: self.pool.clone(),
            tenant_id: self.tenant_id.clone(),
            schema: self.schema.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tenant_db() {
        // This is a compile-time test
        fn _test<DB: Database>(pool: DbPool<DB>) {
            let tenant = TenantDb::new(pool, "tenant-123")
                .with_schema("tenant_123");

            assert_eq!(tenant.tenant_id(), "tenant-123");
            assert_eq!(tenant.schema(), Some("tenant_123"));
        }
    }
}
