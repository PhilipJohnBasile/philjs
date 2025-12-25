//! Reactive entity queries for PhilJS integration
//!
//! This module provides wrappers that integrate SeaORM entities with PhilJS's
//! reactive system for automatic UI updates.

use crate::error::{OrmError, OrmResult};
use sea_orm::*;
use std::marker::PhantomData;

/// Reactive entity resource for PhilJS
///
/// # Example
///
/// ```rust
/// use philjs_seaorm::reactive::ReactiveEntity;
///
/// let users = ReactiveEntity::<users::Entity>::new(&db)
///     .filter(users::Column::Active.eq(true))
///     .order_by_asc(users::Column::Name)
///     .limit(10);
///
/// // Use with PhilJS resources
/// let data = create_resource(
///     || (),
///     move |_| async move {
///         users.all().await
///     }
/// );
/// ```
pub struct ReactiveEntity<E: EntityTrait> {
    db: DatabaseConnection,
    select: Select<E>,
    _phantom: PhantomData<E>,
}

impl<E: EntityTrait> ReactiveEntity<E> {
    /// Create a new reactive entity
    pub fn new(db: &DatabaseConnection) -> Self {
        Self {
            db: db.clone(),
            select: E::find(),
            _phantom: PhantomData,
        }
    }

    /// Apply a filter to the query
    pub fn filter<F>(mut self, filter: F) -> Self
    where
        F: IntoCondition,
    {
        self.select = self.select.filter(filter);
        self
    }

    /// Order by column ascending
    pub fn order_by_asc<C>(mut self, col: C) -> Self
    where
        C: ColumnTrait,
    {
        self.select = self.select.order_by_asc(col);
        self
    }

    /// Order by column descending
    pub fn order_by_desc<C>(mut self, col: C) -> Self
    where
        C: ColumnTrait,
    {
        self.select = self.select.order_by_desc(col);
        self
    }

    /// Set limit
    pub fn limit(mut self, limit: u64) -> Self {
        self.select = self.select.limit(limit);
        self
    }

    /// Set offset
    pub fn offset(mut self, offset: u64) -> Self {
        self.select = self.select.offset(offset);
        self
    }

    /// Fetch all entities
    pub async fn all(&self) -> OrmResult<Vec<E::Model>> {
        self.select
            .clone()
            .all(&self.db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))
    }

    /// Fetch one entity
    pub async fn one(&self) -> OrmResult<Option<E::Model>> {
        self.select
            .clone()
            .one(&self.db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))
    }

    /// Count entities
    pub async fn count(&self) -> OrmResult<u64> {
        self.select
            .clone()
            .count(&self.db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))
    }
}

impl<E: EntityTrait> Clone for ReactiveEntity<E> {
    fn clone(&self) -> Self {
        Self {
            db: self.db.clone(),
            select: self.select.clone(),
            _phantom: PhantomData,
        }
    }
}

/// Reactive query builder for complex queries
///
/// # Example
///
/// ```rust
/// use philjs_seaorm::reactive::ReactiveQueryBuilder;
///
/// let query = ReactiveQueryBuilder::new(&db)
///     .from(users::Entity)
///     .filter(users::Column::Active.eq(true))
///     .with_related(posts::Entity)
///     .build();
/// ```
pub struct ReactiveQueryBuilder<E: EntityTrait> {
    db: DatabaseConnection,
    select: Select<E>,
}

impl<E: EntityTrait> ReactiveQueryBuilder<E> {
    /// Create a new query builder
    pub fn new(db: &DatabaseConnection) -> Self {
        Self {
            db: db.clone(),
            select: E::find(),
        }
    }

    /// Add a filter condition
    pub fn filter<F>(mut self, filter: F) -> Self
    where
        F: IntoCondition,
    {
        self.select = self.select.filter(filter);
        self
    }

    /// Add multiple filter conditions
    pub fn filter_all(mut self, filters: Vec<Condition>) -> Self {
        for filter in filters {
            self.select = self.select.filter(filter);
        }
        self
    }

    /// Order by
    pub fn order_by<C>(mut self, col: C, order: Order) -> Self
    where
        C: ColumnTrait,
    {
        self.select = self.select.order_by(col, order);
        self
    }

    /// Limit
    pub fn limit(mut self, limit: u64) -> Self {
        self.select = self.select.limit(limit);
        self
    }

    /// Offset
    pub fn offset(mut self, offset: u64) -> Self {
        self.select = self.select.offset(offset);
        self
    }

    /// Execute and return all results
    pub async fn all(&self) -> OrmResult<Vec<E::Model>> {
        self.select
            .clone()
            .all(&self.db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))
    }

    /// Execute and return one result
    pub async fn one(&self) -> OrmResult<Option<E::Model>> {
        self.select
            .clone()
            .one(&self.db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))
    }

    /// Count results
    pub async fn count(&self) -> OrmResult<u64> {
        self.select
            .clone()
            .count(&self.db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))
    }
}

/// Reactive resource wrapper for entities
pub struct EntityResource<E: EntityTrait> {
    entity: ReactiveEntity<E>,
}

impl<E: EntityTrait> EntityResource<E> {
    /// Create a new entity resource
    pub fn new(db: &DatabaseConnection) -> Self {
        Self {
            entity: ReactiveEntity::new(db),
        }
    }

    /// Apply filters
    pub fn filter<F>(mut self, filter: F) -> Self
    where
        F: IntoCondition,
    {
        self.entity = self.entity.filter(filter);
        self
    }

    /// Fetch all entities
    pub async fn fetch(&self) -> OrmResult<Vec<E::Model>> {
        self.entity.all().await
    }

    /// Refetch entities
    pub async fn refetch(&self) -> OrmResult<Vec<E::Model>> {
        self.entity.all().await
    }
}

impl<E: EntityTrait> Clone for EntityResource<E> {
    fn clone(&self) -> Self {
        Self {
            entity: self.entity.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_reactive_entity_creation() {
        // Placeholder test - would need actual database connection
    }
}
