//! Entity helpers and utilities

use sea_orm::{
    entity::*, query::*, ActiveModelTrait, ColumnTrait, EntityTrait,
    DatabaseConnection, DbErr, PrimaryKeyTrait, PrimaryKeyToColumn,
};
use serde::{Deserialize, Serialize};
use async_trait::async_trait;

use crate::error::{OrmError, OrmResult};

/// Pagination parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pagination {
    /// Current page (1-indexed)
    pub page: u64,
    /// Items per page
    pub per_page: u64,
}

impl Default for Pagination {
    fn default() -> Self {
        Self {
            page: 1,
            per_page: 20,
        }
    }
}

impl Pagination {
    /// Create new pagination
    pub fn new(page: u64, per_page: u64) -> Self {
        Self { page, per_page }
    }

    /// Get the offset for SQL queries
    pub fn offset(&self) -> u64 {
        (self.page.saturating_sub(1)) * self.per_page
    }

    /// Get the limit for SQL queries
    pub fn limit(&self) -> u64 {
        self.per_page
    }
}

/// Sort order
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SortOrder {
    /// Ascending
    Asc,
    /// Descending
    Desc,
}

impl From<SortOrder> for Order {
    fn from(order: SortOrder) -> Self {
        match order {
            SortOrder::Asc => Order::Asc,
            SortOrder::Desc => Order::Desc,
        }
    }
}

/// Paginated result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedResult<T> {
    /// Items in current page
    pub items: Vec<T>,
    /// Total number of items
    pub total: u64,
    /// Current page
    pub page: u64,
    /// Items per page
    pub per_page: u64,
    /// Total number of pages
    pub total_pages: u64,
    /// Has next page
    pub has_next: bool,
    /// Has previous page
    pub has_prev: bool,
}

impl<T> PaginatedResult<T> {
    /// Create a new paginated result
    pub fn new(items: Vec<T>, total: u64, pagination: &Pagination) -> Self {
        let total_pages = (total as f64 / pagination.per_page as f64).ceil() as u64;
        Self {
            items,
            total,
            page: pagination.page,
            per_page: pagination.per_page,
            total_pages,
            has_next: pagination.page < total_pages,
            has_prev: pagination.page > 1,
        }
    }

    /// Map items to a different type
    pub fn map<U, F>(self, f: F) -> PaginatedResult<U>
    where
        F: FnMut(T) -> U,
    {
        PaginatedResult {
            items: self.items.into_iter().map(f).collect(),
            total: self.total,
            page: self.page,
            per_page: self.per_page,
            total_pages: self.total_pages,
            has_next: self.has_next,
            has_prev: self.has_prev,
        }
    }
}

/// Entity helper trait for common operations
#[async_trait]
pub trait EntityHelpers: EntityTrait {
    /// Find all entities
    async fn find_all(db: &DatabaseConnection) -> OrmResult<Vec<Self::Model>> {
        Self::find()
            .all(db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))
    }

    /// Find by primary key
    async fn find_by_pk<P>(db: &DatabaseConnection, pk: P) -> OrmResult<Option<Self::Model>>
    where
        P: Into<<<Self as EntityTrait>::PrimaryKey as PrimaryKeyTrait>::ValueType>,
    {
        Self::find_by_id(pk)
            .one(db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))
    }

    /// Find one by condition
    async fn find_one(
        db: &DatabaseConnection,
        condition: Condition,
    ) -> OrmResult<Option<Self::Model>> {
        Self::find()
            .filter(condition)
            .one(db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))
    }

    /// Find many by condition
    async fn find_many(
        db: &DatabaseConnection,
        condition: Condition,
    ) -> OrmResult<Vec<Self::Model>> {
        Self::find()
            .filter(condition)
            .all(db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))
    }

    /// Find with pagination
    async fn find_paginated(
        db: &DatabaseConnection,
        pagination: &Pagination,
    ) -> OrmResult<PaginatedResult<Self::Model>> {
        let total = Self::find()
            .count(db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))?;

        let items = Self::find()
            .offset(pagination.offset())
            .limit(pagination.limit())
            .all(db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))?;

        Ok(PaginatedResult::new(items, total, pagination))
    }

    /// Find with pagination and condition
    async fn find_paginated_filtered(
        db: &DatabaseConnection,
        condition: Condition,
        pagination: &Pagination,
    ) -> OrmResult<PaginatedResult<Self::Model>> {
        let total = Self::find()
            .filter(condition.clone())
            .count(db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))?;

        let items = Self::find()
            .filter(condition)
            .offset(pagination.offset())
            .limit(pagination.limit())
            .all(db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))?;

        Ok(PaginatedResult::new(items, total, pagination))
    }

    /// Count all entities
    async fn count_all(db: &DatabaseConnection) -> OrmResult<u64> {
        Self::find()
            .count(db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))
    }

    /// Count by condition
    async fn count_where(db: &DatabaseConnection, condition: Condition) -> OrmResult<u64> {
        Self::find()
            .filter(condition)
            .count(db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))
    }

    /// Check if entity exists by condition
    async fn exists(db: &DatabaseConnection, condition: Condition) -> OrmResult<bool> {
        let count = Self::count_where(db, condition).await?;
        Ok(count > 0)
    }

    /// Delete by primary key
    async fn delete_by_pk<P>(db: &DatabaseConnection, pk: P) -> OrmResult<u64>
    where
        P: Into<<<Self as EntityTrait>::PrimaryKey as PrimaryKeyTrait>::ValueType>,
    {
        let result = Self::delete_by_id(pk)
            .exec(db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))?;

        Ok(result.rows_affected)
    }

    /// Delete by condition
    async fn delete_where(db: &DatabaseConnection, condition: Condition) -> OrmResult<u64> {
        let result = Self::delete_many()
            .filter(condition)
            .exec(db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))?;

        Ok(result.rows_affected)
    }
}

/// Implement EntityHelpers for all entities
impl<E: EntityTrait> EntityHelpers for E {}

/// Active model helper trait
#[async_trait]
pub trait ActiveModelHelpers<E>
where
    E: EntityTrait,
    Self: ActiveModelTrait<Entity = E> + Send,
{
    /// Save (insert or update) the model
    async fn save_model(self, db: &DatabaseConnection) -> OrmResult<E::Model>
    where
        <Self as ActiveModelTrait>::Entity: EntityTrait,
        <E as EntityTrait>::Model: IntoActiveModel<Self>,
    {
        self.save(db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))?
            .try_into_model()
            .map_err(|e| OrmError::Query(e.to_string()))
    }

    /// Insert the model
    async fn insert_model(self, db: &DatabaseConnection) -> OrmResult<E::Model>
    where
        <Self as ActiveModelTrait>::Entity: EntityTrait,
    {
        self.insert(db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))
    }

    /// Update the model
    async fn update_model(self, db: &DatabaseConnection) -> OrmResult<E::Model>
    where
        <Self as ActiveModelTrait>::Entity: EntityTrait,
    {
        self.update(db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pagination() {
        let pagination = Pagination::new(3, 20);
        assert_eq!(pagination.offset(), 40);
        assert_eq!(pagination.limit(), 20);
    }

    #[test]
    fn test_pagination_first_page() {
        let pagination = Pagination::new(1, 10);
        assert_eq!(pagination.offset(), 0);
        assert_eq!(pagination.limit(), 10);
    }

    #[test]
    fn test_paginated_result() {
        let items = vec![1, 2, 3, 4, 5];
        let pagination = Pagination::new(1, 5);
        let result = PaginatedResult::new(items, 23, &pagination);

        assert_eq!(result.total, 23);
        assert_eq!(result.total_pages, 5);
        assert!(result.has_next);
        assert!(!result.has_prev);
    }

    #[test]
    fn test_paginated_result_map() {
        let items = vec![1, 2, 3];
        let pagination = Pagination::new(1, 10);
        let result = PaginatedResult::new(items, 3, &pagination);

        let mapped = result.map(|x| x * 2);
        assert_eq!(mapped.items, vec![2, 4, 6]);
    }
}
