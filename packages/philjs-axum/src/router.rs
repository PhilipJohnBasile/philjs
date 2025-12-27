//! File-based router

use axum::Router;
use std::path::Path;

use crate::state::AppState;

/// PhilJS Router with file-based routing support
pub struct PhilJSRouter {
    router: Router<AppState>,
}

impl PhilJSRouter {
    /// Create a new router
    pub fn new() -> Self {
        PhilJSRouter {
            router: Router::new(),
        }
    }

    /// Load routes from a directory
    ///
    /// Note: File-based routing for Rust requires compile-time code generation.
    /// Use the `cargo-philjs` CLI to generate routes from your file structure,
    /// or define routes manually using the `route()` method.
    pub fn from_dir(_path: impl AsRef<Path>) -> Self {
        // File-based routing in Rust requires compile-time code generation
        // via proc macros. For runtime file discovery, use Node.js philjs-cli.
        PhilJSRouter::new()
    }

    /// Get the inner Axum router
    pub fn into_router(self) -> Router<AppState> {
        self.router
    }

    /// Add a route
    pub fn route(mut self, path: &str, method_router: axum::routing::MethodRouter<AppState>) -> Self {
        self.router = self.router.route(path, method_router);
        self
    }
}

impl Default for PhilJSRouter {
    fn default() -> Self {
        Self::new()
    }
}

impl From<PhilJSRouter> for Router<AppState> {
    fn from(router: PhilJSRouter) -> Self {
        router.into_router()
    }
}

/// Route definition macro
#[macro_export]
macro_rules! routes {
    ($($path:literal => $handler:expr),* $(,)?) => {{
        let mut router = $crate::router::PhilJSRouter::new();
        $(
            router = router.route($path, axum::routing::get($handler));
        )*
        router
    }};
}
