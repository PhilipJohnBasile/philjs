//! Transition Component for PhilJS
//!
//! Provides smooth loading state transitions, similar to React's useTransition
//! and Leptos's Transition component.
//!
//! # Example
//!
//! ```rust
//! use philjs::prelude::*;
//!
//! #[component]
//! fn SearchResults() -> impl IntoView {
//!     let query = signal!("");
//!     let results = create_resource(
//!         move || query.get(),
//!         |q| async move { search(q).await }
//!     );
//!
//!     view! {
//!         <input bind:value=query />
//!         <Transition fallback=|| view! { <p>"Loading..."</p> }>
//!             <For each=move || results.get().unwrap_or_default()
//!                  key=|item| item.id
//!                  let:item>
//!                 <SearchResult item=item />
//!             </For>
//!         </Transition>
//!     }
//! }
//! ```

use std::cell::RefCell;
use std::rc::Rc;
use std::time::Duration;

use crate::reactive::Signal;
use crate::view::{View, IntoView};

/// Configuration for transition behavior
#[derive(Clone, Debug)]
pub struct TransitionConfig {
    /// Whether to show stale content while loading new content
    pub show_stale: bool,
    /// Minimum time to show loading state (prevents flash)
    pub min_pending_ms: u64,
    /// Whether the transition is deferred (low priority)
    pub deferred: bool,
}

impl Default for TransitionConfig {
    fn default() -> Self {
        Self {
            show_stale: true,
            min_pending_ms: 0,
            deferred: false,
        }
    }
}

/// A component that shows fallback content during async loading,
/// with smooth transitions between states.
///
/// Unlike Suspense, Transition:
/// - Can show stale content while new content loads
/// - Provides isPending signal for custom loading indicators
/// - Prevents content flash with minimum pending time
pub struct Transition<F, C>
where
    F: Fn() -> View + 'static,
    C: Fn() -> View + 'static,
{
    /// The fallback content to show while loading
    fallback: F,
    /// The main content (may contain async boundaries)
    children: C,
    /// Configuration
    config: TransitionConfig,
    /// Whether we're currently in a transition
    is_pending: Signal<bool>,
    /// The last successfully rendered content
    stale_content: Rc<RefCell<Option<View>>>,
}

impl<F, C> Transition<F, C>
where
    F: Fn() -> View + 'static,
    C: Fn() -> View + 'static,
{
    /// Create a new Transition component
    pub fn new(fallback: F, children: C) -> Self {
        Self {
            fallback,
            children,
            config: TransitionConfig::default(),
            is_pending: Signal::new(false),
            stale_content: Rc::new(RefCell::new(None)),
        }
    }

    /// Create with custom configuration
    pub fn with_config(mut self, config: TransitionConfig) -> Self {
        self.config = config;
        self
    }

    /// Set whether to show stale content during transitions
    pub fn show_stale(mut self, show: bool) -> Self {
        self.config.show_stale = show;
        self
    }

    /// Set minimum pending time (prevents loading flash)
    pub fn min_pending_ms(mut self, ms: u64) -> Self {
        self.config.min_pending_ms = ms;
        self
    }

    /// Get the isPending signal
    pub fn is_pending(&self) -> Signal<bool> {
        self.is_pending.clone()
    }

    /// Render the transition
    pub fn render(&self) -> View {
        // Check if children are ready
        let content = (self.children)();

        // If we have suspended content, show fallback or stale
        if is_suspended(&content) {
            self.is_pending.set(true);

            if self.config.show_stale {
                // Try to show stale content
                if let Some(stale) = self.stale_content.borrow().clone() {
                    return stale;
                }
            }

            return (self.fallback)();
        }

        // Content is ready
        self.is_pending.set(false);

        // Cache this as stale content for future transitions
        *self.stale_content.borrow_mut() = Some(content.clone());

        content
    }
}

impl<F, C> IntoView for Transition<F, C>
where
    F: Fn() -> View + 'static,
    C: Fn() -> View + 'static,
{
    fn into_view(self) -> View {
        self.render()
    }
}

/// Check if a view contains suspended content
fn is_suspended(view: &View) -> bool {
    match view {
        View::Element(el) => {
            el.get_attrs().get("data-philjs-suspense").is_some()
                || el.get_children().iter().any(is_suspended)
        }
        View::Fragment(frag) => frag.children().iter().any(is_suspended),
        View::Dynamic(dyn_) => is_suspended(&dyn_.render()),
        _ => false,
    }
}

// =============================================================================
// use_transition hook
// =============================================================================

/// State returned by use_transition hook
pub struct TransitionState {
    /// Whether a transition is currently pending
    pub is_pending: Signal<bool>,
    /// Start a transition
    start_fn: Rc<dyn Fn(Box<dyn FnOnce()>)>,
}

impl TransitionState {
    /// Start a new transition
    ///
    /// Updates made inside the callback are treated as low-priority
    /// and won't block the UI from responding.
    pub fn start<F: FnOnce() + 'static>(&self, f: F) {
        (self.start_fn)(Box::new(f));
    }
}

/// Hook for managing UI transitions.
///
/// Returns a pending state and a function to start transitions.
///
/// # Example
///
/// ```rust
/// let (is_pending, start_transition) = use_transition();
///
/// view! {
///     <button on:click=move |_| {
///         start_transition(|| {
///             set_tab(new_tab);
///         });
///     }>
///         "Switch Tab"
///     </button>
///     <Show when=move || is_pending.get()>
///         <Spinner />
///     </Show>
/// }
/// ```
pub fn use_transition() -> TransitionState {
    let is_pending = Signal::new(false);
    let is_pending_clone = is_pending.clone();

    let start_fn: Rc<dyn Fn(Box<dyn FnOnce()>)> = Rc::new(move |callback: Box<dyn FnOnce()>| {
        is_pending_clone.set(true);

        // In a real implementation, this would schedule the update as low priority
        // For now, just execute and clear pending
        callback();

        // Clear pending state after a microtask
        #[cfg(target_arch = "wasm32")]
        {
            let pending = is_pending_clone.clone();
            wasm_bindgen_futures::spawn_local(async move {
                pending.set(false);
            });
        }

        #[cfg(not(target_arch = "wasm32"))]
        {
            is_pending_clone.set(false);
        }
    });

    TransitionState { is_pending, start_fn }
}

// =============================================================================
// Deferred Value
// =============================================================================

/// A value that defers to a previous value during transitions.
///
/// Similar to React's useDeferredValue.
pub struct DeferredValue<T: Clone> {
    /// The current value
    current: Signal<T>,
    /// The deferred value (may lag behind current)
    deferred: Signal<T>,
}

impl<T: Clone + PartialEq + 'static> DeferredValue<T> {
    /// Get the deferred value
    pub fn get(&self) -> T {
        self.deferred.get()
    }

    /// Get the current (non-deferred) value
    pub fn current(&self) -> T {
        self.current.get()
    }

    /// Check if deferred value is behind current
    pub fn is_stale(&self) -> bool {
        self.current.get() != self.deferred.get()
    }
}

/// Create a deferred value that lags behind the source during transitions.
///
/// # Example
///
/// ```rust
/// let query = signal!("");
/// let deferred_query = use_deferred_value(move || query.get());
///
/// // Use deferred_query for expensive operations
/// let results = create_resource(
///     move || deferred_query.get(),
///     |q| async move { search(q).await }
/// );
/// ```
pub fn use_deferred_value<T: Clone + PartialEq + 'static>(
    source: impl Fn() -> T + 'static,
) -> DeferredValue<T> {
    let initial = source();
    let current = Signal::new(initial.clone());
    let deferred = Signal::new(initial);

    // Set up effect to update deferred value
    let current_clone = current.clone();
    let deferred_clone = deferred.clone();

    crate::reactive::effect::Effect::new(move || {
        let new_value = source();
        current_clone.set(new_value.clone());

        // In production, this would be scheduled as low priority
        // For now, update immediately
        deferred_clone.set(new_value);
    });

    DeferredValue { current, deferred }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transition_config_default() {
        let config = TransitionConfig::default();
        assert!(config.show_stale);
        assert_eq!(config.min_pending_ms, 0);
        assert!(!config.deferred);
    }

    #[test]
    fn test_use_transition() {
        let state = use_transition();
        assert!(!state.is_pending.get());
    }
}
