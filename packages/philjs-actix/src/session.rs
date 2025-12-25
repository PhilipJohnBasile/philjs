//! Session management for PhilJS Actix

use actix_session::{Session, SessionMiddleware, storage::CookieSessionStore};
use actix_web::{cookie::{Key, SameSite}, web, HttpRequest, HttpResponse};
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use std::time::Duration;
use uuid::Uuid;

/// Session configuration
#[derive(Clone)]
pub struct SessionConfig {
    /// Secret key for signing cookies
    key: Key,
    /// Session cookie name
    cookie_name: String,
    /// Cookie path
    path: String,
    /// Cookie domain
    domain: Option<String>,
    /// Secure flag (HTTPS only)
    secure: bool,
    /// HTTP only flag
    http_only: bool,
    /// SameSite policy
    same_site: SameSite,
    /// Session TTL
    ttl: Duration,
}

impl Default for SessionConfig {
    fn default() -> Self {
        Self {
            key: Key::generate(),
            cookie_name: "philjs_session".to_string(),
            path: "/".to_string(),
            domain: None,
            secure: true,
            http_only: true,
            same_site: SameSite::Lax,
            ttl: Duration::from_secs(24 * 60 * 60), // 24 hours
        }
    }
}

impl SessionConfig {
    /// Create a new session config
    pub fn new() -> Self {
        Self::default()
    }

    /// Set the secret key from bytes
    pub fn key(mut self, key: &[u8]) -> Self {
        self.key = Key::from(key);
        self
    }

    /// Set the secret key from a string
    pub fn key_from_str(mut self, key: &str) -> Self {
        // Derive a key from the string
        let mut key_bytes = [0u8; 64];
        let key_str = key.as_bytes();
        for (i, byte) in key_str.iter().take(64).enumerate() {
            key_bytes[i] = *byte;
        }
        self.key = Key::from(&key_bytes);
        self
    }

    /// Set the cookie name
    pub fn cookie_name(mut self, name: impl Into<String>) -> Self {
        self.cookie_name = name.into();
        self
    }

    /// Set the cookie path
    pub fn path(mut self, path: impl Into<String>) -> Self {
        self.path = path.into();
        self
    }

    /// Set the cookie domain
    pub fn domain(mut self, domain: impl Into<String>) -> Self {
        self.domain = Some(domain.into());
        self
    }

    /// Set secure flag
    pub fn secure(mut self, secure: bool) -> Self {
        self.secure = secure;
        self
    }

    /// Set HTTP only flag
    pub fn http_only(mut self, http_only: bool) -> Self {
        self.http_only = http_only;
        self
    }

    /// Set SameSite policy
    pub fn same_site(mut self, same_site: SameSite) -> Self {
        self.same_site = same_site;
        self
    }

    /// Set session TTL
    pub fn ttl(mut self, ttl: Duration) -> Self {
        self.ttl = ttl;
        self
    }

    /// Build the session middleware
    pub fn build(&self) -> SessionMiddleware<CookieSessionStore> {
        let mut builder = SessionMiddleware::builder(
            CookieSessionStore::default(),
            self.key.clone(),
        )
        .cookie_name(self.cookie_name.clone())
        .cookie_path(self.path.clone())
        .cookie_secure(self.secure)
        .cookie_http_only(self.http_only)
        .cookie_same_site(self.same_site)
        .session_lifecycle(
            actix_session::config::PersistentSession::default()
                .session_ttl(actix_web::cookie::time::Duration::seconds(self.ttl.as_secs() as i64))
        );

        if let Some(ref domain) = self.domain {
            builder = builder.cookie_domain(Some(domain.clone()));
        }

        builder.build()
    }
}

/// Session manager for convenient session operations
pub struct SessionManager;

impl SessionManager {
    /// Get a value from the session
    pub fn get<T: DeserializeOwned>(session: &Session, key: &str) -> Option<T> {
        session.get(key).ok().flatten()
    }

    /// Set a value in the session
    pub fn set<T: Serialize>(session: &Session, key: &str, value: T) -> Result<(), SessionError> {
        session.insert(key, value).map_err(|e| SessionError::InsertError(e.to_string()))
    }

    /// Remove a value from the session
    pub fn remove(session: &Session, key: &str) -> Option<String> {
        session.remove(key)
    }

    /// Clear the session
    pub fn clear(session: &Session) {
        session.purge();
    }

    /// Renew the session ID
    pub fn renew(session: &Session) {
        session.renew();
    }

    /// Get or create a session ID
    pub fn get_or_create_id(session: &Session) -> String {
        match session.get::<String>("session_id") {
            Ok(Some(id)) => id,
            _ => {
                let id = Uuid::new_v4().to_string();
                let _ = session.insert("session_id", &id);
                id
            }
        }
    }

    /// Check if a key exists in the session
    pub fn contains(session: &Session, key: &str) -> bool {
        session.get::<serde_json::Value>(key).ok().flatten().is_some()
    }
}

/// Session error types
#[derive(Debug, thiserror::Error)]
pub enum SessionError {
    /// Error inserting value
    #[error("Failed to insert session value: {0}")]
    InsertError(String),
    /// Error getting value
    #[error("Failed to get session value: {0}")]
    GetError(String),
    /// Session not found
    #[error("Session not found")]
    NotFound,
    /// Session expired
    #[error("Session expired")]
    Expired,
}

/// User session data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSession {
    /// User ID
    pub user_id: Option<String>,
    /// Username
    pub username: Option<String>,
    /// Roles
    pub roles: Vec<String>,
    /// Custom data
    pub data: std::collections::HashMap<String, serde_json::Value>,
    /// Created at timestamp
    pub created_at: i64,
    /// Last accessed timestamp
    pub last_accessed: i64,
}

impl Default for UserSession {
    fn default() -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        Self {
            user_id: None,
            username: None,
            roles: Vec::new(),
            data: std::collections::HashMap::new(),
            created_at: now,
            last_accessed: now,
        }
    }
}

impl UserSession {
    /// Create a new user session
    pub fn new() -> Self {
        Self::default()
    }

    /// Set user ID
    pub fn with_user_id(mut self, id: impl Into<String>) -> Self {
        self.user_id = Some(id.into());
        self
    }

    /// Set username
    pub fn with_username(mut self, username: impl Into<String>) -> Self {
        self.username = Some(username.into());
        self
    }

    /// Add a role
    pub fn with_role(mut self, role: impl Into<String>) -> Self {
        self.roles.push(role.into());
        self
    }

    /// Set custom data
    pub fn with_data<T: Serialize>(mut self, key: &str, value: T) -> Self {
        if let Ok(json) = serde_json::to_value(value) {
            self.data.insert(key.to_string(), json);
        }
        self
    }

    /// Check if user is authenticated
    pub fn is_authenticated(&self) -> bool {
        self.user_id.is_some()
    }

    /// Check if user has a role
    pub fn has_role(&self, role: &str) -> bool {
        self.roles.iter().any(|r| r == role)
    }

    /// Get custom data
    pub fn get_data<T: DeserializeOwned>(&self, key: &str) -> Option<T> {
        self.data.get(key).and_then(|v| serde_json::from_value(v.clone()).ok())
    }

    /// Update last accessed time
    pub fn touch(&mut self) {
        self.last_accessed = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
    }

    /// Save to session
    pub fn save(&self, session: &Session) -> Result<(), SessionError> {
        SessionManager::set(session, "user_session", self)
    }

    /// Load from session
    pub fn load(session: &Session) -> Option<Self> {
        SessionManager::get(session, "user_session")
    }

    /// Clear from session
    pub fn clear(session: &Session) {
        SessionManager::remove(session, "user_session");
    }
}

/// Flash message types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FlashLevel {
    /// Success message
    Success,
    /// Info message
    Info,
    /// Warning message
    Warning,
    /// Error message
    Error,
}

/// Flash message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlashMessage {
    /// Message level
    pub level: FlashLevel,
    /// Message content
    pub message: String,
}

impl FlashMessage {
    /// Create a success flash
    pub fn success(message: impl Into<String>) -> Self {
        Self {
            level: FlashLevel::Success,
            message: message.into(),
        }
    }

    /// Create an info flash
    pub fn info(message: impl Into<String>) -> Self {
        Self {
            level: FlashLevel::Info,
            message: message.into(),
        }
    }

    /// Create a warning flash
    pub fn warning(message: impl Into<String>) -> Self {
        Self {
            level: FlashLevel::Warning,
            message: message.into(),
        }
    }

    /// Create an error flash
    pub fn error(message: impl Into<String>) -> Self {
        Self {
            level: FlashLevel::Error,
            message: message.into(),
        }
    }

    /// Push to session
    pub fn push(&self, session: &Session) {
        let mut flashes: Vec<FlashMessage> = SessionManager::get(session, "_flash").unwrap_or_default();
        flashes.push(self.clone());
        let _ = SessionManager::set(session, "_flash", flashes);
    }

    /// Pop all flashes from session
    pub fn pop_all(session: &Session) -> Vec<FlashMessage> {
        let flashes: Vec<FlashMessage> = SessionManager::get(session, "_flash").unwrap_or_default();
        SessionManager::remove(session, "_flash");
        flashes
    }
}

/// CSRF token management
pub struct CsrfToken;

impl CsrfToken {
    /// Generate a new CSRF token
    pub fn generate(session: &Session) -> String {
        let token = Uuid::new_v4().to_string();
        let _ = SessionManager::set(session, "_csrf_token", &token);
        token
    }

    /// Verify a CSRF token
    pub fn verify(session: &Session, token: &str) -> bool {
        match SessionManager::get::<String>(session, "_csrf_token") {
            Some(stored_token) => stored_token == token,
            None => false,
        }
    }

    /// Get the current token or generate a new one
    pub fn get_or_generate(session: &Session) -> String {
        match SessionManager::get::<String>(session, "_csrf_token") {
            Some(token) => token,
            None => Self::generate(session),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_session_config_default() {
        let config = SessionConfig::default();
        assert_eq!(config.cookie_name, "philjs_session");
        assert!(config.secure);
        assert!(config.http_only);
    }

    #[test]
    fn test_user_session() {
        let session = UserSession::new()
            .with_user_id("123")
            .with_username("testuser")
            .with_role("admin")
            .with_data("custom", "value");

        assert!(session.is_authenticated());
        assert!(session.has_role("admin"));
        assert!(!session.has_role("guest"));
        assert_eq!(session.get_data::<String>("custom"), Some("value".to_string()));
    }

    #[test]
    fn test_flash_message() {
        let flash = FlashMessage::success("Operation completed");
        assert_eq!(flash.level, FlashLevel::Success);
        assert_eq!(flash.message, "Operation completed");
    }
}
