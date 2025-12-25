//! Configuration for PhilJS Actix integration

use actix_web::web;
use std::path::PathBuf;
use std::sync::Arc;
use parking_lot::RwLock;

/// Configuration for PhilJS application
#[derive(Clone)]
pub struct PhilJsConfig {
    /// Static files directory
    pub static_dir: Option<PathBuf>,
    /// Enable compression
    pub compression: bool,
    /// Enable tracing
    pub tracing: bool,
    /// SSR options
    pub ssr: SsrConfig,
    /// API prefix
    pub api_prefix: String,
    /// Custom configuration data
    pub custom: Arc<RwLock<CustomConfig>>,
}

/// SSR configuration options
#[derive(Clone, Debug)]
pub struct SsrConfig {
    /// Enable streaming SSR
    pub streaming: bool,
    /// Enable hydration script injection
    pub hydration: bool,
    /// Cache rendered pages
    pub cache: bool,
    /// Cache TTL in seconds
    pub cache_ttl: u64,
}

/// Custom configuration storage
#[derive(Default)]
pub struct CustomConfig {
    data: std::collections::HashMap<String, Box<dyn std::any::Any + Send + Sync>>,
}

impl CustomConfig {
    /// Insert a custom configuration value
    pub fn insert<T: Send + Sync + 'static>(&mut self, key: impl Into<String>, value: T) {
        self.data.insert(key.into(), Box::new(value));
    }

    /// Get a custom configuration value
    pub fn get<T: 'static>(&self, key: &str) -> Option<&T> {
        self.data.get(key).and_then(|v| v.downcast_ref())
    }
}

impl Default for PhilJsConfig {
    fn default() -> Self {
        Self {
            static_dir: Some(PathBuf::from("static")),
            compression: true,
            tracing: true,
            ssr: SsrConfig::default(),
            api_prefix: "/api".to_string(),
            custom: Arc::new(RwLock::new(CustomConfig::default())),
        }
    }
}

impl Default for SsrConfig {
    fn default() -> Self {
        Self {
            streaming: false,
            hydration: true,
            cache: false,
            cache_ttl: 300,
        }
    }
}

impl PhilJsConfig {
    /// Create a new configuration with defaults
    pub fn new() -> Self {
        Self::default()
    }

    /// Set static files directory
    pub fn static_dir(mut self, dir: impl Into<PathBuf>) -> Self {
        self.static_dir = Some(dir.into());
        self
    }

    /// Disable static file serving
    pub fn no_static_files(mut self) -> Self {
        self.static_dir = None;
        self
    }

    /// Enable or disable compression
    pub fn compression(mut self, enabled: bool) -> Self {
        self.compression = enabled;
        self
    }

    /// Enable or disable tracing
    pub fn tracing(mut self, enabled: bool) -> Self {
        self.tracing = enabled;
        self
    }

    /// Set SSR configuration
    pub fn ssr_config(mut self, config: SsrConfig) -> Self {
        self.ssr = config;
        self
    }

    /// Enable streaming SSR
    pub fn streaming_ssr(mut self, enabled: bool) -> Self {
        self.ssr.streaming = enabled;
        self
    }

    /// Enable SSR caching
    pub fn enable_cache(mut self, ttl_seconds: u64) -> Self {
        self.ssr.cache = true;
        self.ssr.cache_ttl = ttl_seconds;
        self
    }

    /// Set API prefix
    pub fn api_prefix(mut self, prefix: impl Into<String>) -> Self {
        self.api_prefix = prefix.into();
        self
    }

    /// Add custom configuration
    pub fn with_custom<T: Send + Sync + 'static>(self, key: impl Into<String>, value: T) -> Self {
        self.custom.write().insert(key, value);
        self
    }

    /// Configure an Actix-web App with PhilJS defaults
    pub fn configure(&self, cfg: &mut web::ServiceConfig) {
        // Add config as app data
        cfg.app_data(web::Data::new(self.clone()));

        // Add static file serving
        #[cfg(feature = "static-files")]
        if let Some(ref dir) = self.static_dir {
            use actix_files::Files;
            cfg.service(
                Files::new("/static", dir)
                    .show_files_listing()
                    .use_last_modified(true)
                    .prefer_utf8(true),
            );
        }
    }

    /// Build middleware stack
    pub fn middleware_stack(&self) -> MiddlewareStack {
        MiddlewareStack::new(self.clone())
    }
}

/// Middleware configuration stack
pub struct MiddlewareStack {
    config: PhilJsConfig,
}

impl MiddlewareStack {
    /// Create a new middleware stack
    pub fn new(config: PhilJsConfig) -> Self {
        Self { config }
    }

    /// Get reference to config
    pub fn config(&self) -> &PhilJsConfig {
        &self.config
    }
}

/// Builder for creating PhilJS apps
pub struct PhilJsAppBuilder {
    config: PhilJsConfig,
}

impl PhilJsAppBuilder {
    /// Create a new app builder
    pub fn new() -> Self {
        Self {
            config: PhilJsConfig::default(),
        }
    }

    /// Set configuration
    pub fn config(mut self, config: PhilJsConfig) -> Self {
        self.config = config;
        self
    }

    /// Build the configuration
    pub fn build(self) -> PhilJsConfig {
        self.config
    }
}

impl Default for PhilJsAppBuilder {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = PhilJsConfig::default();
        assert!(config.compression);
        assert!(config.tracing);
        assert!(config.static_dir.is_some());
    }

    #[test]
    fn test_config_builder() {
        let config = PhilJsConfig::new()
            .compression(false)
            .tracing(false)
            .api_prefix("/v1")
            .streaming_ssr(true);

        assert!(!config.compression);
        assert!(!config.tracing);
        assert_eq!(config.api_prefix, "/v1");
        assert!(config.ssr.streaming);
    }

    #[test]
    fn test_custom_config() {
        let config = PhilJsConfig::new()
            .with_custom("database_url", "postgres://localhost".to_string());

        let url: Option<&String> = config.custom.read().get("database_url");
        assert_eq!(url, Some(&"postgres://localhost".to_string()));
    }
}
