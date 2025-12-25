//! Middleware utilities for PhilJS Rocket integration
//!
//! Note: Rocket uses fairings instead of traditional middleware.
//! This module provides middleware-like patterns and helpers.

use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::Header;
use rocket::{Request, Response, Data};
use std::time::Instant;
use tracing::info;

/// Request timing middleware (as fairing)
pub struct TimingMiddleware;

impl TimingMiddleware {
    /// Create a new timing middleware
    pub fn new() -> Self {
        Self
    }
}

impl Default for TimingMiddleware {
    fn default() -> Self {
        Self::new()
    }
}

#[rocket::async_trait]
impl Fairing for TimingMiddleware {
    fn info(&self) -> Info {
        Info {
            name: "Request Timing",
            kind: Kind::Request | Kind::Response,
        }
    }

    async fn on_request(&self, request: &mut Request<'_>, _data: &mut Data<'_>) {
        request.local_cache(|| Instant::now());
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        let start = request.local_cache(|| Instant::now());
        let duration = start.elapsed();

        response.set_header(Header::new(
            "X-Response-Time",
            format!("{:.3}ms", duration.as_secs_f64() * 1000.0),
        ));
    }
}

/// Request ID middleware
pub struct RequestIdMiddleware;

impl RequestIdMiddleware {
    /// Create a new request ID middleware
    pub fn new() -> Self {
        Self
    }
}

impl Default for RequestIdMiddleware {
    fn default() -> Self {
        Self::new()
    }
}

#[rocket::async_trait]
impl Fairing for RequestIdMiddleware {
    fn info(&self) -> Info {
        Info {
            name: "Request ID",
            kind: Kind::Request | Kind::Response,
        }
    }

    async fn on_request(&self, request: &mut Request<'_>, _data: &mut Data<'_>) {
        let request_id = uuid::Uuid::new_v4().to_string();
        request.local_cache(|| request_id);
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        let request_id = request.local_cache(|| uuid::Uuid::new_v4().to_string());
        response.set_header(Header::new("X-Request-Id", request_id.clone()));
    }
}

/// Compression middleware settings
pub struct CompressionConfig {
    /// Minimum size to compress (bytes)
    pub min_size: usize,
    /// Compression level (1-9)
    pub level: u32,
}

impl Default for CompressionConfig {
    fn default() -> Self {
        Self {
            min_size: 1024,
            level: 6,
        }
    }
}

/// Rate limiting configuration
pub struct RateLimitConfig {
    /// Maximum requests per window
    pub max_requests: u32,
    /// Window duration in seconds
    pub window_seconds: u64,
}

impl Default for RateLimitConfig {
    fn default() -> Self {
        Self {
            max_requests: 100,
            window_seconds: 60,
        }
    }
}

/// Logging middleware
pub struct LoggingMiddleware {
    /// Log level
    level: tracing::Level,
    /// Include request body
    log_body: bool,
}

impl LoggingMiddleware {
    /// Create a new logging middleware
    pub fn new() -> Self {
        Self {
            level: tracing::Level::INFO,
            log_body: false,
        }
    }

    /// Set log level
    pub fn level(mut self, level: tracing::Level) -> Self {
        self.level = level;
        self
    }

    /// Enable body logging
    pub fn log_body(mut self, enabled: bool) -> Self {
        self.log_body = enabled;
        self
    }
}

impl Default for LoggingMiddleware {
    fn default() -> Self {
        Self::new()
    }
}

#[rocket::async_trait]
impl Fairing for LoggingMiddleware {
    fn info(&self) -> Info {
        Info {
            name: "Request Logging",
            kind: Kind::Request | Kind::Response,
        }
    }

    async fn on_request(&self, request: &mut Request<'_>, _data: &mut Data<'_>) {
        let method = request.method();
        let uri = request.uri();

        info!(
            method = %method,
            uri = %uri,
            "Incoming request"
        );

        request.local_cache(|| Instant::now());
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        let start = request.local_cache(|| Instant::now());
        let duration = start.elapsed();
        let status = response.status();

        info!(
            status = %status.code,
            duration = ?duration,
            "Request completed"
        );
    }
}

/// Cache control configuration
#[derive(Clone)]
pub struct CacheControl {
    /// Cache directive
    directive: String,
    /// Max age in seconds
    max_age: Option<u32>,
}

impl CacheControl {
    /// Create no-cache directive
    pub fn no_cache() -> Self {
        Self {
            directive: "no-cache, no-store, must-revalidate".to_string(),
            max_age: None,
        }
    }

    /// Create public cache directive
    pub fn public(max_age: u32) -> Self {
        Self {
            directive: format!("public, max-age={}", max_age),
            max_age: Some(max_age),
        }
    }

    /// Create private cache directive
    pub fn private(max_age: u32) -> Self {
        Self {
            directive: format!("private, max-age={}", max_age),
            max_age: Some(max_age),
        }
    }

    /// Create immutable cache directive
    pub fn immutable(max_age: u32) -> Self {
        Self {
            directive: format!("public, max-age={}, immutable", max_age),
            max_age: Some(max_age),
        }
    }

    /// Get the directive string
    pub fn as_str(&self) -> &str {
        &self.directive
    }
}

/// Middleware chain helper
pub struct MiddlewareChain {
    fairings: Vec<Box<dyn Fairing>>,
}

impl MiddlewareChain {
    /// Create a new middleware chain
    pub fn new() -> Self {
        Self {
            fairings: Vec::new(),
        }
    }

    /// Add a fairing to the chain
    pub fn add<F: Fairing + 'static>(mut self, fairing: F) -> Self {
        self.fairings.push(Box::new(fairing));
        self
    }

    /// Get all fairings
    pub fn into_fairings(self) -> Vec<Box<dyn Fairing>> {
        self.fairings
    }
}

impl Default for MiddlewareChain {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cache_control() {
        let no_cache = CacheControl::no_cache();
        assert!(no_cache.as_str().contains("no-cache"));

        let public = CacheControl::public(3600);
        assert!(public.as_str().contains("public"));
        assert!(public.as_str().contains("3600"));

        let immutable = CacheControl::immutable(31536000);
        assert!(immutable.as_str().contains("immutable"));
    }

    #[test]
    fn test_middleware_chain() {
        let chain = MiddlewareChain::new()
            .add(TimingMiddleware::new())
            .add(RequestIdMiddleware::new())
            .add(LoggingMiddleware::new());

        let fairings = chain.into_fairings();
        assert_eq!(fairings.len(), 3);
    }
}
