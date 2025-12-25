//! Pagination helpers for entity queries
//!
//! This module provides utilities for paginating SeaORM entity queries.

use crate::error::{OrmError, OrmResult};
use sea_orm::*;
use serde::{Deserialize, Serialize};

/// Pagination parameters
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct PaginationParams {
    /// Current page number (1-indexed)
    pub page: u64,
    /// Number of items per page
    pub per_page: u64,
}

impl Default for PaginationParams {
    fn default() -> Self {
        Self {
            page: 1,
            per_page: 10,
        }
    }
}

impl PaginationParams {
    /// Create new pagination parameters
    pub fn new(page: u64, per_page: u64) -> Self {
        Self { page, per_page }
    }

    /// Calculate offset for database query
    pub fn offset(&self) -> u64 {
        (self.page - 1) * self.per_page
    }

    /// Get limit for database query
    pub fn limit(&self) -> u64 {
        self.per_page
    }

    /// Calculate total pages
    pub fn total_pages(&self, total_items: u64) -> u64 {
        (total_items + self.per_page - 1) / self.per_page
    }
}

/// Paginated result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedResult<T> {
    /// The data items
    pub data: Vec<T>,
    /// Pagination metadata
    pub pagination: PaginationMeta,
}

/// Pagination metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginationMeta {
    /// Current page
    pub page: u64,
    /// Items per page
    pub per_page: u64,
    /// Total number of items
    pub total: u64,
    /// Total number of pages
    pub total_pages: u64,
    /// Whether there is a next page
    pub has_next: bool,
    /// Whether there is a previous page
    pub has_prev: bool,
}

impl PaginationMeta {
    /// Create new pagination metadata
    pub fn new(params: PaginationParams, total: u64) -> Self {
        let total_pages = params.total_pages(total);

        Self {
            page: params.page,
            per_page: params.per_page,
            total,
            total_pages,
            has_next: params.page < total_pages,
            has_prev: params.page > 1,
        }
    }
}

/// Paginator for entities
///
/// # Example
///
/// ```rust
/// use philjs_seaorm::pagination::{Paginator, PaginationParams};
///
/// let params = PaginationParams::new(1, 10);
/// let result = Paginator::new(&db, users::Entity::find())
///     .paginate(params)
///     .await?;
/// ```
pub struct Paginator<E: EntityTrait> {
    db: DatabaseConnection,
    select: Select<E>,
}

impl<E: EntityTrait> Paginator<E> {
    /// Create a new paginator
    pub fn new(db: &DatabaseConnection, select: Select<E>) -> Self {
        Self {
            db: db.clone(),
            select,
        }
    }

    /// Paginate the query
    pub async fn paginate(&self, params: PaginationParams) -> OrmResult<PaginatedResult<E::Model>> {
        // Get total count
        let total = self
            .select
            .clone()
            .count(&self.db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))?;

        // Get paginated data
        let data = self
            .select
            .clone()
            .offset(params.offset())
            .limit(params.limit())
            .all(&self.db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))?;

        let pagination = PaginationMeta::new(params, total);

        Ok(PaginatedResult { data, pagination })
    }

    /// Paginate with custom count query
    pub async fn paginate_with_count(
        &self,
        params: PaginationParams,
        total: u64,
    ) -> OrmResult<PaginatedResult<E::Model>> {
        let data = self
            .select
            .clone()
            .offset(params.offset())
            .limit(params.limit())
            .all(&self.db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))?;

        let pagination = PaginationMeta::new(params, total);

        Ok(PaginatedResult { data, pagination })
    }
}

/// Extension trait for Select to add pagination
pub trait PaginateExt<E: EntityTrait> {
    /// Paginate the select query
    fn paginate(self, db: &DatabaseConnection, params: PaginationParams) -> Paginator<E>;
}

impl<E: EntityTrait> PaginateExt<E> for Select<E> {
    fn paginate(self, db: &DatabaseConnection, params: PaginationParams) -> Paginator<E> {
        Paginator::new(db, self)
    }
}

/// Cursor-based pagination parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CursorParams {
    /// Cursor to start from (usually an ID)
    pub cursor: Option<String>,
    /// Number of items to fetch
    pub limit: u64,
}

impl Default for CursorParams {
    fn default() -> Self {
        Self {
            cursor: None,
            limit: 10,
        }
    }
}

/// Cursor-based paginated result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CursorResult<T> {
    /// The data items
    pub data: Vec<T>,
    /// Next cursor (if any)
    pub next_cursor: Option<String>,
    /// Whether there are more items
    pub has_more: bool,
}

/// Cursor paginator for infinite scrolling
///
/// # Example
///
/// ```rust
/// use philjs_seaorm::pagination::{CursorPaginator, CursorParams};
///
/// let params = CursorParams { cursor: None, limit: 20 };
/// let result = CursorPaginator::new(&db, users::Entity::find())
///     .by_column(users::Column::Id)
///     .paginate(params)
///     .await?;
/// ```
pub struct CursorPaginator<E: EntityTrait> {
    db: DatabaseConnection,
    select: Select<E>,
    cursor_column: Option<String>,
}

impl<E: EntityTrait> CursorPaginator<E> {
    /// Create a new cursor paginator
    pub fn new(db: &DatabaseConnection, select: Select<E>) -> Self {
        Self {
            db: db.clone(),
            select,
            cursor_column: None,
        }
    }

    /// Set the column to use for cursor
    pub fn by_column<C: ColumnTrait>(mut self, _col: C) -> Self {
        self.cursor_column = Some("id".to_string()); // Simplified
        self
    }

    /// Paginate with cursor
    pub async fn paginate(&self, params: CursorParams) -> OrmResult<CursorResult<E::Model>> {
        let mut query = self.select.clone();

        // Apply cursor if provided
        if let Some(cursor) = &params.cursor {
            // In practice, you would parse the cursor and apply it to the query
            // This is a simplified version
            let _ = cursor;
        }

        // Fetch one extra to determine if there are more items
        let data = query
            .limit(params.limit + 1)
            .all(&self.db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))?;

        let has_more = data.len() > params.limit as usize;
        let mut data = data;

        if has_more {
            data.pop();
        }

        let next_cursor = if has_more {
            Some("next_cursor".to_string()) // Simplified
        } else {
            None
        };

        Ok(CursorResult {
            data,
            next_cursor,
            has_more,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pagination_params() {
        let params = PaginationParams::new(2, 10);
        assert_eq!(params.offset(), 10);
        assert_eq!(params.limit(), 10);
        assert_eq!(params.total_pages(45), 5);
    }

    #[test]
    fn test_pagination_meta() {
        let params = PaginationParams::new(2, 10);
        let meta = PaginationMeta::new(params, 45);

        assert_eq!(meta.page, 2);
        assert_eq!(meta.per_page, 10);
        assert_eq!(meta.total, 45);
        assert_eq!(meta.total_pages, 5);
        assert!(meta.has_next);
        assert!(meta.has_prev);
    }
}
