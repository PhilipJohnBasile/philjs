//! Error types for PhilJS SeaORM integration

use std::fmt;

/// ORM error type
#[derive(Debug)]
pub enum OrmError {
    /// Connection error
    Connection(String),
    /// Query execution error
    Query(String),
    /// Transaction error
    Transaction(String),
    /// Entity not found
    NotFound,
    /// Multiple entities found
    MultipleFound,
    /// Validation error
    Validation(String),
    /// Migration error
    Migration(String),
    /// Context error
    Context(String),
    /// Serialization error
    Serialization(String),
    /// Unknown error
    Unknown(String),
}

impl fmt::Display for OrmError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            OrmError::Connection(msg) => write!(f, "Connection error: {}", msg),
            OrmError::Query(msg) => write!(f, "Query error: {}", msg),
            OrmError::Transaction(msg) => write!(f, "Transaction error: {}", msg),
            OrmError::NotFound => write!(f, "Entity not found"),
            OrmError::MultipleFound => write!(f, "Multiple entities found, expected one"),
            OrmError::Validation(msg) => write!(f, "Validation error: {}", msg),
            OrmError::Migration(msg) => write!(f, "Migration error: {}", msg),
            OrmError::Context(msg) => write!(f, "Context error: {}", msg),
            OrmError::Serialization(msg) => write!(f, "Serialization error: {}", msg),
            OrmError::Unknown(msg) => write!(f, "Unknown error: {}", msg),
        }
    }
}

impl std::error::Error for OrmError {}

/// Result type alias for ORM operations
pub type OrmResult<T> = Result<T, OrmError>;

impl From<sea_orm::DbErr> for OrmError {
    fn from(err: sea_orm::DbErr) -> Self {
        match err {
            sea_orm::DbErr::RecordNotFound(_) => OrmError::NotFound,
            sea_orm::DbErr::Conn(msg) => OrmError::Connection(msg.to_string()),
            sea_orm::DbErr::Exec(msg) => OrmError::Query(msg.to_string()),
            sea_orm::DbErr::Query(msg) => OrmError::Query(msg.to_string()),
            sea_orm::DbErr::Migration(msg) => OrmError::Migration(msg),
            _ => OrmError::Unknown(err.to_string()),
        }
    }
}

impl From<serde_json::Error> for OrmError {
    fn from(err: serde_json::Error) -> Self {
        OrmError::Serialization(err.to_string())
    }
}

/// Extension trait for converting Option<T> to OrmResult<T>
pub trait OptionExt<T> {
    /// Convert None to OrmError::NotFound
    fn ok_or_not_found(self) -> OrmResult<T>;
}

impl<T> OptionExt<T> for Option<T> {
    fn ok_or_not_found(self) -> OrmResult<T> {
        self.ok_or(OrmError::NotFound)
    }
}

/// Extension trait for adding context to ORM errors
pub trait OrmErrorContext<T> {
    /// Add context to an error
    fn context(self, msg: impl Into<String>) -> OrmResult<T>;

    /// Add context with a closure
    fn with_context<F, S>(self, f: F) -> OrmResult<T>
    where
        F: FnOnce() -> S,
        S: Into<String>;
}

impl<T> OrmErrorContext<T> for OrmResult<T> {
    fn context(self, msg: impl Into<String>) -> OrmResult<T> {
        self.map_err(|e| OrmError::Unknown(format!("{}: {}", msg.into(), e)))
    }

    fn with_context<F, S>(self, f: F) -> OrmResult<T>
    where
        F: FnOnce() -> S,
        S: Into<String>,
    {
        self.map_err(|e| OrmError::Unknown(format!("{}: {}", f().into(), e)))
    }
}

/// Convert OrmError to HTTP status code
impl OrmError {
    /// Get the corresponding HTTP status code
    pub fn status_code(&self) -> u16 {
        match self {
            OrmError::NotFound => 404,
            OrmError::Validation(_) => 422,
            OrmError::Connection(_) => 503,
            _ => 500,
        }
    }

    /// Check if this is a client error (4xx)
    pub fn is_client_error(&self) -> bool {
        matches!(self.status_code(), 400..=499)
    }

    /// Check if this is a server error (5xx)
    pub fn is_server_error(&self) -> bool {
        matches!(self.status_code(), 500..=599)
    }

    /// Check if this is a retryable error
    pub fn is_retryable(&self) -> bool {
        matches!(self, OrmError::Connection(_))
    }
}

/// Validation error builder
#[derive(Debug, Default)]
pub struct ValidationErrors {
    errors: std::collections::HashMap<String, Vec<String>>,
}

impl ValidationErrors {
    /// Create new validation errors
    pub fn new() -> Self {
        Self::default()
    }

    /// Add an error for a field
    pub fn add(&mut self, field: &str, message: impl Into<String>) {
        self.errors
            .entry(field.to_string())
            .or_default()
            .push(message.into());
    }

    /// Check if there are any errors
    pub fn is_empty(&self) -> bool {
        self.errors.is_empty()
    }

    /// Get errors for a field
    pub fn get(&self, field: &str) -> Option<&Vec<String>> {
        self.errors.get(field)
    }

    /// Convert to OrmError if there are errors
    pub fn into_result<T>(self, value: T) -> OrmResult<T> {
        if self.is_empty() {
            Ok(value)
        } else {
            Err(OrmError::Validation(format!("{:?}", self.errors)))
        }
    }

    /// Get all errors
    pub fn all(&self) -> &std::collections::HashMap<String, Vec<String>> {
        &self.errors
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let err = OrmError::NotFound;
        assert_eq!(err.to_string(), "Entity not found");

        let err = OrmError::Connection("connection refused".to_string());
        assert!(err.to_string().contains("connection refused"));
    }

    #[test]
    fn test_error_status_codes() {
        assert_eq!(OrmError::NotFound.status_code(), 404);
        assert_eq!(OrmError::Validation("".to_string()).status_code(), 422);
        assert_eq!(OrmError::Connection("".to_string()).status_code(), 503);
    }

    #[test]
    fn test_option_ext() {
        let some: Option<i32> = Some(42);
        assert_eq!(some.ok_or_not_found().unwrap(), 42);

        let none: Option<i32> = None;
        assert!(matches!(none.ok_or_not_found(), Err(OrmError::NotFound)));
    }

    #[test]
    fn test_validation_errors() {
        let mut errors = ValidationErrors::new();
        assert!(errors.is_empty());

        errors.add("email", "Invalid email");
        errors.add("password", "Too short");

        assert!(!errors.is_empty());
        assert!(errors.get("email").is_some());
    }
}
