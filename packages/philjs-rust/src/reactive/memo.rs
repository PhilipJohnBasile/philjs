//! Memoized computed values

use std::cell::{Cell, RefCell};
use std::fmt::{self, Debug};
use std::rc::Rc;

use super::runtime::{with_runtime, Subscriber};

/// A memoized computed value that caches its result and only
/// recomputes when its dependencies change.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// let count = Signal::new(0);
/// let doubled = Memo::new(move || count.get() * 2);
///
/// assert_eq!(doubled.get(), 0);
/// count.set(5);
/// assert_eq!(doubled.get(), 10);
/// ```
pub struct Memo<T> {
    inner: Rc<MemoInner<T>>,
}

struct MemoInner<T> {
    compute: Box<dyn Fn() -> T>,
    value: RefCell<Option<T>>,
    dirty: Cell<bool>,
    subscriber: RefCell<Option<Subscriber>>,
}

impl<T: Clone + 'static> Memo<T> {
    /// Create a new memo with a computation function.
    pub fn new(compute: impl Fn() -> T + 'static) -> Self {
        let inner = Rc::new(MemoInner {
            compute: Box::new(compute),
            value: RefCell::new(None),
            dirty: Cell::new(true),
            subscriber: RefCell::new(None),
        });

        // Set up subscriber
        let inner_weak = Rc::downgrade(&inner);
        let id = with_runtime(|rt| rt.next_id());
        let subscriber = Subscriber::new(id, move || {
            if let Some(inner) = inner_weak.upgrade() {
                inner.dirty.set(true);
            }
        });
        *inner.subscriber.borrow_mut() = Some(subscriber);

        Memo { inner }
    }

    /// Get the current value, recomputing if necessary.
    pub fn get(&self) -> T {
        if self.inner.dirty.get() || self.inner.value.borrow().is_none() {
            self.recompute();
        }
        self.inner.value.borrow().clone().unwrap()
    }

    /// Force recomputation.
    fn recompute(&self) {
        let subscriber = self.inner.subscriber.borrow().clone();
        if let Some(sub) = subscriber {
            with_runtime(|rt| rt.push_subscriber(sub));
        }

        let value = (self.inner.compute)();
        *self.inner.value.borrow_mut() = Some(value);
        self.inner.dirty.set(false);

        with_runtime(|rt| {
            rt.pop_subscriber();
        });
    }
}

impl<T: Clone + 'static> Clone for Memo<T> {
    fn clone(&self) -> Self {
        Memo {
            inner: Rc::clone(&self.inner),
        }
    }
}

impl<T: Debug + Clone + 'static> Debug for Memo<T> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Memo")
            .field("value", &self.get())
            .field("dirty", &self.inner.dirty.get())
            .finish()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::reactive::signal::Signal;

    #[test]
    fn test_memo_basic() {
        let signal = Signal::new(5);
        let signal_clone = signal.clone();
        let doubled = Memo::new(move || signal_clone.get() * 2);

        assert_eq!(doubled.get(), 10);
        signal.set(10);
        assert_eq!(doubled.get(), 20);
    }
}
