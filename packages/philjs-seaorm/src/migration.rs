//! Database migration support

use sea_orm::{DatabaseConnection, DbBackend, Statement};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

use crate::error::{OrmError, OrmResult};

/// Migration status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationStatus {
    /// Migration name
    pub name: String,
    /// Applied at timestamp
    pub applied_at: Option<String>,
    /// Is pending
    pub pending: bool,
}

/// Database migrator
pub struct Migrator {
    /// Migrations directory
    migrations_dir: PathBuf,
    /// Table name for tracking migrations
    table_name: String,
    /// Registered migrations
    migrations: Vec<Migration>,
}

/// Single migration
pub struct Migration {
    /// Migration name
    pub name: String,
    /// Up SQL
    pub up: String,
    /// Down SQL
    pub down: Option<String>,
}

impl Migration {
    /// Create a new migration
    pub fn new(name: impl Into<String>, up: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            up: up.into(),
            down: None,
        }
    }

    /// Add down migration
    pub fn with_down(mut self, down: impl Into<String>) -> Self {
        self.down = Some(down.into());
        self
    }
}

impl Default for Migrator {
    fn default() -> Self {
        Self {
            migrations_dir: PathBuf::from("migrations"),
            table_name: "_philjs_migrations".to_string(),
            migrations: Vec::new(),
        }
    }
}

impl Migrator {
    /// Create a new migrator
    pub fn new() -> Self {
        Self::default()
    }

    /// Set migrations directory
    pub fn migrations_dir(mut self, dir: impl Into<PathBuf>) -> Self {
        self.migrations_dir = dir.into();
        self
    }

    /// Set migration table name
    pub fn table_name(mut self, name: impl Into<String>) -> Self {
        self.table_name = name.into();
        self
    }

    /// Add a migration
    pub fn add_migration(mut self, migration: Migration) -> Self {
        self.migrations.push(migration);
        self
    }

    /// Ensure migrations table exists
    async fn ensure_migrations_table(&self, db: &DatabaseConnection) -> OrmResult<()> {
        let sql = format!(
            r#"
            CREATE TABLE IF NOT EXISTS {} (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            "#,
            self.table_name
        );

        db.execute(Statement::from_string(DbBackend::Postgres, sql))
            .await
            .map_err(|e| OrmError::Migration(e.to_string()))?;

        Ok(())
    }

    /// Get applied migrations
    async fn get_applied(&self, db: &DatabaseConnection) -> OrmResult<Vec<String>> {
        let sql = format!(
            "SELECT name FROM {} ORDER BY id",
            self.table_name
        );

        let rows = db
            .query_all(Statement::from_string(DbBackend::Postgres, sql))
            .await
            .map_err(|e| OrmError::Migration(e.to_string()))?;

        let mut names = Vec::new();
        for row in rows {
            if let Ok(name) = row.try_get::<String>("", "name") {
                names.push(name);
            }
        }

        Ok(names)
    }

    /// Mark migration as applied
    async fn mark_applied(&self, db: &DatabaseConnection, name: &str) -> OrmResult<()> {
        let sql = format!(
            "INSERT INTO {} (name) VALUES ($1)",
            self.table_name
        );

        db.execute(Statement::from_sql_and_values(
            DbBackend::Postgres,
            sql,
            [name.into()],
        ))
        .await
        .map_err(|e| OrmError::Migration(e.to_string()))?;

        Ok(())
    }

    /// Remove migration from applied
    async fn mark_unapplied(&self, db: &DatabaseConnection, name: &str) -> OrmResult<()> {
        let sql = format!(
            "DELETE FROM {} WHERE name = $1",
            self.table_name
        );

        db.execute(Statement::from_sql_and_values(
            DbBackend::Postgres,
            sql,
            [name.into()],
        ))
        .await
        .map_err(|e| OrmError::Migration(e.to_string()))?;

        Ok(())
    }

    /// Get migration status
    pub async fn status(&self, db: &DatabaseConnection) -> OrmResult<Vec<MigrationStatus>> {
        self.ensure_migrations_table(db).await?;
        let applied = self.get_applied(db).await?;

        let mut status = Vec::new();
        for migration in &self.migrations {
            let is_applied = applied.contains(&migration.name);
            status.push(MigrationStatus {
                name: migration.name.clone(),
                applied_at: if is_applied {
                    Some("Applied".to_string())
                } else {
                    None
                },
                pending: !is_applied,
            });
        }

        Ok(status)
    }

    /// Get pending migrations
    pub async fn pending(&self, db: &DatabaseConnection) -> OrmResult<Vec<&Migration>> {
        self.ensure_migrations_table(db).await?;
        let applied = self.get_applied(db).await?;

        Ok(self
            .migrations
            .iter()
            .filter(|m| !applied.contains(&m.name))
            .collect())
    }

    /// Run all pending migrations
    pub async fn up(&self, db: &DatabaseConnection) -> OrmResult<Vec<String>> {
        self.ensure_migrations_table(db).await?;
        let pending = self.pending(db).await?;

        let mut applied = Vec::new();
        for migration in pending {
            tracing::info!(name = %migration.name, "Running migration");

            db.execute(Statement::from_string(DbBackend::Postgres, migration.up.clone()))
                .await
                .map_err(|e| OrmError::Migration(format!(
                    "Migration '{}' failed: {}",
                    migration.name, e
                )))?;

            self.mark_applied(db, &migration.name).await?;
            applied.push(migration.name.clone());

            tracing::info!(name = %migration.name, "Migration completed");
        }

        Ok(applied)
    }

    /// Rollback the last migration
    pub async fn down(&self, db: &DatabaseConnection) -> OrmResult<Option<String>> {
        self.ensure_migrations_table(db).await?;
        let applied = self.get_applied(db).await?;

        if let Some(last_applied) = applied.last() {
            let migration = self
                .migrations
                .iter()
                .find(|m| &m.name == last_applied)
                .ok_or_else(|| OrmError::Migration(format!(
                    "Migration '{}' not found",
                    last_applied
                )))?;

            if let Some(ref down_sql) = migration.down {
                tracing::info!(name = %migration.name, "Rolling back migration");

                db.execute(Statement::from_string(DbBackend::Postgres, down_sql.clone()))
                    .await
                    .map_err(|e| OrmError::Migration(format!(
                        "Rollback of '{}' failed: {}",
                        migration.name, e
                    )))?;

                self.mark_unapplied(db, &migration.name).await?;

                tracing::info!(name = %migration.name, "Rollback completed");

                return Ok(Some(migration.name.clone()));
            } else {
                return Err(OrmError::Migration(format!(
                    "Migration '{}' has no down migration",
                    migration.name
                )));
            }
        }

        Ok(None)
    }

    /// Rollback all migrations
    pub async fn reset(&self, db: &DatabaseConnection) -> OrmResult<Vec<String>> {
        let mut rolled_back = Vec::new();

        while let Some(name) = self.down(db).await? {
            rolled_back.push(name);
        }

        Ok(rolled_back)
    }

    /// Reset and re-run all migrations
    pub async fn fresh(&self, db: &DatabaseConnection) -> OrmResult<Vec<String>> {
        self.reset(db).await?;
        self.up(db).await
    }
}

/// Migration builder for creating migrations programmatically
pub struct MigrationBuilder {
    name: String,
    up_statements: Vec<String>,
    down_statements: Vec<String>,
}

impl MigrationBuilder {
    /// Create a new migration builder
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            up_statements: Vec::new(),
            down_statements: Vec::new(),
        }
    }

    /// Add CREATE TABLE statement
    pub fn create_table(mut self, table: &str, columns: &[(&str, &str)]) -> Self {
        let cols: Vec<String> = columns
            .iter()
            .map(|(name, type_)| format!("{} {}", name, type_))
            .collect();

        self.up_statements.push(format!(
            "CREATE TABLE {} ({})",
            table,
            cols.join(", ")
        ));

        self.down_statements.insert(0, format!("DROP TABLE IF EXISTS {}", table));

        self
    }

    /// Add CREATE INDEX statement
    pub fn create_index(mut self, index: &str, table: &str, columns: &[&str]) -> Self {
        self.up_statements.push(format!(
            "CREATE INDEX {} ON {} ({})",
            index,
            table,
            columns.join(", ")
        ));

        self.down_statements.insert(0, format!("DROP INDEX IF EXISTS {}", index));

        self
    }

    /// Add ALTER TABLE ADD COLUMN statement
    pub fn add_column(mut self, table: &str, column: &str, type_: &str) -> Self {
        self.up_statements.push(format!(
            "ALTER TABLE {} ADD COLUMN {} {}",
            table, column, type_
        ));

        self.down_statements.insert(0, format!(
            "ALTER TABLE {} DROP COLUMN IF EXISTS {}",
            table, column
        ));

        self
    }

    /// Add raw SQL statement
    pub fn raw(mut self, up: &str, down: &str) -> Self {
        self.up_statements.push(up.to_string());
        self.down_statements.insert(0, down.to_string());
        self
    }

    /// Build the migration
    pub fn build(self) -> Migration {
        Migration {
            name: self.name,
            up: self.up_statements.join(";\n"),
            down: if self.down_statements.is_empty() {
                None
            } else {
                Some(self.down_statements.join(";\n"))
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_migration_builder() {
        let migration = MigrationBuilder::new("001_create_users")
            .create_table("users", &[
                ("id", "SERIAL PRIMARY KEY"),
                ("name", "VARCHAR(255) NOT NULL"),
                ("email", "VARCHAR(255) UNIQUE NOT NULL"),
            ])
            .create_index("idx_users_email", "users", &["email"])
            .build();

        assert_eq!(migration.name, "001_create_users");
        assert!(migration.up.contains("CREATE TABLE users"));
        assert!(migration.up.contains("CREATE INDEX idx_users_email"));
        assert!(migration.down.is_some());
    }

    #[test]
    fn test_migration() {
        let migration = Migration::new(
            "test_migration",
            "CREATE TABLE test (id INT PRIMARY KEY)"
        ).with_down("DROP TABLE test");

        assert_eq!(migration.name, "test_migration");
        assert!(migration.down.is_some());
    }
}
