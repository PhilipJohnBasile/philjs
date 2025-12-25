//! Reactive side effects

use std::cell::RefCell;
use std::rc::Rc;

use super::runtime::{with_runtime, Subscriber};

/// A reactive side effect that runs when its dependencies change.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// let count = Signal::new(0);
/// let count_clone = count.clone();
///
/// let _effect = Effect::new(move || {
///     println!("Count is now: {}", count_clone.get());
/// });
///
/// count.set(1); // Prints: "Count is now: 1"
/// ```
pub struct Effect {
    _inner: Rc<EffectInner>,
}

struct EffectInner {
    run: RefCell<Box<dyn Fn()>>,
    subscriber: RefCell<Option<Subscriber>>,
}

impl Effect {
    /// Create a new effect with a side effect function.
    pub fn new(f: impl Fn() + 'static) -> Self {
        let inner = Rc::new(EffectInner {
            run: RefCell::new(Box::new(f)),
            subscriber: RefCell::new(None),
        });

        // Set up subscriber
        let inner_weak = Rc::downgrade(&inner);
        let id = with_runtime(|rt| rt.next_id());
        let subscriber = Subscriber::new(id, move || {
            if let Some(inner) = inner_weak.upgrade() {
                inner.execute();
            }
        });
        *inner.subscriber.borrow_mut() = Some(subscriber);

        // Run immediately
        inner.execute();

        Effect { _inner: inner }
    }

    /// Create an effect that only runs once.
    pub fn once(f: impl FnOnce() + 'static) -> Self {
        let executed = Rc::new(RefCell::new(false));
        let executed_clone = executed.clone();
        let f = Rc::new(RefCell::new(Some(f)));

        Effect::new(move || {
            if !*executed_clone.borrow() {
                *executed_clone.borrow_mut() = true;
                if let Some(func) = f.borrow_mut().take() {
                    func();
                }
            }
        })
    }
}

impl EffectInner {
    fn execute(&self) {
        let subscriber = self.subscriber.borrow().clone();
        if let Some(sub) = subscriber {
            with_runtime(|rt| rt.push_subscriber(sub));
        }

        (self.run.borrow())();

        with_runtime(|rt| {
            rt.pop_subscriber();
        });
    }
}

/// Create a watch effect that observes a value and runs a callback.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// let count = Signal::new(0);
/// watch(
///     move || count.get(),
///     |value, prev| println!("Changed from {:?} to {}", prev, value),
/// );
/// ```
pub fn watch<T, F, C>(source: F, callback: C) -> Effect
where
    T: Clone + PartialEq + 'static,
    F: Fn() -> T + 'static,
    C: Fn(T, Option<T>) + 'static,
{
    let prev = Rc::new(RefCell::new(None::<T>));
    let prev_clone = prev.clone();

    Effect::new(move || {
        let value = source();
        let prev_value = prev_clone.borrow().clone();

        if prev_value.as_ref() != Some(&value) {
            callback(value.clone(), prev_value);
            *prev_clone.borrow_mut() = Some(value);
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::reactive::signal::Signal;
    use std::cell::Cell;

    #[test]
    fn test_effect_runs_immediately() {
        let ran = Rc::new(Cell::new(false));
        let ran_clone = ran.clone();

        let _effect = Effect::new(move || {
            ran_clone.set(true);
        });

        assert!(ran.get());
    }

    #[test]
    fn test_effect_tracks_signals() {
        let count = Rc::new(Cell::new(0));
        let signal = Signal::new(0);
        let signal_clone = signal.clone();
        let count_clone = count.clone();

        let _effect = Effect::new(move || {
            let _ = signal_clone.get();
            count_clone.set(count_clone.get() + 1);
        });

        assert_eq!(count.get(), 1); // Initial run
        signal.set(1);
        assert_eq!(count.get(), 2); // After update
    }
}
