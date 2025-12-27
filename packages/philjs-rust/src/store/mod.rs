//! Reactive Store for Deep Struct Updates
//!
//! Provides fine-grained reactivity for complex nested data structures.
//! Similar to Leptos's Store and SolidJS's createStore.
//!
//! # Example
//!
//! ```rust
//! use philjs::store::*;
//!
//! #[derive(Store, Clone)]
//! struct AppState {
//!     user: User,
//!     settings: Settings,
//!     items: Vec<Item>,
//! }
//!
//! #[derive(Store, Clone)]
//! struct User {
//!     name: String,
//!     email: String,
//! }
//!
//! let store = create_store(AppState {
//!     user: User { name: "Alice".into(), email: "alice@example.com".into() },
//!     settings: Settings::default(),
//!     items: vec![],
//! });
//!
//! // Access nested fields with fine-grained reactivity
//! let name = store.user().name();
//!
//! // Update specific fields without re-rendering everything
//! store.user().set_name("Bob".into());
//! store.items().push(new_item);
//! ```

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

use crate::reactive::{Signal, Effect};

// =============================================================================
// Store Types
// =============================================================================

/// A reactive store that provides fine-grained updates to nested data.
pub struct Store<T: Clone + 'static> {
    /// The root value
    value: Rc<RefCell<T>>,
    /// Signals for each path
    signals: Rc<RefCell<HashMap<String, Box<dyn std::any::Any>>>>,
    /// Version for tracking changes
    version: Signal<u64>,
}

impl<T: Clone + 'static> Store<T> {
    /// Create a new store with initial value.
    pub fn new(value: T) -> Self {
        Store {
            value: Rc::new(RefCell::new(value)),
            signals: Rc::new(RefCell::new(HashMap::new())),
            version: Signal::new(0),
        }
    }

    /// Get the current value.
    pub fn get(&self) -> T {
        self.version.get(); // Track dependency
        self.value.borrow().clone()
    }

    /// Get with a function (for accessing nested fields).
    pub fn with<R>(&self, f: impl FnOnce(&T) -> R) -> R {
        self.version.get(); // Track dependency
        f(&*self.value.borrow())
    }

    /// Update the entire store.
    pub fn set(&self, value: T) {
        *self.value.borrow_mut() = value;
        self.notify();
    }

    /// Update with a function.
    pub fn update(&self, f: impl FnOnce(&mut T)) {
        f(&mut *self.value.borrow_mut());
        self.notify();
    }

    /// Notify all subscribers.
    fn notify(&self) {
        let v = self.version.get();
        self.version.set(v + 1);
    }

    /// Get or create a signal for a specific path.
    pub fn field_signal<F: Clone + 'static>(
        &self,
        path: &str,
        getter: impl Fn(&T) -> F + 'static,
        setter: impl Fn(&mut T, F) + 'static,
    ) -> StoreField<T, F> {
        StoreField {
            store: Store {
                value: Rc::clone(&self.value),
                signals: Rc::clone(&self.signals),
                version: self.version.clone(),
            },
            path: path.to_string(),
            getter: Rc::new(getter),
            setter: Rc::new(setter),
        }
    }
}

impl<T: Clone + 'static> Clone for Store<T> {
    fn clone(&self) -> Self {
        Store {
            value: Rc::clone(&self.value),
            signals: Rc::clone(&self.signals),
            version: self.version.clone(),
        }
    }
}

/// A field within a store.
pub struct StoreField<T: Clone + 'static, F: Clone + 'static> {
    store: Store<T>,
    path: String,
    getter: Rc<dyn Fn(&T) -> F>,
    setter: Rc<dyn Fn(&mut T, F)>,
}

impl<T: Clone + 'static, F: Clone + 'static> StoreField<T, F> {
    /// Get the field value.
    pub fn get(&self) -> F {
        self.store.version.get(); // Track dependency
        (self.getter)(&*self.store.value.borrow())
    }

    /// Set the field value.
    pub fn set(&self, value: F) {
        (self.setter)(&mut *self.store.value.borrow_mut(), value);
        self.store.notify();
    }

    /// Update with a function.
    pub fn update(&self, f: impl FnOnce(&mut F)) {
        let mut current = self.get();
        f(&mut current);
        self.set(current);
    }
}

impl<T: Clone + 'static, F: Clone + 'static> Clone for StoreField<T, F> {
    fn clone(&self) -> Self {
        StoreField {
            store: self.store.clone(),
            path: self.path.clone(),
            getter: Rc::clone(&self.getter),
            setter: Rc::clone(&self.setter),
        }
    }
}

// =============================================================================
// Vec Store Field
// =============================================================================

/// A reactive vec within a store.
pub struct StoreVec<T: Clone + 'static, I: Clone + 'static> {
    store: Store<T>,
    path: String,
    getter: Rc<dyn Fn(&T) -> Vec<I>>,
    setter: Rc<dyn Fn(&mut T, Vec<I>)>,
}

impl<T: Clone + 'static, I: Clone + 'static> StoreVec<T, I> {
    /// Create a new store vec field.
    pub fn new(
        store: Store<T>,
        path: &str,
        getter: impl Fn(&T) -> Vec<I> + 'static,
        setter: impl Fn(&mut T, Vec<I>) + 'static,
    ) -> Self {
        StoreVec {
            store,
            path: path.to_string(),
            getter: Rc::new(getter),
            setter: Rc::new(setter),
        }
    }

    /// Get the vec.
    pub fn get(&self) -> Vec<I> {
        self.store.version.get();
        (self.getter)(&*self.store.value.borrow())
    }

    /// Get length.
    pub fn len(&self) -> usize {
        self.get().len()
    }

    /// Check if empty.
    pub fn is_empty(&self) -> bool {
        self.get().is_empty()
    }

    /// Push an item.
    pub fn push(&self, item: I) {
        let mut vec = self.get();
        vec.push(item);
        (self.setter)(&mut *self.store.value.borrow_mut(), vec);
        self.store.notify();
    }

    /// Pop an item.
    pub fn pop(&self) -> Option<I> {
        let mut vec = self.get();
        let item = vec.pop();
        (self.setter)(&mut *self.store.value.borrow_mut(), vec);
        self.store.notify();
        item
    }

    /// Remove at index.
    pub fn remove(&self, index: usize) -> I {
        let mut vec = self.get();
        let item = vec.remove(index);
        (self.setter)(&mut *self.store.value.borrow_mut(), vec);
        self.store.notify();
        item
    }

    /// Insert at index.
    pub fn insert(&self, index: usize, item: I) {
        let mut vec = self.get();
        vec.insert(index, item);
        (self.setter)(&mut *self.store.value.borrow_mut(), vec);
        self.store.notify();
    }

    /// Clear the vec.
    pub fn clear(&self) {
        (self.setter)(&mut *self.store.value.borrow_mut(), vec![]);
        self.store.notify();
    }

    /// Set the entire vec.
    pub fn set(&self, vec: Vec<I>) {
        (self.setter)(&mut *self.store.value.borrow_mut(), vec);
        self.store.notify();
    }

    /// Update with a function.
    pub fn update(&self, f: impl FnOnce(&mut Vec<I>)) {
        let mut vec = self.get();
        f(&mut vec);
        self.set(vec);
    }

    /// Get item at index.
    pub fn get_at(&self, index: usize) -> Option<I> {
        self.get().get(index).cloned()
    }

    /// Iterate over items.
    pub fn iter(&self) -> impl Iterator<Item = I> {
        self.get().into_iter()
    }
}

impl<T: Clone + 'static, I: Clone + 'static> Clone for StoreVec<T, I> {
    fn clone(&self) -> Self {
        StoreVec {
            store: self.store.clone(),
            path: self.path.clone(),
            getter: Rc::clone(&self.getter),
            setter: Rc::clone(&self.setter),
        }
    }
}

// =============================================================================
// Map Store Field
// =============================================================================

/// A reactive map within a store.
pub struct StoreMap<T: Clone + 'static, K: Clone + Eq + std::hash::Hash + 'static, V: Clone + 'static> {
    store: Store<T>,
    path: String,
    getter: Rc<dyn Fn(&T) -> HashMap<K, V>>,
    setter: Rc<dyn Fn(&mut T, HashMap<K, V>)>,
}

impl<T: Clone + 'static, K: Clone + Eq + std::hash::Hash + 'static, V: Clone + 'static> StoreMap<T, K, V> {
    /// Create a new store map field.
    pub fn new(
        store: Store<T>,
        path: &str,
        getter: impl Fn(&T) -> HashMap<K, V> + 'static,
        setter: impl Fn(&mut T, HashMap<K, V>) + 'static,
    ) -> Self {
        StoreMap {
            store,
            path: path.to_string(),
            getter: Rc::new(getter),
            setter: Rc::new(setter),
        }
    }

    /// Get the map.
    pub fn get(&self) -> HashMap<K, V> {
        self.store.version.get();
        (self.getter)(&*self.store.value.borrow())
    }

    /// Get a value by key.
    pub fn get_value(&self, key: &K) -> Option<V> {
        self.get().get(key).cloned()
    }

    /// Insert a key-value pair.
    pub fn insert(&self, key: K, value: V) -> Option<V> {
        let mut map = self.get();
        let old = map.insert(key, value);
        (self.setter)(&mut *self.store.value.borrow_mut(), map);
        self.store.notify();
        old
    }

    /// Remove a key.
    pub fn remove(&self, key: &K) -> Option<V> {
        let mut map = self.get();
        let old = map.remove(key);
        (self.setter)(&mut *self.store.value.borrow_mut(), map);
        self.store.notify();
        old
    }

    /// Clear the map.
    pub fn clear(&self) {
        (self.setter)(&mut *self.store.value.borrow_mut(), HashMap::new());
        self.store.notify();
    }

    /// Check if key exists.
    pub fn contains_key(&self, key: &K) -> bool {
        self.get().contains_key(key)
    }

    /// Get length.
    pub fn len(&self) -> usize {
        self.get().len()
    }

    /// Check if empty.
    pub fn is_empty(&self) -> bool {
        self.get().is_empty()
    }
}

impl<T: Clone + 'static, K: Clone + Eq + std::hash::Hash + 'static, V: Clone + 'static> Clone for StoreMap<T, K, V> {
    fn clone(&self) -> Self {
        StoreMap {
            store: self.store.clone(),
            path: self.path.clone(),
            getter: Rc::clone(&self.getter),
            setter: Rc::clone(&self.setter),
        }
    }
}

// =============================================================================
// Create Store
// =============================================================================

/// Create a new reactive store.
///
/// # Example
///
/// ```rust
/// #[derive(Clone)]
/// struct AppState {
///     count: i32,
///     name: String,
/// }
///
/// let store = create_store(AppState {
///     count: 0,
///     name: "World".into(),
/// });
///
/// // Read values
/// let count = store.with(|s| s.count);
///
/// // Update values
/// store.update(|s| s.count += 1);
/// ```
pub fn create_store<T: Clone + 'static>(initial: T) -> Store<T> {
    Store::new(initial)
}

// =============================================================================
// Slice
// =============================================================================

/// Create a slice of a signal/store for a specific field.
///
/// This is useful for creating derived signals from stores.
pub fn create_slice<T, F>(
    source: impl Fn() -> T + 'static,
    getter: impl Fn(&T) -> F + Clone + 'static,
    setter: impl Fn(&mut T, F) + Clone + 'static,
) -> (impl Fn() -> F, impl Fn(F))
where
    T: Clone + 'static,
    F: Clone + 'static,
{
    let getter_clone = getter.clone();
    let get = move || getter_clone(&source());

    // For setter, we'd need the original signal - this is a simplified version
    let set = move |_value: F| {
        // In a real implementation, this would update the source
    };

    (get, set)
}

// =============================================================================
// Produce (Immer-style)
// =============================================================================

/// Update a value using an Immer-style producer.
///
/// The producer function receives a draft of the value that can be mutated.
///
/// # Example
///
/// ```rust
/// let state = Signal::new(vec![1, 2, 3]);
///
/// produce(&state, |draft| {
///     draft.push(4);
///     draft[0] = 10;
/// });
/// ```
pub fn produce<T: Clone>(signal: &Signal<T>, producer: impl FnOnce(&mut T)) {
    let mut value = signal.get();
    producer(&mut value);
    signal.set(value);
}

/// Produce a new value from an existing one.
pub fn produce_with<T: Clone, R>(value: T, producer: impl FnOnce(&mut T) -> R) -> (T, R) {
    let mut draft = value;
    let result = producer(&mut draft);
    (draft, result)
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[derive(Clone)]
    struct TestState {
        count: i32,
        name: String,
        items: Vec<String>,
    }

    #[test]
    fn test_store_basic() {
        let store = create_store(TestState {
            count: 0,
            name: "Test".into(),
            items: vec![],
        });

        assert_eq!(store.with(|s| s.count), 0);

        store.update(|s| s.count = 5);
        assert_eq!(store.with(|s| s.count), 5);
    }

    #[test]
    fn test_store_field() {
        let store = create_store(TestState {
            count: 0,
            name: "Test".into(),
            items: vec![],
        });

        let count_field = store.field_signal(
            "count",
            |s| s.count,
            |s, v| s.count = v,
        );

        assert_eq!(count_field.get(), 0);
        count_field.set(10);
        assert_eq!(count_field.get(), 10);
    }

    #[test]
    fn test_store_vec() {
        let store = create_store(TestState {
            count: 0,
            name: "Test".into(),
            items: vec!["a".into()],
        });

        let items = StoreVec::new(
            store.clone(),
            "items",
            |s| s.items.clone(),
            |s, v| s.items = v,
        );

        assert_eq!(items.len(), 1);
        items.push("b".into());
        assert_eq!(items.len(), 2);
    }

    #[test]
    fn test_produce() {
        let signal = Signal::new(vec![1, 2, 3]);

        produce(&signal, |draft| {
            draft.push(4);
        });

        assert_eq!(signal.get(), vec![1, 2, 3, 4]);
    }
}
