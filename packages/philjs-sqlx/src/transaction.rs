//! Transaction helpers for safe database operations
//!
//! This module provides ergonomic wrappers around SQLx transactions
//! with automatic rollback on error.

use crate::error::{DbError, DbResult};
use sqlx::{Database, Pool, Transaction};
use std::future::Future;

/// Transaction helper that automatically commits or rolls back
///
/// # Example
///
/// ```rust
/// use philjs_sqlx::transaction::TransactionHelper;
///
/// let result = TransactionHelper::new(&pool)
///     .run(|tx| async move {
///         sqlx::query("INSERT INTO users (name) VALUES ($1)")
///             .bind("John")
///             .execute(&mut *tx)
///             .await?;
///
///         sqlx::query("INSERT INTO profiles (user_id) VALUES ($1)")
///             .bind(1)
///             .execute(&mut *tx)
///             .await?;
///
///         Ok(())
///     })
///     .await?;
/// ```
pub struct TransactionHelper<'a, DB: Database> {
    pool: &'a Pool<DB>,
}

impl<'a, DB: Database> TransactionHelper<'a, DB> {
    /// Create a new transaction helper
    pub fn new(pool: &'a Pool<DB>) -> Self {
        Self { pool }
    }

    /// Run a transaction with automatic commit/rollback
    pub async fn run<F, T, Fut>(&self, f: F) -> DbResult<T>
    where
        F: FnOnce(&mut Transaction<'_, DB>) -> Fut,
        Fut: Future<Output = DbResult<T>>,
    {
        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| DbError::Transaction(e.to_string()))?;

        match f(&mut tx).await {
            Ok(result) => {
                tx.commit()
                    .await
                    .map_err(|e| DbError::Transaction(e.to_string()))?;
                Ok(result)
            }
            Err(e) => {
                tx.rollback()
                    .await
                    .map_err(|e| DbError::Transaction(e.to_string()))?;
                Err(e)
            }
        }
    }
}

/// Run a transaction with automatic commit/rollback
///
/// This is a convenience function for simple transactions.
///
/// # Example
///
/// ```rust
/// use philjs_sqlx::transaction::with_transaction;
///
/// with_transaction(&pool, |tx| async move {
///     sqlx::query("UPDATE users SET active = true WHERE id = $1")
///         .bind(user_id)
///         .execute(&mut *tx)
///         .await?;
///
///     Ok(())
/// }).await?;
/// ```
pub async fn with_transaction<DB, F, T, Fut>(pool: &Pool<DB>, f: F) -> DbResult<T>
where
    DB: Database,
    F: FnOnce(&mut Transaction<'_, DB>) -> Fut,
    Fut: Future<Output = DbResult<T>>,
{
    TransactionHelper::new(pool).run(f).await
}

/// Savepoint helper for nested transactions
///
/// # Example
///
/// ```rust
/// use philjs_sqlx::transaction::Savepoint;
///
/// with_transaction(&pool, |tx| async move {
///     // Main transaction work
///     sqlx::query("INSERT INTO users (name) VALUES ($1)")
///         .bind("John")
///         .execute(&mut *tx)
///         .await?;
///
///     // Create a savepoint for risky operation
///     let sp = Savepoint::new(tx, "user_profile").await?;
///     match sqlx::query("INSERT INTO profiles (user_id) VALUES ($1)")
///         .bind(1)
///         .execute(&mut *sp.transaction())
///         .await
///     {
///         Ok(_) => sp.release().await?,
///         Err(_) => sp.rollback().await?,
///     }
///
///     Ok(())
/// }).await?;
/// ```
pub struct Savepoint<'a, DB: Database> {
    tx: &'a mut Transaction<'static, DB>,
    name: String,
    released: bool,
}

impl<'a, DB: Database> Savepoint<'a, DB> {
    /// Create a new savepoint
    pub async fn new(tx: &'a mut Transaction<'static, DB>, name: impl Into<String>) -> DbResult<Self> {
        let name = name.into();
        sqlx::query(&format!("SAVEPOINT {}", name))
            .execute(&mut **tx)
            .await
            .map_err(|e| DbError::Transaction(e.to_string()))?;

        Ok(Self {
            tx,
            name,
            released: false,
        })
    }

    /// Get access to the transaction
    pub fn transaction(&mut self) -> &mut Transaction<'static, DB> {
        self.tx
    }

    /// Release the savepoint (commit)
    pub async fn release(mut self) -> DbResult<()> {
        sqlx::query(&format!("RELEASE SAVEPOINT {}", self.name))
            .execute(&mut **self.tx)
            .await
            .map_err(|e| DbError::Transaction(e.to_string()))?;

        self.released = true;
        Ok(())
    }

    /// Rollback to the savepoint
    pub async fn rollback(mut self) -> DbResult<()> {
        sqlx::query(&format!("ROLLBACK TO SAVEPOINT {}", self.name))
            .execute(&mut **self.tx)
            .await
            .map_err(|e| DbError::Transaction(e.to_string()))?;

        self.released = true;
        Ok(())
    }
}

impl<'a, DB: Database> Drop for Savepoint<'a, DB> {
    fn drop(&mut self) {
        if !self.released {
            // Log warning that savepoint was not explicitly released or rolled back
            tracing::warn!("Savepoint '{}' was dropped without explicit release or rollback", self.name);
        }
    }
}

/// Batch operation helper
///
/// # Example
///
/// ```rust
/// use philjs_sqlx::transaction::BatchOperation;
///
/// let users = vec![
///     ("Alice", "alice@example.com"),
///     ("Bob", "bob@example.com"),
///     ("Carol", "carol@example.com"),
/// ];
///
/// BatchOperation::new(&pool)
///     .batch_size(100)
///     .execute(users, |tx, (name, email)| async move {
///         sqlx::query("INSERT INTO users (name, email) VALUES ($1, $2)")
///             .bind(name)
///             .bind(email)
///             .execute(&mut *tx)
///             .await?;
///         Ok(())
///     })
///     .await?;
/// ```
pub struct BatchOperation<'a, DB: Database> {
    pool: &'a Pool<DB>,
    batch_size: usize,
}

impl<'a, DB: Database> BatchOperation<'a, DB> {
    /// Create a new batch operation
    pub fn new(pool: &'a Pool<DB>) -> Self {
        Self {
            pool,
            batch_size: 1000,
        }
    }

    /// Set the batch size (number of items per transaction)
    pub fn batch_size(mut self, size: usize) -> Self {
        self.batch_size = size;
        self
    }

    /// Execute the batch operation
    pub async fn execute<T, F, Fut>(self, items: Vec<T>, f: F) -> DbResult<()>
    where
        T: Send,
        F: Fn(&mut Transaction<'_, DB>, T) -> Fut + Send + Sync,
        Fut: Future<Output = DbResult<()>> + Send,
    {
        for chunk in items.chunks(self.batch_size) {
            with_transaction(self.pool, |tx| async {
                for item in chunk {
                    f(tx, item).await?;
                }
                Ok(())
            })
            .await?;
        }

        Ok(())
    }
}

/// Retry helper for transient transaction errors
///
/// # Example
///
/// ```rust
/// use philjs_sqlx::transaction::retry_transaction;
///
/// retry_transaction(&pool, 3, |tx| async move {
///     sqlx::query("UPDATE counters SET value = value + 1 WHERE id = $1")
///         .bind(1)
///         .execute(&mut *tx)
///         .await?;
///     Ok(())
/// }).await?;
/// ```
pub async fn retry_transaction<DB, F, T, Fut>(
    pool: &Pool<DB>,
    max_retries: u32,
    f: F,
) -> DbResult<T>
where
    DB: Database,
    F: Fn(&mut Transaction<'_, DB>) -> Fut,
    Fut: Future<Output = DbResult<T>>,
{
    let mut retries = 0;

    loop {
        match with_transaction(pool, &f).await {
            Ok(result) => return Ok(result),
            Err(e) if retries < max_retries => {
                retries += 1;
                tracing::warn!("Transaction failed, retrying ({}/{}): {}", retries, max_retries, e);
                tokio::time::sleep(tokio::time::Duration::from_millis(100 * retries as u64)).await;
            }
            Err(e) => return Err(e),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_batch_operation_creation() {
        // This is a placeholder test since we can't easily test with a real database
        // In a real scenario, you would use sqlx::test with a test database
    }
}
