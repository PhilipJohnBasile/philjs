//! Batching multiple signal updates

use super::runtime::with_runtime;

/// Batch multiple signal updates together.
///
/// This prevents intermediate renders when updating multiple signals.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// let first = Signal::new("John");
/// let last = Signal::new("Doe");
///
/// // Without batching, this would trigger 2 renders
/// // With batching, only 1 render at the end
/// batch(|| {
///     first.set("Jane");
///     last.set("Smith");
/// });
/// ```
pub fn batch<R>(f: impl FnOnce() -> R) -> R {
    with_runtime(|rt| rt.start_batch());
    let result = f();
    let pending = with_runtime(|rt| rt.end_batch());
    for subscriber in pending {
        subscriber.notify();
    }
    result
}

/// Untrack signal reads within a function.
///
/// This prevents the current effect/memo from tracking dependencies.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// let count = Signal::new(0);
/// let other = Signal::new(0);
///
/// Effect::new(move || {
///     // This will be tracked
///     let _ = count.get();
///
///     // This will NOT be tracked
///     untrack(|| {
///         let _ = other.get();
///     });
/// });
/// ```
pub fn untrack<R>(f: impl FnOnce() -> R) -> R {
    // Pop the current subscriber, run the function, then push it back
    let subscriber = with_runtime(|rt| rt.pop_subscriber());
    let result = f();
    if let Some(sub) = subscriber {
        with_runtime(|rt| rt.push_subscriber(sub));
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::reactive::signal::Signal;
    use std::cell::Cell;
    use std::rc::Rc;

    #[test]
    fn test_batch() {
        let updates = Rc::new(Cell::new(0));
        let a = Signal::new(0);
        let b = Signal::new(0);

        batch(|| {
            a.set(1);
            b.set(2);
        });

        assert_eq!(a.get(), 1);
        assert_eq!(b.get(), 2);
    }
}
