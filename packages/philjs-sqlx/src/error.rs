//! Error types for PhilJS SQLx integration

use std::fmt;

/// Database error type
#[derive(Debug)]
pub enum DbError {
    /// Connection error
    Connection(String),
    /// Query execution error
    Query(String),
    /// Transaction error
    Transaction(String),
    /// Row not found
    NotFound,
    /// Multiple rows found (expected one)
    MultipleRows,
    /// Constraint violation
    Constraint(String),
    /// Serialization error
    Serialization(String),
    /// Context error (pool not available)
    Context(String),
    /// Migration error
    Migration(String),
    /// Timeout error
    Timeout,
    /// Pool exhausted
    PoolExhausted,
    /// Unknown error
    Unknown(String),
}

impl fmt::Display for DbError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DbError::Connection(msg) => write!(f, "Connection error: {}", msg),
            DbError::Query(msg) => write!(f, "Query error: {}", msg),
            DbError::Transaction(msg) => write!(f, "Transaction error: {}", msg),
            DbError::NotFound => write!(f, "Row not found"),
            DbError::MultipleRows => write!(f, "Multiple rows found, expected one"),
            DbError::Constraint(msg) => write!(f, "Constraint violation: {}", msg),
            DbError::Serialization(msg) => write!(f, "Serialization error: {}", msg),
            DbError::Context(msg) => write!(f, "Context error: {}", msg),
            DbError::Migration(msg) => write!(f, "Migration error: {}", msg),
            DbError::Timeout => write!(f, "Database operation timed out"),
            DbError::PoolExhausted => write!(f, "Connection pool exhausted"),
            DbError::Unknown(msg) => write!(f, "Unknown error: {}", msg),
        }
    }
}

impl std::error::Error for DbError {}

/// Result type alias for database operations
pub type DbResult<T> = Result<T, DbError>;

impl From<sqlx::Error> for DbError {
    fn from(err: sqlx::Error) -> Self {
        match err {
            sqlx::Error::RowNotFound => DbError::NotFound,
            sqlx::Error::PoolTimedOut => DbError::Timeout,
            sqlx::Error::PoolClosed => DbError::PoolExhausted,
            sqlx::Error::Database(db_err) => {
                // Check for constraint violations
                if let Some(code) = db_err.code() {
                    let code_str = code.to_string();
                    // PostgreSQL constraint violation codes
                    if code_str.starts_with("23") {
                        return DbError::Constraint(db_err.message().to_string());
                    }
                }
                DbError::Query(db_err.message().to_string())
            }
            sqlx::Error::Io(io_err) => DbError::Connection(io_err.to_string()),
            sqlx::Error::Configuration(msg) => DbError::Connection(msg.to_string()),
            _ => DbError::Unknown(err.to_string()),
        }
    }
}

impl From<serde_json::Error> for DbError {
    fn from(err: serde_json::Error) -> Self {
        DbError::Serialization(err.to_string())
    }
}

/// Extension trait for converting Option<T> to DbResult<T>
pub trait OptionExt<T> {
    /// Convert None to DbError::NotFound
    fn ok_or_not_found(self) -> DbResult<T>;

    /// Convert None to a custom error
    fn ok_or_db_error(self, error: DbError) -> DbResult<T>;
}

impl<T> OptionExt<T> for Option<T> {
    fn ok_or_not_found(self) -> DbResult<T> {
        self.ok_or(DbError::NotFound)
    }

    fn ok_or_db_error(self, error: DbError) -> DbResult<T> {
        self.ok_or(error)
    }
}

/// Extension trait for adding context to database errors
pub trait DbErrorContext<T> {
    /// Add context to a database error
    fn context(self, msg: impl Into<String>) -> DbResult<T>;

    /// Add context with a closure
    fn with_context<F, S>(self, f: F) -> DbResult<T>
    where
        F: FnOnce() -> S,
        S: Into<String>;
}

impl<T> DbErrorContext<T> for DbResult<T> {
    fn context(self, msg: impl Into<String>) -> DbResult<T> {
        self.map_err(|e| DbError::Unknown(format!("{}: {}", msg.into(), e)))
    }

    fn with_context<F, S>(self, f: F) -> DbResult<T>
    where
        F: FnOnce() -> S,
        S: Into<String>,
    {
        self.map_err(|e| DbError::Unknown(format!("{}: {}", f().into(), e)))
    }
}

/// Convert DbError to HTTP status code (for web frameworks)
impl DbError {
    /// Get the corresponding HTTP status code
    pub fn status_code(&self) -> u16 {
        match self {
            DbError::NotFound => 404,
            DbError::Constraint(_) => 409, // Conflict
            DbError::Serialization(_) => 400, // Bad Request
            DbError::Timeout => 504, // Gateway Timeout
            DbError::PoolExhausted => 503, // Service Unavailable
            _ => 500, // Internal Server Error
        }
    }

    /// Check if this is a retryable error
    pub fn is_retryable(&self) -> bool {
        matches!(
            self,
            DbError::Timeout | DbError::PoolExhausted | DbError::Connection(_)
        )
    }

    /// Check if this is a client error (4xx)
    pub fn is_client_error(&self) -> bool {
        matches!(self.status_code(), 400..=499)
    }

    /// Check if this is a server error (5xx)
    pub fn is_server_error(&self) -> bool {
        matches!(self.status_code(), 500..=599)
    }
}

/// Retry configuration for database operations
#[derive(Clone, Debug)]
pub struct RetryConfig {
    /// Maximum number of retries
    pub max_retries: u32,
    /// Initial delay between retries
    pub initial_delay_ms: u64,
    /// Maximum delay between retries
    pub max_delay_ms: u64,
    /// Multiplier for exponential backoff
    pub backoff_multiplier: f64,
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            max_retries: 3,
            initial_delay_ms: 100,
            max_delay_ms: 5000,
            backoff_multiplier: 2.0,
        }
    }
}

impl RetryConfig {
    /// Create a new retry configuration
    pub fn new() -> Self {
        Self::default()
    }

    /// Set maximum retries
    pub fn max_retries(mut self, max: u32) -> Self {
        self.max_retries = max;
        self
    }

    /// Set initial delay
    pub fn initial_delay_ms(mut self, ms: u64) -> Self {
        self.initial_delay_ms = ms;
        self
    }

    /// Set maximum delay
    pub fn max_delay_ms(mut self, ms: u64) -> Self {
        self.max_delay_ms = ms;
        self
    }

    /// Calculate delay for a given attempt
    pub fn delay_for_attempt(&self, attempt: u32) -> u64 {
        let delay = (self.initial_delay_ms as f64)
            * self.backoff_multiplier.powi(attempt as i32);
        (delay as u64).min(self.max_delay_ms)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let err = DbError::NotFound;
        assert_eq!(err.to_string(), "Row not found");

        let err = DbError::Connection("connection refused".to_string());
        assert!(err.to_string().contains("connection refused"));
    }

    #[test]
    fn test_error_status_codes() {
        assert_eq!(DbError::NotFound.status_code(), 404);
        assert_eq!(DbError::Timeout.status_code(), 504);
        assert_eq!(DbError::PoolExhausted.status_code(), 503);
    }

    #[test]
    fn test_error_retryable() {
        assert!(DbError::Timeout.is_retryable());
        assert!(DbError::PoolExhausted.is_retryable());
        assert!(!DbError::NotFound.is_retryable());
    }

    #[test]
    fn test_option_ext() {
        let some: Option<i32> = Some(42);
        assert_eq!(some.ok_or_not_found().unwrap(), 42);

        let none: Option<i32> = None;
        assert!(matches!(none.ok_or_not_found(), Err(DbError::NotFound)));
    }

    #[test]
    fn test_retry_config() {
        let config = RetryConfig::new();
        assert_eq!(config.delay_for_attempt(0), 100);
        assert_eq!(config.delay_for_attempt(1), 200);
        assert_eq!(config.delay_for_attempt(2), 400);
    }
}
