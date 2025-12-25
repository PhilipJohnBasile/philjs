//! Reactive query wrappers for PhilJS integration
//!
//! This module provides wrappers that integrate SQLx queries with PhilJS's
//! reactive system for automatic UI updates when data changes.

use crate::error::{DbError, DbResult};
use futures::Stream;
use sqlx::{Database, Executor, FromRow, Pool};
use std::marker::PhantomData;
use std::pin::Pin;
use std::task::{Context, Poll};

/// A reactive query that can be used with PhilJS resources
///
/// # Example
///
/// ```rust
/// use philjs_sqlx::reactive::ReactiveQuery;
///
/// let query = ReactiveQuery::new("SELECT * FROM users WHERE active = $1")
///     .bind(true);
///
/// // Use with PhilJS resources
/// let users = create_resource(
///     || (),
///     move |_| async move {
///         query.fetch_all(&pool).await
///     }
/// );
/// ```
pub struct ReactiveQuery<'q, DB: Database> {
    sql: &'q str,
    arguments: Vec<String>,
    _phantom: PhantomData<DB>,
}

impl<'q, DB: Database> ReactiveQuery<'q, DB> {
    /// Create a new reactive query
    pub fn new(sql: &'q str) -> Self {
        Self {
            sql,
            arguments: Vec::new(),
            _phantom: PhantomData,
        }
    }

    /// Bind a parameter to the query
    pub fn bind<T: ToString>(mut self, value: T) -> Self {
        self.arguments.push(value.to_string());
        self
    }

    /// Execute the query and return all results
    pub async fn fetch_all<'e, E, T>(&self, executor: E) -> DbResult<Vec<T>>
    where
        E: Executor<'e, Database = DB>,
        T: for<'r> FromRow<'r, DB::Row> + Send + Unpin,
    {
        let query = sqlx::query_as::<_, T>(self.sql);
        query
            .fetch_all(executor)
            .await
            .map_err(|e| DbError::Query(e.to_string()))
    }

    /// Execute the query and return one result
    pub async fn fetch_one<'e, E, T>(&self, executor: E) -> DbResult<T>
    where
        E: Executor<'e, Database = DB>,
        T: for<'r> FromRow<'r, DB::Row> + Send + Unpack,
    {
        let query = sqlx::query_as::<_, T>(self.sql);
        query
            .fetch_one(executor)
            .await
            .map_err(|e| DbError::Query(e.to_string()))
    }

    /// Execute the query and return an optional result
    pub async fn fetch_optional<'e, E, T>(&self, executor: E) -> DbResult<Option<T>>
    where
        E: Executor<'e, Database = DB>,
        T: for<'r> FromRow<'r, DB::Row> + Send + Unpin,
    {
        let query = sqlx::query_as::<_, T>(self.sql);
        query
            .fetch_optional(executor)
            .await
            .map_err(|e| DbError::Query(e.to_string()))
    }
}

/// Reactive resource for database queries
///
/// # Example
///
/// ```rust
/// use philjs_sqlx::reactive::DbResource;
///
/// #[derive(FromRow)]
/// struct User {
///     id: i64,
///     name: String,
/// }
///
/// // Create a reactive resource
/// let users = DbResource::new(&pool, "SELECT * FROM users");
///
/// // Use in PhilJS components
/// view! {
///     <For
///         each=move || users.get()
///         key=|user| user.id
///         children=|user| view! {
///             <div>{user.name}</div>
///         }
///     />
/// }
/// ```
pub struct DbResource<DB: Database, T> {
    pool: Pool<DB>,
    query: String,
    _phantom: PhantomData<T>,
}

impl<DB: Database, T> DbResource<DB, T>
where
    T: for<'r> FromRow<'r, DB::Row> + Send + Unpin + 'static,
{
    /// Create a new database resource
    pub fn new(pool: &Pool<DB>, query: impl Into<String>) -> Self {
        Self {
            pool: pool.clone(),
            query: query.into(),
            _phantom: PhantomData,
        }
    }

    /// Fetch all results
    pub async fn fetch(&self) -> DbResult<Vec<T>> {
        sqlx::query_as::<_, T>(&self.query)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| DbError::Query(e.to_string()))
    }

    /// Fetch one result
    pub async fn fetch_one(&self) -> DbResult<T> {
        sqlx::query_as::<_, T>(&self.query)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| DbError::Query(e.to_string()))
    }

    /// Fetch optional result
    pub async fn fetch_optional(&self) -> DbResult<Option<T>> {
        sqlx::query_as::<_, T>(&self.query)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| DbError::Query(e.to_string()))
    }

    /// Refetch the data
    pub async fn refetch(&self) -> DbResult<Vec<T>> {
        self.fetch().await
    }
}

impl<DB: Database, T> Clone for DbResource<DB, T> {
    fn clone(&self) -> Self {
        Self {
            pool: self.pool.clone(),
            query: self.query.clone(),
            _phantom: PhantomData,
        }
    }
}

/// Query builder with reactive capabilities
///
/// # Example
///
/// ```rust
/// use philjs_sqlx::reactive::ReactiveQueryBuilder;
///
/// let builder = ReactiveQueryBuilder::new("users")
///     .select(&["id", "name", "email"])
///     .where_clause("active = ?")
///     .order_by("name ASC")
///     .limit(10);
///
/// let users = builder.fetch_all(&pool).await?;
/// ```
pub struct ReactiveQueryBuilder {
    table: String,
    select: Vec<String>,
    where_clauses: Vec<String>,
    order_by: Option<String>,
    limit: Option<u32>,
    offset: Option<u32>,
}

impl ReactiveQueryBuilder {
    /// Create a new query builder
    pub fn new(table: impl Into<String>) -> Self {
        Self {
            table: table.into(),
            select: vec!["*".to_string()],
            where_clauses: Vec::new(),
            order_by: None,
            limit: None,
            offset: None,
        }
    }

    /// Set the columns to select
    pub fn select(mut self, columns: &[&str]) -> Self {
        self.select = columns.iter().map(|s| s.to_string()).collect();
        self
    }

    /// Add a WHERE clause
    pub fn where_clause(mut self, clause: impl Into<String>) -> Self {
        self.where_clauses.push(clause.into());
        self
    }

    /// Set ORDER BY clause
    pub fn order_by(mut self, order: impl Into<String>) -> Self {
        self.order_by = Some(order.into());
        self
    }

    /// Set LIMIT
    pub fn limit(mut self, limit: u32) -> Self {
        self.limit = Some(limit);
        self
    }

    /// Set OFFSET
    pub fn offset(mut self, offset: u32) -> Self {
        self.offset = Some(offset);
        self
    }

    /// Build the SQL query string
    pub fn build(&self) -> String {
        let mut sql = format!("SELECT {} FROM {}", self.select.join(", "), self.table);

        if !self.where_clauses.is_empty() {
            sql.push_str(&format!(" WHERE {}", self.where_clauses.join(" AND ")));
        }

        if let Some(ref order) = self.order_by {
            sql.push_str(&format!(" ORDER BY {}", order));
        }

        if let Some(limit) = self.limit {
            sql.push_str(&format!(" LIMIT {}", limit));
        }

        if let Some(offset) = self.offset {
            sql.push_str(&format!(" OFFSET {}", offset));
        }

        sql
    }

    /// Execute and fetch all results
    pub async fn fetch_all<'e, DB, E, T>(&self, executor: E) -> DbResult<Vec<T>>
    where
        DB: Database,
        E: Executor<'e, Database = DB>,
        T: for<'r> FromRow<'r, DB::Row> + Send + Unpin,
    {
        let sql = self.build();
        sqlx::query_as::<_, T>(&sql)
            .fetch_all(executor)
            .await
            .map_err(|e| DbError::Query(e.to_string()))
    }

    /// Execute and fetch one result
    pub async fn fetch_one<'e, DB, E, T>(&self, executor: E) -> DbResult<T>
    where
        DB: Database,
        E: Executor<'e, Database = DB>,
        T: for<'r> FromRow<'r, DB::Row> + Send + Unpin,
    {
        let sql = self.build();
        sqlx::query_as::<_, T>(&sql)
            .fetch_one(executor)
            .await
            .map_err(|e| DbError::Query(e.to_string()))
    }

    /// Execute and fetch optional result
    pub async fn fetch_optional<'e, DB, E, T>(&self, executor: E) -> DbResult<Option<T>>
    where
        DB: Database,
        E: Executor<'e, Database = DB>,
        T: for<'r> FromRow<'r, DB::Row> + Send + Unpin,
    {
        let sql = self.build();
        sqlx::query_as::<_, T>(&sql)
            .fetch_optional(executor)
            .await
            .map_err(|e| DbError::Query(e.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_query_builder() {
        let builder = ReactiveQueryBuilder::new("users")
            .select(&["id", "name"])
            .where_clause("active = true")
            .order_by("name ASC")
            .limit(10)
            .offset(5);

        let sql = builder.build();
        assert!(sql.contains("SELECT id, name"));
        assert!(sql.contains("FROM users"));
        assert!(sql.contains("WHERE active = true"));
        assert!(sql.contains("ORDER BY name ASC"));
        assert!(sql.contains("LIMIT 10"));
        assert!(sql.contains("OFFSET 5"));
    }

    #[test]
    fn test_query_builder_simple() {
        let builder = ReactiveQueryBuilder::new("posts");
        let sql = builder.build();
        assert_eq!(sql, "SELECT * FROM posts");
    }
}
