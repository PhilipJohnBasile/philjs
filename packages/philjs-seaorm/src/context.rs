//! Context integration for PhilJS

use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::error::{OrmError, OrmResult};

/// Global database connection storage
static GLOBAL_DB: once_cell::sync::OnceCell<Arc<DatabaseConnection>> = once_cell::sync::OnceCell::new();

/// Provide a database connection to the application context
///
/// This makes the connection available to server functions via `use_db()`
///
/// # Example
///
/// ```rust
/// use philjs_seaorm::prelude::*;
///
/// async fn setup() -> OrmResult<()> {
///     let db = connect("postgres://localhost/mydb").await?;
///     provide_db(db);
///     Ok(())
/// }
/// ```
pub fn provide_db(db: DatabaseConnection) {
    let _ = GLOBAL_DB.set(Arc::new(db));
}

/// Get the database connection from context
///
/// # Example
///
/// ```rust
/// use philjs_seaorm::prelude::*;
///
/// #[server]
/// async fn get_users() -> Result<Vec<User>, ServerFnError> {
///     let db = use_db()?;
///     Users::find().all(&*db).await.map_err(Into::into)
/// }
/// ```
pub fn use_db() -> OrmResult<Arc<DatabaseConnection>> {
    GLOBAL_DB
        .get()
        .cloned()
        .ok_or_else(|| OrmError::Context("Database not provided. Call provide_db() first.".to_string()))
}

/// Database provider for dependency injection
#[derive(Clone)]
pub struct DbProvider {
    db: Arc<DatabaseConnection>,
}

impl DbProvider {
    /// Create a new database provider
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db: Arc::new(db) }
    }

    /// Get the database connection
    pub fn db(&self) -> &DatabaseConnection {
        &self.db
    }

    /// Get an Arc reference to the connection
    pub fn arc(&self) -> Arc<DatabaseConnection> {
        self.db.clone()
    }
}

/// Request-scoped database context
pub struct RequestDb {
    db: Arc<DatabaseConnection>,
    request_id: String,
}

impl RequestDb {
    /// Create a new request database context
    pub fn new(db: Arc<DatabaseConnection>, request_id: impl Into<String>) -> Self {
        Self {
            db,
            request_id: request_id.into(),
        }
    }

    /// Get the database connection
    pub fn db(&self) -> &DatabaseConnection {
        &self.db
    }

    /// Get the request ID
    pub fn request_id(&self) -> &str {
        &self.request_id
    }

    /// Begin a transaction
    pub async fn begin(&self) -> OrmResult<sea_orm::DatabaseTransaction> {
        self.db
            .begin()
            .await
            .map_err(|e| OrmError::Transaction(e.to_string()))
    }
}

impl Clone for RequestDb {
    fn clone(&self) -> Self {
        Self {
            db: self.db.clone(),
            request_id: self.request_id.clone(),
        }
    }
}

/// Multi-tenant database context
pub struct TenantDb {
    db: Arc<DatabaseConnection>,
    tenant_id: String,
    schema: Option<String>,
}

impl TenantDb {
    /// Create a new tenant database context
    pub fn new(db: Arc<DatabaseConnection>, tenant_id: impl Into<String>) -> Self {
        Self {
            db,
            tenant_id: tenant_id.into(),
            schema: None,
        }
    }

    /// Set the tenant schema
    pub fn with_schema(mut self, schema: impl Into<String>) -> Self {
        self.schema = Some(schema.into());
        self
    }

    /// Get the database connection
    pub fn db(&self) -> &DatabaseConnection {
        &self.db
    }

    /// Get the tenant ID
    pub fn tenant_id(&self) -> &str {
        &self.tenant_id
    }

    /// Get the schema
    pub fn schema(&self) -> Option<&str> {
        self.schema.as_deref()
    }

    /// Execute with tenant schema set
    pub async fn with_tenant<F, T>(&self, f: F) -> OrmResult<T>
    where
        F: std::future::Future<Output = OrmResult<T>>,
    {
        if let Some(ref schema) = self.schema {
            // Set search_path for PostgreSQL
            use sea_orm::{Statement, DbBackend};
            let sql = format!("SET search_path TO {}", schema);
            self.db
                .execute(Statement::from_string(DbBackend::Postgres, sql))
                .await
                .map_err(|e| OrmError::Query(e.to_string()))?;
        }

        f.await
    }
}

impl Clone for TenantDb {
    fn clone(&self) -> Self {
        Self {
            db: self.db.clone(),
            tenant_id: self.tenant_id.clone(),
            schema: self.schema.clone(),
        }
    }
}

/// Read replica support
pub struct ReplicaDb {
    primary: Arc<DatabaseConnection>,
    replicas: Vec<Arc<DatabaseConnection>>,
    current_replica: std::sync::atomic::AtomicUsize,
}

impl ReplicaDb {
    /// Create a new replica database setup
    pub fn new(primary: DatabaseConnection) -> Self {
        Self {
            primary: Arc::new(primary),
            replicas: Vec::new(),
            current_replica: std::sync::atomic::AtomicUsize::new(0),
        }
    }

    /// Add a read replica
    pub fn add_replica(mut self, replica: DatabaseConnection) -> Self {
        self.replicas.push(Arc::new(replica));
        self
    }

    /// Get the primary connection (for writes)
    pub fn primary(&self) -> &DatabaseConnection {
        &self.primary
    }

    /// Get a replica connection (for reads) using round-robin
    pub fn replica(&self) -> &DatabaseConnection {
        if self.replicas.is_empty() {
            return &self.primary;
        }

        let idx = self.current_replica.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        let replica_idx = idx % self.replicas.len();
        &self.replicas[replica_idx]
    }

    /// Get the number of replicas
    pub fn replica_count(&self) -> usize {
        self.replicas.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tenant_db() {
        // Compile-time test
        fn _test(db: Arc<DatabaseConnection>) {
            let tenant = TenantDb::new(db, "tenant-123")
                .with_schema("tenant_123");

            assert_eq!(tenant.tenant_id(), "tenant-123");
            assert_eq!(tenant.schema(), Some("tenant_123"));
        }
    }

    #[test]
    fn test_db_provider() {
        // This would need a real connection to test
        // Just verify the API compiles
    }
}
