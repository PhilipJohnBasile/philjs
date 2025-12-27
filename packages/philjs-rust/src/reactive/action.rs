//! Server Actions for PhilJS
//!
//! Actions are like Resources but for mutations - they don't run automatically,
//! instead providing a way to trigger server calls with pending/error states.
//!
//! # Example
//!
//! ```rust
//! use philjs::prelude::*;
//!
//! #[server]
//! async fn add_todo(title: String) -> ServerResult<Todo> {
//!     db.create_todo(&title).await
//! }
//!
//! #[component]
//! fn AddTodo() -> impl IntoView {
//!     let add_action = create_action(|title: &String| {
//!         let title = title.clone();
//!         async move { add_todo(title).await }
//!     });
//!
//!     let (input, set_input) = create_signal(String::new());
//!
//!     view! {
//!         <form on:submit=move |ev| {
//!             ev.prevent_default();
//!             add_action.dispatch(input.get());
//!         }>
//!             <input
//!                 type="text"
//!                 bind:value=input
//!                 disabled=add_action.pending()
//!             />
//!             <button type="submit" disabled=add_action.pending()>
//!                 {move || if add_action.pending().get() { "Adding..." } else { "Add" }}
//!             </button>
//!         </form>
//!         <Show when=move || add_action.value().get().is_some()>
//!             <p>"Added: " {move || add_action.value().get().unwrap().title}</p>
//!         </Show>
//!     }
//! }
//! ```

use std::cell::RefCell;
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;

use super::signal::Signal;

/// The current state of an action
#[derive(Clone, Debug, PartialEq)]
pub struct ActionState<T> {
    /// The input that was dispatched (if any)
    pub input: Option<T>,
    /// Whether the action is currently running
    pub pending: bool,
    /// The submission ID (increments with each dispatch)
    pub submission_id: u64,
}

impl<T> Default for ActionState<T> {
    fn default() -> Self {
        Self {
            input: None,
            pending: false,
            submission_id: 0,
        }
    }
}

/// An action that can be dispatched to run server-side mutations.
///
/// Unlike Resources, Actions:
/// - Don't run automatically
/// - Are triggered by calling `dispatch()`
/// - Track pending state for each submission
/// - Can be dispatched multiple times
#[derive(Clone)]
pub struct Action<I, O>
where
    I: Clone + 'static,
    O: Clone + 'static,
{
    /// The current value (result of the last successful action)
    value: Signal<Option<O>>,
    /// Current pending state
    pending: Signal<bool>,
    /// Last input dispatched
    input: Signal<Option<I>>,
    /// Version counter for submissions
    version: Rc<RefCell<u64>>,
    /// The action function
    action_fn: Rc<dyn Fn(I) -> Pin<Box<dyn Future<Output = Result<O, ActionError>>>>>,
    /// Error from last action
    error: Signal<Option<ActionError>>,
}

/// Error type for actions
#[derive(Clone, Debug)]
pub struct ActionError {
    pub message: String,
}

impl std::fmt::Display for ActionError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for ActionError {}

impl From<String> for ActionError {
    fn from(s: String) -> Self {
        ActionError { message: s }
    }
}

impl From<&str> for ActionError {
    fn from(s: &str) -> Self {
        ActionError { message: s.to_string() }
    }
}

impl<I, O> Action<I, O>
where
    I: Clone + 'static,
    O: Clone + 'static,
{
    /// Get the current value (result of last successful action)
    pub fn value(&self) -> Signal<Option<O>> {
        self.value.clone()
    }

    /// Get whether an action is currently pending
    pub fn pending(&self) -> Signal<bool> {
        self.pending.clone()
    }

    /// Get the last dispatched input
    pub fn input(&self) -> Signal<Option<I>> {
        self.input.clone()
    }

    /// Get the error from the last action (if any)
    pub fn error(&self) -> Signal<Option<ActionError>> {
        self.error.clone()
    }

    /// Get the current version (submission count)
    pub fn version(&self) -> u64 {
        *self.version.borrow()
    }

    /// Dispatch the action with an input value
    ///
    /// This triggers the action function and updates pending/value/error signals.
    pub fn dispatch(&self, input: I) {
        // Update submission version
        *self.version.borrow_mut() += 1;
        let current_version = *self.version.borrow();

        // Set pending state
        self.pending.set(true);
        self.input.set(Some(input.clone()));
        self.error.set(None);

        // Clone for async closure
        let value = self.value.clone();
        let pending = self.pending.clone();
        let error = self.error.clone();
        let version = self.version.clone();
        let action_fn = self.action_fn.clone();

        // Spawn the async action
        #[cfg(target_arch = "wasm32")]
        {
            wasm_bindgen_futures::spawn_local(async move {
                // Check if this submission is still current
                if *version.borrow() != current_version {
                    return;
                }

                match action_fn(input).await {
                    Ok(result) => {
                        // Only update if still current
                        if *version.borrow() == current_version {
                            value.set(Some(result));
                            pending.set(false);
                        }
                    }
                    Err(e) => {
                        if *version.borrow() == current_version {
                            error.set(Some(e));
                            pending.set(false);
                        }
                    }
                }
            });
        }

        // Non-WASM: just update state for testing
        #[cfg(not(target_arch = "wasm32"))]
        {
            pending.set(false);
        }
    }

    /// Dispatch without waiting for result
    pub fn dispatch_and_forget(&self, input: I) {
        self.dispatch(input);
    }

    /// Clear the current value
    pub fn clear(&self) {
        self.value.set(None);
        self.error.set(None);
    }
}

/// Create a new action.
///
/// # Example
///
/// ```rust
/// let save_action = create_action(|data: &SaveData| {
///     let data = data.clone();
///     async move { save_to_server(data).await }
/// });
///
/// // Later, dispatch it
/// save_action.dispatch(my_data);
/// ```
pub fn create_action<I, O, F, Fut>(action_fn: F) -> Action<I, O>
where
    I: Clone + 'static,
    O: Clone + 'static,
    F: Fn(&I) -> Fut + 'static,
    Fut: Future<Output = Result<O, ActionError>> + 'static,
{
    let action_fn_wrapped: Rc<dyn Fn(I) -> Pin<Box<dyn Future<Output = Result<O, ActionError>>>>> =
        Rc::new(move |input: I| {
            let fut = action_fn(&input);
            Box::pin(fut)
        });

    Action {
        value: Signal::new(None),
        pending: Signal::new(false),
        input: Signal::new(None),
        version: Rc::new(RefCell::new(0)),
        action_fn: action_fn_wrapped,
        error: Signal::new(None),
    }
}

/// Create an action from a server function.
///
/// This is a convenience wrapper for server functions.
pub fn create_server_action<I, O, F, Fut>(server_fn: F) -> Action<I, O>
where
    I: Clone + 'static,
    O: Clone + 'static,
    F: Fn(I) -> Fut + 'static,
    Fut: Future<Output = Result<O, String>> + 'static,
{
    create_action(move |input: &I| {
        let input = input.clone();
        let fut = server_fn(input);
        async move {
            fut.await.map_err(|e| ActionError { message: e })
        }
    })
}

// =============================================================================
// Multi-Action Support
// =============================================================================

/// A submission in a multi-action
#[derive(Clone)]
pub struct Submission<I, O>
where
    I: Clone,
    O: Clone,
{
    /// The input for this submission
    pub input: I,
    /// The value (if resolved)
    pub value: Signal<Option<O>>,
    /// Whether this submission is pending
    pub pending: Signal<bool>,
    /// Whether this submission was cancelled
    pub cancelled: Signal<bool>,
}

/// An action that can handle multiple concurrent submissions.
///
/// Unlike regular Action, MultiAction tracks each submission separately,
/// allowing for optimistic UI updates.
#[derive(Clone)]
pub struct MultiAction<I, O>
where
    I: Clone + 'static,
    O: Clone + 'static,
{
    /// All current submissions
    submissions: Signal<Vec<Submission<I, O>>>,
    /// The action function
    action_fn: Rc<dyn Fn(I) -> Pin<Box<dyn Future<Output = Result<O, ActionError>>>>>,
    /// Submission counter
    counter: Rc<RefCell<u64>>,
}

impl<I, O> MultiAction<I, O>
where
    I: Clone + 'static,
    O: Clone + 'static,
{
    /// Get all current submissions
    pub fn submissions(&self) -> Signal<Vec<Submission<I, O>>> {
        self.submissions.clone()
    }

    /// Get the pending submissions
    pub fn pending(&self) -> Vec<Submission<I, O>> {
        self.submissions.get()
            .into_iter()
            .filter(|s| s.pending.get())
            .collect()
    }

    /// Dispatch a new submission
    pub fn dispatch(&self, input: I) {
        *self.counter.borrow_mut() += 1;

        let submission = Submission {
            input: input.clone(),
            value: Signal::new(None),
            pending: Signal::new(true),
            cancelled: Signal::new(false),
        };

        // Add to submissions list
        let mut subs = self.submissions.get();
        subs.push(submission.clone());
        self.submissions.set(subs);

        // Spawn the async work
        let value_signal = submission.value.clone();
        let pending_signal = submission.pending.clone();
        let action_fn = self.action_fn.clone();

        #[cfg(target_arch = "wasm32")]
        {
            wasm_bindgen_futures::spawn_local(async move {
                match action_fn(input).await {
                    Ok(result) => {
                        value_signal.set(Some(result));
                    }
                    Err(_) => {}
                }
                pending_signal.set(false);
            });
        }

        #[cfg(not(target_arch = "wasm32"))]
        {
            pending_signal.set(false);
        }
    }

    /// Clear all completed submissions
    pub fn clear(&self) {
        let subs: Vec<_> = self.submissions.get()
            .into_iter()
            .filter(|s| s.pending.get())
            .collect();
        self.submissions.set(subs);
    }
}

/// Create a multi-action that can handle concurrent submissions
pub fn create_multi_action<I, O, F, Fut>(action_fn: F) -> MultiAction<I, O>
where
    I: Clone + 'static,
    O: Clone + 'static,
    F: Fn(&I) -> Fut + 'static,
    Fut: Future<Output = Result<O, ActionError>> + 'static,
{
    let action_fn_wrapped: Rc<dyn Fn(I) -> Pin<Box<dyn Future<Output = Result<O, ActionError>>>>> =
        Rc::new(move |input: I| {
            let fut = action_fn(&input);
            Box::pin(fut)
        });

    MultiAction {
        submissions: Signal::new(Vec::new()),
        action_fn: action_fn_wrapped,
        counter: Rc::new(RefCell::new(0)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_action_creation() {
        let action: Action<String, String> = create_action(|input: &String| {
            let input = input.clone();
            async move { Ok(format!("Processed: {}", input)) }
        });

        assert!(!action.pending().get());
        assert!(action.value().get().is_none());
    }

    #[test]
    fn test_action_dispatch() {
        let action: Action<i32, i32> = create_action(|n: &i32| {
            let n = *n;
            async move { Ok(n * 2) }
        });

        action.dispatch(5);
        assert!(action.input().get().is_some());
    }
}
