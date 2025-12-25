//! Error types for PhilJS Rocket integration

use rocket::http::Status;
use rocket::response::{Responder, Response};
use rocket::request::Request;
use std::io::Cursor;
use std::fmt;

/// PhilJS Rocket error type
#[derive(Debug)]
pub enum PhilJsError {
    /// Internal server error
    Internal(String),
    /// Not found error
    NotFound(String),
    /// Bad request error
    BadRequest(String),
    /// Unauthorized error
    Unauthorized(String),
    /// Forbidden error
    Forbidden(String),
    /// Validation error
    Validation(ValidationErrors),
    /// Serialization error
    Serialization(String),
    /// Render error
    Render(String),
    /// WebSocket error
    WebSocket(String),
    /// Session error
    Session(String),
    /// Custom error with status code
    Custom {
        status: Status,
        message: String,
    },
}

impl fmt::Display for PhilJsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PhilJsError::Internal(msg) => write!(f, "Internal error: {}", msg),
            PhilJsError::NotFound(msg) => write!(f, "Not found: {}", msg),
            PhilJsError::BadRequest(msg) => write!(f, "Bad request: {}", msg),
            PhilJsError::Unauthorized(msg) => write!(f, "Unauthorized: {}", msg),
            PhilJsError::Forbidden(msg) => write!(f, "Forbidden: {}", msg),
            PhilJsError::Validation(errors) => write!(f, "Validation errors: {:?}", errors),
            PhilJsError::Serialization(msg) => write!(f, "Serialization error: {}", msg),
            PhilJsError::Render(msg) => write!(f, "Render error: {}", msg),
            PhilJsError::WebSocket(msg) => write!(f, "WebSocket error: {}", msg),
            PhilJsError::Session(msg) => write!(f, "Session error: {}", msg),
            PhilJsError::Custom { message, .. } => write!(f, "{}", message),
        }
    }
}

impl std::error::Error for PhilJsError {}

impl PhilJsError {
    /// Get the HTTP status code for this error
    pub fn status(&self) -> Status {
        match self {
            PhilJsError::Internal(_) => Status::InternalServerError,
            PhilJsError::NotFound(_) => Status::NotFound,
            PhilJsError::BadRequest(_) => Status::BadRequest,
            PhilJsError::Unauthorized(_) => Status::Unauthorized,
            PhilJsError::Forbidden(_) => Status::Forbidden,
            PhilJsError::Validation(_) => Status::UnprocessableEntity,
            PhilJsError::Serialization(_) => Status::InternalServerError,
            PhilJsError::Render(_) => Status::InternalServerError,
            PhilJsError::WebSocket(_) => Status::InternalServerError,
            PhilJsError::Session(_) => Status::InternalServerError,
            PhilJsError::Custom { status, .. } => *status,
        }
    }

    /// Create an internal error
    pub fn internal(msg: impl Into<String>) -> Self {
        PhilJsError::Internal(msg.into())
    }

    /// Create a not found error
    pub fn not_found(msg: impl Into<String>) -> Self {
        PhilJsError::NotFound(msg.into())
    }

    /// Create a bad request error
    pub fn bad_request(msg: impl Into<String>) -> Self {
        PhilJsError::BadRequest(msg.into())
    }

    /// Create an unauthorized error
    pub fn unauthorized(msg: impl Into<String>) -> Self {
        PhilJsError::Unauthorized(msg.into())
    }

    /// Create a forbidden error
    pub fn forbidden(msg: impl Into<String>) -> Self {
        PhilJsError::Forbidden(msg.into())
    }

    /// Create a validation error
    pub fn validation(errors: ValidationErrors) -> Self {
        PhilJsError::Validation(errors)
    }

    /// Create a custom error
    pub fn custom(status: Status, msg: impl Into<String>) -> Self {
        PhilJsError::Custom {
            status,
            message: msg.into(),
        }
    }

    /// Get error details for response
    fn details(&self) -> Option<serde_json::Value> {
        match self {
            PhilJsError::Validation(errors) => serde_json::to_value(errors).ok(),
            _ => None,
        }
    }
}

impl<'r> Responder<'r, 'static> for PhilJsError {
    fn respond_to(self, _request: &'r Request<'_>) -> rocket::response::Result<'static> {
        let status = self.status();
        let error_body = ErrorResponse {
            error: self.to_string(),
            status: status.code,
            details: self.details(),
        };

        let json = serde_json::to_string(&error_body).unwrap_or_else(|_| {
            format!(r#"{{"error":"{}","status":{}}}"#, self.to_string(), status.code)
        });

        Response::build()
            .status(status)
            .header(rocket::http::ContentType::JSON)
            .sized_body(json.len(), Cursor::new(json))
            .ok()
    }
}

/// Validation errors container
#[derive(Debug, Clone, Default, serde::Serialize, serde::Deserialize)]
pub struct ValidationErrors {
    /// Field errors
    pub errors: std::collections::HashMap<String, Vec<String>>,
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

    /// Convert to PhilJsError if there are errors
    pub fn into_result<T>(self, value: T) -> Result<T, PhilJsError> {
        if self.is_empty() {
            Ok(value)
        } else {
            Err(PhilJsError::Validation(self))
        }
    }
}

/// Error response body
#[derive(serde::Serialize)]
struct ErrorResponse {
    /// Error message
    error: String,
    /// HTTP status code
    status: u16,
    /// Additional details
    #[serde(skip_serializing_if = "Option::is_none")]
    details: Option<serde_json::Value>,
}

/// Result type alias for PhilJS operations
pub type PhilJsResult<T> = Result<T, PhilJsError>;

// Conversions from other error types

impl From<serde_json::Error> for PhilJsError {
    fn from(err: serde_json::Error) -> Self {
        PhilJsError::Serialization(err.to_string())
    }
}

impl From<std::io::Error> for PhilJsError {
    fn from(err: std::io::Error) -> Self {
        PhilJsError::Internal(err.to_string())
    }
}

impl From<anyhow::Error> for PhilJsError {
    fn from(err: anyhow::Error) -> Self {
        PhilJsError::Internal(err.to_string())
    }
}

/// Extension trait for adding context to errors
pub trait ErrorContext<T> {
    /// Add context to an error
    fn context(self, msg: impl Into<String>) -> PhilJsResult<T>;

    /// Add context with a closure
    fn with_context<F, S>(self, f: F) -> PhilJsResult<T>
    where
        F: FnOnce() -> S,
        S: Into<String>;
}

impl<T, E: std::error::Error> ErrorContext<T> for Result<T, E> {
    fn context(self, msg: impl Into<String>) -> PhilJsResult<T> {
        self.map_err(|e| PhilJsError::Internal(format!("{}: {}", msg.into(), e)))
    }

    fn with_context<F, S>(self, f: F) -> PhilJsResult<T>
    where
        F: FnOnce() -> S,
        S: Into<String>,
    {
        self.map_err(|e| PhilJsError::Internal(format!("{}: {}", f().into(), e)))
    }
}

impl<T> ErrorContext<T> for Option<T> {
    fn context(self, msg: impl Into<String>) -> PhilJsResult<T> {
        self.ok_or_else(|| PhilJsError::NotFound(msg.into()))
    }

    fn with_context<F, S>(self, f: F) -> PhilJsResult<T>
    where
        F: FnOnce() -> S,
        S: Into<String>,
    {
        self.ok_or_else(|| PhilJsError::NotFound(f().into()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_creation() {
        let err = PhilJsError::not_found("Resource not found");
        assert_eq!(err.status(), Status::NotFound);
        assert!(err.to_string().contains("not found"));
    }

    #[test]
    fn test_validation_errors() {
        let mut errors = ValidationErrors::new();
        assert!(errors.is_empty());

        errors.add("email", "Invalid email format");
        errors.add("password", "Too short");

        assert!(!errors.is_empty());
        assert!(errors.get("email").is_some());
        assert!(errors.get("unknown").is_none());
    }

    #[test]
    fn test_option_context() {
        let none: Option<i32> = None;
        let result = none.context("Value not found");
        assert!(matches!(result, Err(PhilJsError::NotFound(_))));
    }
}
