//! PhilJS Rust Router
//!
//! Type-safe routing with compile-time verification.
//! Inspired by Leptos Router and Axum Router.
//!
//! # Example
//! ```rust
//! use philjs_rust::router::*;
//!
//! #[derive(Params)]
//! struct UserParams {
//!     id: u64,
//! }
//!
//! #[component]
//! fn UserPage(params: UserParams) -> impl IntoView {
//!     view! { <h1>"User: " {params.id}</h1> }
//! }
//!
//! let routes = routes![
//!     ("/" => HomePage),
//!     ("/users/:id" => UserPage),
//!     ("/posts/*rest" => PostsPage),
//! ];
//! ```

use std::collections::HashMap;
use std::sync::Arc;

use crate::reactive::Signal;
use crate::view::IntoView;

// ============================================================================
// Types
// ============================================================================

/// Route parameters extracted from the URL path
#[derive(Debug, Clone, Default)]
pub struct Params {
    inner: HashMap<String, String>,
}

impl Params {
    pub fn new() -> Self {
        Self { inner: HashMap::new() }
    }

    pub fn get(&self, key: &str) -> Option<&String> {
        self.inner.get(key)
    }

    pub fn insert(&mut self, key: String, value: String) {
        self.inner.insert(key, value);
    }

    /// Parse parameter as a specific type
    pub fn get_as<T: std::str::FromStr>(&self, key: &str) -> Option<T> {
        self.inner.get(key).and_then(|v| v.parse().ok())
    }
}

/// Query string parameters
#[derive(Debug, Clone, Default)]
pub struct Query {
    inner: HashMap<String, String>,
}

impl Query {
    pub fn new() -> Self {
        Self { inner: HashMap::new() }
    }

    pub fn get(&self, key: &str) -> Option<&String> {
        self.inner.get(key)
    }

    pub fn get_all(&self, key: &str) -> Vec<&String> {
        // For simplicity, just return single value
        self.inner.get(key).into_iter().collect()
    }

    pub fn parse(query_string: &str) -> Self {
        let mut query = Self::new();
        for pair in query_string.split('&') {
            if let Some((key, value)) = pair.split_once('=') {
                query.inner.insert(
                    urlencoding_decode(key),
                    urlencoding_decode(value),
                );
            }
        }
        query
    }
}

fn urlencoding_decode(s: &str) -> String {
    // Simple URL decoding
    s.replace('+', " ")
        .replace("%20", " ")
        .replace("%2F", "/")
        .replace("%3A", ":")
        .replace("%3F", "?")
        .replace("%3D", "=")
        .replace("%26", "&")
}

/// Current location state
#[derive(Debug, Clone)]
pub struct Location {
    pub pathname: String,
    pub search: String,
    pub hash: String,
    pub state: Option<String>,
}

impl Location {
    pub fn current() -> Self {
        #[cfg(target_arch = "wasm32")]
        {
            use wasm_bindgen::JsCast;
            let window = web_sys::window().unwrap();
            let location = window.location();

            Self {
                pathname: location.pathname().unwrap_or_default(),
                search: location.search().unwrap_or_default(),
                hash: location.hash().unwrap_or_default(),
                state: None,
            }
        }

        #[cfg(not(target_arch = "wasm32"))]
        {
            Self {
                pathname: "/".to_string(),
                search: String::new(),
                hash: String::new(),
                state: None,
            }
        }
    }
}

// ============================================================================
// Route Definition
// ============================================================================

/// A single route definition
pub struct Route<V: IntoView> {
    pub path: &'static str,
    pub component: fn() -> V,
    pub children: Vec<Route<V>>,
}

impl<V: IntoView> Route<V> {
    pub fn new(path: &'static str, component: fn() -> V) -> Self {
        Self {
            path,
            component,
            children: Vec::new(),
        }
    }

    pub fn with_children(mut self, children: Vec<Route<V>>) -> Self {
        self.children = children;
        self
    }
}

/// Route matching result
#[derive(Debug, Clone)]
pub struct RouteMatch {
    pub path: String,
    pub params: Params,
    pub query: Query,
}

// ============================================================================
// Router
// ============================================================================

/// The main router struct
pub struct Router<V: IntoView> {
    routes: Vec<Route<V>>,
    fallback: Option<fn() -> V>,
    base_path: String,
}

impl<V: IntoView> Router<V> {
    pub fn new(routes: Vec<Route<V>>) -> Self {
        Self {
            routes,
            fallback: None,
            base_path: String::new(),
        }
    }

    pub fn with_fallback(mut self, fallback: fn() -> V) -> Self {
        self.fallback = Some(fallback);
        self
    }

    pub fn with_base(mut self, base: impl Into<String>) -> Self {
        self.base_path = base.into();
        self
    }

    /// Match a path against routes
    pub fn match_path(&self, path: &str) -> Option<(&Route<V>, Params)> {
        let path = path.strip_prefix(&self.base_path).unwrap_or(path);

        for route in &self.routes {
            if let Some(params) = self.match_route(route, path) {
                return Some((route, params));
            }
        }

        None
    }

    fn match_route(&self, route: &Route<V>, path: &str) -> Option<Params> {
        let route_segments: Vec<&str> = route.path.split('/').filter(|s| !s.is_empty()).collect();
        let path_segments: Vec<&str> = path.split('/').filter(|s| !s.is_empty()).collect();

        let mut params = Params::new();
        let mut path_idx = 0;

        for (i, segment) in route_segments.iter().enumerate() {
            if segment.starts_with(':') {
                // Dynamic parameter
                if path_idx >= path_segments.len() {
                    return None;
                }
                let param_name = &segment[1..];
                params.insert(param_name.to_string(), path_segments[path_idx].to_string());
                path_idx += 1;
            } else if segment.starts_with('*') {
                // Catch-all (rest)
                let param_name = &segment[1..];
                let rest: String = path_segments[path_idx..].join("/");
                params.insert(param_name.to_string(), rest);
                return Some(params);
            } else {
                // Static segment
                if path_idx >= path_segments.len() || *segment != path_segments[path_idx] {
                    return None;
                }
                path_idx += 1;
            }
        }

        // Check if we consumed all path segments (unless catch-all)
        if path_idx == path_segments.len() {
            Some(params)
        } else {
            None
        }
    }
}

// ============================================================================
// Navigation
// ============================================================================

/// Navigator for programmatic navigation
pub struct Navigator {
    _private: (),
}

impl Navigator {
    pub fn new() -> Self {
        Self { _private: () }
    }

    /// Navigate to a new path
    pub fn push(&self, path: &str) {
        #[cfg(target_arch = "wasm32")]
        {
            use wasm_bindgen::JsCast;
            let window = web_sys::window().unwrap();
            let history = window.history().unwrap();
            history.push_state_with_url(&wasm_bindgen::JsValue::NULL, "", Some(path)).ok();

            // Dispatch popstate event
            let event = web_sys::Event::new("popstate").unwrap();
            window.dispatch_event(&event).ok();
        }
    }

    /// Replace current path
    pub fn replace(&self, path: &str) {
        #[cfg(target_arch = "wasm32")]
        {
            use wasm_bindgen::JsCast;
            let window = web_sys::window().unwrap();
            let history = window.history().unwrap();
            history.replace_state_with_url(&wasm_bindgen::JsValue::NULL, "", Some(path)).ok();
        }
    }

    /// Go back in history
    pub fn back(&self) {
        #[cfg(target_arch = "wasm32")]
        {
            let window = web_sys::window().unwrap();
            let history = window.history().unwrap();
            history.back().ok();
        }
    }

    /// Go forward in history
    pub fn forward(&self) {
        #[cfg(target_arch = "wasm32")]
        {
            let window = web_sys::window().unwrap();
            let history = window.history().unwrap();
            history.forward().ok();
        }
    }

    /// Go to specific history entry
    pub fn go(&self, delta: i32) {
        #[cfg(target_arch = "wasm32")]
        {
            let window = web_sys::window().unwrap();
            let history = window.history().unwrap();
            history.go_with_delta(delta).ok();
        }
    }
}

// ============================================================================
// Hooks
// ============================================================================

/// Get current location
pub fn use_location() -> Signal<Location> {
    let location = Signal::new(Location::current());

    #[cfg(target_arch = "wasm32")]
    {
        use wasm_bindgen::prelude::*;
        use wasm_bindgen::JsCast;

        let location_clone = location.clone();
        let closure = Closure::wrap(Box::new(move || {
            location_clone.set(Location::current());
        }) as Box<dyn Fn()>);

        let window = web_sys::window().unwrap();
        window.add_event_listener_with_callback("popstate", closure.as_ref().unchecked_ref()).ok();
        closure.forget();
    }

    location
}

/// Get current route params
pub fn use_params() -> Signal<Params> {
    Signal::new(Params::new())
}

/// Get current query params
pub fn use_query() -> Signal<Query> {
    let location = Location::current();
    let query = Query::parse(&location.search.trim_start_matches('?'));
    Signal::new(query)
}

/// Get navigator for programmatic navigation
pub fn use_navigate() -> Navigator {
    Navigator::new()
}

// ============================================================================
// Link Component
// ============================================================================

/// Props for Link component
pub struct LinkProps {
    pub href: String,
    pub class: Option<String>,
    pub active_class: Option<String>,
    pub replace: bool,
}

impl Default for LinkProps {
    fn default() -> Self {
        Self {
            href: String::new(),
            class: None,
            active_class: None,
            replace: false,
        }
    }
}

// ============================================================================
// Macros
// ============================================================================

/// Define routes with a declarative syntax
#[macro_export]
macro_rules! routes {
    ($(($path:expr => $component:ident)),* $(,)?) => {
        vec![
            $(
                $crate::router::Route::new($path, $component),
            )*
        ]
    };
}

/// Define nested routes
#[macro_export]
macro_rules! nested_routes {
    ($path:expr => $component:ident {
        $($child_path:expr => $child_component:ident),* $(,)?
    }) => {
        $crate::router::Route::new($path, $component)
            .with_children(vec![
                $(
                    $crate::router::Route::new($child_path, $child_component),
                )*
            ])
    };
}

// ============================================================================
// Re-exports
// ============================================================================

pub use crate::routes;
pub use crate::nested_routes;

// =============================================================================
// Form Components for Progressive Enhancement
// =============================================================================

pub mod form;

pub use form::{Form, FormMethod, FormEnctype, FormData, FormValue, ActionForm, MultiActionForm, use_submit, use_form_data, use_action_form};
