//! Tower middleware compatibility for PhilJS Axum
//!
//! This module provides Tower-compatible middleware layers for
//! PhilJS applications.

use axum::{
    body::Body,
    http::{Request, Response, StatusCode, header},
    response::IntoResponse,
};
use std::task::{Context, Poll};
use std::future::Future;
use std::pin::Pin;
use std::time::{Duration, Instant};
use tower::{Layer, Service};
use tracing::{info, warn, span, Level, Instrument};

// ============================================================================
// Tracing Layer
// ============================================================================

/// Tracing layer for request/response logging
#[derive(Clone)]
pub struct TracingLayer {
    level: Level,
    include_headers: bool,
}

impl TracingLayer {
    /// Create a new tracing layer
    pub fn new() -> Self {
        Self {
            level: Level::INFO,
            include_headers: true,
        }
    }

    /// Set the log level
    pub fn level(mut self, level: Level) -> Self {
        self.level = level;
        self
    }

    /// Include headers in logs
    pub fn include_headers(mut self, include: bool) -> Self {
        self.include_headers = include;
        self
    }
}

impl Default for TracingLayer {
    fn default() -> Self {
        Self::new()
    }
}

impl<S> Layer<S> for TracingLayer {
    type Service = TracingMiddleware<S>;

    fn layer(&self, inner: S) -> Self::Service {
        TracingMiddleware {
            inner,
            level: self.level,
            include_headers: self.include_headers,
        }
    }
}

/// Tracing middleware service
#[derive(Clone)]
pub struct TracingMiddleware<S> {
    inner: S,
    level: Level,
    include_headers: bool,
}

impl<S, ReqBody, ResBody> Service<Request<ReqBody>> for TracingMiddleware<S>
where
    S: Service<Request<ReqBody>, Response = Response<ResBody>> + Clone + Send + 'static,
    S::Future: Send,
    ReqBody: Send + 'static,
    ResBody: Send + 'static,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: Request<ReqBody>) -> Self::Future {
        let method = req.method().clone();
        let uri = req.uri().clone();
        let version = req.version();

        let span = span!(
            Level::INFO,
            "request",
            method = %method,
            uri = %uri,
            version = ?version,
        );

        let start = Instant::now();
        let fut = self.inner.call(req);

        Box::pin(
            async move {
                let res = fut.await?;
                let elapsed = start.elapsed();
                let status = res.status();

                info!(
                    target: "philjs::http",
                    status = %status.as_u16(),
                    elapsed_ms = elapsed.as_millis() as u64,
                    "Request completed"
                );

                Ok(res)
            }
            .instrument(span),
        )
    }
}

// ============================================================================
// Timeout Layer
// ============================================================================

/// Timeout layer for request handling
#[derive(Clone)]
pub struct TimeoutLayer {
    timeout: Duration,
}

impl TimeoutLayer {
    /// Create a new timeout layer
    pub fn new(timeout: Duration) -> Self {
        Self { timeout }
    }

    /// Create a timeout layer with seconds
    pub fn from_secs(secs: u64) -> Self {
        Self::new(Duration::from_secs(secs))
    }
}

impl<S> Layer<S> for TimeoutLayer {
    type Service = TimeoutMiddleware<S>;

    fn layer(&self, inner: S) -> Self::Service {
        TimeoutMiddleware {
            inner,
            timeout: self.timeout,
        }
    }
}

/// Timeout middleware service
#[derive(Clone)]
pub struct TimeoutMiddleware<S> {
    inner: S,
    timeout: Duration,
}

impl<S, ReqBody> Service<Request<ReqBody>> for TimeoutMiddleware<S>
where
    S: Service<Request<ReqBody>> + Clone + Send + 'static,
    S::Response: IntoResponse,
    S::Future: Send,
    S::Error: Into<Box<dyn std::error::Error + Send + Sync>>,
    ReqBody: Send + 'static,
{
    type Response = Response<Body>;
    type Error = S::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: Request<ReqBody>) -> Self::Future {
        let timeout = self.timeout;
        let fut = self.inner.call(req);

        Box::pin(async move {
            match tokio::time::timeout(timeout, fut).await {
                Ok(result) => result.map(|r| r.into_response()),
                Err(_) => {
                    warn!("Request timed out after {:?}", timeout);
                    Ok((
                        StatusCode::REQUEST_TIMEOUT,
                        "Request timed out",
                    ).into_response())
                }
            }
        })
    }
}

// ============================================================================
// Request ID Layer
// ============================================================================

/// Request ID header name
pub const REQUEST_ID_HEADER: &str = "x-request-id";

/// Request ID layer
#[derive(Clone, Default)]
pub struct RequestIdLayer;

impl RequestIdLayer {
    /// Create a new request ID layer
    pub fn new() -> Self {
        Self
    }
}

impl<S> Layer<S> for RequestIdLayer {
    type Service = RequestIdMiddleware<S>;

    fn layer(&self, inner: S) -> Self::Service {
        RequestIdMiddleware { inner }
    }
}

/// Request ID middleware service
#[derive(Clone)]
pub struct RequestIdMiddleware<S> {
    inner: S,
}

impl<S, ReqBody, ResBody> Service<Request<ReqBody>> for RequestIdMiddleware<S>
where
    S: Service<Request<ReqBody>, Response = Response<ResBody>> + Clone + Send + 'static,
    S::Future: Send,
    ReqBody: Send + 'static,
    ResBody: Default + Send + 'static,
{
    type Response = Response<ResBody>;
    type Error = S::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, mut req: Request<ReqBody>) -> Self::Future {
        // Get or generate request ID
        let request_id = req.headers()
            .get(REQUEST_ID_HEADER)
            .and_then(|v| v.to_str().ok())
            .map(|s| s.to_string())
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

        // Add request ID to request headers
        req.headers_mut().insert(
            header::HeaderName::from_static(REQUEST_ID_HEADER),
            request_id.parse().unwrap(),
        );

        let fut = self.inner.call(req);
        let request_id_clone = request_id.clone();

        Box::pin(async move {
            let mut res = fut.await?;

            // Add request ID to response headers
            res.headers_mut().insert(
                header::HeaderName::from_static(REQUEST_ID_HEADER),
                request_id_clone.parse().unwrap(),
            );

            Ok(res)
        })
    }
}

// ============================================================================
// Security Headers Layer
// ============================================================================

/// Security headers configuration
#[derive(Clone)]
pub struct SecurityHeadersLayer {
    csp: Option<String>,
    frame_options: String,
    content_type_options: String,
    referrer_policy: String,
    hsts: Option<String>,
}

impl SecurityHeadersLayer {
    /// Create a new security headers layer
    pub fn new() -> Self {
        Self {
            csp: Some("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'".to_string()),
            frame_options: "DENY".to_string(),
            content_type_options: "nosniff".to_string(),
            referrer_policy: "strict-origin-when-cross-origin".to_string(),
            hsts: Some("max-age=31536000; includeSubDomains".to_string()),
        }
    }

    /// Set Content Security Policy
    pub fn csp(mut self, csp: impl Into<String>) -> Self {
        self.csp = Some(csp.into());
        self
    }

    /// Disable CSP
    pub fn no_csp(mut self) -> Self {
        self.csp = None;
        self
    }

    /// Set X-Frame-Options
    pub fn frame_options(mut self, value: impl Into<String>) -> Self {
        self.frame_options = value.into();
        self
    }

    /// Set Referrer-Policy
    pub fn referrer_policy(mut self, value: impl Into<String>) -> Self {
        self.referrer_policy = value.into();
        self
    }

    /// Set HSTS
    pub fn hsts(mut self, value: impl Into<String>) -> Self {
        self.hsts = Some(value.into());
        self
    }

    /// Disable HSTS
    pub fn no_hsts(mut self) -> Self {
        self.hsts = None;
        self
    }
}

impl Default for SecurityHeadersLayer {
    fn default() -> Self {
        Self::new()
    }
}

impl<S> Layer<S> for SecurityHeadersLayer {
    type Service = SecurityHeadersMiddleware<S>;

    fn layer(&self, inner: S) -> Self::Service {
        SecurityHeadersMiddleware {
            inner,
            config: self.clone(),
        }
    }
}

/// Security headers middleware service
#[derive(Clone)]
pub struct SecurityHeadersMiddleware<S> {
    inner: S,
    config: SecurityHeadersLayer,
}

impl<S, ReqBody, ResBody> Service<Request<ReqBody>> for SecurityHeadersMiddleware<S>
where
    S: Service<Request<ReqBody>, Response = Response<ResBody>> + Clone + Send + 'static,
    S::Future: Send,
    ReqBody: Send + 'static,
    ResBody: Send + 'static,
{
    type Response = Response<ResBody>;
    type Error = S::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: Request<ReqBody>) -> Self::Future {
        let config = self.config.clone();
        let fut = self.inner.call(req);

        Box::pin(async move {
            let mut res = fut.await?;
            let headers = res.headers_mut();

            if let Some(ref csp) = config.csp {
                headers.insert(
                    header::CONTENT_SECURITY_POLICY,
                    csp.parse().unwrap(),
                );
            }

            headers.insert(
                header::X_FRAME_OPTIONS,
                config.frame_options.parse().unwrap(),
            );

            headers.insert(
                header::X_CONTENT_TYPE_OPTIONS,
                config.content_type_options.parse().unwrap(),
            );

            headers.insert(
                header::REFERRER_POLICY,
                config.referrer_policy.parse().unwrap(),
            );

            if let Some(ref hsts) = config.hsts {
                headers.insert(
                    header::STRICT_TRANSPORT_SECURITY,
                    hsts.parse().unwrap(),
                );
            }

            Ok(res)
        })
    }
}

// ============================================================================
// Rate Limiting Layer
// ============================================================================

/// Rate limiting layer
#[derive(Clone)]
pub struct RateLimitLayer {
    limit: u32,
    window: Duration,
}

impl RateLimitLayer {
    /// Create a new rate limit layer
    pub fn new(limit: u32, window: Duration) -> Self {
        Self { limit, window }
    }

    /// Create with requests per second
    pub fn per_second(limit: u32) -> Self {
        Self::new(limit, Duration::from_secs(1))
    }

    /// Create with requests per minute
    pub fn per_minute(limit: u32) -> Self {
        Self::new(limit, Duration::from_secs(60))
    }

    /// Create with requests per hour
    pub fn per_hour(limit: u32) -> Self {
        Self::new(limit, Duration::from_secs(3600))
    }
}

impl<S> Layer<S> for RateLimitLayer {
    type Service = RateLimitMiddleware<S>;

    fn layer(&self, inner: S) -> Self::Service {
        RateLimitMiddleware {
            inner,
            limit: self.limit,
            window: self.window,
            state: std::sync::Arc::new(parking_lot::RwLock::new(
                std::collections::HashMap::new()
            )),
        }
    }
}

/// Rate limit middleware service
#[derive(Clone)]
pub struct RateLimitMiddleware<S> {
    inner: S,
    limit: u32,
    window: Duration,
    state: std::sync::Arc<parking_lot::RwLock<std::collections::HashMap<String, (u32, Instant)>>>,
}

impl<S, ReqBody> Service<Request<ReqBody>> for RateLimitMiddleware<S>
where
    S: Service<Request<ReqBody>> + Clone + Send + 'static,
    S::Response: IntoResponse,
    S::Future: Send,
    ReqBody: Send + 'static,
{
    type Response = Response<Body>;
    type Error = S::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: Request<ReqBody>) -> Self::Future {
        // Get client identifier (IP address or other)
        let key = req.headers()
            .get("x-forwarded-for")
            .and_then(|v| v.to_str().ok())
            .map(|s| s.split(',').next().unwrap_or("").trim().to_string())
            .unwrap_or_else(|| "unknown".to_string());

        let now = Instant::now();
        let limit = self.limit;
        let window = self.window;
        let state = self.state.clone();

        // Check rate limit
        let is_limited = {
            let mut state = state.write();

            if let Some((count, started)) = state.get_mut(&key) {
                if now.duration_since(*started) > window {
                    *count = 1;
                    *started = now;
                    false
                } else if *count >= limit {
                    true
                } else {
                    *count += 1;
                    false
                }
            } else {
                state.insert(key.clone(), (1, now));
                false
            }
        };

        if is_limited {
            return Box::pin(async move {
                Ok((
                    StatusCode::TOO_MANY_REQUESTS,
                    [(header::RETRY_AFTER, window.as_secs().to_string())],
                    "Rate limit exceeded",
                ).into_response())
            });
        }

        let fut = self.inner.call(req);

        Box::pin(async move {
            let res = fut.await?;
            Ok(res.into_response())
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tracing_layer() {
        let layer = TracingLayer::new()
            .level(Level::DEBUG)
            .include_headers(false);

        assert!(!layer.include_headers);
    }

    #[test]
    fn test_timeout_layer() {
        let layer = TimeoutLayer::from_secs(30);
        assert_eq!(layer.timeout, Duration::from_secs(30));
    }

    #[test]
    fn test_security_headers_layer() {
        let layer = SecurityHeadersLayer::new()
            .csp("default-src 'none'")
            .frame_options("SAMEORIGIN")
            .no_hsts();

        assert_eq!(layer.csp, Some("default-src 'none'".to_string()));
        assert_eq!(layer.frame_options, "SAMEORIGIN");
        assert!(layer.hsts.is_none());
    }

    #[test]
    fn test_rate_limit_layer() {
        let layer = RateLimitLayer::per_minute(100);
        assert_eq!(layer.limit, 100);
        assert_eq!(layer.window, Duration::from_secs(60));
    }
}
