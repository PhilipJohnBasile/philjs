//! View types for building UI
//!
//! This module provides the core view types and helper functions for
//! building reactive UI components.

pub mod element;
pub mod text;
pub mod fragment;
pub mod dynamic;
pub mod children;
pub mod into_view;
pub mod view;

pub use element::Element;
pub use text::Text;
pub use fragment::Fragment;
pub use dynamic::Dynamic;
pub use children::Children;
pub use into_view::IntoView;
pub use view::View;

// ============================================================================
// Helper Functions (used by view! macro)
// ============================================================================

/// Create an HTML element with the given tag name.
pub fn element(tag: &str) -> Element {
    Element::new(tag)
}

/// Create an HTML element with a namespace (e.g., SVG).
pub fn element_ns(namespace: &str, tag: &str) -> Element {
    Element::new_ns(namespace, tag)
}

/// Create a text node.
pub fn text(content: impl Into<String>) -> Text {
    Text::new(content.into())
}

/// Create a fragment from a vector of views.
pub fn fragment(children: Vec<impl IntoView>) -> Fragment {
    Fragment::new(children.into_iter().map(|c| c.into_view()).collect())
}

/// Create an empty view.
pub fn empty() -> View {
    View::Empty
}

// ============================================================================
// Control Flow Components
// ============================================================================

/// Conditional rendering component.
pub struct Show<W, C, F> {
    when: W,
    children: C,
    fallback: F,
}

impl<W, C, F, V1, V2> Show<W, C, F>
where
    W: Fn() -> bool + 'static,
    C: Fn() -> V1 + 'static,
    F: Fn() -> V2 + 'static,
    V1: IntoView,
    V2: IntoView,
{
    /// Create a new Show component.
    pub fn new(when: W, children: C, fallback: F) -> Self {
        Show { when, children, fallback }
    }
}

impl<W, C, F, V1, V2> IntoView for Show<W, C, F>
where
    W: Fn() -> bool + 'static,
    C: Fn() -> V1 + 'static,
    F: Fn() -> V2 + 'static,
    V1: IntoView,
    V2: IntoView,
{
    fn into_view(self) -> View {
        Dynamic::new(move || {
            if (self.when)() {
                (self.children)().into_view()
            } else {
                (self.fallback)().into_view()
            }
        }).into()
    }
}

/// Iteration component for rendering lists.
pub struct For<E, K, C> {
    each: E,
    key: K,
    children: C,
}

impl<T, E, K, KV, C, V> For<E, K, C>
where
    T: Clone + 'static,
    E: Fn() -> Vec<T> + 'static,
    K: Fn(&T) -> KV + 'static,
    KV: std::hash::Hash + Eq,
    C: Fn(T) -> V + 'static,
    V: IntoView,
{
    /// Create a new For component.
    pub fn new(each: E, key: K, children: C) -> Self {
        For { each, key, children }
    }
}

impl<T, E, K, KV, C, V> IntoView for For<E, K, C>
where
    T: Clone + 'static,
    E: Fn() -> Vec<T> + 'static,
    K: Fn(&T) -> KV + 'static,
    KV: std::hash::Hash + Eq,
    C: Fn(T) -> V + 'static,
    V: IntoView,
{
    fn into_view(self) -> View {
        Dynamic::new(move || {
            let items = (self.each)();
            let views: Vec<View> = items
                .into_iter()
                .map(|item| (self.children)(item).into_view())
                .collect();
            Fragment::new(views)
        }).into()
    }
}

/// Suspense boundary for async content.
pub struct Suspense<F, C> {
    fallback: F,
    children: C,
}

impl<F, C, V1, V2> Suspense<F, C>
where
    F: Fn() -> V1 + 'static,
    C: Fn() -> V2 + 'static,
    V1: IntoView,
    V2: IntoView,
{
    /// Create a new Suspense component.
    pub fn new(fallback: F, children: C) -> Self {
        Suspense { fallback, children }
    }
}

impl<F, C, V1, V2> IntoView for Suspense<F, C>
where
    F: Fn() -> V1 + 'static,
    C: Fn() -> V2 + 'static,
    V1: IntoView,
    V2: IntoView,
{
    fn into_view(self) -> View {
        // For now, just render children (async support would need runtime)
        (self.children)().into_view()
    }
}

/// Error boundary for catching rendering errors.
pub struct ErrorBoundary<F, C> {
    fallback: F,
    children: C,
}

impl<F, C, V> ErrorBoundary<F, C>
where
    F: Fn(String) -> V + 'static,
    C: Fn() -> V + 'static,
    V: IntoView,
{
    /// Create a new ErrorBoundary component.
    pub fn new(fallback: F, children: C) -> Self {
        ErrorBoundary { fallback, children }
    }
}

impl<F, C, V> IntoView for ErrorBoundary<F, C>
where
    F: Fn(String) -> V + 'static,
    C: Fn() -> V + 'static,
    V: IntoView,
{
    fn into_view(self) -> View {
        // For now, just render children (error catching would need runtime)
        (self.children)().into_view()
    }
}

/// Portal for rendering content outside the normal DOM hierarchy.
pub struct Portal<M, C> {
    mount: M,
    children: C,
}

impl<M, C, V> Portal<M, C>
where
    M: Clone + 'static,
    C: Fn() -> V + 'static,
    V: IntoView,
{
    /// Create a new Portal component.
    pub fn new(mount: M, children: C) -> Self {
        Portal { mount, children }
    }
}

impl<M, C, V> IntoView for Portal<M, C>
where
    M: Clone + 'static,
    C: Fn() -> V + 'static,
    V: IntoView,
{
    fn into_view(self) -> View {
        // For SSR, just render children inline
        (self.children)().into_view()
    }
}

/// Slot for component composition.
pub struct Slot {
    name: Option<String>,
}

impl Slot {
    /// Create a default (unnamed) slot.
    pub fn default() -> Self {
        Slot { name: None }
    }

    /// Create a named slot.
    pub fn named(name: impl Into<String>) -> Self {
        Slot { name: Some(name.into()) }
    }
}

impl IntoView for Slot {
    fn into_view(self) -> View {
        View::Empty
    }
}

// =============================================================================
// New Modules for Leptos Parity
// =============================================================================

pub mod transition;
pub mod animated;

pub use transition::{Transition, TransitionConfig, TransitionState, use_transition, DeferredValue, use_deferred_value};
pub use animated::{AnimatedShow, AnimatedShowConfig, AnimationState, Easing, fade, slide, scale, Presence, ANIMATION_CSS};
