//! Reactive runtime for managing the reactive system

use std::cell::{Cell, RefCell};
use std::rc::Rc;

thread_local! {
    static RUNTIME: RefCell<Runtime> = RefCell::new(Runtime::new());
}

/// Execute a function with access to the runtime.
pub fn with_runtime<R>(f: impl FnOnce(&mut Runtime) -> R) -> R {
    RUNTIME.with(|rt| f(&mut *rt.borrow_mut()))
}

/// The reactive runtime manages the reactive graph.
pub struct Runtime {
    /// Stack of current subscribers (effects/memos being computed)
    subscriber_stack: Vec<Subscriber>,
    /// Counter for generating unique IDs
    next_id: u64,
    /// Whether we're currently batching updates
    batching: bool,
    /// Pending notifications during batch
    pending_notifications: Vec<Subscriber>,
}

impl Runtime {
    /// Create a new runtime.
    pub fn new() -> Self {
        Runtime {
            subscriber_stack: Vec::new(),
            next_id: 0,
            batching: false,
            pending_notifications: Vec::new(),
        }
    }

    /// Generate a new unique ID.
    pub fn next_id(&mut self) -> u64 {
        let id = self.next_id;
        self.next_id += 1;
        id
    }

    /// Push a subscriber onto the stack.
    pub fn push_subscriber(&mut self, subscriber: Subscriber) {
        self.subscriber_stack.push(subscriber);
    }

    /// Pop the current subscriber from the stack.
    pub fn pop_subscriber(&mut self) -> Option<Subscriber> {
        self.subscriber_stack.pop()
    }

    /// Get the current subscriber (if any).
    pub fn current_subscriber(&self) -> Option<Subscriber> {
        self.subscriber_stack.last().cloned()
    }

    /// Start batching updates.
    pub fn start_batch(&mut self) {
        self.batching = true;
    }

    /// End batching and flush pending notifications.
    pub fn end_batch(&mut self) {
        self.batching = false;
        let pending = std::mem::take(&mut self.pending_notifications);
        for subscriber in pending {
            subscriber.notify();
        }
    }

    /// Check if we're currently batching.
    pub fn is_batching(&self) -> bool {
        self.batching
    }

    /// Queue a notification (used during batching).
    pub fn queue_notification(&mut self, subscriber: Subscriber) {
        if !self.pending_notifications.iter().any(|s| s.id == subscriber.id) {
            self.pending_notifications.push(subscriber);
        }
    }
}

impl Default for Runtime {
    fn default() -> Self {
        Self::new()
    }
}

/// A subscriber that can be notified when a signal changes.
#[derive(Clone)]
pub struct Subscriber {
    /// Unique ID for this subscriber
    pub id: u64,
    /// Callback to run when notified
    callback: Rc<dyn Fn()>,
}

impl Subscriber {
    /// Create a new subscriber.
    pub fn new(id: u64, callback: impl Fn() + 'static) -> Self {
        Subscriber {
            id,
            callback: Rc::new(callback),
        }
    }

    /// Notify this subscriber.
    pub fn notify(&self) {
        with_runtime(|rt| {
            if rt.is_batching() {
                rt.queue_notification(self.clone());
            } else {
                (self.callback)();
            }
        });
    }
}

impl PartialEq for Subscriber {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
}
