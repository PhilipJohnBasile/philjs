//! Async resources with loading states

use std::cell::RefCell;
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;

use super::signal::Signal;

/// The state of an async resource.
#[derive(Clone, Debug, PartialEq)]
pub enum ResourceState<T, E = String> {
    /// Initial state, not yet loaded
    Idle,
    /// Currently loading
    Loading,
    /// Successfully loaded
    Ready(T),
    /// Failed to load
    Error(E),
}

impl<T, E> ResourceState<T, E> {
    /// Check if the resource is loading.
    pub fn is_loading(&self) -> bool {
        matches!(self, ResourceState::Loading)
    }

    /// Check if the resource is ready.
    pub fn is_ready(&self) -> bool {
        matches!(self, ResourceState::Ready(_))
    }

    /// Check if the resource has an error.
    pub fn is_error(&self) -> bool {
        matches!(self, ResourceState::Error(_))
    }

    /// Get the value if ready.
    pub fn value(&self) -> Option<&T> {
        match self {
            ResourceState::Ready(v) => Some(v),
            _ => None,
        }
    }

    /// Get the error if present.
    pub fn error(&self) -> Option<&E> {
        match self {
            ResourceState::Error(e) => Some(e),
            _ => None,
        }
    }
}

/// An async resource that fetches data and tracks loading state.
///
/// # Example
/// ```rust
/// use philjs::prelude::*;
///
/// let user_id = Signal::new(1);
///
/// let user = Resource::new(
///     move || user_id.get(),
///     |id| async move {
///         fetch_user(id).await
///     }
/// );
///
/// // In your view:
/// match user.state().get() {
///     ResourceState::Loading => view! { <div>"Loading..."</div> },
///     ResourceState::Ready(user) => view! { <div>{user.name}</div> },
///     ResourceState::Error(e) => view! { <div>"Error: " {e}</div> },
///     _ => view! { <div></div> },
/// }
/// ```
pub struct Resource<T, S = ()>
where
    T: Clone + 'static,
    S: Clone + PartialEq + 'static,
{
    source: Rc<dyn Fn() -> S>,
    fetcher: Rc<dyn Fn(S) -> Pin<Box<dyn Future<Output = Result<T, String>>>>>,
    state: Signal<ResourceState<T>>,
    last_source: RefCell<Option<S>>,
}

impl<T, S> Resource<T, S>
where
    T: Clone + 'static,
    S: Clone + PartialEq + 'static,
{
    /// Create a new resource.
    pub fn new<F, Fut>(source: impl Fn() -> S + 'static, fetcher: F) -> Self
    where
        F: Fn(S) -> Fut + 'static,
        Fut: Future<Output = Result<T, String>> + 'static,
    {
        let fetcher_boxed: Rc<dyn Fn(S) -> Pin<Box<dyn Future<Output = Result<T, String>>>>> =
            Rc::new(move |s| Box::pin(fetcher(s)));

        Resource {
            source: Rc::new(source),
            fetcher: fetcher_boxed,
            state: Signal::new(ResourceState::Idle),
            last_source: RefCell::new(None),
        }
    }

    /// Get the current state.
    pub fn state(&self) -> &Signal<ResourceState<T>> {
        &self.state
    }

    /// Get the value if ready.
    pub fn get(&self) -> Option<T> {
        match self.state.get() {
            ResourceState::Ready(v) => Some(v),
            _ => None,
        }
    }

    /// Check if loading.
    pub fn loading(&self) -> bool {
        self.state.get().is_loading()
    }

    /// Refetch the resource.
    pub fn refetch(&self) {
        let source = (self.source)();
        *self.last_source.borrow_mut() = Some(source.clone());
        self.state.set(ResourceState::Loading);

        // Note: In WASM, this would use wasm_bindgen_futures::spawn_local
        // For now, this is a placeholder showing the API
        let _future = (self.fetcher)(source);
        // spawn_local(async move { ... });
    }

    /// Mutate the resource data locally.
    pub fn mutate(&self, f: impl FnOnce(&mut T)) {
        if let ResourceState::Ready(mut value) = self.state.get() {
            f(&mut value);
            self.state.set(ResourceState::Ready(value));
        }
    }
}

impl<T: Clone + 'static> Resource<T, ()> {
    /// Create a resource without a source (fetches once).
    pub fn once<F, Fut>(fetcher: F) -> Self
    where
        F: Fn(()) -> Fut + 'static,
        Fut: Future<Output = Result<T, String>> + 'static,
    {
        Resource::new(|| (), fetcher)
    }
}

impl<T, S> Clone for Resource<T, S>
where
    T: Clone + 'static,
    S: Clone + PartialEq + 'static,
{
    fn clone(&self) -> Self {
        Resource {
            source: Rc::clone(&self.source),
            fetcher: Rc::clone(&self.fetcher),
            state: self.state.clone(),
            last_source: RefCell::new(self.last_source.borrow().clone()),
        }
    }
}

/// Create a resource that fetches immediately.
pub fn create_resource<T, S, F, Fut>(source: impl Fn() -> S + 'static, fetcher: F) -> Resource<T, S>
where
    T: Clone + 'static,
    S: Clone + PartialEq + 'static,
    F: Fn(S) -> Fut + 'static,
    Fut: Future<Output = Result<T, String>> + 'static,
{
    let resource = Resource::new(source, fetcher);
    resource.refetch();
    resource
}
