//! Advanced CORS configuration for PhilJS Actix
//!
//! This module provides flexible CORS configuration with support for
//! dynamic origin validation and preflight caching.

use actix_web::{
    body::{BoxBody, EitherBody, MessageBody},
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    http::{header::{self, HeaderName, HeaderValue}, Method, StatusCode},
    Error, HttpResponse,
};
use futures::future::{ok, Ready, LocalBoxFuture};
use std::collections::HashSet;
use std::rc::Rc;
use std::cell::RefCell;
use std::task::{Context, Poll};

/// Advanced CORS configuration builder
#[derive(Clone)]
pub struct CorsConfig {
    /// Allowed origins
    allowed_origins: AllowedOrigins,
    /// Allowed methods
    allowed_methods: HashSet<Method>,
    /// Allowed headers
    allowed_headers: HashSet<HeaderName>,
    /// Exposed headers
    exposed_headers: HashSet<HeaderName>,
    /// Allow credentials
    credentials: bool,
    /// Max age for preflight cache (seconds)
    max_age: u32,
    /// Allow private network access
    private_network: bool,
}

/// Origin matching configuration
#[derive(Clone)]
pub enum AllowedOrigins {
    /// Allow any origin
    Any,
    /// Allow specific origins
    List(HashSet<String>),
    /// Allow origins matching patterns
    Patterns(Vec<String>),
    /// Custom validation function
    Custom(Rc<dyn Fn(&str) -> bool>),
}

impl Default for CorsConfig {
    fn default() -> Self {
        let mut methods = HashSet::new();
        methods.insert(Method::GET);
        methods.insert(Method::POST);
        methods.insert(Method::PUT);
        methods.insert(Method::PATCH);
        methods.insert(Method::DELETE);
        methods.insert(Method::OPTIONS);

        let mut headers = HashSet::new();
        headers.insert(header::CONTENT_TYPE);
        headers.insert(header::AUTHORIZATION);
        headers.insert(HeaderName::from_static("x-requested-with"));

        Self {
            allowed_origins: AllowedOrigins::Any,
            allowed_methods: methods,
            allowed_headers: headers,
            exposed_headers: HashSet::new(),
            credentials: false,
            max_age: 3600,
            private_network: false,
        }
    }
}

impl CorsConfig {
    /// Create a new CORS config with defaults
    pub fn new() -> Self {
        Self::default()
    }

    /// Create a permissive CORS config (allow all)
    pub fn permissive() -> Self {
        Self {
            allowed_origins: AllowedOrigins::Any,
            credentials: true,
            ..Self::default()
        }
    }

    /// Create a strict CORS config (no cross-origin allowed)
    pub fn strict() -> Self {
        Self {
            allowed_origins: AllowedOrigins::List(HashSet::new()),
            credentials: false,
            ..Self::default()
        }
    }

    /// Allow any origin
    pub fn allow_any_origin(mut self) -> Self {
        self.allowed_origins = AllowedOrigins::Any;
        self
    }

    /// Allow specific origins
    pub fn allow_origins<I, S>(mut self, origins: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        self.allowed_origins = AllowedOrigins::List(
            origins.into_iter().map(|s| s.into()).collect()
        );
        self
    }

    /// Allow origins matching patterns (supports * wildcard)
    pub fn allow_origin_patterns<I, S>(mut self, patterns: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        self.allowed_origins = AllowedOrigins::Patterns(
            patterns.into_iter().map(|s| s.into()).collect()
        );
        self
    }

    /// Use custom origin validation
    pub fn allow_origin_fn<F>(mut self, f: F) -> Self
    where
        F: Fn(&str) -> bool + 'static,
    {
        self.allowed_origins = AllowedOrigins::Custom(Rc::new(f));
        self
    }

    /// Allow specific methods
    pub fn allow_methods<I>(mut self, methods: I) -> Self
    where
        I: IntoIterator<Item = Method>,
    {
        self.allowed_methods = methods.into_iter().collect();
        self
    }

    /// Allow specific headers
    pub fn allow_headers<I>(mut self, headers: I) -> Self
    where
        I: IntoIterator<Item = HeaderName>,
    {
        self.allowed_headers = headers.into_iter().collect();
        self
    }

    /// Expose headers to the client
    pub fn expose_headers<I>(mut self, headers: I) -> Self
    where
        I: IntoIterator<Item = HeaderName>,
    {
        self.exposed_headers = headers.into_iter().collect();
        self
    }

    /// Allow credentials
    pub fn allow_credentials(mut self, allow: bool) -> Self {
        self.credentials = allow;
        self
    }

    /// Set max age for preflight cache
    pub fn max_age(mut self, seconds: u32) -> Self {
        self.max_age = seconds;
        self
    }

    /// Allow private network access (Chrome's Private Network Access)
    pub fn allow_private_network(mut self, allow: bool) -> Self {
        self.private_network = allow;
        self
    }

    /// Check if origin is allowed
    fn is_origin_allowed(&self, origin: &str) -> bool {
        match &self.allowed_origins {
            AllowedOrigins::Any => true,
            AllowedOrigins::List(list) => list.contains(origin),
            AllowedOrigins::Patterns(patterns) => {
                patterns.iter().any(|pattern| {
                    if pattern == "*" {
                        true
                    } else if pattern.starts_with("*.") {
                        // Match subdomain pattern like *.example.com
                        let suffix = &pattern[1..];
                        origin.ends_with(suffix) || origin == &pattern[2..]
                    } else {
                        pattern == origin
                    }
                })
            }
            AllowedOrigins::Custom(f) => f(origin),
        }
    }

    /// Build the CORS middleware
    pub fn build(self) -> CorsMiddleware {
        CorsMiddleware { config: Rc::new(self) }
    }
}

/// CORS Middleware
pub struct CorsMiddleware {
    config: Rc<CorsConfig>,
}

impl<S, B> Transform<S, ServiceRequest> for CorsMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<EitherBody<B, BoxBody>>;
    type Error = Error;
    type InitError = ();
    type Transform = CorsMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(CorsMiddlewareService {
            service: Rc::new(RefCell::new(service)),
            config: self.config.clone(),
        })
    }
}

/// CORS Middleware Service
pub struct CorsMiddlewareService<S> {
    service: Rc<RefCell<S>>,
    config: Rc<CorsConfig>,
}

impl<S, B> Service<ServiceRequest> for CorsMiddlewareService<S>
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
        let config = self.config.clone();

        Box::pin(async move {
            let origin = req.headers()
                .get(header::ORIGIN)
                .and_then(|v| v.to_str().ok())
                .map(|s| s.to_string());

            // Handle preflight
            if req.method() == Method::OPTIONS {
                if let Some(ref origin) = origin {
                    if config.is_origin_allowed(origin) {
                        let mut res = HttpResponse::NoContent();

                        // Add CORS headers
                        res.insert_header((
                            header::ACCESS_CONTROL_ALLOW_ORIGIN,
                            if matches!(config.allowed_origins, AllowedOrigins::Any) && !config.credentials {
                                "*".to_string()
                            } else {
                                origin.clone()
                            }
                        ));

                        if config.credentials {
                            res.insert_header((
                                header::ACCESS_CONTROL_ALLOW_CREDENTIALS,
                                "true"
                            ));
                        }

                        let methods: String = config.allowed_methods
                            .iter()
                            .map(|m| m.as_str())
                            .collect::<Vec<_>>()
                            .join(", ");
                        res.insert_header((header::ACCESS_CONTROL_ALLOW_METHODS, methods));

                        let headers: String = config.allowed_headers
                            .iter()
                            .map(|h| h.as_str())
                            .collect::<Vec<_>>()
                            .join(", ");
                        res.insert_header((header::ACCESS_CONTROL_ALLOW_HEADERS, headers));

                        res.insert_header((
                            header::ACCESS_CONTROL_MAX_AGE,
                            config.max_age.to_string()
                        ));

                        // Private Network Access
                        if config.private_network {
                            if req.headers().get("Access-Control-Request-Private-Network").is_some() {
                                res.insert_header((
                                    "Access-Control-Allow-Private-Network",
                                    "true"
                                ));
                            }
                        }

                        return Ok(req.into_response(res.finish()).map_into_right_body());
                    }
                }
            }

            // Handle actual request
            let mut res = service.borrow_mut().call(req).await?;

            if let Some(ref origin) = origin {
                if config.is_origin_allowed(origin) {
                    let headers = res.headers_mut();

                    headers.insert(
                        header::ACCESS_CONTROL_ALLOW_ORIGIN,
                        if matches!(config.allowed_origins, AllowedOrigins::Any) && !config.credentials {
                            HeaderValue::from_static("*")
                        } else {
                            HeaderValue::from_str(origin).unwrap_or(HeaderValue::from_static("*"))
                        }
                    );

                    if config.credentials {
                        headers.insert(
                            header::ACCESS_CONTROL_ALLOW_CREDENTIALS,
                            HeaderValue::from_static("true")
                        );
                    }

                    if !config.exposed_headers.is_empty() {
                        let exposed: String = config.exposed_headers
                            .iter()
                            .map(|h| h.as_str())
                            .collect::<Vec<_>>()
                            .join(", ");
                        headers.insert(
                            header::ACCESS_CONTROL_EXPOSE_HEADERS,
                            HeaderValue::from_str(&exposed).unwrap_or(HeaderValue::from_static(""))
                        );
                    }

                    // Vary header for caching
                    headers.insert(
                        header::VARY,
                        HeaderValue::from_static("Origin")
                    );
                }
            }

            Ok(res.map_into_left_body())
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cors_config_default() {
        let config = CorsConfig::new();
        assert!(!config.credentials);
        assert_eq!(config.max_age, 3600);
    }

    #[test]
    fn test_origin_allowed_any() {
        let config = CorsConfig::new().allow_any_origin();
        assert!(config.is_origin_allowed("https://example.com"));
        assert!(config.is_origin_allowed("https://other.com"));
    }

    #[test]
    fn test_origin_allowed_list() {
        let config = CorsConfig::new()
            .allow_origins(["https://example.com", "https://allowed.com"]);
        assert!(config.is_origin_allowed("https://example.com"));
        assert!(config.is_origin_allowed("https://allowed.com"));
        assert!(!config.is_origin_allowed("https://denied.com"));
    }

    #[test]
    fn test_origin_allowed_pattern() {
        let config = CorsConfig::new()
            .allow_origin_patterns(["*.example.com", "https://allowed.com"]);
        assert!(config.is_origin_allowed("https://sub.example.com"));
        assert!(config.is_origin_allowed("https://example.com"));
        assert!(config.is_origin_allowed("https://allowed.com"));
        assert!(!config.is_origin_allowed("https://denied.com"));
    }
}
