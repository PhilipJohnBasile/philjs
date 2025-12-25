//! Entity lifecycle hooks for SeaORM
//!
//! This module provides hooks that can be attached to entity operations
//! for automatic validation, auditing, and side effects.

use crate::error::{OrmError, OrmResult};
use async_trait::async_trait;
use sea_orm::*;
use std::sync::Arc;

/// Hook that runs before an entity operation
#[async_trait]
pub trait BeforeHook<E: EntityTrait>: Send + Sync {
    /// Run before insert
    async fn before_insert(&self, _model: &E::Model) -> OrmResult<()> {
        Ok(())
    }

    /// Run before update
    async fn before_update(&self, _model: &E::Model) -> OrmResult<()> {
        Ok(())
    }

    /// Run before delete
    async fn before_delete(&self, _model: &E::Model) -> OrmResult<()> {
        Ok(())
    }
}

/// Hook that runs after an entity operation
#[async_trait]
pub trait AfterHook<E: EntityTrait>: Send + Sync {
    /// Run after insert
    async fn after_insert(&self, _model: &E::Model) -> OrmResult<()> {
        Ok(())
    }

    /// Run after update
    async fn after_update(&self, _model: &E::Model) -> OrmResult<()> {
        Ok(())
    }

    /// Run after delete
    async fn after_delete(&self, _model: &E::Model) -> OrmResult<()> {
        Ok(())
    }
}

/// Entity with lifecycle hooks
///
/// # Example
///
/// ```rust
/// use philjs_seaorm::hooks::{HookedEntity, BeforeHook, AfterHook};
///
/// struct AuditHook;
///
/// #[async_trait]
/// impl BeforeHook<users::Entity> for AuditHook {
///     async fn before_insert(&self, model: &users::Model) -> OrmResult<()> {
///         println!("Inserting user: {}", model.name);
///         Ok(())
///     }
/// }
///
/// let hooked = HookedEntity::<users::Entity>::new(&db)
///     .with_before_hook(Arc::new(AuditHook))
///     .with_after_hook(Arc::new(LoggingHook));
/// ```
pub struct HookedEntity<E: EntityTrait> {
    db: DatabaseConnection,
    before_hooks: Vec<Arc<dyn BeforeHook<E>>>,
    after_hooks: Vec<Arc<dyn AfterHook<E>>>,
}

impl<E: EntityTrait> HookedEntity<E> {
    /// Create a new hooked entity
    pub fn new(db: &DatabaseConnection) -> Self {
        Self {
            db: db.clone(),
            before_hooks: Vec::new(),
            after_hooks: Vec::new(),
        }
    }

    /// Add a before hook
    pub fn with_before_hook(mut self, hook: Arc<dyn BeforeHook<E>>) -> Self {
        self.before_hooks.push(hook);
        self
    }

    /// Add an after hook
    pub fn with_after_hook(mut self, hook: Arc<dyn AfterHook<E>>) -> Self {
        self.after_hooks.push(hook);
        self
    }

    /// Insert with hooks
    pub async fn insert(&self, active_model: E::ActiveModel) -> OrmResult<E::Model>
    where
        E::ActiveModel: ActiveModelTrait<Entity = E> + Send,
    {
        // Run before hooks
        let model = active_model.clone().try_into_model().map_err(|e| OrmError::Validation(e.to_string()))?;
        for hook in &self.before_hooks {
            hook.before_insert(&model).await?;
        }

        // Perform insert
        let result = active_model
            .insert(&self.db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))?;

        // Run after hooks
        for hook in &self.after_hooks {
            hook.after_insert(&result).await?;
        }

        Ok(result)
    }

    /// Update with hooks
    pub async fn update(&self, active_model: E::ActiveModel) -> OrmResult<E::Model>
    where
        E::ActiveModel: ActiveModelTrait<Entity = E> + Send,
    {
        // Run before hooks
        let model = active_model.clone().try_into_model().map_err(|e| OrmError::Validation(e.to_string()))?;
        for hook in &self.before_hooks {
            hook.before_update(&model).await?;
        }

        // Perform update
        let result = active_model
            .update(&self.db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))?;

        // Run after hooks
        for hook in &self.after_hooks {
            hook.after_update(&result).await?;
        }

        Ok(result)
    }

    /// Delete with hooks
    pub async fn delete(&self, model: E::Model) -> OrmResult<DeleteResult>
    where
        E::Model: ModelTrait<Entity = E> + IntoActiveModel<E::ActiveModel>,
    {
        // Run before hooks
        for hook in &self.before_hooks {
            hook.before_delete(&model).await?;
        }

        // Perform delete
        let active_model: E::ActiveModel = model.clone().into_active_model();
        let result = active_model
            .delete(&self.db)
            .await
            .map_err(|e| OrmError::Query(e.to_string()))?;

        // Run after hooks
        for hook in &self.after_hooks {
            hook.after_delete(&model).await?;
        }

        Ok(result)
    }
}

/// Validation hook for models
pub struct ValidationHook<F> {
    validator: F,
}

impl<F> ValidationHook<F> {
    /// Create a new validation hook
    pub fn new(validator: F) -> Self {
        Self { validator }
    }
}

#[async_trait]
impl<E, F> BeforeHook<E> for ValidationHook<F>
where
    E: EntityTrait,
    F: Fn(&E::Model) -> OrmResult<()> + Send + Sync,
{
    async fn before_insert(&self, model: &E::Model) -> OrmResult<()> {
        (self.validator)(model)
    }

    async fn before_update(&self, model: &E::Model) -> OrmResult<()> {
        (self.validator)(model)
    }
}

/// Logging hook for debugging
pub struct LoggingHook {
    prefix: String,
}

impl LoggingHook {
    /// Create a new logging hook
    pub fn new(prefix: impl Into<String>) -> Self {
        Self {
            prefix: prefix.into(),
        }
    }
}

#[async_trait]
impl<E: EntityTrait> BeforeHook<E> for LoggingHook {
    async fn before_insert(&self, _model: &E::Model) -> OrmResult<()> {
        tracing::debug!("{}: before insert", self.prefix);
        Ok(())
    }

    async fn before_update(&self, _model: &E::Model) -> OrmResult<()> {
        tracing::debug!("{}: before update", self.prefix);
        Ok(())
    }

    async fn before_delete(&self, _model: &E::Model) -> OrmResult<()> {
        tracing::debug!("{}: before delete", self.prefix);
        Ok(())
    }
}

#[async_trait]
impl<E: EntityTrait> AfterHook<E> for LoggingHook {
    async fn after_insert(&self, _model: &E::Model) -> OrmResult<()> {
        tracing::debug!("{}: after insert", self.prefix);
        Ok(())
    }

    async fn after_update(&self, _model: &E::Model) -> OrmResult<()> {
        tracing::debug!("{}: after update", self.prefix);
        Ok(())
    }

    async fn after_delete(&self, _model: &E::Model) -> OrmResult<()> {
        tracing::debug!("{}: after delete", self.prefix);
        Ok(())
    }
}

/// Timestamp hook for automatically updating timestamps
pub struct TimestampHook;

#[async_trait]
impl<E: EntityTrait> BeforeHook<E> for TimestampHook {
    async fn before_insert(&self, _model: &E::Model) -> OrmResult<()> {
        // In practice, you would update created_at and updated_at here
        Ok(())
    }

    async fn before_update(&self, _model: &E::Model) -> OrmResult<()> {
        // In practice, you would update updated_at here
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_logging_hook_creation() {
        let _hook = LoggingHook::new("test");
    }
}
