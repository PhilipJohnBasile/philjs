//! Application state management for PhilJS TUI

use std::sync::{Arc, Mutex};

/// Application state wrapper
pub struct AppState<T> {
    inner: Arc<Mutex<T>>,
}

impl<T> AppState<T> {
    pub fn new(state: T) -> Self {
        AppState {
            inner: Arc::new(Mutex::new(state)),
        }
    }

    /// Get read/write access to the state
    pub fn with<F, R>(&self, f: F) -> R
    where
        F: FnOnce(&mut T) -> R,
    {
        let mut guard = self.inner.lock().unwrap();
        f(&mut *guard)
    }

    /// Get a clone of the inner value (if T: Clone)
    pub fn get(&self) -> T
    where
        T: Clone,
    {
        self.inner.lock().unwrap().clone()
    }

    /// Set the inner value
    pub fn set(&self, value: T) {
        *self.inner.lock().unwrap() = value;
    }
}

impl<T> Clone for AppState<T> {
    fn clone(&self) -> Self {
        AppState {
            inner: Arc::clone(&self.inner),
        }
    }
}

impl<T: Default> Default for AppState<T> {
    fn default() -> Self {
        Self::new(T::default())
    }
}

/// Simple signal implementation for TUI
pub struct Signal<T> {
    value: Arc<Mutex<T>>,
}

impl<T> Signal<T> {
    pub fn new(value: T) -> Self {
        Signal {
            value: Arc::new(Mutex::new(value)),
        }
    }

    pub fn get(&self) -> T
    where
        T: Clone,
    {
        self.value.lock().unwrap().clone()
    }

    pub fn set(&self, value: T) {
        *self.value.lock().unwrap() = value;
    }

    pub fn update<F>(&self, f: F)
    where
        F: FnOnce(&mut T),
    {
        let mut guard = self.value.lock().unwrap();
        f(&mut *guard);
    }
}

impl<T> Clone for Signal<T> {
    fn clone(&self) -> Self {
        Signal {
            value: Arc::clone(&self.value),
        }
    }
}

/// Create a new signal
pub fn create_signal<T>(value: T) -> Signal<T> {
    Signal::new(value)
}
