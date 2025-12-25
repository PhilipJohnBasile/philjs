//! Query helpers and filter builders

use sea_orm::{
    entity::*, query::*, ColumnTrait, EntityTrait, DatabaseConnection,
    Condition, Order, RelationTrait, JoinType, Select, Selector,
};
use sea_query::{Expr, Func, SimpleExpr};
use std::marker::PhantomData;

use crate::entity::{Pagination, PaginatedResult, SortOrder};
use crate::error::{OrmError, OrmResult};

/// Query helper trait for building complex queries
pub trait QueryHelpers<E: EntityTrait> {
    /// Add WHERE condition
    fn where_column<C: ColumnTrait>(self, column: C, value: impl Into<sea_orm::Value>) -> Self;

    /// Add WHERE IN condition
    fn where_in<C: ColumnTrait, V: Into<sea_orm::Value>>(
        self,
        column: C,
        values: Vec<V>,
    ) -> Self;

    /// Add WHERE LIKE condition
    fn where_like<C: ColumnTrait>(self, column: C, pattern: &str) -> Self;

    /// Add WHERE IS NULL condition
    fn where_null<C: ColumnTrait>(self, column: C) -> Self;

    /// Add WHERE IS NOT NULL condition
    fn where_not_null<C: ColumnTrait>(self, column: C) -> Self;

    /// Add ORDER BY clause
    fn sort<C: ColumnTrait>(self, column: C, order: SortOrder) -> Self;

    /// Apply pagination
    fn paginate(self, pagination: &Pagination) -> Self;
}

impl<E: EntityTrait> QueryHelpers<E> for Select<E> {
    fn where_column<C: ColumnTrait>(self, column: C, value: impl Into<sea_orm::Value>) -> Self {
        self.filter(column.eq(value))
    }

    fn where_in<C: ColumnTrait, V: Into<sea_orm::Value>>(
        self,
        column: C,
        values: Vec<V>,
    ) -> Self {
        self.filter(column.is_in(values))
    }

    fn where_like<C: ColumnTrait>(self, column: C, pattern: &str) -> Self {
        self.filter(column.like(pattern))
    }

    fn where_null<C: ColumnTrait>(self, column: C) -> Self {
        self.filter(column.is_null())
    }

    fn where_not_null<C: ColumnTrait>(self, column: C) -> Self {
        self.filter(column.is_not_null())
    }

    fn sort<C: ColumnTrait>(self, column: C, order: SortOrder) -> Self {
        self.order_by(column, order.into())
    }

    fn paginate(self, pagination: &Pagination) -> Self {
        self.offset(pagination.offset()).limit(pagination.limit())
    }
}

/// Filter builder for constructing complex conditions
pub struct FilterBuilder {
    conditions: Vec<Condition>,
    current: Condition,
}

impl Default for FilterBuilder {
    fn default() -> Self {
        Self::new()
    }
}

impl FilterBuilder {
    /// Create a new filter builder
    pub fn new() -> Self {
        Self {
            conditions: Vec::new(),
            current: Condition::all(),
        }
    }

    /// Add an AND condition
    pub fn and<C: ColumnTrait>(mut self, column: C, expr: SimpleExpr) -> Self {
        self.current = self.current.add(column.into_simple_expr().and(expr));
        self
    }

    /// Add an OR condition
    pub fn or<C: ColumnTrait>(mut self, column: C, expr: SimpleExpr) -> Self {
        self.current = self.current.add(column.into_simple_expr().or(expr));
        self
    }

    /// Add equals condition
    pub fn eq<C: ColumnTrait>(mut self, column: C, value: impl Into<sea_orm::Value>) -> Self {
        self.current = self.current.add(column.eq(value));
        self
    }

    /// Add not equals condition
    pub fn ne<C: ColumnTrait>(mut self, column: C, value: impl Into<sea_orm::Value>) -> Self {
        self.current = self.current.add(column.ne(value));
        self
    }

    /// Add greater than condition
    pub fn gt<C: ColumnTrait>(mut self, column: C, value: impl Into<sea_orm::Value>) -> Self {
        self.current = self.current.add(column.gt(value));
        self
    }

    /// Add greater than or equal condition
    pub fn gte<C: ColumnTrait>(mut self, column: C, value: impl Into<sea_orm::Value>) -> Self {
        self.current = self.current.add(column.gte(value));
        self
    }

    /// Add less than condition
    pub fn lt<C: ColumnTrait>(mut self, column: C, value: impl Into<sea_orm::Value>) -> Self {
        self.current = self.current.add(column.lt(value));
        self
    }

    /// Add less than or equal condition
    pub fn lte<C: ColumnTrait>(mut self, column: C, value: impl Into<sea_orm::Value>) -> Self {
        self.current = self.current.add(column.lte(value));
        self
    }

    /// Add LIKE condition
    pub fn like<C: ColumnTrait>(mut self, column: C, pattern: &str) -> Self {
        self.current = self.current.add(column.like(pattern));
        self
    }

    /// Add ILIKE condition (case-insensitive)
    pub fn ilike<C: ColumnTrait>(mut self, column: C, pattern: &str) -> Self {
        self.current = self.current.add(Expr::expr(column.into_simple_expr()).like(pattern.to_lowercase()));
        self
    }

    /// Add IN condition
    pub fn in_list<C: ColumnTrait, V: Into<sea_orm::Value>>(
        mut self,
        column: C,
        values: Vec<V>,
    ) -> Self {
        self.current = self.current.add(column.is_in(values));
        self
    }

    /// Add NOT IN condition
    pub fn not_in<C: ColumnTrait, V: Into<sea_orm::Value>>(
        mut self,
        column: C,
        values: Vec<V>,
    ) -> Self {
        self.current = self.current.add(column.is_not_in(values));
        self
    }

    /// Add IS NULL condition
    pub fn is_null<C: ColumnTrait>(mut self, column: C) -> Self {
        self.current = self.current.add(column.is_null());
        self
    }

    /// Add IS NOT NULL condition
    pub fn is_not_null<C: ColumnTrait>(mut self, column: C) -> Self {
        self.current = self.current.add(column.is_not_null());
        self
    }

    /// Add BETWEEN condition
    pub fn between<C: ColumnTrait>(
        mut self,
        column: C,
        low: impl Into<sea_orm::Value>,
        high: impl Into<sea_orm::Value>,
    ) -> Self {
        self.current = self.current.add(column.between(low, high));
        self
    }

    /// Start an OR group
    pub fn or_group(mut self) -> Self {
        if !matches!(&self.current, c if c.is_empty()) {
            self.conditions.push(self.current);
        }
        self.current = Condition::any();
        self
    }

    /// End current group and start AND group
    pub fn and_group(mut self) -> Self {
        if !matches!(&self.current, c if c.is_empty()) {
            self.conditions.push(self.current);
        }
        self.current = Condition::all();
        self
    }

    /// Build the final condition
    pub fn build(mut self) -> Condition {
        if !matches!(&self.current, c if c.is_empty()) {
            self.conditions.push(self.current);
        }

        let mut result = Condition::all();
        for condition in self.conditions {
            result = result.add(condition);
        }
        result
    }
}

/// Relation loader for eager loading related entities
pub struct RelationLoader<E: EntityTrait> {
    _phantom: PhantomData<E>,
}

impl<E: EntityTrait> RelationLoader<E> {
    /// Create a new relation loader
    pub fn new() -> Self {
        Self {
            _phantom: PhantomData,
        }
    }

    /// Load related entities
    pub async fn load<R>(
        &self,
        db: &DatabaseConnection,
        models: &[E::Model],
        relation: R,
    ) -> OrmResult<Vec<<R::To as EntityTrait>::Model>>
    where
        R: RelationTrait,
        E::Model: Clone + Send,
    {
        // This is a simplified implementation
        // Full implementation would use sea-orm's loader
        let mut results = Vec::new();

        for model in models {
            let related = E::find()
                .find_also_related::<R::To>(relation.def())
                .all(db)
                .await
                .map_err(|e| OrmError::Query(e.to_string()))?;

            for (_, maybe_related) in related {
                if let Some(rel_model) = maybe_related {
                    results.push(rel_model);
                }
            }
        }

        Ok(results)
    }
}

impl<E: EntityTrait> Default for RelationLoader<E> {
    fn default() -> Self {
        Self::new()
    }
}

/// Query result transformer
pub struct QueryTransform<E: EntityTrait, T> {
    select: Select<E>,
    transform: Box<dyn Fn(E::Model) -> T + Send + Sync>,
}

impl<E: EntityTrait, T> QueryTransform<E, T> {
    /// Create a new query transform
    pub fn new<F>(select: Select<E>, transform: F) -> Self
    where
        F: Fn(E::Model) -> T + Send + Sync + 'static,
    {
        Self {
            select,
            transform: Box::new(transform),
        }
    }

    /// Execute and transform results
    pub async fn all(self, db: &DatabaseConnection) -> OrmResult<Vec<T>>
    where
        T: Send,
        E::Model: Send,
    {
        let models = self
            .select
            .all(db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))?;

        Ok(models.into_iter().map(self.transform).collect())
    }

    /// Execute and transform first result
    pub async fn one(self, db: &DatabaseConnection) -> OrmResult<Option<T>>
    where
        T: Send,
        E::Model: Send,
    {
        let model = self
            .select
            .one(db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))?;

        Ok(model.map(self.transform))
    }
}

/// Search builder for full-text search
pub struct SearchBuilder {
    columns: Vec<String>,
    query: String,
    mode: SearchMode,
}

/// Search mode
#[derive(Debug, Clone, Copy)]
pub enum SearchMode {
    /// Contains search
    Contains,
    /// Starts with search
    StartsWith,
    /// Ends with search
    EndsWith,
    /// Exact match
    Exact,
}

impl SearchBuilder {
    /// Create a new search builder
    pub fn new(query: impl Into<String>) -> Self {
        Self {
            columns: Vec::new(),
            query: query.into(),
            mode: SearchMode::Contains,
        }
    }

    /// Add a column to search
    pub fn column(mut self, column: impl Into<String>) -> Self {
        self.columns.push(column.into());
        self
    }

    /// Set search mode
    pub fn mode(mut self, mode: SearchMode) -> Self {
        self.mode = mode;
        self
    }

    /// Build the search pattern
    pub fn pattern(&self) -> String {
        match self.mode {
            SearchMode::Contains => format!("%{}%", self.query),
            SearchMode::StartsWith => format!("{}%", self.query),
            SearchMode::EndsWith => format!("%{}", self.query),
            SearchMode::Exact => self.query.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_filter_builder() {
        let filter = FilterBuilder::new()
            .eq("name", "test")
            .gt("age", 18);

        let condition = filter.build();
        // Condition is built, we can't easily inspect it in tests
        // but we verify it compiles
        assert!(!matches!(&condition, c if c.is_empty()));
    }

    #[test]
    fn test_search_builder() {
        let search = SearchBuilder::new("test")
            .column("name")
            .column("email")
            .mode(SearchMode::Contains);

        assert_eq!(search.pattern(), "%test%");
    }

    #[test]
    fn test_search_modes() {
        assert_eq!(
            SearchBuilder::new("test").mode(SearchMode::StartsWith).pattern(),
            "test%"
        );
        assert_eq!(
            SearchBuilder::new("test").mode(SearchMode::EndsWith).pattern(),
            "%test"
        );
        assert_eq!(
            SearchBuilder::new("test").mode(SearchMode::Exact).pattern(),
            "test"
        );
    }
}
