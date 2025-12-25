//! Application state management for PhilJS Axum
//!
//! This module provides state management utilities for Axum applications,
//! including database connections, caching, and shared configuration.

use std::sync::Arc;
use parking_lot::RwLock;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};

/// Application state shared across handlers
#[derive(Clone)]
pub struct AppState {
    /// Inner state
    inner: Arc<AppStateInner>,
}

struct AppStateInner {
    /// Application name
    name: String,
    /// Application version
    version: String,
    /// Environment (development, staging, production)
    environment: Environment,
    /// Custom configuration
    config: HashMap<String, serde_json::Value>,
    /// In-memory cache
    cache: RwLock<HashMap<String, CacheEntry>>,
}

/// Cache entry with expiration
struct CacheEntry {
    value: serde_json::Value,
    expires_at: Option<std::time::Instant>,
}

/// Application environment
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Environment {
    /// Development environment
    Development,
    /// Staging environment
    Staging,
    /// Production environment
    Production,
}

impl Default for Environment {
    fn default() -> Self {
        Self::Development
    }
}

impl std::fmt::Display for Environment {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Development => write!(f, "development"),
            Self::Staging => write!(f, "staging"),
            Self::Production => write!(f, "production"),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            inner: Arc::new(AppStateInner {
                name: "PhilJS App".to_string(),
                version: "1.0.0".to_string(),
                environment: Environment::Development,
                config: HashMap::new(),
                cache: RwLock::new(HashMap::new()),
            }),
        }
    }
}

impl AppState {
    /// Create a new application state with defaults
    pub fn new() -> Self {
        AppState::default()
    }

    /// Create a builder for application state
    pub fn builder() -> AppStateBuilder {
        AppStateBuilder::default()
    }

    /// Get the application name
    pub fn name(&self) -> &str {
        &self.inner.name
    }

    /// Get the application version
    pub fn version(&self) -> &str {
        &self.inner.version
    }

    /// Get the current environment
    pub fn environment(&self) -> Environment {
        self.inner.environment
    }

    /// Check if running in development mode
    pub fn is_development(&self) -> bool {
        self.inner.environment == Environment::Development
    }

    /// Check if running in production mode
    pub fn is_production(&self) -> bool {
        self.inner.environment == Environment::Production
    }

    /// Get a configuration value
    pub fn config<T: for<'de> Deserialize<'de>>(&self, key: &str) -> Option<T> {
        self.inner.config
            .get(key)
            .and_then(|v| serde_json::from_value(v.clone()).ok())
    }

    /// Get a cached value
    pub fn cache_get<T: for<'de> Deserialize<'de>>(&self, key: &str) -> Option<T> {
        let cache = self.inner.cache.read();
        if let Some(entry) = cache.get(key) {
            // Check expiration
            if let Some(expires_at) = entry.expires_at {
                if std::time::Instant::now() > expires_at {
                    return None;
                }
            }
            serde_json::from_value(entry.value.clone()).ok()
        } else {
            None
        }
    }

    /// Set a cached value
    pub fn cache_set<T: Serialize>(&self, key: &str, value: T, ttl_secs: Option<u64>) {
        if let Ok(json_value) = serde_json::to_value(value) {
            let expires_at = ttl_secs.map(|secs| {
                std::time::Instant::now() + std::time::Duration::from_secs(secs)
            });

            let mut cache = self.inner.cache.write();
            cache.insert(key.to_string(), CacheEntry {
                value: json_value,
                expires_at,
            });
        }
    }

    /// Remove a cached value
    pub fn cache_remove(&self, key: &str) {
        let mut cache = self.inner.cache.write();
        cache.remove(key);
    }

    /// Clear all expired cache entries
    pub fn cache_cleanup(&self) {
        let now = std::time::Instant::now();
        let mut cache = self.inner.cache.write();
        cache.retain(|_, entry| {
            entry.expires_at.map(|e| now < e).unwrap_or(true)
        });
    }

    /// Get cache statistics
    pub fn cache_stats(&self) -> CacheStats {
        let cache = self.inner.cache.read();
        let now = std::time::Instant::now();
        let mut valid = 0;
        let mut expired = 0;

        for entry in cache.values() {
            if entry.expires_at.map(|e| now < e).unwrap_or(true) {
                valid += 1;
            } else {
                expired += 1;
            }
        }

        CacheStats {
            total: cache.len(),
            valid,
            expired,
        }
    }
}

/// Cache statistics
#[derive(Debug, Clone, Serialize)]
pub struct CacheStats {
    /// Total number of entries
    pub total: usize,
    /// Number of valid (non-expired) entries
    pub valid: usize,
    /// Number of expired entries
    pub expired: usize,
}

/// Builder for application state
#[derive(Default)]
pub struct AppStateBuilder {
    name: Option<String>,
    version: Option<String>,
    environment: Option<Environment>,
    config: HashMap<String, serde_json::Value>,
}

impl AppStateBuilder {
    /// Create a new builder
    pub fn new() -> Self {
        Self::default()
    }

    /// Set the application name
    pub fn with_name(mut self, name: impl Into<String>) -> Self {
        self.name = Some(name.into());
        self
    }

    /// Set the application version
    pub fn with_version(mut self, version: impl Into<String>) -> Self {
        self.version = Some(version.into());
        self
    }

    /// Set the environment
    pub fn with_environment(mut self, env: Environment) -> Self {
        self.environment = Some(env);
        self
    }

    /// Set environment from string
    pub fn with_environment_str(mut self, env: &str) -> Self {
        self.environment = Some(match env.to_lowercase().as_str() {
            "production" | "prod" => Environment::Production,
            "staging" | "stage" => Environment::Staging,
            _ => Environment::Development,
        });
        self
    }

    /// Add a configuration value
    pub fn with_config<T: Serialize>(mut self, key: impl Into<String>, value: T) -> Self {
        if let Ok(json_value) = serde_json::to_value(value) {
            self.config.insert(key.into(), json_value);
        }
        self
    }

    /// Build the application state
    pub fn build(self) -> AppState {
        AppState {
            inner: Arc::new(AppStateInner {
                name: self.name.unwrap_or_else(|| "PhilJS App".to_string()),
                version: self.version.unwrap_or_else(|| "1.0.0".to_string()),
                environment: self.environment.unwrap_or_default(),
                config: self.config,
                cache: RwLock::new(HashMap::new()),
            }),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_state_default() {
        let state = AppState::new();
        assert_eq!(state.name(), "PhilJS App");
        assert!(state.is_development());
    }

    #[test]
    fn test_app_state_builder() {
        let state = AppStateBuilder::new()
            .with_name("My App")
            .with_version("2.0.0")
            .with_environment(Environment::Production)
            .with_config("debug", false)
            .build();

        assert_eq!(state.name(), "My App");
        assert_eq!(state.version(), "2.0.0");
        assert!(state.is_production());
        assert_eq!(state.config::<bool>("debug"), Some(false));
    }

    #[test]
    fn test_cache_operations() {
        let state = AppState::new();

        // Set and get
        state.cache_set("key1", "value1", None);
        assert_eq!(state.cache_get::<String>("key1"), Some("value1".to_string()));

        // Remove
        state.cache_remove("key1");
        assert_eq!(state.cache_get::<String>("key1"), None);
    }

    #[test]
    fn test_environment_display() {
        assert_eq!(Environment::Development.to_string(), "development");
        assert_eq!(Environment::Staging.to_string(), "staging");
        assert_eq!(Environment::Production.to_string(), "production");
    }
}
