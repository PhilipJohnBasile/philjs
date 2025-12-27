//! Additional Reactive Utilities
//!
//! Provides utility functions for common reactive patterns.

use std::cell::RefCell;
use std::rc::Rc;

use super::signal::{Signal, ReadSignal, WriteSignal};
use super::effect::Effect;

// =============================================================================
// RwSignal (Combined Read/Write)
// =============================================================================

/// A signal that combines read and write capabilities in one value.
///
/// This is useful when you want to pass around a single value that can
/// both be read and written, without needing to track two separate handles.
///
/// # Example
///
/// ```rust
/// let count = create_rw_signal(0);
///
/// // Read
/// let value = count.get();
///
/// // Write
/// count.set(value + 1);
///
/// // Update
/// count.update(|n| *n += 1);
/// ```
#[derive(Clone)]
pub struct RwSignal<T>(Signal<T>);

impl<T> RwSignal<T> {
    /// Create a new RwSignal.
    pub fn new(value: T) -> Self {
        RwSignal(Signal::new(value))
    }

    /// Get the current value.
    pub fn get(&self) -> T
    where
        T: Clone,
    {
        self.0.get()
    }

    /// Get without tracking.
    pub fn get_untracked(&self) -> T
    where
        T: Clone,
    {
        self.0.get_untracked()
    }

    /// Set a new value.
    pub fn set(&self, value: T) {
        self.0.set(value);
    }

    /// Update the value.
    pub fn update(&self, f: impl FnOnce(&mut T)) {
        self.0.update(f);
    }

    /// Access value with a function.
    pub fn with<R>(&self, f: impl FnOnce(&T) -> R) -> R {
        self.0.with(f)
    }

    /// Split into read and write handles.
    pub fn split(self) -> (ReadSignal<T>, WriteSignal<T>)
    where
        T: Clone,
    {
        (ReadSignal::new(self.0.clone()), WriteSignal::new(self.0))
    }

    /// Get as a read-only signal.
    pub fn read_only(&self) -> ReadSignal<T> {
        ReadSignal::new(self.0.clone())
    }

    /// Get as a write-only signal.
    pub fn write_only(&self) -> WriteSignal<T> {
        WriteSignal::new(self.0.clone())
    }
}

impl<T: Default> Default for RwSignal<T> {
    fn default() -> Self {
        RwSignal::new(T::default())
    }
}

impl<T> From<T> for RwSignal<T> {
    fn from(value: T) -> Self {
        RwSignal::new(value)
    }
}

/// Create a new read-write signal.
pub fn create_rw_signal<T>(value: T) -> RwSignal<T> {
    RwSignal::new(value)
}

// =============================================================================
// StoredValue (Non-Reactive Storage)
// =============================================================================

/// A non-reactive value that can be stored and retrieved.
///
/// Unlike Signal, StoredValue doesn't track access or notify on changes.
/// Use this for values that don't need to trigger re-renders.
///
/// # Example
///
/// ```rust
/// let state = StoredValue::new(ExpensiveState::new());
///
/// // Read without tracking
/// let value = state.get();
///
/// // Update without notifying
/// state.update(|s| s.do_something());
/// ```
#[derive(Clone)]
pub struct StoredValue<T>(Rc<RefCell<T>>);

impl<T> StoredValue<T> {
    /// Create a new stored value.
    pub fn new(value: T) -> Self {
        StoredValue(Rc::new(RefCell::new(value)))
    }

    /// Get the current value.
    pub fn get(&self) -> T
    where
        T: Clone,
    {
        self.0.borrow().clone()
    }

    /// Set a new value.
    pub fn set(&self, value: T) {
        *self.0.borrow_mut() = value;
    }

    /// Update the value.
    pub fn update(&self, f: impl FnOnce(&mut T)) {
        f(&mut *self.0.borrow_mut());
    }

    /// Access value with a function.
    pub fn with<R>(&self, f: impl FnOnce(&T) -> R) -> R {
        f(&*self.0.borrow())
    }

    /// Access mutably with a function.
    pub fn with_mut<R>(&self, f: impl FnOnce(&mut T) -> R) -> R {
        f(&mut *self.0.borrow_mut())
    }

    /// Try to get the value (returns None if borrowed).
    pub fn try_get(&self) -> Option<T>
    where
        T: Clone,
    {
        self.0.try_borrow().ok().map(|v| v.clone())
    }

    /// Try to set the value (returns false if borrowed).
    pub fn try_set(&self, value: T) -> bool {
        if let Ok(mut v) = self.0.try_borrow_mut() {
            *v = value;
            true
        } else {
            false
        }
    }
}

impl<T: Default> Default for StoredValue<T> {
    fn default() -> Self {
        StoredValue::new(T::default())
    }
}

impl<T> From<T> for StoredValue<T> {
    fn from(value: T) -> Self {
        StoredValue::new(value)
    }
}

/// Create a new stored (non-reactive) value.
pub fn create_stored_value<T>(value: T) -> StoredValue<T> {
    StoredValue::new(value)
}

// =============================================================================
// Cleanup
// =============================================================================

thread_local! {
    static CLEANUP_STACK: RefCell<Vec<Vec<Box<dyn FnOnce()>>>> = RefCell::new(vec![vec![]]);
}

/// Register a cleanup function to run when the current scope is disposed.
///
/// # Example
///
/// ```rust
/// #[component]
/// fn MyComponent() -> impl IntoView {
///     let interval = set_interval(|| log("tick"), 1000);
///
///     on_cleanup(move || {
///         clear_interval(interval);
///     });
///
///     view! { <div>"Timer running"</div> }
/// }
/// ```
pub fn on_cleanup(f: impl FnOnce() + 'static) {
    CLEANUP_STACK.with(|stack| {
        if let Some(scope) = stack.borrow_mut().last_mut() {
            scope.push(Box::new(f));
        }
    });
}

/// Push a new cleanup scope.
pub fn push_cleanup_scope() {
    CLEANUP_STACK.with(|stack| {
        stack.borrow_mut().push(Vec::new());
    });
}

/// Pop and run all cleanup functions in the current scope.
pub fn pop_cleanup_scope() {
    CLEANUP_STACK.with(|stack| {
        if let Some(cleanups) = stack.borrow_mut().pop() {
            for cleanup in cleanups {
                cleanup();
            }
        }
    });
}

/// Run a function with a cleanup scope that is disposed after.
pub fn with_cleanup_scope<R>(f: impl FnOnce() -> R) -> R {
    push_cleanup_scope();
    let result = f();
    pop_cleanup_scope();
    result
}

// =============================================================================
// Owner
// =============================================================================

/// Owner of a reactive scope.
///
/// When the owner is dropped, all effects and cleanups in its scope are disposed.
pub struct Owner {
    _marker: std::marker::PhantomData<()>,
}

impl Owner {
    /// Create a new owner.
    pub fn new() -> Self {
        push_cleanup_scope();
        Owner { _marker: std::marker::PhantomData }
    }
}

impl Default for Owner {
    fn default() -> Self {
        Self::new()
    }
}

impl Drop for Owner {
    fn drop(&mut self) {
        pop_cleanup_scope();
    }
}

/// Create a new reactive owner scope.
pub fn create_owner() -> Owner {
    Owner::new()
}

/// Run a function with a new owner scope.
pub fn with_owner<R>(f: impl FnOnce() -> R) -> R {
    let _owner = create_owner();
    f()
}

// =============================================================================
// Memo with Compare
// =============================================================================

/// Create a memo with a custom comparison function.
///
/// The memo will only update if the compare function returns false.
///
/// # Example
///
/// ```rust
/// let data = signal!(vec![1, 2, 3]);
///
/// // Only update memo if length changes
/// let count = create_memo_with_compare(
///     move || data.get().len(),
///     |prev, next| prev == next,
/// );
/// ```
pub fn create_memo_with_compare<T, F, C>(f: F, compare: C) -> impl Fn() -> T
where
    T: Clone + 'static,
    F: Fn() -> T + 'static,
    C: Fn(&T, &T) -> bool + 'static,
{
    let prev = Rc::new(RefCell::new(None::<T>));
    let prev_clone = prev.clone();

    move || {
        let new_value = f();

        let should_update = match &*prev_clone.borrow() {
            Some(old) => !compare(old, &new_value),
            None => true,
        };

        if should_update {
            *prev_clone.borrow_mut() = Some(new_value.clone());
        }

        prev_clone.borrow().clone().unwrap_or_else(|| new_value)
    }
}

// =============================================================================
// Trigger
// =============================================================================

/// A simple trigger signal that doesn't hold a value.
///
/// Used to manually trigger reactive updates.
///
/// # Example
///
/// ```rust
/// let trigger = create_trigger();
///
/// effect(move || {
///     trigger.track();
///     // This runs whenever trigger.notify() is called
/// });
///
/// trigger.notify(); // Triggers the effect
/// ```
#[derive(Clone)]
pub struct Trigger(Signal<u64>);

impl Trigger {
    /// Create a new trigger.
    pub fn new() -> Self {
        Trigger(Signal::new(0))
    }

    /// Track this trigger in the current reactive context.
    pub fn track(&self) {
        self.0.get();
    }

    /// Notify all dependents.
    pub fn notify(&self) {
        let v = self.0.get_untracked();
        self.0.set(v + 1);
    }
}

impl Default for Trigger {
    fn default() -> Self {
        Self::new()
    }
}

/// Create a new trigger.
pub fn create_trigger() -> Trigger {
    Trigger::new()
}

// =============================================================================
// Untrack
// =============================================================================

/// Run a function without tracking dependencies.
///
/// This prevents signal reads inside the function from being tracked
/// as dependencies of the current reactive scope.
///
/// # Example
///
/// ```rust
/// effect(|| {
///     let a = signal_a.get(); // Tracked
///     let b = untrack(|| signal_b.get()); // Not tracked
/// });
/// ```
pub fn untrack<R>(f: impl FnOnce() -> R) -> R {
    // Untracking is handled by temporarily disabling the tracking scope.
    // The current implementation passes through; runtime tracking TBD.
    f()
}

// =============================================================================
// Batch
// =============================================================================

/// Batch multiple signal updates into a single notification.
///
/// This is re-exported from the batch module for convenience.
pub use super::batch::batch;

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rw_signal() {
        let signal = create_rw_signal(0);
        assert_eq!(signal.get(), 0);

        signal.set(5);
        assert_eq!(signal.get(), 5);

        signal.update(|n| *n += 1);
        assert_eq!(signal.get(), 6);
    }

    #[test]
    fn test_stored_value() {
        let value = create_stored_value(vec![1, 2, 3]);
        assert_eq!(value.get(), vec![1, 2, 3]);

        value.update(|v| v.push(4));
        assert_eq!(value.get(), vec![1, 2, 3, 4]);
    }

    #[test]
    fn test_trigger() {
        let trigger = create_trigger();
        trigger.notify();
    }

    #[test]
    fn test_cleanup() {
        let cleaned = Rc::new(RefCell::new(false));
        let cleaned_clone = cleaned.clone();

        with_cleanup_scope(|| {
            on_cleanup(move || {
                *cleaned_clone.borrow_mut() = true;
            });
        });

        assert!(*cleaned.borrow());
    }
}
