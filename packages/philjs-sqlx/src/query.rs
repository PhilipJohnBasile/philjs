//! Query builder and execution utilities

use sqlx::{Database, Encode, Type};
use std::marker::PhantomData;

/// Query wrapper for PhilJS integration
pub struct Query<'q, DB: Database> {
    sql: String,
    _phantom: PhantomData<&'q DB>,
}

impl<'q, DB: Database> Query<'q, DB> {
    /// Create a new query
    pub fn new(sql: impl Into<String>) -> Self {
        Self {
            sql: sql.into(),
            _phantom: PhantomData,
        }
    }

    /// Get the SQL string
    pub fn sql(&self) -> &str {
        &self.sql
    }
}

/// Query builder for constructing dynamic queries
pub struct QueryBuilder<DB: Database> {
    /// SQL parts
    parts: Vec<String>,
    /// WHERE conditions
    conditions: Vec<String>,
    /// ORDER BY clauses
    order_by: Vec<String>,
    /// LIMIT value
    limit: Option<i64>,
    /// OFFSET value
    offset: Option<i64>,
    /// Table name
    table: Option<String>,
    /// SELECT columns
    select_columns: Vec<String>,
    /// JOIN clauses
    joins: Vec<String>,
    /// GROUP BY columns
    group_by: Vec<String>,
    /// HAVING conditions
    having: Vec<String>,
    _phantom: PhantomData<DB>,
}

impl<DB: Database> Default for QueryBuilder<DB> {
    fn default() -> Self {
        Self::new()
    }
}

impl<DB: Database> QueryBuilder<DB> {
    /// Create a new query builder
    pub fn new() -> Self {
        Self {
            parts: Vec::new(),
            conditions: Vec::new(),
            order_by: Vec::new(),
            limit: None,
            offset: None,
            table: None,
            select_columns: Vec::new(),
            joins: Vec::new(),
            group_by: Vec::new(),
            having: Vec::new(),
            _phantom: PhantomData,
        }
    }

    /// Start a SELECT query
    pub fn select(mut self, columns: &[&str]) -> Self {
        self.select_columns = columns.iter().map(|s| s.to_string()).collect();
        self
    }

    /// Select all columns
    pub fn select_all(self) -> Self {
        self.select(&["*"])
    }

    /// Set the FROM table
    pub fn from(mut self, table: &str) -> Self {
        self.table = Some(table.to_string());
        self
    }

    /// Add a WHERE condition
    pub fn where_clause(mut self, condition: &str) -> Self {
        self.conditions.push(condition.to_string());
        self
    }

    /// Add an AND condition
    pub fn and(self, condition: &str) -> Self {
        self.where_clause(condition)
    }

    /// Add a WHERE column = value condition
    pub fn where_eq(self, column: &str, placeholder: &str) -> Self {
        self.where_clause(&format!("{} = {}", column, placeholder))
    }

    /// Add a WHERE column != value condition
    pub fn where_ne(self, column: &str, placeholder: &str) -> Self {
        self.where_clause(&format!("{} != {}", column, placeholder))
    }

    /// Add a WHERE column > value condition
    pub fn where_gt(self, column: &str, placeholder: &str) -> Self {
        self.where_clause(&format!("{} > {}", column, placeholder))
    }

    /// Add a WHERE column < value condition
    pub fn where_lt(self, column: &str, placeholder: &str) -> Self {
        self.where_clause(&format!("{} < {}", column, placeholder))
    }

    /// Add a WHERE column >= value condition
    pub fn where_gte(self, column: &str, placeholder: &str) -> Self {
        self.where_clause(&format!("{} >= {}", column, placeholder))
    }

    /// Add a WHERE column <= value condition
    pub fn where_lte(self, column: &str, placeholder: &str) -> Self {
        self.where_clause(&format!("{} <= {}", column, placeholder))
    }

    /// Add a WHERE column IN (values) condition
    pub fn where_in(self, column: &str, placeholders: &str) -> Self {
        self.where_clause(&format!("{} IN ({})", column, placeholders))
    }

    /// Add a WHERE column LIKE pattern condition
    pub fn where_like(self, column: &str, placeholder: &str) -> Self {
        self.where_clause(&format!("{} LIKE {}", column, placeholder))
    }

    /// Add a WHERE column IS NULL condition
    pub fn where_null(self, column: &str) -> Self {
        self.where_clause(&format!("{} IS NULL", column))
    }

    /// Add a WHERE column IS NOT NULL condition
    pub fn where_not_null(self, column: &str) -> Self {
        self.where_clause(&format!("{} IS NOT NULL", column))
    }

    /// Add an INNER JOIN
    pub fn inner_join(mut self, table: &str, on: &str) -> Self {
        self.joins.push(format!("INNER JOIN {} ON {}", table, on));
        self
    }

    /// Add a LEFT JOIN
    pub fn left_join(mut self, table: &str, on: &str) -> Self {
        self.joins.push(format!("LEFT JOIN {} ON {}", table, on));
        self
    }

    /// Add a RIGHT JOIN
    pub fn right_join(mut self, table: &str, on: &str) -> Self {
        self.joins.push(format!("RIGHT JOIN {} ON {}", table, on));
        self
    }

    /// Add an ORDER BY clause
    pub fn order_by(mut self, column: &str, direction: OrderDirection) -> Self {
        let dir = match direction {
            OrderDirection::Asc => "ASC",
            OrderDirection::Desc => "DESC",
        };
        self.order_by.push(format!("{} {}", column, dir));
        self
    }

    /// Add ORDER BY ASC
    pub fn order_by_asc(self, column: &str) -> Self {
        self.order_by(column, OrderDirection::Asc)
    }

    /// Add ORDER BY DESC
    pub fn order_by_desc(self, column: &str) -> Self {
        self.order_by(column, OrderDirection::Desc)
    }

    /// Add GROUP BY columns
    pub fn group_by(mut self, columns: &[&str]) -> Self {
        self.group_by = columns.iter().map(|s| s.to_string()).collect();
        self
    }

    /// Add HAVING condition
    pub fn having(mut self, condition: &str) -> Self {
        self.having.push(condition.to_string());
        self
    }

    /// Set LIMIT
    pub fn limit(mut self, limit: i64) -> Self {
        self.limit = Some(limit);
        self
    }

    /// Set OFFSET
    pub fn offset(mut self, offset: i64) -> Self {
        self.offset = Some(offset);
        self
    }

    /// Apply pagination
    pub fn paginate(self, page: i64, per_page: i64) -> Self {
        let offset = (page - 1) * per_page;
        self.limit(per_page).offset(offset)
    }

    /// Build the SQL query string
    pub fn build(&self) -> String {
        let mut sql = String::new();

        // SELECT
        if !self.select_columns.is_empty() {
            sql.push_str("SELECT ");
            sql.push_str(&self.select_columns.join(", "));
        }

        // FROM
        if let Some(ref table) = self.table {
            sql.push_str(" FROM ");
            sql.push_str(table);
        }

        // JOINs
        for join in &self.joins {
            sql.push(' ');
            sql.push_str(join);
        }

        // WHERE
        if !self.conditions.is_empty() {
            sql.push_str(" WHERE ");
            sql.push_str(&self.conditions.join(" AND "));
        }

        // GROUP BY
        if !self.group_by.is_empty() {
            sql.push_str(" GROUP BY ");
            sql.push_str(&self.group_by.join(", "));
        }

        // HAVING
        if !self.having.is_empty() {
            sql.push_str(" HAVING ");
            sql.push_str(&self.having.join(" AND "));
        }

        // ORDER BY
        if !self.order_by.is_empty() {
            sql.push_str(" ORDER BY ");
            sql.push_str(&self.order_by.join(", "));
        }

        // LIMIT
        if let Some(limit) = self.limit {
            sql.push_str(&format!(" LIMIT {}", limit));
        }

        // OFFSET
        if let Some(offset) = self.offset {
            sql.push_str(&format!(" OFFSET {}", offset));
        }

        sql
    }

    /// Build and return a Query
    pub fn into_query(self) -> Query<'static, DB> {
        Query::new(self.build())
    }
}

/// Order direction
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OrderDirection {
    /// Ascending
    Asc,
    /// Descending
    Desc,
}

/// Executor trait for running queries
pub trait Executor<'c, DB: Database> {
    /// Execute a query that returns no rows
    fn execute_query(&mut self, query: &str) -> impl std::future::Future<Output = crate::DbResult<u64>> + Send;

    /// Execute a query that returns rows
    fn fetch_query<T>(&mut self, query: &str) -> impl std::future::Future<Output = crate::DbResult<Vec<T>>> + Send
    where
        T: for<'r> sqlx::FromRow<'r, DB::Row> + Send + Unpin;
}

/// Insert builder for INSERT statements
pub struct InsertBuilder<DB: Database> {
    table: String,
    columns: Vec<String>,
    values_placeholders: Vec<String>,
    returning: Option<String>,
    _phantom: PhantomData<DB>,
}

impl<DB: Database> InsertBuilder<DB> {
    /// Create a new insert builder
    pub fn new(table: &str) -> Self {
        Self {
            table: table.to_string(),
            columns: Vec::new(),
            values_placeholders: Vec::new(),
            returning: None,
            _phantom: PhantomData,
        }
    }

    /// Add a column and its placeholder
    pub fn column(mut self, name: &str, placeholder: &str) -> Self {
        self.columns.push(name.to_string());
        self.values_placeholders.push(placeholder.to_string());
        self
    }

    /// Add RETURNING clause (PostgreSQL)
    pub fn returning(mut self, columns: &str) -> Self {
        self.returning = Some(columns.to_string());
        self
    }

    /// Build the INSERT query
    pub fn build(&self) -> String {
        let mut sql = format!(
            "INSERT INTO {} ({}) VALUES ({})",
            self.table,
            self.columns.join(", "),
            self.values_placeholders.join(", ")
        );

        if let Some(ref returning) = self.returning {
            sql.push_str(&format!(" RETURNING {}", returning));
        }

        sql
    }
}

/// Update builder for UPDATE statements
pub struct UpdateBuilder<DB: Database> {
    table: String,
    sets: Vec<String>,
    conditions: Vec<String>,
    returning: Option<String>,
    _phantom: PhantomData<DB>,
}

impl<DB: Database> UpdateBuilder<DB> {
    /// Create a new update builder
    pub fn new(table: &str) -> Self {
        Self {
            table: table.to_string(),
            sets: Vec::new(),
            conditions: Vec::new(),
            returning: None,
            _phantom: PhantomData,
        }
    }

    /// Add a SET column = value
    pub fn set(mut self, column: &str, placeholder: &str) -> Self {
        self.sets.push(format!("{} = {}", column, placeholder));
        self
    }

    /// Add a WHERE condition
    pub fn where_clause(mut self, condition: &str) -> Self {
        self.conditions.push(condition.to_string());
        self
    }

    /// Add RETURNING clause (PostgreSQL)
    pub fn returning(mut self, columns: &str) -> Self {
        self.returning = Some(columns.to_string());
        self
    }

    /// Build the UPDATE query
    pub fn build(&self) -> String {
        let mut sql = format!(
            "UPDATE {} SET {}",
            self.table,
            self.sets.join(", ")
        );

        if !self.conditions.is_empty() {
            sql.push_str(&format!(" WHERE {}", self.conditions.join(" AND ")));
        }

        if let Some(ref returning) = self.returning {
            sql.push_str(&format!(" RETURNING {}", returning));
        }

        sql
    }
}

/// Delete builder for DELETE statements
pub struct DeleteBuilder<DB: Database> {
    table: String,
    conditions: Vec<String>,
    returning: Option<String>,
    _phantom: PhantomData<DB>,
}

impl<DB: Database> DeleteBuilder<DB> {
    /// Create a new delete builder
    pub fn new(table: &str) -> Self {
        Self {
            table: table.to_string(),
            conditions: Vec::new(),
            returning: None,
            _phantom: PhantomData,
        }
    }

    /// Add a WHERE condition
    pub fn where_clause(mut self, condition: &str) -> Self {
        self.conditions.push(condition.to_string());
        self
    }

    /// Add RETURNING clause (PostgreSQL)
    pub fn returning(mut self, columns: &str) -> Self {
        self.returning = Some(columns.to_string());
        self
    }

    /// Build the DELETE query
    pub fn build(&self) -> String {
        let mut sql = format!("DELETE FROM {}", self.table);

        if !self.conditions.is_empty() {
            sql.push_str(&format!(" WHERE {}", self.conditions.join(" AND ")));
        }

        if let Some(ref returning) = self.returning {
            sql.push_str(&format!(" RETURNING {}", returning));
        }

        sql
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_query_builder_select() {
        let sql = QueryBuilder::<sqlx::Sqlite>::new()
            .select(&["id", "name", "email"])
            .from("users")
            .where_eq("active", "$1")
            .order_by_desc("created_at")
            .limit(10)
            .build();

        assert!(sql.contains("SELECT id, name, email"));
        assert!(sql.contains("FROM users"));
        assert!(sql.contains("WHERE active = $1"));
        assert!(sql.contains("ORDER BY created_at DESC"));
        assert!(sql.contains("LIMIT 10"));
    }

    #[test]
    fn test_query_builder_join() {
        let sql = QueryBuilder::<sqlx::Sqlite>::new()
            .select(&["u.id", "u.name", "o.total"])
            .from("users u")
            .inner_join("orders o", "o.user_id = u.id")
            .where_gt("o.total", "$1")
            .build();

        assert!(sql.contains("INNER JOIN orders o ON o.user_id = u.id"));
    }

    #[test]
    fn test_query_builder_pagination() {
        let sql = QueryBuilder::<sqlx::Sqlite>::new()
            .select_all()
            .from("products")
            .paginate(3, 20)
            .build();

        assert!(sql.contains("LIMIT 20"));
        assert!(sql.contains("OFFSET 40"));
    }

    #[test]
    fn test_insert_builder() {
        let sql = InsertBuilder::<sqlx::Sqlite>::new("users")
            .column("name", "$1")
            .column("email", "$2")
            .build();

        assert_eq!(sql, "INSERT INTO users (name, email) VALUES ($1, $2)");
    }

    #[test]
    fn test_update_builder() {
        let sql = UpdateBuilder::<sqlx::Sqlite>::new("users")
            .set("name", "$1")
            .set("email", "$2")
            .where_clause("id = $3")
            .build();

        assert!(sql.contains("UPDATE users SET name = $1, email = $2"));
        assert!(sql.contains("WHERE id = $3"));
    }

    #[test]
    fn test_delete_builder() {
        let sql = DeleteBuilder::<sqlx::Sqlite>::new("users")
            .where_clause("id = $1")
            .build();

        assert_eq!(sql, "DELETE FROM users WHERE id = $1");
    }
}
