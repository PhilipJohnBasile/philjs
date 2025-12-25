//! Application state management for PhilJS Rocket integration

use std::sync::Arc;
use std::collections::HashMap;
use parking_lot::RwLock;

/// Application state shared across handlers
#[derive(Clone)]
pub struct AppState {
    /// Inner state
    inner: Arc<AppStateInner>,
}

struct AppStateInner {
    /// Custom state data
    data: RwLock<HashMap<String, Box<dyn std::any::Any + Send + Sync>>>,
    /// Configuration
    config: RwLock<HashMap<String, String>>,
}

impl AppState {
    /// Create a new application state
    pub fn new() -> Self {
        Self {
            inner: Arc::new(AppStateInner {
                data: RwLock::new(HashMap::new()),
                config: RwLock::new(HashMap::new()),
            }),
        }
    }

    /// Create a builder for application state
    pub fn builder() -> AppStateBuilder {
        AppStateBuilder::default()
    }

    /// Insert a value into the state
    pub fn insert<T: Send + Sync + 'static>(&self, key: impl Into<String>, value: T) {
        self.inner.data.write().insert(key.into(), Box::new(value));
    }

    /// Get a value from the state
    pub fn get<T: 'static>(&self, key: &str) -> Option<T>
    where
        T: Clone,
    {
        self.inner
            .data
            .read()
            .get(key)
            .and_then(|v| v.downcast_ref::<T>())
            .cloned()
    }

    /// Get a reference to a value from the state
    pub fn with<T: 'static, F, R>(&self, key: &str, f: F) -> Option<R>
    where
        F: FnOnce(&T) -> R,
    {
        self.inner
            .data
            .read()
            .get(key)
            .and_then(|v| v.downcast_ref::<T>())
            .map(f)
    }

    /// Check if a key exists
    pub fn contains(&self, key: &str) -> bool {
        self.inner.data.read().contains_key(key)
    }

    /// Remove a value from the state
    pub fn remove(&self, key: &str) -> bool {
        self.inner.data.write().remove(key).is_some()
    }

    /// Set a configuration value
    pub fn set_config(&self, key: impl Into<String>, value: impl Into<String>) {
        self.inner.config.write().insert(key.into(), value.into());
    }

    /// Get a configuration value
    pub fn get_config(&self, key: &str) -> Option<String> {
        self.inner.config.read().get(key).cloned()
    }

    /// Get a configuration value with default
    pub fn get_config_or(&self, key: &str, default: &str) -> String {
        self.inner
            .config
            .read()
            .get(key)
            .cloned()
            .unwrap_or_else(|| default.to_string())
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

/// Builder for application state
#[derive(Default)]
pub struct AppStateBuilder {
    data: HashMap<String, Box<dyn std::any::Any + Send + Sync>>,
    config: HashMap<String, String>,
}

impl AppStateBuilder {
    /// Create a new builder
    pub fn new() -> Self {
        Self::default()
    }

    /// Add a value to the state
    pub fn with<T: Send + Sync + 'static>(mut self, key: impl Into<String>, value: T) -> Self {
        self.data.insert(key.into(), Box::new(value));
        self
    }

    /// Add a configuration value
    pub fn config(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.config.insert(key.into(), value.into());
        self
    }

    /// Build the application state
    pub fn build(self) -> AppState {
        let state = AppState::new();

        for (key, value) in self.data {
            state.inner.data.write().insert(key, value);
        }

        for (key, value) in self.config {
            state.inner.config.write().insert(key, value);
        }

        state
    }
}

/// Database connection pool state (placeholder for integration)
#[derive(Clone)]
pub struct DbPool {
    /// Connection string
    connection_string: String,
    /// Max connections
    max_connections: u32,
}

impl DbPool {
    /// Create a new database pool configuration
    pub fn new(connection_string: impl Into<String>) -> Self {
        Self {
            connection_string: connection_string.into(),
            max_connections: 10,
        }
    }

    /// Set max connections
    pub fn max_connections(mut self, max: u32) -> Self {
        self.max_connections = max;
        self
    }

    /// Get the connection string
    pub fn connection_string(&self) -> &str {
        &self.connection_string
    }
}

/// Cache state (placeholder for integration)
#[derive(Clone)]
pub struct CacheState {
    /// Cache entries
    entries: Arc<RwLock<HashMap<String, CacheEntry>>>,
    /// Default TTL in seconds
    default_ttl: u64,
}

#[derive(Clone)]
struct CacheEntry {
    value: String,
    expires_at: u64,
}

impl CacheState {
    /// Create a new cache state
    pub fn new(default_ttl: u64) -> Self {
        Self {
            entries: Arc::new(RwLock::new(HashMap::new())),
            default_ttl,
        }
    }

    /// Get a value from the cache
    pub fn get(&self, key: &str) -> Option<String> {
        let entries = self.entries.read();
        let entry = entries.get(key)?;

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        if entry.expires_at > now {
            Some(entry.value.clone())
        } else {
            None
        }
    }

    /// Set a value in the cache
    pub fn set(&self, key: impl Into<String>, value: impl Into<String>) {
        self.set_with_ttl(key, value, self.default_ttl);
    }

    /// Set a value with custom TTL
    pub fn set_with_ttl(&self, key: impl Into<String>, value: impl Into<String>, ttl: u64) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        self.entries.write().insert(
            key.into(),
            CacheEntry {
                value: value.into(),
                expires_at: now + ttl,
            },
        );
    }

    /// Remove a value from the cache
    pub fn remove(&self, key: &str) -> bool {
        self.entries.write().remove(key).is_some()
    }

    /// Clear all expired entries
    pub fn cleanup(&self) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        self.entries.write().retain(|_, v| v.expires_at > now);
    }
}

impl Default for CacheState {
    fn default() -> Self {
        Self::new(300) // 5 minutes default
    }
}

/// Session state (placeholder for integration)
#[derive(Clone)]
pub struct SessionState {
    /// Sessions
    sessions: Arc<RwLock<HashMap<String, SessionData>>>,
    /// Session TTL in seconds
    ttl: u64,
}

#[derive(Clone)]
struct SessionData {
    data: HashMap<String, serde_json::Value>,
    expires_at: u64,
}

impl SessionState {
    /// Create a new session state
    pub fn new(ttl: u64) -> Self {
        Self {
            sessions: Arc::new(RwLock::new(HashMap::new())),
            ttl,
        }
    }

    /// Create a new session
    pub fn create(&self) -> String {
        let id = uuid::Uuid::new_v4().to_string();
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        self.sessions.write().insert(
            id.clone(),
            SessionData {
                data: HashMap::new(),
                expires_at: now + self.ttl,
            },
        );

        id
    }

    /// Get session data
    pub fn get(&self, session_id: &str, key: &str) -> Option<serde_json::Value> {
        let sessions = self.sessions.read();
        let session = sessions.get(session_id)?;

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        if session.expires_at > now {
            session.data.get(key).cloned()
        } else {
            None
        }
    }

    /// Set session data
    pub fn set(&self, session_id: &str, key: impl Into<String>, value: serde_json::Value) -> bool {
        let mut sessions = self.sessions.write();

        if let Some(session) = sessions.get_mut(session_id) {
            session.data.insert(key.into(), value);
            true
        } else {
            false
        }
    }

    /// Destroy a session
    pub fn destroy(&self, session_id: &str) -> bool {
        self.sessions.write().remove(session_id).is_some()
    }

    /// Cleanup expired sessions
    pub fn cleanup(&self) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        self.sessions.write().retain(|_, v| v.expires_at > now);
    }
}

impl Default for SessionState {
    fn default() -> Self {
        Self::new(3600) // 1 hour default
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_state() {
        let state = AppState::new();
        state.insert("count", 42i32);

        assert!(state.contains("count"));
        assert_eq!(state.get::<i32>("count"), Some(42));
        assert!(state.remove("count"));
        assert!(!state.contains("count"));
    }

    #[test]
    fn test_app_state_builder() {
        let state = AppState::builder()
            .with("name", "test".to_string())
            .config("env", "development")
            .build();

        assert_eq!(state.get::<String>("name"), Some("test".to_string()));
        assert_eq!(state.get_config("env"), Some("development".to_string()));
    }

    #[test]
    fn test_cache_state() {
        let cache = CacheState::new(300);
        cache.set("key1", "value1");

        assert_eq!(cache.get("key1"), Some("value1".to_string()));
        assert!(cache.get("nonexistent").is_none());
    }

    #[test]
    fn test_session_state() {
        let sessions = SessionState::new(3600);
        let session_id = sessions.create();

        sessions.set(&session_id, "user_id", serde_json::json!(123));
        assert_eq!(
            sessions.get(&session_id, "user_id"),
            Some(serde_json::json!(123))
        );

        sessions.destroy(&session_id);
        assert!(sessions.get(&session_id, "user_id").is_none());
    }
}
