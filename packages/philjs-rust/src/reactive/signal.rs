//! Reactive Signal implementation
//!
//! Signals are the core reactive primitive in PhilJS. They hold a value
//! and automatically track dependencies when read inside reactive contexts.

use std::cell::{Cell, RefCell};
use std::fmt::{self, Debug, Display};
use std::ops::Deref;
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
#[derive(Clone)]
pub struct Signal<T> {
    inner: Rc<SignalInner<T>>,
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
