//! State management for PhilJS Tauri

use std::sync::{Arc, RwLock};

/// Managed state container
pub struct ManagedState<T: Send + Sync + 'static> {
    inner: Arc<RwLock<T>>,
}

impl<T: Send + Sync + 'static> ManagedState<T> {
    pub fn new(value: T) -> Self {
        ManagedState {
            inner: Arc::new(RwLock::new(value)),
        }
    }

    /// Get read access to the state
    pub fn read(&self) -> std::sync::RwLockReadGuard<'_, T> {
        self.inner.read().unwrap()
    }

    /// Get write access to the state
    pub fn write(&self) -> std::sync::RwLockWriteGuard<'_, T> {
        self.inner.write().unwrap()
    }

    /// Get a clone of the inner Arc
    pub fn inner(&self) -> Arc<RwLock<T>> {
        Arc::clone(&self.inner)
    }
}

impl<T: Send + Sync + 'static> Clone for ManagedState<T> {
    fn clone(&self) -> Self {
        ManagedState {
            inner: Arc::clone(&self.inner),
        }
    }
}

impl<T: Default + Send + Sync + 'static> Default for ManagedState<T> {
    fn default() -> Self {
        ManagedState::new(T::default())
    }
}
