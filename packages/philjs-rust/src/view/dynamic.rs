//! Dynamic/reactive nodes

use std::rc::Rc;

use super::View;
use crate::reactive::signal::Signal;

/// A dynamic node that re-renders when dependencies change.
pub struct Dynamic {
    render: Rc<dyn Fn() -> View>,
}

impl Dynamic {
    /// Create a new dynamic node.
    pub fn new<F, V>(render: F) -> Self
    where
        F: Fn() -> V + 'static,
        V: Into<View>,
    {
        Dynamic {
            render: Rc::new(move || render().into()),
        }
    }

    /// Render the current value.
    pub fn render(&self) -> View {
        (self.render)()
    }

    /// Render to HTML string.
    pub fn to_html(&self) -> String {
        self.render().to_html()
    }
}

impl Clone for Dynamic {
    fn clone(&self) -> Self {
        Dynamic {
            render: Rc::clone(&self.render),
        }
    }
}

impl From<Dynamic> for View {
    fn from(dyn_: Dynamic) -> Self {
        View::Dynamic(Rc::new(dyn_))
    }
}

/// Create a dynamic view from a signal.
impl<T: Clone + Into<View> + 'static> From<Signal<T>> for Dynamic {
    fn from(signal: Signal<T>) -> Self {
        Dynamic::new(move || signal.get())
    }
}

/// Show content conditionally.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// let show = Signal::new(true);
/// view! {
///     {Show(move || show.get(), || view! { <div>"Visible!"</div> })}
/// }
/// ```
pub struct Show<W, F, V>
where
    W: Fn() -> bool + 'static,
    F: Fn() -> V + 'static,
    V: Into<View>,
{
    when: W,
    children: F,
    fallback: Option<Box<dyn Fn() -> View>>,
}

impl<W, F, V> Show<W, F, V>
where
    W: Fn() -> bool + 'static,
    F: Fn() -> V + 'static,
    V: Into<View>,
{
    /// Create a new Show.
    pub fn new(when: W, children: F) -> Self {
        Show {
            when,
            children,
            fallback: None,
        }
    }

    /// Add a fallback for when the condition is false.
    pub fn fallback<FB, VB>(mut self, fallback: FB) -> Self
    where
        FB: Fn() -> VB + 'static,
        VB: Into<View>,
    {
        self.fallback = Some(Box::new(move || fallback().into()));
        self
    }
}

impl<W, F, V> From<Show<W, F, V>> for View
where
    W: Fn() -> bool + 'static,
    F: Fn() -> V + 'static,
    V: Into<View>,
{
    fn from(show: Show<W, F, V>) -> Self {
        Dynamic::new(move || {
            if (show.when)() {
                (show.children)().into()
            } else if let Some(ref fallback) = show.fallback {
                fallback()
            } else {
                View::Empty
            }
        }).into()
    }
}

/// Iterate over a collection and render each item.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// let items = Signal::new(vec!["a", "b", "c"]);
/// view! {
///     <ul>
///         {For(move || items.get(), |item| view! { <li>{item}</li> })}
///     </ul>
/// }
/// ```
pub struct For<T, I, K, V>
where
    I: Fn() -> Vec<T> + 'static,
    K: Fn(&T) -> V + 'static,
    V: Into<View>,
{
    each: I,
    key: Option<Box<dyn Fn(&T) -> String>>,
    children: K,
    _marker: std::marker::PhantomData<T>,
}

impl<T, I, K, V> For<T, I, K, V>
where
    T: 'static,
    I: Fn() -> Vec<T> + 'static,
    K: Fn(&T) -> V + 'static,
    V: Into<View>,
{
    /// Create a new For loop.
    pub fn new(each: I, children: K) -> Self {
        For {
            each,
            key: None,
            children,
            _marker: std::marker::PhantomData,
        }
    }

    /// Add a key function for efficient updates.
    pub fn key<F>(mut self, key: F) -> Self
    where
        F: Fn(&T) -> String + 'static,
    {
        self.key = Some(Box::new(key));
        self
    }
}

impl<T, I, K, V> From<For<T, I, K, V>> for View
where
    T: 'static,
    I: Fn() -> Vec<T> + 'static,
    K: Fn(&T) -> V + 'static,
    V: Into<View>,
{
    fn from(for_loop: For<T, I, K, V>) -> Self {
        Dynamic::new(move || {
            let items = (for_loop.each)();
            let views: Vec<View> = items
                .iter()
                .map(|item| (for_loop.children)(item).into())
                .collect();
            View::Fragment(super::Fragment::new(views))
        }).into()
    }
}
