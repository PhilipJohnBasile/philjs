//! Reactive Signal implementation
//!
//! Signals are the core reactive primitive in PhilJS. They hold a value
//! and automatically track dependencies when read inside reactive contexts.

use std::cell::{Cell, RefCell};
use std::fmt::{self, Debug, Display};
use std::rc::Rc;

use super::runtime::{with_runtime, Runtime, Subscriber};

/// A reactive signal that holds a value and notifies subscribers when it changes.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// let count = Signal::new(0);
/// assert_eq!(count.get(), 0);
///
/// count.set(1);
/// assert_eq!(count.get(), 1);
///
/// count.update(|n| *n += 1);
/// assert_eq!(count.get(), 2);
/// ```
pub struct Signal<T> {
    inner: Rc<SignalInner<T>>,
}

impl<T> Clone for Signal<T> {
    fn clone(&self) -> Self {
        Signal {
            inner: Rc::clone(&self.inner),
        }
    }
}

struct SignalInner<T> {
    value: RefCell<T>,
    subscribers: RefCell<Vec<Subscriber>>,
    version: Cell<u64>,
}

impl<T> Signal<T> {
    /// Create a new signal with an initial value.
    pub fn new(value: T) -> Self {
        Signal {
            inner: Rc::new(SignalInner {
                value: RefCell::new(value),
                subscribers: RefCell::new(Vec::new()),
                version: Cell::new(0),
            }),
        }
    }

    /// Get the current value, tracking this read if in a reactive context.
    pub fn get(&self) -> T
    where
        T: Clone,
    {
        self.track();
        self.inner.value.borrow().clone()
    }

    /// Get the current value without tracking.
    pub fn get_untracked(&self) -> T
    where
        T: Clone,
    {
        self.inner.value.borrow().clone()
    }

    /// Set a new value, notifying all subscribers.
    pub fn set(&self, value: T) {
        *self.inner.value.borrow_mut() = value;
        self.notify();
    }

    /// Update the value using a function, notifying all subscribers.
    pub fn update(&self, f: impl FnOnce(&mut T)) {
        f(&mut *self.inner.value.borrow_mut());
        self.notify();
    }

    /// Get a reference to the value with a callback.
    pub fn with<R>(&self, f: impl FnOnce(&T) -> R) -> R {
        self.track();
        f(&*self.inner.value.borrow())
    }

    /// Get a mutable reference to the value with a callback.
    pub fn with_mut<R>(&self, f: impl FnOnce(&mut T) -> R) -> R {
        let result = f(&mut *self.inner.value.borrow_mut());
        self.notify();
        result
    }

    /// Track this signal in the current reactive context.
    fn track(&self) {
        with_runtime(|rt| {
            if let Some(subscriber) = rt.current_subscriber() {
                let mut subs = self.inner.subscribers.borrow_mut();
                if !subs.iter().any(|s| s.id == subscriber.id) {
                    subs.push(subscriber);
                }
            }
        });
    }

    /// Notify all subscribers that the value has changed.
    fn notify(&self) {
        self.inner.version.set(self.inner.version.get() + 1);
        let subscribers: Vec<_> = self.inner.subscribers.borrow().clone();
        for subscriber in subscribers {
            subscriber.notify();
        }
    }

    /// Get the current version (useful for dirty checking).
    pub fn version(&self) -> u64 {
        self.inner.version.get()
    }
}

impl<T: Default> Default for Signal<T> {
    fn default() -> Self {
        Signal::new(T::default())
    }
}

impl<T: Debug> Debug for Signal<T> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Signal")
            .field("value", &*self.inner.value.borrow())
            .field("version", &self.inner.version.get())
            .finish()
    }
}

impl<T: Display> Display for Signal<T> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        Display::fmt(&*self.inner.value.borrow(), f)
    }
}

impl<T: PartialEq> PartialEq for Signal<T> {
    fn eq(&self, other: &Self) -> bool {
        Rc::ptr_eq(&self.inner, &other.inner)
    }
}

impl<T> From<T> for Signal<T> {
    fn from(value: T) -> Self {
        Signal::new(value)
    }
}

/// A read-only view of a signal.
#[derive(Clone)]
pub struct ReadSignal<T> {
    inner: Signal<T>,
}

impl<T> ReadSignal<T> {
    /// Create a read-only view of a signal.
    pub fn new(signal: Signal<T>) -> Self {
        ReadSignal { inner: signal }
    }

    /// Get the current value.
    pub fn get(&self) -> T
    where
        T: Clone,
    {
        self.inner.get()
    }

    /// Get the current value without tracking.
    pub fn get_untracked(&self) -> T
    where
        T: Clone,
    {
        self.inner.get_untracked()
    }

    /// Get a reference to the value with a callback.
    pub fn with<R>(&self, f: impl FnOnce(&T) -> R) -> R {
        self.inner.with(f)
    }
}

/// A write-only view of a signal.
#[derive(Clone)]
pub struct WriteSignal<T> {
    inner: Signal<T>,
}

impl<T> WriteSignal<T> {
    /// Create a write-only view of a signal.
    pub fn new(signal: Signal<T>) -> Self {
        WriteSignal { inner: signal }
    }

    /// Set a new value.
    pub fn set(&self, value: T) {
        self.inner.set(value);
    }

    /// Update the value using a function.
    pub fn update(&self, f: impl FnOnce(&mut T)) {
        self.inner.update(f);
    }
}

/// Create a signal and return both read and write handles.
pub fn create_signal<T>(value: T) -> (ReadSignal<T>, WriteSignal<T>) {
    let signal = Signal::new(value);
    (ReadSignal::new(signal.clone()), WriteSignal::new(signal))
}

// =============================================================================
// Hydration Support
// =============================================================================

use std::any::Any;
use std::collections::HashMap;

thread_local! {
    static SIGNAL_REGISTRY: RefCell<HashMap<String, Box<dyn Any>>> = RefCell::new(HashMap::new());
}

fn with_registry<R>(f: impl FnOnce(&mut HashMap<String, Box<dyn Any>>) -> R) -> R {
    SIGNAL_REGISTRY.with(|registry| {
        let mut map = registry.borrow_mut();
        f(&mut map)
    })
}

fn with_registry_read<R>(f: impl FnOnce(&HashMap<String, Box<dyn Any>>) -> R) -> R {
    SIGNAL_REGISTRY.with(|registry| {
        let map = registry.borrow();
        f(&map)
    })
}

/// Register a signal for hydration by ID
pub fn register_signal<T: Clone + 'static>(id: &str, signal: Signal<T>) {
    with_registry(|registry| {
        registry.insert(id.to_string(), Box::new(signal));
    });
}

/// Restore a signal value from hydration data
///
/// This is called during hydration to restore signal values from the
/// serialized state embedded in the HTML.
pub fn restore_signal_value(id: &str, value: serde_json::Value) {
    // In a full implementation, this would:
    // 1. Look up the signal in the registry by ID
    // 2. Deserialize the value to the appropriate type
    // 3. Set the signal's value
    //
    // For now, we store it for later retrieval
    with_registry(|registry| {
        registry.insert(format!("__value_{}", id), Box::new(value));
    });
}

/// Get a registered signal by ID
pub fn get_registered_signal<T: Clone + 'static>(id: &str) -> Option<Signal<T>> {
    with_registry_read(|registry| {
        registry
            .get(id)
            .and_then(|boxed| boxed.downcast_ref::<Signal<T>>().cloned())
    })
}

/// Create a signal with hydration support
///
/// If there's a hydrated value for this ID, use it; otherwise use the default.
pub fn create_hydrated_signal<T>(id: &str, default: T) -> Signal<T>
where
    T: Clone + serde::de::DeserializeOwned + 'static,
{
    let hydrated_value = with_registry_read(|registry| {
        registry
            .get(&format!("__value_{}", id))
            .and_then(|boxed| boxed.downcast_ref::<serde_json::Value>())
            .and_then(|json_value| serde_json::from_value::<T>(json_value.clone()).ok())
    });

    if let Some(value) = hydrated_value {
        let signal = Signal::new(value);
        register_signal(id, signal.clone());
        return signal;
    }

    // No hydrated value, use default
    let signal = Signal::new(default);
    register_signal(id, signal.clone());
    signal
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_signal_basic() {
        let signal = Signal::new(0);
        assert_eq!(signal.get(), 0);

        signal.set(1);
        assert_eq!(signal.get(), 1);

        signal.update(|n| *n += 1);
        assert_eq!(signal.get(), 2);
    }

    #[test]
    fn test_signal_with() {
        let signal = Signal::new(vec![1, 2, 3]);
        let len = signal.with(|v| v.len());
        assert_eq!(len, 3);
    }
}
