//! Rocket fairings for PhilJS integration
//!
//! Fairings are Rocket's mechanism for request/response lifecycle hooks,
//! similar to middleware in other frameworks.

use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::Header;
use rocket::{Request, Response, Data, Build, Rocket};
use std::sync::Arc;
use std::time::Instant;
use tracing::{info, span, Level};

use crate::config::{PhilJsConfig, SsrConfig};

/// SSR Fairing for server-side rendering support
pub struct PhilJsSsrFairing {
    config: SsrConfig,
}

impl PhilJsSsrFairing {
    /// Create a new SSR fairing with default configuration
    pub fn new() -> Self {
        Self {
            config: SsrConfig::default(),
        }
    }

    /// Create with custom configuration
    pub fn with_config(config: SsrConfig) -> Self {
        Self { config }
    }

    /// Enable streaming SSR
    pub fn streaming(mut self, enabled: bool) -> Self {
        self.config.streaming = enabled;
        self
    }

    /// Enable hydration
    pub fn hydration(mut self, enabled: bool) -> Self {
        self.config.hydration = enabled;
        self
    }
}

impl Default for PhilJsSsrFairing {
    fn default() -> Self {
        Self::new()
    }
}

#[rocket::async_trait]
impl Fairing for PhilJsSsrFairing {
    fn info(&self) -> Info {
        Info {
            name: "PhilJS SSR Fairing",
            kind: Kind::Request | Kind::Response,
        }
    }

    async fn on_request(&self, request: &mut Request<'_>, _data: &mut Data<'_>) {
        // Add SSR context to request local state
        request.local_cache(|| self.config.clone());
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        // Add security headers for SSR responses
        if response.content_type().map(|ct| ct.is_html()).unwrap_or(false) {
            response.set_header(Header::new("X-Content-Type-Options", "nosniff"));

            if self.config.streaming {
                response.set_header(Header::new("Transfer-Encoding", "chunked"));
            }
        }
    }
}

/// LiveView Fairing for real-time component updates
pub struct PhilJsLiveViewFairing {
    /// WebSocket path
    ws_path: String,
    /// Heartbeat interval in seconds
    heartbeat_interval: u64,
}

impl PhilJsLiveViewFairing {
    /// Create a new LiveView fairing
    pub fn new() -> Self {
        Self {
            ws_path: "/live".to_string(),
            heartbeat_interval: 30,
        }
    }

    /// Set the WebSocket path
    pub fn ws_path(mut self, path: impl Into<String>) -> Self {
        self.ws_path = path.into();
        self
    }

    /// Set heartbeat interval
    pub fn heartbeat_interval(mut self, seconds: u64) -> Self {
        self.heartbeat_interval = seconds;
        self
    }
}

impl Default for PhilJsLiveViewFairing {
    fn default() -> Self {
        Self::new()
    }
}

#[rocket::async_trait]
impl Fairing for PhilJsLiveViewFairing {
    fn info(&self) -> Info {
        Info {
            name: "PhilJS LiveView Fairing",
            kind: Kind::Ignite | Kind::Request,
        }
    }

    async fn on_ignite(&self, rocket: Rocket<Build>) -> rocket::fairing::Result {
        // Could mount WebSocket routes here
        info!(ws_path = %self.ws_path, "LiveView fairing initialized");
        Ok(rocket)
    }

    async fn on_request(&self, request: &mut Request<'_>, _data: &mut Data<'_>) {
        // Add LiveView context
        request.local_cache(|| LiveViewContext {
            ws_path: self.ws_path.clone(),
            heartbeat_interval: self.heartbeat_interval,
        });
    }
}

/// LiveView context stored in request
#[derive(Clone)]
pub struct LiveViewContext {
    /// WebSocket path
    pub ws_path: String,
    /// Heartbeat interval
    pub heartbeat_interval: u64,
}

/// Metrics fairing for request logging and timing
pub struct PhilJsMetricsFairing {
    /// Log level
    level: Level,
    /// Include response body size
    log_body_size: bool,
}

impl PhilJsMetricsFairing {
    /// Create a new metrics fairing
    pub fn new() -> Self {
        Self {
            level: Level::INFO,
            log_body_size: true,
        }
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

impl Default for PhilJsMetricsFairing {
    fn default() -> Self {
        Self::new()
    }
}

#[rocket::async_trait]
impl Fairing for PhilJsMetricsFairing {
    fn info(&self) -> Info {
        Info {
            name: "PhilJS Metrics Fairing",
            kind: Kind::Request | Kind::Response,
        }
    }

    async fn on_request(&self, request: &mut Request<'_>, _data: &mut Data<'_>) {
        // Store request start time
        request.local_cache(|| Instant::now());
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        let start = request.local_cache(|| Instant::now());
        let duration = start.elapsed();

        let method = request.method();
        let uri = request.uri();
        let status = response.status();

        info!(
            method = %method,
            uri = %uri,
            status = %status.code,
            duration = ?duration,
            "Request completed"
        );
    }
}

/// CORS fairing for cross-origin requests
pub struct PhilJsCorsFairing {
    /// Allowed origins
    origins: Vec<String>,
    /// Allowed methods
    methods: Vec<String>,
    /// Allowed headers
    headers: Vec<String>,
    /// Allow credentials
    credentials: bool,
    /// Max age
    max_age: u32,
}

impl PhilJsCorsFairing {
    /// Create a new CORS fairing
    pub fn new() -> Self {
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

    /// Set max age
    pub fn max_age(mut self, seconds: u32) -> Self {
        self.max_age = seconds;
        self
    }
}

impl Default for PhilJsCorsFairing {
    fn default() -> Self {
        Self::new()
    }
}

#[rocket::async_trait]
impl Fairing for PhilJsCorsFairing {
    fn info(&self) -> Info {
        Info {
            name: "PhilJS CORS Fairing",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, _request: &'r Request<'_>, response: &mut Response<'r>) {
        let origin = self.origins.join(", ");
        let methods = self.methods.join(", ");
        let headers = self.headers.join(", ");

        response.set_header(Header::new("Access-Control-Allow-Origin", origin));
        response.set_header(Header::new("Access-Control-Allow-Methods", methods));
        response.set_header(Header::new("Access-Control-Allow-Headers", headers));
        response.set_header(Header::new("Access-Control-Max-Age", self.max_age.to_string()));

        if self.credentials {
            response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
        }
    }
}

/// Security headers fairing
pub struct PhilJsSecurityFairing {
    /// Content Security Policy
    csp: Option<String>,
    /// X-Frame-Options
    frame_options: String,
    /// X-Content-Type-Options
    content_type_options: String,
    /// Referrer-Policy
    referrer_policy: String,
}

impl PhilJsSecurityFairing {
    /// Create a new security headers fairing
    pub fn new() -> Self {
        Self {
            csp: None,
            frame_options: "DENY".to_string(),
            content_type_options: "nosniff".to_string(),
            referrer_policy: "strict-origin-when-cross-origin".to_string(),
        }
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

    /// Set Referrer-Policy
    pub fn referrer_policy(mut self, policy: impl Into<String>) -> Self {
        self.referrer_policy = policy.into();
        self
    }
}

impl Default for PhilJsSecurityFairing {
    fn default() -> Self {
        Self::new()
    }
}

#[rocket::async_trait]
impl Fairing for PhilJsSecurityFairing {
    fn info(&self) -> Info {
        Info {
            name: "PhilJS Security Headers Fairing",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, _request: &'r Request<'_>, response: &mut Response<'r>) {
        response.set_header(Header::new("X-Frame-Options", self.frame_options.clone()));
        response.set_header(Header::new("X-Content-Type-Options", self.content_type_options.clone()));
        response.set_header(Header::new("Referrer-Policy", self.referrer_policy.clone()));

        if let Some(ref csp) = self.csp {
            response.set_header(Header::new("Content-Security-Policy", csp.clone()));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ssr_fairing_config() {
        let fairing = PhilJsSsrFairing::new()
            .streaming(true)
            .hydration(true);

        assert!(fairing.config.streaming);
        assert!(fairing.config.hydration);
    }

    #[test]
    fn test_liveview_fairing_config() {
        let fairing = PhilJsLiveViewFairing::new()
            .ws_path("/ws")
            .heartbeat_interval(60);

        assert_eq!(fairing.ws_path, "/ws");
        assert_eq!(fairing.heartbeat_interval, 60);
    }

    #[test]
    fn test_cors_fairing_config() {
        let fairing = PhilJsCorsFairing::new()
            .origins(vec!["https://example.com"])
            .credentials(false)
            .max_age(7200);

        assert_eq!(fairing.origins, vec!["https://example.com"]);
        assert!(!fairing.credentials);
        assert_eq!(fairing.max_age, 7200);
    }
}
