//! PhilJS Application builder

use axum::{
    body::Body,
    extract::State,
    http::Request,
    middleware::{self, Next},
    response::Response,
    Router,
};
use std::sync::Arc;
use tower::ServiceBuilder;
use tower_http::{
    compression::CompressionLayer,
    trace::TraceLayer,
};

use crate::state::AppState;

/// PhilJS Application builder
pub struct PhilJSApp {
    router: Router<AppState>,
    state: AppState,
    #[cfg(feature = "static-files")]
    static_dir: Option<String>,
    #[cfg(feature = "compression")]
    compression: bool,
}

impl PhilJSApp {
    /// Create a new PhilJS application
    pub fn new() -> Self {
        PhilJSApp {
            router: Router::new(),
            state: AppState::default(),
            #[cfg(feature = "static-files")]
            static_dir: None,
            #[cfg(feature = "compression")]
            compression: true,
        }
    }

    /// Add a route
    pub fn route(mut self, path: &str, method_router: axum::routing::MethodRouter<AppState>) -> Self {
        self.router = self.router.route(path, method_router);
        self
    }

    /// Nest a router under a path
    pub fn nest(mut self, path: &str, router: Router<AppState>) -> Self {
        self.router = self.router.nest(path, router);
        self
    }

    /// Merge another router
    pub fn merge(mut self, router: Router<AppState>) -> Self {
        self.router = self.router.merge(router);
        self
    }

    /// Add middleware layer
    pub fn layer<L>(mut self, layer: L) -> Self
    where
        L: tower::Layer<axum::routing::Route> + Clone + Send + 'static,
        L::Service: tower::Service<Request<Body>, Response = Response<Body>, Error = std::convert::Infallible>
            + Clone
            + Send
            + 'static,
        <L::Service as tower::Service<Request<Body>>>::Future: Send + 'static,
    {
        self.router = self.router.layer(layer);
        self
    }

    /// Set application state
    pub fn with_state(mut self, state: AppState) -> Self {
        self.state = state;
        self
    }

    /// Serve static files from a directory
    #[cfg(feature = "static-files")]
    pub fn static_files(mut self, dir: impl Into<String>) -> Self {
        self.static_dir = Some(dir.into());
        self
    }

    /// Enable/disable compression
    #[cfg(feature = "compression")]
    pub fn compression(mut self, enabled: bool) -> Self {
        self.compression = enabled;
        self
    }

    /// Build the application into an Axum Router
    pub fn build(self) -> Router {
        let mut router = self.router;

        // Add static file serving
        #[cfg(feature = "static-files")]
        if let Some(dir) = self.static_dir {
            use tower_http::services::ServeDir;
            router = router.nest_service("/static", ServeDir::new(dir));
        }

        // Add middleware stack
        let mut service_builder = ServiceBuilder::new()
            .layer(TraceLayer::new_for_http());

        #[cfg(feature = "compression")]
        if self.compression {
            service_builder = service_builder.layer(CompressionLayer::new());
        }

        router
            .layer(service_builder)
            .with_state(self.state)
    }

    /// Run the application
    pub async fn run(self, addr: &str) -> Result<(), Box<dyn std::error::Error>> {
        let app = self.build();
        let listener = tokio::net::TcpListener::bind(addr).await?;

        tracing::info!("Server running at http://{}", addr);

        axum::serve(listener, app).await?;

        Ok(())
    }
}

impl Default for PhilJSApp {
    fn default() -> Self {
        Self::new()
    }
}

/// Logging middleware
pub async fn logging_middleware(
    req: Request<Body>,
    next: Next,
) -> Response {
    let method = req.method().clone();
    let uri = req.uri().clone();

    let start = std::time::Instant::now();
    let response = next.run(req).await;
    let duration = start.elapsed();

    tracing::info!(
        method = %method,
        uri = %uri,
        status = %response.status(),
        duration = ?duration,
        "Request completed"
    );

    response
}
