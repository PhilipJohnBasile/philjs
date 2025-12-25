//! Error types

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use thiserror::Error;

/// PhilJS error type
#[derive(Error, Debug)]
pub enum PhilJSError {
    /// Not found error
    #[error("Not found: {0}")]
    NotFound(String),

    /// Bad request error
    #[error("Bad request: {0}")]
    BadRequest(String),

    /// Unauthorized error
    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    /// Forbidden error
    #[error("Forbidden: {0}")]
    Forbidden(String),

    /// Internal server error
    #[error("Internal error: {0}")]
    Internal(String),

    /// Loader error
    #[error("Loader error: {0}")]
    LoaderError(String),

    /// Render error
    #[error("Render error: {0}")]
    RenderError(String),

    /// Serialization error
    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    /// IO error
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}

impl IntoResponse for PhilJSError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            PhilJSError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            PhilJSError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            PhilJSError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg.clone()),
            PhilJSError::Forbidden(msg) => (StatusCode::FORBIDDEN, msg.clone()),
            PhilJSError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            PhilJSError::LoaderError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            PhilJSError::RenderError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            PhilJSError::SerializationError(e) => {
                (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
            }
            PhilJSError::IoError(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
        };

        // Return HTML error page
        let html = format!(
            r#"<!DOCTYPE html>
<html>
<head><title>Error {}</title></head>
<body>
    <h1>Error {}</h1>
    <p>{}</p>
</body>
</html>"#,
            status.as_u16(),
            status.as_u16(),
            message
        );

        (
            status,
            [("content-type", "text/html")],
            html,
        )
            .into_response()
    }
}

/// Result type alias
pub type Result<T> = std::result::Result<T, PhilJSError>;
