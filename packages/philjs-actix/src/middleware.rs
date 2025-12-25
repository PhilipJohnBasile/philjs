//! Middleware components for PhilJS Actix integration

use actix_web::{
    body::{BoxBody, EitherBody, MessageBody},
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    http::header::{self, ContentEncoding, HeaderValue},
    Error, HttpResponse,
};
use futures::future::{ok, Ready, LocalBoxFuture};
use std::rc::Rc;
use std::cell::RefCell;
use std::task::{Context, Poll};
use std::time::Instant;
use tracing::{info, warn, span, Level};

/// SSR Middleware for server-side rendering
pub struct SsrMiddleware {
    /// Enable streaming SSR
    pub streaming: bool,
    /// Inject hydration scripts
    pub hydration: bool,
}

impl Default for SsrMiddleware {
    fn default() -> Self {
        Self {
            streaming: false,
            hydration: true,
        }
    }
}

impl SsrMiddleware {
    /// Create a new SSR middleware
    pub fn new() -> Self {
        Self::default()
    }

    /// Enable streaming SSR
    pub fn streaming(mut self, enabled: bool) -> Self {
        self.streaming = enabled;
        self
    }

    /// Enable hydration script injection
    pub fn hydration(mut self, enabled: bool) -> Self {
        self.hydration = enabled;
        self
    }
}

impl<S, B> Transform<S, ServiceRequest> for SsrMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<EitherBody<B, BoxBody>>;
    type Error = Error;
    type InitError = ();
    type Transform = SsrMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(SsrMiddlewareService {
            service: Rc::new(RefCell::new(service)),
            streaming: self.streaming,
            hydration: self.hydration,
        })
    }
}

/// SSR Middleware Service
pub struct SsrMiddlewareService<S> {
    service: Rc<RefCell<S>>,
    streaming: bool,
    hydration: bool,
}

impl<S, B> Service<ServiceRequest> for SsrMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<EitherBody<B, BoxBody>>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&self, ctx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.borrow_mut().poll_ready(ctx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let hydration = self.hydration;

        Box::pin(async move {
            let res = service.borrow_mut().call(req).await?;

            // Check if this is an HTML response that needs hydration script
            if hydration {
                let content_type = res.headers()
                    .get(header::CONTENT_TYPE)
                    .and_then(|v| v.to_str().ok())
                    .unwrap_or("");

                if content_type.contains("text/html") {
                    // For now, pass through - hydration is handled in render functions
                    return Ok(res.map_into_left_body());
                }
            }

            Ok(res.map_into_left_body())
        })
    }
}

/// Compression middleware with configurable settings
pub struct CompressionMiddleware {
    /// Minimum size to compress (bytes)
    pub min_size: usize,
    /// Compression level (1-9)
    pub level: u32,
}

impl Default for CompressionMiddleware {
    fn default() -> Self {
        Self {
            min_size: 1024,
            level: 6,
        }
    }
}

impl CompressionMiddleware {
    /// Create new compression middleware
    pub fn new() -> Self {
        Self::default()
    }

    /// Set minimum size to compress
    pub fn min_size(mut self, size: usize) -> Self {
        self.min_size = size;
        self
    }

    /// Set compression level
    pub fn level(mut self, level: u32) -> Self {
        self.level = level.clamp(1, 9);
        self
    }
}

impl<S, B> Transform<S, ServiceRequest> for CompressionMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<EitherBody<B, BoxBody>>;
    type Error = Error;
    type InitError = ();
    type Transform = CompressionMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(CompressionMiddlewareService {
            service: Rc::new(RefCell::new(service)),
            min_size: self.min_size,
        })
    }
}

/// Compression middleware service
pub struct CompressionMiddlewareService<S> {
    service: Rc<RefCell<S>>,
    min_size: usize,
}

impl<S, B> Service<ServiceRequest> for CompressionMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<EitherBody<B, BoxBody>>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&self, ctx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.borrow_mut().poll_ready(ctx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();

        Box::pin(async move {
            let res = service.borrow_mut().call(req).await?;
            Ok(res.map_into_left_body())
        })
    }
}

/// Tracing middleware for request logging
pub struct TracingMiddleware {
    /// Log level for requests
    pub level: Level,
    /// Include response body size
    pub log_body_size: bool,
}

impl Default for TracingMiddleware {
    fn default() -> Self {
        Self {
            level: Level::INFO,
            log_body_size: true,
        }
    }
}

impl TracingMiddleware {
    /// Create new tracing middleware
    pub fn new() -> Self {
        Self::default()
    }

    /// Set log level
    pub fn level(mut self, level: Level) -> Self {
        self.level = level;
        self
    }

    /// Enable/disable body size logging
    pub fn log_body_size(mut self, enabled: bool) -> Self {
        self.log_body_size = enabled;
        self
    }
}

impl<S, B> Transform<S, ServiceRequest> for TracingMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = TracingMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(TracingMiddlewareService {
            service: Rc::new(RefCell::new(service)),
            log_body_size: self.log_body_size,
        })
    }
}

/// Tracing middleware service
pub struct TracingMiddlewareService<S> {
    service: Rc<RefCell<S>>,
    log_body_size: bool,
}

impl<S, B> Service<ServiceRequest> for TracingMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&self, ctx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.borrow_mut().poll_ready(ctx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let method = req.method().clone();
        let path = req.path().to_string();
        let service = self.service.clone();
        let log_body_size = self.log_body_size;

        Box::pin(async move {
            let start = Instant::now();
            let res = service.borrow_mut().call(req).await?;
            let duration = start.elapsed();

            let status = res.status();
            let size = if log_body_size {
                res.response().body().size().to_string()
            } else {
                "-".to_string()
            };

            info!(
                method = %method,
                path = %path,
                status = %status.as_u16(),
                duration = ?duration,
                size = %size,
                "Request completed"
            );

            Ok(res)
        })
    }
}

/// CORS middleware configuration
pub struct CorsMiddleware {
    /// Allowed origins
    pub origins: Vec<String>,
    /// Allowed methods
    pub methods: Vec<String>,
    /// Allowed headers
    pub headers: Vec<String>,
    /// Allow credentials
    pub credentials: bool,
    /// Max age for preflight cache
    pub max_age: u32,
}

impl Default for CorsMiddleware {
    fn default() -> Self {
        Self {
            origins: vec!["*".to_string()],
            methods: vec![
                "GET".to_string(),
                "POST".to_string(),
                "PUT".to_string(),
                "PATCH".to_string(),
                "DELETE".to_string(),
                "OPTIONS".to_string(),
            ],
            headers: vec![
                "Content-Type".to_string(),
                "Authorization".to_string(),
                "X-Requested-With".to_string(),
            ],
            credentials: true,
            max_age: 3600,
        }
    }
}

impl CorsMiddleware {
    /// Create new CORS middleware
    pub fn new() -> Self {
        Self::default()
    }

    /// Set allowed origins
    pub fn origins<I, S>(mut self, origins: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        self.origins = origins.into_iter().map(|s| s.into()).collect();
        self
    }

    /// Set allowed methods
    pub fn methods<I, S>(mut self, methods: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        self.methods = methods.into_iter().map(|s| s.into()).collect();
        self
    }

    /// Set allowed headers
    pub fn headers<I, S>(mut self, headers: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        self.headers = headers.into_iter().map(|s| s.into()).collect();
        self
    }

    /// Enable/disable credentials
    pub fn credentials(mut self, enabled: bool) -> Self {
        self.credentials = enabled;
        self
    }

    /// Set max age for preflight cache
    pub fn max_age(mut self, seconds: u32) -> Self {
        self.max_age = seconds;
        self
    }
}

/// Security headers middleware
pub struct SecurityHeadersMiddleware {
    /// Content Security Policy
    pub csp: Option<String>,
    /// X-Frame-Options
    pub frame_options: String,
    /// X-Content-Type-Options
    pub content_type_options: String,
    /// Referrer-Policy
    pub referrer_policy: String,
}

impl Default for SecurityHeadersMiddleware {
    fn default() -> Self {
        Self {
            csp: None,
            frame_options: "DENY".to_string(),
            content_type_options: "nosniff".to_string(),
            referrer_policy: "strict-origin-when-cross-origin".to_string(),
        }
    }
}

impl SecurityHeadersMiddleware {
    /// Create new security headers middleware
    pub fn new() -> Self {
        Self::default()
    }

    /// Set Content Security Policy
    pub fn csp(mut self, policy: impl Into<String>) -> Self {
        self.csp = Some(policy.into());
        self
    }

    /// Set X-Frame-Options
    pub fn frame_options(mut self, value: impl Into<String>) -> Self {
        self.frame_options = value.into();
        self
    }
}
