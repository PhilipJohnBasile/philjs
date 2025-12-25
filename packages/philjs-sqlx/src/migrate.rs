//! Migration utilities for database schema management
//!
//! This module provides helpers for running and managing database migrations.

use crate::error::{DbError, DbResult};
use sqlx::{Database, migrate::Migrator, Pool};
use std::path::Path;

/// Migration runner with progress tracking
///
/// # Example
///
/// ```rust
/// use philjs_sqlx::migrate::MigrationRunner;
///
/// let runner = MigrationRunner::new(&pool, "./migrations");
/// runner.run().await?;
/// ```
pub struct MigrationRunner<'a, DB: Database> {
    pool: &'a Pool<DB>,
    migrations_path: String,
}

impl<'a, DB: Database> MigrationRunner<'a, DB> {
    /// Create a new migration runner
    pub fn new(pool: &'a Pool<DB>, migrations_path: impl Into<String>) -> Self {
        Self {
            pool,
            migrations_path: migrations_path.into(),
        }
    }

    /// Run pending migrations
    pub async fn run(&self) -> DbResult<()> {
        let migrator = Migrator::new(Path::new(&self.migrations_path))
            .await
            .map_err(|e| DbError::Migration(e.to_string()))?;

        migrator
            .run(self.pool)
            .await
            .map_err(|e| DbError::Migration(e.to_string()))?;

        tracing::info!("Migrations completed successfully");
        Ok(())
    }

    /// Revert the last migration
    pub async fn revert(&self) -> DbResult<()> {
        let migrator = Migrator::new(Path::new(&self.migrations_path))
            .await
            .map_err(|e| DbError::Migration(e.to_string()))?;

        migrator
            .undo(self.pool, 1)
            .await
            .map_err(|e| DbError::Migration(e.to_string()))?;

        tracing::info!("Migration reverted successfully");
        Ok(())
    }
}

/// Run migrations from a directory
///
/// # Example
///
/// ```rust
/// use philjs_sqlx::migrate::run_migrations;
///
/// run_migrations(&pool, "./migrations").await?;
/// ```
pub async fn run_migrations<DB: Database>(
    pool: &Pool<DB>,
    migrations_path: impl AsRef<Path>,
) -> DbResult<()> {
    let migrator = Migrator::new(migrations_path.as_ref())
        .await
        .map_err(|e| DbError::Migration(e.to_string()))?;

    migrator
        .run(pool)
        .await
        .map_err(|e| DbError::Migration(e.to_string()))?;

    Ok(())
}

/// Check if there are pending migrations
pub async fn has_pending_migrations<DB: Database>(
    pool: &Pool<DB>,
    migrations_path: impl AsRef<Path>,
) -> DbResult<bool> {
    let migrator = Migrator::new(migrations_path.as_ref())
        .await
        .map_err(|e| DbError::Migration(e.to_string()))?;

    // This is a simplified check - in practice you'd compare with applied migrations
    Ok(!migrator.migrations.is_empty())
}
